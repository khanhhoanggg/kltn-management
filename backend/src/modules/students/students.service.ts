import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { RoleName } from "@prisma/client";
import type { CreateStudentInput, UpdateStudentInput } from "./student.types.js";

export async function getAllStudents(filters?: {
  cohort?: string;
  className?: string;
  major?: string;
  search?: string; // tìm theo tên / MSSV / email
}) {
  return prisma.student.findMany({
    where: {
      ...(filters?.cohort && { cohort: filters.cohort }),
      ...(filters?.className && { className: filters.className }),
      ...(filters?.major && { major: filters.major }),
      ...(filters?.search && {
        OR: [
          { studentCode: { contains: filters.search, mode: "insensitive" } },
          { user: { fullName: { contains: filters.search, mode: "insensitive" } } },
          { user: { email: { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    },
    orderBy: { studentCode: "asc" },
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
      _count: { select: { theses: true } },
    },
  });
}

export async function getStudentById(id: number) {
  return prisma.student.findUnique({
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
      theses: {
        include: {
          semester: true,
          supervisor: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getStudentByUserId(userId: number) {
  return prisma.student.findUnique({
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

export async function createStudent(input: CreateStudentInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new Error("Email đã được sử dụng");
  }

  const existingCode = await prisma.student.findUnique({
    where: { studentCode: input.studentCode },
  });
  if (existingCode) {
    throw new Error("Mã số sinh viên đã tồn tại");
  }

  const role = await prisma.role.findUnique({
    where: { name: RoleName.SINH_VIEN },
  });
  if (!role) {
    throw new Error("Role SINH_VIEN chưa được seed");
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

    const student = await tx.student.create({
      data: {
        userId: user.id,
        studentCode: input.studentCode.trim(),
        className: input.className?.trim() || null,
        cohort: input.cohort?.trim() || null,
        major: input.major?.trim() || null,
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

    return student;
  });
}

export async function updateStudent(id: number, input: UpdateStudentInput) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!student) {
    throw new Error("Không tìm thấy sinh viên");
  }

  if (input.studentCode && input.studentCode !== student.studentCode) {
    const duplicate = await prisma.student.findUnique({
      where: { studentCode: input.studentCode },
    });
    if (duplicate) {
      throw new Error("Mã số sinh viên đã tồn tại");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (
      input.fullName !== undefined ||
      input.phone !== undefined ||
      input.status !== undefined
    ) {
      await tx.user.update({
        where: { id: student.userId },
        data: {
          ...(input.fullName !== undefined && { fullName: input.fullName.trim() }),
          ...(input.phone !== undefined && {
            phone: input.phone === null ? null : input.phone.trim(),
          }),
          ...(input.status !== undefined && { status: input.status }),
        },
      });
    }

    return tx.student.update({
      where: { id },
      data: {
        ...(input.studentCode !== undefined && {
          studentCode: input.studentCode.trim(),
        }),
        ...(input.className !== undefined && {
          className: input.className === null ? null : input.className.trim(),
        }),
        ...(input.cohort !== undefined && {
          cohort: input.cohort === null ? null : input.cohort.trim(),
        }),
        ...(input.major !== undefined && {
          major: input.major === null ? null : input.major.trim(),
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

export async function deleteStudent(id: number) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { _count: { select: { theses: true } } },
  });

  if (!student) {
    throw new Error("Không tìm thấy sinh viên");
  }

  if (student._count.theses > 0) {
    throw new Error(
      "Không thể xóa sinh viên đã có hồ sơ KLTN/CĐTN. Hãy khóa tài khoản thay vì xóa.",
    );
  }

  // Xóa User → cascade xóa Student (onDelete: Cascade)
  return prisma.user.delete({ where: { id: student.userId } });
}