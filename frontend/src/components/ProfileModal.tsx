"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ text: "Vui lòng nhập mật khẩu hiện tại", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: "Mật khẩu mới phải có tối thiểu 6 ký tự", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Xác nhận mật khẩu mới không khớp", type: "error" });
      return;
    }

    setLoading(true);
    const res = await api.auth.changePassword({ currentPassword, newPassword });
    setLoading(false);

    if (res.success) {
      setMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ text: res.message || "Đổi mật khẩu thất bại", type: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#10192e]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab("info");
                setMessage(null);
              }}
              className={`text-base font-bold pb-1 border-b-2 transition ${
                activeTab === "info"
                  ? "border-sky-600 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              Hồ sơ cá nhân (UC-02)
            </button>
            <button
              onClick={() => {
                setActiveTab("password");
                setMessage(null);
              }}
              className={`text-base font-bold pb-1 border-b-2 transition ${
                activeTab === "password"
                  ? "border-sky-600 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              Đổi mật khẩu
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {message && (
            <div
              className={`mb-4 rounded-lg p-3 text-xs font-semibold ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === "info" ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="w-32 font-medium text-slate-500">Họ và tên:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{user.fullName}</span>
              </div>
              <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="w-32 font-medium text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                  <span className="w-32 font-medium text-slate-500">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                <span className="w-32 font-medium text-slate-500">Vai trò:</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {user.roles?.join(", ") || "Người dùng"}
                </span>
              </div>

              {/* Thông tin sinh viên nếu có */}
              {user.student && (
                <>
                  <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                    <span className="w-32 font-medium text-slate-500">MSSV:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {user.student.studentCode}
                    </span>
                  </div>
                  {user.student.className && (
                    <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                      <span className="w-32 font-medium text-slate-500">Lớp:</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {user.student.className}
                      </span>
                    </div>
                  )}
                  {user.student.major && (
                    <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                      <span className="w-32 font-medium text-slate-500">Ngành:</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {user.student.major}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Thông tin giảng viên nếu có */}
              {user.lecturer && (
                <>
                  {user.lecturer.staffCode && (
                    <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                      <span className="w-32 font-medium text-slate-500">Mã giảng viên:</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {user.lecturer.staffCode}
                      </span>
                    </div>
                  )}
                  {user.lecturer.degree && (
                    <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                      <span className="w-32 font-medium text-slate-500">Học vị / Học hàm:</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {user.lecturer.degree}
                      </span>
                    </div>
                  )}
                  {user.lecturer.department && (
                    <div className="flex items-center gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                      <span className="w-32 font-medium text-slate-500">Bộ môn:</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {user.lecturer.department}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Lưu mật khẩu mới"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
