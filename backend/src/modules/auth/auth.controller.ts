import type { Request, Response } from "express";
import { login } from "./auth.service.js";

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
