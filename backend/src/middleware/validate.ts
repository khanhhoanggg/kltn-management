import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";

/**
 * Middleware validate request body theo Zod schema
 */
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
          errors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({
        success: false,
        message: "Lỗi kiểm tra dữ liệu đầu vào",
      });
    }
  };
}

/**
 * Middleware validate query parameters theo Zod schema
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0]?.message || "Tham số truy vấn không hợp lệ",
          errors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({
        success: false,
        message: "Lỗi kiểm tra tham số truy vấn",
      });
    }
  };
}

// Alias tiện dụng mặc định cho validateBody
export const validate = validateBody;
