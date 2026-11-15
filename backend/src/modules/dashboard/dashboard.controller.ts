import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import * as service from "./dashboard.service.js";

export async function getStats(req: AuthRequest, res: Response) {
  try {
    const { semesterId } = req.query;
    const data = await service.getDashboardStats(
      semesterId ? Number(semesterId) : undefined,
    );
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy số liệu thống kê";
    return res.status(500).json({ success: false, message });
  }
}

export async function exportExcel(req: AuthRequest, res: Response) {
  try {
    const { semesterId } = req.query;
    const buffer = await service.generateThesesExcel(
      semesterId ? Number(semesterId) : undefined,
    );

    const filename = `Danh_sach_KLTN_${semesterId ? `HK_${semesterId}` : "Toan_Khoa"}_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xuất báo cáo Excel";
    return res.status(500).json({ success: false, message });
  }
}
