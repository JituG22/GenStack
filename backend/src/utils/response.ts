import { Response } from "express";
import { ApiResponse, PaginationResponse } from "../types";

export const createResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: { code: string; message: string; details?: any }
): ApiResponse<T> => {
  return {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json(createResponse(true, data, message));
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errorCode?: string,
  details?: any
): Response => {
  const error = errorCode ? { code: errorCode, message, details } : undefined;
  return res
    .status(statusCode)
    .json(createResponse(false, null, message, error));
};

export const createPaginationResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginationResponse<T> => {
  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};
