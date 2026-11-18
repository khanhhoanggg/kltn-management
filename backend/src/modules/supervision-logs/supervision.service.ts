import { prisma } from "../../lib/prisma.js";
import type {
  CreateLogInput,
  UpdateLogInput,
  ConfirmLogInput,
} from "./supervision.types.js";

export async function getLogsByThesisId(thesisId: number) {
  return prisma.supervisionLog.findMany({
    where: { thesisId },
    orderBy: { meetingDate: "desc" },
  });
}

export async function getLogById(id: number) {
  return prisma.supervisionLog.findUnique({
    where: { id },
    include: {
      thesis: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          supervisor: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      },
    },
  });
}

export async function createLog(
  input: CreateLogInput,
  lecturerId: number | null, // null nếu là Admin/Giáo vụ
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: input.thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  // Đề tài phải từ trạng thái DANG_THUC_HIEN trở đi
  if (
    thesis.status === "CHUA_DANG_KY" ||
    thesis.status === "CHO_GVHD_XAC_NHAN" ||
    thesis.status === "CHO_KHOA_GIAO"
  ) {
    throw new Error(
      "Đề tài chưa được Khoa phê duyệt thực hiện, không thể tạo nhật ký",
    );
  }

  if (lecturerId !== null && thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không phải GVHD được giao của đề tài này");
  }

  return prisma.supervisionLog.create({
    data: {
      thesisId: input.thesisId,
      meetingDate: new Date(input.meetingDate),
      content: input.content.trim(),
      tasksAssigned: input.tasksAssigned?.trim() || null,
      progressPercentage:
        input.progressPercentage !== undefined
          ? Math.max(0, Math.min(100, input.progressPercentage))
          : null,
    },
  });
}

export async function updateLog(
  id: number,
  input: UpdateLogInput,
  lecturerId: number | null,
) {
  const log = await prisma.supervisionLog.findUnique({
    where: { id },
    include: { thesis: true },
  });

  if (!log) {
    throw new Error("Không tìm thấy nhật ký hướng dẫn");
  }

  if (lecturerId !== null && log.thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không có quyền sửa nhật ký này");
  }

  return prisma.supervisionLog.update({
    where: { id },
    data: {
      ...(input.meetingDate && { meetingDate: new Date(input.meetingDate) }),
      ...(input.content !== undefined && { content: input.content.trim() }),
      ...(input.tasksAssigned !== undefined && {
        tasksAssigned: input.tasksAssigned?.trim() || null,
      }),
      ...(input.progressPercentage !== undefined && {
        progressPercentage: Math.max(0, Math.min(100, input.progressPercentage)),
      }),
    },
  });
}

export async function confirmLogByStudent(
  id: number,
  studentId: number,
  input: ConfirmLogInput,
) {
  const log = await prisma.supervisionLog.findUnique({
    where: { id },
    include: { thesis: true },
  });

  if (!log) {
    throw new Error("Không tìm thấy nhật ký hướng dẫn");
  }

  if (log.thesis.studentId !== studentId) {
    throw new Error("Bạn không phải sinh viên thực hiện đề tài này");
  }

  return prisma.supervisionLog.update({
    where: { id },
    data: {
      isConfirmedByStudent: true,
      confirmedAt: new Date(),
      ...(input.studentNotes !== undefined && {
        studentNotes: input.studentNotes?.trim() || null,
      }),
    },
  });
}

/** Sinh viên gửi báo cáo tiến độ tuần để GVHD theo dõi. */
export async function submitWeeklyReport(
  thesisId: number,
  studentId: number,
  report: string,
  progressPercentage?: number,
) {
  const thesis = await prisma.thesis.findUnique({ where: { id: thesisId } });
  if (!thesis) throw new Error("Không tìm thấy đề tài");
  if (thesis.studentId !== studentId) throw new Error("Bạn không có quyền gửi báo cáo cho đề tài này");
  if (["CHUA_DANG_KY", "CHO_GVHD_XAC_NHAN", "CHO_KHOA_GIAO"].includes(thesis.status)) {
    throw new Error("Đề tài chưa được Khoa phê duyệt thực hiện");
  }

  return prisma.supervisionLog.create({
    data: {
      thesisId,
      meetingDate: new Date(),
      content: "Báo cáo tiến độ tuần do sinh viên gửi",
      studentNotes: report.trim(),
      isConfirmedByStudent: true,
      confirmedAt: new Date(),
      progressPercentage: progressPercentage === undefined ? null : Math.max(0, Math.min(100, progressPercentage)),
    },
  });
}

export async function deleteLog(id: number, lecturerId: number | null) {
  const log = await prisma.supervisionLog.findUnique({
    where: { id },
    include: { thesis: true },
  });

  if (!log) {
    throw new Error("Không tìm thấy nhật ký");
  }

  if (lecturerId !== null && log.thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không có quyền xóa nhật ký này");
  }

  return prisma.supervisionLog.delete({ where: { id } });
}
