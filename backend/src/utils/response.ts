import { ApiResponse, PaginationResponse } from '../types';

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
    timestamp: new Date().toISOString()
  };
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
      hasPrev: page > 1
    }
  };
};
