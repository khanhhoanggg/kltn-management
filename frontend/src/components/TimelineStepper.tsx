"use client";

import React from "react";

interface TimelineStepperProps {
  status: string;
}

interface Step {
  id: number;
  label: string;
  time: string;
  description: string;
  matchedStatuses: string[];
}

const steps: Step[] = [
  {
    id: 1,
    label: "Đăng ký đề tài",
    time: "Tuần 1-2",
    description: "Nộp BM-01 & BM-02",
    matchedStatuses: ["CHUA_DANG_KY"],
  },
  {
    id: 2,
    label: "GVHD xác nhận",
    time: "Tuần 2",
    description: "Thông qua đề cương",
    matchedStatuses: ["CHO_GVHD_XAC_NHAN"],
  },
  {
    id: 3,
    label: "Khoa giao đề tài",
    time: "Cuối T2",
    description: "Ra QĐ & Khóa đề tài (BR-03)",
    matchedStatuses: ["CHO_KHOA_GIAO"],
  },
  {
    id: 4,
    label: "Thực hiện & Giữa kỳ",
    time: "Tuần 3-7",
    description: "BM-03 (≥ 40% khối lượng)",
    matchedStatuses: ["DANG_THUC_HIEN"],
  },
  {
    id: 5,
    label: "Check-point Demo",
    time: "Tuần 11",
    description: "Kiểm tra sản phẩm (≥ 70%)",
    matchedStatuses: ["DA_DANH_GIA_GIUA_KY"],
  },
  {
    id: 6,
    label: "Nộp hồ sơ bảo vệ",
    time: "Tuần 13",
    description: "Bản cứng & Đạo văn < 20%",
    matchedStatuses: ["DA_KIEM_TRA_DEMO", "CHO_DUYET_HO_SO"],
  },
  {
    id: 7,
    label: "GVPB phản biện",
    time: "Tuần 14",
    description: "BM-06 & Cho phép bảo vệ",
    matchedStatuses: ["CHO_PHAN_BIEN"],
  },
  {
    id: 8,
    label: "Bảo vệ Hội đồng",
    time: "Tuần 15-16",
    description: "Chấm điểm BM-07 & Lưu hồ sơ",
    matchedStatuses: ["DU_DIEU_KIEN_BAO_VE", "DA_BAO_VE", "DA_LUU_HO_SO"],
  },
];

export default function TimelineStepper({ status }: TimelineStepperProps) {
  // Tìm step index hiện tại (1-based)
  const currentStepIndex = steps.findIndex((s) => s.matchedStatuses.includes(status));
  const activeStep = currentStepIndex !== -1 ? currentStepIndex + 1 : 1;
  const isDisqualified = status === "KHONG_DU_DIEU_KIEN";

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#10192e]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">
            Tiến trình Khóa luận / Chuyên đề tốt nghiệp (UC-04)
          </h3>
          <p className="text-xs text-slate-500">
            Quy trình chuẩn 3 giai đoạn – 8 bước của Khoa Công nghệ Thông tin
          </p>
        </div>
        {isDisqualified && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            Dừng quy trình: Không đủ điều kiện bảo vệ
          </span>
        )}
      </div>

      {/* Stepper Container */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[720px] items-start justify-between">
          {steps.map((step) => {
            const isCompleted = !isDisqualified && step.id < activeStep;
            const isCurrent = !isDisqualified && step.id === activeStep;

            return (
              <div key={step.id} className="relative flex flex-1 flex-col items-center px-1 text-center">
                {/* Connecting Line */}
                {step.id < steps.length && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-200 -z-0 ${
                      step.id < activeStep && !isDisqualified
                        ? "bg-sky-500"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}

                {/* Circle Icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? "bg-sky-600 text-white shadow-sm"
                      : isCurrent
                        ? "bg-white border-2 border-sky-600 text-sky-600 ring-4 ring-sky-100 dark:bg-slate-900 dark:text-sky-400 dark:ring-sky-950"
                        : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}
                </div>

                {/* Step Info */}
                <p
                  className={`mt-2 text-xs font-bold ${
                    isCurrent
                      ? "text-sky-600 dark:text-sky-400"
                      : isCompleted
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {step.time}
                </span>
                <span className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[90px]">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
