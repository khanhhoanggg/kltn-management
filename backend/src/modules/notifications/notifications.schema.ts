import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.coerce.number({ message: "userId là bắt buộc" }),
  type: z
    .enum([
      "SYSTEM",
      "DEADLINE",
      "THESIS_STATUS",
      "ASSIGNMENT",
      "EVALUATION",
      "DEFENSE",
    ] as const)
    .optional(),
  title: z.string().trim().min(1, "title là bắt buộc"),
  content: z.string().trim().min(1, "content là bắt buộc"),
  link: z.string().trim().nullable().optional(),
});

export const createBulkNotificationSchema = z.object({
  userIds: z
    .array(z.coerce.number({ message: "Mỗi userId phải là số" }))
    .min(1, "userIds phải có ít nhất 1 id"),
  type: z
    .enum([
      "SYSTEM",
      "DEADLINE",
      "THESIS_STATUS",
      "ASSIGNMENT",
      "EVALUATION",
      "DEFENSE",
    ] as const)
    .optional(),
  title: z.string().trim().min(1, "title là bắt buộc"),
  content: z.string().trim().min(1, "content là bắt buộc"),
  link: z.string().trim().nullable().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateBulkNotificationInput = z.infer<
  typeof createBulkNotificationSchema
>;
