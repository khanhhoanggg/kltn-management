export type CreateStudentInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentCode: string; // MSSV
  className?: string;
  cohort?: string;
  major?: string;
};

export type UpdateStudentInput = {
  fullName?: string;
  phone?: string | null;
  studentCode?: string;
  className?: string | null;
  cohort?: string | null;
  major?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED"; // status của User
};