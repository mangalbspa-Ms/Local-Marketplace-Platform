/**
 * Product Controller
 * Enforces Shop Isolation
 */

import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError, NotFoundError, ShopIsolationError } from '../utils/errors.ts';
import { UserRole } from '../../types/auth.ts';
import { db } from '../storage/db.ts';

export class ProductController {
  public static async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q || req.query.query || '') as string;
      const marketId = req.query.marketId as string | undefined;
      const results = ProductService.searchProducts(query, marketId);
      return ResponseUtil.success(res, results);
    } catch (err) {
      next(err);
    }
  }

  public static async listByShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.params.shopId || (req.query.shopId as string);
      if (!shopId) {
        throw new ValidationError('shopId parameter is required.');
      }
      const availableOnly = req.query.available === 'true';
      const products = ProductService.getProductsByShop(shopId, availableOnly);
      return ResponseUtil.success(res, products);
    } catch (err) {
      next(err);
    }
  }

  public static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = ProductService.getProductById(req.params.id);
      return ResponseUtil.success(res, product);
    } catch (err) {
      next(err);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerShopId = req.user!.shopId!;
      const sellerUserId = req.user!.userId;
      const created = ProductService.createProduct(sellerShopId, sellerUserId, req.body);
      return ResponseUtil.created(res, created, 'Product created in shop catalog');
    } catch (err) {
      next(err);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerShopId = req.user!.shopId!;
      const sellerUserId = req.user!.userId;
      const updated = ProductService.updateProduct(req.params.id, sellerShopId, sellerUserId, req.body);
      return ResponseUtil.success(res, updated, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  public static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerShopId = req.user!.shopId!;
      const sellerUserId = req.user!.userId;
      const { newStockInBaseUnits } = req.body;

      if (newStockInBaseUnits === undefined || typeof newStockInBaseUnits !== 'number') {
        throw new ValidationError('newStockInBaseUnits (number) is required.');
      }

      const updated = ProductService.updateStock(req.params.id, sellerShopId, sellerUserId, newStockInBaseUnits);
      return ResponseUtil.success(res, updated, 'Stock updated in base units');
    } catch (err) {
      next(err);
    }
  }

  public static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = db.getProductById(req.params.id);
      if (!product) {
        throw new NotFoundError('Product', req.params.id);
      }
      const sellerUserId = req.user!.userId;
      const sellerShopId = req.user?.shopId;

      if (req.user?.role !== UserRole.ADMIN && sellerShopId && product.shopId !== sellerShopId) {
        throw new ShopIsolationError('Cannot delete a product from another shop.');
      }

      ProductService.deleteProduct(req.params.id, product.shopId, sellerUserId);
      return ResponseUtil.success(res, { id: req.params.id }, 'Product removed from shop catalog');
    } catch (err) {
      next(err);
    }
  }

  public static async bulkCreateProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerShopId = req.user!.shopId!;
      const { products } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        throw new ValidationError('products array is required');
      }
      const saved = db.bulkUpsertProducts(sellerShopId, products);
      return ResponseUtil.created(res, { count: saved.length, products: saved }, 'Bulk products added');
    } catch (err) {
      next(err);
    }
  }

  public static async checkDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.params.shopId || req.user?.shopId;
      const { name } = req.query;
      if (!shopId || !name) {
        throw new ValidationError('shopId and name parameters are required');
      }
      const duplicates = db.findDuplicateProducts(shopId as string, name as string);
      return ResponseUtil.success(res, { duplicates, count: duplicates.length });
    } catch (err) {
      next(err);
    }
  }

  public static async parseBulkText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, defaultCategory } = req.body;
      if (!text || typeof text !== 'string') {
        throw new ValidationError('text string is required');
      }
      const parsed = db.parseBulkProductsText(text, defaultCategory || 'Grocery & Kirana');
      return ResponseUtil.success(res, { parsed, count: parsed.length });
    } catch (err) {
      next(err);
    }
  }
}
