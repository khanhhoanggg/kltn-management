import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as thesisService from "./theses.service.js";

async function getStudentIdOfUser(userId: number) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

export async function getAll(req: AuthRequest, res: Response) {
  try {
    const { semesterId, status, studentId, supervisorId, type } = req.query;

    const data = await thesisService.getAllTheses({
      semesterId: semesterId ? Number(semesterId) : undefined,
      status: status as string | undefined,
      studentId: studentId ? Number(studentId) : undefined,
      supervisorId: supervisorId ? Number(supervisorId) : undefined,
      type: type as string | undefined,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách hồ sơ";
    return res.status(500).json({ success: false, message });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await thesisService.getThesisById(id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hồ sơ" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy hồ sơ";
    return res.status(500).json({ success: false, message });
  }
}

/** SV tự đăng ký */
export async function create(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const studentId = await getStudentIdOfUser(req.user.userId);
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên mới được đăng ký đề tài",
      });
    }

    const { semesterId, type, title, description, fieldId, supervisorId, outlineUrl } =
      req.body;

    if (!semesterId || !type) {
      return res.status(400).json({
        success: false,
        message: "semesterId và type (KLTN|CDTN) là bắt buộc",
      });
    }

    if (!["KLTN", "CDTN"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type phải là KLTN hoặc CDTN",
      });
    }

    const data = await thesisService.createThesis(studentId, {
      semesterId: Number(semesterId),
      type,
      title,
      description,
      fieldId,
      supervisorId,
      outlineUrl,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đăng ký đề tài";
    return res.status(400).json({ success: false, message });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    const roles = req.user.roles;
    const isStaff =
      roles.includes("ADMIN") || roles.includes("GIAO_VU");

    const studentId = isStaff
      ? null
      : await getStudentIdOfUser(req.user.userId);

    if (!isStaff && studentId === null) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền sửa hồ sơ này",
      });
    }

    const data = await thesisService.updateThesis(id, studentId, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật hồ sơ";
    return res.status(400).json({ success: false, message });
  }
}

/** Giáo vụ set đủ điều kiện */
export async function setEligibility(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const { isEligible, eligibilityNote } = req.body;

    if (typeof isEligible !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isEligible (boolean) là bắt buộc",
      });
    }

    const data = await thesisService.setEligibility(id, {
      isEligible,
      eligibilityNote,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật điều kiện";
    return res.status(400).json({ success: false, message });
  }
}

/** GVHD xác nhận */
export async function confirmBySupervisor(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const lecturerId = await getLecturerIdOfUser(req.user.userId);
    if (!lecturerId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới được xác nhận đề tài",
      });
    }

    const id = Number(req.params.id);
    const { accepted, note } = req.body;

    if (typeof accepted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "accepted (boolean) là bắt buộc",
      });
    }

    const data = await thesisService.confirmBySupervisor(id, lecturerId, {
      accepted,
      note,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xác nhận đề tài";
    return res.status(400).json({ success: false, message });
  }
}

/** Khoa giao đề tài + khóa */
export async function assignByFaculty(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const { supervisorId, decisionCode, decisionDate } = req.body;

    if (!supervisorId || !decisionCode) {
      return res.status(400).json({
        success: false,
        message: "supervisorId và decisionCode là bắt buộc",
      });
    }

    const data = await thesisService.assignByFaculty(id, {
      supervisorId: Number(supervisorId),
      decisionCode,
      decisionDate,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi giao đề tài";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    await thesisService.deleteThesis(id);
    return res.json({ success: true, message: "Đã xóa hồ sơ" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa hồ sơ";
    return res.status(400).json({ success: false, message });
  }
}