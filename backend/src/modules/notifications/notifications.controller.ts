import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import * as notificationService from "./notification.service.js";

export async function getMy(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const isRead =
      req.query.isRead !== undefined
        ? req.query.isRead === "true"
        : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const data = await notificationService.getMyNotifications(req.user.userId, {
      isRead,
      limit,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông báo";
    return res.status(500).json({ success: false, message });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const count = await notificationService.getUnreadCount(req.user.userId);
    return res.json({ success: true, data: { count } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đếm thông báo chưa đọc";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { userId, type, title, content, link } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "userId, title, content là bắt buộc",
      });
    }

    const data = await notificationService.createNotification({
      userId: Number(userId),
      type,
      title,
      content,
      link,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo thông báo";
    return res.status(400).json({ success: false, message });
  }
}

export async function createBulk(req: AuthRequest, res: Response) {
  try {
    const { userIds, type, title, content, link } = req.body;

    if (!Array.isArray(userIds) || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "userIds (array), title, content là bắt buộc",
      });
    }

    const data = await notificationService.createBulkNotifications({
      userIds: userIds.map(Number),
      type,
      title,
      content,
      link,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi gửi thông báo hàng loạt";
    return res.status(400).json({ success: false, message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    const data = await notificationService.markAsRead(id, req.user.userId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh dấu đã đọc";
    return res.status(400).json({ success: false, message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const data = await notificationService.markAllAsRead(req.user.userId);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi đánh dấu tất cả đã đọc";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực" });
    }

    const id = Number(req.params.id);
    await notificationService.deleteNotification(id, req.user.userId);
    return res.json({ success: true, message: "Đã xóa thông báo" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa thông báo";
    return res.status(400).json({ success: false, message });
  }
}