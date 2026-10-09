import User from "../models/User.js";
import Board from "../models/Board.js";
import Card from "../models/Card.js";
import { sendApprovalEmail, sendRejectionEmail } from "../services/emailService.js";

// GET /api/superadmin/users
export const getUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;

    const query = { isDeleted: { $ne: true } };

    if (status && status !== "all") {
      if (status === "approved") {
        query.status = { $in: ["approved", "active"] };
      } else {
        query.status = status;
      }
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(query)
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .select("-password")
      .sort({ createdAt: -1 });

    // Aggregate overall statistics
    const allUsers = await User.find({ isDeleted: { $ne: true } }, "role status");
    const stats = {
      total: allUsers.length,
      pending: allUsers.filter((u) => u.status === "pending").length,
      approved: allUsers.filter((u) => u.status === "approved" || u.status === "active").length,
      rejected: allUsers.filter((u) => u.status === "rejected").length,
      invited: allUsers.filter((u) => u.status === "invited").length,
      managers: allUsers.filter((u) => u.role === "admin").length,
      employees: allUsers.filter((u) => u.role === "member").length,
      superadmins: allUsers.filter((u) => u.role === "superadmin").length,
    };

    res.json({ users, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/superadmin/users/:id/approve
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = "approved";
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    user.rejectedAt = undefined;
    user.rejectedBy = undefined;
    user.rejectionReason = undefined;

    await user.save();

    // Send approval notification email
    try {
      await sendApprovalEmail({
        to: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (emailErr) {
      console.warn("Could not send approval email:", emailErr);
    }

    const populated = await User.findById(user._id)
      .populate("approvedBy", "name email")
      .select("-password");

    res.json({
      message: `${user.name} has been approved successfully.`,
      user: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/superadmin/users/:id/reject
export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "superadmin") {
      return res.status(400).json({ message: "Cannot reject a Super Admin account" });
    }

    user.status = "rejected";
    user.rejectedAt = new Date();
    user.rejectedBy = req.user._id;
    user.rejectionReason =
      reason?.trim() || "Account registration was not approved by the administrator.";
    user.approvedAt = undefined;
    user.approvedBy = undefined;

    await user.save();

    // Send rejection notification email
    try {
      await sendRejectionEmail({
        to: user.email,
        name: user.name,
        reason: user.rejectionReason,
      });
    } catch (emailErr) {
      console.warn("Could not send rejection email:", emailErr);
    }

    const populated = await User.findById(user._id)
      .populate("rejectedBy", "name email")
      .select("-password");

    res.json({
      message: `${user.name} has been rejected.`,
      user: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/superadmin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["superadmin", "admin", "member"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Role must be 'superadmin', 'admin', or 'member'.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent demoting the last superadmin
    if (user.role === "superadmin" && role !== "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot demote the sole remaining Super Administrator." });
      }
    }

    user.role = role;
    await user.save();

    const populated = await User.findById(user._id)
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .select("-password");

    res.json({
      message: `Role for ${user.name} updated to ${
        role === "admin" ? "Manager" : role === "member" ? "Employee" : "Super Admin"
      }.`,
      user: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/superadmin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "superadmin" && status !== "approved") {
      return res.status(400).json({ message: "Cannot suspend a Super Admin account" });
    }

    user.status = status;
    if (status === "approved") {
      user.approvedAt = new Date();
      user.approvedBy = req.user._id;
      user.rejectedAt = undefined;
      user.rejectionReason = undefined;
    } else if (status === "rejected") {
      user.rejectedAt = new Date();
      user.rejectedBy = req.user._id;
      user.rejectionReason = req.body.reason || "Account access suspended.";
    }

    await user.save();

    const populated = await User.findById(user._id)
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .select("-password");

    res.json({
      message: `Status for ${user.name} set to ${status}.`,
      user: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/superadmin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    if (user.role === "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the sole Super Administrator account." });
      }
    }

    // Scrub user references from boards and card assignments
    await Board.updateMany(
      { "members.user": req.params.id },
      { $pull: { members: { user: req.params.id } } }
    );
    await Card.updateMany(
      { assignees: req.params.id },
      { $pull: { assignees: req.params.id } }
    );

    // Soft delete only: never permanently delete any user record
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.status = "rejected";
    user.rejectionReason = "Account deactivated by Super Administrator.";
    await user.save();

    res.json({ message: `User ${user.name} has been deleted (soft deleted).` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
