import { prisma } from "../../lib/prisma.js";
import type {
  CreateThesisInput,
  UpdateThesisInput,
  SetEligibilityInput,
  ConfirmBySupervisorInput,
  AssignByFacultyInput,
} from "./theses.types.js";

const thesisInclude = {
  student: {
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
  semester: true,
  supervisor: {
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
  field: true,
} as const;

export async function getAllTheses(filters?: {
  semesterId?: number;
  status?: string;
  studentId?: number;
  supervisorId?: number;
  type?: string;
}) {
  return prisma.thesis.findMany({
    where: {
      ...(filters?.semesterId && { semesterId: filters.semesterId }),
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.supervisorId && { supervisorId: filters.supervisorId }),
      ...(filters?.type && { type: filters.type as any }),
    },
    orderBy: { updatedAt: "desc" },
    include: thesisInclude,
  });
}

export async function getThesisById(id: number) {
  return prisma.thesis.findUnique({
    where: { id },
    include: thesisInclude,
  });
}

/** SV đăng ký đề tài (UC-12) */
export async function createThesis(studentId: number, input: CreateThesisInput) {
  // 1 SV chỉ 1 hồ sơ / học kỳ
  const existing = await prisma.thesis.findUnique({
    where: {
      studentId_semesterId: {
        studentId,
        semesterId: input.semesterId,
      },
    },
  });
  if (existing) {
    throw new Error("Sinh viên đã có hồ sơ trong học kỳ này");
  }

  const semester = await prisma.semester.findUnique({
    where: { id: input.semesterId },
  });
  if (!semester) {
    throw new Error("Học kỳ không tồn tại");
  }

  if (input.fieldId) {
    const field = await prisma.researchField.findUnique({
      where: { id: input.fieldId },
    });
    if (!field || !field.isActive) {
      throw new Error("Lĩnh vực không hợp lệ hoặc đã bị vô hiệu hóa");
    }
  }

  if (input.supervisorId) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: input.supervisorId },
    });
    if (!lecturer) {
      throw new Error("Giảng viên hướng dẫn không tồn tại");
    }
  }

  // Có title + outline → chuyển sang chờ GVHD; chưa đủ thì giữ CHUA_DANG_KY
  const hasRegistration =
    !!input.title?.trim() && !!input.outlineUrl?.trim();

  return prisma.thesis.create({
    data: {
      studentId,
      semesterId: input.semesterId,
      type: input.type,
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      fieldId: input.fieldId ?? null,
      supervisorId: input.supervisorId ?? null,
      outlineUrl: input.outlineUrl?.trim() || null,
      status: hasRegistration ? "CHO_GVHD_XAC_NHAN" : "CHUA_DANG_KY",
    },
    include: thesisInclude,
  });
}

/** Cập nhật thông tin đề tài (chỉ khi chưa khóa) */
export async function updateThesis(
  id: number,
  studentId: number | null, // null = admin/giáo vụ
  input: UpdateThesisInput,
) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  if (thesis.isLocked) {
    throw new Error("Hồ sơ đã bị khóa, không thể chỉnh sửa (BR-03)");
  }

  if (studentId !== null && thesis.studentId !== studentId) {
    throw new Error("Bạn không có quyền sửa hồ sơ này");
  }

  // SV chỉ sửa khi còn ở trạng thái sớm
  if (
    studentId !== null &&
    !["CHUA_DANG_KY", "CHO_GVHD_XAC_NHAN"].includes(thesis.status)
  ) {
    throw new Error("Không thể chỉnh sửa ở trạng thái hiện tại");
  }

  const data: any = {
    ...(input.title !== undefined && { title: input.title.trim() }),
    ...(input.description !== undefined && {
      description: input.description === null ? null : input.description.trim(),
    }),
    ...(input.fieldId !== undefined && { fieldId: input.fieldId }),
    ...(input.supervisorId !== undefined && { supervisorId: input.supervisorId }),
    ...(input.outlineUrl !== undefined && {
      outlineUrl: input.outlineUrl === null ? null : input.outlineUrl.trim(),
    }),
    ...(input.type !== undefined && { type: input.type }),
  };

  // Nếu đang CHUA_DANG_KY mà đã đủ title + outline → chuyển CHO_GVHD_XAC_NHAN
  const nextTitle = input.title !== undefined ? input.title.trim() : thesis.title;
  const nextOutline =
    input.outlineUrl !== undefined
      ? input.outlineUrl?.trim() || null
      : thesis.outlineUrl;

  if (
    thesis.status === "CHUA_DANG_KY" &&
    nextTitle &&
    nextOutline
  ) {
    data.status = "CHO_GVHD_XAC_NHAN";
  }

  return prisma.thesis.update({
    where: { id },
    data,
    include: thesisInclude,
  });
}

/** Giáo vụ xét đủ điều kiện (UC-10) */
export async function setEligibility(id: number, input: SetEligibilityInput) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  return prisma.thesis.update({
    where: { id },
    data: {
      isEligible: input.isEligible,
      eligibilityNote:
        input.eligibilityNote === undefined
          ? undefined
          : input.eligibilityNote === null
            ? null
            : input.eligibilityNote.trim(),
    },
    include: thesisInclude,
  });
}

/** GVHD xác nhận / trả lại đề tài + đề cương (UC-13) */
export async function confirmBySupervisor(
  id: number,
  lecturerId: number,
  input: ConfirmBySupervisorInput,
) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  if (thesis.status !== "CHO_GVHD_XAC_NHAN") {
    throw new Error("Hồ sơ không ở trạng thái chờ GVHD xác nhận");
  }

  if (thesis.supervisorId && thesis.supervisorId !== lecturerId) {
    throw new Error("Bạn không phải GVHD của hồ sơ này");
  }

  if (input.accepted) {
    return prisma.thesis.update({
      where: { id },
      data: {
        supervisorId: lecturerId,
        status: "CHO_KHOA_GIAO",
      },
      include: thesisInclude,
    });
  }

  // Trả lại → về CHUA_DANG_KY để SV chỉnh
  return prisma.thesis.update({
    where: { id },
    data: {
      status: "CHUA_DANG_KY",
    },
    include: thesisInclude,
  });
}

/** Khoa ban hành Quyết định giao đề tài + khóa (UC-14, BR-03) */
export async function assignByFaculty(id: number, input: AssignByFacultyInput) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  if (thesis.status !== "CHO_KHOA_GIAO") {
    throw new Error("Hồ sơ không ở trạng thái chờ Khoa giao đề tài");
  }

  if (!thesis.isEligible) {
    throw new Error("Sinh viên chưa được xác nhận đủ điều kiện");
  }

  const lecturer = await prisma.lecturer.findUnique({
    where: { id: input.supervisorId },
    include: {
      _count: { select: { supervisedTheses: true } },
    },
  });
  if (!lecturer) {
    throw new Error("Giảng viên không tồn tại");
  }

  // Đếm số SV đang hướng dẫn (status từ DANG_THUC_HIEN trở đi)
  const currentCount = await prisma.thesis.count({
    where: {
      supervisorId: input.supervisorId,
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

  if (currentCount >= lecturer.maxStudents) {
    throw new Error(
      `Giảng viên đã đủ số lượng SV hướng dẫn (tối đa ${lecturer.maxStudents})`,
    );
  }

  return prisma.thesis.update({
    where: { id },
    data: {
      supervisorId: input.supervisorId,
      decisionCode: input.decisionCode.trim(),
      decisionDate: input.decisionDate
        ? new Date(input.decisionDate)
        : new Date(),
      status: "DANG_THUC_HIEN",
      isLocked: true, // BR-03
    },
    include: thesisInclude,
  });
}

export async function deleteThesis(id: number) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  if (thesis.isLocked || thesis.status === "DANG_THUC_HIEN") {
    throw new Error("Không thể xóa hồ sơ đã được giao / đã khóa");
  }

  return prisma.thesis.delete({ where: { id } });
}