/**
 * AI Voice Assistant, Photo Extraction, and Governance Audit Types
 */

export type AIVoiceActionType =
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRICE'
  | 'UPDATE_STOCK'
  | 'TOGGLE_AVAILABILITY'
  | 'UPDATE_SHOP_SETTINGS'
  | 'GENERAL_QUERY'
  | 'UNKNOWN';

export type AIAssistantRole = 'user' | 'assistant' | 'system';

export interface AIAssistantMessage {
  id: string;
  role: AIAssistantRole;
  content: string;
  contentHindi?: string;
  timestamp: string;
  draftAction?: AIVoiceDraft;
}

export interface ExtractedProductEntities {
  productName?: string;
  productNameHindi?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  unit?: string;
  stock?: number;
  minStockAlert?: number;
  isAvailable?: boolean;
  isOpenNow?: boolean;
  fieldToUpdate?: string;
  previousValue?: any;
  newValue?: any;
  targetProductId?: string;
  targetProductName?: string;
  rawKeywords?: string[];
}

export interface DuplicateMatchInfo {
  existingProductId: string;
  existingProductName: string;
  existingProductNameHindi?: string;
  currentPrice: number;
  currentUnit: string;
  currentStock: number;
  similarityScore: number;
}

export interface BulkProductImportItem {
  name: string;
  nameHindi?: string;
  brand?: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
}

export interface AdminAIOnboardingDraft {
  sellerName?: string;
  sellerPhone?: string;
  shopName?: string;
  category?: string;
  address?: string;
  landmark?: string;
  openTime?: string;
  closeTime?: string;
  minOrderValue?: number;
  deliveryFee?: number;
  products: BulkProductImportItem[];
}

export interface AIVoiceDraft {
  id: string;
  shopId: string;
  sellerId: string;
  actionType: AIVoiceActionType;
  extractedEntities: ExtractedProductEntities;
  duplicateMatch?: DuplicateMatchInfo;
  isDuplicateWarning?: boolean;
  missingFields: string[];
  isComplete: boolean;
  replyMessage: string;
  replyMessageHindi: string;
  confirmationPrompt: string;
  confirmationPromptHindi: string;
  status: 'PENDING_INPUT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED' | 'EXECUTED';
  createdAt: string;
}

export interface AIAuditRecord {
  id: string;
  sellerId: string;
  shopId: string;
  action: AIVoiceActionType;
  rawVoiceTranscript: string;
  language: 'hi' | 'en' | 'hinglish';
  previousValue?: any;
  newValue?: any;
  targetEntityId?: string;
  targetEntityType: 'PRODUCT' | 'SHOP' | 'INVENTORY';
  confirmationStatus: 'CONFIRMED' | 'REJECTED';
  executedAt: string;
  details?: Record<string, any>;
}

export interface PhotoExtractionResult {
  productName?: string;
  productNameHindi?: string;
  brand?: string;
  category?: string;
  packSize?: string;
  unit?: string;
  confidence: number;
  suggestedPrice?: number;
  rawOcrText?: string;
  clarificationNeeded?: string[];
}
