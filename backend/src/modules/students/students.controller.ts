import type { Request, Response } from "express";
import * as studentService from "./students.service.js";

export async function getAll(req: Request, res: Response) {
  try {
    const { cohort, className, major, search } = req.query;

    const data = await studentService.getAllStudents({
      cohort: cohort as string | undefined,
      className: className as string | undefined,
      major: major as string | undefined,
      search: search as string | undefined,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách sinh viên";
    return res.status(500).json({ success: false, message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await studentService.getStudentById(id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sinh viên" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy thông tin sinh viên";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, studentCode, className, cohort, major } =
      req.body;

    if (!email || !password || !fullName || !studentCode) {
      return res.status(400).json({
        success: false,
        message: "email, password, fullName, studentCode là bắt buộc",
      });
    }

    const data = await studentService.createStudent({
      email,
      password,
      fullName,
      phone,
      studentCode,
      className,
      cohort,
      major,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo sinh viên";
    return res.status(400).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await studentService.updateStudent(id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật sinh viên";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await studentService.deleteStudent(id);
    return res.json({ success: true, message: "Đã xóa sinh viên" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa sinh viên";
    return res.status(400).json({ success: false, message });
  }
}