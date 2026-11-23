import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { validate } from "../../middleware/validate.js";
import { uploadMiddleware } from "../../middleware/upload.js";
import {
  createStudentSchema,
  updateStudentSchema,
} from "./students.schema.js";
import * as controller from "./students.controller.js";

const router = Router();

// Xem danh sách / chi tiết: Admin, Giáo vụ, Lãnh đạo
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO"),
  controller.getAll,
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO"),
  controller.getById,
);

// Nhập sinh viên từ Excel (UC-09): Admin, Giáo vụ
router.post(
  "/import-excel",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  uploadMiddleware.single("file"),
  controller.importExcel,
);

// Tạo / sửa / xóa: Admin, Giáo vụ
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  validate(createStudentSchema),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  validate(updateStudentSchema),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.remove,
);

export default router;
