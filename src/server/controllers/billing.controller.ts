/**
 * Seller Billing & Subscription Controller
 * 
 * Provides endpoints for sellers to view billing modes, active subscription,
 * available plans, pay subscription invoices, view statements and ledger.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../storage/db.ts';
import { SubscriptionService } from '../services/subscription.service.ts';
import { CommissionService } from '../services/commission.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors.ts';
import { SubscriptionPaymentStatus } from '../../types/financial.ts';

export class BillingController {
  /**
   * Get overall billing summary for seller's shop
   */
  public static async getSellerBillingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const shopId = (req.query.shopId as string) || (req.headers['x-shop-id'] as string);
      
      const shops = db.getShopsBySeller(user.userId);
      const shop = shopId ? shops.find((s) => s.id === shopId) : shops[0];

      if (!shop) {
        throw new NotFoundError('Shop for seller', user.userId);
      }

      const activeSubscription = db.getActiveSubscriptionForShop(shop.id);
      const pendingInvoices = db.getSubscriptionInvoices({
        shopId: shop.id,
        status: SubscriptionPaymentStatus.PENDING,
      });
      const recentInvoices = db.getSubscriptionInvoices({ shopId: shop.id }).slice(0, 5);
      const settlementSummary = CommissionService.calculateSellerSettlementSummary(shop.id);

      const summary = {
        shopId: shop.id,
        shopName: shop.name,
        billingMode: shop.financials.billingMode || 'COMMISSION',
        currentPlanId: shop.financials.subscriptionPlanId,
        currentPlanName: shop.financials.subscriptionPlanName,
        subscriptionStatus: activeSubscription?.status || shop.financials.subscriptionStatus || 'NONE',
        subscriptionAmount: activeSubscription?.price || shop.financials.subscriptionAmount || 0,
        commissionPercentage: shop.financials.customCommissionPercentage ?? db.getCommissionConfig().defaultPercentage,
        nextBillingDate: activeSubscription?.nextBillingDate || shop.financials.subscriptionNextDueDate,
        trialEndDate: activeSubscription?.trialEndDate,
        autoRenew: activeSubscription?.autoRenew ?? true,
        deductSubscriptionFromSettlement: shop.financials.deductSubscriptionFromSettlement ?? false,
        pendingInvoicesCount: pendingInvoices.length,
        pendingInvoicesAmount: pendingInvoices.reduce((sum, i) => sum + i.total, 0),
        recentInvoices,
        settlementSummary,
      };

      return ResponseUtil.success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List available subscription plans for seller to browse
   */
  public static async listAvailablePlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = SubscriptionService.getPlans(true);
      return ResponseUtil.success(res, plans);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Subscribe seller's shop to a plan
   */
  public static async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { shopId, planId, autoRenew, startTrial, paymentMethod } = req.body;

      if (!shopId) throw new ValidationError('shopId is required');
      if (!planId) throw new ValidationError('planId is required');

      const shop = db.getShopById(shopId);
      if (!shop) throw new NotFoundError('Shop', shopId);
      if (shop.sellerId !== user.userId) {
        throw new UnauthorizedError('You are not authorized to manage billing for this shop');
      }

      const result = await SubscriptionService.subscribeShopToPlan({
        sellerId: user.userId,
        shopId,
        planId,
        performedByUserId: user.userId,
        autoRenew,
        startTrial,
        paymentMethod,
      });

      return ResponseUtil.success(res, result, 'Subscribed to plan successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel subscription for seller's shop
   */
  public static async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { shopId, reason } = req.body;

      if (!shopId) throw new ValidationError('shopId is required');

      const shop = db.getShopById(shopId);
      if (!shop) throw new NotFoundError('Shop', shopId);
      if (shop.sellerId !== user.userId) {
        throw new UnauthorizedError('You are not authorized to cancel this subscription');
      }

      const cancelled = SubscriptionService.cancelSubscription({
        shopId,
        sellerId: user.userId,
        performedByUserId: user.userId,
        reason,
      });

      return ResponseUtil.success(res, cancelled, 'Subscription cancelled successfully. Shop returned to Commission mode.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * List invoices for seller
   */
  public static async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const shopId = req.query.shopId as string;
      const status = req.query.status as any;

      const invoices = db.getSubscriptionInvoices({
        sellerId: user.userId,
        shopId,
        status,
      });

      return ResponseUtil.success(res, invoices);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pay a subscription invoice
   */
  public static async payInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { invoiceId } = req.params;
      const { paymentMethod = 'UPI' } = req.body;

      const invoice = db.getSubscriptionInvoiceById(invoiceId);
      if (!invoice) throw new NotFoundError('Invoice', invoiceId);
      if (invoice.sellerId !== user.userId) {
        throw new UnauthorizedError('You are not authorized to pay this invoice');
      }

      const paid = await SubscriptionService.paySubscriptionInvoice({
        invoiceId,
        paymentMethod,
        performedByUserId: user.userId,
      });

      return ResponseUtil.success(res, paid, 'Invoice paid successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * List billing transactions & statements for seller
   */
  public static async listStatements(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const shopId = req.query.shopId as string;

      const transactions = db.getBillingTransactions({
        sellerId: user.userId,
        shopId,
      });

      return ResponseUtil.success(res, transactions);
    } catch (err) {
      next(err);
    }
  }
}
