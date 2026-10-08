import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Board from "../models/Board.js";
import {
  sendInvitationEmail,
  sendActivationEmail,
  sendPasswordResetEmail,
  getSentEmails,
  clearSentEmails,
} from "../services/emailService.js";

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const AVATAR_COLORS = [
  "#EA580C", // Precision Orange
  "#0284C7", // Sky Blue
  "#0D9488", // Teal
  "#16A34A", // Emerald
  "#9333EA", // Purple
  "#E11D48", // Rose
  "#D97706", // Amber
  "#2563EB", // Royal Blue
];

const getRandomAvatarColor = () => {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const userRole = role === "admin" ? "admin" : "member";

    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      if (user.status === "active") {
        return res.status(400).json({ message: "Email already registered" });
      }
      // Re-registering unactivated user: update details and generate fresh activation token
      user.name = cleanName;
      user.role = userRole;
      user.status = "pending";
    } else {
      user = new User({
        name: cleanName,
        email: cleanEmail,
        role: userRole,
        status: "pending",
        avatarColor: getRandomAvatarColor(),
      });
    }

    const rawToken = user.generateActivationToken();
    await user.save();

    // Send account activation email with secure link to set password
    await sendActivationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
      role: user.role,
    });

    res.status(201).json({
      message:
        "Your account has been created successfully. Please check your email to activate your account and set your password.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "invited" || user.status === "pending" || !user.password) {
      return res.status(403).json({
        message:
          "This account has not been activated yet. Please check your email to activate your account and set your password.",
        status: user.status,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      user: user.toSafeObject(),
      token: signToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// GET /api/auth/users
export const listUsers = async (req, res) => {
  const users = await User.find().select("name email role status avatarColor createdAt");
  res.json(users);
};

// POST /api/auth/invite (Manager / Admin invites a member)
export const inviteMember = async (req, res) => {
  try {
    const { name, email, role, boardId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const memberRole = role === "admin" ? "admin" : "member";

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (user.status === "active") {
        return res.status(400).json({ message: "A user with this email already has an active account" });
      }
      // Re-inviting a pending user: update details and generate fresh token
      user.name = cleanName;
      user.role = memberRole;
      user.invitedBy = req.user._id;
    } else {
      // Create new invited user
      user = new User({
        name: cleanName,
        email: cleanEmail,
        role: memberRole,
        status: "invited",
        avatarColor: getRandomAvatarColor(),
        invitedBy: req.user._id,
      });
    }

    const rawToken = user.generateActivationToken();
    await user.save();

    // If boardId was specified, add user to board members
    if (boardId) {
      try {
        const board = await Board.findById(boardId);
        if (board) {
          const alreadyMember = board.members.some((m) => m.user.equals(user._id));
          if (!alreadyMember) {
            board.members.push({ user: user._id, role: memberRole === "admin" ? "manager" : "member" });
            await board.save();
          }
        }
      } catch (boardErr) {
        console.warn("Could not auto-add invited user to board:", boardErr);
      }
    }

    // Send invitation email
    await sendInvitationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
      inviterName: req.user.name,
      role: user.role,
    });

    res.status(201).json({
      message: "Invitation sent successfully",
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/verify-activation-token?token=...
export const verifyActivationToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Activation token is required", valid: false });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      activationToken: hashedToken,
      activationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This activation link is invalid, has expired, or has already been used.",
        valid: false,
      });
    }

    res.json({
      valid: true,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, valid: false });
  }
};

// POST /api/auth/activate { token, password }
export const activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Activation token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      activationToken: hashedToken,
      activationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This activation link is invalid, has expired, or has already been used.",
      });
    }

    // Activate user, hash password, and clear token
    user.password = password;
    user.status = "active";
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    await user.save();

    res.json({
      message: "Account activated successfully! You can now log in.",
      user: user.toSafeObject(),
      token: signToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password { email }
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return a positive message to prevent user enumeration
    if (!user) {
      return res.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    if (user.status === "invited" || user.status === "pending" || !user.password) {
      // Re-send activation email if user hasn't activated yet
      const rawToken = user.generateActivationToken();
      await user.save();

      if (user.status === "pending") {
        await sendActivationEmail({
          to: user.email,
          name: user.name,
          token: rawToken,
          role: user.role,
        });
      } else {
        await sendInvitationEmail({
          to: user.email,
          name: user.name,
          token: rawToken,
          inviterName: "Precise3DM Team",
          role: user.role,
        });
      }

      return res.json({
        message: "Your account is pending activation. We have sent an activation link to your email.",
      });
    }

    const rawToken = user.generateResetPasswordToken();
    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    res.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/verify-reset-token?token=...
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Reset token is required", valid: false });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid, has expired, or has already been used.",
        valid: false,
      });
    }

    res.json({
      valid: true,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, valid: false });
  }
};

// POST /api/auth/reset-password { token, password }
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid, has expired, or has already been used.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    res.json({
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/change-password (Protected) { currentPassword, newPassword }
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/test-emails (Dev / Test utility)
export const getTestEmailsEndpoint = (req, res) => {
  const emails = getSentEmails();
  res.json({ emails, count: emails.length });
};

// POST /api/auth/test-emails/clear (Dev / Test utility)
export const clearTestEmailsEndpoint = (req, res) => {
  clearSentEmails();
  res.json({ message: "Test emails log cleared" });
};
