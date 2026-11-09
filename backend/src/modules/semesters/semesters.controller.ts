import type { Request, Response } from "express";
import * as semesterService from "./semesters.service.js";

export async function getAll(req: Request, res: Response) {
  try {
    const data = await semesterService.getAllSemesters();
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi lấy danh sách học kỳ";
    return res.status(500).json({ success: false, message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await semesterService.getSemesterById(id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi lấy học kỳ";
    return res.status(500).json({ success: false, message });
  }
}

export async function getActive(req: Request, res: Response) {
  try {
    const data = await semesterService.getActiveSemester();
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi lấy học kỳ đang active";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, code, startDate, endDate, isActive } = req.body;

    if (!name || !code || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "name, code, startDate, endDate là bắt buộc",
      });
    }

    const data = await semesterService.createSemester({
      name,
      code,
      startDate,
      endDate,
      isActive,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi tạo học kỳ";
    return res.status(400).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await semesterService.updateSemester(id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi cập nhật học kỳ";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await semesterService.deleteSemester(id);
    return res.json({ success: true, message: "Đã xóa học kỳ" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi xóa học kỳ";
    return res.status(400).json({ success: false, message });
  }
}