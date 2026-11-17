import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken là bắt buộc"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken là bắt buộc"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "token là bắt buộc"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
