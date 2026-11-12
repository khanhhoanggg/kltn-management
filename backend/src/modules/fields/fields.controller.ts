import type { Request, Response } from "express";
import * as fieldService from "./fields.service.js";

export async function getAll(req: Request, res: Response) {
  try {
    const data = await fieldService.getAllFields();
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy danh sách lĩnh vực";
    return res.status(500).json({ success: false, message });
  }
}

export async function getActive(req: Request, res: Response) {
  try {
    const data = await fieldService.getActiveFields();
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy lĩnh vực đang active";
    return res.status(500).json({ success: false, message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await fieldService.getFieldById(id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lĩnh vực nghiên cứu" });
    }

    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi lấy lĩnh vực nghiên cứu";
    return res.status(500).json({ success: false, message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, description, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "name là bắt buộc",
      });
    }

    const data = await fieldService.createField({
      name,
      description,
      isActive,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi tạo lĩnh vực nghiên cứu";
    return res.status(400).json({ success: false, message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await fieldService.updateField(id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi cập nhật lĩnh vực nghiên cứu";
    return res.status(400).json({ success: false, message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await fieldService.deleteField(id);
    return res.json({ success: true, message: "Đã xóa lĩnh vực nghiên cứu" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lỗi xóa lĩnh vực nghiên cứu";
    return res.status(400).json({ success: false, message });
  }
}