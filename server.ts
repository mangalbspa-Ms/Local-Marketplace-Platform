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

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 600 }));

  // API Routes
  app.use('/api', apiRouter);

  // Error Handler for API routes
  app.use('/api', errorHandler);

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
