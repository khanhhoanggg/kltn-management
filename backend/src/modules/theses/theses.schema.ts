import { z } from "zod";

export const createThesisSchema = z.object({
  semesterId: z.coerce.number({ message: "semesterId phải là số" }),
  type: z.enum(["KLTN", "CDTN"] as const, {
    message: "type phải là KLTN hoặc CDTN",
  }),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  fieldId: z.coerce.number().optional(),
  supervisorId: z.coerce.number().optional(),
  outlineUrl: z.string().trim().optional(),
});

export const updateThesisSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  fieldId: z.coerce.number().optional(),
  supervisorId: z.coerce.number().optional(),
  outlineUrl: z.string().trim().optional(),
});

export const setEligibilitySchema = z.object({
  isEligible: z.boolean({ message: "isEligible (boolean) là bắt buộc" }),
  eligibilityNote: z.string().trim().optional(),
});

export const confirmSupervisorSchema = z.object({
  accepted: z.boolean({ message: "accepted (boolean) là bắt buộc" }),
  note: z.string().trim().optional(),
});

export const assignFacultySchema = z.object({
  supervisorId: z.coerce.number({ message: "supervisorId là bắt buộc" }),
  decisionCode: z.string().trim().min(1, "decisionCode là bắt buộc"),
  decisionDate: z.string().optional(),
});

export type CreateThesisInput = z.infer<typeof createThesisSchema>;
export type UpdateThesisInput = z.infer<typeof updateThesisSchema>;
export type SetEligibilityInput = z.infer<typeof setEligibilitySchema>;
export type ConfirmSupervisorInput = z.infer<typeof confirmSupervisorSchema>;
export type AssignFacultyInput = z.infer<typeof assignFacultySchema>;
