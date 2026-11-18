"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  studentCode?: string;
  className?: string;
  cohort?: string;
  major?: string;
  department?: string;
  degree?: string;
  staffCode?: string;
  phone?: string;
  gender?: string;
  idCard?: string;
  student?: { id?: number; studentCode?: string; className?: string; cohort?: string; major?: string };
  lecturer?: { id?: number; staffCode?: string; degree?: string; title?: string; department?: string };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, remember: boolean) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  forgotPassword: async () => ({ success: false }),
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên và lấy thông tin user thực từ Backend API
  const refreshProfile = async () => {
    const savedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    // Gọi API /api/auth/me để lấy dữ liệu thực từ PostgreSQL
    const res = await api.auth.getMe();
    if (res.success && res.data) {
      const u = res.data;
      const formattedUser: User = {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        roles: u.roles || (u.rolesList ? u.rolesList : []),
        studentCode: u.student?.studentCode,
        className: u.student?.className,
        cohort: u.student?.cohort,
        major: u.student?.major,
        department: u.lecturer?.department,
        degree: u.lecturer?.degree,
        staffCode: u.lecturer?.staffCode,
        student: u.student,
        lecturer: u.lecturer,
        phone: u.phone,
      };
      setUser(formattedUser);
    } else {
      // Token hết hạn hoặc không kết nối được
      const cached = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          // Bỏ qua lỗi parse
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (identifier: string, password: string, remember: boolean) => {
    setIsLoading(true);
    const res = await api.auth.login(identifier, password);
    setIsLoading(false);

    if (res.success && res.data) {
      const { accessToken, user: backendUser } = res.data;
      const formattedUser: User = {
        id: backendUser.id,
        email: backendUser.email,
        fullName: backendUser.fullName,
        roles: backendUser.roles || [],
        studentCode: backendUser.student?.studentCode,
        className: backendUser.student?.className,
        department: backendUser.lecturer?.department,
        degree: backendUser.lecturer?.degree,
        staffCode: backendUser.lecturer?.staffCode,
        student: backendUser.student,
        lecturer: backendUser.lecturer,
        phone: backendUser.phone,
      };

      setUser(formattedUser);
      setToken(accessToken);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("auth_token", accessToken);
      storage.setItem("auth_user", JSON.stringify(formattedUser));

      return { success: true };
    }

    return {
      success: false,
      message: res.message || "Tài khoản hoặc mật khẩu không chính xác!",
    };
  };

  const forgotPassword = async (email: string) => {
    return api.auth.forgotPassword(email);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, forgotPassword, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
