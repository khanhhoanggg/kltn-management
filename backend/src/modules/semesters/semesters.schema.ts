import { z } from "zod";

export const createSemesterSchema = z.object({
  name: z.string().trim().min(1, "name là bắt buộc"),
  code: z.string().trim().min(1, "code là bắt buộc"),
  startDate: z.string().min(1, "startDate là bắt buộc"),
  endDate: z.string().min(1, "endDate là bắt buộc"),
  isActive: z.boolean().optional(),
});

export const updateSemesterSchema = z.object({
  name: z.string().trim().optional(),
  code: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;
