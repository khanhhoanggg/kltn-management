import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import fs from "fs";
import { prisma } from "../../lib/prisma.js";
import { RoleName } from "@prisma/client";
import { sendWelcomeEmail } from "../../lib/mail.js";
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

  const student = await prisma.$transaction(async (tx) => {
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

  // Gửi email chào mừng kèm mật khẩu khởi tạo
  sendWelcomeEmail(
    student.user.email,
    student.user.fullName,
    "Sinh viên",
    input.password,
  ).catch((err) => console.error("Lỗi gửi email cho sinh viên:", err));

  return student;
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

/**
 * Nhập danh sách sinh viên từ file Excel (UC-09)
 */
export async function importStudentsFromExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("File Excel không có trang tính (worksheet) nào");
  }

  const role = await prisma.role.findUnique({
    where: { name: RoleName.SINH_VIEN },
  });
  if (!role) {
    throw new Error("Role SINH_VIEN chưa được khởi tạo");
  }

  const results = {
    totalProcessed: 0,
    successCount: 0,
    failedCount: 0,
    errors: [] as { row: number; studentCode?: string; email?: string; reason: string }[],
  };

  // Lặp từ dòng thứ 2 (dòng 1 là Tiêu đề cột)
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    // Đọc các cột
    const studentCode = row.getCell(1).text?.trim();
    const fullName = row.getCell(2).text?.trim();
    const email = row.getCell(3).text?.trim().toLowerCase();
    const className = row.getCell(4).text?.trim() || null;
    const cohort = row.getCell(5).text?.trim() || null;
    const major = row.getCell(6).text?.trim() || null;
    const password = row.getCell(7).text?.trim() || "Student@123";

    // Bỏ qua dòng trống
    if (!studentCode && !fullName && !email) {
      continue;
    }

    results.totalProcessed++;

    if (!studentCode || !fullName || !email) {
      results.failedCount++;
      results.errors.push({
        row: rowNumber,
        studentCode,
        email,
        reason: "Thiếu thông tin bắt buộc (MSSV, Họ tên hoặc Email)",
      });
      continue;
    }

    try {
      // Kiểm tra trùng lặp
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          studentCode,
          email,
          reason: `Email ${email} đã tồn tại trong hệ thống`,
        });
        continue;
      }

      const existingCode = await prisma.student.findUnique({
        where: { studentCode },
      });
      if (existingCode) {
        results.failedCount++;
        results.errors.push({
          row: rowNumber,
          studentCode,
          email,
          reason: `MSSV ${studentCode} đã tồn tại trong hệ thống`,
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const student = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName,
            status: "ACTIVE",
            roles: {
              create: { roleId: role.id },
            },
          },
        });

        return tx.student.create({
          data: {
            userId: user.id,
            studentCode,
            className,
            cohort,
            major,
          },
        });
      });

      // Gửi email chào mừng chạy ngầm
      sendWelcomeEmail(email, fullName, "Sinh viên", password).catch((err) =>
        console.error(`Lỗi gửi email cho ${email}:`, err),
      );

      results.successCount++;
    } catch (err) {
      results.failedCount++;
      results.errors.push({
        row: rowNumber,
        studentCode,
        email,
        reason: err instanceof Error ? err.message : "Lỗi hệ thống khi tạo sinh viên",
      });
    }
  }

  // Xóa file tạm sau khi đọc xong
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (cleanErr) {
    console.error("Lỗi xóa file Excel tạm:", cleanErr);
  }

  return results;
}