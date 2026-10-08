import express from "express";
import {
  register,
  login,
  getMe,
  listUsers,
  inviteMember,
  verifyActivationToken,
  activateAccount,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
  getTestEmailsEndpoint,
  clearTestEmailsEndpoint,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Base auth
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, listUsers);

// Member invitation & Account activation
router.post("/invite", protect, inviteMember);
router.get("/verify-activation-token", verifyActivationToken);
router.post("/activate", activateAccount);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

// Authenticated password change
router.post("/change-password", protect, changePassword);

// Automated test & debugging utilities
router.get("/test-emails", getTestEmailsEndpoint);
router.post("/test-emails/clear", clearTestEmailsEndpoint);

export default router;
