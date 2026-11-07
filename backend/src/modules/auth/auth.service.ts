import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../../config/jwt.js";
import type { LoginInput, AuthUser } from "./auth.types.js";

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
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