export type CreateLogInput = {
  thesisId: number;
  meetingDate: string; // ISO date string
  content: string;
  tasksAssigned?: string;
  progressPercentage?: number;
};

export type UpdateLogInput = {
  meetingDate?: string;
  content?: string;
  tasksAssigned?: string;
  progressPercentage?: number;
};

export type ConfirmLogInput = {
  studentNotes?: string;
};
