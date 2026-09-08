/**
 * Payment Verification Routes (Rule D)
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.use('/payments', authenticate(true));

// Create payment intent
router.post('/payments/create-intent', PaymentController.createIntent);

// Cryptographic / Gateway signature verification
router.post('/payments/verify', PaymentController.verifyPayment);

export default router;
