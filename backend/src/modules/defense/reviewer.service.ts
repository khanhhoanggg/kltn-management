import { prisma } from "../../lib/prisma.js";
import type {
  AssignReviewerInput,
  ReviewerEvaluateInput,
} from "./reviewer.types.js";

const reviewerInclude = {
  thesis: {
    include: {
      student: {
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      },
      supervisor: {
        include: { user: { select: { fullName: true, email: true } } },
      },
      defenseSubmission: true,
      field: true,
      semester: true,
    },
  },
  reviewer: {
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  },
} as const;

/**
 * Giáo vụ phân công Giảng viên phản biện (UC-26)
 * Ràng buộc: GVPB không được trùng với GVHD của đề tài
 */
export async function assignReviewer(
  thesisId: number,
  input: AssignReviewerInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (thesis.status !== "CHO_PHAN_BIEN") {
    throw new Error("Hồ sơ không ở trạng thái chờ phân công phản biện");
  }

  if (thesis.supervisorId === input.reviewerId) {
    throw new Error("Giảng viên phản biện không được trùng với Giảng viên hướng dẫn");
  }

  const reviewer = await prisma.lecturer.findUnique({
    where: { id: input.reviewerId },
  });

  if (!reviewer) {
    throw new Error("Giảng viên phản biện không tồn tại trong hệ thống");
  }

  const assignment = await prisma.reviewerAssignment.upsert({
    where: { thesisId },
    update: {
      reviewerId: input.reviewerId,
      assignedAt: new Date(),
    },
    create: {
      thesisId,
      reviewerId: input.reviewerId,
    },
    include: reviewerInclude,
  });

  // Tự động thông báo cho giảng viên phản biện
  try {
    await prisma.notification.create({
      data: {
        userId: reviewer.userId,
        type: "ASSIGNMENT",
        title: "Phân công phản biện KLTN/CĐTN",
        content: `Khoa CNTT đã phân công bạn phản biện cho đề tài "${thesis.title || ""}". Vui lòng truy cập để xem tài liệu và nhập đánh giá BM-06.`,
        link: `/theses/${thesisId}`,
      },
    });
  } catch (notifErr) {
    console.error("Lỗi gửi thông báo phân công phản biện:", notifErr);
  }

  return assignment;
}

/**
 * GVPB xem tài liệu và nhập đánh giá BM-06 (UC-28)
 */
export async function evaluateByReviewer(
  thesisId: number,
  lecturerId: number | null,
  input: ReviewerEvaluateInput,
) {
  const assignment = await prisma.reviewerAssignment.findUnique({
    where: { thesisId },
    include: {
      thesis: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Đề tài chưa được phân công giảng viên phản biện");
  }

  if (lecturerId !== null && assignment.reviewerId !== lecturerId) {
    throw new Error("Bạn không phải giảng viên phản biện của đề tài này");
  }

  if (input.reviewerScore < 0 || input.reviewerScore > 10) {
    throw new Error("Điểm phản biện phải từ 0 đến 10");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reviewerAssignment.update({
      where: { thesisId },
      data: {
        preliminaryNotes: input.preliminaryNotes?.trim() || null,
        detailedReview: input.detailedReview.trim(),
        decision: input.decision,
        reviewerScore: input.reviewerScore,
        reviewedAt: new Date(),
      },
      include: reviewerInclude,
    });

    // Cập nhật trạng thái đề tài dựa trên quyết định phản biện
    const nextStatus =
      input.decision === "CHO_BAO_VE"
        ? "DU_DIEU_KIEN_BAO_VE"
        : "KHONG_DU_DIEU_KIEN";

    await tx.thesis.update({
      where: { id: thesisId },
      data: { status: nextStatus },
    });

    // Tự động thông báo kết quả phản biện cho sinh viên
    try {
      await tx.notification.create({
        data: {
          userId: assignment.thesis.student.userId,
          type: "EVALUATION",
          title:
            input.decision === "CHO_BAO_VE"
              ? "Kết quả phản biện: ĐỦ ĐIỀU KIỆN BẢO VỆ"
              : "Kết quả phản biện: KHÔNG CHO BẢO VỆ",
          content:
            input.decision === "CHO_BAO_VE"
              ? `Giảng viên phản biện đã hoàn tất đánh giá BM-06 (Điểm: ${input.reviewerScore}). Bạn đã đủ điều kiện để tham gia bảo vệ trước Hội đồng.`
              : `Giảng viên phản biện đã đánh giá không cho phép bảo vệ đề tài trước Hội đồng. Nhận xét: ${input.detailedReview}`,
          link: `/theses/${thesisId}`,
        },
      });
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo kết quả phản biện:", notifErr);
    }

    return updated;
  });
}

/**
 * Lấy danh sách đề tài phân công cho 1 GVPB
 */
export async function getAssignmentsByReviewer(reviewerId: number) {
  return prisma.reviewerAssignment.findMany({
    where: { reviewerId },
    orderBy: { assignedAt: "desc" },
    include: reviewerInclude,
  });
}

/**
 * Lấy thông tin phản biện của 1 đề tài
 */
export async function getReviewerAssignmentByThesisId(thesisId: number) {
  return prisma.reviewerAssignment.findUnique({
    where: { thesisId },
    include: reviewerInclude,
  });
}
