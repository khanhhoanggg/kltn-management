import { z } from "zod";

export const createCouncilSchema = z.object({
  semesterId: z.coerce.number({ message: "semesterId là bắt buộc" }),
  code: z.string().trim().min(1, "code là bắt buộc"),
  name: z.string().trim().min(1, "name là bắt buộc"),
  defenseDate: z.string().optional(),
  location: z.string().trim().optional(),
  members: z
    .array(
      z.object({
        lecturerId: z.coerce.number({ message: "lecturerId là bắt buộc" }),
        role: z.enum(["CHU_TICH", "THU_KY", "UY_VIEN"] as const, {
          message: "role phải là CHU_TICH, THU_KY hoặc UY_VIEN",
        }),
      }),
    )
    .min(1, "members phải có ít nhất 1 thành viên"),
});

export const updateCouncilSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().optional(),
  defenseDate: z.string().optional(),
  location: z.string().trim().optional(),
  status: z
    .enum(["CHUAN_BI", "DANG_DIEN_RA", "DA_KET_THUC"] as const)
    .optional(),
});

export const assignThesisToCouncilSchema = z.object({
  thesisId: z.coerce.number({ message: "thesisId là bắt buộc" }),
  orderNumber: z.coerce.number().optional(),
  scheduledTime: z.string().optional(),
});

export const memberScoreSchema = z.object({
  score: z.coerce
    .number({ message: "score là bắt buộc" })
    .min(0, "Điểm tối thiểu là 0")
    .max(10, "Điểm tối đa là 10"),
  comments: z.string().trim().optional(),
});

export const finalizeMinuteSchema = z.object({
  minuteNotes: z.string().trim().optional(),
  minuteFileUrl: z.string().trim().optional(),
});

export type CreateCouncilInput = z.infer<typeof createCouncilSchema>;
export type UpdateCouncilInput = z.infer<typeof updateCouncilSchema>;
export type AssignThesisToCouncilInput = z.infer<
  typeof assignThesisToCouncilSchema
>;
export type MemberScoreInput = z.infer<typeof memberScoreSchema>;
export type FinalizeMinuteInput = z.infer<typeof finalizeMinuteSchema>;
