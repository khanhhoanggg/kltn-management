const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  roles?: string[];
  rolesList?: string[];
  student?: {
    studentCode: string;
    className?: string;
    cohort?: string;
    major?: string;
  };
  lecturer?: {
    staffCode?: string;
    department?: string;
  };
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
  type: string;
  status: string;
  field?: { name: string };
  supervisor?: {
    user?: { fullName: string };
  };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return {
        success: false,
        message: (json.message as string) || `Lỗi HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      data: (json.data !== undefined ? json.data : json) as T,
      message: json.message as string,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`API Call failed: ${endpoint}`, err);
    return {
      success: false,
      message: err.message || "Không thể kết nối đến máy chủ Backend (Port 4000)",
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
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },

  notifications: {
    getMy: () => request<NotificationResponse[]>("/notification"),
    getUnreadCount: () => request<{ count: number }>("/notification/unread-count"),
    markAsRead: (id: number) =>
      request<unknown>(`/notification/${id}/read`, { method: "PATCH" }),
    markAllAsRead: () =>
      request<unknown>("/notification/read-all", { method: "PATCH" }),
  },

  theses: {
    getAll: () => request<ThesisResponse[]>("/theses"),
    getById: (id: number) => request<ThesisResponse>(`/theses/${id}`),
  },

  forms: {
    getFormHtml: (thesisId: number, formCode: string) =>
      request<{ html: string }>(`/forms/${thesisId}/${formCode}`),
  },
};
