
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "KLTN Management API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
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
