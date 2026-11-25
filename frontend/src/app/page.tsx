"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { StudentPortal } from "../components/dashboard/StudentPortal";
import { LecturerPortal } from "../components/dashboard/LecturerPortal";
import { AdminPortal } from "../components/dashboard/AdminPortal";

function DashboardRoot() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-[#090f1d] dark:text-slate-400">
        Đang tải hệ thống...
      </div>
    );
  }

  const roles = user.roles ?? [];
  if (roles.includes("ADMIN") || roles.includes("GIAO_VU") || roles.includes("LANH_DAO")) {
    return <AdminPortal />;
  }
  if (
    roles.includes("GVHD") ||
    roles.includes("GVPB") ||
    roles.includes("THANH_VIEN_HD") ||
    roles.includes("THU_KY_HD")
  ) {
    return <LecturerPortal />;
  }

  return <StudentPortal />;
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardRoot />
      </AuthProvider>
    </ThemeProvider>
  );
}
