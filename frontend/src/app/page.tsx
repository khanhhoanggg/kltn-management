"use client";

import React, { useState, useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { api, NotificationResponse, ThesisResponse } from "../lib/api";
import { useRouter } from "next/navigation";

type NavTab = "news" | "internship" | "progress" | "midterm" | "defense" | "council" | "forms";

function DashboardApp() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>("news");
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Chuyển hướng sang /login nếu chưa đăng nhập
  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  // Tải dữ liệu thực tế từ Backend API
  useEffect(() => {
    if (token) {
      loadBackendData();
    }
  }, [token]);

  const loadBackendData = async () => {
    setLoadingData(true);
    try {
      // 1. Lấy thông báo thực từ API: GET /api/notification
      const notifRes = await api.notifications.getMy();
      if (notifRes.success && Array.isArray(notifRes.data)) {
        setNotifications(notifRes.data);
      }

      // 2. Lấy số lượng thông báo chưa đọc: GET /api/notification/unread-count
      const unreadRes = await api.notifications.getUnreadCount();
      if (unreadRes.success && unreadRes.data?.count !== undefined) {
        setUnreadCount(unreadRes.data.count);
      }

      // 3. Lấy đề tài thực từ API: GET /api/theses
      const thesisRes = await api.theses.getAll();
      if (thesisRes.success && Array.isArray(thesisRes.data)) {
        setTheses(thesisRes.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu từ Backend:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Tên hiển thị & viết tắt
  const fullName = user?.fullName || "Sinh viên";
  const studentCode = user?.studentCode || (user?.email ? user.email.split("@")[0] : "SV");
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase() || "SV";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#090f1d] text-slate-500 text-sm">
        Đang tải dữ liệu từ máy chủ...
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090f1d] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* ======================= SIDEBAR TRÁI (NAVY BLUE) ======================= */}
      <aside className="w-64 bg-[#0c2340] text-white flex-shrink-0 flex flex-col justify-between shadow-xl z-20 select-none">
        <div>
          {/* Header Sidebar: Icon mũ tốt nghiệp đỏ */}
          <div className="p-4 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-md text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm tracking-tight truncate text-white">
                Quản lý thực tập
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                Khoa CNTT - ĐH Thăng L...
              </span>
            </div>
          </div>

          {/* Danh sách Buttons điều hướng */}
          <nav className="p-3 space-y-1.5">
            {[
              { id: "news", label: "Tin tức", icon: "📰" },
              { id: "internship", label: "Thực tập", icon: "👤" },
              { id: "progress", label: "Báo cáo tiến độ", icon: "📑" },
              { id: "midterm", label: "Đánh giá giữa kỳ & Demo", icon: "💻" },
              { id: "defense", label: "Hồ sơ bảo vệ", icon: "📁" },
              { id: "council", label: "Hội đồng & Điểm", icon: "👥" },
              { id: "forms", label: "Biểu mẫu (BM01-07)", icon: "📝" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#0284c7] text-white shadow-md"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dưới cùng Sidebar: Pill người dùng thực từ Database + Đăng xuất */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-white truncate">
                  {fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {studentCode}
                </span>
              </div>
            </div>
            <span className="text-slate-400 text-xs">›</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ======================= NỘI DUNG CHÍNH (BÊN PHẢI) ======================= */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-[#10192e] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 transition-colors">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab("news")}
              className="hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              🏠
            </button>
            <span>/</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {activeTab === "news" && "Tin tức"}
              {activeTab === "internship" && "Thực tập"}
              {activeTab === "progress" && "Báo cáo tiến độ"}
              {activeTab === "midterm" && "Đánh giá giữa kỳ & Demo"}
              {activeTab === "defense" && "Hồ sơ bảo vệ"}
              {activeTab === "council" && "Hội đồng & Điểm"}
              {activeTab === "forms" && "Biểu mẫu quy định"}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Chuông Thông báo kết nối API Backend */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationModal(!showNotificationModal)}
                title="Xem thông báo"
                aria-label="Thông báo"
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition relative cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popup Thông báo */}
              {showNotificationModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 dark:text-white">
                      Thông báo từ Khoa ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Chưa có thông báo nào từ máy chủ
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            !item.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </h4>
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {item.content || item.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle className="!rounded-full shadow-xs" />
          </div>
        </header>

        {/* Khung Nội dung tương ứng theo từng Tab */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {/* ===================== TAB 1: TIN TỨC ===================== */}
          {activeTab === "news" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Tin tức
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Thông báo từ Khoa về lịch, quy định và các hoạt động thực tập.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadBackendData}
                  disabled={loadingData}
                  className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>{loadingData ? "Đang đồng bộ..." : "Làm mới"}</span>
                </button>
              </div>

              {/* Nếu không có tin tức nào từ Backend -> hiển thị giao diện trống chuẩn ảnh */}
              {notifications.length === 0 ? (
                <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-12 min-h-[380px] flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-[#f0f9ff] dark:bg-sky-950/50 flex items-center justify-center text-[#0284c7] mb-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                      <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                    </svg>
                  </div>

                  <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100">
                    Chưa có tin tức nào
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Các thông báo mới từ Khoa sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white dark:bg-[#10192e] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition"
                    >
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN") : "Thông báo mới"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-2">
                        {n.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {n.content || n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: THỰC TẬP & ĐỀ TÀI (KẾT NỐI API) ===================== */}
          {activeTab === "internship" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Thực tập & Khóa luận
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Dữ liệu đề tài thực tế từ cơ sở dữ liệu hệ thống.
                </p>
              </div>

              {theses.length === 0 ? (
                <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                  Bạn chưa có đề tài khóa luận hoặc thực tập nào được ghi nhận trong học kỳ này.
                </div>
              ) : (
                <div className="space-y-4">
                  {theses.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Tên đề tài</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {t.title || "Chưa đặt tên đề tài"}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Giảng viên hướng dẫn</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {t.supervisor?.user?.fullName || "Chưa phân công GVHD"}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Loại hình & Lĩnh vực</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-1">
                            {t.type} - {t.field?.name || "Chung"}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 uppercase font-semibold">Trạng thái</span>
                          <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">
                            ● {t.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: BÁO CÁO TIẾN ĐỘ ===================== */}
          {activeTab === "progress" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Báo cáo tiến độ
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Nhật ký hướng dẫn trao đổi định kỳ (Supervision logs).
                </p>
              </div>

              <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                Chưa có nhật ký trao đổi nào được ghi nhận cho học kỳ hiện tại.
              </div>
            </div>
          )}

          {/* ===================== TAB 4: ĐÁNH GIÁ GIỮA KỲ ===================== */}
          {activeTab === "midterm" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Đánh giá giữa kỳ & Checkpoint Demo
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Kết quả đánh giá từ Giảng viên hướng dẫn.
                </p>
              </div>

              <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                Chưa đến đợt đánh giá tiến độ giữa kỳ.
              </div>
            </div>
          )}

          {/* ===================== TAB 5: HỒ SƠ BẢO VỆ ===================== */}
          {activeTab === "defense" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Hồ sơ bảo vệ & Chấm phản biện
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Nộp tài liệu báo cáo và kết quả chấm của GVPB.
                </p>
              </div>

              <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                Hệ thống chưa mở cổng nộp hồ sơ bảo vệ cho học kỳ này.
              </div>
            </div>
          )}

          {/* ===================== TAB 6: HỘI ĐỒNG & ĐIỂM ===================== */}
          {activeTab === "council" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Hội đồng bảo vệ & Điểm số
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Bảng điểm tổng hợp chính thức theo trọng số 30% - 20% - 50%.
                </p>
              </div>

              <div className="bg-white dark:bg-[#10192e] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                Chưa có lịch phân công hội đồng bảo vệ.
              </div>
            </div>
          )}

          {/* ===================== TAB 7: BIỂU MẪU ===================== */}
          {activeTab === "forms" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Biểu mẫu quy định (BM01 - BM07)
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Danh mục biểu mẫu chuẩn hóa kết nối với API sinh biểu mẫu HTML Backend.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { code: "BM-01", name: "Phiếu đăng ký đề tài" },
                  { code: "BM-02", name: "Danh sách giao đề tài chính thức" },
                  { code: "BM-03", name: "Phiếu đánh giá tiến độ & Demo" },
                  { code: "BM-04", name: "Đơn xin thay đổi đề tài / GVHD" },
                  { code: "BM-05", name: "Phiếu nhận xét của GVHD" },
                  { code: "BM-06", name: "Phiếu nhận xét của GVPB" },
                  { code: "BM-07", name: "Biên bản chấm điểm Hội đồng" },
                ].map((f) => (
                  <div
                    key={f.code}
                    className="p-4 rounded-xl bg-white dark:bg-[#10192e] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm shadow-xs"
                  >
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">{f.code}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{f.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Mẫu chuẩn
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
