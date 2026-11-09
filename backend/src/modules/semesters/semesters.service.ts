import { prisma } from "../../lib/prisma.js";
import type { CreateSemesterInput, UpdateSemesterInput } from "./semesters.types.js";

export async function getAllSemesters() {
  return prisma.semester.findMany({
    orderBy: { startDate: "desc" },
    include: {
      milestones: true,
      _count: { select: { theses: true } },
    },
  });
}

export async function getSemesterById(id: number) {
  return prisma.semester.findUnique({
    where: { id },
    include: {
      milestones: true,
      _count: { select: { theses: true } },
    },
  });
}

export async function getActiveSemester() {
  return prisma.semester.findFirst({
    where: { isActive: true },
    include: { milestones: true },
  });
}

export async function createSemester(input: CreateSemesterInput) {
  // Nếu set active = true → tắt active của học kỳ khác
  if (input.isActive) {
    await prisma.semester.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  return prisma.semester.create({
    data: {
      name: input.name,
      code: input.code,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      isActive: input.isActive ?? false,
    },
  });
}

export async function updateSemester(id: number, input: UpdateSemesterInput) {
  if (input.isActive === true) {
    await prisma.semester.updateMany({
      where: { isActive: true, NOT: { id } },
      data: { isActive: false },
    });
  }

  return prisma.semester.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteSemester(id: number) {
  return prisma.semester.delete({ where: { id } });
}