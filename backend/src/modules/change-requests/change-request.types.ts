export type CreateChangeRequestInput = {
  thesisId: number;
  changeType: "CHANGE_TOPIC" | "CHANGE_SUPERVISOR" | "BOTH";
  newTitle?: string;
  newDescription?: string;
  newSupervisorId?: number;
  reason: string;
  fileUrl?: string;
};

export type ReviewChangeRequestInput = {
  status: "APPROVED" | "REJECTED";
  responseNote?: string;
};
