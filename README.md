# KLTN Management — Hệ thống Quản lý Quy trình KLTN/CĐTN (Khoa CNTT)

Ứng dụng web hỗ trợ quản lý toàn bộ quy trình thực hiện **Khóa luận Tốt nghiệp (KLTN)** và **Chuyên đề Tốt nghiệp (CĐTN)** cho Khoa Công nghệ Thông tin, từ khâu đăng ký đề tài, theo dõi tiến độ hướng dẫn, đánh giá giữa kỳ, kiểm tra demo cho đến phản biện và bảo vệ trước hội đồng.

---

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Vai trò người dùng](#vai-trò-người-dùng)
- [Chức năng chính](#chức-năng-chính)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt & chạy dự án](#hướng-dẫn-cài-đặt--chạy-dự-án)
- [Tài khoản mẫu (Seed)](#tài-khoản-mẫu-seed)
- [API Endpoints chính](#api-endpoints-chính)

---

## Công nghệ sử dụng

### Frontend (`frontend/`)
- **Framework**: Next.js 15 (`15.5.28`), React 19 (`19.1.0`)
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint 9

### Backend (`backend/`)
- **Runtime & Framework**: Node.js, Express 5 (`^5.3.0`), TypeScript
- **Database & ORM**: PostgreSQL, Prisma ORM (`^6.19.3`)
- **Xác thực & Bảo mật**: JWT (`jsonwebtoken` — Access & Refresh Token), `bcryptjs`
- **Validation**: Zod (`^4.6.7`)
- **Tiện ích khác**: `multer` (upload tệp), `nodemailer` (gửi email SMTP), `exceljs` (xuất báo cáo Excel)

---

## Vai trò người dùng

Hệ thống phân quyền theo 8 vai trò (`RoleName`):

| Vai trò | Mô tả |
| :--- | :--- |
| `ADMIN` | Quản trị hệ thống |
| `GIAO_VU` | Giáo vụ Khoa |
| `LANH_DAO` | Lãnh đạo Khoa |
| `GVHD` | Giảng viên hướng dẫn |
| `GVPB` | Giảng viên phản biện |
| `THANH_VIEN_HD` | Thành viên Hội đồng |
| `THU_KY_HD` | Thư ký Hội đồng |
| `SINH_VIEN` | Sinh viên |

---

## Chức năng chính

1. **Hệ thống & Danh mục**
   - Đăng nhập, làm mới phiên đăng nhập (Refresh Token), đặt lại mật khẩu qua email, quản lý thông tin cá nhân.
   - Quản lý Học kỳ & các mốc thời gian (`Semester`, `SemesterMilestone`).
   - Quản lý Lĩnh vực nghiên cứu (`ResearchField`), danh sách Sinh viên và Giảng viên.
   - Thông báo nội bộ, tải lên/phục vụ tệp đính kèm (`/uploads`) và quản lý biểu mẫu.

2. **Giai đoạn 1 — Đăng ký & Giao đề tài**
   - Giảng viên đề xuất hướng đề tài (`TopicSuggestion`).
   - Sinh viên đăng ký đề tài KLTN/CĐTN, GVHD xác nhận và Khoa phê duyệt giao đề tài.
   - Xử lý yêu cầu thay đổi đề tài hoặc giảng viên hướng dẫn (`ThesisChangeRequest`).

3. **Giai đoạn 2 — Tiến độ & Kiểm soát**
   - Ghi nhận nhật ký hướng dẫn (`SupervisionLog`).
   - Đánh giá giữa kỳ (`MidtermEvaluation`) và kiểm tra demo (`CheckpointDemo`).

4. **Giai đoạn 3 — Phản biện & Bảo vệ**
   - Sinh viên nộp hồ sơ, báo cáo và slide bảo vệ (`DefenseSubmission`).
   - Phân công giảng viên phản biện và chấm phản biện (`ReviewerAssignment`).
   - Thành lập Hội đồng bảo vệ, phân công đề tài vào hội đồng và chấm điểm bảo vệ (`DefenseCouncil`, `CouncilMember`, `CouncilThesisAssignment`, `CouncilScore`).

5. **Thống kê & Báo cáo**
   - Dashboard tổng hợp theo học kỳ/vai trò và hỗ trợ xuất dữ liệu ra file Excel.

### Vòng đời trạng thái đề tài (`ThesisStatus`)

```text
CHUA_DANG_KY -> CHO_GVHD_XAC_NHAN -> CHO_KHOA_GIAO -> DANG_THUC_HIEN
-> DA_DANH_GIA_GIUA_KY -> DA_KIEM_TRA_DEMO -> CHO_DUYET_HO_SO
-> CHO_PHAN_BIEN -> DU_DIEU_KIEN_BAO_VE -> DA_BAO_VE -> DA_LUU_HO_SO
(hoặc KHONG_DU_DIEU_KIEN nếu kết thúc sớm / không đạt)
```

---

## Cấu trúc thư mục

```text
kltn-management/
├── backend/
│   ├── prisma/
│   │   ├── migrations/        # Lịch sử migration PostgreSQL
│   │   ├── schema.prisma      # Định nghĩa schema cơ sở dữ liệu
│   │   └── seed.ts            # Script tạo dữ liệu mẫu ban đầu
│   ├── src/
│   │   ├── config/            # Cấu hình môi trường & JWT
│   │   ├── lib/               # Prisma client & dịch vụ gửi mail
│   │   ├── middleware/        # Auth, phân quyền, upload, validate
│   │   ├── modules/           # Các module nghiệp vụ (auth, theses, defense, ...)
│   │   └── index.ts           # Entry point Express API
│   ├── uploads/               # Thư mục lưu tệp tải lên
│   └── package.json
├── frontend/
│   ├── public/                # Tài nguyên tĩnh
│   ├── src/
│   │   ├── app/               # Next.js App Router (trang chủ, /login)
│   │   ├── components/        # Giao diện cổng Admin, Lecturer, Student & dùng chung
│   │   ├── context/           # AuthContext, ThemeContext
│   │   └── lib/               # Client gọi API backend
│   └── package.json
└── README.md
```

---

## Yêu cầu hệ thống

- **Node.js** (khuyến nghị bản LTS v20+)
- **npm**
- **PostgreSQL** đang chạy (tạo sẵn database, ví dụ `kltn_management`)

---

## Hướng dẫn cài đặt & chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd kltn-management
```

### 2. Cài đặt & chạy Backend

```bash
cd backend
npm install
```

Tạo tệp `.env` trong thư mục `backend/` với các biến môi trường sau:

```env
PORT=4000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/kltn_management?schema=public"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=development

# Cấu hình SMTP gửi email (quên mật khẩu / thông báo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="Khoa CNTT - KLTN <no-reply@kltn.fit.edu.vn>"
FRONTEND_URL="http://localhost:3000"
```

Chạy migration, tạo Prisma Client và seed dữ liệu mẫu:

```bash
npx prisma migrate dev
npx prisma db seed
```

Khởi động server backend ở chế độ phát triển:

```bash
npm run dev
```

Backend mặc định chạy tại `http://localhost:4000`. Có thể kiểm tra trạng thái qua:
- `GET http://localhost:4000/api/health`
- `GET http://localhost:4000/api/health/db`

> Để build production: `npm run build && npm start`

### 3. Cài đặt & chạy Frontend

Mở một terminal mới tại thư mục gốc dự án:

```bash
cd frontend
npm install
```

Nếu backend chạy ở địa chỉ khác `http://localhost:4000/api`, tạo tệp `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

Khởi động ứng dụng frontend:

```bash
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`

> Các script khác của frontend: `npm run build`, `npm start`, `npm run lint`.

---

## Tài khoản mẫu (Seed)

Sau khi chạy `npx prisma db seed`, hệ thống tạo sẵn học kỳ `SEM2026_HK1`, các lĩnh vực nghiên cứu và 3 tài khoản dùng để kiểm thử:

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| Admin (`ADMIN`) | `admin@kltn.edu.vn` | `Admin@123` |
| Giảng viên (`GVHD`) | `gvhd@kltn.edu.vn` | `Gvhd@123` |
| Sinh viên (`SINH_VIEN`) | `student@kltn.edu.vn` | `Student@123` |

---

## API Endpoints chính

Tất cả endpoint nghiệp vụ được mount dưới tiền tố `/api`:

- **Hệ thống & Danh mục**: `/api/auth`, `/api/semesters`, `/api/fields`, `/api/students`, `/api/lecturers`, `/api/notification`, `/api/upload`, `/api/forms`
- **Giai đoạn 1 (Đăng ký & Giao đề tài)**: `/api/theses`, `/api/topic-suggestions`, `/api/change-requests`
- **Giai đoạn 2 (Tiến độ & Kiểm soát)**: `/api/supervision-logs`, `/api/evaluations`
- **Giai đoạn 3 (Phản biện & Bảo vệ)**: `/api/defense/submissions`, `/api/defense/reviewers`, `/api/defense/councils`
- **Thống kê & Xuất Excel**: `/api/dashboard`
