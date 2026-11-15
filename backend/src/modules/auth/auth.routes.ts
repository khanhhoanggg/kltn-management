import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
  changePasswordController,
} from "./auth.controller.js";

const router = Router();

// Public routes
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// Authenticated routes
router.get("/me", authenticate, getMeController);
router.post("/change-password", authenticate, changePasswordController);

export default router;
