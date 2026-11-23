import { z } from "zod";

export const createFieldSchema = z.object({
  name: z.string().trim().min(1, "name là bắt buộc"),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const updateFieldSchema = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
