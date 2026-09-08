/**
 * Product & Inventory Routes
 * Strictly Enforces Shop Isolation
 */

import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { requireSeller } from '../middleware/role.middleware.ts';
import { verifyShopOwnership, verifyResourceShopMatch } from '../middleware/shopIsolation.middleware.ts';

const router = Router();

// Public / Customer shop catalog browsing
router.get('/products/search', ProductController.searchProducts);
router.get('/shops/:shopId/products', ProductController.listByShop);
router.get('/products/:id', ProductController.getProduct);
router.get('/shops/:shopId/products/duplicates', ProductController.checkDuplicates);
router.post('/products/parse-bulk-text', ProductController.parseBulkText);

// Seller shop management endpoints
router.post(
  '/shops/:shopId/products',
  authenticate(true),
  requireSeller,
  verifyShopOwnership(),
  ProductController.createProduct
);

router.post(
  '/shops/:shopId/products/bulk',
  authenticate(true),
  requireSeller,
  verifyShopOwnership(),
  ProductController.bulkCreateProducts
);

router.patch(
  '/products/:id',
  authenticate(true),
  requireSeller,
  verifyResourceShopMatch('PRODUCT'),
  ProductController.updateProduct
);

router.patch(
  '/products/:id/stock',
  authenticate(true),
  requireSeller,
  verifyResourceShopMatch('PRODUCT'),
  ProductController.updateStock
);

router.delete(
  '/products/:id',
  authenticate(true),
  requireSeller,
  verifyResourceShopMatch('PRODUCT'),
  ProductController.deleteProduct
);

export default router;
