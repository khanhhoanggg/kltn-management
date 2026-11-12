import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./notifications.controller.js";

const router = Router();

// User xem thông báo của mình
router.get("/", authenticate, controller.getMy);
router.get("/unread-count", authenticate, controller.getUnreadCount);

// Đánh dấu đã đọc
router.patch("/:id/read", authenticate, controller.markAsRead);
router.patch("/read-all", authenticate, controller.markAllAsRead);

// Xóa thông báo của mình
router.delete("/:id", authenticate, controller.remove);

// Admin / Giáo vụ tạo thông báo (1 người hoặc hàng loạt)
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.create,
);

router.post(
  "/bulk",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.createBulk,
);

export default router;