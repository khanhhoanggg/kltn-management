import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./topic-suggestions.service.js";

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

export async function getAll(req: AuthRequest, res: Response) {
  try {
    const { fieldId, semesterId, lecturerId } = req.query;

    const data = await service.getAllSuggestions({
      fieldId: fieldId ? Number(fieldId) : undefined,
      semesterId: semesterId ? Number(semesterId) : undefined,
      lecturerId: lecturerId ? Number(lecturerId) : undefined,
      isPublishedOnly: true, // SV xem danh sách đề tài đã công bố
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách đề tài gợi ý";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const lecturerId = await getLecturerIdOfUser(req.user.userId);
    if (!lecturerId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới được đăng đề tài gợi ý",
      });
    }

    const { title, description, fieldId, semesterId, maxSlots, isPublished } =
      req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "title là bắt buộc",
      });
    }

    const data = await service.createSuggestion(lecturerId, {
      title,
      description,
      fieldId: fieldId ? Number(fieldId) : undefined,
      semesterId: semesterId ? Number(semesterId) : undefined,
      maxSlots: maxSlots ? Number(maxSlots) : undefined,
      isPublished,
    });

    return res.status(201).json({
      success: true,
      message: "Đăng đề tài gợi ý thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đăng đề tài gợi ý";
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
    const isStaff = roles.includes("ADMIN") || roles.includes("GIAO_VU");
    const lecturerId = isStaff
      ? null
      : await getLecturerIdOfUser(req.user.userId);

    const data = await service.updateSuggestion(id, lecturerId, req.body);
    return res.json({
      success: true,
      message: "Cập nhật đề tài gợi ý thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật đề tài gợi ý";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
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

    await service.deleteSuggestion(id, lecturerId);
    return res.json({
      success: true,
      message: "Đã xóa đề tài gợi ý",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa đề tài gợi ý";
    return res.status(400).json({ success: false, message });
  }
}
