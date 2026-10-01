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
router.patch('/shops/:shopId/photos', authenticate(true), MarketController.manageShopPhotos);
router.patch('/shops/:shopId/status', authenticate(true), verifyShopOwnership(), MarketController.updateShopStatus);
router.post('/shops/:shopId/change-request', authenticate(true), verifyShopOwnership(), MarketController.submitChangeRequest);
router.post('/shops/:shopId/change-requests', authenticate(true), verifyShopOwnership(), MarketController.submitChangeRequest);
router.get('/shops/:shopId/change-request', authenticate(true), verifyShopOwnership(), MarketController.listChangeRequests);
router.get('/shops/:shopId/change-requests', authenticate(true), verifyShopOwnership(), MarketController.listChangeRequests);

export default router;
