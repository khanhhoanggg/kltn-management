export type CreateSemesterInput = {
  name: string;
  code: string;
  startDate: string; // ISO date string từ client
  endDate: string;
  isActive?: boolean;
};

export type UpdateSemesterInput = {
  name?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};