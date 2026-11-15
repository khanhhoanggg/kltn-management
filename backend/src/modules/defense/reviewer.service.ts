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

  return prisma.reviewerAssignment.upsert({
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
    include: { thesis: true },
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
