import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./dashboard.controller.js";

const router = Router();

// Xem thống kê dashboard (Admin, Giáo vụ, Lãnh đạo, GVHD)
router.get(
  "/stats",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO", "GVHD"),
  controller.getStats,
);

// Xuất danh sách KLTN ra Excel (Admin, Giáo vụ, Lãnh đạo)
router.get(
  "/export",
  authenticate,
  authorize("ADMIN", "GIAO_VU", "LANH_DAO"),
  controller.exportExcel,
);

export default router;
