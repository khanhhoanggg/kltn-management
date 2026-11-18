"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { StudentPortal } from "../components/dashboard/StudentPortal";
import { LecturerPortal } from "../components/dashboard/LecturerPortal";
import { AdminPortal } from "../components/dashboard/AdminPortal";

type PortalView = "student" | "lecturer" | "admin";

function DashboardRoot() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<PortalView | null>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
      return;
    }

    if (user?.roles && !activeView) {
      const roles = user.roles;
      if (roles.includes("ADMIN") || roles.includes("GIAO_VU") || roles.includes("LANH_DAO")) {
        setActiveView("admin");
      } else if (
        roles.includes("GVHD") ||
        roles.includes("GVPB") ||
        roles.includes("THANH_VIEN_HD") ||
        roles.includes("THU_KY_HD")
      ) {
        setActiveView("lecturer");
      } else {
        setActiveView("student");
      }
    }
  }, [isLoading, token, user, activeView, router]);

  if (isLoading || !token || !activeView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-[#090f1d] dark:text-slate-400">
        Đang tải hệ thống...
      </div>
    );
  }

  // Cho phép chuyển đổi nhanh giữa các giao diện nếu là Admin/Giáo vụ
  const canSwitchView =
    user?.roles?.includes("ADMIN") ||
    user?.roles?.includes("GIAO_VU") ||
    user?.roles?.includes("LANH_DAO");

  return (
    <div className="relative">
      {canSwitchView && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 text-xs font-semibold">
          <span className="px-2 text-slate-400">Giao diện:</span>
          <button
            onClick={() => setActiveView("admin")}
            className={`rounded-full px-2.5 py-1 ${activeView === "admin" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-sky-600 dark:text-slate-300"}`}
          >
            Quản trị
          </button>
          <button
            onClick={() => setActiveView("lecturer")}
            className={`rounded-full px-2.5 py-1 ${activeView === "lecturer" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-sky-600 dark:text-slate-300"}`}
          >
            Giảng viên
          </button>
          <button
            onClick={() => setActiveView("student")}
            className={`rounded-full px-2.5 py-1 ${activeView === "student" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-sky-600 dark:text-slate-300"}`}
          >
            Sinh viên
          </button>
        </div>
      )}

      {activeView === "admin" && <AdminPortal />}
      {activeView === "lecturer" && <LecturerPortal />}
      {activeView === "student" && <StudentPortal />}
    </div>
  );
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
