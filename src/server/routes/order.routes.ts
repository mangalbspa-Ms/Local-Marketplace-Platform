/**
 * Order Routes
 */

import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { requireCustomer } from '../middleware/role.middleware.ts';

const router = Router();

router.use('/orders', authenticate(true));
router.use('/seller', authenticate(true));

// Customer creates order
router.post('/orders', requireCustomer, OrderController.createOrder);

// Seller financial summary & settlements (strictly for the seller's shop)
router.get('/seller/settlements', OrderController.getSellerSettlements);
router.get('/seller/earnings-summary', OrderController.getSellerFinancialSummary);

// List orders for current authenticated role (Admin: all, Seller: own shop, Customer: own orders)
router.get('/orders', OrderController.listOrders);

// Get specific order details
router.get('/orders/:id', OrderController.getOrder);

// State machine status transition
router.patch('/orders/:id/status', OrderController.updateStatus);

export default router;
