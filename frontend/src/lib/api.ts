const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  roles?: string[];
  rolesList?: string[];
  status?: string;
  student?: {
    id?: number;
    studentCode: string;
    className?: string;
    cohort?: string;
    major?: string;
  };
  lecturer?: {
    id?: number;
    staffCode?: string;
    degree?: string;
    title?: string;
    department?: string;
    maxStudents?: number;
  };
}

export interface StudentItem {
  id: number;
  userId: number;
  studentCode: string;
  className?: string | null;
  cohort?: string | null;
  major?: string | null;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string | null;
    status: string;
  };
}

export interface LecturerItem {
  id: number;
  userId: number;
  staffCode?: string | null;
  degree?: string | null;
  title?: string | null;
  department?: string | null;
  maxStudents: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string | null;
    status: string;
  };
}

export interface NotificationResponse {
  id: number;
  title: string;
  content?: string;
  message?: string;
  type?: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ThesisResponse {
  id: number;
  title?: string;
  description?: string;
  outlineUrl?: string;
  type: string;
  status: string;
  isLocked?: boolean;
  decisionCode?: string | null;
  decisionDate?: string | null;
  isEligible?: boolean;
  eligibilityNote?: string | null;
  field?: { id: number; name: string };
  semester?: { id: number; name: string };
  student?: { id: number; studentCode?: string; user?: { fullName: string; email?: string } };
  supervisor?: { id: number; degree?: string; user?: { fullName: string; email?: string } };
  defenseSubmission?: DefenseSubmission;
  reviewerAssignment?: {
    id: number;
    reviewerId: number;
    decision?: string;
    reviewerScore?: number;
    detailedReview?: string;
    reviewer?: { user?: { fullName: string } };
  };
  councilAssignment?: {
    id: number;
    councilId: number;
    orderNumber?: number;
    scheduledTime?: string;
    councilScore?: number;
    finalScore?: number;
    council?: { name: string; code: string; location?: string; defenseDate?: string };
  };
}

export interface Suggestion {
  id: number;
  title: string;
  description?: string;
  maxSlots: number;
  lecturerId: number;
  field?: { id: number; name: string };
  lecturer?: { user?: { fullName: string; email?: string } };
}

export interface Log {
  id: number;
  meetingDate: string;
  content: string;
  tasksAssigned?: string;
  studentNotes?: string;
  progressPercentage?: number;
  isConfirmedByStudent: boolean;
}

export interface MidtermEvaluation {
  id?: number;
  reportFileUrl?: string;
  result?: string;
  comments?: string;
  evaluationDate?: string;
}

export interface CheckpointDemo {
  id?: number;
  result?: string;
  demoDate?: string;
  location?: string;
  comments?: string;
  canDefend?: boolean;
}

export interface ActiveSemester {
  id: number;
  name: string;
  code: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ActiveField {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ChangeRequestItem {
  id: number;
  thesisId: number;
  type: "DOI_TEN_DE_TAI" | "DOI_GVHD" | "RUT_DE_TAI";
  reason: string;
  newTitle?: string | null;
  newSupervisorId?: number | null;
  newSupervisor?: { user?: { fullName: string } };
  status: "CHO_DUYET" | "DA_DUYET" | "TU_CHOI";
  reviewNotes?: string | null;
  createdAt: string;
  thesis: {
    title?: string;
    student?: { studentCode?: string; user?: { fullName: string } };
  };
}

export interface CouncilMemberItem {
  id: number;
  lecturerId: number;
  role: "CHU_TICH" | "THU_KY" | "UY_VIEN";
  lecturer: {
    staffCode?: string | null;
    degree?: string | null;
    user: { fullName: string; email: string };
  };
}

export interface CouncilItem {
  id: number;
  semesterId: number;
  code: string;
  name: string;
  defenseDate?: string | null;
  location?: string | null;
  status: "CHUAN_BI" | "DANG_DIEN_RA" | "DA_KET_THUC";
  members: CouncilMemberItem[];
  assignments?: {
    id: number;
    thesisId: number;
    orderNumber?: number | null;
    scheduledTime?: string | null;
    councilScore?: number | null;
    finalScore?: number | null;
    thesis: {
      title?: string;
      student?: { studentCode?: string; user?: { fullName: string } };
      supervisor?: { user?: { fullName: string } };
    };
    scores?: { lecturerId: number; score: number; comments?: string | null }[];
  }[];
}

export interface DefenseSubmission {
  id?: number;
  thesisId?: number;
  reportFileUrl: string;
  slideFileUrl?: string;
  sourceCodeUrl: string;
  plagiarismRate: number;
  plagiarismFileUrl?: string;
  supervisorScore?: number;
  supervisorDecision?: string;
  supervisorComments?: string;
  facultyApprovalStatus: string;
  thesis?: {
    reviewerAssignment?: { reviewerScore?: number };
    councilAssignment?: { councilScore?: number };
  };
}

export interface ReviewerAssignmentItem {
  id: number;
  thesisId: number;
  reviewerId: number;
  preliminaryNotes?: string | null;
  detailedReview?: string | null;
  decision?: "CHO_BAO_VE" | "KHONG_CHO_BAO_VE" | null;
  reviewerScore?: number | null;
  assignedAt?: string;
  thesis?: {
    id: number;
    title?: string;
    student?: { studentCode?: string; user?: { fullName: string } };
    supervisor?: { user?: { fullName: string } };
    defenseSubmission?: DefenseSubmission;
  };
}

export interface DashboardStats {
  totalTheses: number;
  kltnCount: number;
  cdtnCount: number;
  statusCounts: Record<string, number>;
  midtermDat: number;
  midtermCanhBao: number;
  midtermKhongDat: number;
  fields?: { id: number; name: string; _count: { theses: number } }[];
}

function getToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field?: string; message: string }[];
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    return res.ok
      ? { success: true, data: (json.data ?? json) as T, message: json.message }
      : {
          success: false,
          message: json.message || `Lỗi HTTP ${res.status}`,
          errors: json.errors,
        };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Không thể kết nối máy chủ",
    };
  }
}

async function upload(file: File): Promise<ApiResult<{ fileUrl: string }>> {
  const token = getToken();
  const body = new FormData();
  body.append("file", file);

  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.data?.fileUrl) {
      const fileUrl = json.data.fileUrl.startsWith("http")
        ? json.data.fileUrl
        : `http://localhost:4000${json.data.fileUrl}`;
      return { success: true, data: { fileUrl } };
    }
    return res.ok
      ? { success: true, data: json.data }
      : { success: false, message: json.message || "Không thể tải file" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Không thể tải file",
    };
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; refreshToken: string; user: UserResponse }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => request<UserResponse>("/auth/me"),
    forgotPassword: (email: string) =>
      request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  },
  students: {
    getAll: () => request<StudentItem[]>("/students"),
    getById: (id: number) => request<StudentItem>(`/students/${id}`),
    create: (body: object) =>
      request<StudentItem>("/students", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<StudentItem>(`/students/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => request(`/students/${id}`, { method: "DELETE" }),
    importExcel: async (file: File) => {
      const token = getToken();
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch(`${API_URL}/students/import-excel`, {
          method: "POST",
          body,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json().catch(() => ({}));
        return res.ok
          ? { success: true, data: json.data, message: json.message }
          : { success: false, message: json.message || "Lỗi tải file Excel" };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : "Lỗi kết nối" };
      }
    },
  },
  lecturers: {
    getAll: () => request<LecturerItem[]>("/lecturers"),
    getById: (id: number) => request<LecturerItem>(`/lecturers/${id}`),
    create: (body: object) =>
      request<LecturerItem>("/lecturers", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<LecturerItem>(`/lecturers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => request(`/lecturers/${id}`, { method: "DELETE" }),
  },
  theses: {
    getAll: (params?: { supervisorId?: number; semesterId?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.supervisorId) query.set("supervisorId", String(params.supervisorId));
      if (params?.semesterId) query.set("semesterId", String(params.semesterId));
      if (params?.status) query.set("status", params.status);
      const q = query.toString();
      return request<ThesisResponse[]>(`/theses${q ? `?${q}` : ""}`);
    },
    getById: (id: number) => request<ThesisResponse>(`/theses/${id}`),
    create: (body: object) =>
      request<ThesisResponse>("/theses", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<ThesisResponse>(`/theses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    confirm: (id: number, body: { accepted: boolean; note?: string }) =>
      request<ThesisResponse>(`/theses/${id}/confirm`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    setEligibility: (id: number, body: { isEligible: boolean; eligibilityNote?: string }) =>
      request<ThesisResponse>(`/theses/${id}/eligibility`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    assignFaculty: (
      id: number,
      body: { supervisorId: number; decisionCode: string; decisionDate?: string },
    ) =>
      request<ThesisResponse>(`/theses/${id}/assign-faculty`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  suggestions: {
    getAll: () => request<Suggestion[]>("/topic-suggestions"),
    create: (body: object) =>
      request<Suggestion>("/topic-suggestions", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<Suggestion>(`/topic-suggestions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) =>
      request(`/topic-suggestions/${id}`, { method: "DELETE" }),
  },
  semesters: {
    getAll: () => request<ActiveSemester[]>("/semesters"),
    active: () => request<ActiveSemester>("/semesters/active"),
    create: (body: object) =>
      request<ActiveSemester>("/semesters", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<ActiveSemester>(`/semesters/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => request(`/semesters/${id}`, { method: "DELETE" }),
  },
  fields: {
    getAll: () => request<ActiveField[]>("/fields"),
    active: () => request<ActiveField[]>("/fields/active"),
    create: (body: object) =>
      request<ActiveField>("/fields", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: object) =>
      request<ActiveField>(`/fields/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => request(`/fields/${id}`, { method: "DELETE" }),
  },
  changes: {
    getAll: () => request<ChangeRequestItem[]>("/change-requests"),
    getByThesis: (thesisId: number) =>
      request<ChangeRequestItem[]>(`/change-requests/thesis/${thesisId}`),
    create: (body: object) =>
      request("/change-requests", { method: "POST", body: JSON.stringify(body) }),
    review: (id: number, body: { status: "DA_DUYET" | "TU_CHOI"; reviewNotes?: string }) =>
      request(`/change-requests/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  supervision: {
    get: (id: number) => request<Log[]>(`/supervision-logs/thesis/${id}`),
    weeklyReport: (id: number, body: object) =>
      request<Log>(`/supervision-logs/thesis/${id}/weekly-report`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createLog: (body: {
      thesisId: number;
      meetingDate: string;
      content: string;
      tasksAssigned?: string;
      progressPercentage?: number;
    }) =>
      request<Log>("/supervision-logs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    confirmLog: (id: number, body?: { studentNotes?: string }) =>
      request(`/supervision-logs/${id}/confirm`, {
        method: "PATCH",
        body: JSON.stringify(body || {}),
      }),
  },
  evaluations: {
    midterm: (id: number) => request<MidtermEvaluation>(`/evaluations/${id}/midterm`),
    submitMidterm: (thesisId: number, body: { reportFileUrl: string }) =>
      request(`/evaluations/${thesisId}/midterm/submit`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    evaluateMidterm: (thesisId: number, body: { result: string; comments?: string }) =>
      request(`/evaluations/${thesisId}/midterm/evaluate`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    demo: (id: number) => request<CheckpointDemo>(`/evaluations/${id}/checkpoint`),
    scheduleDemo: (thesisId: number, body: { demoDate: string; location?: string }) =>
      request(`/evaluations/${thesisId}/checkpoint/schedule`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    evaluateDemo: (
      thesisId: number,
      body: { result: string; comments?: string; canDefend: boolean; disqualifiedRecordUrl?: string },
    ) =>
      request(`/evaluations/${thesisId}/checkpoint/evaluate`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  defense: {
    get: (id: number) => request<DefenseSubmission>(`/defense/submissions/${id}`),
    submit: (id: number, body: object) =>
      request<DefenseSubmission>(`/defense/submissions/${id}/submit`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    evaluateSupervisor: (
      thesisId: number,
      body: {
        supervisorScore: number;
        supervisorDecision: "CHO_BAO_VE" | "KHONG_CHO_BAO_VE";
        supervisorComments?: string;
      },
    ) =>
      request(`/defense/submissions/${thesisId}/supervisor-evaluate`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    facultyApproval: (
      thesisId: number,
      body: {
        facultyApprovalStatus: "DA_DUYET" | "TU_CHOI";
        notes?: string;
      },
    ) =>
      request(`/defense/submissions/${thesisId}/faculty-approval`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    reviewers: {
      getMyAssignments: () =>
        request<ReviewerAssignmentItem[]>("/defense/reviewers/my-assignments"),
      getByThesis: (thesisId: number) =>
        request<ReviewerAssignmentItem>(`/defense/reviewers/thesis/${thesisId}`),
      assign: (thesisId: number, reviewerId: number) =>
        request(`/defense/reviewers/thesis/${thesisId}/assign`, {
          method: "POST",
          body: JSON.stringify({ reviewerId }),
        }),
      evaluate: (
        thesisId: number,
        body: {
          preliminaryNotes?: string;
          detailedReview: string;
          decision: "CHO_BAO_VE" | "KHONG_CHO_BAO_VE";
          reviewerScore: number;
        },
      ) =>
        request(`/defense/reviewers/thesis/${thesisId}/evaluate`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },
    councils: {
      getAll: (semesterId?: number) => {
        const q = semesterId ? `?semesterId=${semesterId}` : "";
        return request<CouncilItem[]>(`/defense/councils${q}`);
      },
      getById: (id: number) => request<CouncilItem>(`/defense/councils/${id}`),
      create: (body: {
        semesterId: number;
        code: string;
        name: string;
        defenseDate?: string;
        location?: string;
        members: { lecturerId: number; role: "CHU_TICH" | "THU_KY" | "UY_VIEN" }[];
      }) =>
        request<CouncilItem>("/defense/councils", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      update: (id: number, body: object) =>
        request<CouncilItem>(`/defense/councils/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      assignThesis: (
        councilId: number,
        body: { thesisId: number; orderNumber?: number; scheduledTime?: string },
      ) =>
        request(`/defense/councils/${councilId}/theses`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      score: (
        assignmentId: number,
        body: { score: number; comments?: string },
      ) =>
        request(`/defense/councils/assignments/${assignmentId}/scores`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      finalizeMinute: (
        assignmentId: number,
        body: { minuteNotes?: string; minuteFileUrl?: string },
      ) =>
        request(`/defense/councils/assignments/${assignmentId}/finalize`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      close: (assignmentId: number) =>
        request(`/defense/councils/assignments/${assignmentId}/close`, {
          method: "PATCH",
        }),
    },
  },
  notifications: {
    getMy: () => request<NotificationResponse[]>("/notification"),
    getUnreadCount: () => request<{ count: number }>("/notification/unread-count"),
    markAsRead: (id: number) => request(`/notification/${id}/read`, { method: "PATCH" }),
    markAllAsRead: () => request("/notification/read-all", { method: "PATCH" }),
    create: (body: {
      userId: number;
      title: string;
      content: string;
      type?: string;
      link?: string;
    }) =>
      request("/notification", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createBulk: (body: {
      userIds: number[];
      title: string;
      content: string;
      type?: string;
      link?: string;
    }) =>
      request("/notification/bulk", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  dashboard: {
    stats: () => request<DashboardStats>("/dashboard/stats"),
    exportExcelUrl: () => `${API_URL}/dashboard/export`,
    exportExcel: async () => {
      const token = getToken();
      const res = await fetch(`${API_URL}/dashboard/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Không thể xuất file Excel");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Danh_Sach_KLTN_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  },
  forms: {
    getFormHtml: (id: number, code: string) =>
      request<{ html: string }>(`/forms/${id}/${code}`),
  },
  upload,
};
