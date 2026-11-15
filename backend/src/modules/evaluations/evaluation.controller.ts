import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./evaluation.service.js";

async function getStudentIdOfUser(userId: number) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

// ==================== GIỮA KỲ ====================

export async function submitMidterm(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const studentId = await getStudentIdOfUser(req.user.userId);
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên mới được nộp báo cáo giữa kỳ",
      });
    }

    const thesisId = Number(req.params.thesisId);
    const { reportFileUrl } = req.body;

    if (!reportFileUrl) {
      return res.status(400).json({
        success: false,
        message: "reportFileUrl là bắt buộc",
      });
    }

    const data = await service.submitMidtermReport(thesisId, studentId, {
      reportFileUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Nộp báo cáo giữa kỳ thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi nộp báo cáo giữa kỳ";
    return res.status(400).json({ success: false, message });
  }
}

export async function evaluateMidterm(req: AuthRequest, res: Response) {
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
        message: "Chỉ giảng viên hướng dẫn mới được đánh giá giữa kỳ",
      });
    }

    const thesisId = Number(req.params.thesisId);
    const { result, comments } = req.body;

    if (!result || !["DAT", "CANH_BAO", "KHONG_DAT"].includes(result)) {
      return res.status(400).json({
        success: false,
        message: "result phải là DAT, CANH_BAO hoặc KHONG_DAT",
      });
    }

    const data = await service.evaluateMidterm(thesisId, lecturerId, {
      result,
      comments,
    });

    return res.json({
      success: true,
      message: "Đánh giá tiến độ giữa kỳ thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh giá giữa kỳ";
    return res.status(400).json({ success: false, message });
  }
}

export async function getMidterm(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const data = await service.getMidtermEvaluation(thesisId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Chưa có thông tin đánh giá giữa kỳ",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin giữa kỳ";
    return res.status(500).json({ success: false, message });
  }
}

// ==================== CHECKPOINT DEMO ====================

export async function scheduleDemo(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const roles = req.user.roles;
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    const thesisId = Number(req.params.thesisId);
    const { demoDate, location } = req.body;

    if (!demoDate) {
      return res.status(400).json({
        success: false,
        message: "demoDate là bắt buộc",
      });
    }

    const data = await service.scheduleDemo(thesisId, lecturerId, {
      demoDate,
      location,
    });

    return res.json({
      success: true,
      message: "Đặt lịch demo thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đặt lịch demo";
    return res.status(400).json({ success: false, message });
  }
}

export async function evaluateDemo(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const roles = req.user.roles;
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    const thesisId = Number(req.params.thesisId);
    const { result, comments, canDefend, disqualifiedRecordUrl } = req.body;

    if (!result || typeof canDefend !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "result (DAT|CANH_BAO|KHONG_DAT) và canDefend (boolean) là bắt buộc",
      });
    }

    const data = await service.evaluateDemo(thesisId, lecturerId, {
      result,
      comments,
      canDefend,
      disqualifiedRecordUrl,
    });

    return res.json({
      success: true,
      message: canDefend
        ? "Đánh giá demo đạt yêu cầu"
        : "Đã ghi nhận kết quả không đủ điều kiện bảo vệ",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh giá demo";
    return res.status(400).json({ success: false, message });
  }
}

export async function getDemo(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const data = await service.getCheckpointDemo(thesisId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Chưa có thông tin đánh giá demo",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin demo";
    return res.status(500).json({ success: false, message });
  }
}
