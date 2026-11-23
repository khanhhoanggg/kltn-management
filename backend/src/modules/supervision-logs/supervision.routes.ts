import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { validate } from "../../middleware/validate.js";
import {
  createLogSchema,
  updateLogSchema,
  confirmLogSchema,
  submitWeeklyReportSchema,
} from "./supervision.schema.js";
import * as controller from "./supervision.controller.js";

const router = Router();

// Lấy danh sách nhật ký theo đề tài
router.get(
  "/thesis/:thesisId",
  authenticate,
  controller.getLogsByThesis,
);

// Sinh viên gửi báo cáo tiến độ tuần cho GVHD
router.post(
  "/thesis/:thesisId/weekly-report",
  authenticate,
  authorize("SINH_VIEN"),
  validate(submitWeeklyReportSchema),
  controller.submitWeeklyReport,
);

// Xem chi tiết 1 nhật ký
router.get(
  "/:id",
  authenticate,
  controller.getLogDetail,
);

// GVHD tạo nhật ký hướng dẫn
router.post(
  "/",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  validate(createLogSchema),
  controller.createLog,
);

// GVHD sửa nhật ký
router.put(
  "/:id",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  validate(updateLogSchema),
  controller.updateLog,
);

// Sinh viên xác nhận nhật ký
router.patch(
  "/:id/confirm",
  authenticate,
  authorize("SINH_VIEN"),
  validate(confirmLogSchema),
  controller.confirmLog,
);

// Xóa nhật ký
router.delete(
  "/:id",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.removeLog,
);

export default router;
