export type CreateThesisInput = {
  semesterId: number;
  type: "KLTN" | "CDTN";
  title?: string;
  description?: string;
  fieldId?: number | null;
  supervisorId?: number | null; // GVHD mong muốn (optional)
  outlineUrl?: string;
};

export type UpdateThesisInput = {
  title?: string;
  description?: string | null;
  fieldId?: number | null;
  supervisorId?: number | null;
  outlineUrl?: string | null;
  type?: "KLTN" | "CDTN";
};

export type SetEligibilityInput = {
  isEligible: boolean;
  eligibilityNote?: string | null;
};

export type ConfirmBySupervisorInput = {
  accepted: boolean; // true = xác nhận, false = yêu cầu chỉnh sửa / từ chối
  note?: string;
};

export type AssignByFacultyInput = {
  supervisorId: number;
  decisionCode: string;
  decisionDate?: string; // ISO date
};