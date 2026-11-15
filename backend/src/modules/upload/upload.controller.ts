import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";

export async function uploadSingleFile(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được tải lên",
      });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    return res.status(201).json({
      success: true,
      message: "Tải file thành công",
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tải file lên máy chủ";
    return res.status(500).json({ success: false, message });
  }
}
