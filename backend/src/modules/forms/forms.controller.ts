import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import * as service from "./forms.service.js";

export async function getFormHtml(req: AuthRequest, res: Response) {
  try {
    const thesisId = Number(req.params.thesisId);
    const formCode = String(req.params.formCode);

    const data = await service.getFormData(thesisId, formCode);

    // Nếu client yêu cầu raw html để in ấn
    if (req.query.format === "html") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(data.html);
    }

    // Mặc định trả về JSON kèm html string
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xuất biểu mẫu";
    return res.status(400).json({ success: false, message });
  }
}
