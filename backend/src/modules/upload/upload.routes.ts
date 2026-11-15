import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { uploadMiddleware } from "../../middleware/upload.js";
import { uploadSingleFile } from "./upload.controller.js";

const router = Router();

// Endpoint upload 1 file (yêu cầu đăng nhập)
router.post(
  "/",
  authenticate,
  uploadMiddleware.single("file"),
  uploadSingleFile,
);

export default router;
