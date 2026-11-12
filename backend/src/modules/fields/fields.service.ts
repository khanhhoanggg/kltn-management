import { prisma } from "../../lib/prisma.js";
import type { CreateFieldInput, UpdateFieldInput } from "./fields.types.js";

export async function getAllFields() {
  return prisma.researchField.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          theses: true,
          topicSuggestions: true,
        },
      },
    },
  });
}

export async function getActiveFields() {
  return prisma.researchField.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getFieldById(id: number) {
  return prisma.researchField.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          theses: true,
          topicSuggestions: true,
        },
      },
    },
  });
}

export async function createField(input: CreateFieldInput) {
  const existing = await prisma.researchField.findUnique({
    where: { name: input.name },
  });

  if (existing) {
    throw new Error("Tên lĩnh vực nghiên cứu đã tồn tại");
  }

  return prisma.researchField.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateField(id: number, input: UpdateFieldInput) {
  const field = await prisma.researchField.findUnique({ where: { id } });

  if (!field) {
    throw new Error("Không tìm thấy lĩnh vực nghiên cứu");
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    const duplicate = await prisma.researchField.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new Error("Tên lĩnh vực nghiên cứu đã tồn tại");
    }
  }

  return prisma.researchField.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && {
        description:
          input.description === null ? null : input.description.trim(),
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteField(id: number) {
  const field = await prisma.researchField.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          theses: true,
          topicSuggestions: true,
        },
      },
    },
  });

  if (!field) {
    throw new Error("Không tìm thấy lĩnh vực nghiên cứu");
  }

  if (field._count.theses > 0 || field._count.topicSuggestions > 0) {
    throw new Error(
      "Không thể xóa lĩnh vực đang được sử dụng. Hãy vô hiệu hóa (isActive = false) thay vì xóa.",
    );
  }

  return prisma.researchField.delete({ where: { id } });
}