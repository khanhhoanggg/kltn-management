import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { validate } from "../../middleware/validate.js";
import {
  createChangeRequestSchema,
  reviewChangeRequestSchema,
} from "./change-request.schema.js";
import * as controller from "./change-request.controller.js";

const router = Router();

// Sinh viên gửi đơn thay đổi
router.post(
  "/",
  authenticate,
  authorize("SINH_VIEN"),
  validate(createChangeRequestSchema),
  controller.createRequest,
);

// Xem danh sách đơn (Admin, Giáo vụ, Lãnh đạo, GVHD)
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO", "GVHD"),
  controller.getAllRequests,
);

// Phê duyệt / từ chối đơn (Admin, Giáo vụ, Lãnh đạo)
router.patch(
  "/:id/review",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO"),
  validate(reviewChangeRequestSchema),
  controller.reviewRequest,
);

export default router;
