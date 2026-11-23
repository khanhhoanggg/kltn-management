import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/role.js";
import { validate } from "../../middleware/validate.js";
import {
  assignReviewerSchema,
  evaluateReviewerSchema,
} from "./reviewer.schema.js";
import * as controller from "./reviewer.controller.js";

const router = Router();

// GVPB xem danh sách các đề tài mình được phân công phản biện
router.get(
  "/my-assignments",
  authenticate,
  authorize("GVPB", "GVHD", "ADMIN", "GIAO_VU"),
  controller.getMyReviewAssignments,
);

// Xem thông tin phản biện của 1 đề tài
router.get(
  "/thesis/:thesisId",
  authenticate,
  controller.getByThesis,
);

// Giáo vụ phân công GVPB cho đề tài (UC-26)
router.post(
  "/thesis/:thesisId/assign",
  authenticate,
  authorize("ADMIN", "GIAO_VU"),
  validate(assignReviewerSchema),
  controller.assign,
);

// GVPB nhập đánh giá BM-06 (UC-28)
router.patch(
  "/thesis/:thesisId/evaluate",
  authenticate,
  authorize("GVPB", "GVHD", "ADMIN", "GIAO_VU"),
  validate(evaluateReviewerSchema),
  controller.evaluate,
);

export default router;
