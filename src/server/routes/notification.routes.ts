/**
 * Notification Routes
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.use('/notifications', authenticate(true));

router.get('/notifications', NotificationController.listNotifications);
router.patch('/notifications/:id/read', NotificationController.markAsRead);
router.post('/notifications/read-all', NotificationController.markAllAsRead);

export default router;
