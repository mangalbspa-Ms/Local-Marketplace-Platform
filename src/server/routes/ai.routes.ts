/**
 * AI Voice Assistant & Photo Processing API Routes
 */

import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

// All AI assistant endpoints require authentication (Seller or Admin)
router.use('/ai', authenticate(true));

router.post('/ai/voice/parse', AIController.processVoiceCommand);
router.post('/ai/voice/confirm', AIController.confirmDraftAction);
router.post('/ai/photo/extract', AIController.extractFromPhoto);
router.post('/ai/bulk/parse', AIController.parseBulkProducts);
router.post('/ai/admin-onboard/parse', AIController.parseAdminOnboarding);
router.get('/ai/audits', AIController.listAudits);

export default router;
