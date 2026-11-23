import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { validate } from "../../middleware/validate.js";
import { createFieldSchema, updateFieldSchema } from "./fields.schema.js";
import * as controller from "./fields.controller.js";

const router = Router();

// Ai đăng nhập cũng xem được
router.get("/", authenticate, controller.getAll);
router.get("/active", authenticate, controller.getActive);
router.get("/:id", authenticate, controller.getById);

// Chỉ Admin / Giáo vụ mới tạo-sửa-xóa
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  validate(createFieldSchema),
  controller.create,
);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  validate(updateFieldSchema),
  controller.update,
);
router.delete("/:id", authenticate, authorize("ADMIN", "GIAO_VU"), controller.remove);

export default router;