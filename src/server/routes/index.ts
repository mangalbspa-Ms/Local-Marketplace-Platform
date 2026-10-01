/**
 * Master API Router
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import authRoutes from './auth.routes.ts';
import marketRoutes from './market.routes.ts';
import productRoutes from './product.routes.ts';
import orderRoutes from './order.routes.ts';
import paymentRoutes from './payment.routes.ts';
import notificationRoutes from './notification.routes.ts';
import adminRoutes from './admin.routes.ts';
import billingRoutes from './billing.routes.ts';
import aiRoutes from './ai.routes.ts';
import shoppingRequestRoutes from './shoppingRequest.routes.ts';
import voiceShoppingRoutes from './voiceShopping.routes.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ImageStorageService } from '../services/imageStorage.service.ts';
import { serverConfig } from '../config/env.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  const configValidation = serverConfig.validateConfig();
  return ResponseUtil.success(res, {
    status: 'HEALTHY',
    service: 'Local Marketplace Platform Core Engine',
    environment: serverConfig.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    configValidation,
  });
});

// Public Platform Configuration (safe for frontend UI consumption)
apiRouter.get('/config/public', (req, res) => {
  return ResponseUtil.success(res, {
    platformDefaults: serverConfig.platform,
    appName: 'Local Marketplace',
    paymentProvider: serverConfig.paymentGateway.provider,
  });
});

// Image Upload Endpoint (Authenticated: Customer, Seller, or Admin)
apiRouter.post('/upload/image', authenticate(false), async (req, res, next) => {
  try {
    const { image, folder, filename } = req.body;
    const result = await ImageStorageService.uploadImage(image, folder || 'products', filename);
    return ResponseUtil.created(res, result, 'Image uploaded successfully');
  } catch (err) {
    next(err);
  }
});

// Static image serving for local development storage
apiRouter.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'data', 'uploads', safeFilename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ success: false, message: 'Image not found' });
});

// Postal code proxy to prevent browser cross-origin fetch failures
apiRouter.get('/postal/:pincode', async (req, res) => {
  const pin = req.params.pincode.replace(/\D/g, '').trim();
  if (pin.length !== 6) {
    return res.json({ success: false, data: null });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const upstream = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      const data = await upstream.json();
      return res.json({ success: true, data });
    }
  } catch (_) {}
  return res.json({ success: false, data: null });
});

// Mount modular sub-routers
apiRouter.use('/auth', authRoutes);
apiRouter.use(authRoutes);
apiRouter.use(marketRoutes);
apiRouter.use(productRoutes);
apiRouter.use(orderRoutes);
apiRouter.use(paymentRoutes);
apiRouter.use(notificationRoutes);
apiRouter.use(adminRoutes);
apiRouter.use(billingRoutes);
apiRouter.use(aiRoutes);
apiRouter.use(shoppingRequestRoutes);
apiRouter.use(voiceShoppingRoutes);

export default apiRouter;
