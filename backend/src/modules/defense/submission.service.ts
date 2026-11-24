import { prisma } from "../../lib/prisma.js";
import type {
  SubmitDefenseInput,
  SupervisorEvaluateSubmissionInput,
  FacultyReviewSubmissionInput,
} from "./submission.types.js";

const submissionInclude = {
  thesis: {
    include: {
      student: {
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      },
      supervisor: {
        include: { user: { select: { fullName: true, email: true } } },
      },
      semester: true,
      field: true,
    },
  },
} as const;

/**
 * SV nộp hồ sơ bảo vệ trực tuyến (UC-22)
 * Ràng buộc: Đề tài phải đã đạt kiểm tra Demo (status = DA_KIEM_TRA_DEMO)
 */
export async function submitDefense(
  thesisId: number,
  studentId: number,
  input: SubmitDefenseInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (thesis.studentId !== studentId) {
    throw new Error("Bạn không có quyền nộp hồ sơ cho đề tài này");
  }

  if (
    thesis.status !== "DA_KIEM_TRA_DEMO" &&
    thesis.status !== "CHO_DUYET_HO_SO"
  ) {
    throw new Error(
      "Đề tài chưa hoàn thành hoặc chưa đạt kiểm tra Demo, không đủ điều kiện nộp hồ sơ bảo vệ",
    );
  }

  if (input.plagiarismRate < 0 || input.plagiarismRate > 100) {
    throw new Error("Tỷ lệ đạo văn không hợp lệ (phải từ 0% đến 100%)");
  }

  return prisma.$transaction(async (tx) => {
    const submission = await tx.defenseSubmission.upsert({
      where: { thesisId },
      update: {
        reportFileUrl: input.reportFileUrl.trim(),
        slideFileUrl: input.slideFileUrl?.trim() || null,
        sourceCodeUrl: input.sourceCodeUrl.trim(),
        plagiarismRate: input.plagiarismRate,
        plagiarismFileUrl: input.plagiarismFileUrl?.trim() || null,
        facultyApprovalStatus: "CHO_DUYET",
      },
      create: {
        thesisId,
        reportFileUrl: input.reportFileUrl.trim(),
        slideFileUrl: input.slideFileUrl?.trim() || null,
        sourceCodeUrl: input.sourceCodeUrl.trim(),
        plagiarismRate: input.plagiarismRate,
        plagiarismFileUrl: input.plagiarismFileUrl?.trim() || null,
        facultyApprovalStatus: "CHO_DUYET",
      },
      include: submissionInclude,
    });

    // Cập nhật trạng thái đề tài sang CHỜ DUYỆT HỒ SƠ
    await tx.thesis.update({
      where: { id: thesisId },
      data: { status: "CHO_DUYET_HO_SO" },
    });

    return submission;
  });
}

/**
 * GVHD xác nhận hồ sơ và lập BM-05 (UC-23)
 */
export async function supervisorEvaluate(
  thesisId: number,
  lecturerId: number | null,
  input: SupervisorEvaluateSubmissionInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (lecturerId !== null && thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không phải GVHD của đề tài này");
  }

  const submission = await prisma.defenseSubmission.findUnique({
    where: { thesisId },
  });

  if (!submission) {
    throw new Error("Sinh viên chưa nộp hồ sơ bảo vệ");
  }

  if (input.supervisorScore < 0 || input.supervisorScore > 10) {
    throw new Error("Điểm đánh giá GVHD phải từ 0 đến 10");
  }

  return prisma.$transaction(async (tx) => {
    const updatedSubmission = await tx.defenseSubmission.update({
      where: { thesisId },
      data: {
        supervisorScore: input.supervisorScore,
        supervisorComments: input.supervisorComments?.trim() || null,
        supervisorDecision: input.supervisorDecision,
        supervisorSignedAt: new Date(),
      },
      include: submissionInclude,
    });

    // Nếu GVHD quyết định KHÔNG CHO BẢO VỆ → Dừng luồng
    if (input.supervisorDecision === "KHONG_CHO_BAO_VE") {
      await tx.thesis.update({
        where: { id: thesisId },
        data: { status: "KHONG_DU_DIEU_KIEN" },
      });
    }

    return updatedSubmission;
  });
}

/**
 * Giáo vụ ghi nhận bản cứng, kiểm tra kết quả đạo văn < 20% và duyệt hồ sơ (UC-24, UC-25)
 */
export async function facultyReview(
  thesisId: number,
  input: FacultyReviewSubmissionInput,
) {
  const submission = await prisma.defenseSubmission.findUnique({
    where: { thesisId },
    include: {
      thesis: {
        include: {
          student: { include: { user: true } },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Không tìm thấy hồ sơ bảo vệ");
  }

  // Khi phê duyệt: Kiểm tra các điều kiện nghiêm ngặt
  if (input.facultyApprovalStatus === "DA_DUYET") {
    // 1. Kiểm tra quy định tỷ lệ đạo văn < 20%
    if (submission.plagiarismRate >= 20) {
      throw new Error(
        `Tỷ lệ trùng lặp đạo văn (${submission.plagiarismRate}%) vượt quá quy định (< 20%). Không thể phê duyệt!`,
      );
    }

    // 2. Phải nhận được bản cứng có chữ ký GVHD
    if (!input.hardCopyReceived) {
      throw new Error(
        "Bắt buộc phải ghi nhận đã nhận bản cứng có chữ ký của GVHD trước khi duyệt",
      );
    }

    // 3. GVHD phải xác nhận Cho bảo vệ (BM-05)
    if (submission.supervisorDecision !== "CHO_BAO_VE") {
      throw new Error(
        "GVHD chưa hoàn tất xác nhận Cho bảo vệ (BM-05) cho hồ sơ này",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedSubmission = await tx.defenseSubmission.update({
      where: { thesisId },
      data: {
        hardCopyReceived: input.hardCopyReceived,
        hardCopyReceivedAt: input.hardCopyReceived ? new Date() : null,
        facultyApprovalStatus: input.facultyApprovalStatus,
        facultyNote: input.facultyNote?.trim() || null,
      },
      include: submissionInclude,
    });

    // Cập nhật trạng thái đề tài tương ứng
    let nextThesisStatus = submission.thesis.status;
    if (input.facultyApprovalStatus === "DA_DUYET") {
      nextThesisStatus = "CHO_PHAN_BIEN"; // Sẵn sàng chuyển sang phân công GVPB
    } else if (input.facultyApprovalStatus === "YEU_CAU_CHINH_SUA") {
      nextThesisStatus = "DA_KIEM_TRA_DEMO"; // Trả lại cho SV sửa và nộp lại
    } else if (input.facultyApprovalStatus === "BI_LOAI") {
      nextThesisStatus = "KHONG_DU_DIEU_KIEN"; // Quá hạn hoặc vi phạm quy chế
    }

    await tx.thesis.update({
      where: { id: thesisId },
      data: { status: nextThesisStatus },
    });

    // Tự động thông báo kết quả duyệt hồ sơ cho sinh viên
    try {
      await tx.notification.create({
        data: {
          userId: submission.thesis.student.userId,
          type: "DEFENSE",
          title:
            input.facultyApprovalStatus === "DA_DUYET"
              ? "Hồ sơ bảo vệ đã được phê duyệt"
              : input.facultyApprovalStatus === "YEU_CAU_CHINH_SUA"
                ? "Yêu cầu chỉnh sửa hồ sơ bảo vệ"
                : "Hồ sơ bảo vệ không đủ điều kiện",
          content:
            input.facultyApprovalStatus === "DA_DUYET"
              ? "Giáo vụ Khoa đã xác nhận bản cứng và duyệt hồ sơ bảo vệ KLTN/CĐTN của bạn. Hồ sơ được chuyển sang bước phân công Phản biện."
              : `Giáo vụ Khoa có thông báo về hồ sơ bảo vệ của bạn: ${input.facultyNote || (input.facultyApprovalStatus === "YEU_CAU_CHINH_SUA" ? "Vui lòng cập nhật và nộp lại hồ sơ" : "Hồ sơ bị loại do vi phạm quy chế hoặc quá hạn")}`,
          link: `/theses/${thesisId}`,
        },
      });
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo duyệt hồ sơ:", notifErr);
    }

    return updatedSubmission;
  });
}

/**
 * Xem chi tiết hồ sơ bảo vệ của 1 đề tài
 */
export async function getSubmissionByThesisId(thesisId: number) {
  return prisma.defenseSubmission.findUnique({
    where: { thesisId },
    include: submissionInclude,
  });
}

/**
 * Lấy danh sách toàn bộ hồ sơ bảo vệ cho Giáo vụ quản lý
 */
export async function getAllSubmissions(filters?: {
  semesterId?: number;
  approvalStatus?: string;
}) {
  return prisma.defenseSubmission.findMany({
    where: {
      ...(filters?.approvalStatus && {
        facultyApprovalStatus: filters.approvalStatus as any,
      }),
      ...(filters?.semesterId && {
        thesis: { semesterId: filters.semesterId },
      }),
    },
    orderBy: { updatedAt: "desc" },
    include: submissionInclude,
  });
}
