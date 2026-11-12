import { prisma } from "../../lib/prisma.js";
import type {
  CreateNotificationInput,
  CreateBulkNotificationInput,
} from "./notification.types.js";

export async function getMyNotifications(
  userId: number,
  filters?: { isRead?: boolean; limit?: number },
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function getNotificationById(id: number, userId: number) {
  return prisma.notification.findFirst({
    where: { id, userId },
  });
}

export async function createNotification(input: CreateNotificationInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    throw new Error("Người nhận không tồn tại");
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "SYSTEM",
      title: input.title.trim(),
      content: input.content.trim(),
      link: input.link?.trim() || null,
    },
  });
}

/** Gửi hàng loạt (UC-33 – nhắc deadline, công bố quyết định…) */
export async function createBulkNotifications(
  input: CreateBulkNotificationInput,
) {
  if (!input.userIds.length) {
    throw new Error("Danh sách người nhận trống");
  }

  const data = input.userIds.map((userId) => ({
    userId,
    type: (input.type ?? "SYSTEM") as any,
    title: input.title.trim(),
    content: input.content.trim(),
    link: input.link?.trim() || null,
  }));

  const result = await prisma.notification.createMany({ data });
  return { count: result.count };
}

export async function markAsRead(id: number, userId: number) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new Error("Không tìm thấy thông báo");
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: number) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { count: result.count };
}

export async function deleteNotification(id: number, userId: number) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new Error("Không tìm thấy thông báo");
  }

  return prisma.notification.delete({ where: { id } });
}