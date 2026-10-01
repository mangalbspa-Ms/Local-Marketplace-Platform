/**
 * Local Marketplace Platform - Server Entry Point
 * Express API + Vite Middleware
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/server/routes/index.ts';
import { requestLogger } from './src/server/middleware/logging.middleware.ts';
import { rateLimiter } from './src/server/middleware/rateLimiter.middleware.ts';
import { errorHandler } from './src/server/middleware/error.middleware.ts';
import { Logger } from './src/server/utils/logger.ts';
import { serverConfig } from './src/server/config/env.ts';

async function bootstrap() {
  const app = express();
  const PORT = 3000;

  // Trust reverse proxy (Google Cloud Run / nginx)
  app.set('trust proxy', 1);

  // CORS & Preflight handling for browser and iframe preview
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-user-id, x-user-id, x-correlation-id, Origin, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 600 }));

  // Direct Android APK download endpoint
  app.get(['/download/apk', '/LocalMandi-Platform.apk'], (req, res) => {
    const apkPath = path.join(process.cwd(), 'android-build', 'LocalMandi-Platform.apk');
    res.download(apkPath, 'LocalMandi-Platform.apk', (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({
          success: false,
          error: {
            code: 'APK_NOT_FOUND',
            message: 'Android APK build not found. Please build the APK first.',
          },
        });
      }
    });
  });

  // API Routes
  app.use('/api', apiRouter);

  // Error Handler for API routes
  app.use('/api', errorHandler);

  // API 404 handler - ensure /api requests NEVER return SPA index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `API endpoint ${req.method} ${req.originalUrl} not found`,
        statusCode: 404,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Vite middleware for development / Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Fallback Error Handler
  app.use(errorHandler);

  const configCheck = serverConfig.validateConfig();

  app.listen(PORT, '0.0.0.0', () => {
    Logger.info(`Local Marketplace Core Server is running on port ${PORT}`, {
      environment: serverConfig.nodeEnv,
      apiHealth: `http://localhost:${PORT}/api/health`,
      status: configCheck.valid ? 'READY' : 'CONFIG_WARNING',
      warnings: configCheck.warnings,
    });
  });
}

bootstrap().catch((err) => {
  Logger.error('Failed to start server:', err);
  process.exit(1);
});
