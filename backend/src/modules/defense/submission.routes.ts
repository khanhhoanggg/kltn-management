import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./submission.controller.js";

const router = Router();

// Xem danh sách toàn bộ hồ sơ (Giáo vụ, Admin, Lãnh đạo)
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO"),
  controller.getAll,
);

// Xem chi tiết hồ sơ bảo vệ của 1 đề tài
router.get(
  "/:thesisId",
  authenticate,
  controller.getByThesis,
);

// SV nộp hồ sơ bảo vệ trực tuyến (UC-22)
router.post(
  "/:thesisId/submit",
  authenticate,
  authorize("SINH_VIEN"),
  controller.submit,
);

// GVHD xác nhận hồ sơ và lập BM-05 (UC-23)
router.patch(
  "/:thesisId/supervisor-evaluate",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.evaluateBySupervisor,
);

// Giáo vụ ghi nhận bản cứng, kiểm tra đạo văn và phê duyệt (UC-24, UC-25)
router.patch(
  "/:thesisId/faculty-review",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.reviewByFaculty,
);

export default router;
