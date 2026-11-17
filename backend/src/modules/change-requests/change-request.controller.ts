import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./change-request.service.js";

async function getStudentIdOfUser(userId: number) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

export async function createRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const studentId = await getStudentIdOfUser(req.user.userId);
    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên mới được gửi đơn thay đổi đề tài/GVHD",
      });
    }

    const {
      thesisId,
      changeType,
      newTitle,
      newDescription,
      newSupervisorId,
      reason,
      fileUrl,
    } = req.body;

    const data = await service.createChangeRequest(
      req.user.userId,
      studentId,
      {
        thesisId: Number(thesisId),
        changeType,
        newTitle,
        newDescription,
        newSupervisorId: newSupervisorId ? Number(newSupervisorId) : undefined,
        reason,
        fileUrl,
      },
    );

    return res.status(201).json({
      success: true,
      message: "Gửi đơn thay đổi thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi gửi đơn thay đổi";
    return res.status(400).json({ success: false, message });
  }
}

export async function getAllRequests(req: AuthRequest, res: Response) {
  try {
    const { status, thesisId } = req.query;
    const data = await service.getAllChangeRequests({
      status: status as string | undefined,
      thesisId: thesisId ? Number(thesisId) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách đơn";
    return res.status(500).json({ success: false, message });
  }
}

export async function reviewRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    const { status, responseNote } = req.body;

    const data = await service.reviewChangeRequest(id, req.user.userId, {
      status,
      responseNote,
    });

    return res.json({
      success: true,
      message:
        status === "APPROVED"
          ? "Đã phê duyệt và cập nhật đề tài thành công"
          : "Đã từ chối đơn yêu cầu",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xử lý đơn yêu cầu";
    return res.status(400).json({ success: false, message });
  }
}
