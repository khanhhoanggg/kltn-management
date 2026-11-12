import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { RoleName } from "@prisma/client";
import type {
  CreateLecturerInput,
  UpdateLecturerInput,
} from "./lecturer.types.js";

export async function getAllLecturers(filters?: {
  department?: string;
  search?: string;
}) {
  return prisma.lecturer.findMany({
    where: {
      ...(filters?.department && { department: filters.department }),
      ...(filters?.search && {
        OR: [
          { staffCode: { contains: filters.search, mode: "insensitive" } },
          {
            user: {
              fullName: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            user: {
              email: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      }),
    },
    orderBy: { id: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          supervisedTheses: true,
          topicSuggestions: true,
        },
      },
    },
  });
}

export async function getLecturerById(id: number) {
  return prisma.lecturer.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },
      supervisedTheses: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true } },
            },
          },
          semester: true,
        },
        orderBy: { createdAt: "desc" },
      },
      topicSuggestions: {
        include: { field: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getLecturerByUserId(userId: number) {
  return prisma.lecturer.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
        },
      },
    },
  });
}

export async function createLecturer(input: CreateLecturerInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new Error("Email đã được sử dụng");
  }

  if (input.staffCode) {
    const existingCode = await prisma.lecturer.findUnique({
      where: { staffCode: input.staffCode },
    });
    if (existingCode) {
      throw new Error("Mã giảng viên đã tồn tại");
    }
  }

  const role = await prisma.role.findUnique({
    where: { name: RoleName.GVHD },
  });
  if (!role) {
    throw new Error("Role GVHD chưa được seed");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        passwordHash,
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        status: "ACTIVE",
        roles: {
          create: { roleId: role.id },
        },
      },
    });

    const lecturer = await tx.lecturer.create({
      data: {
        userId: user.id,
        staffCode: input.staffCode?.trim() || null,
        degree: input.degree?.trim() || null,
        title: input.title?.trim() || null,
        department: input.department?.trim() || null,
        maxStudents: input.maxStudents ?? 15,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return lecturer;
  });
}

export async function updateLecturer(id: number, input: UpdateLecturerInput) {
  const lecturer = await prisma.lecturer.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!lecturer) {
    throw new Error("Không tìm thấy giảng viên");
  }

  if (
    input.staffCode &&
    input.staffCode !== lecturer.staffCode
  ) {
    const duplicate = await prisma.lecturer.findUnique({
      where: { staffCode: input.staffCode },
    });
    if (duplicate) {
      throw new Error("Mã giảng viên đã tồn tại");
    }
  }

  if (input.maxStudents !== undefined && input.maxStudents < 1) {
    throw new Error("maxStudents phải >= 1");
  }

  return prisma.$transaction(async (tx) => {
    if (
      input.fullName !== undefined ||
      input.phone !== undefined ||
      input.status !== undefined
    ) {
      await tx.user.update({
        where: { id: lecturer.userId },
        data: {
          ...(input.fullName !== undefined && {
            fullName: input.fullName.trim(),
          }),
          ...(input.phone !== undefined && {
            phone: input.phone === null ? null : input.phone.trim(),
          }),
          ...(input.status !== undefined && { status: input.status }),
        },
      });
    }

    return tx.lecturer.update({
      where: { id },
      data: {
        ...(input.staffCode !== undefined && {
          staffCode:
            input.staffCode === null ? null : input.staffCode.trim(),
        }),
        ...(input.degree !== undefined && {
          degree: input.degree === null ? null : input.degree.trim(),
        }),
        ...(input.title !== undefined && {
          title: input.title === null ? null : input.title.trim(),
        }),
        ...(input.department !== undefined && {
          department:
            input.department === null ? null : input.department.trim(),
        }),
        ...(input.maxStudents !== undefined && {
          maxStudents: input.maxStudents,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
      },
    });
  });
}

export async function deleteLecturer(id: number) {
  const lecturer = await prisma.lecturer.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          supervisedTheses: true,
          topicSuggestions: true,
        },
      },
    },
  });

  if (!lecturer) {
    throw new Error("Không tìm thấy giảng viên");
  }

  if (
    lecturer._count.supervisedTheses > 0 ||
    lecturer._count.topicSuggestions > 0
  ) {
    throw new Error(
      "Không thể xóa giảng viên đang hướng dẫn SV hoặc có đề xuất đề tài. Hãy khóa tài khoản thay vì xóa.",
    );
  }

  return prisma.user.delete({ where: { id: lecturer.userId } });
}