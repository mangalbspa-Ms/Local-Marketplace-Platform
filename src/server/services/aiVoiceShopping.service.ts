/**
 * AI Voice Shopping Parsing Service
 * 
 * Powered by Google Gemini 3.8 Flash with resilient fallback to Gemini 3.1 Flash Lite
 * and an exhaustive Indian Local Market Semantic Parser (Kirana / Food / Mandi / Stalls).
 * Semantic extraction for ANY market/food/kirana/street-food item without requiring
 * predefined catalog entries.
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../utils/logger.ts';
import {
  matchKiranaMasterProduct,
  MASTER_KIRANA_CATALOG,
} from '../../data/products/kiranaProductCatalog.ts';

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

export interface ParsedVoiceShoppingItem {
  id: string;
  rawItemName: string;
  productName?: string;
  cleanTitle: string;
  quantity: number;
  unit: string;
  unitDisplay: string;
  itemType: 'weight' | 'quantity' | 'money_amount' | 'general';
  moneyAmount?: number | null;
  priceVariant?: number | null;
  totalPrice?: number | null;
  unitPrice?: number | null;
  isCatalogMatch: boolean;
  matchedProductId?: string;
  matchedProductName?: string;
  requiresSellerConfirmation: boolean;
  originalUtterance: string;
  usedAi?: boolean;
}

export class AIVoiceShoppingService {
  /**
   * Parse customer voice utterance into structured shopping items using Gemini semantic understanding
   * with guaranteed fallback to the server local semantic parser on any 503/429/high-demand spike.
   */
  public static async parseUtterance(params: {
    text: string;
    language?: string;
    shopProducts?: Array<{
      id: string;
      name: string;
      nameHindi?: string;
      basePricePerUnit?: number;
      baseUnit?: string;
    }>;
  }): Promise<ParsedVoiceShoppingItem[]> {
    const { text, shopProducts = [] } = params;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return [];

    // Instantly reject standalone fragments, numbers alone, or filler words without network or AI delay
    if (this.isInvalidFragment(trimmed)) return [];

    // 1. Fast deterministic/local parsing FIRST for quantities, units, rupee amounts, and common Hindi/Hinglish patterns.
    // Avoids expensive AI network calls, latency, and hallucinated/guessed items.
    const localItems = this.localSemanticParse(trimmed, shopProducts);

    const logPipelineDebug = (items: ParsedVoiceShoppingItem[], source: string) => {
      console.log('🎙️ [Voice Parsing Pipeline Server Debug]', {
        rawFinalTranscript: trimmed,
        detectedItems: items.map((i) => ({
          productName: i.productName || i.rawItemName,
          quantity: i.quantity,
          unit: i.unitDisplay || i.unit,
          moneyAmount: i.moneyAmount || undefined,
          price: i.totalPrice ?? i.unitPrice,
        })),
        matchingStatus: items.map((i) => ({
          productName: i.productName || i.rawItemName,
          matchedCatalogProduct: i.matchedProductName || null,
          isCatalogMatch: Boolean(i.isCatalogMatch),
          status: i.usedAi ? 'AI' : 'Local Catalog',
        })),
        pipelineSource: source,
      });
    };

    // If local parser accurately extracted all distinct items with clear quantities/units, return immediately!
    const hasAmbiguous = localItems.length === 0 || localItems.some(i => i.itemType === 'general' && !i.isCatalogMatch);
    if (!hasAmbiguous && localItems.length > 0) {
      logPipelineDebug(localItems, 'Local Catalog');
      return localItems;
    }

    // 2. Only use AI/semantic item matching when the item name is genuinely ambiguous or 0 items were matched
    const ai = getGeminiClient();
    if (ai) {
      try {
        const geminiResult = await this.callGeminiWithFallback(ai, trimmed, shopProducts);
        if (geminiResult && geminiResult.length > 0) {
          logPipelineDebug(geminiResult, 'AI');
          return geminiResult;
        }
      } catch (err: any) {
        Logger.info('Gemini AI fallback to local semantic items:', {
          reason: err?.message ? String(err.message).slice(0, 150) : 'API unavailable',
          utterance: trimmed,
        });
      }
    }

    // Resilient local semantic parser fallback
    logPipelineDebug(localItems, 'Local Catalog (Fallback)');
    return localItems;
  }

  private static async callGeminiWithFallback(
    ai: GoogleGenAI,
    utterance: string,
    shopProducts: Array<any>
  ): Promise<ParsedVoiceShoppingItem[] | null> {
    const prompt = `You are the AI semantic parser for an Indian local market and food shopping platform (Local Mandi / Kirana / Food Stalls / Bakery / Dairy).
The customer has spoken a complete shopping request in Hindi, Hinglish, or English.
Analyze the COMPLETE customer sentence semantically and extract ALL actual requested products and quantities.

Customer utterance: "${utterance}"

CRITICAL RULES:
1. ONLY extract actual food items, grocery products, vegetables, fruits, street-food items, or household items.
   NEVER extract stray words, numbers alone, time words, or fragments (e.g., NEVER create items from "Hari", "25", "baje", "kripya", "chahiye", etc.).
2. If the customer sentence contains multiple products (e.g. "एक किलो आलू, एक किलो प्याज और एक दर्जन केला"), separate them cleanly into distinct items only after understanding the COMPLETE sentence:
   - "एक किलो आलू एक किलो प्याज एक दर्जन केला" -> exactly 3 items:
     * rawItemName: "आलू", quantity: 1, unit: "किलो", unitDisplay: "1 किलो", cleanTitle: "आलू — 1 किलो"
     * rawItemName: "प्याज", quantity: 1, unit: "किलो", unitDisplay: "1 किलो", cleanTitle: "प्याज — 1 किलो"
     * rawItemName: "केला", quantity: 1, unit: "दर्जन", unitDisplay: "1 दर्जन", cleanTitle: "केला — 1 दर्जन"
3. Preserve natural quantity units and portions exactly as spoken in Hindi or English:
   - "Santoor sabun 10 wala 10 packet" -> rawItemName: "Santoor Sabun", priceVariant: 10, quantity: 10, unit: "packet", unitDisplay: "10 packets", cleanTitle: "Santoor Sabun ₹10 — 10 packets"
   - "चाउमीन हाफ प्लेट चाहिए" -> rawItemName: "Chowmein", quantity: 1, unit: "plate", unitDisplay: "½ plate", cleanTitle: "Chowmein — ½ plate"
   - "दो हाफ प्लेट चाउमीन चाहिए" -> rawItemName: "Chowmein", quantity: 2, unit: "plate", unitDisplay: "½ plate × 2", cleanTitle: "Chowmein — ½ plate × 2"
   - "एक फुल प्लेट चाउमीन" -> rawItemName: "Chowmein", quantity: 1, unit: "plate", unitDisplay: "1 plate", cleanTitle: "Chowmein — 1 plate"
   - "दो प्लेट छोला" -> rawItemName: "छोला", quantity: 2, unit: "plate", unitDisplay: "2 प्लेट", cleanTitle: "छोला — 2 प्लेट"
   - "दस पीस मंचूरियन" -> rawItemName: "मंचूरियन", quantity: 10, unit: "पीस", unitDisplay: "10 पीस", cleanTitle: "मंचूरियन — 10 पीस"
   - "दो टिकिया चाहिए" / "दो टिकिया" -> rawItemName: "टिकिया", quantity: 2, unit: "पीस", unitDisplay: "2 पीस", cleanTitle: "टिकिया — 2 पीस"
   - "2 tikkiya manchurian" -> rawItemName: "Manchurian", quantity: 2, unit: "pieces", unitDisplay: "2 pieces", cleanTitle: "Manchurian — 2 pieces"
   - "एक दर्जन केला" -> rawItemName: "केला", quantity: 1, unit: "दर्जन", unitDisplay: "1 दर्जन", cleanTitle: "केला — 1 दर्जन"
   - "आधा दर्जन केला" -> rawItemName: "केला", quantity: 0.5, unit: "दर्जन", unitDisplay: "½ दर्जन", cleanTitle: "केला — ½ दर्जन"
   - "एक किलो आलू" -> rawItemName: "आलू", quantity: 1, unit: "किलो", unitDisplay: "1 किलो", cleanTitle: "आलू — 1 किलो"
   - "आधा किलो प्याज" -> rawItemName: "प्याज", quantity: 0.5, unit: "किलो", unitDisplay: "½ किलो", cleanTitle: "प्याज — ½ किलो"
   - "₹10 का हरा धनिया" / "दस रुपये का हरा धनिया" -> rawItemName: "हरा धनिया", quantity: 1, unit: "money", unitDisplay: "₹10", cleanTitle: "हरा धनिया — ₹10", moneyAmount: 10
4. CRITICAL PORTION RULE:
   Do NOT convert:
   - हाफ प्लेट → पीस
   - फुल प्लेट → पीस
   - दर्जन → पीस
   - किलो → पीस
   Preserve the actual unit spoken by the customer.
5. When spoken in Hindi (Devanagari script), preserve the product name and unit in Hindi.
6. If no real product or food item is requested, return an empty array [].

Return a JSON array of objects with schema:
[
  {
    "rawItemName": "Product Name",
    "quantity": number,
    "unit": "string",
    "unitDisplay": "string",
    "itemType": "weight" | "quantity" | "money_amount" | "general",
    "moneyAmount": number or null,
    "cleanTitle": "Product Name — unitDisplay"
  }
]`;

    let rawResponse: string | undefined;

    // Try primary model: gemini-3.8-flash
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawResponse = response.text;
    } catch (err: any) {
      const errStr = `${err?.status || ''} ${err?.message || ''} ${JSON.stringify(err || {})}`.toLowerCase();
      const isTemporary = errStr.includes('503') || errStr.includes('429') || errStr.includes('high demand') || errStr.includes('unavailable');

      if (isTemporary) {
        try {
          const fallbackResp = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          rawResponse = fallbackResp.text;
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    if (!rawResponse) return null;

    try {
      const parsedArray = JSON.parse(rawResponse);
      if (!Array.isArray(parsedArray)) return null;

      const results: ParsedVoiceShoppingItem[] = [];

      for (const raw of parsedArray) {
        const rawItemName = (raw.rawItemName || '').trim();
        if (!rawItemName) continue;

        // Filter stray word fragments
        if (this.isInvalidFragment(rawItemName)) continue;

        const quantity = typeof raw.quantity === 'number' && !isNaN(raw.quantity) ? raw.quantity : 1;
        const unit = raw.unit || 'piece';
        const unitDisplay = raw.unitDisplay || `${quantity} ${unit}`;
        const itemType = raw.itemType || (raw.moneyAmount ? 'money_amount' : 'quantity');
        const moneyAmount = typeof raw.moneyAmount === 'number' ? raw.moneyAmount : null;

        // Product catalog matching via Master Catalog (Single Source of Truth) and shop products
        const masterMatch = matchKiranaMasterProduct(rawItemName);
        const catalogMatch = AIVoiceShoppingService.matchProductInShop(rawItemName, shopProducts, raw.priceVariant);
        const isCatalogMatch = Boolean(masterMatch || catalogMatch.isCatalogMatch);
        const matchedProductId = masterMatch?.product.id || catalogMatch.matchedProductId;
        const matchedProductName = masterMatch?.product.canonicalNameHindi || masterMatch?.product.canonicalNameEnglish || catalogMatch.matchedProductName;
        const unitPrice = catalogMatch.unitPrice || raw.priceVariant || undefined;
        let totalPrice: number | null = moneyAmount;
        if (unitPrice && !totalPrice) {
          totalPrice = Math.round(unitPrice * quantity);
        }

        const finalProductName = isCatalogMatch && matchedProductName
          ? matchedProductName
          : rawItemName;
        const cleanTitle = moneyAmount != null
          ? `${finalProductName} — ₹${moneyAmount}`
          : `${finalProductName} — ${unitDisplay}`;

        results.push({
          id: `voice_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          rawItemName,
          productName: finalProductName,
          cleanTitle,
          quantity,
          unit,
          unitDisplay,
          itemType,
          priceVariant: raw.priceVariant || null,
          moneyAmount,
          totalPrice,
          unitPrice,
          isCatalogMatch,
          matchedProductId,
          matchedProductName,
          requiresSellerConfirmation: !isCatalogMatch,
          originalUtterance: utterance,
          usedAi: true,
        });
      }

      return results;
    } catch {
      return null;
    }
  }

  /**
   * Resilient local semantic parser understanding Indian local market items,
   * Hindi/Hinglish speech, and quantity/money expressions without requiring predefined lists.
   */
  public static localSemanticParse(
    utterance: string,
    shopProducts: Array<any> = []
  ): ParsedVoiceShoppingItem[] {
    const raw = utterance.trim();
    if (!raw) return [];

    // 1. Split compound utterances by conjunctions
    const clauses = raw
      .split(/(?:\s+(?:और|तथा|एवं|aur|and|tatha|also|bhi|va|evam|saath\s*me|saath\s*mein)\s+|[,\n\r\t;।]+|\s+भी\s+)/i)
      .map((c) => c.trim())
      .filter((c) => c.length >= 2);

    const targetClauses = clauses.length > 0 ? clauses : [raw];
    const finalSegments: string[] = [];

    // 2. Multi-product segmentation for sentences without explicit conjunctions
    // (e.g. "एक किलो आलू एक किलो प्याज एक दर्जन केला" or "1 kilo aloo 1 kilo pyaz ek darjan kela")
    // Note: Do not split single price-variant items like "Santoor sabun 10 wala 10 packet"
    const starterRegex = /(?:(?:\d+(?:\.\d+)?|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|सौ|ek|do|teen|char|chaar|paanch|panch|chhe|saat|aath|nau|das)\s*(?:किलो|kg|kilo|kgs|केजी|ग्राम|gram|gm|gms|दर्जन|darjan|dozen|हाफ\s*प्लेट|half\s*plate|फुल\s*प्लेट|full\s*plate|प्लेट|plates?|टिकिया|tikiya|पीस|pieces?|pcs?|नग|लीटर|litres?|liters?|ltr|पैकेट|packets?|पैक|बोतल|bottles?|डिब्बा|boxes?)|(?:\b(?:आधा|aadha|adha)\s*(?:दर्जन|darjan|dozen|किलो|kg|kilo|लीटर|litre|liter|प्लेट|plate))|(?:\b(?:पौना|pauna|paunaa)\s*(?:किलो|kg|kilo))|(?:\b(?:हाफ|फुल|half|full)\s*(?:प्लेट|plate))|(?:\b(?:डेढ़|ढाई|dedh|dhai)\s*(?:किलो|kg|kilo))|(?:\b(?:एक\s+)?(?:पाव|paav|pao)(?:\s*(?:kilo|kg|किलो))?)|(?:(?:₹|rs\.?|रुपये?|रु)\s*(?:\d+|दस|पांच|पाँच|बीस|पचास|सौ)|(?:\d+|दस|पांच|पाँच|बीस|पचास|सौ)\s*(?:रुपये?|rupaye?|rs|rupees?|रु|रुपए))\s*(?:ka|ki|ke|का|की|के)?)/gi;

    for (const clause of targetClauses) {
      // If clause is a single price-variant + quantity item, keep it intact
      if (
        /(?:वाला|वाली|वाले|wala|wali|wale)\s+(?:\d+|दस|पांच|पाँच|चार|तीन|दो|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पीस|piece)/i.test(clause) ||
        /(?:\d+|दस|पांच|पाँच|चार|तीन|दो|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक)\s+.*?(?:वाला|वाली|वाले|wala|wali|wale)/i.test(clause)
      ) {
        finalSegments.push(clause);
        continue;
      }

      const matches = [...clause.matchAll(starterRegex)];
      if (matches.length <= 1) {
        finalSegments.push(clause);
        continue;
      }

      let lastCut = 0;
      for (let i = 1; i < matches.length; i++) {
        const matchIdx = matches[i].index!;
        const prevSegment = clause.substring(lastCut, matchIdx).trim();
        const followingText = clause.substring(matchIdx).trim();

        // 1. If preceding segment ended in a price variant (₹5 वाला, 10 वाला) and following is a count (10 पैकेट), do not split!
        const prevHasPriceVariant = /(?:₹\s*\d+|\d+\s*(?:रुपये?|रु|rupaye?|rs)?|दस|पांच|पाँच|बीस|पचास|\d+)\s*(?:वाला|वाली|वाले|wala|wali|wale)$/i.test(prevSegment);
        const followingIsCountOnly = /^(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|pcs)\b/i.test(followingText);
        if (prevHasPriceVariant && followingIsCountOnly) {
          continue;
        }

        // 2. Following text MUST have more than just a bare unit or quantity to be an independent item
        const followingRemainder = followingText
          .replace(/^(?:\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|das|एक|दो|तीन|चार|पांच|पाँच|दस)\s*(?:kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|darjan|dozen|दर्जन|plate|plates|प्लेट|packet|packets|पैकेट|पैक|piece|pieces|pcs|पीस|नग|litre|liter|ltr|लीटर|bottle|bottles|बोतल|box|boxes|डिब्बा)/i, '')
          .replace(/(?:का|की|के|wala|wali|वाले|वाला|चाहिए|दे दो)/gi, '')
          .trim();
        if (followingRemainder.length < 2) {
          continue;
        }

        if (prevSegment.length >= 3) {
          finalSegments.push(prevSegment);
          lastCut = matchIdx;
        }
      }
      const tail = clause.substring(lastCut).trim();
      if (tail) finalSegments.push(tail);
    }

    const results: ParsedVoiceShoppingItem[] = [];

    for (const seg of finalSegments) {
      const parsed = this.parseSingleClause(seg, shopProducts, raw);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  private static parseSingleClause(
    clause: string,
    shopProducts: Array<any>,
    originalUtterance: string
  ): ParsedVoiceShoppingItem | null {
    let text = clause
      .replace(/^(?:bhaiya|bhai|bhai sahab|भाई|भैया|uncle|aunty|dost|ji|please|kripya)\s+/i, '')
      .replace(/\s+(?:chahiye|dedo|de\s*do|dena|dena\s*ji|kardo|kar\s*do|bhejo|likh\s*lo|add\s*karo|दे\s*दो|चाहिए|ला\s*दो)$/i, '')
      .trim();

    if (!text || text.length < 2) return null;

    const isHindiScript = /[\u0900-\u097F]/.test(text);

    let rawItemName = '';
    let quantity = 1;
    let unit = isHindiScript ? 'पीस' : 'piece';
    let unitDisplay = isHindiScript ? '1 पीस' : '1 piece';
    let itemType: 'weight' | 'quantity' | 'money_amount' | 'general' = 'quantity';
    let moneyAmount: number | null = null;
    let priceVariant: number | null = null;

    // 0. Detect Price Variant + Packet/Piece Count (e.g. "Santoor sabun 10 wala 10 packet", "Santoor sabun 10 वाला 10 पैकेट", "10 packet Santoor sabun 10 wala")
    const priceVariantWalaRegex = /(?:(?:₹|rs\.?|रुपये?|रु|रुपइया)\s*(\d+|दस|पांच|पाँच|बीस|पचास)\s*(?:वाला|वाली|वाले|wala|wali|wale)|(\d+|दस|पांच|पाँच|बीस|पचास)\s*(?:रुपये?|rupaye?|rs|रु|रुपइया)\s*(?:वाला|वाली|वाले|wala|wali|wale)|(\d+|दस|पांच|पाँच|बीस|पचास)\s*(?:वाला|वाली|वाले|wala|wali|wale))/i;
    const priceVariantMatch = text.match(priceVariantWalaRegex);

    if (priceVariantMatch) {
      const pVal = priceVariantMatch[1] || priceVariantMatch[2] || priceVariantMatch[3];
      priceVariant = this.parseHindiNumber(pVal);
      
      const packetCountMatch =
        text.match(/(\d+)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/i) ||
        (text.match(/(?:दस|10)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '10'] : null) ||
        (text.match(/(?:पांच|पाँच|5)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '5'] : null) ||
        (text.match(/(?:चार|4)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '4'] : null) ||
        (text.match(/(?:तीन|3)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '3'] : null) ||
        (text.match(/(?:दो|2)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '2'] : null) ||
        (text.match(/(?:एक|1)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/i) ? [null, '1'] : null);

      quantity = packetCountMatch && packetCountMatch[1] ? parseInt(packetCountMatch[1], 10) : 1;
      unit = isHindiScript ? 'पैकेट' : 'packet';
      unitDisplay = isHindiScript ? `${quantity} पैकेट` : `${quantity} ${quantity > 1 ? 'packets' : 'packet'}`;
      itemType = 'quantity';

      const cleanedFood = text
        .replace(priceVariantWalaRegex, '')
        .replace(/(\d+)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/gi, '')
        .replace(/(?:दस|पांच|पाँच|चार|तीन|दो|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक)/gi, '')
        .trim();
      rawItemName = this.cleanItemName(cleanedFood);
    }

    // 1. Money Amount Expression (e.g. "₹10 ka Hari Patti Dhaniya", "दस रुपये का हरा धनिया", "10 रुपये का हरा धनिया")
    if (!rawItemName) {
      const NUM_RE = '(?:\\d+(?:\\.\\d+)?|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|सौ|ek|do|teen|char|paanch|panch|das|bees|pachaas|sau)';
      const moneyPrefixRegex = new RegExp(
        `^(?:(?:₹|rs\\.?|रुपये?|रु)\\s*(${NUM_RE})\\s*(?:ka|ki|ke|का|की|के|wala|wali|wale|वाला|वाली|वाले)?|(${NUM_RE})\\s*(?:रुपये?|rupaye?|rs|रुपए|rupees?|रु)\\s*(?:ka|ki|ke|का|की|के|wala|wali|wale|वाला|वाली|वाले)?)\\s*(.+)$`,
        'i'
      );
      const moneySuffixRegex = new RegExp(
        `^(.+?)\\s+(?:(?:₹|rs\\.?|रुपये?|रु)\\s*(${NUM_RE})|(${NUM_RE})\\s*(?:रुपये?|rupaye?|rs|रुपए|rupees?|रु))\\s*(?:ka|ki|ke|का|की|के)?$`,
        'i'
      );

      const moneyPrefixMatch = text.match(moneyPrefixRegex);
      const moneySuffixMatch = text.match(moneySuffixRegex);

      if (moneyPrefixMatch) {
        const amtVal = moneyPrefixMatch[1] || moneyPrefixMatch[2];
        const amt = this.parseHindiNumber(amtVal);
        const remainder = this.cleanItemName(moneyPrefixMatch[3] || '');
        if (!isNaN(amt) && amt > 0 && remainder && !this.isInvalidFragment(remainder)) {
          moneyAmount = amt;
          rawItemName = remainder;
          quantity = 1;
          unit = 'money';
          unitDisplay = `₹${moneyAmount}`;
          itemType = 'money_amount';
        }
      } else if (moneySuffixMatch) {
        const amtVal = moneySuffixMatch[2] || moneySuffixMatch[3];
        const amt = this.parseHindiNumber(amtVal);
        const remainder = this.cleanItemName(moneySuffixMatch[1] || '');
        if (!isNaN(amt) && amt > 0 && remainder && !this.isInvalidFragment(remainder)) {
          moneyAmount = amt;
          rawItemName = remainder;
          quantity = 1;
          unit = 'money';
          unitDisplay = `₹${moneyAmount}`;
          itemType = 'money_amount';
        }
      }
    }

    // 2. Portion Plate: "चाउमीन हाफ प्लेट चाहिए", "दो हाफ प्लेट चाउमीन", "एक फुल प्लेट चाउमीन", "दो प्लेट छोला"
    if (!rawItemName) {
      // 2A. Spoken count + half/full plate + food item: e.g. "दो हाफ प्लेट चाउमीन", "एक फुल प्लेट चाउमीन", "2 half plate chowmein"
      const numPortionMatch = text.match(
        /^(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|teen)\s*(half|haaf|हाफ|फुल|full)\s*(?:plate|plates|प्लेट)\s+(.+)$/i
      );
      // 2B. Half/full plate + food item: e.g. "हाफ प्लेट चाउमीन", "फुल प्लेट चाउमीन", "half plate chowmein"
      const portionPrefixMatch = text.match(
        /^(?:half|haaf|हाफ|फुल|full)\s*(?:plate|plates|प्लेट)\s+(.+)$/i
      );
      // 2C. Food item + half/full plate: e.g. "चाउमीन हाफ प्लेट", "चाउमीन फुल प्लेट"
      const portionSuffixMatch = text.match(
        /^(.+?)\s+(half|haaf|हाफ|फुल|full)\s*(?:plate|plates|प्लेट)$/i
      );
      // 2D. Standard plate count without half/full: e.g. "दो प्लेट छोला", "2 plate chhola"
      const numPlateMatch = text.match(
        /^(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|teen)\s*(?:plate|plates|प्लेट)\s+(.+)$/i
      );
      // 2E. Food item + half/full plate count: e.g. "चाउमीन दो हाफ प्लेट", "chowmein 2 half plate"
      const itemNumPortionMatch = text.match(
        /^(.+?)\s+(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|teen)\s*(half|haaf|हाफ|फुल|full)\s*(?:plate|plates|प्लेट)$/i
      );
      // 2F. Food item + plate count: e.g. "छोला दो प्लेट"
      const itemNumPlateMatch = text.match(
        /^(.+?)\s+(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|teen)\s*(?:plate|plates|प्लेट)$/i
      );

      if (numPortionMatch) {
        quantity = this.parseHindiNumber(numPortionMatch[1]);
        const isHalf = /half|haaf|हाफ/i.test(numPortionMatch[2]);
        rawItemName = this.cleanItemName(numPortionMatch[3]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHalf 
          ? (isHindiScript ? `${quantity} × ½ प्लेट` : `${quantity} × ½ plate`)
          : (isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`);
        itemType = 'quantity';
      } else if (itemNumPortionMatch) {
        quantity = this.parseHindiNumber(itemNumPortionMatch[2]);
        const isHalf = /half|haaf|हाफ/i.test(itemNumPortionMatch[3]);
        rawItemName = this.cleanItemName(itemNumPortionMatch[1]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHalf 
          ? (isHindiScript ? `${quantity} × ½ प्लेट` : `${quantity} × ½ plate`)
          : (isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`);
        itemType = 'quantity';
      } else if (portionPrefixMatch) {
        quantity = 1;
        const isHalf = /half|haaf|हाफ/i.test(portionPrefixMatch[0]);
        rawItemName = this.cleanItemName(portionPrefixMatch[1]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHalf ? (isHindiScript ? '½ प्लेट' : '½ plate') : (isHindiScript ? '1 प्लेट' : '1 plate');
        itemType = 'quantity';
      } else if (portionSuffixMatch) {
        quantity = 1;
        const isHalf = /half|haaf|हाफ/i.test(portionSuffixMatch[2]);
        rawItemName = this.cleanItemName(portionSuffixMatch[1]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHalf ? (isHindiScript ? '½ प्लेट' : '½ plate') : (isHindiScript ? '1 प्लेट' : '1 plate');
        itemType = 'quantity';
      } else if (numPlateMatch) {
        quantity = this.parseHindiNumber(numPlateMatch[1]);
        rawItemName = this.cleanItemName(numPlateMatch[2]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`;
        itemType = 'quantity';
      } else if (itemNumPlateMatch) {
        quantity = this.parseHindiNumber(itemNumPlateMatch[2]);
        rawItemName = this.cleanItemName(itemNumPlateMatch[1]);
        unit = isHindiScript ? 'प्लेट' : 'plate';
        unitDisplay = isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`;
        itemType = 'quantity';
      }
    }

    // 3. Dozen (darjan / दर्जन): ek darjan, do darjan, aadha darjan / एक दर्जन, आधा दर्जन
    if (!rawItemName) {
      if (/^(?:aadha|adha|आधा|half)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:aadha|adha|आधा|half)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.5;
        unit = isHindiScript ? 'दर्जन' : 'dozen';
        unitDisplay = isHindiScript ? '½ दर्जन' : '½ dozen';
        itemType = 'quantity';
      } else if (/^(.+?)\s+(?:aadha|adha|आधा|half)\s*(?:darjan|dozen|दर्जन)$/i.test(text)) {
        const m = text.match(/^(.+?)\s+(?:aadha|adha|आधा|half)\s*(?:darjan|dozen|दर्जन)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.5;
        unit = isHindiScript ? 'दर्जन' : 'dozen';
        unitDisplay = isHindiScript ? '½ दर्जन' : '½ dozen';
        itemType = 'quantity';
      } else if (/^(?:ek|1|एक)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:ek|1|एक)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 1;
        unit = isHindiScript ? 'दर्जन' : 'dozen';
        unitDisplay = isHindiScript ? '1 दर्जन' : '1 dozen';
        itemType = 'quantity';
      } else if (/^(\d+(?:\.\d+)?|दो|तीन|चार|पांच|पाँच|दस)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(\d+(?:\.\d+)?|दो|तीन|चार|पांच|पाँच|दस)\s*(?:darjan|dozen|दर्जन)\s+(.+)$/i);
        quantity = this.parseHindiNumber(m![1]);
        rawItemName = this.cleanItemName(m![2]);
        unit = isHindiScript ? 'दर्जन' : 'dozen';
        unitDisplay = isHindiScript ? `${quantity} दर्जन` : `${quantity} dozen`;
        itemType = 'quantity';
      } else if (/^(.+?)\s+(\d+(?:\.\d+)?|एक|दो|तीन|चार|पांच|पाँच|दस)\s*(?:darjan|dozen|दर्जन)$/i.test(text)) {
        const m = text.match(/^(.+?)\s+(\d+(?:\.\d+)?|एक|दो|तीन|चार|पांच|पाँच|दस)\s*(?:darjan|dozen|दर्जन)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = this.parseHindiNumber(m![2]);
        unit = isHindiScript ? 'दर्जन' : 'dozen';
        unitDisplay = isHindiScript ? `${quantity} दर्जन` : `${quantity} dozen`;
        itemType = 'quantity';
      }
    }

    // 4. Tikiya (टिकिया) & Manchurian items:
    // e.g. "2 tikkiya manchurian", "दो टिकिया मंचूरियन", "दो टिकिया चाहिए", "2 tikiya"
    if (!rawItemName) {
      const tikiyaFoodMatch = text.match(
        /^(\d+|एक|दो|तीन|चार|पांच|पाँच|दस|ek|do|teen)\s*(?:tikiya|tikia|tikki|टिकिया|टिक्की)\s+(.+)$/i
      );
      if (tikiyaFoodMatch) {
        quantity = this.parseHindiNumber(tikiyaFoodMatch[1]);
        rawItemName = this.cleanItemName(tikiyaFoodMatch[2]);
        unit = isHindiScript ? 'पीस' : 'pieces';
        unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} pieces`;
        itemType = 'quantity';
      } else if (/^(?:ek|1|एक)\s*(?:tikiya|tikia|tikki|टिकिया|टिक्की)$/i.test(text)) {
        rawItemName = isHindiScript ? 'टिकिया' : 'Tikiya';
        quantity = 1;
        unit = isHindiScript ? 'पीस' : 'piece';
        unitDisplay = isHindiScript ? '1 पीस' : '1 piece';
        itemType = 'quantity';
      } else if (/^(\d+|दो|तीन|चार|पांच|पाँच|दस)\s*(?:tikiya|tikia|tikki|टिकिया|टिक्की)$/i.test(text)) {
        const m = text.match(/^(\d+|दो|तीन|चार|पांच|पाँच|दस)\s*(?:tikiya|tikia|tikki|टिकिया|टिक्की)$/i);
        quantity = this.parseHindiNumber(m![1]);
        rawItemName = isHindiScript ? 'टिकिया' : 'Tikiya';
        unit = isHindiScript ? 'पीस' : 'pieces';
        unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} pieces`;
        itemType = 'quantity';
      }
    }

    // 5. Piece / Pieces (पीस): e.g. "दस पीस मंचूरियन", "10 piece manchurian", "4 piece samosa"
    if (!rawItemName) {
      if (/^(\d+|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस)\s*(?:piece|pieces|pcs|pc|पीस|नग)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(\d+|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस)\s*(?:piece|pieces|pcs|pc|पीस|नग)\s+(.+)$/i);
        const qVal = this.parseHindiNumber(m![1]);
        rawItemName = this.cleanItemName(m![2]);
        quantity = qVal;
        unit = isHindiScript ? 'पीस' : 'pieces';
        unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} pieces`;
        itemType = 'quantity';
      }
    }

    // 6. Weight: Hindi fractions / weights (aadha kilo, pauna kilo, dedh kilo, dhai kilo, paav / 250g)
    if (!rawItemName) {
      if (/^(?:pauna|paunaa|पौना)\s*(?:kilo|kg|किलो)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:pauna|paunaa|पौना)\s*(?:kilo|kg|किलो)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.75;
        unit = isHindiScript ? 'ग्राम' : 'kg';
        unitDisplay = isHindiScript ? '750 ग्राम' : '750 gram';
        itemType = 'weight';
      } else if (/^(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.5;
        unit = isHindiScript ? 'किलो' : 'kg';
        unitDisplay = isHindiScript ? '½ किलो' : '½ kg';
        itemType = 'weight';
      } else if (/^(.+?)\s+(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो)$/i.test(text)) {
        const m = text.match(/^(.+?)\s+(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.5;
        unit = isHindiScript ? 'किलो' : 'kg';
        unitDisplay = isHindiScript ? '½ किलो' : '½ kg';
        itemType = 'weight';
      } else if (/^(?:dedh|dhedh|डेढ़)\s*(?:kilo|kg|किलो)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:dedh|dhedh|डेढ़)\s*(?:kilo|kg|किलो)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 1.5;
        unit = isHindiScript ? 'किलो' : 'kg';
        unitDisplay = isHindiScript ? '1.5 किलो' : '1.5 kg';
        itemType = 'weight';
      } else if (/^(?:dhai|ढाई)\s*(?:kilo|kg|किलो)\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:dhai|ढाई)\s*(?:kilo|kg|किलो)\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 2.5;
        unit = isHindiScript ? 'किलो' : 'kg';
        unitDisplay = isHindiScript ? '2.5 किलो' : '2.5 kg';
        itemType = 'weight';
      } else if (/^(?:(?:ek\s+)?(?:paav|pao|पाव)\s*(?:kilo|kg|किलो)?|250\s*(?:gram|gm|gms|ग्राम))\s+(.+)$/i.test(text)) {
        const m = text.match(/^(?:(?:ek\s+)?(?:paav|pao|पाव)\s*(?:kilo|kg|किलो)?|250\s*(?:gram|gm|gms|ग्राम))\s+(.+)$/i);
        rawItemName = this.cleanItemName(m![1]);
        quantity = 0.25;
        unit = isHindiScript ? 'ग्राम' : 'kg';
        unitDisplay = isHindiScript ? '250 ग्राम' : '250 gram';
        itemType = 'weight';
      }
    }

    // 7. General Units (prefix): e.g. "एक किलो आलू", "1 kilo aloo", "1 plate chowmein", "2 packet doodh"
    if (!rawItemName) {
      const unitMatch = text.match(
        /^(\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस)\s*(kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|\bg\b|plate|plates|प्लेट|packet|packets|pack|packs|पैकेट|पैक|piece|pieces|pcs|pc|पीस|नग|litre|liter|ltr|लीटर|\bl\b|ml|मिली|darjan|dozen|दर्जन|bottle|bottles|बोतल|box|boxes|डिब्बा|डिब्बे|pair|pairs|जोड़ी|bundle|bundles|गड्डी)\s+(.+)$/i
      );

      if (unitMatch) {
        quantity = this.parseHindiNumber(unitMatch[1]);
        const matchedUnit = unitMatch[2].toLowerCase();
        rawItemName = this.cleanItemName(unitMatch[3]);

        if (/kilo|kg|kgs|किलो|केजी/.test(matchedUnit)) {
          unit = isHindiScript ? 'किलो' : 'kg';
          unitDisplay = isHindiScript ? `${quantity} किलो` : `${quantity} kg`;
          itemType = 'weight';
        } else if (/gram|gm|gms|ग्राम|\bg\b/.test(matchedUnit)) {
          unit = isHindiScript ? 'ग्राम' : 'gram';
          unitDisplay = isHindiScript ? `${quantity} ग्राम` : `${quantity} gram`;
          itemType = 'weight';
        } else if (/plate|plates|प्लेट/.test(matchedUnit)) {
          unit = isHindiScript ? 'प्लेट' : 'plate';
          unitDisplay = isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`;
          itemType = 'quantity';
        } else if (/packet|packets|pack|packs|पैकेट|पैक/.test(matchedUnit)) {
          unit = isHindiScript ? 'पैकेट' : 'packet';
          unitDisplay = isHindiScript ? `${quantity} पैकेट` : `${quantity} ${quantity > 1 ? 'packets' : 'packet'}`;
          itemType = 'quantity';
        } else if (/piece|pieces|pcs|pc|पीस|नग/.test(matchedUnit)) {
          unit = isHindiScript ? 'पीस' : 'piece';
          unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} ${quantity > 1 ? 'pieces' : 'piece'}`;
          itemType = 'quantity';
        } else if (/litre|liter|ltr|लीटर|\bl\b/.test(matchedUnit)) {
          unit = isHindiScript ? 'लीटर' : 'litre';
          unitDisplay = isHindiScript ? `${quantity} लीटर` : `${quantity} litre`;
          itemType = 'quantity';
        } else if (/ml|मिली/.test(matchedUnit)) {
          unit = isHindiScript ? 'मिली' : 'ml';
          unitDisplay = isHindiScript ? `${quantity} मिली` : `${quantity} ml`;
          itemType = 'quantity';
        } else if (/darjan|dozen|दर्जन/.test(matchedUnit)) {
          unit = isHindiScript ? 'दर्जन' : 'dozen';
          unitDisplay = isHindiScript ? `${quantity} दर्जन` : `${quantity} dozen`;
          itemType = 'quantity';
        } else if (/bottle|bottles|बोतल/.test(matchedUnit)) {
          unit = isHindiScript ? 'बोतल' : 'bottle';
          unitDisplay = isHindiScript ? `${quantity} बोतल` : `${quantity} ${quantity > 1 ? 'bottles' : 'bottle'}`;
          itemType = 'quantity';
        } else if (/box|boxes|डिब्बा|डिब्बे/.test(matchedUnit)) {
          unit = isHindiScript ? 'डिब्बा' : 'box';
          unitDisplay = isHindiScript ? `${quantity} डिब्बा` : `${quantity} ${quantity > 1 ? 'boxes' : 'box'}`;
          itemType = 'quantity';
        } else {
          unit = isHindiScript ? 'पीस' : 'piece';
          unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} ${quantity > 1 ? 'pieces' : 'piece'}`;
          itemType = 'quantity';
        }
      }
    }

    // 8. General Units (postfix): e.g. "aloo 1 kilo", "आलू एक किलो"
    if (!rawItemName) {
      const postfixUnitMatch = text.match(
        /^(.+?)\s+(\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|das|एक|दो|तीन|चार|पांच|पाँच|दस)\s*(kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|\bg\b|plate|plates|प्लेट|packet|packets|pack|packs|पैकेट|पैक|piece|pieces|pcs|pc|पीस|नग|litre|liter|ltr|लीटर|\bl\b|ml|मिली|darjan|dozen|दर्जन|bottle|bottles|बोतल|box|boxes|डिब्बा|डिब्बे)$/i
      );

      if (postfixUnitMatch) {
        rawItemName = this.cleanItemName(postfixUnitMatch[1]);
        quantity = this.parseHindiNumber(postfixUnitMatch[2]);
        const matchedUnit = postfixUnitMatch[3].toLowerCase();

        if (/kilo|kg|kgs|किलो|केजी/.test(matchedUnit)) {
          unit = isHindiScript ? 'किलो' : 'kg';
          unitDisplay = isHindiScript ? `${quantity} किलो` : `${quantity} kg`;
          itemType = 'weight';
        } else if (/gram|gm|gms|ग्राम|\bg\b/.test(matchedUnit)) {
          unit = isHindiScript ? 'ग्राम' : 'gram';
          unitDisplay = isHindiScript ? `${quantity} ग्राम` : `${quantity} gram`;
          itemType = 'weight';
        } else if (/plate|plates|प्लेट/.test(matchedUnit)) {
          unit = isHindiScript ? 'प्लेट' : 'plate';
          unitDisplay = isHindiScript ? `${quantity} प्लेट` : `${quantity} ${quantity > 1 ? 'plates' : 'plate'}`;
          itemType = 'quantity';
        } else if (/packet|packets|pack|packs|पैकेट|पैक/.test(matchedUnit)) {
          unit = isHindiScript ? 'पैकेट' : 'packet';
          unitDisplay = isHindiScript ? `${quantity} पैकेट` : `${quantity} ${quantity > 1 ? 'packets' : 'packet'}`;
          itemType = 'quantity';
        } else if (/piece|pieces|pcs|pc|पीस|नग/.test(matchedUnit)) {
          unit = isHindiScript ? 'पीस' : 'piece';
          unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} ${quantity > 1 ? 'pieces' : 'piece'}`;
          itemType = 'quantity';
        } else if (/litre|liter|ltr|लीटर|\bl\b/.test(matchedUnit)) {
          unit = isHindiScript ? 'लीटर' : 'litre';
          unitDisplay = isHindiScript ? `${quantity} लीटर` : `${quantity} litre`;
          itemType = 'quantity';
        } else if (/darjan|dozen|दर्जन/.test(matchedUnit)) {
          unit = isHindiScript ? 'दर्जन' : 'dozen';
          unitDisplay = isHindiScript ? `${quantity} दर्जन` : `${quantity} dozen`;
          itemType = 'quantity';
        } else {
          unit = isHindiScript ? 'पीस' : 'piece';
          unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} ${quantity > 1 ? 'pieces' : 'piece'}`;
          itemType = 'quantity';
        }
      }
    }

    // 9. Bare number with product: "4 samosa", "2 kachori"
    if (!rawItemName) {
      const bareNumMatch = text.match(/^(\d+|ek|do|teen|char|chaar|paanch|panch|das|एक|दो|तीन|चार|पांच|पाँच|दस)\s+([a-zA-Z\u0900-\u097F\s]+)$/i);
      if (bareNumMatch) {
        quantity = this.parseHindiNumber(bareNumMatch[1]);
        rawItemName = this.cleanItemName(bareNumMatch[2]);
        unit = isHindiScript ? 'पीस' : 'piece';
        unitDisplay = isHindiScript ? `${quantity} पीस` : `${quantity} ${quantity > 1 ? 'pieces' : 'piece'}`;
        itemType = 'quantity';
      }
    }

    // 10. Plain product fallback
    if (!rawItemName) {
      rawItemName = this.cleanItemName(text);
      quantity = 1;
      unit = isHindiScript ? 'पीस' : 'piece';
      unitDisplay = isHindiScript ? '1 पीस' : '1 piece';
      itemType = 'general';
    }

    if (!rawItemName || rawItemName.length < 2) return null;

    // Reject stray fragments, numbers alone, or filler words
    if (this.isInvalidFragment(rawItemName)) return null;

    // Product catalog matching via Master Catalog (Single Source of Truth) and shop products
    const masterMatch = matchKiranaMasterProduct(rawItemName);
    const catalogMatch = AIVoiceShoppingService.matchProductInShop(rawItemName, shopProducts, priceVariant);
    const isCatalogMatch = Boolean(masterMatch || catalogMatch.isCatalogMatch);
    const matchedProductId = masterMatch?.product.id || catalogMatch.matchedProductId;
    const matchedProductName = masterMatch?.product.canonicalNameHindi || masterMatch?.product.canonicalNameEnglish || catalogMatch.matchedProductName;
    const unitPrice = catalogMatch.unitPrice || (priceVariant ? priceVariant : undefined);
    let totalPrice: number | null = moneyAmount;
    if (unitPrice && !totalPrice) {
      totalPrice = Math.round(unitPrice * quantity);
    }

    // Exact catalog product name if matched!
    // UNKNOWN PRODUCT RULE:
    // If no reliable catalog match exists, DO NOT guess another product.
    // Create one temporary item: "Customer requested: <recognized product name>" with "Seller confirmation required".
    const finalProductName = isCatalogMatch && matchedProductName
      ? matchedProductName
      : rawItemName;
    const cleanTitle = moneyAmount != null
      ? `${finalProductName} — ₹${moneyAmount}`
      : `${finalProductName} — ${unitDisplay}`;

    return {
      id: `voice_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rawItemName,
      productName: finalProductName,
      cleanTitle,
      quantity,
      unit,
      unitDisplay,
      itemType,
      priceVariant,
      moneyAmount,
      totalPrice,
      unitPrice,
      isCatalogMatch,
      matchedProductId,
      matchedProductName,
      requiresSellerConfirmation: !isCatalogMatch,
      originalUtterance,
      usedAi: false,
    };
  }

  public static readonly COMMODITY_ALIASES: Record<string, string[]> = {
    potato: ['आलू', 'आलु', 'aloo', 'alu', 'potato', 'potatoes', 'बटाटा'],
    onion: ['प्याज', 'प्यास', 'कांदा', 'onion', 'onions', 'pyaz', 'pyaaz', 'kanda'],
    banana: ['केला', 'केले', 'kela', 'banana', 'bananas'],
    tomato: ['टमाटर', 'tamatar', 'tomato', 'tomatoes'],
    coriander: ['धनिया', 'हरा धनिया', 'हरी धनिया', 'धनिया पत्ती', 'धनिया पत्ता', 'coriander', 'dhaniya', 'kothmir', 'fresh coriander'],
    chowmein: ['चाउमीन', 'चाउमिन', 'चाऊमीन', 'चौमीन', 'chowmein', 'chaumin', 'noodles', 'hakka noodles'],
    chhola: ['छोला', 'छोले', 'chhola', 'chola', 'chole'],
    manchurian: ['मंचूरियन', 'manchurian', 'veg manchurian', 'वेज मंचूरियन'],
    tikiya: ['टिकिया', 'टिक्की', 'आलू टिकिया', 'tikiya', 'tikki', 'aloo tikki', 'aloo tikiya'],
    dahi: ['दही', 'dahi', 'curd', 'yogurt'],
    milk: ['दूध', 'दूध', 'doodh', 'milk'],
    bread: ['ब्रेड', 'bread', 'pav', 'पाव'],
    atta: ['आटा', 'atta', 'flour', 'gehun'],
    rice: ['चावल', 'chawal', 'rice'],
    sugar: ['चीनी', 'शक्कर', 'sugar', 'chini', 'shakkar'],
    salt: ['नमक', 'salt', 'namak', 'tata salt'],
    oil: ['तेल', 'oil', 'mustard oil', 'refined oil', 'tel'],
    ghee: ['घी', 'ghee'],
    tea: ['चाय', 'चायपत्ती', 'chai', 'tea'],
    paneer: ['पनीर', 'paneer', 'cottage cheese'],
    soap: ['साबुन', 'sabun', 'soap'],
    shampoo: ['शैंपू', 'shampoo'],
    biscuit: ['बिस्कुट', 'biscuit', 'biscuits', 'parle-g', 'marie'],
    khada_masala: ['खड़ा मसाला', 'खड़ा', 'khada masala', 'khada', 'sabut masala', 'साबुत मसाला', 'whole spices'],
  };

  public static matchProductInShop(
    rawItemName: string,
    shopProducts: Array<any>,
    priceVariant?: number | null
  ): {
    isCatalogMatch: boolean;
    matchedProductId?: string;
    matchedProductName?: string;
    unitPrice?: number;
  } {
    if (!rawItemName || !Array.isArray(shopProducts) || shopProducts.length === 0) {
      return { isCatalogMatch: false };
    }

    const normSpoken = rawItemName.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ').replace(/\s+/g, ' ').trim();
    const baseNameSpoken = normSpoken
      .replace(/^(?:½\s*प्लेट|हाफ\s*प्लेट|फुल\s*प्लेट|half\s*plate|full\s*plate)\s*/i, '')
      .replace(/(?:₹?\s*\d+\s*(?:वाला|वाली|वाले|wala|wali|wale))/i, '')
      .trim();

    const isHariDhaniya =
      normSpoken.includes('hari dhaniya') ||
      normSpoken.includes('hara dhaniya') ||
      normSpoken.includes('hari patti') ||
      normSpoken.includes('धनिया पत्ती') ||
      normSpoken.includes('हरी धनिया') ||
      normSpoken.includes('हरा धनिया') ||
      normSpoken.includes('coriander');

    // 1. Price-variant specific matching (e.g. "Santoor sabun 10 wala" -> matches "Santoor Sabun ₹10")
    if (priceVariant != null) {
      const variantMatch = shopProducts.find((p) => {
        const pName = (p.name || '').toLowerCase();
        const pHindi = (p.nameHindi || '').toLowerCase();
        const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
        const basePrice = p.fractionalConfig?.basePrice ?? p.basePricePerUnit ?? p.basePrice;

        const hasBrandNoun =
          pName.includes(baseNameSpoken) ||
          pHindi.includes(baseNameSpoken) ||
          (baseNameSpoken.includes('santoor') && (pName.includes('santoor') || pHindi.includes('संतूर'))) ||
          (baseNameSpoken.includes('संतूर') && (pName.includes('santoor') || pHindi.includes('संतूर')));

        if (!hasBrandNoun) return false;

        const hasVariantInName =
          pName.includes(`${priceVariant}`) ||
          pName.includes(`₹${priceVariant}`) ||
          pHindi.includes(`${priceVariant}`) ||
          pHindi.includes(`₹${priceVariant}`) ||
          pTags.some((t: string) => t.includes(`${priceVariant}`) || t.includes(`₹${priceVariant}`)) ||
          basePrice === priceVariant;

        return hasVariantInName;
      });

      if (variantMatch) {
        const unitPrice = variantMatch.fractionalConfig?.basePrice ?? variantMatch.basePricePerUnit ?? variantMatch.basePrice ?? priceVariant;
        return {
          isCatalogMatch: true,
          matchedProductId: variantMatch.id,
          matchedProductName: variantMatch.name,
          unitPrice: typeof unitPrice === 'number' ? unitPrice : priceVariant,
        };
      }
    }

    // 2. Direct exact equality match (English, Hindi, with/without punctuation)
    const exactMatch = shopProducts.find((p) => {
      const pName = (p.name || '').toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ').replace(/\s+/g, ' ').trim();
      const pHindi = (p.nameHindi || '').toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ').replace(/\s+/g, ' ').trim();

      if (isHariDhaniya && (pName.includes('powder') || pHindi.includes('पाउडर'))) {
        return false;
      }
      return (
        pName === normSpoken ||
        pHindi === normSpoken ||
        pName === baseNameSpoken ||
        pHindi === baseNameSpoken
      );
    });

    if (exactMatch) {
      const unitPrice = exactMatch.fractionalConfig?.basePrice ?? exactMatch.basePricePerUnit ?? exactMatch.basePrice;
      return {
        isCatalogMatch: true,
        matchedProductId: exactMatch.id,
        matchedProductName: exactMatch.name,
        unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined,
      };
    }

    // 3. Substring / Token overlap match with exact product name retention
    const tokenMatch = shopProducts.find((p) => {
      const pName = (p.name || '').toLowerCase();
      const pHindi = (p.nameHindi || '').toLowerCase();
      if (isHariDhaniya && (pName.includes('powder') || pHindi.includes('पाउडर'))) {
        return false;
      }
      if (baseNameSpoken.length >= 3) {
        if (
          pName.includes(baseNameSpoken) ||
          pHindi.includes(baseNameSpoken) ||
          (pName.length >= 4 && baseNameSpoken.includes(pName)) ||
          (pHindi.length >= 4 && baseNameSpoken.includes(pHindi))
        ) {
          return true;
        }
      }
      return false;
    });

    if (tokenMatch) {
      const unitPrice = tokenMatch.fractionalConfig?.basePrice ?? tokenMatch.basePricePerUnit ?? tokenMatch.basePrice;
      return {
        isCatalogMatch: true,
        matchedProductId: tokenMatch.id,
        matchedProductName: tokenMatch.name,
        unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined,
      };
    }

    // 4. Commodity dictionary alias match (phonetic / transliteration variations)
    let matchedCommodity: string | null = null;
    for (const [commodity, aliases] of Object.entries(this.COMMODITY_ALIASES)) {
      if (
        aliases.some(
          (a) =>
            normSpoken === a.toLowerCase() ||
            normSpoken.includes(a.toLowerCase()) ||
            a.toLowerCase().includes(normSpoken) ||
            baseNameSpoken === a.toLowerCase() ||
            baseNameSpoken.includes(a.toLowerCase()) ||
            a.toLowerCase().includes(baseNameSpoken)
        )
      ) {
        matchedCommodity = commodity;
        break;
      }
    }

    if (matchedCommodity) {
      const aliases = this.COMMODITY_ALIASES[matchedCommodity];
      const match = shopProducts.find((p) => {
        const pName = (p.name || '').toLowerCase();
        const pHindi = (p.nameHindi || '').toLowerCase();
        const pId = (p.id || '').toLowerCase();
        const pTags = (p.tags || []).map((t: string) => t.toLowerCase());

        // Fresh coriander guard: NEVER match coriander powder!
        if (matchedCommodity === 'coriander') {
          if (pName.includes('powder') || pHindi.includes('पाउडर') || pId.includes('powder')) {
            return false;
          }
        }

        // Specific brand guard: If spoken mentioned "santoor", do NOT match "Dettol" or "Lux"!
        if (baseNameSpoken.includes('santoor') || baseNameSpoken.includes('संतूर')) {
          if (!pName.includes('santoor') && !pHindi.includes('संतूर') && !pTags.includes('santoor')) {
            return false;
          }
        }

        return aliases.some(
          (alias) =>
            pName.includes(alias.toLowerCase()) ||
            pHindi.includes(alias.toLowerCase()) ||
            pId.includes(alias.toLowerCase()) ||
            pTags.some((t: string) => t.includes(alias.toLowerCase()))
        );
      });

      if (match) {
        const unitPrice = match.fractionalConfig?.basePrice ?? match.basePricePerUnit ?? match.basePrice;
        return {
          isCatalogMatch: true,
          matchedProductId: match.id,
          matchedProductName: match.name,
          unitPrice: typeof unitPrice === 'number' ? unitPrice : undefined,
        };
      }
    }

    // 5. UNKNOWN PRODUCT RULE:
    // If no reliable catalog match exists, DO NOT guess another product.
    // Return false so caller sets: "Customer requested: <recognized product name>" with "Seller confirmation required".
    return { isCatalogMatch: false };
  }

  private static parseHindiNumber(val: string): number {
    const num = parseFloat(val);
    if (!isNaN(num)) return num;

    const map: Record<string, number> = {
      'ek': 1, 'एक': 1, 'do': 2, 'दो': 2, 'teen': 3, 'तीन': 3,
      'char': 4, 'chaar': 4, 'चार': 4, 'paanch': 5, 'panch': 5, 'पांच': 5, 'पाँच': 5,
      'chhah': 6, 'chhe': 6, 'छह': 6, 'छे': 6, 'saat': 7, 'सात': 7,
      'aath': 8, 'आठ': 8, 'nau': 9, 'नौ': 9, 'das': 10, 'दस': 10,
      'gyarah': 11, 'ग्यारह': 11, 'barah': 12, 'बारह': 12,
      'pandrah': 15, 'पंद्रह': 15, 'bees': 20, 'बीस': 20,
      'pachees': 25, 'पच्चीस': 25, 'tees': 30, 'तीस': 30,
      'pachaas': 50, 'पचास': 50, 'sau': 100, 'सौ': 100,
    };
    return map[val.toLowerCase()] || 1;
  }

  private static isInvalidFragment(name: string): boolean {
    const trimmed = (name || '').trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return true;
    if (/^\d+(?:\.\d+)?$/.test(trimmed)) return true;

    const INVALID_STANDALONE = new Set([
      'hari', 'patti', 'kala', 'safed', 'chhota', 'bada', 'baje', 'bhai', 'bhaiya',
      'chahiye', 'dedo', 'dena', 'kripya', 'please', 'aur', 'tatha', 'bhi', 'karo',
      'likho', 'hoga', 'hai', 'tha', 'the', 'thi', 'kar', 'de', 'le', 'lo', 'dost',
      '25', '10', '5', '1', '2', '3', '4', '6', '7', '8', '9', '50', '20',
      'हरी', 'पत्ती', 'काला', 'सफेद', 'छोटा', 'बड़ा', 'बजे', 'भाई', 'भैया', 'चाहिए',
      'देदो', 'देना', 'कृपया', 'और', 'तथा', 'भी', 'करो', 'लिखो', 'होगा', 'है', 'था',
      'सामान', 'समान', 'दूसरा सामान', 'दूसरा समान', 'दूसरा', 'दूसरे', 'dusra', 'doosra',
      'हमारे', 'हमारा', 'हमारे सामान', 'हमारा सामान', 'hamara', 'hamare',
      'saaman', 'saman', 'item', 'items', 'gun', 'गन',
      'का', 'की', 'के', 'ka', 'ki', 'ke',
      'वाला', 'वाली', 'वाले', 'wala', 'wali', 'wale',
      'किलो', 'kilo', 'kg', 'kgs', 'केजी', 'ग्राम', 'gram', 'gm', 'gms', 'g',
      'पैकेट', 'packet', 'packets', 'पैक', 'pack', 'packs', 'पैट',
      'पीस', 'piece', 'pieces', 'pcs', 'pc', 'नग',
      'दर्जन', 'dozen', 'darjan',
      'लीटर', 'liter', 'litre', 'ltr', 'l', 'ml', 'मिली',
      'प्लेट', 'plate', 'plates',
      'बोतल', 'bottle', 'bottles', 'डिब्बा', 'box', 'boxes',
      'रुपये', 'रुपए', 'रुपइया', 'rupaye', 'rs', 'rupees', 'रु',
      'एक', 'दो', 'दुई', 'तीन', 'चार', 'पांच', 'पाँच', 'छह', 'छे', 'सात', 'आठ', 'नौ', 'दस', 'बीस', 'पचास', 'सौ',
      'ek', 'do', 'dui', 'teen', 'char', 'chaar', 'paanch', 'panch', 'das', 'bees', 'pachaas', 'sau'
    ]);

    if (INVALID_STANDALONE.has(trimmed)) return true;

    // Check if the string consists entirely of unit/filler/number/preposition/generic words
    const stripped = trimmed
      .replace(/(?:₹|rs\.?|रुपये?|रु\.?|रुपइया|rupaye?|ka|ki|ke|का|की|के|wala|wali|wale|वाला|वाली|वाले|दे दो|चाहिए|मुझे|bhai|bhaiya|aur|और|भी)/gi, ' ')
      .replace(/(?:सामान|समान|दूसरा सामान|दूसरा समान|दूसरा|दूसरे|हमारे सामान|हमारा सामान|हमारे|हमारा|saaman|saman|item|items|gun|गन)/gi, ' ')
      .replace(/(?:एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|सौ|ek|do|dui|teen|char|chaar|paanch|panch|das|bees|pachaas|sau|\d+)/gi, ' ')
      .replace(/(?:किलो|kg|kilo|kgs|केजी|ग्राम|gram|gm|gms|पैकेट|packet|packets|पैक|pack|packs|पीस|piece|pieces|pcs|दर्जन|dozen|लीटर|liter|litre|ltr|प्लेट|plate|plates|बोतल|bottle|डिब्बा|box)/gi, ' ')
      .replace(/[,\.\?!।\s]/g, '')
      .trim();

    return stripped.length < 2;
  }

  private static cleanItemName(str: string): string {
    const isHindiScript = /[\u0900-\u097F]/.test(str);
    const cleaned = str
      .replace(/^(?:ka|ki|ke|का|की|के|wala|wali|wale|वाली|वाला|वाले|wali\s+bhi)(?:\s+|$)/i, '')
      .replace(/(?:\s+|^)(?:ka|ki|ke|का|की|के)$/i, '')
      .replace(/\s+(?:chahiye|dedo|de\s*do|dena|kardo|likh\s*lo|add\s*karo|दे\s*दो|चाहिए)$/i, '')
      .replace(/[,\.\?!।]/g, '')
      .trim()
      .replace(/^(?:ka|ki|ke|का|की|के)(?:\s+|$)/i, '')
      .replace(/(?:\s+|^)(?:ka|ki|ke|का|की|के)$/i, '')
      .trim();

    const lowerName = cleaned.toLowerCase();
    if (
      lowerName === 'khada masala' ||
      lowerName === 'khade masale' ||
      lowerName === 'sabut masala' ||
      lowerName === 'खड़ा मसाला' ||
      lowerName === 'खड़े मसाले' ||
      lowerName === 'साबुत मसाला' ||
      lowerName === 'khada' ||
      lowerName === 'खड़ा'
    ) {
      return 'खड़ा मसाला';
    }
    // Semantic normalization: "₹10 ka hari dhaniya" -> "Hari Patti Dhaniya" / "हरा धनिया", NEVER "Dhaniya Powder"
    if (
      lowerName === 'hari dhaniya' ||
      lowerName === 'hara dhaniya' ||
      lowerName === 'dhaniya patti' ||
      lowerName === 'dhaniya hari' ||
      lowerName === 'dhaniya hari patti' ||
      lowerName === 'हरी धनिया' ||
      lowerName === 'हरा धनिया' ||
      lowerName === 'धनिया पत्ती' ||
      lowerName === 'धनिया पत्ता' ||
      lowerName === 'धनिया' ||
      lowerName === 'coriander' ||
      lowerName === 'fresh coriander'
    ) {
      return isHindiScript ? 'हरा धनिया' : 'Hari Patti Dhaniya';
    }

    if (
      lowerName === 'kela' ||
      lowerName === 'kele' ||
      lowerName === 'banana' ||
      lowerName === 'bananas' ||
      lowerName === 'केला' ||
      lowerName === 'केले'
    ) {
      return isHindiScript ? 'केला' : 'Kela';
    }

    if (
      lowerName === 'aloo' ||
      lowerName === 'alu' ||
      lowerName === 'potato' ||
      lowerName === 'potatoes' ||
      lowerName === 'आलू' ||
      lowerName === 'आलु'
    ) {
      return isHindiScript ? 'आलू' : 'Aloo';
    }

    if (
      lowerName === 'pyaz' ||
      lowerName === 'pyaaz' ||
      lowerName === 'onion' ||
      lowerName === 'onions' ||
      lowerName === 'प्याज' ||
      lowerName === 'प्यास'
    ) {
      return isHindiScript ? 'प्याज' : 'Pyaz';
    }

    if (
      lowerName === 'tamatar' ||
      lowerName === 'tomato' ||
      lowerName === 'tomatoes' ||
      lowerName === 'टमाटर'
    ) {
      return isHindiScript ? 'टमाटर' : 'Tamatar';
    }

    if (
      lowerName === 'chowmein' ||
      lowerName === 'chaumin' ||
      lowerName === 'noodles' ||
      lowerName === 'चाउमिन' ||
      lowerName === 'चाउमीन' ||
      lowerName === 'चाऊमीन' ||
      lowerName === 'चौमीन'
    ) {
      return isHindiScript ? 'चाउमीन' : 'Chowmein';
    }

    if (
      lowerName === 'tikiya' ||
      lowerName === 'tikki' ||
      lowerName === 'tikia' ||
      lowerName === 'टिकिया' ||
      lowerName === 'टिक्की'
    ) {
      return isHindiScript ? 'टिकिया' : 'Tikiya';
    }

    if (
      lowerName === 'chhola' ||
      lowerName === 'chola' ||
      lowerName === 'chole' ||
      lowerName === 'छोला' ||
      lowerName === 'छोले'
    ) {
      return isHindiScript ? 'छोला' : 'Chhola';
    }

    if (
      lowerName === 'manchurian' ||
      lowerName === 'veg manchurian' ||
      lowerName === 'मंचूरियन'
    ) {
      return isHindiScript ? 'मंचूरियन' : 'Manchurian';
    }

    return cleaned
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
