import { z } from "zod";

export const submitMidtermSchema = z.object({
  reportFileUrl: z.string().trim().min(1, "reportFileUrl là bắt buộc"),
});

export const evaluateMidtermSchema = z.object({
  result: z.enum(["DAT", "CANH_BAO", "KHONG_DAT"] as const, {
    message: "result phải là DAT, CANH_BAO hoặc KHONG_DAT",
  }),
  comments: z.string().trim().optional(),
});

export const scheduleDemoSchema = z.object({
  demoDate: z.string().min(1, "demoDate là bắt buộc"),
  location: z.string().trim().optional(),
});

export const evaluateDemoSchema = z.object({
  result: z.enum(["DAT", "CANH_BAO", "KHONG_DAT"] as const, {
    message: "result phải là DAT, CANH_BAO hoặc KHONG_DAT",
  }),
  comments: z.string().trim().optional(),
  canDefend: z.boolean({ message: "canDefend (boolean) là bắt buộc" }),
  disqualifiedRecordUrl: z.string().trim().optional(),
});

export type SubmitMidtermInput = z.infer<typeof submitMidtermSchema>;
export type EvaluateMidtermInput = z.infer<typeof evaluateMidtermSchema>;
export type ScheduleDemoInput = z.infer<typeof scheduleDemoSchema>;
export type EvaluateDemoInput = z.infer<typeof evaluateDemoSchema>;
