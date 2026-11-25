"use client";

import { useEffect, useState, useRef } from "react";
import ThemeToggle from "../ThemeToggle";
import ProfileModal from "../ProfileModal";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  ActiveField,
  ActiveSemester,
  DashboardStats,
  ThesisResponse,
  StudentItem,
  LecturerItem,
  ChangeRequestItem,
  CouncilItem,
} from "../../lib/api";

type AdminTab = "overview" | "theses" | "councils" | "changes" | "users" | "config";

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
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
}) => {
  const base = "rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ";
  const variants = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  };
  return (
    <button {...props} className={base + variants[variant] + " " + className}>
      {children}
    </button>
  );
};

const Modal = ({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#10192e]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl">
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export function AdminPortal() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerItem[]>([]);
  const [semesters, setSemesters] = useState<ActiveSemester[]>([]);
  const [fields, setFields] = useState<ActiveField[]>([]);
  const [councils, setCouncils] = useState<CouncilItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedThesis, setSelectedThesis] = useState<ThesisResponse | null>(null);
  const [selectedCouncil, setSelectedCouncil] = useState<CouncilItem | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Form states
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadData = async () => {
    setBusy(true);
    try {
      const [statsRes, thesesRes, studentsRes, lecturersRes, semRes, fieldsRes, councilsRes, changesRes] =
        await Promise.all([
          api.dashboard.stats(),
          api.theses.getAll(),
          api.students.getAll(),
          api.lecturers.getAll(),
          api.semesters.getAll(),
          api.fields.getAll(),
          api.defense.councils.getAll(),
          api.changes.getAll(),
        ]);
      if (statsRes.data) setStats(statsRes.data);
      if (thesesRes.data) setTheses(thesesRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (lecturersRes.data) setLecturers(lecturersRes.data);
      if (semRes.data) setSemesters(semRes.data);
      if (fieldsRes.data) setFields(fieldsRes.data);
      if (councilsRes.data) setCouncils(councilsRes.data);
      if (changesRes.data) setChangeRequests(changesRes.data);
    } catch {
      notify("Lỗi khi tải dữ liệu hệ thống", "error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSemester = semesters.find((s) => s.isActive) || semesters[0];

  // ==================== ACTIONS ====================

  // Xuất Excel
  const handleExportExcel = async () => {
    try {
      notify("Đang tạo file Excel...");
      await api.dashboard.exportExcel();
      notify("Tải file Excel thành công!");
    } catch {
      notify("Không thể xuất file Excel", "error");
    }
  };

  // Import Excel Sinh viên
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    notify("Đang xử lý import file Excel...");
    const res = await api.students.importExcel(file);
    if (res.success) {
      notify(res.message || "Import sinh viên thành công!");
      loadData();
    } else {
      notify(res.message || "Import thất bại", "error");
    }
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Thêm Sinh viên mới
  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      studentCode: fd.get("studentCode"),
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      className: fd.get("className") || undefined,
      cohort: fd.get("cohort") || undefined,
      major: fd.get("major") || undefined,
      phone: fd.get("phone") || undefined,
    };
    const res = await api.students.create(body);
    if (res.success) {
      notify("Thêm sinh viên thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Thêm sinh viên thất bại", "error");
    }
  };

  // Thêm Giảng viên mới
  const handleCreateLecturer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      staffCode: fd.get("staffCode") || undefined,
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      degree: fd.get("degree") || undefined,
      title: fd.get("title") || undefined,
      department: fd.get("department") || undefined,
      maxStudents: fd.get("maxStudents") ? Number(fd.get("maxStudents")) : undefined,
    };
    const res = await api.lecturers.create(body);
    if (res.success) {
      notify("Thêm giảng viên thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Thêm giảng viên thất bại", "error");
    }
  };

  // Thêm Học kỳ mới
  const handleCreateSemester = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      code: fd.get("code"),
      name: fd.get("name"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      isActive: fd.get("isActive") === "on",
    };
    const res = await api.semesters.create(body);
    if (res.success) {
      notify("Thêm học kỳ thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Thêm học kỳ thất bại", "error");
    }
  };

  // Thêm Lĩnh vực/Chuyên ngành mới
  const handleCreateField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      description: fd.get("description") || undefined,
      isActive: true,
    };
    const res = await api.fields.create(body);
    if (res.success) {
      notify("Thêm chuyên ngành thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Thêm chuyên ngành thất bại", "error");
    }
  };

  // Xét đủ điều kiện đề tài (UC-05)
  const handleSetEligibility = async (thesisId: number, isEligible: boolean) => {
    const note = prompt(isEligible ? "Ghi chú duyệt (nếu có):" : "Lý do không đủ điều kiện:");
    if (note === null) return;
    const res = await api.theses.setEligibility(thesisId, { isEligible, eligibilityNote: note });
    if (res.success) {
      notify(isEligible ? "Đã duyệt đủ điều kiện!" : "Đã từ chối đủ điều kiện.");
      loadData();
    } else {
      notify(res.message || "Lỗi thao tác", "error");
    }
  };

  // Phân công GVHD chính thức (UC-08)
  const handleAssignFaculty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    const fd = new FormData(e.currentTarget);
    const supervisorId = Number(fd.get("supervisorId"));
    const decisionCode = String(fd.get("decisionCode"));
    const decisionDate = String(fd.get("decisionDate")) || undefined;

    const res = await api.theses.assignFaculty(selectedThesis.id, {
      supervisorId,
      decisionCode,
      decisionDate,
    });
    if (res.success) {
      notify("Phân công GVHD chính thức thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Lỗi phân công GVHD", "error");
    }
  };

  // Phân công GVPB (UC-26)
  const handleAssignReviewer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    const fd = new FormData(e.currentTarget);
    const reviewerId = Number(fd.get("reviewerId"));

    const res = await api.defense.reviewers.assign(selectedThesis.id, reviewerId);
    if (res.success) {
      notify("Phân công Giảng viên phản biện thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Lỗi phân công GVPB", "error");
    }
  };

  // Duyệt điều kiện hồ sơ bảo vệ (UC-25)
  const handleFacultyApproval = async (thesisId: number, approved: boolean) => {
    const notes = prompt(approved ? "Ghi chú duyệt (nếu có):" : "Lý do từ chối hồ sơ bảo vệ:");
    if (notes === null) return;
    const res = await api.defense.facultyApproval(thesisId, {
      hardCopyReceived: true,
      facultyApprovalStatus: approved ? "DA_DUYET" : "BI_LOAI",
      facultyNote: notes || undefined,
    });
    if (res.success) {
      notify(approved ? "Đã duyệt hồ sơ bảo vệ!" : "Đã từ chối hồ sơ bảo vệ.");
      loadData();
    } else {
      notify(res.message || "Lỗi duyệt hồ sơ", "error");
    }
  };

  // Duyệt Yêu cầu thay đổi (Change Request)
  const handleReviewChangeRequest = async (id: number, status: "DA_DUYET" | "TU_CHOI") => {
    const reviewNotes = prompt(status === "DA_DUYET" ? "Ghi chú duyệt:" : "Lý do từ chối:");
    if (reviewNotes === null) return;
    const backendStatus = status === "DA_DUYET" ? "APPROVED" : "REJECTED";
    const res = await api.changes.review(id, {
      status: backendStatus,
      responseNote: reviewNotes || undefined,
    });
    if (res.success) {
      notify(status === "DA_DUYET" ? "Đã duyệt yêu cầu thay đổi" : "Đã từ chối yêu cầu");
      loadData();
    } else {
      notify(res.message || "Lỗi xử lý yêu cầu", "error");
    }
  };

  // Thành lập Hội đồng mới (UC-26)
  const handleCreateCouncil = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const chuTichId = Number(fd.get("chuTichId"));
    const thuKyId = Number(fd.get("thuKyId"));
    const uyVienId = Number(fd.get("uyVienId"));

    if (chuTichId === thuKyId || chuTichId === uyVienId || thuKyId === uyVienId) {
      notify("3 thành viên trong hội đồng phải là 3 giảng viên khác nhau", "error");
      return;
    }

    const members: { lecturerId: number; role: "CHU_TICH" | "THU_KY" | "UY_VIEN" }[] = [
      { lecturerId: chuTichId, role: "CHU_TICH" },
      { lecturerId: thuKyId, role: "THU_KY" },
      { lecturerId: uyVienId, role: "UY_VIEN" },
    ];

    const body = {
      semesterId: Number(fd.get("semesterId")),
      code: String(fd.get("code")),
      name: String(fd.get("name")),
      defenseDate: fd.get("defenseDate") ? String(fd.get("defenseDate")) : undefined,
      location: fd.get("location") ? String(fd.get("location")) : undefined,
      members,
    };

    const res = await api.defense.councils.create(body);
    if (res.success) {
      notify("Thành lập Hội đồng bảo vệ thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Lỗi tạo hội đồng", "error");
    }
  };

  // Xếp đề tài vào Hội đồng (UC-29)
  const handleAssignThesisToCouncil = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCouncil) return;
    const fd = new FormData(e.currentTarget);
    const thesisId = Number(fd.get("thesisId"));
    const orderNumber = fd.get("orderNumber") ? Number(fd.get("orderNumber")) : undefined;
    const scheduledTime = fd.get("scheduledTime") ? String(fd.get("scheduledTime")) : undefined;

    const res = await api.defense.councils.assignThesis(selectedCouncil.id, {
      thesisId,
      orderNumber,
      scheduledTime,
    });
    if (res.success) {
      notify("Đã xếp lịch bảo vệ cho đề tài thành công!");
      setActiveModal(null);
      loadData();
    } else {
      notify(res.message || "Lỗi xếp lịch bảo vệ", "error");
    }
  };

  // Đóng hồ sơ khóa luận cuối kỳ (UC-31)
  const handleCloseCouncilAssignment = async (assignmentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn đóng và lưu trữ hồ sơ khóa luận này?")) return;
    const res = await api.defense.councils.close(assignmentId);
    if (res.success) {
      notify("Đã đóng và lưu trữ hồ sơ thành công!");
      loadData();
    } else {
      notify(res.message || "Lỗi đóng hồ sơ", "error");
    }
  };

  // Gửi thông báo toàn trường
  const handleSendBroadcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const target = fd.get("target"); // "all" | "students" | "lecturers"
    const title = String(fd.get("title"));
    const content = String(fd.get("content"));

    let userIds: number[] = [];
    if (target === "students") {
      userIds = students.map((s) => s.userId);
    } else if (target === "lecturers") {
      userIds = lecturers.map((l) => l.userId);
    } else {
      userIds = [...students.map((s) => s.userId), ...lecturers.map((l) => l.userId)];
    }

    if (userIds.length === 0) {
      notify("Không có người nhận phù hợp", "error");
      return;
    }

    const res = await api.notifications.createBulk({
      userIds,
      title,
      content,
      type: "SYSTEM",
    });
    if (res.success) {
      notify(`Đã gửi thông báo tới ${userIds.length} người dùng!`);
      setActiveModal(null);
    } else {
      notify(res.message || "Lỗi gửi thông báo", "error");
    }
  };

  // Filter
  const filteredTheses = theses.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.student?.user?.fullName?.toLowerCase().includes(q) ||
      t.student?.studentCode?.toLowerCase().includes(q) ||
      t.supervisor?.user?.fullName?.toLowerCase().includes(q)
    );
  });

  const nav: { id: AdminTab; label: string; icon: string; count?: number }[] = [
    { id: "overview", label: "Tổng quan Dashboard", icon: "📊" },
    { id: "theses", label: "Quản lý Đề tài", icon: "📑", count: theses.length },
    { id: "councils", label: "Hội đồng Bảo vệ", icon: "🏛️", count: councils.length },
    {
      id: "changes",
      label: "Yêu cầu thay đổi",
      icon: "🔄",
      count: changeRequests.filter((c) => c.status === "CHO_DUYET").length,
    },
    { id: "users", label: "Sinh viên & Giảng viên", icon: "👥" },
    { id: "config", label: "Học kỳ & Chuyên ngành", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-[#090f1d] dark:text-slate-100">
      {/* Toast message */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 shadow-xl text-sm font-semibold transition flex items-center gap-2 ${
            message.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "✕"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#111c2e] text-white md:flex">
        <div className="border-b border-white/10 p-5">
          <p className="font-bold text-lg text-sky-400">KLTN Management</p>
          <p className="text-xs text-slate-400 mt-1">Cổng Quản trị & Giáo vụ</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-sky-600 text-white font-semibold"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="rounded-full bg-sky-950 px-2 py-0.5 text-xs text-sky-300 font-bold">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">{user?.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Hồ sơ & Đổi MK
                </button>
              </div>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-[#10192e]">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">
              {nav.find((n) => n.id === tab)?.label}
            </h1>
            {busy && (
              <span className="text-xs text-sky-500 animate-pulse font-medium">
                Đang tải...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="text-xs flex items-center gap-1.5"
            >
              <span>📥</span> Xuất Excel KLTN
            </Button>
            <Button
              onClick={() => setActiveModal("broadcast")}
              className="text-xs flex items-center gap-1.5"
            >
              <span>📢</span> Gửi Thông báo
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* ==================== TAB 1: OVERVIEW ==================== */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Tổng số đề tài</p>
                  <p className="mt-2 text-3xl font-extrabold text-sky-600">{stats?.totalTheses || 0}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    KLTN: <b>{stats?.kltnCount ?? stats?.byType?.KLTN ?? 0}</b> · CĐTN: <b>{stats?.cdtnCount ?? stats?.byType?.CDTN ?? 0}</b>
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Sinh viên trong hệ thống</p>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-600">{students.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Sinh viên đủ điều kiện làm đề tài</p>
                </Card>
                <Card>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Giảng viên tham gia</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-600">{lecturers.length}</p>
                  <p className="mt-1 text-xs text-slate-400">GVHD, Phản biện và Hội đồng</p>
                </Card>
                <Card>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Hội đồng bảo vệ</p>
                  <p className="mt-2 text-3xl font-extrabold text-purple-600">{councils.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Đã thành lập trong học kỳ</p>
                </Card>
              </div>

              {/* Tiến độ giữa kỳ & Demo */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h3 className="font-bold text-sm">Kết quả Đánh giá giữa kỳ (BM-03)</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                      <p className="text-xs text-emerald-600 font-semibold">Đạt yêu cầu</p>
                      <p className="text-2xl font-bold text-emerald-700">{stats?.midtermDat ?? stats?.midterm?.DAT ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                      <p className="text-xs text-amber-600 font-semibold">Cảnh báo</p>
                      <p className="text-2xl font-bold text-amber-700">{stats?.midtermCanhBao ?? stats?.midterm?.CANH_BAO ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30">
                      <p className="text-xs text-rose-600 font-semibold">Không đạt</p>
                      <p className="text-2xl font-bold text-rose-700">{stats?.midtermKhongDat ?? stats?.midterm?.KHONG_DAT ?? 0}</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-sm">Phân bổ theo Lĩnh vực nghiên cứu</h3>
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {stats?.fields && stats.fields.length > 0 ? (
                      stats.fields.map((f, idx) => {
                        const id = f.id ?? f.fieldId ?? idx;
                        const name = f.name ?? f.fieldName ?? "Chưa phân loại";
                        const count = f._count?.theses ?? f.thesisCount ?? 0;
                        return (
                          <div key={id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 dark:bg-slate-900">
                            <span className="font-medium truncate max-w-[200px]">{name}</span>
                            <span className="font-bold text-sky-600">{count} đề tài</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400">Chưa có dữ liệu</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Trạng thái đề tài */}
              <Card>
                <h3 className="font-bold text-sm">Thống kê theo Trạng thái hồ sơ</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(stats?.statusCounts || stats?.byStatus || {}).map(([st, count]) => (
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

          {/* ==================== TAB 2: QUẢN LÝ ĐỀ TÀI ==================== */}
          {tab === "theses" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Tìm theo tên đề tài, SV, GVHD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 w-80"
                />
                <p className="text-xs text-slate-500">
                  Hiển thị <b>{filteredTheses.length}</b> / {theses.length} đề tài
                </p>
              </div>

              <Card className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Tên đề tài</th>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">GVHD chính thức</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác Giáo vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTheses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Không tìm thấy đề tài nào.
                        </td>
                      </tr>
                    ) : (
                      filteredTheses.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 font-semibold text-slate-500">#{t.id}</td>
                          <td className="px-4 py-3 max-w-[260px]">
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                              {t.title || "Chưa đặt tên đề tài"}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                {t.type}
                              </span>
                              {t.decisionCode && (
                                <span className="text-[10px] text-slate-500">
                                  QĐ: <b>{t.decisionCode}</b>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{t.student?.user?.fullName || "—"}</p>
                            <p className="text-xs text-slate-400">{t.student?.studentCode || "—"}</p>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {t.supervisor?.user?.fullName ? (
                              <span>{t.supervisor.user.fullName}</span>
                            ) : (
                              <span className="text-amber-500 text-xs">Chưa phân công</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {statusText[t.status] || t.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Duyệt đủ điều kiện nếu chưa duyệt */}
                              {!t.isEligible ? (
                                <button
                                  onClick={() => handleSetEligibility(t.id, true)}
                                  className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  title="Xét đủ điều kiện làm KLTN (UC-05)"
                                >
                                  Duyệt ĐK
                                </button>
                              ) : null}

                              {/* 2. Khoa ra quyết định phân công GVHD */}
                              {t.status === "CHO_KHOA_GIAO" && (
                                <button
                                  onClick={() => {
                                    setSelectedThesis(t);
                                    setActiveModal("assignFaculty");
                                  }}
                                  className="rounded bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300"
                                  title="Ra quyết định phân công GVHD (UC-08)"
                                >
                                  Gán GVHD
                                </button>
                              )}

                              {/* 3. Duyệt hồ sơ bảo vệ nếu ở trạng thái chờ duyệt */}
                              {t.status === "CHO_DUYET_HO_SO" && (
                                <button
                                  onClick={() => handleFacultyApproval(t.id, true)}
                                  className="rounded bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                                  title="Duyệt hồ sơ đủ điều kiện bảo vệ (UC-25)"
                                >
                                  Duyệt HS
                                </button>
                              )}

                              {/* 4. Phân công phản biện */}
                              {t.status === "CHO_PHAN_BIEN" && (
                                <button
                                  onClick={() => {
                                    setSelectedThesis(t);
                                    setActiveModal("assignReviewer");
                                  }}
                                  className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                                  title="Phân công Giảng viên phản biện (UC-26)"
                                >
                                  Gán GVPB
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ==================== TAB 3: HỘI ĐỒNG BẢO VỆ ==================== */}
          {tab === "councils" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Hội đồng bảo vệ KLTN</h2>
                  <p className="text-xs text-slate-500">
                    Thành lập hội đồng, phân công đề tài và quản lý điểm bảo vệ cuối kỳ.
                  </p>
                </div>
                <Button onClick={() => setActiveModal("createCouncil")} className="text-xs">
                  + Thành lập Hội đồng mới
                </Button>
              </div>

              {councils.length === 0 ? (
                <Card className="text-center py-10 text-slate-400">
                  Chưa có hội đồng bảo vệ nào được thành lập trong học kỳ này.
                </Card>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {councils.map((c) => (
                    <Card key={c.id} className="space-y-4">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              {c.code}
                            </span>
                            <h3 className="font-bold text-base">{c.name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Địa điểm: <b>{c.location || "Chưa xếp phòng"}</b> · Ngày:{" "}
                            <b>{c.defenseDate ? new Date(c.defenseDate).toLocaleDateString("vi-VN") : "Chưa có ngày"}</b>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCouncil(c);
                            setActiveModal("assignThesisToCouncil");
                          }}
                          className="text-xs"
                        >
                          + Xếp đề tài
                        </Button>
                      </div>

                      {/* Thành viên hội đồng */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Thành viên Hội đồng</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          {c.members.map((m) => (
                            <div key={m.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                              <span className="font-bold text-sky-600 block text-[10px]">
                                {m.role === "CHU_TICH" ? "CHỦ TỊCH" : m.role === "THU_KY" ? "THƯ KÝ" : "ỦY VIÊN"}
                              </span>
                              <span className="font-medium truncate block">{m.lecturer.user.fullName}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Danh sách đề tài bảo vệ trong hội đồng */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">
                          Đề tài bảo vệ ({c.assignments?.length || 0})
                        </p>
                        <div className="mt-2 space-y-2 max-h-52 overflow-y-auto">
                          {c.assignments && c.assignments.length > 0 ? (
                            c.assignments.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                              >
                                <div className="max-w-[320px]">
                                  <p className="font-bold truncate">{a.thesis.title}</p>
                                  <p className="text-slate-500 text-[11px]">
                                    SV: {a.thesis.student?.user?.fullName} ({a.thesis.student?.studentCode}) · Giờ:{" "}
                                    {a.scheduledTime || "Chưa đặt"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {a.finalScore !== null && a.finalScore !== undefined ? (
                                    <span className="font-bold text-emerald-600 text-sm">
                                      {a.finalScore} đ
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Chưa có điểm</span>
                                  )}
                                  <button
                                    onClick={() => handleCloseCouncilAssignment(a.id)}
                                    className="text-xs text-slate-400 hover:text-rose-600"
                                    title="Đóng hồ sơ cuối kỳ (UC-31)"
                                  >
                                    Đóng
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Chưa xếp đề tài nào vào hội đồng này.</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: YÊU CẦU THAY ĐỔI ==================== */}
          {tab === "changes" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Yêu cầu thay đổi từ Sinh viên</h2>
                <p className="text-xs text-slate-500">
                  Xem xét và duyệt đơn xin đổi tên đề tài, đổi GVHD hoặc rút đề tài.
                </p>
              </div>

              <Card className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3">Loại yêu cầu</th>
                      <th className="px-4 py-3">Sinh viên / Đề tài</th>
                      <th className="px-4 py-3">Nội dung thay đổi</th>
                      <th className="px-4 py-3">Lý do</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {changeRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Chưa có yêu cầu thay đổi nào.
                        </td>
                      </tr>
                    ) : (
                      changeRequests.map((cr) => (
                        <tr key={cr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 font-semibold text-xs">
                            <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              {cr.type === "DOI_TEN_DE_TAI"
                                ? "Đổi tên đề tài"
                                : cr.type === "DOI_GVHD"
                                ? "Đổi GVHD"
                                : "Rút đề tài"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{cr.thesis.student?.user?.fullName}</p>
                            <p className="text-xs text-slate-400">{cr.thesis.title}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">
                            {cr.newTitle && <p>Tên mới: <b>{cr.newTitle}</b></p>}
                            {cr.newSupervisor && <p>GVHD mới: <b>{cr.newSupervisor.user?.fullName}</b></p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                            {cr.reason}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                cr.status === "DA_DUYET"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : cr.status === "TU_CHOI"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {cr.status === "CHO_DUYET" ? "Chờ duyệt" : cr.status === "DA_DUYET" ? "Đã duyệt" : "Từ chối"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cr.status === "CHO_DUYET" && (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="success"
                                  onClick={() => handleReviewChangeRequest(cr.id, "DA_DUYET")}
                                  className="text-xs px-2.5 py-1"
                                >
                                  Duyệt
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleReviewChangeRequest(cr.id, "TU_CHOI")}
                                  className="text-xs px-2.5 py-1"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ==================== TAB 5: SINH VIÊN & GIẢNG VIÊN ==================== */}
          {tab === "users" && (
            <div className="space-y-6">
              {/* Sinh viên */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Danh sách Sinh viên ({students.length})</h3>
                    <p className="text-xs text-slate-500">Quản lý tài khoản và nhập danh sách sinh viên từ file Excel</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportExcel}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <span>📂</span> Nhập từ file Excel (UC-09)
                    </Button>
                    <Button onClick={() => setActiveModal("createStudent")} className="text-xs">
                      + Thêm sinh viên
                    </Button>
                  </div>
                </div>

                <Card className="overflow-x-auto p-0 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">MSSV</th>
                        <th className="px-4 py-2.5">Họ và tên</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Lớp / Khóa</th>
                        <th className="px-4 py-2.5">Chuyên ngành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 font-bold text-sky-600">{s.studentCode}</td>
                          <td className="px-4 py-2.5 font-medium">{s.user.fullName}</td>
                          <td className="px-4 py-2.5 text-slate-500">{s.user.email}</td>
                          <td className="px-4 py-2.5">{s.className || "—"}</td>
                          <td className="px-4 py-2.5">{s.major || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Giảng viên */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Danh sách Giảng viên ({lecturers.length})</h3>
                    <p className="text-xs text-slate-500">Giảng viên hướng dẫn, phản biện và tham gia các hội đồng</p>
                  </div>
                  <Button onClick={() => setActiveModal("createLecturer")} className="text-xs">
                    + Thêm giảng viên
                  </Button>
                </div>

                <Card className="overflow-x-auto p-0 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Mã GV</th>
                        <th className="px-4 py-2.5">Họ và tên</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Học hàm / Học vị</th>
                        <th className="px-4 py-2.5">Bộ môn</th>
                        <th className="px-4 py-2.5">SV tối đa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lecturers.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 font-bold text-sky-600">{l.staffCode || `#${l.id}`}</td>
                          <td className="px-4 py-2.5 font-medium">{l.user.fullName}</td>
                          <td className="px-4 py-2.5 text-slate-500">{l.user.email}</td>
                          <td className="px-4 py-2.5">{l.degree || "—"}</td>
                          <td className="px-4 py-2.5">{l.department || "—"}</td>
                          <td className="px-4 py-2.5 font-bold">{l.maxStudents} SV</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB 6: HỌC KỲ & CHUYÊN NGÀNH ==================== */}
          {tab === "config" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Học kỳ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Danh sách Học kỳ ({semesters.length})</h3>
                  <Button onClick={() => setActiveModal("createSemester")} className="text-xs">
                    + Thêm Học kỳ
                  </Button>
                </div>

                <div className="space-y-3">
                  {semesters.map((s) => (
                    <Card key={s.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{s.name}</span>
                          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sky-600">
                            {s.code}
                          </code>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {s.startDate ? new Date(s.startDate).toLocaleDateString("vi-VN") : "—"} đến{" "}
                          {s.endDate ? new Date(s.endDate).toLocaleDateString("vi-VN") : "—"}
                        </p>
                      </div>
                      <div>
                        {s.isActive ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đang kích hoạt
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              await api.semesters.update(s.id, { isActive: true });
                              loadData();
                              notify("Đã chuyển học kỳ kích hoạt!");
                            }}
                            className="text-xs py-1 px-2.5"
                          >
                            Kích hoạt
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Lĩnh vực / Chuyên ngành */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Lĩnh vực nghiên cứu ({fields.length})</h3>
                  <Button onClick={() => setActiveModal("createField")} className="text-xs">
                    + Thêm Lĩnh vực
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((f) => (
                    <Card key={f.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{f.name}</p>
                        {f.description && <p className="text-xs text-slate-400 mt-1">{f.description}</p>}
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">Đang hoạt động</span>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Modal Thêm Sinh viên */}
      <Modal
        title="Thêm Sinh viên mới"
        isOpen={activeModal === "createStudent"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleCreateStudent} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Mã sinh viên (MSSV) *</label>
              <input
                name="studentCode"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Họ và tên *</label>
              <input
                name="fullName"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Email *</label>
              <input
                type="email"
                name="email"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Mật khẩu ban đầu *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                defaultValue="123456"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-xs">Lớp</label>
              <input
                name="className"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Khóa</label>
              <input
                name="cohort"
                placeholder="K35"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Chuyên ngành</label>
              <input
                name="major"
                placeholder="CNTT"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Thêm sinh viên</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Thêm Giảng viên */}
      <Modal
        title="Thêm Giảng viên mới"
        isOpen={activeModal === "createLecturer"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleCreateLecturer} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Mã giảng viên</label>
              <input
                name="staffCode"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Họ và tên *</label>
              <input
                name="fullName"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Email *</label>
              <input
                type="email"
                name="email"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Mật khẩu ban đầu *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                defaultValue="123456"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-xs">Học vị</label>
              <select
                name="degree"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="ThS">ThS</option>
                <option value="TS">TS</option>
                <option value="PGS.TS">PGS.TS</option>
                <option value="GS.TS">GS.TS</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-xs">Bộ môn</label>
              <input
                name="department"
                placeholder="KTPM"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">SV tối đa</label>
              <input
                type="number"
                name="maxStudents"
                defaultValue={15}
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Thêm giảng viên</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Phân công GVHD chính thức (UC-08) */}
      <Modal
        title={`Ra quyết định phân công GVHD: ${selectedThesis?.title || ""}`}
        isOpen={activeModal === "assignFaculty" && Boolean(selectedThesis)}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleAssignFaculty} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold text-xs">Giảng viên hướng dẫn chính thức *</label>
            <select
              name="supervisorId"
              defaultValue={selectedThesis?.supervisor?.id || lecturers[0]?.id}
              required
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.user.fullName} ({l.degree || "ThS"} - {l.department || "Bộ môn"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-xs">Mã số Quyết định phân công của Khoa *</label>
            <input
              name="decisionCode"
              required
              placeholder="VD: QĐ-CNTT-2026/01"
              defaultValue={selectedThesis?.decisionCode || ""}
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="font-semibold text-xs">Ngày ban hành Quyết định</label>
            <input
              type="date"
              name="decisionDate"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Lưu Quyết định</Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Phân công GVPB (UC-26) */}
      <Modal
        title={`Phân công GVPB: ${selectedThesis?.title || ""}`}
        isOpen={activeModal === "assignReviewer" && Boolean(selectedThesis)}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleAssignReviewer} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold text-xs">Giảng viên phản biện (GVPB) *</label>
            <select
              name="reviewerId"
              required
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {lecturers
                .filter((l) => l.id !== selectedThesis?.supervisor?.id)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.fullName} ({l.degree || "ThS"} - {l.department || "Bộ môn"})
                  </option>
                ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              * Giảng viên phản biện phải độc lập và không trùng với GVHD của đề tài này.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Phân công GVPB</Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal Thành lập Hội đồng (UC-26) */}
      <Modal
        title="Thành lập Hội đồng Bảo vệ KLTN mới"
        isOpen={activeModal === "createCouncil"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleCreateCouncil} className="space-y-3 text-sm">
          <input type="hidden" name="semesterId" value={activeSemester?.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Mã Hội đồng *</label>
              <input
                name="code"
                required
                placeholder="VD: HĐ-01"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Tên Hội đồng *</label>
              <input
                name="name"
                required
                placeholder="VD: Hội đồng KTPM 1"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Ngày bảo vệ</label>
              <input
                type="date"
                name="defenseDate"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Phòng bảo vệ</label>
              <input
                name="location"
                placeholder="Phòng 502 - Nhà A"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-sky-600">3 Thành viên Hội đồng bắt buộc:</p>
            <div>
              <label className="text-xs font-semibold">1. Chủ tịch Hội đồng *</label>
              <select
                name="chuTichId"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.fullName} ({l.degree || "ThS"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">2. Thư ký Hội đồng *</label>
              <select
                name="thuKyId"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.fullName} ({l.degree || "ThS"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">3. Ủy viên Hội đồng *</label>
              <select
                name="uyVienId"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.user.fullName} ({l.degree || "ThS"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Thành lập Hội đồng</Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal Xếp đề tài vào Hội đồng (UC-29) */}
      <Modal
        title={`Xếp lịch đề tài vào ${selectedCouncil?.name || ""}`}
        isOpen={activeModal === "assignThesisToCouncil" && Boolean(selectedCouncil)}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleAssignThesisToCouncil} className="space-y-4 text-sm">
          <div>
            <label className="font-semibold text-xs">Chọn Đề tài đủ điều kiện bảo vệ *</label>
            <select
              name="thesisId"
              required
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              {theses
                .filter((t) => t.status === "DU_DIEU_KIEN_BAO_VE" || t.status === "CHO_PHAN_BIEN")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - {t.title} (SV: {t.student?.user?.fullName})
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Số thứ tự bảo vệ</label>
              <input
                type="number"
                name="orderNumber"
                defaultValue={1}
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Khung giờ bảo vệ</label>
              <input
                name="scheduledTime"
                placeholder="08:30 - 09:15"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Lưu xếp lịch</Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal Gửi thông báo toàn trường */}
      <Modal
        title="Gửi Thông báo Hệ thống"
        isOpen={activeModal === "broadcast"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleSendBroadcast} className="space-y-3 text-sm">
          <div>
            <label className="font-semibold text-xs">Đối tượng nhận thông báo</label>
            <select
              name="target"
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">Toàn bộ Sinh viên & Giảng viên</option>
              <option value="students">Chỉ Sinh viên</option>
              <option value="lecturers">Chỉ Giảng viên</option>
            </select>
          </div>
          <div>
            <label className="font-semibold text-xs">Tiêu đề thông báo *</label>
            <input
              name="title"
              required
              placeholder="VD: Nhắc nhở nộp báo cáo tiến độ tuần"
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="font-semibold text-xs">Nội dung thông báo *</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Chi tiết thông báo..."
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Gửi thông báo ngay</Button>
          </div>
        </form>
      </Modal>

      {/* 8. Modal Thêm Học kỳ */}
      <Modal
        title="Thêm Học kỳ mới"
        isOpen={activeModal === "createSemester"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleCreateSemester} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Mã học kỳ *</label>
              <input
                name="code"
                required
                placeholder="2026-2027_HK1"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Tên học kỳ *</label>
              <input
                name="name"
                required
                placeholder="Học kỳ 1 năm học 2026 - 2027"
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-xs">Ngày bắt đầu *</label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-xs">Ngày kết thúc *</label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" name="isActive" className="rounded" />
            <span className="text-xs font-semibold">Kích hoạt học kỳ này ngay</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Lưu học kỳ</Button>
          </div>
        </form>
      </Modal>

      {/* 9. Modal Thêm Lĩnh vực */}
      <Modal
        title="Thêm Chuyên ngành / Lĩnh vực mới"
        isOpen={activeModal === "createField"}
        onClose={() => setActiveModal(null)}
      >
        <form onSubmit={handleCreateField} className="space-y-3 text-sm">
          <div>
            <label className="font-semibold text-xs">Tên lĩnh vực / chuyên ngành *</label>
            <input
              name="name"
              required
              placeholder="VD: Trí tuệ nhân tạo (AI), Kỹ thuật phần mềm..."
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="font-semibold text-xs">Mô tả tóm tắt</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Mô tả hướng nghiên cứu..."
              className="w-full mt-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
              Hủy
            </Button>
            <Button type="submit">Lưu chuyên ngành</Button>
          </div>
        </form>
      </Modal>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
