import { Response, NextFunction } from "express";
import { AuthRequest, UserRole } from "../types";
import { verifyToken } from "../utils/jwt";

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
      organization: decoded.organizationId || "",
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      timestamp: new Date().toISOString(),
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Access denied",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
