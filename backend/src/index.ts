import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./modules/auth/auth.routes.js";
import semesterRoutes from "./modules/semesters/semesters.routes.js";
import fieldsRoutes from "./modules/fields/fields.routes.js";
import studentRoutes from "./modules/students/students.routes.js";
import lecturerRoutes from "./modules/lecturers/lecturers.routes.js";
import thesesRoutes from "./modules/theses/theses.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

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

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/fields", fieldsRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/theses", thesesRoutes);
app.use("/api/notification", notificationRoutes);

app.listen(env.PORT, () => {
  console.log(`Backend running at http://localhost:${env.PORT}`);
});