import { z } from "zod";

export const createLecturerSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  fullName: z.string().trim().min(1, "Họ và tên là bắt buộc"),
  phone: z.string().trim().optional(),
  staffCode: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  title: z.string().trim().optional(),
  department: z.string().trim().optional(),
  maxStudents: z.coerce
    .number()
    .int()
    .positive("maxStudents phải là số nguyên dương")
    .optional(),
});

export const updateLecturerSchema = z.object({
  fullName: z.string().trim().optional(),
  phone: z.string().trim().nullable().optional(),
  staffCode: z.string().trim().nullable().optional(),
  degree: z.string().trim().nullable().optional(),
  title: z.string().trim().nullable().optional(),
  department: z.string().trim().nullable().optional(),
  maxStudents: z.coerce
    .number()
    .int()
    .positive("maxStudents phải là số nguyên dương")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"] as const).optional(),
});

export type CreateLecturerInput = z.infer<typeof createLecturerSchema>;
export type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;
