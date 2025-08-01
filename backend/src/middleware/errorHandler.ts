import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = {
      ...error,
      message,
      statusCode: 404,
      isOperational: true,
    } as AppError;
  }

  // Mongoose duplicate key
  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    const message = "Duplicate field value entered";
    error = {
      ...error,
      message,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = {
      ...error,
      message,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = {
      ...error,
      message,
      statusCode: 401,
      isOperational: true,
    } as AppError;
  }

  // JWT expired error
  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = {
      ...error,
      message,
      statusCode: 401,
      isOperational: true,
    } as AppError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.name || "SERVER_ERROR",
      message: error.message || "Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};
