/**
 * Customer Voice Shopping API Routes
 * 
 * Provides semantic AI understanding of spoken customer voice requests.
 * Open to customer shoppers without seller credentials requirement.
 */

import { Router, Request, Response } from 'express';
import { AIVoiceShoppingService } from '../services/aiVoiceShopping.service.ts';
import { ResponseUtil } from '../utils/response.ts';

const router = Router();

/**
 * POST /api/customer/voice/parse
 * Extract items from customer speech using Gemini AI semantic understanding.
 */
router.post('/customer/voice/parse', async (req: Request, res: Response) => {
  try {
    const { text, language, shopProducts } = req.body;

    if (!text || typeof text !== 'string') {
      return ResponseUtil.badRequest(res, 'Spoken text utterance is required');
    }

    const items = await AIVoiceShoppingService.parseUtterance({
      text,
      language,
      shopProducts: Array.isArray(shopProducts) ? shopProducts : [],
    });

    const anyAiUsed = items.some((i) => i.usedAi);

    return ResponseUtil.success(res, {
      items,
      count: items.length,
      parsedBy: anyAiUsed ? 'gemini-ai' : 'local-deterministic',
    });
  } catch (err: any) {
    return ResponseUtil.serverError(res, err.message || 'Failed to parse voice utterance');
  }
});

export default router;
