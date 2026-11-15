import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./evaluation.controller.js";

const router = Router();

// ==================== GIỮA KỲ (BM-03) ====================
// SV nộp báo cáo giữa kỳ
router.post(
  "/:thesisId/midterm/submit",
  authenticate,
  authorize("SINH_VIEN"),
  controller.submitMidterm,
);

// GVHD đánh giá tiến độ giữa kỳ
router.post(
  "/:thesisId/midterm/evaluate",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.evaluateMidterm,
);

// Xem kết quả giữa kỳ
router.get(
  "/:thesisId/midterm",
  authenticate,
  controller.getMidterm,
);

// ==================== CHECKPOINT DEMO (BM-03) ====================
// Đặt lịch demo
router.post(
  "/:thesisId/checkpoint/schedule",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.scheduleDemo,
);

// GVHD đánh giá demo
router.post(
  "/:thesisId/checkpoint/evaluate",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.evaluateDemo,
);

// Xem kết quả demo
router.get(
  "/:thesisId/checkpoint",
  authenticate,
  controller.getDemo,
);

export default router;
