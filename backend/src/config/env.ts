import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret_dev",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret_dev",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM:
    process.env.SMTP_FROM ||
    "Khoa CNTT - Quản lý KLTN <no-reply@kltn.fit.edu.vn>",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
