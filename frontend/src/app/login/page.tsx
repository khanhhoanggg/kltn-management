"use client";

import React, { useState } from "react";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { AuthProvider } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

function ModernLoginContent() {
  const router = useRouter();
  const { login, forgotPassword } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập Email!");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập Mật khẩu!");
      return;
    }

    setLoading(true);
    const res = await login(email, password, true);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } else {
      setErrorMsg(res.message || "Email hoặc mật khẩu không chính xác!");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!forgotEmail.trim()) {
      setErrorMsg("Vui lòng nhập Email!");
      return;
    }

    setLoading(true);
    const res = await forgotPassword(forgotEmail);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || "Đã gửi liên kết khôi phục tới email của bạn!");
    } else {
      setErrorMsg(res.message || "Không thể gửi yêu cầu!");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 relative overflow-hidden"
      style={{
        backgroundImage: `url('/geometric-bg.svg')`,
        backgroundSize: "260px 260px",
        backgroundRepeat: "repeat",
        backgroundColor: "#0d1e44",
      }}
    >
      {/* Dark overlay in dark mode */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 pointer-events-none" />

      {/* Theme Toggle Button ở góc trên bên phải */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="!rounded-full shadow-lg !bg-white/90 dark:!bg-slate-800/90" />
      </div>

      {/* ================= KHỐI THẺ CHÍNH (CARD 2 CỘT CHUẨN MẪU ẢNH) ================= */}
      <div className="relative z-10 w-full max-w-[860px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* ================= CỘT TRÁI: FORM ĐĂNG NHẬP / QUÊN MẬT KHẨU ================= */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">
          
          {mode === "login" ? (
            <div>
              {/* Tiêu đề & phụ đề */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0e2a47] dark:text-white tracking-tight">
                  Đăng nhập
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-[270px] mx-auto leading-relaxed">
                  Dùng email và mật khẩu được Khoa cấp hoặc đã đăng ký.
                </p>
              </div>

              {/* Thông báo lỗi / thành công */}
              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs text-center">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs text-center">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Ô nhập Email */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder="Email *"
                      className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#0e2a47] dark:focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Ô nhập Mật khẩu */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder="Mật khẩu *"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#0e2a47] dark:focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Ẩn hiện mật khẩu"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quên mật khẩu link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      setMode("forgot");
                    }}
                    className="text-xs sm:text-[13px] text-[#0284c7] hover:underline cursor-pointer font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Nút Đăng nhập xanh đậm */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-md font-semibold text-white bg-[#0e2a47] hover:bg-[#0a1e33] active:scale-[0.99] transition duration-150 disabled:opacity-60 text-sm shadow-sm cursor-pointer mt-1"
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>
            </div>
          ) : (
            /* ================= VIEW: KHÔI PHỤC MẬT KHẨU ================= */
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0e2a47] dark:text-white tracking-tight">
                  Khôi phục mật khẩu
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-[270px] mx-auto leading-relaxed">
                  Nhập email của bạn để nhận liên kết khôi phục.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs text-center">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs text-center">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="Email *"
                    className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#0e2a47] dark:focus:border-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-md font-semibold text-white bg-[#0e2a47] hover:bg-[#0a1e33] active:scale-[0.99] transition duration-150 disabled:opacity-60 text-sm shadow-sm cursor-pointer mt-1"
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      setMode("login");
                    }}
                    className="text-xs text-[#0284c7] hover:underline cursor-pointer font-medium"
                  >
                    ← Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ================= CỘT PHẢI: KHỐI ĐỎ GRADIENT QUẢN LÝ THỰC TẬP ================= */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 bg-gradient-to-br from-[#850824] via-[#a30b2e] to-[#dc143c] text-white flex flex-col items-center justify-center text-center select-none min-h-[220px] md:min-h-full">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quản lý thực tập
          </h2>
          <p className="text-xs sm:text-[13px] text-white/90 mt-3 max-w-[260px] leading-relaxed">
            Hệ thống quản lý sinh viên tham gia học phần thực tập
          </p>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModernLoginContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
