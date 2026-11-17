import { z } from "zod";

export const submitDefenseSchema = z.object({
  reportFileUrl: z.string().trim().min(1, "Link file báo cáo toàn văn là bắt buộc"),
  sourceCodeUrl: z.string().trim().min(1, "Link mã nguồn (GitHub/GitLab) là bắt buộc"),
  plagiarismRate: z.coerce
    .number({ message: "Tỷ lệ đạo văn phải là số" })
    .min(0, "Tỷ lệ đạo văn tối thiểu 0%")
    .max(100, "Tỷ lệ đạo văn tối đa 100%"),
  plagiarismFileUrl: z.string().trim().optional(),
});

export const supervisorEvaluateSchema = z.object({
  supervisorScore: z.coerce
    .number({ message: "Điểm GVHD phải là số" })
    .min(0, "Điểm tối thiểu là 0")
    .max(10, "Điểm tối đa là 10"),
  supervisorDecision: z.enum(["CHO_BAO_VE", "KHONG_CHO_BAO_VE"] as const, {
    message: "Quyết định phải là CHO_BAO_VE hoặc KHONG_CHO_BAO_VE",
  }),
  supervisorComments: z.string().trim().optional(),
});

export const facultyReviewSchema = z.object({
  hardCopyReceived: z.boolean({ message: "hardCopyReceived (boolean) là bắt buộc" }),
  facultyApprovalStatus: z.enum(["DA_DUYET", "YEU_CAU_CHINH_SUA", "BI_LOAI"] as const, {
    message: "Trạng thái phê duyệt phải là DA_DUYET, YEU_CAU_CHINH_SUA hoặc BI_LOAI",
  }),
  facultyNote: z.string().trim().optional(),
});

export type SubmitDefenseSchemaType = z.infer<typeof submitDefenseSchema>;
export type SupervisorEvaluateSchemaType = z.infer<typeof supervisorEvaluateSchema>;
export type FacultyReviewSchemaType = z.infer<typeof facultyReviewSchema>;
