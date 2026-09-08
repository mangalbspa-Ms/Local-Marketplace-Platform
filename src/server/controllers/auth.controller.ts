/**
 * Auth Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError, NotFoundError } from '../utils/errors.ts';
import { db } from '../storage/db.ts';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, userId } = req.body;
      const target = phone || userId;

      if (!target) {
        throw new ValidationError('Phone number or userId is required for login.');
      }

      const session = AuthService.authenticateUser(target);
      return ResponseUtil.success(res, session, 'Authentication successful');
    } catch (err) {
      next(err);
    }
  }

  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = AuthService.getUserProfile(req.user!.userId);
      return ResponseUtil.success(res, profile);
    } catch (err) {
      next(err);
    }
  }

  public static async listTestAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = AuthService.listAvailableRoleAccounts();
      return ResponseUtil.success(res, accounts, 'Test accounts retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { tag, recipientName, recipientPhone, addressLine1, addressLine2, landmark, city, pincode, coordinates, isDefault } = req.body;

      if (!recipientName || !recipientPhone || !addressLine1 || !city || !pincode) {
        throw new ValidationError('Name, phone, street/house address, city, and pincode are required.');
      }

      const updated = AuthService.addAddress(userId, {
        tag: tag || 'Home',
        recipientName,
        recipientPhone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        pincode,
        coordinates,
        isDefault: !!isDefault,
      });

      return ResponseUtil.created(res, updated, 'Address added successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.deleteAddress(userId, req.params.id);
      return ResponseUtil.success(res, updated, 'Address removed');
    } catch (err) {
      next(err);
    }
  }

  public static async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.setDefaultAddress(userId, req.params.id);
      return ResponseUtil.success(res, updated, 'Default address updated');
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = AuthService.updateProfile(userId, req.body);
      return ResponseUtil.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      if (!token) throw new ValidationError('Invitation token is required');
      const inv = db.getSellerInvitationByToken(token);
      if (!inv) throw new NotFoundError('Invalid invitation token');
      const shop = db.getShopById(inv.shopId);
      return ResponseUtil.success(res, {
        invitation: inv,
        shop,
      }, 'Invitation details retrieved');
    } catch (err) {
      next(err);
    }
  }

  public static async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new ValidationError('Invitation token is required');
      const { seller, shop, invitation } = db.acceptSellerInvitation(token);
      const session = AuthService.authenticateUser(seller.phone || seller.id);
      return ResponseUtil.success(res, {
        ...session,
        shop,
        invitation,
      }, 'Seller invitation accepted. Logged in successfully!');
    } catch (err) {
      next(err);
    }
  }
}

