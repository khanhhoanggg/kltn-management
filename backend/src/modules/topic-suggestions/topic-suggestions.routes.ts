import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./topic-suggestions.controller.js";

const router = Router();

// Xem danh sách đề tài gợi ý công khai (Sinh viên, Giảng viên, Giáo vụ đều xem được - UC-11)
router.get("/", authenticate, controller.getAll);

// GVHD đăng đề tài gợi ý
router.post(
  "/",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.create,
);

// GVHD sửa đề tài gợi ý
router.put(
  "/:id",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.update,
);

// GVHD xóa đề tài gợi ý
router.delete(
  "/:id",
  authenticate,
  authorize("GVHD", "ADMIN", "GIAO_VU"),
  controller.remove,
);

export default router;
