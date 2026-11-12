import type { Request, Response } from "express";
import * as lecturerService from "./lecturers.service.js";

export async function getAll(req: Request, res: Response) {
  try {
    const { department, search } = req.query;

    const data = await lecturerService.getAllLecturers({
      department: department as string | undefined,
      search: search as string | undefined,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách giảng viên";
    return res.status(500).json({ success: false, message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await lecturerService.getLecturerById(id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giảng viên" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin giảng viên";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      staffCode,
      degree,
      title,
      department,
      maxStudents,
    } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "email, password, fullName là bắt buộc",
      });
    }

    const data = await lecturerService.createLecturer({
      email,
      password,
      fullName,
      phone,
      staffCode,
      degree,
      title,
      department,
      maxStudents,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo giảng viên";
    return res.status(400).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await lecturerService.updateLecturer(id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật giảng viên";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await lecturerService.deleteLecturer(id);
    return res.json({ success: true, message: "Đã xóa giảng viên" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa giảng viên";
    return res.status(400).json({ success: false, message });
  }
}