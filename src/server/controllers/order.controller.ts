/**
 * Order Controller
 */

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.ts';
import { CommissionService } from '../services/commission.service.ts';
import { db } from '../storage/db.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError, ForbiddenError } from '../utils/errors.ts';
import { OrderStatus } from '../../types/order.ts';

export class OrderController {
  public static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = req.fullUser!;
      const order = OrderService.createOrder(customer, req.body);
      return ResponseUtil.created(res, order, 'Order created in PAYMENT_PENDING state');
    } catch (err) {
      next(err);
    }
  }

  public static async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const orders = OrderService.listOrdersForUser(req.user!, status);
      return ResponseUtil.success(res, orders);
    } catch (err) {
      next(err);
    }
  }

  public static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = OrderService.getOrderById(req.params.id, req.user!);
      return ResponseUtil.success(res, order);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const targetStatus = (req.body.targetStatus || req.body.status) as OrderStatus;
      const note = req.body.note || req.body.notes;
      if (!targetStatus) {
        throw new ValidationError('targetStatus (or status) is required.');
      }
      const order = OrderService.updateOrderStatus(req.params.id, targetStatus, req.user!, note);
      return ResponseUtil.success(res, order, `Order status updated to ${targetStatus}`);
    } catch (err) {
      next(err);
    }
  }

  public static async getSellerSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user?.shopId;
      if (!shopId) {
        throw new ForbiddenError('Only sellers with associated shop can view settlements.');
      }
      const settlements = db.getSettlements(shopId);
      return ResponseUtil.success(res, settlements);
    } catch (err) {
      next(err);
    }
  }

  public static async getSellerFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user?.shopId;
      if (!shopId) {
        throw new ForbiddenError('Only sellers with associated shop can view financial summaries.');
      }
      const summary = CommissionService.calculateSellerSettlementSummary(shopId);
      return ResponseUtil.success(res, summary);
    } catch (err) {
      next(err);
    }
  }
}

