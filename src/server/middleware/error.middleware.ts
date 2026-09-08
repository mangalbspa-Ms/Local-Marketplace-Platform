/**
 * Global Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.ts';
import { Logger } from '../utils/logger.ts';
import { ApiErrorResponse } from '../../types/api.ts';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const correlationId = req.correlationId || `req_${Date.now()}`;
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    errorCode = 'INVALID_JSON_BODY';
    message = 'Malformed JSON in request payload';
  }

  // Structured log for tracking
  if (statusCode >= 500) {
    Logger.error(`[${correlationId}] Server Error: ${message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    Logger.warn(`[${correlationId}] Client Error (${statusCode}): ${message}`, {
      code: errorCode,
      path: req.originalUrl,
      details,
    });
  }

  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details,
      statusCode,
    },
    meta: {
      timestamp: new Date().toISOString(),
      correlationId,
    },
  };

  res.status(statusCode).json(responseBody);
}
