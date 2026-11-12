import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
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

// Tạo / sửa / xóa: Admin, Giáo vụ
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.create,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.update,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.remove,
);

export default router;