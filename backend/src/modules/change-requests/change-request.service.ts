import { prisma } from "../../lib/prisma.js";
import type {
  CreateChangeRequestInput,
  ReviewChangeRequestInput,
} from "./change-request.types.js";

export async function createChangeRequest(
  userId: number,
  studentId: number,
  input: CreateChangeRequestInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: input.thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (thesis.studentId !== studentId) {
    throw new Error("Bạn không có quyền gửi yêu cầu cho đề tài này");
  }

  // Đề tài phải đã khóa hoặc đang thực hiện mới cần đơn xin đổi
  if (
    thesis.status === "CHUA_DANG_KY" ||
    thesis.status === "CHO_GVHD_XAC_NHAN"
  ) {
    throw new Error(
      "Đề tài chưa được giao chính thức. Bạn có thể tự chỉnh sửa thông tin trực tiếp.",
    );
  }

  if (
    (input.changeType === "CHANGE_SUPERVISOR" || input.changeType === "BOTH") &&
    !input.newSupervisorId
  ) {
    throw new Error("Vui lòng chọn giảng viên hướng dẫn mới");
  }

  if (
    (input.changeType === "CHANGE_TOPIC" || input.changeType === "BOTH") &&
    !input.newTitle?.trim()
  ) {
    throw new Error("Vui lòng nhập tên đề tài mới");
  }

  return prisma.thesisChangeRequest.create({
    data: {
      thesisId: input.thesisId,
      requestedById: userId,
      changeType: input.changeType,
      newTitle: input.newTitle?.trim() || null,
      newDescription: input.newDescription?.trim() || null,
      newSupervisorId: input.newSupervisorId ?? null,
      reason: input.reason.trim(),
      fileUrl: input.fileUrl?.trim() || null,
      status: "PENDING",
    },
    include: {
      thesis: true,
      newSupervisor: {
        include: { user: { select: { fullName: true } } },
      },
    },
  });
}

export async function getAllChangeRequests(filters?: {
  status?: string;
  thesisId?: number;
}) {
  return prisma.thesisChangeRequest.findMany({
    where: {
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.thesisId && { thesisId: filters.thesisId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      thesis: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          supervisor: {
            include: { user: { select: { fullName: true } } },
          },
        },
      },
      requestedBy: { select: { id: true, fullName: true, email: true } },
      reviewedBy: { select: { id: true, fullName: true } },
      newSupervisor: {
        include: { user: { select: { fullName: true } } },
      },
    },
  });
}

export async function reviewChangeRequest(
  id: number,
  reviewerId: number,
  input: ReviewChangeRequestInput,
) {
  const request = await prisma.thesisChangeRequest.findUnique({
    where: { id },
    include: { thesis: true },
  });

  if (!request) {
    throw new Error("Không tìm thấy đơn yêu cầu");
  }

  if (request.status !== "PENDING") {
    throw new Error("Đơn yêu cầu này đã được xử lý trước đó");
  }

  return prisma.$transaction(async (tx) => {
    // Nếu duyệt, áp dụng thay đổi vào Thesis
    if (input.status === "APPROVED") {
      const thesisUpdates: any = {};

      if (
        request.changeType === "CHANGE_TOPIC" ||
        request.changeType === "BOTH"
      ) {
        if (request.newTitle) thesisUpdates.title = request.newTitle;
        if (request.newDescription)
          thesisUpdates.description = request.newDescription;
      }

      if (
        request.changeType === "CHANGE_SUPERVISOR" ||
        request.changeType === "BOTH"
      ) {
        if (request.newSupervisorId) {
          // Kiểm tra giới hạn tối đa 15 SV của GV mới
          const lecturer = await tx.lecturer.findUnique({
            where: { id: request.newSupervisorId },
          });
          if (!lecturer) throw new Error("Giảng viên mới không tồn tại");

          const count = await tx.thesis.count({
            where: {
              supervisorId: request.newSupervisorId,
              status: {
                in: [
                  "DANG_THUC_HIEN",
                  "DA_DANH_GIA_GIUA_KY",
                  "DA_KIEM_TRA_DEMO",
                  "CHO_DUYET_HO_SO",
                  "CHO_PHAN_BIEN",
                  "DU_DIEU_KIEN_BAO_VE",
                  "DA_BAO_VE",
                  "DA_LUU_HO_SO",
                ],
              },
            },
          });

          if (count >= lecturer.maxStudents) {
            throw new Error(
              `Giảng viên mới đã đủ định mức hướng dẫn (${lecturer.maxStudents} SV)`,
            );
          }

          thesisUpdates.supervisorId = request.newSupervisorId;
        }
      }

      if (Object.keys(thesisUpdates).length > 0) {
        await tx.thesis.update({
          where: { id: request.thesisId },
          data: thesisUpdates,
        });
      }
    }

    const updatedRequest = await tx.thesisChangeRequest.update({
      where: { id },
      data: {
        status: input.status,
        responseNote: input.responseNote?.trim() || null,
        reviewedById: reviewerId,
      },
      include: {
        thesis: true,
        newSupervisor: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    // Tự động thông báo cho người làm đơn
    try {
      await tx.notification.create({
        data: {
          userId: request.requestedById,
          type: "THESIS_STATUS",
          title:
            input.status === "APPROVED"
              ? "Yêu cầu thay đổi đã được chấp thuận"
              : "Yêu cầu thay đổi bị từ chối",
          content:
            input.status === "APPROVED"
              ? `Khoa CNTT đã phê duyệt đơn yêu cầu thay đổi đề tài/GVHD của bạn.${input.responseNote ? ` Ghi chú: ${input.responseNote}` : ""}`
              : `Đơn yêu cầu thay đổi đề tài/GVHD của bạn đã bị từ chối.${input.responseNote ? ` Lý do: ${input.responseNote}` : ""}`,
          link: `/theses/${request.thesisId}`,
        },
      });
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo duyệt đơn thay đổi:", notifErr);
    }

    return updatedRequest;
  });
}
