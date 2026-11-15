import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./supervision.controller.js";

const router = Router();

// Lấy danh sách nhật ký theo đề tài
router.get(
  "/thesis/:thesisId",
  authenticate,
  controller.getLogsByThesis,
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
  controller.createLog,
);

// GVHD sửa nhật ký
router.put(
  "/:id",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.updateLog,
);

// Sinh viên xác nhận nhật ký
router.patch(
  "/:id/confirm",
  authenticate,
  authorize("SINH_VIEN"),
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
