import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../config/jwt.js";
import { sendPasswordResetEmail } from "../../lib/mail.js";
import type { LoginInput, AuthUser } from "./auth.types.js";

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Tài khoản đã bị khóa hoặc không hoạt động");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }

  const roles = user.roles.map((ur) => ur.role.name);

  const payload = {
    userId: user.id,
    email: user.email,
    roles,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Lưu refresh token vào DB (thời hạn 7 ngày)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles,
  };

  return {
    user: authUser,
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    throw new Error("Thiếu refresh token");
  }

  // 1. Kiểm tra trong DB xem token có tồn tại và còn hiệu lực không
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        include: {
          roles: {
            include: { role: true },
          },
        },
      },
    },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
  }

  // 2. Verify JWT signature
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Refresh token không hợp lệ");
  }

  const roles = storedToken.user.roles.map((ur) => ur.role.name);

  const newPayload = {
    userId: storedToken.user.id,
    email: storedToken.user.email,
    roles,
  };

  const newAccessToken = signAccessToken(newPayload);

  return {
    accessToken: newAccessToken,
  };
}

export async function logout(refreshToken?: string) {
  if (refreshToken) {
    // Thu hồi refresh token trong DB
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  return { success: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Để bảo mật không tiết lộ email có trong hệ thống hay không
  if (!user || user.status !== "ACTIVE") {
    return {
      message:
        "Nếu email của bạn tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư.",
    };
  }

  // Vô hiệu hóa các token reset cũ chưa dùng của user này
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Tạo token ngẫu nhiên bảo mật 64 hex characters
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Gửi email đặt lại mật khẩu
  await sendPasswordResetEmail(user.email, user.fullName, token);

  return {
    message:
      "Nếu email của bạn tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư.",
  };
}

export async function resetPassword(token: string, newPass: string) {
  if (!newPass || newPass.length < 6) {
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
  }

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (
    !resetTokenRecord ||
    resetTokenRecord.used ||
    resetTokenRecord.expiresAt < new Date()
  ) {
    throw new Error("Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (30 phút)");
  }

  const passwordHash = await bcrypt.hash(newPass, 10);

  return prisma.$transaction(async (tx) => {
    // 1. Cập nhật mật khẩu mới cho User
    await tx.user.update({
      where: { id: resetTokenRecord.userId },
      data: { passwordHash },
    });

    // 2. Đánh dấu token đã sử dụng
    await tx.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true },
    });

    // 3. Đăng xuất khỏi mọi thiết bị cũ bằng cách thu hồi tất cả refresh tokens
    await tx.refreshToken.updateMany({
      where: { userId: resetTokenRecord.userId },
      data: { revoked: true },
    });

    return { success: true };
  });
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: { role: true },
      },
      student: true,
      lecturer: true,
    },
  });

  if (!user) {
    throw new Error("Không tìm thấy thông tin tài khoản");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    status: user.status,
    roles: user.roles.map((ur) => ur.role.name),
    student: user.student,
    lecturer: user.lecturer,
    createdAt: user.createdAt,
  };
}

export async function changePassword(
  userId: number,
  currentPass: string,
  newPass: string,
) {
  if (!newPass || newPass.length < 6) {
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  const isValid = await bcrypt.compare(currentPass, user.passwordHash);
  if (!isValid) {
    throw new Error("Mật khẩu hiện tại không chính xác");
  }

  const passwordHash = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}
