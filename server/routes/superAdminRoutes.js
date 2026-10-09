import express from "express";
import {
  getUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from "../controllers/superAdminController.js";
import { protect, superAdminOnly } from "../middleware/auth.js";

const router = express.Router();

// All Super Admin routes require authenticated session + superadmin role
router.use(protect, superAdminOnly);

router.get("/users", getUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
