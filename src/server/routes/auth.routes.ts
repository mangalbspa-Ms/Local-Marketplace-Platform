/**
 * Auth Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticate(true), AuthController.getProfile);
router.patch('/profile', authenticate(true), AuthController.updateProfile);
router.post('/profile/addresses', authenticate(true), AuthController.addAddress);
router.delete('/profile/addresses/:id', authenticate(true), AuthController.deleteAddress);
router.patch('/profile/addresses/:id/default', authenticate(true), AuthController.setDefaultAddress);
router.get('/test-accounts', AuthController.listTestAccounts);

// Seller Invitation Onboarding & Acceptance
router.get('/seller-invitations/:token', AuthController.getInvitationDetails);
router.post('/seller-invitations/accept', AuthController.acceptInvitation);

export default router;
