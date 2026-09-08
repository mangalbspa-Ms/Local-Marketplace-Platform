/**
 * Strict Shop Isolation Middleware (Business Rule A & B)
 * 
 * Guarantees that:
 * 1. A Seller can NEVER read or write any shop, product, order, inventory or customer details other than their own.
 * 2. Cross-shop leakage is audited and immediately rejected with 403 Forbidden.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../types/auth.ts';
import { ShopIsolationError, UnauthorizedError, ForbiddenError } from '../utils/errors.ts';
import { db } from '../storage/db.ts';
import { AuditEventType } from '../../types/financial.ts';

export function verifyShopOwnership() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // Admins have global multi-tenant oversight
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    if (req.user.role !== UserRole.SELLER) {
      return next(new ForbiddenError('Only sellers and admins can access shop management endpoints.'));
    }

    const sellerShopId = req.user.shopId;
    if (!sellerShopId) {
      return next(new ForbiddenError('Seller account is not linked to any active shop.'));
    }

    // Check target shop from URL params, query string, or body
    const targetShopId = req.params.shopId || req.query.shopId || req.body?.shopId;

    if (targetShopId && targetShopId !== sellerShopId) {
      db.recordAuditLog({
        eventType: AuditEventType.SHOP_ISOLATION_VIOLATION_ATTEMPT,
        performedByUserId: req.user.userId,
        sellerId: req.user.userId,
        shopId: targetShopId as string,
        details: {
          attemptedShopId: targetShopId,
          actualSellerShopId: sellerShopId,
          path: req.originalUrl,
          method: req.method,
        },
      });

      return next(
        new ShopIsolationError(
          `Shop Isolation Violation: You are assigned to shop '${sellerShopId}' and cannot access shop '${targetShopId}'.`
        )
      );
    }

    next();
  };
}

/**
 * Validates that an order or product resource strictly belongs to the requesting seller's shop.
 */
export function verifyResourceShopMatch(resourceType: 'ORDER' | 'PRODUCT') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === UserRole.ADMIN) {
      return next();
    }

    const sellerShopId = req.user?.shopId;
    const resourceId = req.params.id;

    if (!sellerShopId) {
      return next(new ForbiddenError('Seller is not bound to a shop.'));
    }

    if (resourceType === 'PRODUCT') {
      const product = db.getProductById(resourceId);
      if (product && product.shopId !== sellerShopId) {
        return next(new ShopIsolationError('Cannot modify products belonging to another shop.'));
      }
    } else if (resourceType === 'ORDER') {
      const order = db.getOrderById(resourceId);
      if (order && order.shopId !== sellerShopId) {
        return next(new ShopIsolationError('Cannot access orders belonging to another shop.'));
      }
    }

    next();
  };
}
