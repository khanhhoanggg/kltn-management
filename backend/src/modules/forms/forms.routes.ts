import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as controller from "./forms.controller.js";

const router = Router();

// Xem / tải biểu mẫu (BM01 -> BM07)
router.get("/:thesisId/:formCode", authenticate, controller.getFormHtml);

export default router;
