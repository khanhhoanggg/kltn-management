import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./submission.service.js";

async function getStudentIdOfUser(userId: number) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

/** SV nộp hồ sơ bảo vệ trực tuyến (UC-22) */
export async function submit(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const studentId = await getStudentIdOfUser(req.user.userId);
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên mới được nộp hồ sơ bảo vệ",
      });
    }

    const thesisId = Number(req.params.thesisId);
    const { reportFileUrl, sourceCodeUrl, plagiarismRate, plagiarismFileUrl } =
      req.body;

    if (!reportFileUrl || !sourceCodeUrl || plagiarismRate === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "reportFileUrl, sourceCodeUrl và plagiarismRate là các trường bắt buộc",
      });
    }

    const data = await service.submitDefense(thesisId, studentId, {
      thesisId,
      reportFileUrl,
      sourceCodeUrl,
      plagiarismRate: Number(plagiarismRate),
      plagiarismFileUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Nộp hồ sơ bảo vệ thành công. Đang chờ GVHD và Khoa phê duyệt.",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi nộp hồ sơ bảo vệ";
    return res.status(400).json({ success: false, message });
  }
}

/** GVHD xác nhận hồ sơ và lập BM-05 (UC-23) */
export async function evaluateBySupervisor(req: AuthRequest, res: Response) {
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
        message: "Chỉ GVHD mới được đánh giá hồ sơ bảo vệ",
      });
    }

    const thesisId = Number(req.params.thesisId);
    const { supervisorScore, supervisorComments, supervisorDecision } = req.body;

    if (
      supervisorScore === undefined ||
      !supervisorDecision ||
      !["CHO_BAO_VE", "KHONG_CHO_BAO_VE"].includes(supervisorDecision)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "supervisorScore (0-10) và supervisorDecision (CHO_BAO_VE|KHONG_CHO_BAO_VE) là bắt buộc",
      });
    }

    const data = await service.supervisorEvaluate(thesisId, lecturerId, {
      supervisorScore: Number(supervisorScore),
      supervisorComments,
      supervisorDecision,
    });

    return res.json({
      success: true,
      message: "GVHD đã hoàn tất đánh giá hồ sơ bảo vệ (BM-05)",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh giá hồ sơ bảo vệ";
    return res.status(400).json({ success: false, message });
  }
}

/** Giáo vụ ghi nhận bản cứng, kiểm tra đạo văn và phê duyệt (UC-24, UC-25) */
export async function reviewByFaculty(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const { hardCopyReceived, facultyApprovalStatus, facultyNote } = req.body;

    if (
      typeof hardCopyReceived !== "boolean" ||
      !facultyApprovalStatus ||
      !["DA_DUYET", "YEU_CAU_CHINH_SUA", "BI_LOAI"].includes(facultyApprovalStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "hardCopyReceived (boolean) và facultyApprovalStatus (DA_DUYET|YEU_CAU_CHINH_SUA|BI_LOAI) là bắt buộc",
      });
    }

    const data = await service.facultyReview(thesisId, {
      hardCopyReceived,
      facultyApprovalStatus,
      facultyNote,
    });

    return res.json({
      success: true,
      message:
        facultyApprovalStatus === "DA_DUYET"
          ? "Đã duyệt hồ sơ bảo vệ thành công. Sẵn sàng phân công phản biện."
          : facultyApprovalStatus === "YEU_CAU_CHINH_SUA"
            ? "Đã trả lại hồ sơ yêu cầu sinh viên chỉnh sửa."
            : "Đã loại hồ sơ khỏi đợt bảo vệ.",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xét duyệt hồ sơ bảo vệ";
    return res.status(400).json({ success: false, message });
  }
}

/** Xem hồ sơ bảo vệ của 1 đề tài */
export async function getByThesis(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const data = await service.getSubmissionByThesisId(thesisId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Chưa có hồ sơ bảo vệ cho đề tài này",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin hồ sơ bảo vệ";
    return res.status(500).json({ success: false, message });
  }
}

/** Lấy danh sách toàn bộ hồ sơ bảo vệ cho Giáo vụ/Admin */
export async function getAll(req: AuthRequest, res: Response) {
  try {
    const { semesterId, approvalStatus } = req.query;
    const data = await service.getAllSubmissions({
      semesterId: semesterId ? Number(semesterId) : undefined,
      approvalStatus: approvalStatus as string | undefined,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách hồ sơ bảo vệ";
    return res.status(500).json({ success: false, message });
  }
}
