/**
 * Notification Controller
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../storage/db.ts';
import { ResponseUtil } from '../utils/response.ts';

export class NotificationController {
  public static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const shopId = req.user!.shopId;
      const notifications = db.getNotifications(userId, shopId);
      return ResponseUtil.success(res, notifications);
    } catch (err) {
      next(err);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const success = db.markNotificationAsRead(id);
      return ResponseUtil.success(res, { success });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      db.markAllNotificationsAsRead(userId);
      return ResponseUtil.success(res, { success: true });
    } catch (err) {
      next(err);
    }
  }
}
