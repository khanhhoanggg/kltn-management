export type CreateNotificationInput = {
  userId: number;
  type?:
    | "SYSTEM"
    | "DEADLINE"
    | "THESIS_STATUS"
    | "ASSIGNMENT"
    | "EVALUATION"
    | "DEFENSE";
  title: string;
  content: string;
  link?: string | null;
};

export type CreateBulkNotificationInput = {
  userIds: number[];
  type?:
    | "SYSTEM"
    | "DEADLINE"
    | "THESIS_STATUS"
    | "ASSIGNMENT"
    | "EVALUATION"
    | "DEFENSE";
  title: string;
  content: string;
  link?: string | null;
};