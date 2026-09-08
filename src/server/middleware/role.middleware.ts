/**
 * Role-Based Access Control (RBAC) Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../types/auth.ts';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.ts';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required to access this endpoint'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access Denied: Role '${req.user.role}' is not authorized. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireSeller = requireRole([UserRole.SELLER, UserRole.ADMIN]);
export const requireCustomer = requireRole([UserRole.CUSTOMER, UserRole.ADMIN]);
export const requireDeliveryPerson = requireRole([UserRole.DELIVERY_PERSON, UserRole.ADMIN]);
