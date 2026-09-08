/**
 * Shopping Request Controller
 */

import { Request, Response, NextFunction } from 'express';
import { ShoppingRequestService } from '../services/shoppingRequest.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ShoppingRequestStatus } from '../../types/shoppingRequest.ts';

export class ShoppingRequestController {
  public static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = req.fullUser!;
      const shoppingRequest = ShoppingRequestService.createShoppingRequest(customer, req.body);
      return ResponseUtil.created(res, shoppingRequest, 'Shopping request submitted to shopkeeper.');
    } catch (err) {
      next(err);
    }
  }

  public static async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as ShoppingRequestStatus | undefined;
      const requests = ShoppingRequestService.listShoppingRequests(req.user!, status);
      return ResponseUtil.success(res, requests);
    } catch (err) {
      next(err);
    }
  }

  public static async getRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = ShoppingRequestService.getShoppingRequestById(req.params.id, req.user!);
      return ResponseUtil.success(res, request);
    } catch (err) {
      next(err);
    }
  }

  public static async finalizeBill(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = ShoppingRequestService.finalizeBill(req.params.id, req.user!, req.body);
      return ResponseUtil.success(res, updated, 'Bill finalized and sent to customer.');
    } catch (err) {
      next(err);
    }
  }

  public static async payAndConvert(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = req.fullUser!;
      const result = ShoppingRequestService.payAndConvertToOrder(req.params.id, customer, req.body);
      return ResponseUtil.success(res, result, 'Payment verified and order confirmed.');
    } catch (err) {
      next(err);
    }
  }

  public static async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const reason = req.body.reason || req.body.notes;
      const rejected = ShoppingRequestService.rejectShoppingRequest(req.params.id, req.user!, reason);
      return ResponseUtil.success(res, rejected, 'Shopping request rejected.');
    } catch (err) {
      next(err);
    }
  }

  public static async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = req.fullUser!;
      const reason = req.body.reason;
      const cancelled = ShoppingRequestService.cancelShoppingRequest(req.params.id, customer, reason);
      return ResponseUtil.success(res, cancelled, 'Shopping request cancelled.');
    } catch (err) {
      next(err);
    }
  }
}
