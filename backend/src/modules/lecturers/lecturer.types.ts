export type CreateLecturerInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  staffCode?: string;
  degree?: string;      // ThS, TS...
  title?: string;       // Chức danh
  department?: string;  // Bộ môn
  maxStudents?: number; // mặc định 15
};

export type UpdateLecturerInput = {
  fullName?: string;
  phone?: string | null;
  staffCode?: string | null;
  degree?: string | null;
  title?: string | null;
  department?: string | null;
  maxStudents?: number;
  status?: "ACTIVE" | "INACTIVE" | "LOCKED";
};