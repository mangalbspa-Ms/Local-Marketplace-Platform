/**
 * AI Voice Assistant, Photo Intelligence & Governance Audit Controller
 */

import { Request, Response } from 'express';
import { AIVoiceService } from '../services/aiVoice.service.ts';
import { db } from '../storage/db.ts';
import { ResponseUtil } from '../utils/response.ts';

export class AIController {
  /**
   * Process Natural Language Voice / Text Command
   * POST /api/ai/voice/parse
   */
  public static async processVoiceCommand(req: Request, res: Response) {
    try {
      const { transcript, language, draftId, shopId: reqShopId } = req.body;
      const user = (req as any).user;

      if (!transcript || typeof transcript !== 'string') {
        return ResponseUtil.badRequest(res, 'Transcript string is required');
      }

      // Shop isolation check
      const shopId = reqShopId || user.shopId;
      if (!shopId) {
        return ResponseUtil.badRequest(res, 'Shop ID is required');
      }

      if (user.role === 'SELLER' && user.shopId !== shopId) {
        return ResponseUtil.forbidden(res, 'Shop isolation violation');
      }

      const draft = await AIVoiceService.processVoiceCommand({
        transcript,
        sellerId: user.userId || user.id,
        shopId,
        language,
        draftId,
      });

      return ResponseUtil.success(res, { draft });
    } catch (err: any) {
      return ResponseUtil.serverError(res, err.message || 'Failed to process voice command');
    }
  }

  /**
   * Confirm and Execute Draft Action
   * POST /api/ai/voice/confirm
   */
  public static async confirmDraftAction(req: Request, res: Response) {
    try {
      const { draftId, overrideEntities, shopId: reqShopId } = req.body;
      const user = (req as any).user;

      if (!draftId) {
        return ResponseUtil.badRequest(res, 'draftId is required');
      }

      const shopId = reqShopId || user.shopId;
      if (!shopId) {
        return ResponseUtil.badRequest(res, 'Shop ID is required');
      }

      if (user.role === 'SELLER' && user.shopId !== shopId) {
        return ResponseUtil.forbidden(res, 'Shop isolation violation');
      }

      const result = await AIVoiceService.executeConfirmedDraft({
        draftId,
        sellerId: user.userId || user.id,
        shopId,
        overrideEntities,
      });

      return ResponseUtil.success(res, result);
    } catch (err: any) {
      return ResponseUtil.badRequest(res, err.message || 'Failed to execute confirmed draft');
    }
  }

  /**
   * Photo-assisted Product Recognition
   * POST /api/ai/photo/extract
   */
  public static async extractFromPhoto(req: Request, res: Response) {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return ResponseUtil.badRequest(res, 'imageBase64 is required');
      }

      const extracted = await AIVoiceService.extractProductFromPhoto({
        imageBase64,
        mimeType,
      });

      return ResponseUtil.success(res, { extracted });
    } catch (err: any) {
      return ResponseUtil.serverError(res, err.message || 'Failed to extract product info from photo');
    }
  }

  /**
   * Bulk Product AI Parser (Natural Spoken or Pasted List)
   * POST /api/ai/bulk/parse
   */
  public static async parseBulkProducts(req: Request, res: Response) {
    try {
      const { rawText, defaultCategory } = req.body;
      if (!rawText || typeof rawText !== 'string') {
        return ResponseUtil.badRequest(res, 'rawText string is required');
      }

      const items = await AIVoiceService.parseBulkProducts({
        rawText,
        defaultCategory,
      });

      return ResponseUtil.success(res, { items });
    } catch (err: any) {
      return ResponseUtil.serverError(res, err.message || 'Failed to parse bulk products');
    }
  }

  /**
   * Admin AI Onboarding Parser (Full Shop & Catalog Setup)
   * POST /api/ai/admin-onboard/parse
   */
  public static async parseAdminOnboarding(req: Request, res: Response) {
    try {
      const { transcript } = req.body;
      const user = (req as any).user;

      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return ResponseUtil.forbidden(res, 'Admin authorization required');
      }

      if (!transcript || typeof transcript !== 'string') {
        return ResponseUtil.badRequest(res, 'transcript string is required');
      }

      const draft = await AIVoiceService.parseAdminAIOnboarding({
        transcript,
      });

      return ResponseUtil.success(res, { draft });
    } catch (err: any) {
      return ResponseUtil.serverError(res, err.message || 'Failed to parse onboarding transcript');
    }
  }

  /**
   * List AI Governance Audits
   * GET /api/ai/audits
   */
  public static async listAudits(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { action, shopId: queryShopId } = req.query;

      let targetShopId = queryShopId as string | undefined;
      if (user.role === 'SELLER') {
        targetShopId = user.shopId;
      }

      const audits = db.getAIAudits({
        sellerId: user.role === 'SELLER' ? (user.userId || user.id) : undefined,
        shopId: targetShopId,
        action: action as string,
      });

      return ResponseUtil.success(res, { audits });
    } catch (err: any) {
      return ResponseUtil.serverError(res, err.message || 'Failed to fetch AI audit logs');
    }
  }
}
