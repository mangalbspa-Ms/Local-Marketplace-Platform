/**
 * Market & Shop Controller
 */

import { Request, Response, NextFunction } from 'express';
import { MarketService } from '../services/market.service.ts';
import { ResponseUtil } from '../utils/response.ts';

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
}
