export type AssignReviewerInput = {
  reviewerId: number;
};

export type ReviewerEvaluateInput = {
  preliminaryNotes?: string;
  detailedReview: string;
  decision: "CHO_BAO_VE" | "KHONG_CHO_BAO_VE";
  reviewerScore: number;
};
