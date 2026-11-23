import { z } from "zod";

export const createStudentSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().trim().min(1, "Họ và tên là bắt buộc"),
  phone: z.string().trim().optional(),
  studentCode: z.string().trim().min(1, "Mã sinh viên là bắt buộc"),
  className: z.string().trim().optional(),
  cohort: z.string().trim().optional(),
  major: z.string().trim().optional(),
});

export const updateStudentSchema = z.object({
  fullName: z.string().trim().optional(),
  phone: z.string().trim().nullable().optional(),
  studentCode: z.string().trim().optional(),
  className: z.string().trim().nullable().optional(),
  cohort: z.string().trim().nullable().optional(),
  major: z.string().trim().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"] as const).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
