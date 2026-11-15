import { prisma } from "../../lib/prisma.js";
import type {
  CreateCouncilInput,
  UpdateCouncilInput,
  AssignThesisToCouncilInput,
  MemberScoreInput,
  FinalizeMinuteInput,
} from "./council.types.js";

const councilDetailInclude = {
  semester: true,
  members: {
    include: {
      lecturer: {
        include: { user: { select: { fullName: true, email: true, phone: true } } },
      },
    },
  },
  assignments: {
    include: {
      thesis: {
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          supervisor: {
            include: { user: { select: { fullName: true } } },
          },
          defenseSubmission: true,
          reviewerAssignment: {
            include: {
              reviewer: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
      },
      scores: {
        include: {
          lecturer: {
            include: { user: { select: { fullName: true } } },
          },
        },
      },
    },
    orderBy: { orderNumber: "asc" },
  },
} as const;

/**
 * Thành lập Hội đồng bảo vệ (UC-26)
 */
export async function createCouncil(input: CreateCouncilInput) {
  if (!input.members || input.members.length < 3) {
    throw new Error("Hội đồng bảo vệ phải có ít nhất 3 thành viên (Chủ tịch, Thư ký, Ủy viên)");
  }

  const hasChairman = input.members.some((m) => m.role === "CHU_TICH");
  const hasSecretary = input.members.some((m) => m.role === "THU_KY");

  if (!hasChairman || !hasSecretary) {
    throw new Error("Hội đồng bắt buộc phải có Chủ tịch và Thư ký");
  }

  return prisma.defenseCouncil.create({
    data: {
      semesterId: input.semesterId,
      code: input.code.trim(),
      name: input.name.trim(),
      defenseDate: input.defenseDate ? new Date(input.defenseDate) : null,
      location: input.location?.trim() || null,
      members: {
        create: input.members.map((m) => ({
          lecturerId: m.lecturerId,
          role: m.role,
        })),
      },
    },
    include: councilDetailInclude,
  });
}

/**
 * Cập nhật thông tin hội đồng
 */
export async function updateCouncil(id: number, input: UpdateCouncilInput) {
  return prisma.defenseCouncil.update({
    where: { id },
    data: {
      ...(input.code !== undefined && { code: input.code.trim() }),
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.defenseDate !== undefined && {
        defenseDate: input.defenseDate ? new Date(input.defenseDate) : null,
      }),
      ...(input.location !== undefined && {
        location: input.location === null ? null : input.location.trim(),
      }),
      ...(input.status !== undefined && { status: input.status }),
    },
    include: councilDetailInclude,
  });
}

/**
 * Lấy danh sách hội đồng theo học kỳ
 */
export async function getAllCouncils(semesterId?: number) {
  return prisma.defenseCouncil.findMany({
    where: {
      ...(semesterId && { semesterId }),
    },
    orderBy: { createdAt: "desc" },
    include: councilDetailInclude,
  });
}

/**
 * Xem chi tiết 1 hội đồng kèm danh sách thành viên và các đề tài
 */
export async function getCouncilById(id: number) {
  return prisma.defenseCouncil.findUnique({
    where: { id },
    include: councilDetailInclude,
  });
}

/**
 * Xếp lịch bảo vệ: Gán đề tài vào hội đồng (UC-29)
 * Ràng buộc: Đề tài phải đã đạt phản biện (status = DU_DIEU_KIEN_BAO_VE)
 */
export async function assignThesisToCouncil(
  councilId: number,
  input: AssignThesisToCouncilInput,
) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: input.thesisId },
  });

  if (!thesis) {
    throw new Error("Không tìm thấy đề tài");
  }

  if (thesis.status !== "DU_DIEU_KIEN_BAO_VE") {
    throw new Error(
      "Đề tài chưa đủ điều kiện bảo vệ (cần hoàn tất phản biện đạt yêu cầu)",
    );
  }

  return prisma.councilThesisAssignment.create({
    data: {
      councilId,
      thesisId: input.thesisId,
      orderNumber: input.orderNumber ?? 1,
      scheduledTime: input.scheduledTime ? new Date(input.scheduledTime) : null,
    },
    include: {
      council: true,
      thesis: true,
    },
  });
}

/**
 * Thành viên Hội đồng chấm điểm BM-07 (UC-30)
 */
export async function scoreByCouncilMember(
  assignmentId: number,
  lecturerId: number,
  input: MemberScoreInput,
) {
  const assignment = await prisma.councilThesisAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      council: {
        include: { members: true },
      },
      scores: true,
    },
  });

  if (!assignment) {
    throw new Error("Không tìm thấy đề tài trong hội đồng");
  }

  // Kiểm tra giảng viên có thuộc hội đồng này không
  const isMember = assignment.council.members.some(
    (m) => m.lecturerId === lecturerId,
  );
  if (!isMember) {
    throw new Error("Bạn không phải thành viên của Hội đồng bảo vệ này");
  }

  if (input.score < 0 || input.score > 10) {
    throw new Error("Điểm chấm phải từ 0 đến 10");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Lưu điểm của thành viên
    await tx.councilScore.upsert({
      where: {
        assignmentId_lecturerId: {
          assignmentId,
          lecturerId,
        },
      },
      update: {
        score: input.score,
        comments: input.comments?.trim() || null,
      },
      create: {
        assignmentId,
        lecturerId,
        score: input.score,
        comments: input.comments?.trim() || null,
      },
    });

    // 2. Tính lại điểm trung bình cộng của Hội đồng
    const allScores = await tx.councilScore.findMany({
      where: { assignmentId },
    });

    const total = allScores.reduce((sum, item) => sum + item.score, 0);
    const avgScore = Number((total / allScores.length).toFixed(2));

    return tx.councilThesisAssignment.update({
      where: { id: assignmentId },
      data: {
        councilScore: avgScore,
      },
      include: {
        scores: {
          include: {
            lecturer: {
              include: { user: { select: { fullName: true } } },
            },
          },
        },
      },
    });
  });
}

/**
 * Thư ký lập Biên bản bảo vệ & Tổng kết điểm cuối kỳ (UC-30, UC-31)
 * Công thức: Final = (Score_GVHD * 0.3) + (Score_GVPB * 0.2) + (Score_HĐ * 0.5)
 */
export async function finalizeDefenseMinute(
  assignmentId: number,
  input: FinalizeMinuteInput,
) {
  const assignment = await prisma.councilThesisAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      thesis: {
        include: {
          defenseSubmission: true,
          reviewerAssignment: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Không tìm thấy thông tin bảo vệ");
  }

  if (assignment.councilScore === null) {
    throw new Error("Hội đồng chưa hoàn tất chấm điểm cho đề tài này");
  }

  const gvhdScore = assignment.thesis.defenseSubmission?.supervisorScore ?? 0;
  const gvpbScore = assignment.thesis.reviewerAssignment?.reviewerScore ?? 0;
  const hdScore = assignment.councilScore;

  // Tính điểm tổng kết
  const finalScore = Number(
    (gvhdScore * 0.3 + gvpbScore * 0.2 + hdScore * 0.5).toFixed(2),
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.councilThesisAssignment.update({
      where: { id: assignmentId },
      data: {
        finalScore,
        minuteNotes: input.minuteNotes?.trim() || null,
        minuteFileUrl: input.minuteFileUrl?.trim() || null,
      },
    });

    // Cập nhật trạng thái đề tài sang ĐÃ BẢO VỆ
    await tx.thesis.update({
      where: { id: assignment.thesisId },
      data: { status: "DA_BAO_VE" },
    });

    return updated;
  });
}

/**
 * Giáo vụ đóng hồ sơ cuối kỳ và lưu trữ (UC-31)
 */
export async function closeThesisRecord(assignmentId: number) {
  const assignment = await prisma.councilThesisAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new Error("Không tìm thấy đề tài");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.councilThesisAssignment.update({
      where: { id: assignmentId },
      data: { isClosed: true },
    });

    await tx.thesis.update({
      where: { id: assignment.thesisId },
      data: { status: "DA_LUU_HO_SO" },
    });

    return updated;
  });
}
