import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

if (env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: MailOptions) {
  if (!transporter) {
    console.log("==================== [DEV EMAIL SIMULATION] ====================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>/g, " ").trim()}`);
    console.log("===============================================================");
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    // Không để lỗi gửi email làm crash luồng chính
    return false;
  }
}

/**
 * Gửi email chào mừng khi đăng ký / tạo tài khoản
 */
export async function sendWelcomeEmail(
  to: string,
  fullName: string,
  roleName: string,
  initialPassword?: string,
) {
  const loginUrl = `${env.FRONTEND_URL}/login`;
  const subject = `[Khoa CNTT] Thông báo cấp tài khoản hệ thống Quản lý KLTN/CĐTN`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">HỆ THỐNG QUẢN LÝ KHÓA LUẬN & CHUYÊN ĐỀ TỐT NGHIỆP</h2>
      <p>Kính gửi <strong>${fullName}</strong>,</p>
      <p>Tài khoản của bạn đã được khởi tạo thành công trên hệ thống quản lý Khóa luận / Chuyên đề tốt nghiệp - Khoa CNTT với vai trò <strong>${roleName}</strong>.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Tên đăng nhập (Email):</strong> ${to}</p>
        ${
          initialPassword
            ? `<p style="margin: 4px 0;"><strong>Mật khẩu khởi tạo:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${initialPassword}</code></p>`
            : ""
        }
      </div>

      <p style="color: #e11d48; font-size: 13px;">* Vui lòng đăng nhập và đổi mật khẩu ngay trong lần sử dụng đầu tiên để đảm bảo an toàn thông tin.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Đăng nhập hệ thống</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ Hệ thống KLTN Khoa CNTT. Vui lòng không trả lời email này.</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Gửi email đặt lại mật khẩu (Quên mật khẩu)
 */
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  token: string,
) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const subject = `[Khoa CNTT] Yêu cầu đặt lại mật khẩu hệ thống KLTN`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">YÊU CẦU ĐẶT LẠI MẬT KHẨU</h2>
      <p>Kính gửi <strong>${fullName}</strong>,</p>
      <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${to}</strong>.</p>
      <p>Vui lòng bấm vào nút bên dưới để tiến hành thiết lập mật khẩu mới (Liên kết có hiệu lực trong vòng <strong>30 phút</strong>):</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
      </div>

      <p style="font-size: 13px; color: #475569;">Nếu nút trên không hoạt động, bạn có thể sao chép và mở đường dẫn sau trong trình duyệt:</p>
      <p style="font-size: 12px; word-break: break-all; color: #2563eb;">${resetUrl}</p>

      <p style="color: #64748b; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với Giáo vụ Khoa để kiểm tra an toàn tài khoản.</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ Hệ thống KLTN Khoa CNTT. Vui lòng không trả lời email này.</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
