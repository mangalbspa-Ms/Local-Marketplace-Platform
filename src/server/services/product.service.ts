/**
 * Product & Fractional Inventory Service
 * Enforces Shop Isolation and Server-Side Fractional Pricing
 */

import { Product, ProductUnitType } from '../../types/product.ts';
import { db } from '../storage/db.ts';
import { NotFoundError, ValidationError, ShopIsolationError } from '../utils/errors.ts';
import { AuditEventType } from '../../types/financial.ts';

export class ProductService {
  /**
   * Fetches catalog for a specific shop. Strictly filtered by shopId (Business Rule B).
   */
  public static getProductsByShop(shopId: string, availableOnly: boolean = false): Product[] {
    const products = db.getProductsByShopId(shopId);
    if (availableOnly) {
      return products.filter((p) => p.isAvailable && p.currentStockInBaseUnits > 0);
    }
    return products;
  }

  public static searchProducts(query: string, marketId?: string): { product: Product; shop: any }[] {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return db.searchProducts(query, marketId);
  }

  public static getProductById(productId: string): Product {
    const product = db.getProductById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }
    return product;
  }

  public static createProduct(sellerShopId: string, sellerUserId: string, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    if (data.shopId !== sellerShopId) {
      throw new ShopIsolationError('Cannot create a product for a shop you do not own.');
    }

    if (!data.name || !data.fractionalConfig || !data.fractionalConfig.basePrice) {
      throw new ValidationError('Product name and valid base price fractional config are required.');
    }

    const newProduct: Product = {
      id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveProduct(newProduct);

    db.recordAuditLog({
      eventType: AuditEventType.INVENTORY_RESTOCKED,
      performedByUserId: sellerUserId,
      shopId: sellerShopId,
      details: {
        productId: saved.id,
        name: saved.name,
        initialStock: saved.currentStockInBaseUnits,
        baseUnit: saved.fractionalConfig.baseUnit,
      },
    });

    return saved;
  }

  public static updateProduct(
    productId: string,
    sellerShopId: string,
    sellerUserId: string,
    updates: Partial<Product>
  ): Product {
    const existing = this.getProductById(productId);

    if (existing.shopId !== sellerShopId) {
      throw new ShopIsolationError('Access denied: Product belongs to another shop.');
    }

    const updated = db.saveProduct({
      ...existing,
      ...updates,
      shopId: sellerShopId, // Immutable shop binding
    });

    return updated;
  }

  public static updateStock(
    productId: string,
    sellerShopId: string,
    sellerUserId: string,
    newStockInBaseUnits: number
  ): Product {
    const product = this.getProductById(productId);

    if (product.shopId !== sellerShopId) {
      throw new ShopIsolationError('Cannot adjust inventory of another shop.');
    }

    if (newStockInBaseUnits < 0) {
      throw new ValidationError('Stock cannot be negative.');
    }

    const previousStock = product.currentStockInBaseUnits;
    product.currentStockInBaseUnits = newStockInBaseUnits;
    const saved = db.saveProduct(product);

    db.recordAuditLog({
      eventType: AuditEventType.INVENTORY_RESTOCKED,
      performedByUserId: sellerUserId,
      shopId: sellerShopId,
      details: {
        productId: product.id,
        name: product.name,
        previousStock,
        newStock: newStockInBaseUnits,
        baseUnit: product.fractionalConfig.baseUnit,
      },
    });

    return saved;
  }

  public static deleteProduct(productId: string, sellerShopId: string, sellerUserId: string): boolean {
    const product = this.getProductById(productId);
    if (product.shopId !== sellerShopId) {
      throw new ShopIsolationError('Cannot delete a product from another shop.');
    }

    const deleted = db.deleteProduct(productId);

    db.recordAuditLog({
      eventType: AuditEventType.PRODUCT_UPDATED,
      performedByUserId: sellerUserId,
      shopId: sellerShopId,
      details: {
        action: 'DELETED',
        productId,
        productName: product.name,
      },
    });

    return deleted;
  }
}
