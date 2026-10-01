/**
 * In-Memory Sliding Window Rate Limiter Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.ts';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function rateLimiter(options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 300; // 300 requests per window default

  return (req: Request, res: Response, next: NextFunction) => {
    // Health checks and OPTIONS preflight bypass rate limiting
    if (req.method === 'OPTIONS' || req.path === '/health' || req.originalUrl === '/api/health') {
      return next();
    }

    const authUser = req.headers['x-auth-user-id']?.toString();
    const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
    const ip = req.ip || forwarded || 'unknown-client';
    const key = authUser ? `usr_${authUser}` : `ip_${ip}`;

    const now = Date.now();

    // Occasional cleanup of expired buckets
    if (buckets.size > 500) {
      for (const [k, b] of buckets.entries()) {
        if (now > b.resetTime) {
          buckets.delete(k);
        }
      }
    }

    const current = buckets.get(key);
    if (!current || now > current.resetTime) {
      buckets.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return next(new AppError('Too many requests. Please slow down.', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    next();
  };
}
