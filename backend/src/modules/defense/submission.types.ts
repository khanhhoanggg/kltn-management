export type SubmitDefenseInput = {
  thesisId: number;
  reportFileUrl: string;
  sourceCodeUrl: string;
  plagiarismRate: number;
  plagiarismFileUrl?: string;
};

export type SupervisorEvaluateSubmissionInput = {
  supervisorScore: number;
  supervisorComments?: string;
  supervisorDecision: "CHO_BAO_VE" | "KHONG_CHO_BAO_VE";
};

export type FacultyReviewSubmissionInput = {
  hardCopyReceived: boolean;
  facultyApprovalStatus: "DA_DUYET" | "YEU_CAU_CHINH_SUA" | "BI_LOAI";
  facultyNote?: string;
};
