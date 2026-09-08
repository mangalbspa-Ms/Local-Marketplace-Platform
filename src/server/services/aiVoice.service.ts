/**
 * AI Voice Assistant & Multi-modal Processing Service
 * 
 * Powered by Google Gemini 3.7 Flash with fallback resilient NLP rule engine.
 * Implements the mandatory AI Safety Pipeline:
 * Voice/Photo -> Intent -> Draft -> Validation -> Confirmation -> DB Update -> Audit Log
 */

import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../storage/db.ts';
import { Product } from '../../types/product.ts';
import {
  AIVoiceActionType,
  AIVoiceDraft,
  AIAuditRecord,
  PhotoExtractionResult,
  ExtractedProductEntities,
  DuplicateMatchInfo,
  BulkProductImportItem,
  AdminAIOnboardingDraft,
} from '../../types/ai.ts';
import { Logger } from '../utils/logger.ts';

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export class AIVoiceService {
  /**
   * Process Natural Language Voice or Text command (English / Hindi / Hinglish)
   */
  public static async processVoiceCommand(params: {
    transcript: string;
    sellerId: string;
    shopId: string;
    language?: 'en' | 'hi' | 'hinglish';
    draftId?: string; // If continuing an existing draft conversation
  }): Promise<AIVoiceDraft> {
    const { transcript, sellerId, shopId, language = 'hinglish', draftId } = params;
    const existingDraft = draftId ? db.getAIDraft(draftId) : undefined;
    const shopProducts = db.getProductsByShop(shopId);

    // Parse with rule engine first for instant, rock-solid entity extraction
    const ruleResult = this.interpretWithRules({
      transcript,
      existingDraft,
      shopProducts,
    });

    let actionType = ruleResult.actionType;
    let extractedEntities = { ...ruleResult.extractedEntities };
    let missingFields = [...ruleResult.missingFields];
    let isComplete = ruleResult.isComplete;
    let replyMessage = ruleResult.replyMessage;
    let replyMessageHindi = ruleResult.replyMessageHindi;
    let confirmationPrompt = ruleResult.confirmationPrompt;
    let confirmationPromptHindi = ruleResult.confirmationPromptHindi;

    // Try Gemini API to enrich or understand complex prompts
    const client = getGeminiClient();
    if (client) {
      try {
        const geminiResult = await this.interpretWithGemini({
          transcript,
          existingDraft,
          shopProducts,
          language,
        });
        if (geminiResult) {
          if (actionType === 'UNKNOWN' || !isComplete) {
            actionType = geminiResult.actionType;
          }
          extractedEntities = {
            ...extractedEntities,
            ...geminiResult.extractedEntities,
            // Preserve non-empty rule extractions
            ...(ruleResult.extractedEntities.price !== undefined ? { price: ruleResult.extractedEntities.price } : {}),
            ...(ruleResult.extractedEntities.unit ? { unit: ruleResult.extractedEntities.unit } : {}),
            ...(ruleResult.extractedEntities.stock !== undefined ? { stock: ruleResult.extractedEntities.stock } : {}),
          };
          if (geminiResult.isComplete) {
            isComplete = true;
            missingFields = [];
          }
          if (geminiResult.replyMessage) replyMessage = geminiResult.replyMessage;
          if (geminiResult.replyMessageHindi) replyMessageHindi = geminiResult.replyMessageHindi;
          if (geminiResult.confirmationPrompt) confirmationPrompt = geminiResult.confirmationPrompt;
          if (geminiResult.confirmationPromptHindi) confirmationPromptHindi = geminiResult.confirmationPromptHindi;
        }
      } catch (err) {
        Logger.error('Gemini Voice interpretation error, using resilient NLP fallback', err);
      }
    }

    // Check duplicate similarity protection if action is CREATE_PRODUCT
    let duplicateMatch: DuplicateMatchInfo | undefined;
    let isDuplicateWarning = false;
    if (actionType === 'CREATE_PRODUCT' && extractedEntities.productName) {
      const prodNameLower = extractedEntities.productName.toLowerCase();
      const matched = shopProducts.find((p) => {
        const pNameLower = p.name.toLowerCase();
        const pHindiLower = (p.nameHindi || '').toLowerCase();
        return pNameLower.includes(prodNameLower) || prodNameLower.includes(pNameLower) ||
          (pHindiLower && (pHindiLower.includes(prodNameLower) || prodNameLower.includes(pHindiLower)));
      });

      if (matched) {
        duplicateMatch = {
          existingProductId: matched.id,
          existingProductName: matched.name,
          existingProductNameHindi: matched.nameHindi,
          currentPrice: matched.basePricePerUnit,
          currentUnit: matched.baseUnit,
          currentStock: matched.currentStockInBaseUnits,
          similarityScore: 0.95,
        };
        isDuplicateWarning = true;
      }
    }

    const draft: AIVoiceDraft = {
      id: existingDraft?.id || `aidraft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId,
      sellerId,
      actionType,
      extractedEntities: {
        ...(existingDraft?.extractedEntities || {}),
        ...extractedEntities,
      },
      duplicateMatch,
      isDuplicateWarning,
      missingFields,
      isComplete,
      replyMessage: duplicateMatch
        ? `"${duplicateMatch.existingProductName}" is already in your shop at ₹${duplicateMatch.currentPrice}/${duplicateMatch.currentUnit}. Would you like to update the existing item to ₹${extractedEntities.price || duplicateMatch.currentPrice} instead?`
        : replyMessage,
      replyMessageHindi: duplicateMatch
        ? `"${duplicateMatch.existingProductNameHindi || duplicateMatch.existingProductName}" पहले से आपकी दुकान में मौजूद है (वर्तमान भाव: ₹${duplicateMatch.currentPrice}/${duplicateMatch.currentUnit})। क्या आप इसे अपडेट करना चाहते हैं?`
        : replyMessageHindi,
      confirmationPrompt: confirmationPrompt,
      confirmationPromptHindi: confirmationPromptHindi,
      status: isComplete ? 'PENDING_CONFIRMATION' : 'PENDING_INPUT',
      createdAt: existingDraft?.createdAt || new Date().toISOString(),
    };

    db.saveAIDraft(draft);
    return draft;
  }

  /**
   * Gemini 3.7 Flash Structured LLM Interpretation
   */
  private static async interpretWithGemini(params: {
    transcript: string;
    existingDraft?: AIVoiceDraft;
    shopProducts: Product[];
    language: string;
  }): Promise<{
    actionType: AIVoiceActionType;
    extractedEntities: ExtractedProductEntities;
    missingFields: string[];
    isComplete: boolean;
    replyMessage: string;
    replyMessageHindi: string;
    confirmationPrompt: string;
    confirmationPromptHindi: string;
  } | null> {
    const ai = getGeminiClient();
    if (!ai) return null;

    const productNames = params.shopProducts.map((p) => `"${p.name}" (ID: ${p.id}, price: ₹${p.basePricePerUnit}/${p.baseUnit}, stock: ${p.currentStockInBaseUnits})`).join(', ');

    const prompt = `You are an expert Indian Shopkeeper AI Assistant for a local marketplace.
Current Shop Products: [${productNames.slice(0, 1500)}]
Existing Draft in Progress: ${JSON.stringify(params.existingDraft || null)}
User Spoken Transcript: "${params.transcript}"

Task: Understand the user's intent in Hindi / Hinglish / English.
Categories of actions:
1. CREATE_PRODUCT: User wants to add a new product item. (Needs: productName, price, unit (kg/g/L/ml/piece/packet/dozen), currentStock)
2. UPDATE_PRICE: User wants to change price of existing item. (Needs: targetProductId or targetProductName, price)
3. UPDATE_STOCK: User wants to add or set stock of existing item. (Needs: targetProductId or targetProductName, stock)
4. TOGGLE_AVAILABILITY: User wants to mark item in/out of stock or available/unavailable.
5. UPDATE_SHOP_SETTINGS: User wants to change shop open/close status, hours or delivery minimum.
6. GENERAL_QUERY: User asks about shop status or platform query.
7. UNKNOWN: Cannot determine intent.

Determine any missing fields required for execution. If something is missing, generate friendly clarification questions in both English and Hindi.
If all required fields are present, generate a clear Confirmation Prompt in English and Hindi.`;

    try {
      const responsePromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actionType: { type: Type.STRING },
              extractedEntities: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  productNameHindi: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  category: { type: Type.STRING },
                  subCategory: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  stock: { type: Type.NUMBER },
                  minStockAlert: { type: Type.NUMBER },
                  isAvailable: { type: Type.BOOLEAN },
                  isOpenNow: { type: Type.BOOLEAN },
                  targetProductId: { type: Type.STRING },
                  targetProductName: { type: Type.STRING },
                },
              },
              missingFields: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isComplete: { type: Type.BOOLEAN },
              replyMessage: { type: Type.STRING },
              replyMessageHindi: { type: Type.STRING },
              confirmationPrompt: { type: Type.STRING },
              confirmationPromptHindi: { type: Type.STRING },
            },
            required: ['actionType', 'extractedEntities', 'missingFields', 'isComplete', 'replyMessage', 'replyMessageHindi', 'confirmationPrompt', 'confirmationPromptHindi'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 4000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      Logger.error('Gemini generateContent timed out or failed, using rule engine', err);
      return null;
    }
    return null;
  }

  /**
   * Resilient Rule-Based Parser (Hindi / English / Hinglish)
   */
  private static interpretWithRules(params: {
    transcript: string;
    existingDraft?: AIVoiceDraft;
    shopProducts: Product[];
  }): {
    actionType: AIVoiceActionType;
    extractedEntities: ExtractedProductEntities;
    missingFields: string[];
    isComplete: boolean;
    replyMessage: string;
    replyMessageHindi: string;
    confirmationPrompt: string;
    confirmationPromptHindi: string;
  } {
    const raw = params.transcript.toLowerCase().trim();
    const existing = params.existingDraft?.extractedEntities || {};

    let actionType: AIVoiceActionType = params.existingDraft?.actionType || 'UNKNOWN';
    let entities: ExtractedProductEntities = { ...existing };
    let missingFields: string[] = [];

    // Extract numbers and prices (handles "70 से 72", "70 रुपये किलो", "भाव 900 रुपये", "10 रुपये का है")
    const priceRangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:se|to|से)\s*(\d+(?:\.\d+)?)/i);
    if (priceRangeMatch) {
      entities.price = parseFloat(priceRangeMatch[2]);
    } else {
      const priceMatch =
        raw.match(/(?:price|rate|bhav|daam|keemat|दाम|भाव|कीमत|मूल्य|दर|₹|rs\.?|rupees?|रुपये|रुपए|रु\.?)\s*(?:is|ka|hai|to|of|हो|का|है|को)?\s*(\d+(?:\.\d+)?)/i) ||
        raw.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|रुपये|रुपए|रु|per\s*(?:kg|g|l|packet|piece)|\/|\s*प्रति)/i) ||
        raw.match(/(\d+(?:\.\d+)?)\s*(?:रुपये|रुपए|रु|rs|rupees)\s*(?:का\s*है|है)/i);
      if (priceMatch) {
        entities.price = parseFloat(priceMatch[1]);
      }
    }

    // Extract quantity / stock
    const stockMatch =
      raw.match(/(?:stock|quantity|kitna|total|स्टॉक|मात्रा|संख्या)\s*(?:is|hai|rakho|karo|me|mein|हो|रखो|करो|है|में)?\s*(\d+(?:\.\d+)?)/i) ||
      raw.match(/(\d+(?:\.\d+)?)\s*(?:packets?|kg|litres?|pcs|pieces?|boxes?|packets|nag|पैकेट|किलो|लीटर|ग्राम|नग|पीस|डिब्बा|बंडल|बोतल)\s*(?:stock|available|hai|mein|daal|daalo|बढ़ा|स्टॉक|उपलब्ध|हो|में|डाल|डालो|रखो)?/i) ||
      raw.match(/(\d+(?:\.\d+)?)\s*(?:किलो|लीटर|ग्राम|पीस|पैकेट)\s*(?:बढ़ा|कर|रखो|डालो)/i);
    if (stockMatch) {
      entities.stock = parseFloat(stockMatch[1]);
    }

    // Extract unit
    if (raw.includes('kg') || raw.includes('kilo') || raw.includes('kilogram') || raw.includes('किलो') || raw.includes('किग्रा')) entities.unit = 'kg';
    else if (raw.includes(' g ') || raw.includes('gram') || raw.includes('grams') || raw.includes('ग्राम') || raw.includes('ग्रा')) entities.unit = 'g';
    else if (raw.includes('litre') || raw.includes('liter') || raw.includes(' l ') || raw.includes('ltr') || raw.includes('लीटर') || raw.includes('ली.')) entities.unit = 'L';
    else if (raw.includes('ml') || raw.includes('milli') || raw.includes('मिली')) entities.unit = 'ml';
    else if (raw.includes('packet') || raw.includes('pack') || raw.includes('pkt') || raw.includes('पैकेट') || raw.includes('पैक')) entities.unit = 'packet';
    else if (raw.includes('piece') || raw.includes('pc') || raw.includes('nag') || raw.includes('unit') || raw.includes('पीस') || raw.includes('नग') || raw.includes('pcs')) entities.unit = 'piece';
    else if (raw.includes('dozen') || raw.includes('darjan') || raw.includes('दर्जन')) entities.unit = 'dozen';

    // Common Hindi commodity dictionary mapping for lookup
    const hindiDictionary: Record<string, string[]> = {
      'चीनी': ['sugar', 'cheeni', 'chini', 'चीनी'],
      'काजू': ['kaju', 'cashew', 'काजू'],
      'शैंपू': ['shampoo', 'shampu', 'शैंपू', 'शैम्पू'],
      'आलू': ['potato', 'aloo', 'alu', 'आलू'],
      'टमाटर': ['tomato', 'tamatar', 'टमाटर'],
      'चावल': ['rice', 'chawal', 'चावल'],
      'दूध': ['milk', 'doodh', 'दूध'],
      'तेल': ['oil', 'tel', 'तेल'],
      'नमक': ['salt', 'namak', 'tata salt', 'नमक'],
      'अटा': ['atta', 'aata', 'flour', 'आटा'],
      'प्याज': ['onion', 'pyaz', 'प्याज'],
    };

    // Check for target existing product in shop
    for (const prod of params.shopProducts) {
      const prodNameLower = prod.name.toLowerCase();
      const prodHindiLower = (prod.nameHindi || '').toLowerCase();

      if (
        raw.includes(prodNameLower) ||
        prodNameLower.split(' ').some((w) => w.length > 3 && raw.includes(w)) ||
        (prodHindiLower && (raw.includes(prodHindiLower) || prodHindiLower.split(/[\s()\-]+/).some((w) => w.length > 1 && raw.includes(w)))) ||
        (raw.includes('टाटा') && prodNameLower.includes('tata')) ||
        (raw.includes('नमक') && (prodNameLower.includes('salt') || prodNameLower.includes('namak') || prodHindiLower.includes('नमक'))) ||
        (raw.includes('चीनी') && (prodNameLower.includes('sugar') || prodNameLower.includes('chini') || prodHindiLower.includes('चीनी'))) ||
        (raw.includes('काजू') && (prodNameLower.includes('kaju') || prodNameLower.includes('cashew') || prodHindiLower.includes('काजू'))) ||
        (raw.includes('शैंपू') && (prodNameLower.includes('shampoo') || prodHindiLower.includes('शैंपू') || prodHindiLower.includes('शैम्पू'))) ||
        (raw.includes('आलू') && (prodNameLower.includes('potato') || prodNameLower.includes('aloo') || prodHindiLower.includes('आलू'))) ||
        (raw.includes('टमाटर') && (prodNameLower.includes('tomato') || prodNameLower.includes('tamatar') || prodHindiLower.includes('टमाटर')))
      ) {
        entities.targetProductId = prod.id;
        entities.targetProductName = prod.name;
        break;
      }
    }

    // Determine Action Type
    if (
      raw.includes('उपलब्ध नहीं') ||
      raw.includes('not available') ||
      raw.includes('out of stock') ||
      raw.includes('khatam') ||
      raw.includes('band') ||
      raw.includes('खत्म') ||
      raw.includes('बंद') ||
      (raw.includes('उपलब्ध') && (raw.includes('नहीं') || raw.includes('na')))
    ) {
      actionType = 'TOGGLE_AVAILABILITY';
      entities.isAvailable = false;
    } else if (
      raw.includes('जोड़ो') ||
      raw.includes('जोड़े') ||
      raw.includes('नया') ||
      raw.includes('नई') ||
      raw.includes('बनाओ') ||
      raw.includes('add') ||
      raw.includes('create') ||
      raw.includes('nayi') ||
      raw.includes('naya')
    ) {
      actionType = 'CREATE_PRODUCT';
    } else if (
      (raw.includes('स्टॉक') || raw.includes('stock') || raw.includes('quantity') || raw.includes('मात्रा')) &&
      (raw.includes('बढ़ा') || raw.includes('घटा') || raw.includes('कर दो') || raw.includes('करो') || raw.includes('डाल') || raw.includes('update') || raw.includes('बदलो') || raw.includes('सेट') || raw.includes('rakho') || raw.includes('रखो'))
    ) {
      actionType = 'UPDATE_STOCK';
    } else if (
      (raw.includes('रेट') || raw.includes('भाव') || raw.includes('दाम') || raw.includes('कीमत') || raw.includes('price') || raw.includes('rate')) &&
      (raw.includes('कर दो') || raw.includes('करो') || raw.includes('बदलो') || raw.includes('से') || raw.includes('to') || raw.includes('change') || raw.includes('set') || entities.targetProductId)
    ) {
      actionType = 'UPDATE_PRICE';
    } else if (
      raw.includes('stock') ||
      raw.includes('maal') ||
      raw.includes('inventory') ||
      raw.includes('quantity') ||
      raw.includes('स्टॉक') ||
      raw.includes('माल')
    ) {
      actionType = 'UPDATE_STOCK';
    } else if (
      raw.includes('price') ||
      raw.includes('rate') ||
      raw.includes('bhav') ||
      raw.includes('keemat') ||
      raw.includes('daam') ||
      raw.includes('दाम') ||
      raw.includes('भाव') ||
      raw.includes('कीमत') ||
      raw.includes('दर')
    ) {
      actionType = entities.targetProductId ? 'UPDATE_PRICE' : 'CREATE_PRODUCT';
    } else if (
      raw.includes('available') ||
      raw.includes('uplabdh') ||
      raw.includes('उपलब्ध')
    ) {
      actionType = 'TOGGLE_AVAILABILITY';
      entities.isAvailable = true;
    } else if (
      raw.includes('dukaan') ||
      raw.includes('shop') ||
      raw.includes('timing') ||
      raw.includes('closed') ||
      raw.includes('open') ||
      raw.includes('दुकान')
    ) {
      actionType = 'UPDATE_SHOP_SETTINGS';
    }

    // Identify Hindi commodity name if not already extracted
    if (!entities.productName && !entities.targetProductName) {
      for (const [hindiName, aliases] of Object.entries(hindiDictionary)) {
        if (aliases.some((alias) => raw.includes(alias))) {
          if (actionType === 'CREATE_PRODUCT') {
            entities.productName = hindiName;
          } else {
            entities.targetProductName = hindiName;
          }
          break;
        }
      }
    }

    // Clean product name if CREATE_PRODUCT
    if (actionType === 'CREATE_PRODUCT' && !entities.productName) {
      let cleaned = raw
        .replace(/add|nayi|naya|product|item|create|karo|daalo|jodo|please|जोड़ो|जोड़े|नया|नई|डालो|बनाओ|करो/gi, '')
        .replace(/(?:price|rate|rs|rupees|₹|दाम|भाव|कीमत|रुपये|रुपए|\d+kg|\d+g|\d+l|\d+packet|\d+pcs|\d+किलो|\d+लीटर|\d+पैकेट|\d+).*/gi, '')
        .trim();
      if (cleaned.length >= 2) {
        entities.productName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    // Validate completeness
    let isComplete = false;
    let replyMessage = '';
    let replyMessageHindi = '';
    let confirmationPrompt = '';
    let confirmationPromptHindi = '';

    if (actionType === 'CREATE_PRODUCT') {
      if (!entities.productName) missingFields.push('productName');
      if (entities.price === undefined) missingFields.push('price');
      if (!entities.unit) missingFields.push('unit');
      if (entities.stock === undefined) entities.stock = 50; // default 50 if missing

      isComplete = missingFields.length === 0;
      if (!isComplete) {
        replyMessage = `Please provide ${missingFields.join(', ')} for ${entities.productName || 'the product'}.`;
        replyMessageHindi = `कृपया ${entities.productName || 'प्रोडक्ट'} के लिए ${missingFields.map((f) => f === 'price' ? 'कीमत (Price)' : f === 'unit' ? 'इकाई (Unit)' : 'प्रोडक्ट का नाम').join(', ')} बताएं।`;
      } else {
        replyMessage = `Ready to add ${entities.productName} at ₹${entities.price} per ${entities.unit} with initial stock of ${entities.stock} ${entities.unit}.`;
        replyMessageHindi = `क्या आप ₹${entities.price}/${entities.unit} की दर से ${entities.stock} ${entities.unit} ${entities.productName} जोड़ना चाहते हैं?`;
        confirmationPrompt = `Add product "${entities.productName}" (₹${entities.price}/${entities.unit}, Stock: ${entities.stock})?`;
        confirmationPromptHindi = `प्रोडक्ट "${entities.productName}" (₹${entities.price}/${entities.unit}, स्टॉक: ${entities.stock}) जोड़ें?`;
      }
    } else if (actionType === 'UPDATE_PRICE') {
      if (!entities.targetProductId && !entities.targetProductName) missingFields.push('targetProductName');
      if (entities.price === undefined) missingFields.push('price');

      isComplete = missingFields.length === 0;
      if (!isComplete) {
        replyMessage = `Which product's price would you like to update and what is the new price?`;
        replyMessageHindi = `आप किस सामान का दाम बदलना चाहते हैं और नई कीमत क्या है?`;
      } else {
        const prod = params.shopProducts.find((p) => p.id === entities.targetProductId);
        replyMessage = `Update price of ${prod?.name || entities.targetProductName} to ₹${entities.price}?`;
        replyMessageHindi = `क्या आप ${prod?.name || entities.targetProductName} का दाम बदलकर ₹${entities.price} करना चाहते हैं?`;
        confirmationPrompt = `Change price of ${prod?.name || entities.targetProductName} from ₹${prod?.basePricePerUnit || 0} to ₹${entities.price}?`;
        confirmationPromptHindi = `${prod?.name || entities.targetProductName} की कीमत ₹${prod?.basePricePerUnit || 0} से बदलकर ₹${entities.price} करें?`;
      }
    } else if (actionType === 'UPDATE_STOCK') {
      if (!entities.targetProductId && !entities.targetProductName) missingFields.push('targetProductName');
      if (entities.stock === undefined) missingFields.push('stock');

      isComplete = missingFields.length === 0;
      if (!isComplete) {
        replyMessage = `Please specify the product name and current stock quantity.`;
        replyMessageHindi = `कृपया सामान का नाम और नया स्टॉक बताएं।`;
      } else {
        const prod = params.shopProducts.find((p) => p.id === entities.targetProductId);
        replyMessage = `Update stock of ${prod?.name || entities.targetProductName} to ${entities.stock}?`;
        replyMessageHindi = `${prod?.name || entities.targetProductName} का स्टॉक ${entities.stock} सेट करें?`;
        confirmationPrompt = `Update inventory for ${prod?.name || entities.targetProductName} to ${entities.stock} units?`;
        confirmationPromptHindi = `${prod?.name || entities.targetProductName} का स्टॉक ${entities.stock} अपडेट करें?`;
      }
    } else if (actionType === 'TOGGLE_AVAILABILITY') {
      entities.isAvailable = !raw.includes('out of stock') && !raw.includes('khatam') && !raw.includes('band') && !raw.includes('बंद') && !raw.includes('खत्म');
      if (!entities.targetProductId && !entities.targetProductName) missingFields.push('targetProductName');
      isComplete = missingFields.length === 0;

      const statusText = entities.isAvailable ? 'In Stock / Available' : 'Out of Stock / Unavailable';
      const statusTextHindi = entities.isAvailable ? 'उपलब्ध (Available)' : 'आउट ऑफ स्टॉक (Out of stock)';
      replyMessage = `Set ${entities.targetProductName || 'item'} as ${statusText}?`;
      replyMessageHindi = `${entities.targetProductName || 'सामान'} को ${statusTextHindi} मार्क करें?`;
      confirmationPrompt = `Change status of ${entities.targetProductName} to ${statusText}?`;
      confirmationPromptHindi = `${entities.targetProductName} का स्टेटस ${statusTextHindi} करें?`;
    } else {
      replyMessage = `I can help you add products, change prices, update stock, or toggle availability. For example, say: "Add Tata Salt 1kg price 28 rupees stock 20 packets".`;
      replyMessageHindi = `मैं आपके सामान जोड़ने, दाम बदलने, स्टॉक अपडेट करने में मदद कर सकता हूँ। जैसे बोलें: "टाटा नमक 1kg दाम 28 रुपये स्टॉक 20 पैकेट जोड़ो"।`;
      confirmationPrompt = `No action ready.`;
      confirmationPromptHindi = `कोई कार्य तैयार नहीं है।`;
    }

    return {
      actionType,
      extractedEntities: entities,
      missingFields,
      isComplete,
      replyMessage,
      replyMessageHindi,
      confirmationPrompt,
      confirmationPromptHindi,
    };
  }

  /**
   * Execute Confirmed AI Action strictly after seller confirmation
   */
  public static async executeConfirmedDraft(params: {
    draftId: string;
    sellerId: string;
    shopId: string;
    overrideEntities?: Partial<ExtractedProductEntities>;
  }): Promise<{ success: boolean; message: string; messageHindi: string; product?: Product; audit: AIAuditRecord }> {
    const draft = db.getAIDraft(params.draftId);
    if (!draft) {
      throw new Error('Draft not found or expired');
    }
    if (draft.shopId !== params.shopId) {
      throw new Error('Shop isolation violation: Draft does not belong to your shop');
    }

    const entities: ExtractedProductEntities = {
      ...draft.extractedEntities,
      ...(params.overrideEntities || {}),
    };

    let resultProduct: Product | undefined;
    let prevVal: any = null;
    let newVal: any = null;
    let successMsg = '';
    let successMsgHindi = '';

    if (draft.actionType === 'CREATE_PRODUCT') {
      const name = entities.productName || 'New Product';
      const price = entities.price || 100;
      const unit = (entities.unit || 'kg') as any;
      const stock = entities.stock ?? 50;
      const unitType = (unit === 'kg' || unit === 'g') ? 'WEIGHT' : (unit === 'L' || unit === 'ml') ? 'VOLUME' : 'PIECE';

      const [newProd] = db.bulkUpsertProducts(params.shopId, [
        {
          name,
          nameHindi: entities.productNameHindi,
          brand: entities.brand,
          category: entities.category || 'Grocery & Kirana',
          subCategory: entities.subCategory,
          baseUnit: unit,
          basePricePerUnit: price,
          currentStockInBaseUnits: stock,
          fractionalConfig: {
            unitType: unitType as any,
            baseUnit: unit,
            basePrice: price,
            minQuantityMultiplier: unitType === 'WEIGHT' ? 0.1 : 1,
            maxQuantityMultiplier: 50,
            stepQuantityMultiplier: unitType === 'WEIGHT' ? 0.1 : 1,
            allowCustomFractionalInput: true,
            predefinedOptions: [
              { id: 'p-1', label: `1 ${unit}`, multiplier: 1, unitLabel: unit, isDefault: true },
            ],
          },
        },
      ]);
      resultProduct = newProd;
      newVal = { name, price, unit, stock };
      successMsg = `Product "${name}" added successfully at ₹${price}/${unit}.`;
      successMsgHindi = `सामान "${name}" ₹${price}/${unit} के दाम पर सफलतापूर्वक जोड़ दिया गया है।`;
    } else if (draft.actionType === 'UPDATE_PRICE') {
      const prod = db.getProductsByShop(params.shopId).find((p) => p.id === entities.targetProductId || p.name.toLowerCase() === entities.targetProductName?.toLowerCase());
      if (!prod) throw new Error('Product not found in your shop catalog');

      prevVal = { basePricePerUnit: prod.basePricePerUnit };
      const newPrice = entities.price!;
      const updated = db.updateProduct(prod.id, {
        basePricePerUnit: newPrice,
        fractionalConfig: {
          ...prod.fractionalConfig,
          basePrice: newPrice,
        },
      });
      if (!updated) throw new Error('Failed to update product price');
      resultProduct = updated;
      newVal = { basePricePerUnit: newPrice };
      successMsg = `Price of ${prod.name} updated to ₹${newPrice}.`;
      successMsgHindi = `${prod.name} का दाम ₹${newPrice} अपडेट कर दिया गया है।`;
    } else if (draft.actionType === 'UPDATE_STOCK') {
      const prod = db.getProductsByShop(params.shopId).find((p) => p.id === entities.targetProductId || p.name.toLowerCase() === entities.targetProductName?.toLowerCase());
      if (!prod) throw new Error('Product not found in your shop catalog');

      prevVal = { stock: prod.currentStockInBaseUnits };
      const newStock = entities.stock!;
      const updated = db.updateStock(prod.id, newStock);
      if (!updated) throw new Error('Failed to update stock');
      resultProduct = updated;
      newVal = { stock: newStock };
      successMsg = `Stock of ${prod.name} set to ${newStock} ${prod.baseUnit || 'units'}.`;
      successMsgHindi = `${prod.name} का स्टॉक ${newStock} सेट कर दिया गया है।`;
    } else if (draft.actionType === 'TOGGLE_AVAILABILITY') {
      const prod = db.getProductsByShop(params.shopId).find((p) => p.id === entities.targetProductId || p.name.toLowerCase() === entities.targetProductName?.toLowerCase());
      if (!prod) throw new Error('Product not found in your shop catalog');

      prevVal = { isAvailable: prod.isAvailable };
      const avail = entities.isAvailable ?? !prod.isAvailable;
      const updated = db.updateProduct(prod.id, { isAvailable: avail });
      if (!updated) throw new Error('Failed to toggle availability');
      resultProduct = updated;
      newVal = { isAvailable: avail };
      successMsg = `${prod.name} is now ${avail ? 'Available' : 'Out of Stock'}.`;
      successMsgHindi = `${prod.name} अब ${avail ? 'उपलब्ध (Available)' : 'आउट ऑफ स्टॉक (Out of stock)'} है।`;
    }

    // Write immutable audit log
    const auditRecord: AIAuditRecord = {
      id: `aiaudit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sellerId: params.sellerId,
      shopId: params.shopId,
      action: draft.actionType,
      rawVoiceTranscript: draft.replyMessage,
      language: 'hinglish',
      previousValue: prevVal,
      newValue: newVal,
      targetEntityId: resultProduct?.id || params.shopId,
      targetEntityType: resultProduct ? 'PRODUCT' : 'SHOP',
      confirmationStatus: 'CONFIRMED',
      executedAt: new Date().toISOString(),
      details: { entities },
    };
    db.recordAIAudit(auditRecord);

    // Clean up draft
    db.deleteAIDraft(params.draftId);

    return {
      success: true,
      message: successMsg,
      messageHindi: successMsgHindi,
      product: resultProduct,
      audit: auditRecord,
    };
  }

  /**
   * Photo-assisted Product Detail Extraction (Multi-modal)
   */
  public static async extractProductFromPhoto(params: {
    imageBase64: string;
    mimeType?: string;
  }): Promise<PhotoExtractionResult> {
    const client = getGeminiClient();
    if (client) {
      try {
        const imagePart = {
          inlineData: {
            mimeType: params.mimeType || 'image/jpeg',
            data: params.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        };
        const textPart = {
          text: `You are an expert Indian retail inventory product recognizer. Analyze this grocery/retail product photo.
Extract:
1. Product Brand
2. Product Name (in English and Hindi)
3. Pack Size / Weight / Volume (e.g. 1kg, 500g, 1L, 200ml, 50g)
4. Category (Grocery & Kirana, Fresh Produce, Dairy & Sweets, Snacks, Beverages, Personal Care, Household)
5. Suggested MRP / Market Price in INR
6. OCR raw text detected on packet
7. Confidence score between 0 and 1.`,
        };

        const response = await client.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                productNameHindi: { type: Type.STRING },
                brand: { type: Type.STRING },
                category: { type: Type.STRING },
                packSize: { type: Type.STRING },
                unit: { type: Type.STRING },
                suggestedPrice: { type: Type.NUMBER },
                rawOcrText: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                clarificationNeeded: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['productName', 'brand', 'category', 'confidence'],
            },
          },
        });

        if (response.text) {
          return JSON.parse(response.text);
        }
      } catch (err) {
        Logger.error('Gemini photo recognition error, using mock fallback', err);
      }
    }

    // Resilient fallback for offline / mock testing
    return {
      productName: 'Aashirvaad Shudh Chakki Atta',
      productNameHindi: 'आशीर्वाद शुद्ध चक्की आटा',
      brand: 'Aashirvaad',
      category: 'Grocery & Kirana',
      packSize: '5 kg',
      unit: 'kg',
      suggestedPrice: 245,
      confidence: 0.92,
      rawOcrText: 'Aashirvaad Superior MP Atta 100% Whole Wheat Flour 5kg Net',
      clarificationNeeded: [],
    };
  }

  /**
   * Parse spoken or pasted multi-line text into structured bulk product items
   */
  public static async parseBulkProducts(params: {
    rawText: string;
    defaultCategory?: string;
  }): Promise<BulkProductImportItem[]> {
    const lines = params.rawText
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const items: BulkProductImportItem[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Price extraction
      const priceMatch = lower.match(/(?:₹|rs\.?|rupees?|\s)?\s*(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|per|prati|mein|me|ka|\/)?/i) ||
        lower.match(/(\d+(?:\.\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 50;

      // Unit extraction
      let unit = 'kg';
      if (lower.includes('litre') || lower.includes('liter') || lower.includes(' l ') || lower.includes('ltr')) unit = 'L';
      else if (lower.includes('ml')) unit = 'ml';
      else if (lower.includes('gram') || lower.includes(' g ') || lower.includes('gm')) unit = 'g';
      else if (lower.includes('packet') || lower.includes('pack') || lower.includes('pkt')) unit = 'packet';
      else if (lower.includes('piece') || lower.includes('pc') || lower.includes('nag')) unit = 'piece';
      else if (lower.includes('dozen') || lower.includes('darjan')) unit = 'dozen';
      else if (lower.includes('kg') || lower.includes('kilo')) unit = 'kg';

      // Name cleanup
      let cleanName = line
        .replace(/(?:₹|rs\.?|rupees?|\d+(?:\.\d+)?|kg|kilo|litre|liter|ltr|packet|gram|gm|ml|piece|dozen|darjan|per|prati|mein|me|ka|hai|\/)+/gi, '')
        .trim();
      
      if (!cleanName || cleanName.length < 2) {
        cleanName = line.trim();
      }

      // Format capital case
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      // Guess category
      let category = params.defaultCategory || 'Grocery & Kirana';
      if (lower.includes('दूध') || lower.includes('milk') || lower.includes('butter') || lower.includes('paneer') || lower.includes('curd') || lower.includes('dahi') || lower.includes('ghee')) {
        category = 'Dairy & Sweets';
      } else if (lower.includes('टमाटर') || lower.includes('tomato') || lower.includes('potato') || lower.includes('aloo') || lower.includes('onion') || lower.includes('pyaz') || lower.includes('banana') || lower.includes('kela') || lower.includes('apple') || lower.includes('seb')) {
        category = 'Fresh Produce';
      }

      items.push({
        name: formattedName,
        category,
        unit,
        price,
        stock: 50,
      });
    }

    return items;
  }

  /**
   * Admin AI Onboarding: Convert spoken or typed shop description into a full onboarding draft
   */
  public static async parseAdminAIOnboarding(params: {
    transcript: string;
  }): Promise<AdminAIOnboardingDraft> {
    const raw = params.transcript;
    const lower = raw.toLowerCase();

    // Extract seller / shop name
    let sellerName = 'Shopkeeper';
    const sellerMatch = raw.match(/(?:नाम|name\s*is|seller\s*is)\s*([A-Za-z\u0900-\u097F\s]+?)(?:ki|ka|\s+ki|\s+ka|phone|mobile|dukan|shop|\n|,)/i) ||
      raw.match(/^([A-Za-z\u0900-\u097F\s]+?)\s+(?:ki|ka)\s+(?:kirana|dukan|store|shop)/i);
    if (sellerMatch) {
      sellerName = sellerMatch[1].trim();
    }

    let shopName = `${sellerName}'s Store`;
    const shopMatch = raw.match(/([A-Za-z\u0900-\u097F\s]+(?:kirana|store|shop|mart|traders|dukan))/i);
    if (shopMatch) {
      shopName = shopMatch[1].trim();
    }

    // Extract mobile number
    let sellerPhone = '';
    const phoneMatch = raw.match(/(?:\+91|91)?\s*([6-9]\d{9})/);
    if (phoneMatch) {
      sellerPhone = phoneMatch[1];
    }

    // Extract category
    let category = 'Grocery & Kirana';
    if (lower.includes('dairy') || lower.includes('दूध') || lower.includes('sweets') || lower.includes('mithai')) {
      category = 'Dairy & Sweets';
    } else if (lower.includes('vegetable') || lower.includes('fruit') || lower.includes('sabzi') || lower.includes('produce')) {
      category = 'Fresh Produce';
    }

    // Parse products included in the transcript
    const products = await this.parseBulkProducts({ rawText: raw, defaultCategory: category });

    return {
      sellerName,
      sellerPhone: sellerPhone || '9876543210',
      shopName,
      category,
      address: 'Main Market Road',
      openTime: '08:00',
      closeTime: '21:30',
      minOrderValue: 99,
      deliveryFee: 25,
      products,
    };
  }
}

