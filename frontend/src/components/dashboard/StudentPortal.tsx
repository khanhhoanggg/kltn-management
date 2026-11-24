"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import ProfileModal from "../ProfileModal";
import TimelineStepper from "../TimelineStepper";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  ActiveField,
  ActiveSemester,
  CheckpointDemo,
  DefenseSubmission,
  Log,
  MidtermEvaluation,
  Suggestion,
  ThesisResponse,
} from "../../lib/api";

type Tab = "news" | "internship" | "progress" | "defense" | "forms";

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

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#10192e]">
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
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={
      "rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 " +
      (props.className || "")
    }
  >
    {children}
  </button>
);

interface InternshipProps {
  thesis?: ThesisResponse;
  suggestions: Suggestion[];
  showRegister: boolean;
  setShowRegister: (show: boolean) => void;
  showChange: boolean;
  setShowChange: (show: boolean) => void;
  notify: (result: { success: boolean; message?: string }, success?: string) => void;
  reload: () => void;
}

interface ProgressProps {
  thesis?: ThesisResponse;
  logs: Log[];
  reload: () => void;
  notify: (result: { success: boolean; message?: string }, success?: string) => void;
}

interface DefenseProps {
  thesis?: ThesisResponse;
  midterm?: MidtermEvaluation | null;
  demo?: CheckpointDemo | null;
  submission: DefenseSubmission | null;
  score: string | null;
  reload: () => void;
  notify: (result: { success: boolean; message?: string }, success?: string) => void;
}

interface FormsProps {
  thesis?: ThesisResponse;
  html: string;
  setHtml: (html: string) => void;
  notify: (result: { success: boolean; message?: string }, success?: string) => void;
}

export function StudentPortal() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("news");
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [midterm, setMidterm] = useState<MidtermEvaluation | null>(null);
  const [demo, setDemo] = useState<CheckpointDemo | null>(null);
  const [submission, setSubmission] = useState<DefenseSubmission | null>(null);
  const [notifications, setNotifications] = useState<{ id: number; title: string; content?: string; createdAt: string }[]>([]);
  const [message, setMessage] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const thesis = theses[0];

  const load = async () => {
    const [thesisRes, suggestionRes, notificationRes] = await Promise.all([
      api.theses.getAll(),
      api.suggestions.getAll(),
      api.notifications.getMy(),
    ]);
    if (thesisRes.data) setTheses(thesisRes.data);
    if (suggestionRes.data) setSuggestions(suggestionRes.data);
    if (notificationRes.data) setNotifications(notificationRes.data);
  };

  const loadThesisDetail = async (id: number) => {
    const [logsRes, midtermRes, demoRes, defenseRes] = await Promise.all([
      api.supervision.get(id),
      api.evaluations.midterm(id),
      api.evaluations.demo(id),
      api.defense.get(id),
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (midtermRes.data) setMidterm(midtermRes.data);
    if (demoRes.data) setDemo(demoRes.data);
    if (defenseRes.data) setSubmission(defenseRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (thesis?.id) loadThesisDetail(thesis.id);
  }, [thesis?.id]);

  const notify = (result: { success: boolean; message?: string }, success = "Đã lưu thành công") =>
    setMessage(result.success ? success : result.message || "Có lỗi xảy ra");

  const currentScore = useMemo(() => {
    const council = submission?.thesis?.councilAssignment?.councilScore;
    const reviewer = submission?.thesis?.reviewerAssignment?.reviewerScore;
    if (submission?.supervisorScore === undefined && reviewer === undefined && council === undefined) return null;
    return (
      Number(submission?.supervisorScore || 0) * 0.3 +
      Number(reviewer || 0) * 0.2 +
      Number(council || 0) * 0.5
    ).toFixed(2);
  }, [submission]);

  const nav: { id: Tab; label: string; icon: string }[] = [
    { id: "news", label: "Tin tức", icon: "📰" },
    { id: "internship", label: "Thực tập & Khóa luận", icon: "🎓" },
    { id: "progress", label: "Báo cáo tiến độ", icon: "📑" },
    { id: "defense", label: "Hồ sơ bảo vệ & Điểm", icon: "🏆" },
    { id: "forms", label: "Biểu mẫu BM-01–07", icon: "📝" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-[#090f1d] dark:text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#0c2340] text-white md:flex">
        <div className="border-b border-white/10 p-5">
          <p className="font-bold">Quản lý KLTN/CĐTN</p>
          <p className="mt-1 text-xs text-slate-300">Cổng Sinh viên · ĐH Thăng Long</p>
        </div>
        <nav className="flex-1 p-3">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={
                "mb-1 w-full rounded-lg px-3 py-3 text-left text-sm font-medium " +
                (tab === item.id ? "bg-sky-600" : "text-slate-300 hover:bg-white/10")
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="font-semibold">{user?.fullName}</p>
          <p className="mb-2 text-xs text-slate-400">{user?.student?.studentCode || user?.email}</p>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowProfile(true)}
              className="text-sky-300 hover:text-white underline cursor-pointer"
            >
              Hồ sơ & Đổi MK
            </button>
            <span className="text-slate-500">·</span>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-[#10192e]">
          <div>
            <p className="text-sm text-slate-500">Cổng thông tin sinh viên</p>
            <h1 className="font-bold">{nav.find((x) => x.id === tab)?.label}</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
          {message && (
            <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              <span>{message}</span>
              <button onClick={() => setMessage("")}>×</button>
            </div>
          )}
          {tab === "news" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Tin tức & thông báo</h2>
                  <p className="mt-1 text-sm text-slate-500">Các cập nhật từ Khoa và giảng viên.</p>
                </div>
                <Button onClick={load}>Làm mới</Button>
              </div>
              {notifications.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {notifications.map((n) => (
                    <Card key={n.id}>
                      <p className="text-xs text-sky-600">{formatDate(n.createdAt)}</p>
                      <h3 className="mt-1 font-bold">{n.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{n.content}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <p className="py-12 text-center text-slate-500">Chưa có thông báo mới.</p>
                </Card>
              )}
            </>
          )}
          {tab === "internship" && (
            <Internship
              thesis={thesis}
              suggestions={suggestions}
              showRegister={showRegister}
              setShowRegister={setShowRegister}
              showChange={showChange}
              setShowChange={setShowChange}
              notify={notify}
              reload={load}
            />
          )}
          {tab === "progress" && (
            <Progress
              thesis={thesis}
              logs={logs}
              reload={() => thesis && loadThesisDetail(thesis.id)}
              notify={notify}
            />
          )}
          {tab === "defense" && (
            <Defense
              thesis={thesis}
              midterm={midterm}
              demo={demo}
              submission={submission}
              score={currentScore}
              reload={() => thesis && loadThesisDetail(thesis.id)}
              notify={notify}
            />
          )}
          {tab === "forms" && (
            <Forms
              thesis={thesis}
              html={formHtml}
              setHtml={setFormHtml}
              notify={notify}
            />
          )}
        </main>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}

function Internship({
  thesis,
  suggestions,
  showRegister,
  setShowRegister,
  showChange,
  setShowChange,
  notify,
  reload,
}: InternshipProps) {
  const [fields, setFields] = useState<ActiveField[]>([]);
  const [semester, setSemester] = useState<ActiveSemester | null>(null);

  useEffect(() => {
    api.fields.active().then((x) => setFields(x.data || []));
    api.semesters.active().then((x) => setSemester(x.data || null));
  }, []);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const res = await api.theses.create({
      semesterId: semester?.id,
      type: data.get("type"),
      title: data.get("title"),
      description: data.get("description"),
      fieldId: Number(data.get("fieldId")) || undefined,
      supervisorId: Number(data.get("supervisorId")) || undefined,
      outlineUrl: data.get("outlineUrl"),
    });
    notify(res, "Đã gửi đăng ký đề tài (BM-01)");
    if (res.success) {
      setShowRegister(false);
      reload();
    }
  };

  const change = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!thesis) return;
    const data = new FormData(event.currentTarget);
    const res = await api.changes.create({
      thesisId: thesis.id,
      changeType: data.get("changeType"),
      newTitle: data.get("newTitle") || undefined,
      newSupervisorId: Number(data.get("newSupervisorId")) || undefined,
      reason: data.get("reason"),
    });
    notify(res, "Đã gửi yêu cầu thay đổi (BM-04)");
    if (res.success) setShowChange(false);
  };

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thực tập & Khóa luận</h2>
          <p className="mt-1 text-sm text-slate-500">Hồ sơ đề tài, đăng ký và yêu cầu thay đổi.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowRegister(!showRegister)}>
            {thesis ? "Đăng ký đề tài khác" : "Đăng ký BM-01"}
          </Button>
          {thesis && (
            <Button
              className="bg-slate-700 hover:bg-slate-800"
              onClick={() => setShowChange(!showChange)}
            >
              Yêu cầu BM-04
            </Button>
          )}
        </div>
      </div>

      {thesis && <TimelineStepper status={thesis.status} />}

      {thesis ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-sky-600">Đề tài hiện tại</p>
              <h3 className="mt-1 text-xl font-bold">{thesis.title || "Chưa đặt tên đề tài"}</h3>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {statusText[thesis.status] || thesis.status}
            </span>
          </div>
          <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-slate-500">Giảng viên hướng dẫn</p>
              <p className="font-semibold">{thesis.supervisor?.user?.fullName || "Chưa phân công"}</p>
            </div>
            <div>
              <p className="text-slate-500">Loại hình / Lĩnh vực</p>
              <p className="font-semibold">
                {thesis.type} · {thesis.field?.name || "Chưa chọn"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500">Mô tả đề tài</p>
              <p className="mt-1">{thesis.description || "Chưa có mô tả."}</p>
            </div>
            {thesis.outlineUrl && (
              <a
                className="font-semibold text-sky-600 underline"
                href={thesis.outlineUrl}
                target="_blank"
                rel="noreferrer"
              >
                Mở đề cương chi tiết
              </a>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-center text-slate-500">Bạn chưa có hồ sơ đề tài trong học kỳ hiện tại.</p>
        </Card>
      )}
      <Card>
        <h3 className="font-bold">Đề tài gợi ý từ giảng viên</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {suggestions.length ? (
            suggestions.map((s: Suggestion) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.description || "Chưa có mô tả"}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {s.field?.name || "Chung"} · GV {s.lecturer?.user?.fullName || "—"} · {s.maxSlots} suất
                </p>
                <button
                  onClick={() => setShowRegister(true)}
                  className="mt-3 text-sm font-semibold text-sky-600"
                >
                  Chọn đề tài này
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Chưa có đề tài gợi ý được công bố.</p>
          )}
        </div>
      </Card>
      {showRegister && (
        <Card>
          <h3 className="font-bold">Đăng ký đề tài mới — BM-01</h3>
          <form onSubmit={register} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Tên đề tài
              <Input name="title" required />
            </label>
            <label className="text-sm">
              Loại hình
              <select name="type" className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-900">
                <option value="KLTN">Khóa luận tốt nghiệp</option>
                <option value="CDTN">Chuyên đề tốt nghiệp</option>
              </select>
            </label>
            <label className="text-sm">
              Lĩnh vực
              <select name="fieldId" className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-900">
                <option value="">Chọn lĩnh vực</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Mã GVHD (nếu đã chọn)
              <Input name="supervisorId" type="number" min="1" />
            </label>
            <label className="text-sm md:col-span-2">
              Mô tả
              <Textarea name="description" rows={3} />
            </label>
            <label className="text-sm md:col-span-2">
              Link đề cương / file BM-01
              <Input name="outlineUrl" type="url" required placeholder="https://..." />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Gửi đăng ký</Button>
            </div>
          </form>
        </Card>
      )}
      {showChange && (
        <Card>
          <h3 className="font-bold">Yêu cầu thay đổi — BM-04</h3>
          <form onSubmit={change} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Nội dung
              <select
                name="changeType"
                className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-900"
              >
                <option value="CHANGE_TOPIC">Đổi đề tài</option>
                <option value="CHANGE_SUPERVISOR">Đổi GVHD</option>
                <option value="BOTH">Đổi cả hai</option>
              </select>
            </label>
            <label className="text-sm">
              Tên đề tài mới (nếu có)
              <Input name="newTitle" />
            </label>
            <label className="text-sm">
              Mã GVHD mới (nếu có)
              <Input type="number" name="newSupervisorId" min="1" />
            </label>
            <label className="text-sm md:col-span-2">
              Lý do thay đổi
              <Textarea name="reason" rows={3} required minLength={5} />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Gửi yêu cầu</Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

function Progress({ thesis, logs, reload, notify }: ProgressProps) {
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!thesis) return;
    setSending(true);
    const d = new FormData(e.currentTarget);
    const res = await api.supervision.weeklyReport(thesis.id, {
      report: d.get("report"),
      progressPercentage: Number(d.get("progress")),
    });
    notify(res, "Đã gửi báo cáo tuần cho GVHD");
    if (res.success) {
      e.currentTarget.reset();
      reload();
    }
    setSending(false);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Báo cáo tiến độ</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gửi cập nhật tuần và xem nhận xét, nhiệm vụ từ GVHD.
        </p>
      </div>
      {thesis ? (
        <>
          <Card>
            <h3 className="font-bold">Gửi báo cáo tuần</h3>
            <form onSubmit={submit} className="mt-3 grid gap-3">
              <Textarea
                name="report"
                rows={4}
                required
                placeholder="Nội dung đã thực hiện, khó khăn và kế hoạch tuần tới..."
              />
              <label className="text-sm">
                Tiến độ ước tính (%)
                <Input name="progress" type="number" min="0" max="100" defaultValue="0" />
              </label>
              <div>
                <Button disabled={sending}>{sending ? "Đang gửi..." : "Gửi báo cáo"}</Button>
              </div>
            </form>
          </Card>
          <Card>
            <h3 className="font-bold">Nhật ký trao đổi</h3>
            <div className="mt-4 space-y-3">
              {logs.length ? (
                logs.map((l: Log) => (
                  <div
                    key={l.id}
                    className="border-l-4 border-sky-500 bg-slate-50 p-4 dark:bg-slate-900"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold">{formatDate(l.meetingDate)}</p>
                      {l.progressPercentage !== undefined && (
                        <span className="text-sm text-sky-600">{l.progressPercentage}%</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{l.content}</p>
                    {l.studentNotes && (
                      <p className="mt-2 rounded bg-sky-50 p-2 text-sm dark:bg-sky-950/30">
                        <b>Báo cáo/Phản hồi của bạn:</b> {l.studentNotes}
                      </p>
                    )}
                    {l.tasksAssigned && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <b>GVHD giao:</b> {l.tasksAssigned}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Chưa có nhật ký trao đổi.</p>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-center text-slate-500">
            Hãy đăng ký đề tài trước khi gửi báo cáo tiến độ.
          </p>
        </Card>
      )}
    </>
  );
}

function Defense({
  thesis,
  midterm,
  demo,
  submission,
  score,
  reload,
  notify,
}: DefenseProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submittingMidterm, setSubmittingMidterm] = useState(false);

  const uploadFile = async (file: File | null) => {
    if (!file || file.size === 0) return undefined;
    const res = await api.upload(file);
    return res.data?.fileUrl;
  };

  const handleMidtermSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!thesis) return;
    setSubmittingMidterm(true);
    const d = new FormData(e.currentTarget);
    const file = d.get("midtermFile") as File;
    const fileUrl = await uploadFile(file);
    if (!fileUrl) {
      notify({ success: false, message: "Vui lòng chọn file báo cáo giữa kỳ" });
      setSubmittingMidterm(false);
      return;
    }
    const res = await api.evaluations.submitMidterm(thesis.id, { reportFileUrl: fileUrl });
    notify(res, "Đã nộp báo cáo tiến độ giữa kỳ!");
    if (res.success) reload();
    setSubmittingMidterm(false);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!thesis) return;
    setSubmitting(true);
    const d = new FormData(e.currentTarget);
    const report = await uploadFile(d.get("report") as File);
    const slide = await uploadFile(d.get("slide") as File);
    const plagiarism = await uploadFile(d.get("plagiarism") as File);

    if (!report) {
      notify({ success: false, message: "Vui lòng chọn file báo cáo toàn văn" });
      setSubmitting(false);
      return;
    }

    const result = await api.defense.submit(thesis.id, {
      reportFileUrl: report,
      slideFileUrl: slide,
      plagiarismFileUrl: plagiarism,
      sourceCodeUrl: d.get("sourceCodeUrl"),
      plagiarismRate: Number(d.get("plagiarismRate")),
    });

    notify(result, "Đã nộp hồ sơ bảo vệ");
    if (result.success) reload();
    setSubmitting(false);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Hồ sơ bảo vệ & Điểm số</h2>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi kết quả học phần và nộp hồ sơ bảo vệ.
        </p>
      </div>
      {thesis ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="font-bold">Báo cáo & Đánh giá giữa kỳ (BM-03)</h3>
              <p className="mt-3 text-sm">
                Kết quả: <b>{midterm?.result || "Chưa đánh giá"}</b>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {midterm?.comments || "Chưa có nhận xét của GVHD."}
              </p>
              {midterm?.reportFileUrl && (
                <div className="mt-2 text-xs">
                  File đã nộp:{" "}
                  <a
                    href={midterm.reportFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-600 hover:underline"
                  >
                    Xem báo cáo giữa kỳ
                  </a>
                </div>
              )}
              <form onSubmit={handleMidtermSubmit} className="mt-3 flex items-center gap-2">
                <input
                  type="file"
                  name="midtermFile"
                  accept=".pdf,.doc,.docx"
                  required
                  className="text-xs flex-1 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-sky-700 dark:file:bg-sky-950 dark:file:text-sky-300"
                />
                <Button disabled={submittingMidterm} type="submit" className="text-xs py-1 px-2.5 shrink-0">
                  Nộp báo cáo GK
                </Button>
              </form>
            </Card>
            <Card>
              <h3 className="font-bold">Checkpoint Demo</h3>
              <p className="mt-3 text-sm">
                Kết quả: <b>{demo?.result || "Chưa đánh giá"}</b>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {demo?.demoDate ? `Lịch demo: ${formatDate(demo.demoDate)}` : "Chưa có lịch Demo."}
              </p>
            </Card>
          </div>
          <Card>
            <h3 className="font-bold">Bảng điểm BM-07</h3>
            <div className="mt-4 grid gap-3 text-center sm:grid-cols-4">
              {[
                ["GVHD (30%)", submission?.supervisorScore],
                ["GVPB (20%)", submission?.thesis?.reviewerAssignment?.reviewerScore],
                ["Hội đồng (50%)", submission?.thesis?.councilAssignment?.councilScore],
                ["Tổng kết", score],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </Card>
          {submission ? (
            <Card>
              <h3 className="font-bold">Hồ sơ đã nộp</h3>
              <p className="mt-2 text-sm text-slate-500">
                Trạng thái duyệt: <b>{submission.facultyApprovalStatus}</b> · Đạo văn:{" "}
                <b>{submission.plagiarismRate}%</b>
              </p>
              <div className="mt-3 flex gap-4 text-sm font-semibold text-sky-600">
                <a href={submission.reportFileUrl} target="_blank" rel="noreferrer">
                  Báo cáo
                </a>
                {submission.slideFileUrl && (
                  <a href={submission.slideFileUrl} target="_blank" rel="noreferrer">
                    Slide
                  </a>
                )}
                <a href={submission.sourceCodeUrl} target="_blank" rel="noreferrer">
                  Mã nguồn
                </a>
              </div>
            </Card>
          ) : (
            <Card>
              <h3 className="font-bold">Nộp hồ sơ bảo vệ</h3>
              <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  Báo cáo toàn văn (PDF/Word)
                  <Input type="file" name="report" accept=".pdf,.doc,.docx" required />
                </label>
                <label className="text-sm">
                  Slide bảo vệ
                  <Input type="file" name="slide" accept=".pdf,.ppt,.pptx" />
                </label>
                <label className="text-sm">
                  Báo cáo đạo văn
                  <Input type="file" name="plagiarism" accept=".pdf" />
                </label>
                <label className="text-sm">
                  Tỷ lệ đạo văn (%)
                  <Input name="plagiarismRate" type="number" min="0" max="100" required />
                </label>
                <label className="text-sm md:col-span-2">
                  Link source code
                  <Input
                    name="sourceCodeUrl"
                    type="url"
                    placeholder="https://github.com/..."
                    required
                  />
                </label>
                <div className="md:col-span-2">
                  <Button disabled={submitting}>
                    {submitting ? "Đang tải và nộp..." : "Nộp hồ sơ bảo vệ"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <p className="text-center text-slate-500">
            Chưa có đề tài để theo dõi hồ sơ bảo vệ.
          </p>
        </Card>
      )}
    </>
  );
}

function Forms({ thesis, html, setHtml, notify }: FormsProps) {
  const open = async (code: string) => {
    if (!thesis) return;
    const res = await api.forms.getFormHtml(thesis.id, code);
    if (res.success && res.data) setHtml(res.data.html);
    else notify(res);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Biểu mẫu chuẩn</h2>
        <p className="mt-1 text-sm text-slate-500">
          Xem trực tiếp và in các biểu mẫu BM-01 đến BM-07.
        </p>
      </div>
      {thesis ? (
        <Card>
          <div className="flex flex-wrap gap-2">
            {["BM-01", "BM-02", "BM-03", "BM-04", "BM-05", "BM-06", "BM-07"].map((code) => (
              <Button
                key={code}
                className="bg-slate-700 hover:bg-slate-800"
                onClick={() => open(code)}
              >
                {code}
              </Button>
            ))}
          </div>
          {html && (
            <>
              <div className="mt-5 overflow-hidden rounded-lg border">
                <iframe title="Biểu mẫu" className="h-[620px] w-full bg-white" srcDoc={html} />
              </div>
              <Button
                className="mt-3"
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                    w.print();
                  }
                }}
              >
                In biểu mẫu
              </Button>
            </>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-center text-slate-500">
            Bạn cần có đề tài để xem biểu mẫu theo hồ sơ.
          </p>
        </Card>
      )}
    </>
  );
}
