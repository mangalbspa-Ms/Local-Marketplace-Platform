/**
 * HTTP Request Logging & Correlation Tracking Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.ts';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logInfo = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      user: req.user ? `${req.user.userId} (${req.user.role})` : 'anonymous',
    };

    if (res.statusCode >= 400) {
      Logger.warn(`HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logInfo);
    } else {
      Logger.info(`HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logInfo);
    }
  });

  next();
}
