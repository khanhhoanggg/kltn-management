"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  ActiveField,
  ActiveSemester,
  DashboardStats,
  ThesisResponse,
} from "../../lib/api";

type AdminTab = "overview" | "theses" | "config";

const statusText: Record<string, string> = {
  CHUA_DANG_KY: "Chưa đăng ký",
  CHO_GVHD_XAC_NHAN: "Chờ GVHD xác nhận",
  CHO_KHOA_GIAO: "Chờ Khoa giao",
  DANG_THUC_HIEN: "Đang thực hiện",
  DA_DANH_GIA_GIUA_KY: "Đã đánh giá giữa kỳ",
  DA_KIEM_TRA_DEMO: "Đã kiểm tra Demo",
  CHO_DUYET_HO_SO: "Chờ duyệt hồ sơ",
  CHO_PHAN_BIEN: "Chờ phản biện",
  DU_DIEU_KIEN_BAO_VE: "Đủ điều kiện bảo vệ",
  DA_BAO_VE: "Đã bảo vệ",
  KHONG_DU_DIEU_KIEN: "Không đủ điều kiện",
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#10192e] ${className}`}>
    {children}
  </section>
);

const Button = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={
      "rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 " +
      className
    }
  >
    {children}
  </button>
);

export function AdminPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [fields, setFields] = useState<ActiveField[]>([]);
  const [semester, setSemester] = useState<ActiveSemester | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    const [statsRes, thesesRes, fieldsRes, semRes] = await Promise.all([
      api.dashboard.stats(),
      api.theses.getAll(),
      api.fields.active(),
      api.semesters.active(),
    ]);
    if (statsRes.data) setStats(statsRes.data);
    if (thesesRes.data) setTheses(thesesRes.data);
    if (fieldsRes.data) setFields(fieldsRes.data);
    if (semRes.data) setSemester(semRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTheses = theses.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.student?.user?.fullName?.toLowerCase().includes(q) ||
      t.student?.studentCode?.toLowerCase().includes(q) ||
      t.supervisor?.user?.fullName?.toLowerCase().includes(q)
    );
  });

  const nav: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Tổng quan Dashboard", icon: "📊" },
    { id: "theses", label: "Quản lý Đề tài", icon: "📑" },
    { id: "config", label: "Học kỳ & Lĩnh vực", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-[#090f1d] dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#111c2e] text-white md:flex">
        <div className="border-b border-white/10 p-5">
          <p className="font-bold">Quản lý KLTN/CĐTN</p>
          <p className="mt-1 text-xs text-sky-400">Giáo vụ & Ban Chủ nhiệm Khoa</p>
        </div>
        <nav className="flex-1 p-3">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={
                "mb-1 w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition " +
                (tab === item.id ? "bg-sky-600 font-semibold" : "text-slate-300 hover:bg-white/10")
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="font-semibold">{user?.fullName}</p>
          <p className="mb-3 text-xs text-slate-400">{user?.email}</p>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="text-slate-300 hover:text-white"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-[#10192e]">
          <div>
            <p className="text-sm text-slate-500">Cổng Quản trị & Giáo vụ Khoa CNTT</p>
            <h1 className="font-bold text-slate-900 dark:text-white">
              {nav.find((x) => x.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {semester && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {semester.name}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Thống kê KLTN / CĐTN</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tổng hợp số liệu tiến độ của học kỳ hiện tại.
                  </p>
                </div>
                <Button onClick={load}>Cập nhật số liệu</Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <p className="text-xs font-medium text-slate-500">Tổng số đề tài</p>
                  <p className="mt-2 text-3xl font-bold text-sky-600">
                    {stats?.totalTheses ?? theses.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stats?.kltnCount ?? 0} KLTN · {stats?.cdtnCount ?? 0} CĐTN
                  </p>
                </Card>

                <Card>
                  <p className="text-xs font-medium text-slate-500">Đang thực hiện</p>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">
                    {stats?.statusCounts?.DANG_THUC_HIEN ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Đã giao GVHD chính thức</p>
                </Card>

                <Card>
                  <p className="text-xs font-medium text-slate-500">Đạt Giữa kỳ / Demo</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {stats?.midtermDat ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-rose-500 font-semibold">
                    {stats?.midtermCanhBao ?? 0} cảnh báo tiến độ
                  </p>
                </Card>

                <Card>
                  <p className="text-xs font-medium text-slate-500">Đủ điều kiện bảo vệ</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {stats?.statusCounts?.DU_DIEU_KIEN_BAO_VE ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Chờ phân công Hội đồng</p>
                </Card>
              </div>

              <Card>
                <h3 className="font-bold">Tiến độ phân bổ theo trạng thái hồ sơ</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(stats?.statusCounts || {}).map(([st, count]) => (
                    <div
                      key={st}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {statusText[st] || st}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ ĐỀ TÀI */}
          {tab === "theses" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Danh sách đề tài toàn trường</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tra cứu và theo dõi trạng thái đề tài của toàn bộ sinh viên.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên đề tài, SV, GVHD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <Card className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Mã hồ sơ</th>
                      <th className="px-4 py-3">Tên đề tài</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">GVHD</th>
                      <th className="px-4 py-3">Lĩnh vực</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTheses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Không tìm thấy đề tài nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredTheses.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 font-semibold text-slate-500">#{t.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-[280px]">
                            {t.title || "Chưa đặt tên"}
                            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{t.student?.user?.fullName || "—"}</p>
                            <p className="text-xs text-slate-400">{t.student?.studentCode || "—"}</p>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {t.supervisor?.user?.fullName || "Chưa phân công"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {t.field?.name || "Chưa chọn"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {statusText[t.status] || t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* TAB 3: HỌC KỲ & LĨNH VỰC */}
          {tab === "config" && (
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <h3 className="font-bold text-lg">Học kỳ hiện tại</h3>
                {semester ? (
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      Tên học kỳ: <b>{semester.name}</b>
                    </p>
                    <p>
                      Mã học kỳ: <code>{semester.code}</code>
                    </p>
                    <p>
                      Trạng thái:{" "}
                      <span className="font-semibold text-emerald-600">Đang kích hoạt</span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Chưa có học kỳ nào được kích hoạt.</p>
                )}
              </Card>

              <Card>
                <h3 className="font-bold text-lg">Lĩnh vực nghiên cứu ({fields.length})</h3>
                <div className="mt-4 space-y-2">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm font-medium dark:border-slate-800 dark:bg-slate-900"
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
