import { z } from "zod";

export const createLogSchema = z.object({
  thesisId: z.coerce.number({ message: "thesisId là bắt buộc" }),
  meetingDate: z.string().min(1, "meetingDate là bắt buộc"),
  content: z.string().trim().min(1, "content là bắt buộc"),
  tasksAssigned: z.string().trim().optional(),
  progressPercentage: z.coerce
    .number()
    .min(0, "Tiến độ từ 0 đến 100")
    .max(100, "Tiến độ từ 0 đến 100")
    .optional(),
});

export const updateLogSchema = z.object({
  meetingDate: z.string().optional(),
  content: z.string().trim().optional(),
  tasksAssigned: z.string().trim().optional(),
  progressPercentage: z.coerce
    .number()
    .min(0, "Tiến độ từ 0 đến 100")
    .max(100, "Tiến độ từ 0 đến 100")
    .optional(),
});

export const confirmLogSchema = z.object({
  studentNotes: z.string().trim().optional(),
});

export const submitWeeklyReportSchema = z.object({
  report: z.string().trim().min(1, "Nội dung báo cáo là bắt buộc"),
  progressPercentage: z.coerce
    .number()
    .min(0, "Tiến độ từ 0 đến 100")
    .max(100, "Tiến độ từ 0 đến 100")
    .optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type ConfirmLogInput = z.infer<typeof confirmLogSchema>;
export type SubmitWeeklyReportInput = z.infer<typeof submitWeeklyReportSchema>;
