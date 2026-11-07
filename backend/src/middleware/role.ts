import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
      });
    }

    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role),
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    next();
  };
}