import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./theses.controller.js";

const router = Router();

// Xem danh sách / chi tiết
router.get("/", authenticate, controller.getAll);
router.get("/:id", authenticate, controller.getById);

// SV đăng ký đề tài
router.post(
  "/",
  authenticate,
  authorize("SINH_VIEN"),
  controller.create,
);

// SV hoặc Giáo vụ/Admin cập nhật (trước khi khóa)
router.put(
  "/:id",
  authenticate,
  authorize("SINH_VIEN", "ADMIN", "GIAO_VU"),
  controller.update,
);

// Giáo vụ xét đủ điều kiện
router.patch(
  "/:id/eligibility",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.setEligibility,
);

// GVHD xác nhận đề tài + đề cương
router.patch(
  "/:id/confirm",
  authenticate,
  authorize("GVHD"),
  controller.confirmBySupervisor,
);

// Khoa ban hành quyết định giao đề tài + khóa
router.patch(
  "/:id/assign",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.assignByFaculty,
);

// Xóa (chỉ khi chưa khóa)
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.remove,
);

export default router;