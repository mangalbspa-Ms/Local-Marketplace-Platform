/**
 * API Response Formatter Helpers
 */

import { Response } from 'express';
import { ApiResponse } from '../../types/api.ts';

export class ResponseUtil {
  public static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: Record<string, any>
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
    return res.status(statusCode).json(payload);
  }

  public static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    meta?: Record<string, any>
  ): Response {
    return this.success(res, data, message, 201, meta);
  }

  public static paginated<T>(
    res: Response,
    items: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    return this.success(res, items, message, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }

  public static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errorCode: string = 'ERROR',
    details?: any
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  public static badRequest(res: Response, message: string = 'Bad request', details?: any): Response {
    return this.error(res, message, 400, 'BAD_REQUEST', details);
  }

  public static forbidden(res: Response, message: string = 'Forbidden', details?: any): Response {
    return this.error(res, message, 403, 'FORBIDDEN', details);
  }

  public static notFound(res: Response, message: string = 'Not found', details?: any): Response {
    return this.error(res, message, 404, 'NOT_FOUND', details);
  }

  public static serverError(res: Response, message: string = 'Internal server error', details?: any): Response {
    return this.error(res, message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}
