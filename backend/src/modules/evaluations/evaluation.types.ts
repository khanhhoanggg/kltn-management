export type SubmitMidtermInput = {
  reportFileUrl: string;
};

export type EvaluateMidtermInput = {
  comments?: string;
  result: "DAT" | "CANH_BAO" | "KHONG_DAT";
};

export type ScheduleDemoInput = {
  demoDate: string; // ISO string
  location?: string;
};

export type EvaluateDemoInput = {
  comments?: string;
  result: "DAT" | "CANH_BAO" | "KHONG_DAT";
  canDefend: boolean;
  disqualifiedRecordUrl?: string; // Nếu canDefend = false
};
