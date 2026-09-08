/**
 * Seller Billing & Subscription Routes
 */

import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { requireSeller } from '../middleware/role.middleware.ts';

const router = Router();

// Publicly available plans for authenticated sellers or discovery
router.get('/billing/plans', BillingController.listAvailablePlans);

// Protected Seller routes
router.use('/seller/billing', authenticate(true), requireSeller);
router.use('/seller/subscription', authenticate(true), requireSeller);
router.use('/seller/invoices', authenticate(true), requireSeller);

router.get('/seller/billing/summary', BillingController.getSellerBillingSummary);
router.get('/seller/billing/statements', BillingController.listStatements);

router.post('/seller/subscription/subscribe', BillingController.subscribe);
router.post('/seller/subscription/cancel', BillingController.cancelSubscription);

router.get('/seller/invoices', BillingController.listInvoices);
router.post('/seller/invoices/:invoiceId/pay', BillingController.payInvoice);

export default router;
