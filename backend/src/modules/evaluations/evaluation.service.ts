import { prisma } from "../../lib/prisma.js";
import type {
  SubmitMidtermInput,
  EvaluateMidtermInput,
  ScheduleDemoInput,
  EvaluateDemoInput,
} from "./evaluation.types.js";

// ==================== BÁO CÁO & ĐÁNH GIÁ GIỮA KỲ (BM-03) ====================

export async function submitMidtermReport(
  thesisId: number,
  studentId: number,
  input: SubmitMidtermInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (thesis.studentId !== studentId) {
    throw new Error("Bạn không có quyền nộp báo cáo cho đề tài này");
  }

  if (thesis.status !== "DANG_THUC_HIEN") {
    throw new Error("Đề tài không ở giai đoạn nộp báo cáo giữa kỳ");
  }

  return prisma.midtermEvaluation.upsert({
    where: { thesisId },
    update: {
      reportFileUrl: input.reportFileUrl.trim(),
      submittedAt: new Date(),
    },
    create: {
      thesisId,
      reportFileUrl: input.reportFileUrl.trim(),
      submittedAt: new Date(),
    },
  });
}

export async function evaluateMidterm(
  thesisId: number,
  lecturerId: number | null,
  input: EvaluateMidtermInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: thesisId },
    include: { midtermEvaluation: true },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (lecturerId !== null && thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không phải GVHD của đề tài này");
  }

  if (thesis.status !== "DANG_THUC_HIEN") {
    throw new Error("Hồ sơ không ở trạng thái chờ đánh giá giữa kỳ");
  }

  return prisma.$transaction(async (tx) => {
    const evaluation = await tx.midtermEvaluation.upsert({
      where: { thesisId },
      update: {
        comments: input.comments?.trim() || null,
        result: input.result,
        evaluatedAt: new Date(),
      },
      create: {
        thesisId,
        comments: input.comments?.trim() || null,
        result: input.result,
        evaluatedAt: new Date(),
      },
    });

    await tx.thesis.update({
      where: { id: thesisId },
      data: {
        midtermResult: input.result,
        status: "DA_DANH_GIA_GIUA_KY",
      },
    });

    return evaluation;
  });
}

export async function getMidtermEvaluation(thesisId: number) {
  return prisma.midtermEvaluation.findUnique({
    where: { thesisId },
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

// ==================== CHECK-POINT DEMO (BM-03) ====================

export async function scheduleDemo(
  thesisId: number,
  lecturerId: number | null,
  input: ScheduleDemoInput,
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

  if (thesis.status !== "DA_DANH_GIA_GIUA_KY") {
    throw new Error("Đề tài phải hoàn thành đánh giá giữa kỳ trước khi đặt lịch demo");
  }

  return prisma.checkpointDemo.upsert({
    where: { thesisId },
    update: {
      demoDate: new Date(input.demoDate),
      location: input.location?.trim() || null,
    },
    create: {
      thesisId,
      demoDate: new Date(input.demoDate),
      location: input.location?.trim() || null,
    },
  });
}

export async function evaluateDemo(
  thesisId: number,
  lecturerId: number | null,
  input: EvaluateDemoInput,
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

  if (thesis.status !== "DA_DANH_GIA_GIUA_KY") {
    throw new Error("Đề tài không ở trạng thái chờ đánh giá demo");
  }

  if (!input.canDefend && !input.disqualifiedRecordUrl) {
    throw new Error(
      "Khi quyết định không cho bảo vệ, bắt buộc phải tải lên biên bản (BM-03 extend)",
    );
  }

  return prisma.$transaction(async (tx) => {
    const demo = await tx.checkpointDemo.upsert({
      where: { thesisId },
      update: {
        comments: input.comments?.trim() || null,
        result: input.result,
        canDefend: input.canDefend,
        disqualifiedRecordUrl: input.canDefend
          ? null
          : input.disqualifiedRecordUrl?.trim() || null,
        evaluatedAt: new Date(),
      },
      create: {
        thesisId,
        comments: input.comments?.trim() || null,
        result: input.result,
        canDefend: input.canDefend,
        disqualifiedRecordUrl: input.canDefend
          ? null
          : input.disqualifiedRecordUrl?.trim() || null,
        evaluatedAt: new Date(),
      },
    });

    // Cập nhật trạng thái đề tài
    const nextStatus = input.canDefend
      ? "DA_KIEM_TRA_DEMO"
      : "KHONG_DU_DIEU_KIEN";

    await tx.thesis.update({
      where: { id: thesisId },
      data: {
        checkpointResult: input.result,
        status: nextStatus,
      },
    });

    return demo;
  });
}

export async function getCheckpointDemo(thesisId: number) {
  return prisma.checkpointDemo.findUnique({
    where: { thesisId },
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
