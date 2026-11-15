export type CreateCouncilInput = {
  semesterId: number;
  code: string;
  name: string;
  defenseDate?: string;
  location?: string;
  members: {
    lecturerId: number;
    role: "CHU_TICH" | "THU_KY" | "UY_VIEN";
  }[];
};

export type UpdateCouncilInput = {
  code?: string;
  name?: string;
  defenseDate?: string;
  location?: string;
  status?: "CHUAN_BI" | "DANG_DIEN_RA" | "DA_KET_THUC";
};

export type AssignThesisToCouncilInput = {
  thesisId: number;
  orderNumber?: number;
  scheduledTime?: string;
};

export type MemberScoreInput = {
  score: number;
  comments?: string;
};

export type FinalizeMinuteInput = {
  minuteNotes?: string;
  minuteFileUrl?: string;
};
