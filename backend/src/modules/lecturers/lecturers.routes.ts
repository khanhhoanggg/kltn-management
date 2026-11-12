import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./lecturers.controller.js";

const router = Router();

// Xem: Admin, Giáo vụ, Lãnh đạo (SV cũng có thể xem danh sách GV công bố – tùy bạn mở rộng sau)
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