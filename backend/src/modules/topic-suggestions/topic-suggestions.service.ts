import { prisma } from "../../lib/prisma.js";
import type {
  CreateTopicSuggestionInput,
  UpdateTopicSuggestionInput,
} from "./topic-suggestions.types.js";

const suggestionInclude = {
  lecturer: {
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  },
  field: true,
} as const;

export async function getAllSuggestions(filters?: {
  fieldId?: number;
  semesterId?: number;
  lecturerId?: number;
  isPublishedOnly?: boolean;
}) {
  return prisma.topicSuggestion.findMany({
    where: {
      ...(filters?.fieldId && { fieldId: filters.fieldId }),
      ...(filters?.semesterId && { semesterId: filters.semesterId }),
      ...(filters?.lecturerId && { lecturerId: filters.lecturerId }),
      ...(filters?.isPublishedOnly ? { isPublished: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: suggestionInclude,
  });
}

export async function getSuggestionById(id: number) {
  return prisma.topicSuggestion.findUnique({
    where: { id },
    include: suggestionInclude,
  });
}

export async function createSuggestion(
  lecturerId: number,
  input: CreateTopicSuggestionInput,
) {
  return prisma.topicSuggestion.create({
    data: {
      lecturerId,
      fieldId: input.fieldId ?? null,
      semesterId: input.semesterId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      maxSlots: input.maxSlots ?? 1,
      isPublished: input.isPublished ?? true,
    },
    include: suggestionInclude,
  });
}

export async function updateSuggestion(
  id: number,
  lecturerId: number | null,
  input: UpdateTopicSuggestionInput,
) {
  const item = await prisma.topicSuggestion.findUnique({ where: { id } });
  if (!item) {
    throw new Error("Không tìm thấy đề tài gợi ý");
  }

  if (lecturerId !== null && item.lecturerId !== lecturerId) {
    throw new Error("Bạn không có quyền sửa đề tài gợi ý này");
  }

  return prisma.topicSuggestion.update({
    where: { id },
    data: {
      ...(input.fieldId !== undefined && { fieldId: input.fieldId }),
      ...(input.semesterId !== undefined && { semesterId: input.semesterId }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description: input.description === null ? null : input.description.trim(),
      }),
      ...(input.maxSlots !== undefined && { maxSlots: input.maxSlots }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    },
    include: suggestionInclude,
  });
}

export async function deleteSuggestion(
  id: number,
  lecturerId: number | null,
) {
  const item = await prisma.topicSuggestion.findUnique({ where: { id } });
  if (!item) {
    throw new Error("Không tìm thấy đề tài gợi ý");
  }

  if (lecturerId !== null && item.lecturerId !== lecturerId) {
    throw new Error("Bạn không có quyền xóa đề tài gợi ý này");
  }

  return prisma.topicSuggestion.delete({ where: { id } });
}
