import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import * as controller from "./council.controller.js";

const router = Router();

// Xem danh sách hội đồng (ai đăng nhập cũng xem được lịch bảo vệ UC-29)
router.get("/", authenticate, controller.getAllCouncils);
router.get("/:id", authenticate, controller.getCouncilById);

// Giáo vụ tạo / sửa hội đồng (UC-26)
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.createCouncil,
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.updateCouncil,
);

// Gán đề tài vào hội đồng / xếp lịch (UC-29)
router.post(
  "/:councilId/theses",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.assignThesis,
);

// Thành viên Hội đồng chấm điểm BM-07 (UC-30)
router.post(
  "/assignments/:assignmentId/scores",
  authenticate,
  authorize("THANH_VIEN_HD", "GVHD", "ADMIN", "GIAO_VU"),
  controller.scoreAssignment,
);

// Thư ký / Giáo vụ lập biên bản và tính điểm tổng kết (UC-30, UC-31)
router.patch(
  "/assignments/:assignmentId/finalize",
  authenticate,
  authorize("THU_KY_HD", "ADMIN", "GIAO_VU"),
  controller.finalizeMinute,
);

// Giáo vụ đóng hồ sơ cuối kỳ (UC-31)
router.patch(
  "/assignments/:assignmentId/close",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  controller.closeRecord,
);

export default router;
