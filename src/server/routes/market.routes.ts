/**
 * Market & Shop Routes
 */

import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { verifyShopOwnership } from '../middleware/shopIsolation.middleware.ts';

const router = Router();

router.get('/markets', MarketController.listMarkets);
router.get('/shops', MarketController.listShops);
router.get('/shops/:shopId', MarketController.getShop);
router.patch('/shops/:shopId/status', authenticate(true), verifyShopOwnership(), MarketController.updateShopStatus);

export default router;
