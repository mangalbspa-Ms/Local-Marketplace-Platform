/**
 * Auth Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register-seller', AuthController.registerSeller);
router.get('/me', authenticate(true), AuthController.getProfile);
router.patch('/profile', authenticate(true), AuthController.updateProfile);
router.patch('/profile/photos', authenticate(true), AuthController.manageMyPhoto);
router.patch('/users/:userId/photos', authenticate(true), AuthController.manageUserPhoto);
router.post('/profile/addresses', authenticate(true), AuthController.addAddress);
router.delete('/profile/addresses/:id', authenticate(true), AuthController.deleteAddress);
router.patch('/profile/addresses/:id/default', authenticate(true), AuthController.setDefaultAddress);
router.get('/test-accounts', AuthController.listTestAccounts);

// Seller Invitation Onboarding & Acceptance
router.get('/seller-invitations/:token', AuthController.getInvitationDetails);
router.post('/seller-invitations/accept', AuthController.acceptInvitation);

export default router;
