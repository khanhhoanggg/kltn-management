"use client";

import React from "react";

export default function ThangLongLogo({
  subTitle = "CỔNG THÔNG TIN ĐÀO TẠO",
}: {
  subTitle?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center select-none space-y-2">
      {/* Logo biểu tượng Thang Long University */}
      <div className="flex items-center gap-2">
        <svg
          className="w-8 h-8"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Nét đỏ cong chữ T */}
          <path
            d="M24 20 C 26 48, 34 78, 52 90 C 44 72, 38 42, 44 24 Z"
            fill="#B91C1C"
          />
          <path
            d="M40 20 C 58 20, 84 24, 54 90 C 62 66, 60 42, 50 26 Z"
            fill="#DC2626"
          />
          {/* Nét xanh navy */}
          <path
            d="M24 20 L 50 20 C 32 40, 27 58, 22 72 Z"
            fill="#1E3A8A"
            opacity="0.9"
          />
        </svg>

        <div className="text-left flex flex-col justify-center leading-none">
          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Thang Long
          </span>
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-tight">
            University
          </span>
        </div>
      </div>

      {/* Tên trường & Tên cổng thông tin */}
      <div className="space-y-0.5">
        <div className="text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
          TRƯỜNG ĐẠI HỌC THĂNG LONG
        </div>
        <div className="text-sm sm:text-base font-black tracking-wide text-[#1E3A8A] dark:text-blue-400 uppercase">
          {subTitle}
        </div>
      </div>
    </div>
  );
}
