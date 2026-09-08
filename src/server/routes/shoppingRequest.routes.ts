/**
 * Shopping Request Routes
 */

import { Router } from 'express';
import { ShoppingRequestController } from '../controllers/shoppingRequest.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { requireCustomer, requireSeller } from '../middleware/role.middleware.ts';

const router = Router();

router.use('/shopping-requests', authenticate(true));

// Customer creates shopping request
router.post('/shopping-requests', requireCustomer, ShoppingRequestController.createRequest);

// List shopping requests (for current authenticated role)
router.get('/shopping-requests', ShoppingRequestController.listRequests);

// Get specific shopping request
router.get('/shopping-requests/:id', ShoppingRequestController.getRequest);

// Seller finalizes bill
router.post('/shopping-requests/:id/finalize-bill', requireSeller, ShoppingRequestController.finalizeBill);

// Customer pays and converts to confirmed order
router.post('/shopping-requests/:id/pay', requireCustomer, ShoppingRequestController.payAndConvert);

// Seller rejects request
router.post('/shopping-requests/:id/reject', requireSeller, ShoppingRequestController.rejectRequest);

// Customer cancels request
router.post('/shopping-requests/:id/cancel', requireCustomer, ShoppingRequestController.cancelRequest);

export default router;
