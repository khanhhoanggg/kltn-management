"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  ActiveField,
  ActiveSemester,
  CouncilItem,
  Log,
  ReviewerAssignmentItem,
  Suggestion,
  ThesisResponse,
} from "../../lib/api";

type LecturerTab =
  | "theses"
  | "supervision"
  | "evaluations"
  | "defense"
  | "reviewer"
  | "councils"
  | "suggestions";

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

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#10192e] ${className}`}>
    {children}
  </section>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={
      "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white " +
      (props.className || "")
    }
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={
      "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white " +
      (props.className || "")
    }
  />
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

export function LecturerPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<LecturerTab>("theses");
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<number | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [fields, setFields] = useState<ActiveField[]>([]);
  const [semester, setSemester] = useState<ActiveSemester | null>(null);
  const [reviewerAssignments, setReviewerAssignments] = useState<ReviewerAssignmentItem[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<number | null>(null);
  const [councils, setCouncils] = useState<CouncilItem[]>([]);
  const [selectedCouncilId, setSelectedCouncilId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedThesis = theses.find((t) => t.id === selectedThesisId) || theses[0] || null;
  const selectedReviewerAssignment =
    reviewerAssignments.find((r) => r.id === selectedReviewerId) || reviewerAssignments[0] || null;

  const loadData = async () => {
    const [tRes, sRes, fRes, semRes, revRes, counRes] = await Promise.all([
      api.theses.getAll(),
      api.suggestions.getAll(),
      api.fields.active(),
      api.semesters.active(),
      api.defense.reviewers.getMyAssignments(),
      api.defense.councils.getAll(),
    ]);
    if (tRes.data) {
      setTheses(tRes.data);
      if (!selectedThesisId && tRes.data.length > 0) {
        setSelectedThesisId(tRes.data[0].id);
      }
    }
    if (sRes.data) setSuggestions(sRes.data);
    if (fRes.data) setFields(fRes.data);
    if (semRes.data) setSemester(semRes.data);
    if (revRes.data) {
      setReviewerAssignments(revRes.data);
      if (!selectedReviewerId && revRes.data.length > 0) {
        setSelectedReviewerId(revRes.data[0].id);
      }
    }
    if (counRes.data) {
      setCouncils(counRes.data);
      if (!selectedCouncilId && counRes.data.length > 0) {
        setSelectedCouncilId(counRes.data[0].id);
      }
    }
  };

  const loadLogs = async (id: number) => {
    const res = await api.supervision.get(id);
    if (res.data) setLogs(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedThesis?.id) {
      loadLogs(selectedThesis.id);
    }
  }, [selectedThesis?.id]);

  const notify = (result: { success: boolean; message?: string }, success = "Thao tác thành công") => {
    setMessage(result.success ? success : result.message || "Có lỗi xảy ra");
  };

  const handleConfirmThesis = async (thesisId: number, accepted: boolean) => {
    setBusy(true);
    const res = await api.theses.confirm(thesisId, { accepted });
    notify(res, accepted ? "Đã phê duyệt đề tài (BM-01)" : "Đã từ chối đề tài");
    if (res.success) loadData();
    setBusy(false);
  };

  const handleCreateLog = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await api.supervision.createLog({
      thesisId: selectedThesis.id,
      meetingDate: String(data.get("meetingDate")),
      content: String(data.get("content")),
      tasksAssigned: String(data.get("tasksAssigned") || ""),
      progressPercentage: Number(data.get("progressPercentage")) || 0,
    });
    notify(res, "Đã ghi nhận nhật ký hướng dẫn");
    if (res.success) {
      e.currentTarget.reset();
      loadLogs(selectedThesis.id);
    }
    setBusy(false);
  };

  const handleEvaluateMidterm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await api.evaluations.evaluateMidterm(selectedThesis.id, {
      result: String(data.get("result")),
      comments: String(data.get("comments") || ""),
    });
    notify(res, "Đã lưu đánh giá tiến độ giữa kỳ (BM-03)");
    setBusy(false);
  };

  const handleEvaluateDemo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const result = String(data.get("result"));
    const comments = String(data.get("notes") || "");
    const canDefend = result === "DAT";
    const res = await api.evaluations.evaluateDemo(selectedThesis.id, {
      result,
      comments: comments || undefined,
      canDefend,
    });
    notify(res, "Đã lưu đánh giá Checkpoint Demo (BM-03)");
    setBusy(false);
  };

  const handleSupervisorEvaluate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThesis) return;
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await api.defense.evaluateSupervisor(selectedThesis.id, {
      supervisorScore: Number(data.get("supervisorScore")),
      supervisorDecision: data.get("supervisorDecision") as "CHO_BAO_VE" | "KHONG_CHO_BAO_VE",
      supervisorComments: String(data.get("supervisorComments") || ""),
    });
    notify(res, "Đã lưu phiếu nhận xét & điểm GVHD (BM-05)");
    if (res.success) loadData();
    setBusy(false);
  };

  const handleCreateSuggestion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await api.suggestions.create({
      title: String(data.get("title")),
      description: String(data.get("description") || ""),
      fieldId: Number(data.get("fieldId")) || undefined,
      maxSlots: Number(data.get("maxSlots")) || 2,
      semesterId: semester?.id,
    });
    notify(res, "Đã công bố đề tài gợi ý mới");
    if (res.success) {
      e.currentTarget.reset();
      loadData();
    }
    setBusy(false);
  };

  const handleDeleteSuggestion = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa đề tài gợi ý này?")) return;
    const res = await api.suggestions.delete(id);
    notify(res, "Đã xóa đề tài gợi ý");
    if (res.success) loadData();
  };

  const handleEvaluateReviewer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReviewerAssignment) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await api.defense.reviewers.evaluate(selectedReviewerAssignment.thesisId, {
      preliminaryNotes: String(fd.get("preliminaryNotes")) || undefined,
      detailedReview: String(fd.get("detailedReview")),
      decision: fd.get("decision") as "CHO_BAO_VE" | "KHONG_CHO_BAO_VE",
      reviewerScore: Number(fd.get("reviewerScore")),
    });
    notify(res, "Đã lưu kết quả đánh giá phản biện (BM-06)");
    if (res.success) loadData();
    setBusy(false);
  };

  const handleScoreCouncil = async (assignmentId: number, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await api.defense.councils.score(assignmentId, {
      score: Number(fd.get("score")),
      comments: String(fd.get("comments")) || undefined,
    });
    notify(res, "Đã lưu điểm chấm Hội đồng (BM-07)");
    if (res.success) loadData();
    setBusy(false);
  };

  const handleFinalizeMinute = async (assignmentId: number, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await api.defense.councils.finalizeMinute(assignmentId, {
      minuteNotes: String(fd.get("minuteNotes")) || undefined,
      minuteFileUrl: String(fd.get("minuteFileUrl")) || undefined,
    });
    notify(res, "Đã lập biên bản & tính điểm tổng kết khóa luận!");
    if (res.success) loadData();
    setBusy(false);
  };

  const nav: { id: LecturerTab; label: string; icon: string; count?: number }[] = [
    { id: "theses", label: "Đề tài hướng dẫn", icon: "📚", count: theses.length },
    { id: "supervision", label: "Nhật ký & Giao việc", icon: "📑" },
    { id: "evaluations", label: "Đánh giá GK & Demo", icon: "🎯" },
    { id: "defense", label: "Chấm điểm BV (BM-05)", icon: "🏆" },
    { id: "reviewer", label: "Phản biện (BM-06)", icon: "⚖️", count: reviewerAssignments.length },
    { id: "councils", label: "Hội đồng (BM-07/08)", icon: "🏛️", count: councils.length },
    { id: "suggestions", label: "Đề tài gợi ý", icon: "💡" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-[#090f1d] dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#081c33] text-white md:flex">
        <div className="border-b border-white/10 p-5">
          <p className="font-bold">Quản lý KLTN/CĐTN</p>
          <p className="mt-1 text-xs text-sky-300">Cổng Giảng viên · ĐH Thăng Long</p>
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
          <p className="mb-3 text-xs text-slate-400">
            {user?.lecturer?.degree ? `${user.lecturer.degree} · ` : ""}
            {user?.lecturer?.staffCode || user?.email}
          </p>
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
            <p className="text-sm text-slate-500">Cổng Giảng viên hướng dẫn & Phản biện</p>
            <h1 className="font-bold text-slate-900 dark:text-white">
              {nav.find((x) => x.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {semester && (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                {semester.name}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
          {message && (
            <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
              <span>{message}</span>
              <button onClick={() => setMessage("")}>×</button>
            </div>
          )}

          {/* TAB 1: DANH SÁCH ĐỀ TÀI HƯỚNG DẪN */}
          {tab === "theses" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Danh sách đề tài hướng dẫn</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Phê duyệt đăng ký BM-01 và theo dõi tiến độ sinh viên.
                  </p>
                </div>
                <Button onClick={loadData}>Làm mới</Button>
              </div>

              {theses.length === 0 ? (
                <Card>
                  <p className="py-12 text-center text-slate-500">
                    Hiện chưa có sinh viên nào đăng ký đề tài với bạn trong học kỳ này.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {theses.map((t) => (
                    <Card key={t.id} className="transition hover:border-sky-300">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              {t.type}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {statusText[t.status] || t.status}
                            </span>
                          </div>
                          <h3 className="mt-2 text-lg font-bold">{t.title || "Chưa đặt tên đề tài"}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Sinh viên: <b>{t.student?.user?.fullName || "Chưa có"}</b> (
                            {t.student?.studentCode || "—"}) · Lĩnh vực: {t.field?.name || "Chưa chọn"}
                          </p>
                        </div>

                        {t.status === "CHO_GVHD_XAC_NHAN" && (
                          <div className="flex gap-2">
                            <Button
                              disabled={busy}
                              onClick={() => handleConfirmThesis(t.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Duyệt BM-01
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => handleConfirmThesis(t.id, false)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                        {t.outlineUrl && (
                          <a
                            href={t.outlineUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-sky-600 hover:underline"
                          >
                            🔗 Xem đề cương chi tiết
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedThesisId(t.id);
                            setTab("supervision");
                          }}
                          className="font-semibold text-slate-700 hover:text-sky-600 dark:text-slate-300"
                        >
                          Xem nhật ký &rarr;
                        </button>
                        <button
                          onClick={() => {
                            setSelectedThesisId(t.id);
                            setTab("evaluations");
                          }}
                          className="font-semibold text-slate-700 hover:text-sky-600 dark:text-slate-300"
                        >
                          Đánh giá GK / Demo &rarr;
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NHẬT KÝ & GIAO VIỆC */}
          {tab === "supervision" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Nhật ký hướng dẫn & Giao việc</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ghi chép nội dung trao đổi, giao việc và theo dõi báo cáo tuần của sinh viên.
                  </p>
                </div>
                {theses.length > 0 && (
                  <select
                    value={selectedThesis?.id || ""}
                    onChange={(e) => setSelectedThesisId(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold outline-none dark:border-slate-700 dark:bg-slate-900"
                  >
                    {theses.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.student?.user?.fullName} — {t.title?.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedThesis ? (
                <>
                  <Card>
                    <h3 className="font-bold">Ghi nhận buổi hướng dẫn mới</h3>
                    <form onSubmit={handleCreateLog} className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="text-sm">
                        Ngày làm việc
                        <Input
                          name="meetingDate"
                          type="date"
                          required
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
                      </label>
                      <label className="text-sm">
                        Tiến độ sinh viên đạt được (%)
                        <Input
                          name="progressPercentage"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="20"
                        />
                      </label>
                      <label className="text-sm md:col-span-2">
                        Nội dung trao đổi / Nhận xét của GVHD
                        <Textarea
                          name="content"
                          rows={3}
                          required
                          placeholder="Ví dụ: Đã xem xét thiết kế DB, cần tối ưu lại các bảng quan hệ..."
                        />
                      </label>
                      <label className="text-sm md:col-span-2">
                        Nhiệm vụ giao cho sinh viên tuần tới
                        <Textarea
                          name="tasksAssigned"
                          rows={2}
                          placeholder="Ví dụ: Hoàn thành API module sinh viên, viết test case..."
                        />
                      </label>
                      <div className="md:col-span-2">
                        <Button disabled={busy} type="submit">
                          Lưu nhật ký hướng dẫn
                        </Button>
                      </div>
                    </form>
                  </Card>

                  <Card>
                    <h3 className="font-bold">Lịch sử hướng dẫn & Báo cáo tuần ({logs.length})</h3>
                    <div className="mt-4 space-y-3">
                      {logs.length === 0 ? (
                        <p className="text-sm text-slate-500">Chưa có nhật ký nào cho đề tài này.</p>
                      ) : (
                        logs.map((l) => (
                          <div
                            key={l.id}
                            className="border-l-4 border-sky-500 bg-slate-50 p-4 dark:bg-slate-900"
                          >
                            <div className="flex justify-between gap-2">
                              <p className="font-bold text-sky-700 dark:text-sky-400">
                                {formatDate(l.meetingDate)}
                              </p>
                              {l.progressPercentage !== undefined && (
                                <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                  Tiến độ: {l.progressPercentage}%
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm">{l.content}</p>
                            {l.studentNotes && (
                              <p className="mt-2 rounded bg-white p-2 text-sm text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                                <b>Báo cáo của sinh viên:</b> {l.studentNotes}
                              </p>
                            )}
                            {l.tasksAssigned && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <b>Nhiệm vụ được giao:</b> {l.tasksAssigned}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </>
              ) : (
                <Card>
                  <p className="text-center text-slate-500">Chưa có đề tài nào để ghi nhật ký.</p>
                </Card>
              )}
            </div>
          )}

          {/* TAB 3: ĐÁNH GIÁ GIỮA KỲ & DEMO (BM-03) */}
          {tab === "evaluations" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Đánh giá Giữa kỳ & Checkpoint Demo (BM-03)</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ghi nhận kết quả tiến độ giữa kỳ và kiểm tra Demo sản phẩm.
                  </p>
                </div>
                {theses.length > 0 && (
                  <select
                    value={selectedThesis?.id || ""}
                    onChange={(e) => setSelectedThesisId(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold outline-none dark:border-slate-700 dark:bg-slate-900"
                  >
                    {theses.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.student?.user?.fullName} — {t.title?.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedThesis ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Card>
                    <h3 className="font-bold text-sky-700 dark:text-sky-400">
                      1. Đánh giá Tiến độ Giữa kỳ (BM-03)
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Đề tài: {selectedThesis.title} ({selectedThesis.student?.user?.fullName})
                    </p>
                    <form onSubmit={handleEvaluateMidterm} className="mt-4 space-y-4">
                      <label className="block text-sm">
                        Kết quả đánh giá
                        <select
                          name="result"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          required
                        >
                          <option value="DAT">Đạt tiến độ</option>
                          <option value="CANH_BAO">Cảnh báo chậm tiến độ</option>
                          <option value="KHONG_DAT">Không đạt (Đề nghị dừng)</option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        Nhận xét của GVHD
                        <Textarea
                          name="comments"
                          rows={4}
                          placeholder="Nhận xét chi tiết về tình hình thực hiện đề tài..."
                        />
                      </label>
                      <Button disabled={busy} type="submit">
                        Lưu đánh giá giữa kỳ
                      </Button>
                    </form>
                  </Card>

                  <Card>
                    <h3 className="font-bold text-sky-700 dark:text-sky-400">
                      2. Đánh giá Checkpoint Demo (BM-03)
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Điều kiện tiên quyết để sinh viên được nộp hồ sơ bảo vệ.
                    </p>
                    <form onSubmit={handleEvaluateDemo} className="mt-4 space-y-4">
                      <label className="block text-sm">
                        Kết quả kiểm tra Demo
                        <select
                          name="result"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          required
                        >
                          <option value="DAT">Đạt kiểm tra Demo (Đủ điều kiện nộp hồ sơ)</option>
                          <option value="KHONG_DAT">Chưa đạt Demo</option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        Ghi chú / Yêu cầu bổ sung
                        <Textarea
                          name="notes"
                          rows={4}
                          placeholder="Ghi chú về tính hoàn thiện của sản phẩm demo..."
                        />
                      </label>
                      <Button disabled={busy} type="submit">
                        Lưu kết quả Demo
                      </Button>
                    </form>
                  </Card>
                </div>
              ) : (
                <Card>
                  <p className="text-center text-slate-500">Chưa có đề tài nào để đánh giá.</p>
                </Card>
              )}
            </div>
          )}

          {/* TAB 4: CHẤM ĐIỂM BẢO VỆ (BM-05) */}
          {tab === "defense" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Chấm điểm & Nhận xét GVHD (BM-05)</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Đánh giá hồ sơ toàn văn, slide, mã nguồn và cho điểm bảo vệ (30%).
                  </p>
                </div>
                {theses.length > 0 && (
                  <select
                    value={selectedThesis?.id || ""}
                    onChange={(e) => setSelectedThesisId(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold outline-none dark:border-slate-700 dark:bg-slate-900"
                  >
                    {theses.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.student?.user?.fullName} — {t.title?.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedThesis ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Card>
                    <h3 className="font-bold">Hồ sơ bảo vệ sinh viên đã nộp</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <p>
                        Sinh viên: <b>{selectedThesis.student?.user?.fullName}</b> (
                        {selectedThesis.student?.studentCode})
                      </p>
                      <p>
                        Trạng thái đề tài: <b>{statusText[selectedThesis.status] || selectedThesis.status}</b>
                      </p>
                      {selectedThesis.defenseSubmission ? (
                        <div className="rounded-lg bg-slate-50 p-3 space-y-2 dark:bg-slate-900">
                          <p>
                            Tỷ lệ đạo văn: <b>{selectedThesis.defenseSubmission.plagiarismRate}%</b>
                          </p>
                          <div className="flex flex-wrap gap-3 font-semibold text-sky-600">
                            <a
                              href={selectedThesis.defenseSubmission.reportFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              📄 Báo cáo toàn văn
                            </a>
                            {selectedThesis.defenseSubmission.slideFileUrl && (
                              <a
                                href={selectedThesis.defenseSubmission.slideFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                📊 Slide bảo vệ
                              </a>
                            )}
                            <a
                              href={selectedThesis.defenseSubmission.sourceCodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              💻 Source code
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          Sinh viên chưa nộp hồ sơ bảo vệ trực tuyến.
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <h3 className="font-bold">Phiếu đánh giá của GVHD (BM-05)</h3>
                    <form onSubmit={handleSupervisorEvaluate} className="mt-4 space-y-4">
                      <label className="block text-sm">
                        Điểm hướng dẫn (Thang 10, chiếm 30% điểm tổng kết)
                        <Input
                          name="supervisorScore"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          required
                          defaultValue={selectedThesis.defenseSubmission?.supervisorScore || "8.5"}
                        />
                      </label>
                      <label className="block text-sm">
                        Quyết định cho phép bảo vệ
                        <select
                          name="supervisorDecision"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          required
                          defaultValue={selectedThesis.defenseSubmission?.supervisorDecision || "CHO_BAO_VE"}
                        >
                          <option value="CHO_BAO_VE">Đồng ý cho bảo vệ trước Hội đồng</option>
                          <option value="KHONG_CHO_BAO_VE">Không cho phép bảo vệ</option>
                        </select>
                      </label>
                      <label className="block text-sm">
                        Nhận xét đánh giá của GVHD
                        <Textarea
                          name="supervisorComments"
                          rows={4}
                          placeholder="Ý kiến nhận xét về tinh thần, thái độ và chất lượng khóa luận..."
                          defaultValue={selectedThesis.defenseSubmission?.supervisorComments || ""}
                        />
                      </label>
                      <Button disabled={busy} type="submit">
                        Lưu nhận xét & Điểm BM-05
                      </Button>
                    </form>
                  </Card>
                </div>
              ) : (
                <Card>
                  <p className="text-center text-slate-500">Chưa có đề tài nào để chấm điểm.</p>
                </Card>
              )}
            </div>
          )}

          {/* TAB 5: ĐÁNH GIÁ PHẢN BIỆN (BM-06) */}
          {tab === "reviewer" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Đánh giá Phản biện (BM-06)</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Xem hồ sơ và thực hiện đánh giá độc lập cho các đề tài bạn được phân công phản biện.
                </p>
              </div>

              {reviewerAssignments.length === 0 ? (
                <Card className="py-12 text-center text-slate-400">
                  Bạn hiện chưa được phân công phản biện đề tài nào trong học kỳ này.
                </Card>
              ) : (
                <div className="grid gap-5 lg:grid-cols-3">
                  {/* Danh sách đề tài phản biện */}
                  <div className="space-y-3 lg:col-span-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Đề tài phân công ({reviewerAssignments.length})
                    </p>
                    {reviewerAssignments.map((ra) => (
                      <button
                        key={ra.id}
                        onClick={() => setSelectedReviewerId(ra.id)}
                        className={`w-full text-left rounded-xl border p-4 transition ${
                          selectedReviewerAssignment?.id === ra.id
                            ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#10192e]"
                        }`}
                      >
                        <p className="font-bold text-sm line-clamp-2">{ra.thesis?.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          SV: <b>{ra.thesis?.student?.user?.fullName}</b> ({ra.thesis?.student?.studentCode})
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            GVHD: {ra.thesis?.supervisor?.user?.fullName || "—"}
                          </span>
                          {ra.reviewerScore !== null && ra.reviewerScore !== undefined ? (
                            <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              {ra.reviewerScore} đ
                            </span>
                          ) : (
                            <span className="text-amber-500 font-semibold">Chờ chấm</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Chi tiết & Form chấm điểm phản biện */}
                  {selectedReviewerAssignment && (
                    <div className="space-y-4 lg:col-span-2">
                      <Card className="space-y-3">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                          <div>
                            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              #{selectedReviewerAssignment.thesisId}
                            </span>
                            <h3 className="font-bold text-base mt-1">
                              {selectedReviewerAssignment.thesis?.title}
                            </h3>
                          </div>
                          {selectedReviewerAssignment.decision && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                selectedReviewerAssignment.decision === "CHO_BAO_VE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {selectedReviewerAssignment.decision === "CHO_BAO_VE"
                                ? "ĐỦ ĐIỀU KIỆN BẢO VỆ"
                                : "KHÔNG ĐƯỢC BẢO VỆ"}
                            </span>
                          )}
                        </div>

                        {/* File nộp của sinh viên */}
                        {selectedReviewerAssignment.thesis?.defenseSubmission ? (
                          <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900 flex items-center justify-between">
                            <span>Tài liệu sinh viên đã nộp:</span>
                            <div className="flex gap-3 font-semibold text-sky-600">
                              <a
                                href={selectedReviewerAssignment.thesis.defenseSubmission.reportFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                📄 Báo cáo toàn văn
                              </a>
                              {selectedReviewerAssignment.thesis.defenseSubmission.slideFileUrl && (
                                <a
                                  href={selectedReviewerAssignment.thesis.defenseSubmission.slideFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline"
                                >
                                  📊 Slide bảo vệ
                                </a>
                              )}
                              <a
                                href={selectedReviewerAssignment.thesis.defenseSubmission.sourceCodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                💻 Source Code
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-500 italic">Sinh viên chưa nộp hồ sơ bảo vệ.</p>
                        )}

                        {/* Form chấm điểm */}
                        <form onSubmit={handleEvaluateReviewer} className="space-y-4 pt-2">
                          <div>
                            <label className="text-xs font-semibold">Ghi chú sơ bộ / Nhận xét tổng quan</label>
                            <Input
                              name="preliminaryNotes"
                              defaultValue={selectedReviewerAssignment.preliminaryNotes || ""}
                              placeholder="Nhận xét sơ bộ về tính thực tiễn..."
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold">Nhận xét chi tiết phản biện (BM-06) *</label>
                            <Textarea
                              name="detailedReview"
                              required
                              rows={4}
                              defaultValue={selectedReviewerAssignment.detailedReview || ""}
                              placeholder="Đánh giá về tính mới, phương pháp nghiên cứu, kết quả đạt được, thiếu sót cần bổ sung..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold">Quyết định bảo vệ *</label>
                              <select
                                name="decision"
                                required
                                defaultValue={selectedReviewerAssignment.decision || "CHO_BAO_VE"}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                              >
                                <option value="CHO_BAO_VE">ĐỦ ĐIỀU KIỆN BẢO VỆ TRƯỚC HỘI ĐỒNG</option>
                                <option value="KHONG_CHO_BAO_VE">KHÔNG ĐƯỢC BẢO VỆ</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold">Điểm phản biện (0 - 10) *</label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                name="reviewerScore"
                                required
                                defaultValue={selectedReviewerAssignment.reviewerScore ?? 8.0}
                              />
                            </div>
                          </div>

                          <div className="pt-2 text-right">
                            <Button disabled={busy} type="submit">
                              {selectedReviewerAssignment.reviewerScore !== null &&
                              selectedReviewerAssignment.reviewerScore !== undefined
                                ? "Cập nhật đánh giá phản biện"
                                : "Lưu đánh giá phản biện (BM-06)"}
                            </Button>
                          </div>
                        </form>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HỘI ĐỒNG BẢO VỆ (BM-07 & BM-08) */}
          {tab === "councils" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Hội đồng bảo vệ KLTN (BM-07 & BM-08)</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chấm điểm trong các phiên bảo vệ hội đồng và lập biên bản tổng kết (dành cho Thư ký).
                </p>
              </div>

              {councils.length === 0 ? (
                <Card className="py-12 text-center text-slate-400">
                  Hiện chưa có Hội đồng bảo vệ nào được phân công.
                </Card>
              ) : (
                <div className="space-y-6">
                  {councils.map((c) => {
                    const myRole = c.members.find(
                      (m) => m.lecturer.user.email === user?.email,
                    )?.role;

                    return (
                      <Card key={c.id} className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                {c.code}
                              </span>
                              <h3 className="font-bold text-lg">{c.name}</h3>
                              {myRole && (
                                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                  Vai trò của bạn: {myRole === "CHU_TICH" ? "CHỦ TỊCH" : myRole === "THU_KY" ? "THƯ KÝ" : "ỦY VIÊN"}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Phòng: <b>{c.location || "Chưa xếp"}</b> · Ngày:{" "}
                              <b>{c.defenseDate ? new Date(c.defenseDate).toLocaleDateString("vi-VN") : "Chưa có ngày"}</b>
                            </p>
                          </div>
                        </div>

                        {/* Danh sách đề tài trong hội đồng */}
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-slate-400 uppercase">
                            Các đề tài bảo vệ trong phiên ({c.assignments?.length || 0})
                          </p>
                          {c.assignments && c.assignments.length > 0 ? (
                            c.assignments.map((a) => (
                              <div
                                key={a.id}
                                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <span className="text-xs font-bold text-sky-600">
                                      #{a.orderNumber || "—"} · Giờ: {a.scheduledTime || "Chưa đặt"}
                                    </span>
                                    <h4 className="font-bold text-base mt-0.5">{a.thesis.title}</h4>
                                    <p className="text-xs text-slate-500">
                                      SV: <b>{a.thesis.student?.user?.fullName}</b> ({a.thesis.student?.studentCode}) · GVHD:{" "}
                                      {a.thesis.supervisor?.user?.fullName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-400">Điểm Hội đồng / Tổng kết</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                      {a.councilScore ?? "—"} / {a.finalScore ?? "—"} đ
                                    </p>
                                  </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                  {/* Form Thành viên chấm điểm BM-07 */}
                                  <form onSubmit={(e) => handleScoreCouncil(a.id, e)} className="space-y-2">
                                    <p className="text-xs font-bold text-sky-600">Chấm điểm cá nhân (BM-07):</p>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        name="score"
                                        required
                                        placeholder="Điểm (0-10)"
                                        className="w-32"
                                      />
                                      <Input
                                        name="comments"
                                        placeholder="Nhận xét câu hỏi / trả lời..."
                                        className="flex-1"
                                      />
                                      <Button disabled={busy} type="submit" className="text-xs shrink-0">
                                        Lưu điểm
                                      </Button>
                                    </div>
                                  </form>

                                  {/* Form Thư ký hoàn tất biên bản BM-08 */}
                                  {(myRole === "THU_KY" || user?.roles?.includes("ADMIN") || user?.roles?.includes("GIAO_VU")) && (
                                    <form onSubmit={(e) => handleFinalizeMinute(a.id, e)} className="space-y-2">
                                      <p className="text-xs font-bold text-purple-600">Thư ký lập biên bản (BM-08):</p>
                                      <div className="flex gap-2">
                                        <Input
                                          name="minuteNotes"
                                          placeholder="Tóm tắt biên bản hội đồng..."
                                          className="flex-1"
                                        />
                                        <Button
                                          disabled={busy}
                                          type="submit"
                                          className="text-xs shrink-0 bg-purple-600 hover:bg-purple-700"
                                        >
                                          Tính điểm TK
                                        </Button>
                                      </div>
                                    </form>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Hội đồng này chưa được xếp đề tài nào.</p>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ĐỀ TÀI GỢI Ý CỦA GIẢNG VIÊN */}
          {tab === "suggestions" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Đề tài gợi ý của bạn</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Công bố các đề tài nghiên cứu để sinh viên đăng ký trực tiếp.
                  </p>
                </div>
              </div>

              <Card>
                <h3 className="font-bold">Công bố đề tài gợi ý mới</h3>
                <form onSubmit={handleCreateSuggestion} className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm md:col-span-2">
                    Tên đề tài
                    <Input name="title" required placeholder="Ví dụ: Ứng dụng AI phân tích dữ liệu y tế..." />
                  </label>
                  <label className="text-sm">
                    Lĩnh vực nghiên cứu
                    <select
                      name="fieldId"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="">Chọn lĩnh vực</option>
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    Số sinh viên tối đa
                    <Input name="maxSlots" type="number" min="1" max="5" defaultValue="2" required />
                  </label>
                  <label className="text-sm md:col-span-2">
                    Mô tả yêu cầu và định hướng
                    <Textarea name="description" rows={3} placeholder="Mô tả công nghệ sử dụng, mục tiêu đề tài..." />
                  </label>
                  <div className="md:col-span-2">
                    <Button disabled={busy} type="submit">
                      Đăng đề tài gợi ý
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                {suggestions.map((s) => (
                  <Card key={s.id} className="flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-lg">{s.title}</p>
                      <p className="mt-2 text-sm text-slate-500">{s.description || "Chưa có mô tả"}</p>
                      <p className="mt-3 text-xs text-sky-600 font-medium">
                        {s.field?.name || "Lĩnh vực chung"} · Tối đa {s.maxSlots} sinh viên
                      </p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3 text-right dark:border-slate-800">
                      <button
                        onClick={() => handleDeleteSuggestion(s.id)}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Xóa đề tài này
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
