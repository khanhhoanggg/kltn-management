import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./supervision.service.js";

async function getStudentIdOfUser(userId: number) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

export async function getLogsByThesis(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const data = await service.getLogsByThesisId(thesisId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy nhật ký hướng dẫn";
    return res.status(500).json({ success: false, message });
  }
}

export async function getLogDetail(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await service.getLogById(id);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhật ký" });
    }
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin nhật ký";
    return res.status(500).json({ success: false, message });
  }
}

export async function createLog(req: AuthRequest, res: Response) {
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
        message: "Chỉ giảng viên mới được tạo nhật ký hướng dẫn",
      });
    }

    const { thesisId, meetingDate, content, tasksAssigned, progressPercentage } =
      req.body;

    if (!thesisId || !meetingDate || !content) {
      return res.status(400).json({
        success: false,
        message: "thesisId, meetingDate và content là bắt buộc",
      });
    }

    const data = await service.createLog(
      {
        thesisId: Number(thesisId),
        meetingDate,
        content,
        tasksAssigned,
        progressPercentage:
          progressPercentage !== undefined ? Number(progressPercentage) : undefined,
      },
      lecturerId,
    );

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo nhật ký hướng dẫn";
    return res.status(400).json({ success: false, message });
  }
}

export async function updateLog(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    const roles = req.user.roles;
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    const data = await service.updateLog(id, req.body, lecturerId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật nhật ký";
    return res.status(400).json({ success: false, message });
  }
}

export async function confirmLog(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const studentId = await getStudentIdOfUser(req.user.userId);
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên mới được xác nhận nhật ký hướng dẫn",
      });
    }

    const id = Number(req.params.id);
    const data = await service.confirmLogByStudent(id, studentId, req.body);
    return res.json({
      success: true,
      message: "Đã xác nhận nhật ký hướng dẫn",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xác nhận nhật ký";
    return res.status(400).json({ success: false, message });
  }
}

export async function removeLog(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    const roles = req.user.roles;
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    await service.deleteLog(id, lecturerId);
    return res.json({ success: true, message: "Đã xóa nhật ký" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa nhật ký";
    return res.status(400).json({ success: false, message });
  }
}
