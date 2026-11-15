import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from "./auth.service.js";

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    const result = await login({ email, password });

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đăng nhập thất bại";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}

export async function refreshController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "refreshToken là bắt buộc",
      });
    }

    const result = await refreshAccessToken(refreshToken);

    return res.json({
      success: true,
      message: "Làm mới access token thành công",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Làm mới token thất bại";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    await logout(refreshToken);

    return res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đăng xuất";
    return res.status(500).json({ success: false, message });
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    const result = await forgotPassword(email);

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xử lý quên mật khẩu";
    return res.status(400).json({ success: false, message });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "token và newPassword là bắt buộc",
      });
    }

    await resetPassword(token, newPassword);

    return res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại";
    return res.status(400).json({ success: false, message });
  }
}

export async function getMeController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const data = await getMe(req.user.userId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin tài khoản";
    return res.status(500).json({ success: false, message });
  }
}

export async function changePasswordController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "currentPassword và newPassword là bắt buộc",
      });
    }

    await changePassword(req.user.userId, currentPassword, newPassword);
    return res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
    return res.status(400).json({ success: false, message });
  }
}
