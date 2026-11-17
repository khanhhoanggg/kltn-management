import { z } from "zod";

export const createChangeRequestSchema = z.object({
  thesisId: z.coerce.number({ message: "thesisId phải là số" }),
  changeType: z.enum(["CHANGE_TOPIC", "CHANGE_SUPERVISOR", "BOTH"] as const, {
    message: "changeType phải là CHANGE_TOPIC, CHANGE_SUPERVISOR hoặc BOTH",
  }),
  newTitle: z.string().trim().optional(),
  newDescription: z.string().trim().optional(),
  newSupervisorId: z.coerce.number().optional(),
  reason: z.string().trim().min(5, "Lý do thay đổi tối thiểu 5 ký tự"),
  fileUrl: z.string().trim().optional(),
});

export const reviewChangeRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"] as const, {
    message: "status phải là APPROVED hoặc REJECTED",
  }),
  responseNote: z.string().trim().optional(),
});

export type CreateChangeRequestInput = z.infer<typeof createChangeRequestSchema>;
export type ReviewChangeRequestInput = z.infer<typeof reviewChangeRequestSchema>;
