/**
 * Market & Shop Controller
 */

import { Request, Response, NextFunction } from 'express';
import { MarketService } from '../services/market.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { db } from '../storage/db.ts';
import { UserRole } from '../../types/auth.ts';
import { Shop } from '../../types/market.ts';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.ts';
import { ImageStorageService } from '../services/imageStorage.service.ts';

export class MarketController {
  public static async listMarkets(req: Request, res: Response, next: NextFunction) {
    try {
      const markets = MarketService.getAllMarkets();
      return ResponseUtil.success(res, markets);
    } catch (err) {
      next(err);
    }
  }

  public static async listShops(req: Request, res: Response, next: NextFunction) {
    try {
      const marketId = req.query.marketId as string | undefined;
      const shops = MarketService.getShopsInMarket(marketId);
      return ResponseUtil.success(res, shops);
    } catch (err) {
      next(err);
    }
  }

  public static async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = MarketService.getShopById(req.params.shopId);
      return ResponseUtil.success(res, shop);
    } catch (err) {
      next(err);
    }
  }

  public static async updateShopStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.params.shopId;
      const sellerId = req.user!.userId;
      const updated = MarketService.updateShopOperationalStatus(shopId, sellerId, req.body);
      return ResponseUtil.success(res, updated, 'Shop settings updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async manageShopPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const caller = req.user!;

      const shop = db.getShopById(shopId);
      if (!shop) throw new NotFoundError('Shop', shopId);

      // Authorization check (Requirement 12):
      // Admin = can manage all shop profiles
      // Seller = can ONLY manage their own shop
      // Customer = forbidden
      if (caller.role === UserRole.ADMIN) {
        // Allowed
      } else if (caller.role === UserRole.SELLER) {
        if (caller.shopId !== shopId && shop.sellerId !== caller.userId) {
          throw new ForbiddenError('You do not have permission to manage photos for another shop.');
        }
      } else {
        throw new ForbiddenError('Only sellers and admins can manage shop photos.');
      }

      const { type, action, url, imageData } = req.body;
      if (!type || !['profile', 'cover'].includes(type)) {
        throw new ValidationError('Photo type must be either "profile" or "cover".');
      }
      if (!action || !['set', 'remove'].includes(action)) {
        throw new ValidationError('Action must be either "set" or "remove".');
      }

      let finalUrl = '';
      if (action === 'set') {
        if (imageData) {
          const uploadFolder = type === 'cover' ? 'covers' : 'shops';
          const uploadRes = await ImageStorageService.uploadImage(imageData, uploadFolder);
          finalUrl = uploadRes.url;
        } else if (url && typeof url === 'string') {
          finalUrl = url.trim();
        } else {
          throw new ValidationError('Either imageUrl or imageData must be provided when setting photo.');
        }
      }

      const updates: Partial<Shop> = {};
      if (type === 'profile') {
        updates.profilePhotoUrl = finalUrl;
        updates.photoUrl = finalUrl;
        updates.logoImageUrl = finalUrl;
      } else {
        updates.coverPhotoUrl = finalUrl;
        updates.bannerUrl = finalUrl;
        updates.bannerImageUrl = finalUrl;
      }

      const updatedShop = db.updateShop(shopId, updates);
      return ResponseUtil.success(
        res,
        updatedShop,
        `Shop ${type} photo ${action === 'set' ? 'updated' : 'removed'} successfully`
      );
    } catch (err) {
      next(err);
    }
  }

  public static async submitChangeRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const sellerId = req.user!.userId;
      const { requestedChanges, requestedFields, reason } = req.body;
      const effectiveChanges = requestedChanges || requestedFields;

      if (!reason || !reason.trim()) {
        throw new ValidationError('बदलाव का कारण (Reason for change) आवश्यक है।');
      }
      if (!effectiveChanges || Object.keys(effectiveChanges).length === 0) {
        throw new ValidationError('कम से कम एक फ़ील्ड में बदलाव का अनुरोध आवश्यक है।');
      }

      const result = db.submitShopChangeRequest(shopId, sellerId, effectiveChanges, reason.trim());
      return ResponseUtil.success(
        res,
        result,
        'दुकान विवरण में बदलाव का अनुरोध सफलतापूर्वक सबमिट हो गया है। एडमिन द्वारा समीक्षा के उपरांत इसे लागू किया जाएगा।'
      );
    } catch (err) {
      next(err);
    }
  }

  public static async listChangeRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const list = db.getShopChangeRequests(shopId);
      return ResponseUtil.success(res, list);
    } catch (err) {
      next(err);
    }
  }
}
