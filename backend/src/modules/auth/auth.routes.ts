import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth.schema.js";
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
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", validate(refreshSchema), refreshController);
router.post("/logout", validate(logoutSchema), logoutController);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordController);

// Authenticated routes
router.get("/me", authenticate, getMeController);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePasswordController);

export default router;
