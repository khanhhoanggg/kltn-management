import { z } from "zod";

export const createTopicSuggestionSchema = z.object({
  title: z.string().trim().min(1, "title là bắt buộc"),
  description: z.string().trim().optional(),
  fieldId: z.coerce.number().optional(),
  semesterId: z.coerce.number().optional(),
  maxSlots: z.coerce
    .number()
    .int()
    .positive("maxSlots phải là số nguyên dương")
    .optional(),
  isPublished: z.boolean().optional(),
});

export const updateTopicSuggestionSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  fieldId: z.coerce.number().optional(),
  semesterId: z.coerce.number().optional(),
  maxSlots: z.coerce
    .number()
    .int()
    .positive("maxSlots phải là số nguyên dương")
    .optional(),
  isPublished: z.boolean().optional(),
});

export type CreateTopicSuggestionInput = z.infer<
  typeof createTopicSuggestionSchema
>;
export type UpdateTopicSuggestionInput = z.infer<
  typeof updateTopicSuggestionSchema
>;
