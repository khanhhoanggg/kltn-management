import { z } from "zod";

export const assignReviewerSchema = z.object({
  reviewerId: z.coerce.number({ message: "reviewerId là bắt buộc" }),
});

export const evaluateReviewerSchema = z.object({
  preliminaryNotes: z.string().trim().optional(),
  detailedReview: z.string().trim().min(1, "detailedReview là bắt buộc"),
  decision: z.enum(["CHO_BAO_VE", "KHONG_CHO_BAO_VE"] as const, {
    message: "decision phải là CHO_BAO_VE hoặc KHONG_CHO_BAO_VE",
  }),
  reviewerScore: z.coerce
    .number({ message: "reviewerScore là bắt buộc" })
    .min(0, "Điểm tối thiểu là 0")
    .max(10, "Điểm tối đa là 10"),
});

export type AssignReviewerInput = z.infer<typeof assignReviewerSchema>;
export type ReviewerEvaluateInput = z.infer<typeof evaluateReviewerSchema>;
