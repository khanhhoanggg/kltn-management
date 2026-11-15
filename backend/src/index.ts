import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import semesterRoutes from "./modules/semesters/semesters.routes.js";
import fieldsRoutes from "./modules/fields/fields.routes.js";
import studentRoutes from "./modules/students/students.routes.js";
import lecturerRoutes from "./modules/lecturers/lecturers.routes.js";
import thesesRoutes from "./modules/theses/theses.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import supervisionRoutes from "./modules/supervision-logs/supervision.routes.js";
import evaluationRoutes from "./modules/evaluations/evaluation.routes.js";
import changeRequestRoutes from "./modules/change-requests/change-request.routes.js";
import submissionRoutes from "./modules/defense/submission.routes.js";
import reviewerRoutes from "./modules/defense/reviewer.routes.js";
import councilRoutes from "./modules/defense/council.routes.js";
import topicSuggestionRoutes from "./modules/topic-suggestions/topic-suggestions.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import formsRoutes from "./modules/forms/forms.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// Phục vụ file tĩnh trong thư mục uploads
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "KLTN Management API is running",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      database: "disconnected",
    });
  }
});

// Nhóm A: Hệ thống & Danh mục
app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/fields", fieldsRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/forms", formsRoutes);

// Nhóm B: Giai đoạn 1 - Đăng ký & Giao đề tài
app.use("/api/theses", thesesRoutes);
app.use("/api/topic-suggestions", topicSuggestionRoutes);
app.use("/api/change-requests", changeRequestRoutes);

// Nhóm C: Giai đoạn 2 - Tiến độ & Kiểm soát
app.use("/api/supervision-logs", supervisionRoutes);
app.use("/api/evaluations", evaluationRoutes);

// Nhóm D: Giai đoạn 3 - Phản biện & Bảo vệ (UC-22 -> UC-31)
app.use("/api/defense/submissions", submissionRoutes);
app.use("/api/defense/reviewers", reviewerRoutes);
app.use("/api/defense/councils", councilRoutes);

// Nhóm E: Thống kê Dashboard & Xuất Excel
app.use("/api/dashboard", dashboardRoutes);

app.listen(env.PORT, () => {
  console.log(`Backend running at http://localhost:${env.PORT}`);
});
