import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import * as service from "./council.service.js";

async function getLecturerIdOfUser(userId: number) {
  const l = await prisma.lecturer.findUnique({ where: { userId } });
  return l?.id ?? null;
}

/** Giáo vụ tạo hội đồng (UC-26) */
export async function createCouncil(req: AuthRequest, res: Response) {
  try {
    const { semesterId, code, name, defenseDate, location, members } = req.body;

    const data = await service.createCouncil({
      semesterId: Number(semesterId),
      code,
      name,
      defenseDate,
      location,
      members,
    });

    return res.status(201).json({
      success: true,
      message: "Thành lập Hội đồng bảo vệ thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo hội đồng";
    return res.status(400).json({ success: false, message });
  }
}

/** Cập nhật hội đồng */
export async function updateCouncil(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await service.updateCouncil(id, req.body);
    return res.json({
      success: true,
      message: "Cập nhật hội đồng thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật hội đồng";
    return res.status(400).json({ success: false, message });
  }
}

/** Lấy danh sách hội đồng */
export async function getAllCouncils(req: AuthRequest, res: Response) {
  try {
    const { semesterId } = req.query;
    const data = await service.getAllCouncils(
      semesterId ? Number(semesterId) : undefined,
    );
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách hội đồng";
    return res.status(500).json({ success: false, message });
  }
}

/** Chi tiết 1 hội đồng kèm danh sách đề tài và điểm */
export async function getCouncilById(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await service.getCouncilById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng",
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin hội đồng";
    return res.status(500).json({ success: false, message });
  }
}

/** Gán đề tài vào hội đồng (UC-29) */
export async function assignThesis(req: AuthRequest, res: Response) {
  try {
    const councilId = Number(req.params.councilId);
    const { thesisId, orderNumber, scheduledTime } = req.body;

    const data = await service.assignThesisToCouncil(councilId, {
      thesisId: Number(thesisId),
      orderNumber: orderNumber ? Number(orderNumber) : undefined,
      scheduledTime,
    });

    return res.status(201).json({
      success: true,
      message: "Xếp lịch bảo vệ cho đề tài thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xếp lịch bảo vệ";
    return res.status(400).json({ success: false, message });
  }
}

/** Thành viên Hội đồng chấm điểm BM-07 (UC-30) */
export async function scoreAssignment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const lecturerId = await getLecturerIdOfUser(req.user.userId);
    if (!lecturerId) {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên thành viên Hội đồng mới được chấm điểm",
      });
    }

    const assignmentId = Number(req.params.assignmentId);
    const { score, comments } = req.body;

    const data = await service.scoreByCouncilMember(
      assignmentId,
      lecturerId,
      {
        score: Number(score),
        comments,
      },
    );

    return res.json({
      success: true,
      message: "Chấm điểm thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi chấm điểm hội đồng";
    return res.status(400).json({ success: false, message });
  }
}

/** Thư ký hoàn tất biên bản & tính điểm tổng kết (UC-30, UC-31) */
export async function finalizeMinute(req: AuthRequest, res: Response) {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const { minuteNotes, minuteFileUrl } = req.body;

    const data = await service.finalizeDefenseMinute(assignmentId, {
      minuteNotes,
      minuteFileUrl,
    });

    return res.json({
      success: true,
      message: "Đã lập biên bản và tính điểm tổng kết khóa luận thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi hoàn tất biên bản";
    return res.status(400).json({ success: false, message });
  }
}

/** Giáo vụ đóng hồ sơ cuối kỳ (UC-31) */
export async function closeRecord(req: AuthRequest, res: Response) {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const data = await service.closeThesisRecord(assignmentId);

    return res.json({
      success: true,
      message: "Đã đóng và lưu trữ hồ sơ khóa luận thành công",
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đóng hồ sơ";
    return res.status(400).json({ success: false, message });
  }
}
