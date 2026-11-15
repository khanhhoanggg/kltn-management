import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./reviewer.service.js";

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

/** Giáo vụ phân công GVPB (UC-26) */
export async function assign(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const { reviewerId } = req.body;

    if (!reviewerId) {
      return res.status(400).json({
        success: false,
        message: "reviewerId là bắt buộc",
      });
    }

    const data = await service.assignReviewer(thesisId, {
      reviewerId: Number(reviewerId),
    });

    return res.json({
      success: true,
      message: "Phân công Giảng viên phản biện thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi phân công phản biện";
    return res.status(400).json({ success: false, message });
  }
}

/** GVPB đánh giá BM-06 (UC-28) */
export async function evaluate(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const roles = req.user.roles;
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    if (!isStaff && lecturerId === null) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới được đánh giá phản biện",
      });
    }

    const thesisId = Number(req.params.thesisId);
    const { preliminaryNotes, detailedReview, decision, reviewerScore } = req.body;

    if (
      !detailedReview ||
      !decision ||
      !["CHO_BAO_VE", "KHONG_CHO_BAO_VE"].includes(decision) ||
      reviewerScore === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "detailedReview, decision (CHO_BAO_VE|KHONG_CHO_BAO_VE) và reviewerScore (0-10) là bắt buộc",
      });
    }

    const data = await service.evaluateByReviewer(thesisId, lecturerId, {
      preliminaryNotes,
      detailedReview,
      decision,
      reviewerScore: Number(reviewerScore),
    });

    return res.json({
      success: true,
      message:
        decision === "CHO_BAO_VE"
          ? "Đã hoàn thành đánh giá phản biện: Sinh viên ĐỦ ĐIỀU KIỆN bảo vệ trước Hội đồng."
          : "Đã hoàn thành đánh giá phản biện: Sinh viên KHÔNG ĐƯỢC bảo vệ.",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh giá phản biện";
    return res.status(400).json({ success: false, message });
  }
}

/** Lấy danh sách đề tài phân công phản biện cho GVPB đang đăng nhập */
export async function getMyReviewAssignments(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const lecturerId = await getLecturerIdOfUser(req.user.userId);
    if (!lecturerId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới có danh sách phân công phản biện",
      });
    }

    const data = await service.getAssignmentsByReviewer(lecturerId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách phản biện";
    return res.status(500).json({ success: false, message });
  }
}

/** Xem thông tin phản biện của 1 đề tài */
export async function getByThesis(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const data = await service.getReviewerAssignmentByThesisId(thesisId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Đề tài chưa có thông tin phân công phản biện",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin phản biện";
    return res.status(500).json({ success: false, message });
  }
}
