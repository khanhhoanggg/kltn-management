const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  roles?: string[];
  rolesList?: string[];
  student?: { id?: number; studentCode: string; className?: string; cohort?: string; major?: string };
  lecturer?: { id?: number; staffCode?: string; degree?: string; title?: string; department?: string; maxStudents?: number };
}

export interface NotificationResponse {
  id: number;
  title: string;
  content?: string;
  message?: string;
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
  field?: { id: number; name: string };
  semester?: { id: number; name: string };
  student?: { id: number; studentCode?: string; user?: { fullName: string; email?: string } };
  supervisor?: { id: number; degree?: string; user?: { fullName: string; email?: string } };
  defenseSubmission?: DefenseSubmission;
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
  result?: string;
  comments?: string;
  evaluationDate?: string;
}

export interface CheckpointDemo {
  result?: string;
  demoDate?: string;
  notes?: string;
}

export interface ActiveSemester {
  id: number;
  name: string;
  code?: string;
}

export interface ActiveField {
  id: number;
  name: string;
}

export interface DefenseSubmission {
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

export type ApiResult<T> = { success: boolean; data?: T; message?: string };

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
      : { success: false, message: json.message || `Lỗi HTTP ${res.status}` };
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
  },
  notifications: {
    getMy: () => request<NotificationResponse[]>("/notification"),
    getUnreadCount: () => request<{ count: number }>("/notification/unread-count"),
    markAllAsRead: () => request("/notification/read-all", { method: "PATCH" }),
  },
  theses: {
    getAll: (params?: { supervisorId?: number; semesterId?: number }) => {
      const query = new URLSearchParams();
      if (params?.supervisorId) query.set("supervisorId", String(params.supervisorId));
      if (params?.semesterId) query.set("semesterId", String(params.semesterId));
      const q = query.toString();
      return request<ThesisResponse[]>(`/theses${q ? `?${q}` : ""}`);
    },
    getById: (id: number) => request<ThesisResponse>(`/theses/${id}`),
    create: (body: object) =>
      request<ThesisResponse>("/theses", { method: "POST", body: JSON.stringify(body) }),
    confirm: (id: number, body: { accepted: boolean; note?: string }) =>
      request<ThesisResponse>(`/theses/${id}/confirm`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },
  suggestions: {
    getAll: () => request<Suggestion[]>("/topic-suggestions"),
    create: (body: object) =>
      request<Suggestion>("/topic-suggestions", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: number) =>
      request(`/topic-suggestions/${id}`, { method: "DELETE" }),
  },
  semesters: {
    active: () => request<ActiveSemester>("/semesters/active"),
  },
  fields: {
    active: () => request<ActiveField[]>("/fields/active"),
  },
  changes: {
    create: (body: object) =>
      request("/change-requests", { method: "POST", body: JSON.stringify(body) }),
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
  },
  evaluations: {
    midterm: (id: number) => request<MidtermEvaluation>(`/evaluations/${id}/midterm`),
    evaluateMidterm: (thesisId: number, body: { result: string; comments?: string }) =>
      request(`/evaluations/${thesisId}/midterm/evaluate`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    demo: (id: number) => request<CheckpointDemo>(`/evaluations/${id}/checkpoint`),
    evaluateDemo: (thesisId: number, body: { result: string; notes?: string }) =>
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
  },
  dashboard: {
    stats: () => request<DashboardStats>("/dashboard/stats"),
  },
  forms: {
    getFormHtml: (id: number, code: string) =>
      request<{ html: string }>(`/forms/${id}/${code}`),
  },
  upload,
};
