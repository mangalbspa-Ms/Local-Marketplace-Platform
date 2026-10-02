/**
 * Kirana Voice Understanding & Semantic Parser
 * 
 * Rules of Truth:
 * 1. Never parse speech word-by-word into items.
 * 2. Complete shopping request format:
 *    - Price Variant: [PRODUCT NAME] — [PRICE VARIANT] — [QUANTITY] (e.g. "राजेश मीट मसाला — ₹5 वाला — 10 पैकेट")
 *    - Money Amount: [PRODUCT NAME] — [MONEY AMOUNT] (e.g. "मूंगफली — ₹50 की", "जरा — ₹50 का")
 *    - Weight: [PRODUCT NAME] — [WEIGHT] (e.g. "हल्दी पाउडर — 100 ग्राम", "चीनी — 250 ग्राम")
 *    - Packet Count: [PRODUCT NAME] — [PACKET COUNT] (e.g. "पारले जी बिस्कुट — 2 पैकेट")
 * 3. NEVER invent "1 इकाई" or dummy units.
 * 4. Preserve exact product names (e.g. "राजेश मीट मसाला" MUST NOT become "राजेश मसाला").
 * 5. Deduplicate repeated speech recognition fragments.
 */

import { Product } from '../../../types/product.ts';
import {
  KiranaMasterProduct,
  matchKiranaMasterProduct,
  splitUtteranceByCatalogBoundaries,
  MASTER_KIRANA_CATALOG,
  RECOGNIZED_KIRANA_BRANDS,
} from '../../../data/products/kiranaProductCatalog.ts';

// Re-export master catalog utilities
export {
  type KiranaMasterProduct,
  matchKiranaMasterProduct,
  splitUtteranceByCatalogBoundaries,
  MASTER_KIRANA_CATALOG,
  RECOGNIZED_KIRANA_BRANDS,
};

export interface ParsedKiranaItem {
  id: string;
  cleanTitle: string;
  originalText: string;
  rawItemName: string;
  productName: string;
  requestedName?: string;
  brand?: string;
  variantPrice?: number;
  quantity: number;
  unit?: string;
  weight?: string;
  totalPrice?: number;
  rawUtterance: string;
  itemType: 'variant' | 'price_variant' | 'money_amount' | 'weight' | 'quantity' | 'general';
  priceVariant?: number;
  priceVariantDisplay?: string;
  sizeVariant?: 'छोटा पैकेट' | 'बड़ा पैकेट';
  moneyAmount?: number;
  moneyAmountDisplay?: string;
  unitDisplay?: string; // e.g. "10 पैकेट", "250 ग्राम", "500 ग्राम", "1 किलो", "2.5 किलो" — NEVER "1 इकाई"
  quantityCount: number;
  quantityMultiplier: number;
  baseUnit: string;
  unitPrice?: number;
  isPriceEstimated: boolean;
  matchedProductId?: string | null;
  matchedProductName?: string;
  matchedProductImage?: string;
  isCatalogMatch: boolean;
  resolutionStatus?: 'MATCHED' | 'UNMATCHED';
  requiresSellerConfirmation?: boolean;
  masterProduct?: KiranaMasterProduct;
  masterCategory?: string;
}

/**
 * Parses Hindi words and English strings to numeric values
 */
export const parseHindiNumber = (val: string): number => {
  if (!val) return 1;
  const num = parseFloat(val);
  if (!isNaN(num)) return num;

  const map: Record<string, number> = {
    'ek': 1, 'एक': 1, '一': 1, 'do': 2, 'दो': 2, 'dui': 2, 'दुई': 2, 'teen': 3, 'तीन': 3, 'tin': 3,
    'char': 4, 'chaar': 4, 'चार': 4, 'paanch': 5, 'panch': 5, 'पांच': 5, 'पाँच': 5,
    'chhah': 6, 'chhe': 6, 'छह': 6, 'छे': 6, 'saat': 7, 'सात': 7,
    'aath': 8, 'आठ': 8, 'nau': 9, 'नौ': 9, 'das': 10, 'दस': 10,
    'gyarah': 11, 'ग्यारह': 11, 'barah': 12, 'बारह': 12,
    'pandrah': 15, 'पंद्रह': 15, 'bees': 20, 'बीस': 20,
    'pachees': 25, 'पच्चीस': 25, 'tees': 30, 'तीस': 30,
    'pachaas': 50, 'पचास': 50, 'sau': 100, 'सौ': 100,
    'dedh': 1.5, 'derh': 1.5, 'डेढ़': 1.5, 'डेढ': 1.5, 'dhai': 2.5, 'dhaiya': 2.5, 'ढाई': 2.5,
    'aadha': 0.5, 'आधा': 0.5, 'paav': 0.25, 'पाव': 0.25,
    'sawa': 1.25, 'सवा': 1.25, 'paun': 0.75, 'पौन': 0.75, 'पौना': 0.75,
  };
  return map[val.toLowerCase().trim()] || 1;
};

/**
 * Normalizes a word for comparison by stripping currency symbols and punctuation
 */
export const normalizeToken = (word: string): string => {
  return (word || '')
    .toLowerCase()
    .replace(/[₹,।\.\-\+\/\(\)\"\'\?!:]/g, '')
    .replace(/^(रुपये?|रु|रुपइया|rupaye?|rs)\b/i, '')
    .trim();
};

/**
 * Collapses consecutive duplicate words and repeated n-gram phrases.
 * Prevents browser speech engine repeats like:
 * - "10 वाला 10 वाला 10 वाला शैंपू" -> "10 वाला शैंपू"
 * - "₹10 वाला 10 वाला" -> "₹10 वाला"
 * - "शैंपू शैंपू" -> "शैंपू"
 * - "दस पैकेट दस पैकेट" -> "दस पैकेट"
 */
export const removeRepeatedPhrases = (text: string): string => {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Direct regex collapses for common repetitive patterns
  cleaned = cleaned.replace(/(₹?10\s*वाला|दस\s*वाला)(?:\s+(?:₹?10\s*वाला|10\s*वाला|दस\s*वाला))+/gi, '$1');
  cleaned = cleaned.replace(/(₹?5\s*वाला|पांच\s*वाला|पाँच\s*वाला)(?:\s+(?:₹?5\s*वाला|5\s*वाला|पांच\s*वाला|पाँच\s*वाला))+/gi, '$1');
  cleaned = cleaned.replace(/(₹?20\s*वाला|बीस\s*वाला)(?:\s+(?:₹?20\s*वाला|20\s*वाला|बीस\s*वाला))+/gi, '$1');
  cleaned = cleaned.replace(/(₹?50\s*वाला|पचास\s*वाला)(?:\s+(?:₹?50\s*वाला|50\s*वाला|पचास\s*वाला))+/gi, '$1');
  cleaned = cleaned.replace(/(दस\s*पैकेट|10\s*पैकेट)(?:\s+(?:दस\s*पैकेट|10\s*पैकेट))+/gi, '$1');
  cleaned = cleaned.replace(/(दो\s*पैकेट|2\s*पैकेट|दुई\s*पैकेट)(?:\s+(?:दो\s*पैकेट|2\s*पैकेट|दुई\s*पैकेट))+/gi, '$1');

  // 2. Token-level N-gram deduplication (up to 4-word repeats)
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return cleaned;

  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    let matchedN = 0;

    // Check n-gram repeats of size 4 down to 1
    for (let n = Math.min(4, Math.floor((tokens.length - i) / 2)); n >= 1; n--) {
      let isRepeat = true;
      for (let k = 0; k < n; k++) {
        const t1 = normalizeToken(tokens[i + k]);
        const t2 = normalizeToken(tokens[i + n + k]);
        if (!t1 || !t2 || t1 !== t2) {
          isRepeat = false;
          break;
        }
      }
      if (isRepeat) {
        matchedN = n;
        break;
      }
    }

    if (matchedN > 0) {
      // Add first instance of the n-gram if not already added
      for (let k = 0; k < matchedN; k++) {
        result.push(tokens[i + k]);
      }
      // Skip the repeated instance(s)
      i += matchedN * 2;
      // Skip any further consecutive repeats of the same n-gram
      while (i + matchedN <= tokens.length) {
        let isNextRepeat = true;
        for (let k = 0; k < matchedN; k++) {
          const t1 = normalizeToken(result[result.length - matchedN + k]);
          const t2 = normalizeToken(tokens[i + k]);
          if (!t1 || !t2 || t1 !== t2) {
            isNextRepeat = false;
            break;
          }
        }
        if (isNextRepeat) {
          i += matchedN;
        } else {
          break;
        }
      }
    } else {
      // Check if current single token matches the previous added token
      if (result.length > 0) {
        const lastNorm = normalizeToken(result[result.length - 1]);
        const currNorm = normalizeToken(tokens[i]);
        if (lastNorm && currNorm && lastNorm === currNorm) {
          i++;
          continue;
        }
      }
      result.push(tokens[i]);
      i++;
    }
  }

  return result.join(' ');
};

/**
 * Check if speech fragment contains ONLY quantity/portion/measurements, numbers,
 * prices, or filler words without an actual grocery noun.
 */
export const isOnlyQuantityOrFiller = (text: string): boolean => {
  if (!text || text.trim().length === 0) return true;
  const tTrimmed = text.trim();
  // If the phrase matches a master catalog product, it is NOT filler!
  if (matchKiranaMasterProduct(tTrimmed)) {
    return false;
  }

  let stripped = (text || '').toLowerCase().trim();

  // Strip greetings, fillers, generic item words, and completion verbs anywhere in text
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{M}\p{N}])(सामान|समान|दूसरा सामान|दूसरा समान|दूसरा|दूसरे|हमारे सामान|हमारा सामान|हमारे|हमारा|saaman|saman|item|items|gun|गन|भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|सुनिये|सुनिए|यार|देखो|दिखाओ|bhai|bhaiya|bhai sahab|are|suno|दे दो|दे दा|देइ दा|देइ द्या|दे द्या|चाहिए|मुझे चाहिए|मुझे|दे देना|होगा|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|ले आना|दीजिये|दीजिए|bhejo|bhej do|de do|chahiye|la do|बस|देखो|दिखाओ|कृपया|प्लीज|please|था|है|कर दो|कर देना|लगाओ|डालो|दुकानदार|दुकान)(?=[^\p{L}\p{M}\p{N}]|$)/gui,
    ' '
  );

  // Strip numbers (Hindi words and digits)
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{M}\p{N}])(एक|दो|दुई|दोइ|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|बीस|पचास|सवा|डेढ़|ढाई|आधा|पाव|पौन|पौना|सौ|sau|so|ek|do|teen|chaar|paanch|aadha|paav|sawa|paun)(?=[^\p{L}\p{M}\p{N}]|$)/gui,
    ' '
  );
  stripped = stripped.replace(/\b\d+(\.\d+)?\b/g, ' ');

  // Strip packaging & unit words with Unicode boundary support
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{M}\p{N}])(किलो|ग्राम|kg|g|gm|packet|packets|पैकेट|पैक|पैट|लीटर|litre|liter|ltr|l|बोतल|डिब्बा|डब्बा|pack|पैकेटों|पीस|piece|pieces|pcs|टुकड़ा|plate|plates|प्लेट|darjan|dozen|दर्जन|half|full|हाफ|फुल|वाला|वाली|वाले|छोटा|बड़ा|छोटका|बड़का|chota|bada|wala|wali)(?=[^\p{L}\p{M}\p{N}]|$)/gui,
    ' '
  );

  // Strip money currency, prepositions & conjunctions with Unicode boundary protection
  // (Prevents stripping "का" from "काजू" or "की" from "किशमिश")
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{M}\p{N}])(₹|रुपये?|रु\.?|रुपइया|rupaye?|rs\.?|ka|ki|ke|का|की|के|बाय|मुझे|mujhe|aur|और)(?=[^\p{L}\p{M}\p{N}]|$)/gui,
    ' '
  );

  // Clean up punctuation and whitespace
  stripped = stripped.replace(/[,।\.\-\+\/\s]/g, '').trim();

  return stripped.length < 2;
};

/**
 * Check if speech has an explicit quantity, weight, packet count, or portion
 */
export const hasQuantityOrPortion = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return (
    /\d+\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|pcs|plate|plates|प्लेट|darjan|dozen|दर्जन|किलो|kg|kilo|kilos|ग्राम|g|gm|लीटर|l|litre|liter|ltr|बोतल|डिब्बा|डब्बा)/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:दस|नौ|आठ|सात|छह|पांच|पाँच|चार|तीन|दो|दुई|दोइ|एक|ek|do|dui|teen|char|chaar|paanch|panch)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|pcs|plate|plates|प्लेट|darjan|dozen|दर्जन|किलो|kg|kilo|kilos|ग्राम|लीटर|liter|litre|बोतल|डिब्बा|डब्बा)/ui.test(lower) ||
    /(?:आधा किलो|aadha kilo|आधा दर्जन|aadha darjan|adha darjan|आधा दर्जन|half plate|haaf plate|full plate|ful plate|हाफ प्लेट|फुल प्लेट|एक पाव|पाव भर|पाव किलो|पाव|पउवा|पौवा|paav|pauwa|pauva|पौना किलो|पौन किलो|सवा किलो|डेढ़ किलो|डेढ किलो|ढाई किलो|सौ ग्राम|sau gram|100 ग्राम|250 ग्राम|500 ग्राम|1 किलो|2 किलो|दो किलो|दुई किलो|1 लीटर|2 लीटर|एक लीटर|दो लीटर|आधा लीटर|डेढ़ लीटर|ढाई लीटर)/i.test(lower) ||
    /(?:छोटा वाला|बड़ा वाला|छोटा पैकेट|बड़ा पैकेट|छोटा पैक|बड़ा पैक|छोटका|बड़का)/i.test(lower) ||
    /(?:मसाला|साबुन|शैंपू|शाम्पू|चीनी|आटा|निरमा|बिस्कुट|काजू|सूजी|मैदा|बादाम)\s+(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)\s*(?:पैकेट|पैकेटों|पैक|पैट|पीस|piece|pieces|pcs|plate|plates|प्लेट|darjan|dozen|दर्जन|टुकड़ा|किलो|ग्राम|gm|kg|लीटर)(?=[^\p{L}\p{M}\p{N}]|$)/ui.test(lower) ||
    /^\s*(?:\d+|ek|do|dui|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच)\s+([a-zA-Z\u0900-\u097F]+)/u.test(lower)
  );
};

/**
 * Check if speech has an explicit completion verb or closing marker
 */
export const hasCompletionVerb = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return (
    /(?:^|[^\p{L}\p{M}\p{N}])(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|दे देना|चाहिए|मुझे चाहिए|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|दीजिये|दीजिए|बस|bhejo|bhej do|de do|chahiye|la do)(?=[^\p{L}\p{M}\p{N}]|$)/ui.test(
      lower
    ) ||
    /(?:दे दो|दे दा|चाहिए|ला दो|दे देना)$/i.test(lower)
  );
};

/**
 * Check if speech has a monetary purchase request (e.g. "₹50 की मूंगफली", "₹50 का जरा")
 */
export const hasMoneyAmount = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return (
    /(?:₹|रुपये?|रु\.?|रुपइया)\s*\d+\s*(?:का|की|के|ka|ki|ke)/i.test(lower) ||
    /\d+\s*(?:रुपये?|रु\.?|रुपइया|rupaye?|rs\.?)\s*(?:का|की|के|ka|ki|ke)/i.test(lower) ||
    /(?:दस|बीस|पचास|सौ)\s*(?:रुपये?|रुपइया)?\s*(?:का|की|के)/i.test(lower) ||
    /(?:₹\s*\d+|\d+\s*रुपये?)\s*(?:की|का|के)/i.test(lower)
  );
};

/**
 * Check if speech has a price variant (e.g. "₹5 वाला", "दस वाला", "₹10 वाला")
 */
export const hasPriceVariant = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return (
    /(?:₹|रुपये?|रु\.?|रुपइया)?\s*\d+\s*(?:वाला|वाली|वाले|wala|wali|wale)/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:दस|पांच|पाँच|बीस|पचास|सौ)\s*(?:वाला|वाली|वाले)/ui.test(lower) ||
    /(?:दस वाला|पांच वाला|पाँच वाला|बीस वाला|पचास वाला)/i.test(lower)
  );
};

/**
 * Known grocery keywords used for fast product noun identification
 */
const KNOWN_GROCERY_KEYWORDS = [
  'राजेश मीट मसाला',
  'राजेश सब्जी मसाला',
  'राजेश गरम मसाला',
  'राजेश मसाला',
  'मीट मसाला',
  'सब्जी मसाला',
  'गरम मसाला',
  'राजेश',
  'मसाला',
  'संतूर साबुन',
  'संतूर',
  'santoor',
  'साबुन',
  'soap',
  'लाइफबॉय',
  'डिटॉल',
  'लक्स',
  'क्लिनिक प्लस शैंपू',
  'क्लिनिक प्लस',
  'क्लीनिक प्लस',
  'clinic plus',
  'डव शैंपू',
  'डव',
  'dove',
  'सनसिल्क शैंपू',
  'सनसिल्क',
  'शैंपू',
  'शाम्पू',
  'shampoo',
  'पतंजलि बिस्कुट',
  'पतंजलि',
  'patanjali',
  'पारले जी बिस्कुट',
  'पारले जी',
  'पारलेजी',
  'parle g',
  'गुड डे बिस्कुट',
  'गुड डे',
  'मैरी गोल्ड',
  'ओरियो',
  'बिस्कुट',
  'biscuit',
  'सूजी',
  'suji',
  'sooji',
  'रवा',
  'काजू',
  'kaju',
  'cashew',
  'मैदा',
  'maida',
  'बादाम',
  'badam',
  'almond',
  'किशमिश',
  'kishmish',
  'बेसन',
  'besan',
  'पोहा',
  'चूड़ा',
  'मूंगफली',
  'हल्दी पाउडर',
  'हल्दी',
  'धनिया पाउडर',
  'धनिया',
  'मिर्च पाउडर',
  'लाल मिर्च',
  'जरा',
  'जीरा',
  'निरमा वॉशिंग पाउडर',
  'निरमा वाशिंग पाउडर',
  'निरमा साबुन',
  'निरमा',
  'nirma',
  'सर्फ',
  'सरफ',
  'surf',
  'चीनी',
  'cheeni',
  'sugar',
  'शक्कर',
  'गुड़',
  'gur',
  'gud',
  'jaggery',
  'आटा',
  'atta',
  'aata',
  'flour',
  'सरसों का तेल',
  'सरसों तेल',
  'कड़वा तेल',
  'तेल',
  'oil',
  'चायपत्ती',
  'चाय',
  'chai',
  'tea',
  'नमक',
  'namak',
  'salt',
  'दाल',
  'dal',
  'चावल',
  'rice',
  'टूथपेस्ट',
  'मंजन',
  'colgate',
];

/**
 * Checks if a string contains any genuine grocery noun
 */
export const hasProductNoun = (text: string, shopProducts: Product[] = []): boolean => {
  if (!text || text.trim().length === 0) return false;
  // 1. Check Master Kirana Product Catalog first
  if (matchKiranaMasterProduct(text)) {
    return true;
  }
  const lower = (text || '').toLowerCase();
  for (const kw of KNOWN_GROCERY_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  for (const p of shopProducts) {
    const pName = (p.name || '').toLowerCase();
    const pHindi = (p.nameHindi || '').toLowerCase();
    if ((pName && lower.includes(pName)) || (pHindi && lower.includes(pHindi))) {
      return true;
    }
  }
  // Check if non-empty noun remains after stripping fillers, numbers, prices, units, and verbs
  return !isOnlyQuantityOrFiller(text);
};

/**
 * Complete-Thought Detection:
 * Determines if a recognized speech fragment contains enough semantic information
 * to represent a genuine grocery order item:
 * PRODUCT + (QUANTITY OR MONEY AMOUNT OR PRICE VARIANT OR COMPLETION VERB).
 *
 * Prevents premature splitting or creation of incomplete items like:
 * - "₹10 वाला..." (price variant only, NO product noun)
 * - "दस वाला..." (price variant only)
 * - "राजेश..." (product brand only, no variant or quantity yet)
 * - "साबुन..." (product noun only, no variant or quantity yet)
 * - "10 पैकेट..." (quantity only, NO product noun)
 * - "भाई मुझे चाहिए..." (filler only)
 */
export const isCompleteThought = (text: string, shopProducts: Product[] = []): boolean => {
  if (!text || text.trim().length < 2) return false;
  if (isOnlyQuantityOrFiller(text)) return false;

  const lower = (text || '').toLowerCase().trim();

  // If text ends with an incomplete connector or preposition without following noun
  // e.g. "वाला", "का", "की", "और", "तथा"
  if (/(?:वाला|वाली|वाले|wala|wali|wale|ka\b|ki\b|ke\b|का|की|के|और|aur|तथा|एवं)$/i.test(lower)) {
    return false;
  }

  // 1. Must contain a substantive product noun
  if (!hasProductNoun(lower, shopProducts)) {
    return false;
  }

  // 2. Complete if it is a recognized compound brand + product (e.g. "Everest Sabji Masala", "Rajesh Meat Masala", "MDH Chana Masala")
  const master = matchKiranaMasterProduct(lower);
  if (master && (master.product.brand || master.product.canonicalNameHindi.includes(' ') || master.product.canonicalNameEnglish.includes(' '))) {
    const isBrandAlone = RECOGNIZED_KIRANA_BRANDS.some((b) =>
      b.aliases.some((a) => a.toLowerCase() === lower.replace(/[,\.\-]/g, '').trim())
    );
    if (!isBrandAlone) {
      return true;
    }
  }

  // 3. Must contain an explicit quantifier, price variant, money amount, or completion verb
  const hasQty = hasQuantityOrPortion(lower);
  const hasMoney = hasMoneyAmount(lower);
  const hasPrice = hasPriceVariant(lower);
  const hasVerb = hasCompletionVerb(lower);

  return hasQty || hasMoney || hasPrice || hasVerb;
};

/**
 * Smart buffer merge: merges a newly recognized speech chunk into the current utterance buffer.
 * Uses normalized token matching so currency symbols, casing, and word boundary overlaps
 * prevent duplicated repeats.
 */
export const mergeUtteranceChunks = (prev: string, curr: string): string => {
  const p = prev.trim();
  const c = curr.trim();
  if (!p) return removeRepeatedPhrases(c);
  if (!c) return removeRepeatedPhrases(p);

  const pNorm = normalizeToken(p);
  const cNorm = normalizeToken(c);

  // 1. Exact duplicate
  if (pNorm === cNorm) {
    return p;
  }

  // 2. curr is an expanded/revised version of prev
  if (cNorm.startsWith(pNorm) && c.length >= p.length) {
    return removeRepeatedPhrases(c);
  }

  // 3. prev already contains curr
  if (pNorm.includes(cNorm)) {
    return p;
  }

  // 4. Token boundary overlap check with normalized comparison
  const prevTokens = p.split(/\s+/).filter(Boolean);
  const currTokens = c.split(/\s+/).filter(Boolean);

  const maxOverlap = Math.min(prevTokens.length, currTokens.length);
  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    const prevSlice = prevTokens.slice(-overlap).map(normalizeToken).join(' ');
    const currSlice = currTokens.slice(0, overlap).map(normalizeToken).join(' ');

    if (prevSlice === currSlice && prevSlice.length > 0) {
      const merged = [...prevTokens, ...currTokens.slice(overlap)].join(' ');
      return removeRepeatedPhrases(merged);
    }
  }

  // 5. No overlap: concatenate
  return removeRepeatedPhrases(`${p} ${c}`);
};

export interface MasterCatalogProductResolution {
  masterProduct?: KiranaMasterProduct;
  matchedProductId: string | null;
  matchedProductName: string;
  brand?: string;
  isCatalogMatch: boolean;
  resolutionStatus: 'MATCHED' | 'UNMATCHED';
  requiresSellerConfirmation: boolean;
  cleanItemName: string;
  matchedProductImage?: string;
}

/**
 * Resolves spoken product against the Master Kirana Catalog ID first.
 * Single Source of Truth for product identity:
 * 1. Match complete spoken phrase against Master Catalog.
 * 2. Check canonical names (Hindi & English), registered aliases, transliteration.
 * 3. Strip clearly identifiable quantity/price/budget terms and match the product phrase.
 * 4. If confident Master Catalog product matches, use its canonical product ID.
 * 5. If no confident match exists, preserve exact requested product name without guessing (UNMATCHED).
 * 6. Return null if no product noun exists (e.g. "1 किलो").
 */
export const resolveSpokenProductAgainstMasterCatalog = (
  clause: string,
  shopProducts: Product[] = []
): MasterCatalogProductResolution | null => {
  if (!clause || clause.trim().length < 2) return null;
  let text = clause.trim();

  // Strip opening greetings and filler prefixes
  text = text.replace(/^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|सुनिये|सुनिए|यार|देखो|दिखाओ|bhai|bhaiya|bhai sahab|are|suno)(?=[^\p{L}\p{M}\p{N}]|$)\s*/gui, '');
  // Strip completion verbs / filler suffixes
  text = text.replace(/\s*(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|चाहिए|मुझे चाहिए|मुझे|दे देना|होगा|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|ले आना|दीजिये|दीजिए|bhejo|bhej do|de do|chahiye|la do|बस|देखो|दिखाओ)$/gui, '');
  text = text.trim();
  if (text.length < 2 || isOnlyQuantityOrFiller(text)) return null;

  const lower = text.toLowerCase();

  // Step 1: Direct full phrase match against Master Catalog
  let masterMatch = matchKiranaMasterProduct(text);

  // Step 2: Extract candidate product phrase by removing quantity/unit/price/budget terms
  let candidatePhrase = text;
  // Price variants (₹10 वाला, 5 वाला)
  candidatePhrase = candidatePhrase.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*\d+\s*(?:का|की|के)\s*(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)?\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*\d+\s*(?:रुपये?|रु\.?|रुपइया|rs\.?|rs|rupaye|rupayee|rupees)?\s*(?:वाला|वाली|वाले|wala|wali|wale)/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:दस|पांच|पाँच|बीस|पचास|दो|दुई|एक|das|paanch|panch|chaar|teen)\s*(?:रुपइया|रुपये?|रुपए|rupaye)?\s*(?:वाला|वाली|वाले|wala|wali|wale)/gi, ' ');
  // Packet counts / pieces
  candidatePhrase = candidatePhrase.replace(/\b\d+\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|इकाई)\b/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:दस|पांच|पाँच|चार|तीन|दो|दुई|एक|das|paanch|panch|chaar|teen|do|dui|ek)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/gi, ' ');
  // Dozen / Plates / Pieces
  candidatePhrase = candidatePhrase.replace(/(?:ek|do|dui|teen|char|chaar|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|\d+)?\s*(?:darjan|dozen|दर्जन|दर्ज़न|डर्जन)/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:ek|do|dui|teen|char|chaar|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|\d+)?\s*(?:half|haaf|हाफ|full|ful|फुल)?\s*(?:plate|plates|प्लेट|पलेट)/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:ek|do|dui|teen|char|chaar|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|\d+)?\s*(?:piece|pieces|pcs|pc|पीस|इकाई)/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/\b(?:half|haaf|full|ful|हाफ|फुल)\b/gi, ' ');
  // Weights and volume
  candidatePhrase = candidatePhrase.replace(/\b\d+(\.\d+)?\s*(?:किलो|ग्राम|kg|g|gm|kilo|kilos|लीटर|litre|liter|ltr|l)\b/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:char|teen|do|dui|doi|ek|चार|तीन|दो|दुई|दोइ|एक)?\s*(?:पाव|पौवा|पउवा|paav|pauwa)(?:\s*भर|\s*किलो)?/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:आधा|डेढ़|ढाई|पौना|पौन|सवा|एक|दो|दुई|तीन|चार|पांच|पाँच|दस|aadha|dedh|dhai|sawa|paun)\s*(?:किलो|ग्राम|kilo|kg|litre|लीटर|liter|ltr)/gi, ' ');
  // Money amounts and budgets (₹50 का, 50 रुपये का, 30 का)
  candidatePhrase = candidatePhrase.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*\d+\s*(?:रुपये?|रु\.?|रुपए|rupaye?|rupees|rs)?\s*(?:का|की|के|ka|ki|ke)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)\s*\d+/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:^|[^\p{L}\p{M}\p{N}])\d+\s*(?:रुपये?|रुपए|रु|rupaye|rupees)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:दस|बीस|पचास|सौ)\s*(?:रुपये?|रुपइया|रुपए|rupaye)?\s*(?:का|की|के)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ');
  candidatePhrase = candidatePhrase.replace(/(?:दस|बीस|पचास|सौ)\s*(?:रुपये?|रुपइया|रुपए|rupaye)/gui, ' ');
  // Unit words
  candidatePhrase = candidatePhrase.replace(/(?:^|[^\p{L}\p{M}\p{N}])(packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|plate|plates|प्लेट|ग्राम|किलो|kg|g|gm|kilo|kilos|लीटर|litre|liter|ltr|l)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ');
  // Leftover numbers and boundaries
  candidatePhrase = candidatePhrase.replace(/^\s*\d+(\.\d+)?\s+/g, ' ');
  candidatePhrase = candidatePhrase.replace(/^\s*(ek|do|dui|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|सवा|पौन|पौना|डेढ़|ढाई|आधा)\s+/gi, ' ');
  candidatePhrase = candidatePhrase.replace(/\b\d+(\.\d+)?\b/g, ' ');
  candidatePhrase = candidatePhrase.replace(/[,।\.\-\+\/\s]+/g, ' ').trim();
  candidatePhrase = candidatePhrase.replace(/^(?:का|की|के|ka|ki|ke)\s+/gui, '').replace(/\s+(?:का|की|के|ka|ki|ke)$/gui, '').trim();

  // Convert Hinglish grocery words to Hindi if needed
  if (candidatePhrase) {
    candidatePhrase = candidatePhrase.replace(/\bsabun\b/gi, 'साबुन');
    candidatePhrase = candidatePhrase.replace(/\bmasala\b/gi, 'मसाला');
    candidatePhrase = candidatePhrase.replace(/\btel\b/gi, 'तेल');
  }

  if (candidatePhrase && !/[\u0900-\u097F]/.test(candidatePhrase)) {
    candidatePhrase = candidatePhrase.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }

  if (!masterMatch && candidatePhrase) {
    masterMatch = matchKiranaMasterProduct(candidatePhrase);
  }

  // Handle special culinary/cooked chowmein vs packaged noodles
  const isChowmeinSpoken = lower.includes('चाउमीन') || lower.includes('chaumin') || lower.includes('chowmein');
  const isChingsSpoken = lower.includes('चिंग्स') || lower.includes('chings');
  if (isChowmeinSpoken && !isChingsSpoken && masterMatch?.product.canonicalNameHindi?.includes('चिंग्स')) {
    const genuineChowmein = MASTER_KIRANA_CATALOG.find((p) => p.id === 'gen_chowmein');
    if (genuineChowmein) {
      masterMatch = { product: genuineChowmein, matchedAlias: 'चाउमीन' };
    }
  }

  let masterProduct = masterMatch?.product;
  let brand: string | undefined = masterProduct?.brand;
  let resolvedProductName = candidatePhrase || text;

  if (masterMatch) {
    const mp = masterMatch.product;
    if (mp.brand) brand = mp.brand;
    const isGenericProduct = mp.id.startsWith('gen_');
    const hasAdditionalSpecificWords = candidatePhrase.trim().length > (masterMatch.matchedAlias || '').trim().length;

    if (mp.id === 'gen_khada_masala') {
      resolvedProductName = 'खड़ा मसाला';
    } else if (isGenericProduct && hasAdditionalSpecificWords) {
      resolvedProductName = candidatePhrase;
    } else if (!/[\u0900-\u097F]/.test(candidatePhrase) && mp.canonicalNameEnglish && !isGenericProduct) {
      resolvedProductName = mp.canonicalNameEnglish;
    } else if (mp.canonicalNameHindi) {
      resolvedProductName = mp.canonicalNameHindi;
    } else if (mp.canonicalNameEnglish) {
      resolvedProductName = mp.canonicalNameEnglish;
    }
  } else {
    // Colloquial Awadhi & common rural grocery normalization for unmatched products:
    const pLower = (resolvedProductName || '').toLowerCase();
    if (pLower === 'khada' || pLower === 'खड़ा' || pLower === 'khada masala' || pLower === 'khade masale' || pLower === 'खड़े मसाले') {
      resolvedProductName = 'खड़ा मसाला';
      const khadaProd = MASTER_KIRANA_CATALOG.find((p) => p.id === 'gen_khada_masala');
      if (khadaProd) {
        masterProduct = khadaProd;
        masterMatch = { product: khadaProd, matchedAlias: 'खड़ा मसाला' };
      }
    } else if (isChowmeinSpoken) {
      resolvedProductName = 'चाउमीन';
    } else if (lower.includes('टिकिया') || lower.includes('tikiya') || lower.includes('tikki')) {
      resolvedProductName = 'टिकिया';
    } else if (lower.includes('समोसा') || lower.includes('samosa')) {
      resolvedProductName = 'समोसा';
    } else if (lower.includes('टमाटर') || lower.includes('tamatar') || lower.includes('tomato')) {
      resolvedProductName = 'टमाटर';
    } else if (lower.includes('आलू') || lower.includes('aloo') || lower.includes('potato')) {
      resolvedProductName = 'आलू';
    } else if (lower.includes('अनार') || lower.includes('anar') || lower.includes('pomegranate')) {
      resolvedProductName = 'अनार';
    } else if (lower.includes('संतूर') || lower.includes('santoor')) {
      resolvedProductName = 'संतूर साबुन';
      brand = 'Santoor';
    } else if (pLower === 'राजेश मसाला' || pLower === 'राजेश मीट मसाला' || (pLower.includes('राजेश') && (pLower.includes('मीट') || pLower.includes('मसाला')))) {
      resolvedProductName = 'राजेश मसाला';
      brand = 'Rajesh';
    } else if (pLower === 'सुजी') {
      resolvedProductName = 'सूजी';
    } else if (pLower === 'जरा') {
      resolvedProductName = 'जरा';
    } else if (pLower === 'हल्दी') {
      resolvedProductName = 'हल्दी पाउडर';
    }
  }

  // Detect brand if not found from master catalog
  if (!brand) {
    for (const b of RECOGNIZED_KIRANA_BRANDS) {
      for (const alias of b.aliases) {
        const reg = new RegExp(`(?:^|[\\s,।\\.\\-])${alias}(?:$|[\\s,।\\.\\-])`, 'i');
        if (reg.test(lower) || reg.test(candidatePhrase)) {
          brand = b.name;
          break;
        }
      }
      if (brand) break;
    }
  }

  if (brand) {
    const bLower = (brand || '').toLowerCase();
    const pLower = (resolvedProductName || '').toLowerCase();
    const matchedBrandObj = RECOGNIZED_KIRANA_BRANDS.find((b) => (b.name || '').toLowerCase() === bLower);
    const hasBrandInProduct = pLower.includes(bLower) || (matchedBrandObj && resolvedProductName && resolvedProductName.includes(matchedBrandObj.hindiName));
    if (!hasBrandInProduct) {
      const spokenHindiBrand = matchedBrandObj?.aliases.find((a) => lower.includes(a) && /[\u0900-\u097F]/.test(a));
      const brandPrefix = spokenHindiBrand ? matchedBrandObj?.hindiName || brand : brand;
      resolvedProductName = `${brandPrefix} ${resolvedProductName}`;
    }
  }

  // Check if candidate product is empty or only quantity/filler or generic word
  const pNorm = (resolvedProductName || '').trim().toLowerCase();
  const GENERIC_FILLER_WORDS = new Set([
    'सामान', 'समान', 'दूसरा सामान', 'दूसरा समान', 'दूसरा', 'दूसरे',
    'हमारे सामान', 'हमारा सामान', 'हमारे', 'हमारा', 'saaman', 'saman',
    'item', 'items', 'gun', 'गन', 'का', 'की', 'के', 'ka', 'ki', 'ke',
    'वाला', 'वाली', 'वाले', 'wala', 'wali', 'wale',
    'किलो', 'kilo', 'kg', 'ग्राम', 'gram', 'पैकेट', 'packet', 'पैक', 'pack',
    'पीस', 'piece', 'दर्जन', 'dozen', 'लीटर', 'liter', 'litre', 'प्लेट', 'plate'
  ]);
  if (!resolvedProductName || resolvedProductName.trim().length < 2 || GENERIC_FILLER_WORDS.has(pNorm) || isOnlyQuantityOrFiller(resolvedProductName)) {
    return null;
  }

  const cleanItemName = resolvedProductName.trim();
  const isCatalogMatch = Boolean(masterMatch && masterMatch.product);
  const matchedProductId = isCatalogMatch ? masterMatch!.product.id : null;
  const matchedProductName = isCatalogMatch
    ? (masterMatch!.product.canonicalNameHindi || masterMatch!.product.canonicalNameEnglish)
    : cleanItemName;

  // Auxiliary shop catalog check (for local image)
  let matchedProductImage: string | undefined = undefined;
  if (Array.isArray(shopProducts) && shopProducts.length > 0) {
    const sMatch = shopProducts.find((p) => {
      const pName = (p.name || '').toLowerCase();
      const pHindi = (p.nameHindi || '').toLowerCase();
      return (pName && lower.includes(pName)) || (pHindi && lower.includes(pHindi));
    });
    if (sMatch?.imageUrl) {
      matchedProductImage = sMatch.imageUrl;
    }
  }

  return {
    masterProduct: masterMatch?.product,
    matchedProductId,
    matchedProductName,
    brand,
    isCatalogMatch,
    resolutionStatus: isCatalogMatch ? 'MATCHED' : 'UNMATCHED',
    requiresSellerConfirmation: !isCatalogMatch,
    cleanItemName,
    matchedProductImage,
  };
};

/**
 * Parse a single customer spoken clause into a normalized Kirana shopping-list item.
 * Adheres strictly to the Single Source of Truth rules:
 * - Spoken product is resolved against Master Catalog ID first.
 * - Quantities, units, weights, price variants, and budgets extracted separately.
 * - NO "1 इकाई" invented.
 * - Exact product names preserved for unmatched requests.
 */
export const parseVoiceShoppingSlipItem = (
  clause: string,
  shopProducts: Product[] = []
): ParsedKiranaItem | null => {
  let normalizedClause = (clause || '')
    .replace(/(?:^|[^\p{L}\p{M}\p{N}])[\u4e00一—–-](?=\s*(?:किलो|kg|kilo|लीटर|दर्जन|पैकेट|ग्राम|पीस|प्लेट|[a-zA-Z\u0900-\u097F]+))/gui, ' एक ');
  const deRepeated = removeRepeatedPhrases(normalizedClause);
  const trimmed = deRepeated.trim();
  if (trimmed.length < 2) return null;
  if (isOnlyQuantityOrFiller(trimmed)) return null;

  // -------------------------------------------------------------
  // RESOLVE SPOKEN PRODUCT AGAINST MASTER CATALOG ID FIRST
  // -------------------------------------------------------------
  const productResolution = resolveSpokenProductAgainstMasterCatalog(trimmed, shopProducts);
  if (!productResolution) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  // -------------------------------------------------------------
  // PRE-PASS: CHECK IF PACKET COUNT / QUANTITY IS EXPLICITLY SPOKEN
  // -------------------------------------------------------------
  const explicitPacketCountMatch =
    lower.match(/(\d+)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/i) ||
    (lower.match(/(?:दस|10|das)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('दस पैकेट') || lower.includes('10 पैकेट') ? [null, '10'] : null) ||
    (lower.match(/(?:पांच|पाँच|5|paanch|panch)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('पांच पैकेट') || lower.includes('पाँच पैकेट') || lower.includes('5 पैकेट') ? [null, '5'] : null) ||
    (lower.match(/(?:चार|4|chaar|char)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('चार पैकेट') || lower.includes('4 पैकेट') ? [null, '4'] : null) ||
    (lower.match(/(?:तीन|3|teen|tin)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('तीन पैकेट') || lower.includes('3 पैकेट') ? [null, '3'] : null) ||
    (lower.match(/(?:दो|दुई|2|do|dui)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('दो पैकेट') || lower.includes('2 पैकेट') || lower.includes('दुई पैकेट') ? [null, '2'] : null) ||
    (lower.match(/(?:एक|1|ek)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece)/i) || lower.includes('एक पैकेट') || lower.includes('1 पैकेट') ? [null, '1'] : null) ||
    (/(?:शैंपू|शाम्पू|साबुन|मसाला|santoor|बिस्कुट)\s+(?:दस|10)\b(?!\s*(?:रुपये?|रु|रुपए|वाला|wali|wale|ka|ki|ke|रुपइया|rs|rupaye))/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:दस|10)\s*(?:दे दा|देइ दा|दे दो|चाहिए)$/ui.test(lower)
      ? [null, '10']
      : null) ||
    (/(?:मसाला|साबुन|शैंपू|शाम्पू|बिस्कुट)\s+(?:दो|दुई|2)\b(?!\s*(?:रुपये?|रु|रुपए|वाला|wali|wale|ka|ki|ke|रुपइया|rs|rupaye))/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:दो|दुई|2)\s*(?:दे दो|दे दा|चाहिए)?$/ui.test(lower)
      ? [null, '2']
      : null) ||
    (/(?:मसाला|साबुन|शैंपू|शाम्पू|बिस्कुट)\s+(?:एक|1)\b(?!\s*(?:रुपये?|रु|रुपए|वाला|wali|wale|ka|ki|ke|रुपइया|rs|rupaye))/i.test(lower) ||
    /(?:^|[^\p{L}\p{M}\p{N}])(?:एक|1)\s*(?:दे दो|दे दा|चाहिए)?$/ui.test(lower)
      ? [null, '1']
      : null);

  const hasPacketOrUnitCount = Boolean(explicitPacketCountMatch && explicitPacketCountMatch[1]);

  // -------------------------------------------------------------
  // 1. DETECT PRICE VARIANT (Rule 4A: ₹5 वाला, ₹10 वाला, ₹10 का 10 पैकेट)
  // Can be spoken BEFORE, AFTER, or IN BETWEEN product and quantity
  // -------------------------------------------------------------
  let priceVariant: number | undefined = undefined;

  // Pattern A: Explicit "वाला / वाली / वाले / wala" variant with digits: "₹5 वाला", "5 वाला", "10 वाला", "₹2 वाला", "5 rupaye wala", "5 rs wala"
  const priceVariantMatch =
    lower.match(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*(\d+)\s*(?:रुपये?|रु\.?|रुपइया|rs\.?|rs|rupaye|rupayee|rupees)?\s*(?:वाला|वाली|वाले|wala|wali|wale)/i);

  // Pattern B: Spoken words for price variant: "पाँच वाला", "5 वाला", "पांच रुपये वाला", "₹5 वाला", "paanch wala", "panch wala"
  const isFiveVariant =
    lower.includes('पांच वाला') ||
    lower.includes('पाँच वाला') ||
    lower.includes('पांच रुपइया वाला') ||
    lower.includes('पाँच रुपइया वाला') ||
    lower.includes('पांच रुपये वाला') ||
    lower.includes('पाँच रुपये वाला') ||
    lower.includes('पाँच रुपए वाला') ||
    lower.includes('पांच रुपए वाला') ||
    lower.includes('paanch wala') ||
    lower.includes('panch wala') ||
    lower.includes('paanch rupaye wala') ||
    lower.includes('panch rupaye wala') ||
    lower.includes('₹5 वाला') ||
    lower.includes('5 वाला') ||
    /(?:^|\s)(?:पांच|पाँच|paanch|panch)\s*(?:रुपये?|रुपइया|rupaye)?\s*(?:वाला|wala)/i.test(lower);

  const isTenVariant =
    lower.includes('दस वाला') ||
    lower.includes('दस रुपइया वाला') ||
    lower.includes('दस रुपये वाला') ||
    lower.includes('दस रुपए वाला') ||
    lower.includes('das wala') ||
    lower.includes('das rupaye wala') ||
    lower.includes('₹10 वाला') ||
    lower.includes('10 वाला') ||
    /(?:^|\s)(?:दस|das)\s*(?:रुपये?|रुपइया|rupaye)?\s*(?:वाला|wala)/i.test(lower);

  const isTwentyVariant =
    lower.includes('बीस वाला') ||
    lower.includes('बीस रुपइया वाला') ||
    lower.includes('बीस रुपये वाला') ||
    lower.includes('bees wala') ||
    lower.includes('₹20 वाला') ||
    lower.includes('20 वाला') ||
    /(?:^|\s)(?:बीस|bees)\s*(?:रुपये?|रुपइया|rupaye)?\s*(?:वाला|wala)/i.test(lower);

  const isFiftyVariant =
    lower.includes('पचास वाला') ||
    lower.includes('पचास रुपइया वाला') ||
    lower.includes('पचास रुपये वाला') ||
    lower.includes('pachaas wala') ||
    lower.includes('₹50 वाला') ||
    lower.includes('50 वाला') ||
    /(?:^|\s)(?:पचास|pachaas)\s*(?:रुपये?|रुपइया|rupaye)?\s*(?:वाला|wala)/i.test(lower);

  // Pattern C: When customer speaks "₹10 का 10 पैकेट" or "₹5 का 2 पैकेट":
  const pricePerPacketMatch = lower.match(
    /(?:₹|रुपये?|रु\.?|रुपइया)?\s*(\d+)\s*(?:का|की|के)\s*(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)?\s*(?:पैकेट|पैक|पैट|पीस|piece)/i
  );

  if (priceVariantMatch && priceVariantMatch[1]) {
    priceVariant = parseInt(priceVariantMatch[1], 10);
  } else if (isFiveVariant) {
    priceVariant = 5;
  } else if (isTenVariant) {
    priceVariant = 10;
  } else if (isTwentyVariant) {
    priceVariant = 20;
  } else if (isFiftyVariant) {
    priceVariant = 50;
  } else if (pricePerPacketMatch && pricePerPacketMatch[1]) {
    priceVariant = parseInt(pricePerPacketMatch[1], 10);
  } else if (hasPacketOrUnitCount) {
    // If packet count is present and currency digit is spoken:
    const generalPriceMatch =
      lower.match(/(?:₹|रुपये?|रु\.?|रुपइया)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:रुपये?|रु\.?|रुपइया)/i);
    if (generalPriceMatch && generalPriceMatch[1]) {
      priceVariant = parseInt(generalPriceMatch[1], 10);
    } else if (lower.includes('दस का')) {
      priceVariant = 10;
    } else if (lower.includes('पांच का') || lower.includes('पाँच का')) {
      priceVariant = 5;
    } else if (lower.includes('बीस का')) {
      priceVariant = 20;
    } else if (lower.includes('पचास का')) {
      priceVariant = 50;
    }
  }

  // -------------------------------------------------------------
  // 2. DETECT MONEY-BASED SHOPPING (Rule 4B: ₹50 की मूंगफली, ₹50 का जरा)
  // ONLY applies when NO price variant and NO explicit packet count exists!
  // -------------------------------------------------------------
  let moneyAmount: number | undefined = undefined;
  let moneySuffix = 'की'; // 'की' or 'का'

  if (!priceVariant && !hasPacketOrUnitCount) {
    const moneyMatch =
      lower.match(/(?:₹|रुपये?|रु\.?|रुपइया)\s*(\d+)\s*(?:(का|की|के)|ka|ki|ke)/i) ||
      lower.match(/(\d+)\s*(?:रुपये?|रु\.?|रुपइया|rupaye?|rs\.?)\s*(?:(का|की|के)|ka|ki|ke)/i) ||
      lower.match(/(?:₹\s*|\b)(\d+)\s*(?:(का|की|के))/i);

    if (moneyMatch && moneyMatch[1]) {
      moneyAmount = parseInt(moneyMatch[1], 10);
      if (moneyMatch[2] === 'का' || lower.includes(' का ') || lower.endsWith(' का')) {
        moneySuffix = 'का';
      }
    } else {
      if (lower.includes('पचास रुपये की') || lower.includes('पचास की') || lower.includes('पचास रुपए की')) {
        moneyAmount = 50;
        moneySuffix = 'की';
      } else if (lower.includes('पचास रुपये का') || lower.includes('पचास का') || lower.includes('पचास रुपए का')) {
        moneyAmount = 50;
        moneySuffix = 'का';
      } else if (lower.includes('बीस रुपये की') || lower.includes('बीस की') || lower.includes('बीस रुपए की')) {
        moneyAmount = 20;
        moneySuffix = 'की';
      } else if (lower.includes('बीस रुपये का') || lower.includes('बीस का') || lower.includes('बीस रुपए का')) {
        moneyAmount = 20;
        moneySuffix = 'का';
      } else if (lower.includes('दस रुपये की') || lower.includes('दस की') || lower.includes('दस रुपए की')) {
        moneyAmount = 10;
        moneySuffix = 'की';
      } else if (lower.includes('दस रुपये का') || lower.includes('दस का') || lower.includes('दस रुपए का')) {
        moneyAmount = 10;
        moneySuffix = 'का';
      } else if (lower.includes('सौ रुपये की') || lower.includes('सौ की') || lower.includes('सौ रुपए की')) {
        moneyAmount = 100;
        moneySuffix = 'की';
      } else if (lower.includes('सौ रुपये का') || lower.includes('सौ का') || lower.includes('सौ रुपए का')) {
        moneyAmount = 100;
        moneySuffix = 'का';
      }
    }
  }

  // -------------------------------------------------------------
  // 3. DETECT WEIGHT / QUANTITY / PACKETS (Rule 5: पाव, आधा किलो, 10 पैकेट, आदि)
  // -------------------------------------------------------------
  let count: number | undefined = undefined;
  let multiplier = 1.0;
  let baseUnit = 'piece';
  let unitDisplay: string | undefined = undefined;
  let requestedPortion: string | undefined = undefined;
  let sizeVariant: 'छोटा पैकेट' | 'बड़ा पैकेट' | undefined = undefined;

  // Strict Hierarchy for Paav & Weight Normalization (Rule 7):
  if (
    lower.includes('चार पाव') ||
    lower.includes('4 पाव') ||
    lower.includes('चार पौवा') ||
    lower.includes('char paav')
  ) {
    // 4 पाव = 1 किलो
    count = 1;
    multiplier = 1.0;
    baseUnit = 'kg';
    unitDisplay = '1 किलो';
    requestedPortion = '1 किलो';
  } else if (
    lower.includes('तीन पाव') ||
    lower.includes('3 पाव') ||
    lower.includes('तीन पौवा') ||
    lower.includes('teen paav') ||
    lower.includes('750g') ||
    lower.includes('750 gram') ||
    lower.includes('750 ग्राम') ||
    lower.includes('पौना किलो')
  ) {
    // 3 पाव = 750 ग्राम
    count = 3;
    multiplier = 0.75;
    baseUnit = 'paav';
    unitDisplay = '3 पाव';
    requestedPortion = '3 पाव';
  } else if (
    lower.includes('दो पाव') ||
    lower.includes('2 पाव') ||
    lower.includes('दुई पाव') ||
    lower.includes('दोइ पाव') ||
    lower.includes('दो पौवा') ||
    lower.includes('do paav')
  ) {
    // 2 पाव = 500 ग्राम
    count = 2;
    multiplier = 0.5;
    baseUnit = 'paav';
    unitDisplay = '2 पाव';
    requestedPortion = '2 पाव';
  } else if (
    lower.includes('aadha kilo') ||
    lower.includes('आधा किलो') ||
    lower.includes('आधा kg')
  ) {
    count = 0.5;
    multiplier = 0.5;
    baseUnit = 'kg';
    unitDisplay = '½ किलो';
    requestedPortion = '½ किलो';
  } else if (
    lower.includes('500g') ||
    lower.includes('500 gram') ||
    lower.includes('500 ग्राम')
  ) {
    count = 500;
    multiplier = 0.5;
    baseUnit = 'gram';
    unitDisplay = '500 ग्राम';
    requestedPortion = '500 ग्राम';
  } else if (
    lower.includes('paav') ||
    lower.includes('पाव भर') ||
    lower.includes('पाव किलो') ||
    lower.includes('एक पाव') ||
    lower.includes('1 पाव') ||
    lower.includes('पउवा') ||
    lower.includes('पौवा') ||
    lower.includes('pauwa') ||
    lower.includes('pauva') ||
    /(?:^|[^\p{L}\p{M}\p{N}])पाव(?=[^\p{L}\p{M}\p{N}]|$)/u.test(lower)
  ) {
    // 1 पाव = 0.25 किलो (250 ग्राम)
    count = 0.25;
    multiplier = 0.25;
    baseUnit = 'kg';
    unitDisplay = 'पाव/250 ग्राम';
    requestedPortion = 'पाव/250 ग्राम';
  } else if (
    lower.includes('250g') ||
    lower.includes('250 gram') ||
    lower.includes('250 ग्राम')
  ) {
    count = 250;
    multiplier = 0.25;
    baseUnit = 'gram';
    unitDisplay = '250 ग्राम';
    requestedPortion = '250 ग्राम';
  } else if (
    lower.includes('100g') ||
    lower.includes('100 gram') ||
    lower.includes('100 ग्राम') ||
    lower.includes('सौ ग्राम')
  ) {
    count = 100;
    multiplier = 0.1;
    baseUnit = 'gram';
    unitDisplay = '100 ग्राम';
    requestedPortion = '100 ग्राम';
  } else if (
    lower.includes('200g') ||
    lower.includes('200 gram') ||
    lower.includes('200 ग्राम')
  ) {
    multiplier = 0.2;
    baseUnit = 'kg';
    unitDisplay = '200 ग्राम';
    requestedPortion = '200 ग्राम';
  } else if (
    lower.includes('10kg') ||
    lower.includes('10 किलो') ||
    lower.includes('दस किलो')
  ) {
    count = 10;
    multiplier = 10.0;
    baseUnit = 'kg';
    unitDisplay = '10 किलो';
    requestedPortion = '10 किलो';
  } else if (
    lower.includes('5kg') ||
    lower.includes('5 किलो') ||
    lower.includes('पांच किलो') ||
    lower.includes('पाँच किलो')
  ) {
    count = 5;
    multiplier = 5.0;
    baseUnit = 'kg';
    unitDisplay = '5 किलो';
    requestedPortion = '5 किलो';
  } else if (
    lower.includes('सवा किलो') ||
    lower.includes('sawa kilo') ||
    lower.includes('सवा kg')
  ) {
    count = 1.25;
    multiplier = 1.25;
    baseUnit = 'kg';
    unitDisplay = '1.25 किलो';
    requestedPortion = '1.25 किलो';
  } else if (
    lower.includes('पौन किलो') ||
    lower.includes('पौना किलो') ||
    lower.includes('paun kilo') ||
    lower.includes('pauna kilo')
  ) {
    count = 0.75;
    multiplier = 0.75;
    baseUnit = 'kg';
    unitDisplay = '0.75 किलो';
    requestedPortion = '0.75 किलो';
  } else if (
    lower.includes('3kg') ||
    lower.includes('3 किलो') ||
    lower.includes('तीन किलो')
  ) {
    count = 3;
    multiplier = 3.0;
    baseUnit = 'kg';
    unitDisplay = '3 किलो';
    requestedPortion = '3 किलो';
  } else if (
    lower.includes('2.5kg') ||
    lower.includes('ढाई किलो') ||
    lower.includes('2.5 किलो') ||
    lower.includes('dhai kilo')
  ) {
    count = 2.5;
    multiplier = 2.5;
    baseUnit = 'kg';
    unitDisplay = '2.5 किलो';
    requestedPortion = '2.5 किलो';
  } else if (
    lower.includes('1.5kg') ||
    lower.includes('डेढ़ किलो') ||
    lower.includes('डेढ किलो') ||
    lower.includes('1.5 किलो') ||
    lower.includes('dedh kilo')
  ) {
    count = 1.5;
    multiplier = 1.5;
    baseUnit = 'kg';
    unitDisplay = '1.5 किलो';
    requestedPortion = '1.5 किलो';
  } else if (
    lower.includes('2kg') ||
    lower.includes('2 किलो') ||
    lower.includes('दो किलो') ||
    lower.includes('दुई किलो') ||
    lower.includes('दोइ किलो') ||
    lower.includes('do kilo') ||
    lower.includes('2 kg')
  ) {
    count = 2;
    multiplier = 2.0;
    baseUnit = 'kg';
    unitDisplay = '2 किलो';
    requestedPortion = '2 किलो';
  } else if (
    lower.includes('1kg') ||
    lower.includes('1 kilo') ||
    lower.includes('1 किलो') ||
    lower.includes('एक किलो') ||
    lower.includes('ek kilo') ||
    lower.includes('1 kg')
  ) {
    count = 1;
    multiplier = 1.0;
    baseUnit = 'kg';
    unitDisplay = '1 किलो';
    requestedPortion = '1 किलो';
  } else if (/(?:\b|\s)(\d+(?:\.\d+)?)\s*(?:kilo|kilos|kg|किलो)\b/i.test(lower)) {
    const m = lower.match(/(?:\b|\s)(\d+(?:\.\d+)?)\s*(?:kilo|kilos|kg|किलो)\b/i);
    const val = m ? parseFloat(m[1]) : 1;
    count = val;
    multiplier = val;
    baseUnit = 'kg';
    unitDisplay = `${val} किलो`;
    requestedPortion = `${val} किलो`;
  } else if (
    lower.includes('aadha liter') ||
    lower.includes('aadha litre') ||
    lower.includes('आधा लीटर') ||
    lower.includes('आधा ltr')
  ) {
    count = 0.5;
    multiplier = 0.5;
    baseUnit = 'litre';
    unitDisplay = '½ लीटर';
    requestedPortion = '½ लीटर';
  } else if (
    lower.includes('dedh liter') ||
    lower.includes('dedh litre') ||
    lower.includes('डेढ़ लीटर') ||
    lower.includes('1.5 लीटर') ||
    lower.includes('1.5l') ||
    lower.includes('1.5 liter')
  ) {
    count = 1.5;
    multiplier = 1.5;
    baseUnit = 'litre';
    unitDisplay = '1.5 लीटर';
    requestedPortion = '1.5 लीटर';
  } else if (
    lower.includes('dhai liter') ||
    lower.includes('dhai litre') ||
    lower.includes('ढाई लीटर') ||
    lower.includes('2.5 लीटर') ||
    lower.includes('2.5l') ||
    lower.includes('2.5 liter')
  ) {
    count = 2.5;
    multiplier = 2.5;
    baseUnit = 'litre';
    unitDisplay = '2.5 लीटर';
    requestedPortion = '2.5 लीटर';
  } else if (
    lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+(?:\.\d+)?|एक|दो|दुई|तीन|चार|पांच|पाँच|दस)\s*(?:लीटर|litre|liter|ltr|l)(?=[^\p{L}\p{M}\p{N}]|$)/ui)
  ) {
    const m = lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+(?:\.\d+)?|एक|दो|दुई|तीन|चार|पांच|पाँच|दस)\s*(?:लीटर|litre|liter|ltr|l)(?=[^\p{L}\p{M}\p{N}]|$)/ui);
    const val = m ? parseHindiNumber(m[1]) : 1;
    count = val;
    multiplier = val;
    baseUnit = 'litre';
    unitDisplay = `${val} लीटर`;
    requestedPortion = `${val} लीटर`;
  } else if (
    lower.includes('ek darjan') ||
    lower.includes('1 darjan') ||
    lower.includes('1 dozen') ||
    lower.includes('ek dozen') ||
    lower.includes('एक दर्जन') ||
    lower.includes('1 दर्जन') ||
    lower.includes('दर्जन') ||
    lower.includes('dozen')
  ) {
    let dozenVal = 1;
    const m = lower.match(/(\d+(?:\.\d+)?)\s*(?:darjan|dozen|दर्जन)/i);
    if (m) {
      dozenVal = parseFloat(m[1]);
    } else if (lower.includes('aadha darjan') || lower.includes('आधा दर्जन') || lower.includes('half dozen')) {
      dozenVal = 0.5;
    } else if (lower.includes('do darjan') || lower.includes('दो दर्जन') || lower.includes('दुई दर्जन')) {
      dozenVal = 2;
    } else if (lower.includes('teen darjan') || lower.includes('तीन दर्जन')) {
      dozenVal = 3;
    } else if (lower.includes('chaar darjan') || lower.includes('char darjan') || lower.includes('चार दर्जन')) {
      dozenVal = 4;
    }
    count = dozenVal;
    multiplier = dozenVal;
    baseUnit = 'dozen';
    unitDisplay = dozenVal === 0.5 ? '½ दर्जन' : `${dozenVal} दर्जन`;
    requestedPortion = unitDisplay;
  } else if (
    lower.includes('plate') ||
    lower.includes('plates') ||
    lower.includes('प्लेट') ||
    lower.includes('पलेट') ||
    ((lower.includes('चाउमीन') || lower.includes('छोला') || lower.includes('चाउमिन') || lower.includes('chowmein')) &&
     (lower.includes('हाफ') || lower.includes('half') || lower.includes('haaf') || lower.includes('फुल') || lower.includes('full')))
  ) {
    const halfPlateMatch = lower.match(
      /(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|dui|teen)?\s*(half|haaf|हाफ)\s*(?:plate|plates|प्लेट|पलेट)/i
    );
    const fullPlateMatch = lower.match(
      /(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|dui|teen)?\s*(full|ful|फुल)\s*(?:plate|plates|प्लेट|पलेट)/i
    );
    const stdPlateMatch = lower.match(
      /(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|ek|do|dui|teen)\s*(?:plate|plates|प्लेट|पलेट)/i
    );

    if (halfPlateMatch) {
      const q = halfPlateMatch[1] ? parseHindiNumber(halfPlateMatch[1]) : 1;
      count = q;
      multiplier = q;
      baseUnit = 'plate';
      unitDisplay = q > 1 ? `${q} × ½ प्लेट` : '½ प्लेट';
      requestedPortion = '½ प्लेट';
    } else if (fullPlateMatch) {
      const q = fullPlateMatch[1] ? parseHindiNumber(fullPlateMatch[1]) : 1;
      count = q;
      multiplier = q;
      baseUnit = 'plate';
      unitDisplay = `${q} प्लेट`;
      requestedPortion = '1 प्लेट';
    } else if (stdPlateMatch) {
      const q = parseHindiNumber(stdPlateMatch[1]);
      count = q;
      multiplier = q;
      baseUnit = 'plate';
      unitDisplay = `${q} प्लेट`;
      requestedPortion = `${q} प्लेट`;
    } else {
      count = 1;
      multiplier = 1;
      baseUnit = 'plate';
      unitDisplay = '1 प्लेट';
      requestedPortion = '1 प्लेट';
    }
  } else if (
    lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|ek|do|dui|teen|char|chaar|paanch|panch|das)\s*(?:piece|pieces|pcs|pc|पीस|इकाई)(?=[^\p{L}\p{M}\p{N}]|$)/ui)
  ) {
    const m = lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|ek|do|dui|teen|char|chaar|paanch|panch|das)\s*(?:piece|pieces|pcs|pc|पीस|इकाई)(?=[^\p{L}\p{M}\p{N}]|$)/ui);
    const pc = m ? parseHindiNumber(m[1]) : 1;
    count = pc;
    multiplier = pc;
    baseUnit = 'piece';
    unitDisplay = `${pc} पीस`;
    requestedPortion = `${pc} पीस`;
  } else if (
    lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|ek|do|dui|teen|char|chaar|paanch|panch|das)\s*(?:packet|packets|pkt|pkts|pack|packs|पैकेट|पैक)(?=[^\p{L}\p{M}\p{N}]|$)/ui) ||
    lower.includes('पैकेट') ||
    lower.includes('packet') ||
    lower.includes('packets')
  ) {
    const m = lower.match(/(?:^|[^\p{L}\p{M}\p{N}])(\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|छे|सात|आठ|नौ|दस|बीस|पचास|ek|do|dui|teen|char|chaar|paanch|panch|das)\s*(?:packet|packets|pkt|pkts|pack|packs|पैकेट|पैक)(?=[^\p{L}\p{M}\p{N}]|$)/ui);
    const pktCount = m ? parseHindiNumber(m[1]) : (explicitPacketCountMatch && explicitPacketCountMatch[1] ? parseInt(explicitPacketCountMatch[1], 10) : 1);
    count = pktCount;
    multiplier = pktCount;
    baseUnit = 'packet';
    unitDisplay = `${pktCount} पैकेट`;
    requestedPortion = `${pktCount} पैकेट`;
  } else if (
    /^\s*(\d+)\s+([a-zA-Z\u0900-\u097F]+)/u.test(lower) ||
    /^\s*(ek|do|dui|teen|char|chaar|paanch|panch|chhe|saat|aath|nau|das|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s+([a-zA-Z\u0900-\u097F]+)/u.test(lower)
  ) {
    let leadingNum = 1;
    const numMatch = lower.match(/^\s*(\d+)\s+/);
    if (numMatch) {
      leadingNum = parseInt(numMatch[1], 10);
    } else {
      const wordMatch = lower.match(/^\s*(ek|do|dui|teen|char|chaar|paanch|panch|chhe|saat|aath|nau|das|एक|दो|दुई|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s+/u);
      if (wordMatch) {
        const w = wordMatch[1];
        if (w === 'ek' || w === 'एक') leadingNum = 1;
        else if (w === 'do' || w === 'dui' || w === 'दो' || w === 'दुई') leadingNum = 2;
        else if (w === 'teen' || w === 'तीन') leadingNum = 3;
        else if (w === 'char' || w === 'chaar' || w === 'चार') leadingNum = 4;
        else if (w === 'paanch' || w === 'panch' || w === 'पांच' || w === 'पाँच') leadingNum = 5;
        else if (w === 'chhe' || w === 'छह') leadingNum = 6;
        else if (w === 'saat' || w === 'सात') leadingNum = 7;
        else if (w === 'aath' || w === 'आठ') leadingNum = 8;
        else if (w === 'nau' || w === 'नौ') leadingNum = 9;
        else if (w === 'das' || w === 'दस') leadingNum = 10;
      }
    }
    // If not followed by weight or price words
    if (!lower.match(/^\s*(?:\d+|[a-zA-Z\u0900-\u097F]+)\s*(?:kilo|kg|किलो|gram|gm|g|ग्राम|litre|liter|l|लीटर|darjan|dozen|दर्जन|plate|plates|प्लेट|rupaye|rupees|रुपये|का|की)/i)) {
      count = leadingNum;
      multiplier = leadingNum;
      baseUnit = 'piece';
      unitDisplay = `${leadingNum} पीस`;
      requestedPortion = unitDisplay;
    }
  } else {
    // Check size variant (छोटा पैकेट / बड़ा पैकेट)
    if (
      lower.includes('chota') ||
      lower.includes('छोटा वाला') ||
      lower.includes('छोटा पैकेट') ||
      lower.includes('छोटा पैक') ||
      lower.includes('छोटका')
    ) {
      sizeVariant = 'छोटा पैकेट';
    } else if (
      lower.includes('bada') ||
      lower.includes('बड़ा वाला') ||
      lower.includes('बड़ा पैकेट') ||
      lower.includes('बड़ा पैक') ||
      lower.includes('बड़का')
    ) {
      sizeVariant = 'बड़ा पैकेट';
    }

    if (explicitPacketCountMatch && explicitPacketCountMatch[1]) {
      const parsedNum = parseInt(explicitPacketCountMatch[1], 10);
      count = parsedNum;
      baseUnit = 'packet';
      unitDisplay = `${parsedNum} पैकेट`;
      requestedPortion = sizeVariant ? `${sizeVariant} — ${parsedNum} पैकेट` : `${parsedNum} पैकेट`;
    } else if (sizeVariant) {
      count = 1;
      baseUnit = 'packet';
      unitDisplay = `${sizeVariant} — 1 पैकेट`;
      requestedPortion = `${sizeVariant} — 1 पैकेट`;
    }
  }

  // -------------------------------------------------------------
  // 4. SPOKEN PRODUCT IDENTITY & MASTER CATALOG DATA
  // (Resolved against Master Catalog ID first at start of parsing)
  // -------------------------------------------------------------
  const cleanItemName = productResolution.cleanItemName;
  const brand = productResolution.brand;
  const masterProduct = productResolution.masterProduct;
  const masterCategory = productResolution.masterProduct?.category;
  const isCatalogMatch = productResolution.isCatalogMatch;
  let matchedProductId = productResolution.matchedProductId;
  let matchedProductName = productResolution.matchedProductName;
  let matchedProductImage = productResolution.matchedProductImage;

  let unitPrice: number | undefined = priceVariant || (moneyAmount ? moneyAmount : undefined);
  let isEstimated = !priceVariant && !moneyAmount;

  // Check shop catalog products for auxiliary metadata (price, image, shop-specific ID)
  if (Array.isArray(shopProducts) && shopProducts.length > 0) {
    const catalogMatch = shopProducts.find((p) => {
      const pName = (p.name || '').toLowerCase();
      const pHindi = (p.nameHindi || '').toLowerCase();
      return (pName && lower.includes(pName)) || (pHindi && lower.includes(pHindi));
    });

    if (catalogMatch) {
      matchedProductId = masterProduct?.id || catalogMatch.id;
      matchedProductName = masterProduct?.canonicalNameHindi || masterProduct?.canonicalNameEnglish || catalogMatch.name;
      if (!matchedProductImage && catalogMatch.imageUrl) {
        matchedProductImage = catalogMatch.imageUrl;
      }
      unitPrice = priceVariant || catalogMatch.fractionalConfig?.basePrice || catalogMatch.basePricePerUnit;
      isEstimated = false;
      baseUnit = catalogMatch.baseUnit || baseUnit;
    }
  }

  // -------------------------------------------------------------
  // 6. DETERMINE ITEM TYPE & GENERATE CLEAN DISPLAY TITLE (Rules 2, 3, 4, 9)
  // -------------------------------------------------------------
  let itemType: 'variant' | 'price_variant' | 'money_amount' | 'weight' | 'quantity' | 'general' = 'general';
  let cleanTitle = '';
  const priceVariantDisplay = priceVariant ? `₹${priceVariant} वाला` : undefined;
  const moneyAmountDisplay = moneyAmount ? `₹${moneyAmount} ${moneySuffix}` : undefined;

  let finalQuantity = count || 1;
  let finalUnit = baseUnit;
  let finalWeight: string | undefined = undefined;

  if (priceVariant != null) {
    itemType = 'price_variant';
    const hasExplicitCount = Boolean(explicitPacketCountMatch && explicitPacketCountMatch[1]);
    finalQuantity = count || (hasExplicitCount ? parseInt(explicitPacketCountMatch[1], 10) : 1);
    finalUnit = 'packet';
    if (hasExplicitCount) {
      unitDisplay = `${finalQuantity} पैकेट`;
      cleanTitle = `${cleanItemName} — ₹${priceVariant} वाला — ${finalQuantity} पैकेट`;
    } else {
      unitDisplay = undefined;
      cleanTitle = `${cleanItemName} — ₹${priceVariant} वाला`;
    }
  } else if (sizeVariant) {
    itemType = 'variant';
    finalUnit = 'packet';
    if (count && count > 1) {
      unitDisplay = `${sizeVariant} — ${count} पैकेट`;
      cleanTitle = `${cleanItemName} — ${sizeVariant} — ${count} पैकेट`;
    } else {
      unitDisplay = `${sizeVariant} — 1 पैकेट`;
      cleanTitle = `${cleanItemName} — ${sizeVariant} — 1 पैकेट`;
    }
  } else if (moneyAmount != null) {
    itemType = 'money_amount';
    cleanTitle = `${cleanItemName} — ₹${moneyAmount}`;
    unitDisplay = `₹${moneyAmount}`;
    finalQuantity = 1;
    finalUnit = 'money';
  } else if (unitDisplay) {
    if (unitDisplay.includes('ग्राम') || unitDisplay.includes('किलो') || unitDisplay.includes('लीटर') || unitDisplay.includes('पाव') || unitDisplay.includes('kg') || unitDisplay.includes('g')) {
      itemType = 'weight';
      finalWeight = unitDisplay;
      cleanTitle = `${cleanItemName} — ${unitDisplay}`;
    } else {
      itemType = 'quantity';
      finalQuantity = count || 1;
      cleanTitle = `${cleanItemName} — ${unitDisplay}`;
    }
  } else {
    itemType = 'general';
    cleanTitle = cleanItemName;
    unitDisplay = undefined;
    finalQuantity = 1;
  }

  // Calculate Total Price
  let totalPrice: number | undefined = undefined;
  if (priceVariant != null) {
    totalPrice = priceVariant * finalQuantity;
  } else if (moneyAmount != null) {
    totalPrice = moneyAmount;
  } else if (unitPrice != null && !isEstimated) {
    totalPrice = Math.round(unitPrice * multiplier * finalQuantity);
  }

  const cleanOriginal = removeRepeatedPhrases(
    trimmed
      .replace(/^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|bhai|bhaiya|are|suno)(?=[^\p{L}\p{M}\p{N}]|$)\s*/gui, '')
      .replace(
        /\s*(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|चाहिए|दे देना|होगा|ला दो|ला देना|लगा द्या|डाल द्या|दीजिये|दीजिए|bhejo|bhej do|de do|chahiye|la do)$/gi,
        ''
      )
      .trim()
  );

  return {
    id: `voice_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    cleanTitle,
    originalText: cleanOriginal || trimmed,
    rawItemName: cleanItemName,
    productName: cleanItemName,
    brand,
    variantPrice: priceVariant,
    quantity: finalQuantity,
    unit: finalUnit,
    weight: finalWeight,
    totalPrice,
    rawUtterance: trimmed,
    itemType,
    priceVariant,
    priceVariantDisplay,
    sizeVariant,
    moneyAmount,
    moneyAmountDisplay,
    unitDisplay,
    quantityCount: finalQuantity,
    quantityMultiplier: multiplier,
    baseUnit,
    unitPrice,
    isPriceEstimated: isEstimated,
    matchedProductId: isCatalogMatch ? (matchedProductId || null) : null,
    matchedProductName: isCatalogMatch ? (matchedProductName || cleanItemName) : cleanItemName,
    matchedProductImage,
    isCatalogMatch,
    resolutionStatus: isCatalogMatch ? ('MATCHED' as const) : ('UNMATCHED' as const),
    requiresSellerConfirmation: !isCatalogMatch,
    requestedName: cleanItemName,
    masterProduct,
    masterCategory,
  };
};

/**
 * Deterministically deduplicates parsed shopping items using the canonical product ID
 * (or normalized requested product name for uncataloged items), ensuring exactly ONE row per product
 * exists in the list while preserving quantities, units, and budgets separately.
 */
export const deduplicateParsedKiranaItems = (
  items: ParsedKiranaItem[]
): ParsedKiranaItem[] => {
  if (!items || items.length === 0) return [];

  const result: ParsedKiranaItem[] = [];

  for (const item of items) {
    if (!item) continue;

    // Determine deterministic deduplication key based on canonical product ID
    let dedupKey: string;
    if (item.matchedProductId) {
      // Single Source of Truth: Only one row per canonical product ID in the request
      dedupKey = `canonical:${item.matchedProductId}`;
    } else {
      const normName = (item.requestedName || item.productName || item.rawItemName || '')
        .toLowerCase()
        .replace(/^customer\s*requested:\s*/i, '')
        .trim();
      dedupKey = `unmatched:${normName}`;
    }

    const existingIndex = result.findIndex((existing) => {
      let exKey: string;
      if (existing.matchedProductId) {
        exKey = `canonical:${existing.matchedProductId}`;
      } else {
        const normName = (existing.requestedName || existing.productName || existing.rawItemName || '')
          .toLowerCase()
          .replace(/^customer\s*requested:\s*/i, '')
          .trim();
        exKey = `unmatched:${normName}`;
      }
      return exKey === dedupKey;
    });

    if (existingIndex === -1) {
      result.push({ ...item });
    } else {
      const existing = result[existingIndex];
      // Deterministically merge into exactly ONE row
      const isMoneyExisting = existing.itemType === 'money_amount' || existing.unit === 'money';
      const isMoneyItem = item.itemType === 'money_amount' || item.unit === 'money';

      let mergedQuantity = existing.quantity;
      let mergedCount = existing.quantityCount;
      let mergedUnit = existing.unit;
      let mergedUnitDisplay = existing.unitDisplay;
      let mergedMoneyAmount = existing.moneyAmount;
      let mergedTotalPrice = existing.totalPrice;
      let mergedItemType = existing.itemType;
      let mergedWeight = existing.weight;

      if (isMoneyExisting || isMoneyItem) {
        mergedItemType = 'money_amount';
        mergedUnit = 'money';
        mergedMoneyAmount = item.moneyAmount || existing.moneyAmount || item.totalPrice || existing.totalPrice || 50;
        mergedTotalPrice = mergedMoneyAmount;
        mergedQuantity = 1;
        mergedCount = 1;
        mergedUnitDisplay = `₹${mergedMoneyAmount}`;
      } else if (existing.itemType === 'weight' && item.itemType === 'weight') {
        const exMult = existing.quantityMultiplier || 1;
        const itMult = item.quantityMultiplier || 1;
        const totalMult = exMult + itMult;
        mergedQuantity = totalMult;
        if (totalMult >= 1) {
          mergedUnitDisplay = totalMult % 1 === 0 ? `${totalMult} किलो` : `${totalMult} किलो`;
        } else {
          mergedUnitDisplay = `${Math.round(totalMult * 1000)} ग्राम`;
        }
        mergedWeight = mergedUnitDisplay;
        if (existing.unitPrice != null) {
          mergedTotalPrice = Math.round(existing.unitPrice * totalMult);
        }
      } else if (existing.unit && item.unit && existing.unit === item.unit) {
        mergedQuantity = (existing.quantity || 1) + (item.quantity || 1);
        mergedCount = (existing.quantityCount || existing.quantity || 1) + (item.quantityCount || item.quantity || 1);
        if (existing.unit === 'packet' || existing.unit === 'पैकेट') {
          mergedUnitDisplay = `${mergedQuantity} पैकेट`;
        } else if (existing.unit === 'piece' || existing.unit === 'pieces' || existing.unit === 'पीस') {
          mergedUnitDisplay = `${mergedQuantity} पीस`;
        } else if (existing.unit === 'plate' || existing.unit === 'प्लेट') {
          mergedUnitDisplay = `${mergedQuantity} प्लेट`;
        } else if (existing.unit === 'kg' || existing.unit === 'किलो') {
          mergedUnitDisplay = mergedQuantity === 0.5 ? '½ किलो' : `${mergedQuantity} किलो`;
        } else {
          mergedUnitDisplay = `${mergedQuantity} ${existing.unit}`;
        }
        const effectivePrice = existing.priceVariant || existing.unitPrice;
        if (effectivePrice != null) {
          mergedTotalPrice = Math.round(effectivePrice * mergedQuantity);
        }
      } else {
        if (item.unit && item.unit !== 'piece' && (!existing.unit || existing.unit === 'piece')) {
          mergedQuantity = item.quantity;
          mergedCount = item.quantityCount;
          mergedUnit = item.unit;
          mergedUnitDisplay = item.unitDisplay;
          mergedTotalPrice = item.totalPrice;
          mergedWeight = item.weight;
          mergedItemType = item.itemType;
        }
      }

      const mergedPriceVariant = item.priceVariant != null ? item.priceVariant : existing.priceVariant;
      const mergedPriceVariantDisplay = mergedPriceVariant ? `₹${mergedPriceVariant} वाला` : existing.priceVariantDisplay;

      let updatedTitle = existing.productName;
      if (mergedPriceVariantDisplay) {
        updatedTitle = `${existing.productName} — ${mergedPriceVariantDisplay}${mergedUnitDisplay ? ` — ${mergedUnitDisplay}` : ''}`;
      } else if (mergedItemType === 'money_amount' && mergedMoneyAmount) {
        updatedTitle = `${existing.productName} — ₹${mergedMoneyAmount}`;
      } else if (mergedUnitDisplay) {
        updatedTitle = `${existing.productName} — ${mergedUnitDisplay}`;
      }

      result[existingIndex] = {
        ...existing,
        cleanTitle: updatedTitle,
        itemType: mergedItemType,
        quantity: mergedQuantity,
        quantityCount: mergedCount,
        unit: mergedUnit,
        unitDisplay: mergedUnitDisplay,
        weight: mergedWeight,
        moneyAmount: mergedMoneyAmount,
        priceVariant: mergedPriceVariant,
        priceVariantDisplay: mergedPriceVariantDisplay,
        variantPrice: mergedPriceVariant,
        totalPrice: mergedTotalPrice,
      };
    }
  }

  return result;
};

/**
 * Complete Voice Shopping parser that:
 * 1. Segments customer utterance into discrete shopping phrases
 * 2. Resolves each product against the Master Catalog ID first
 * 3. Extracts quantity, unit, price variant, and budget separately
 * 4. Deterministically deduplicates by canonical product ID so exactly one row per product exists
 */
export const parseVoiceShoppingUtterance = (
  rawUtterance: string,
  shopProducts: Product[] = []
): ParsedKiranaItem[] => {
  const segments = segmentUtterance(rawUtterance);
  const items: ParsedKiranaItem[] = [];

  for (const seg of segments) {
    const parsed = parseVoiceShoppingSlipItem(seg, shopProducts);
    if (parsed) {
      items.push(parsed);
    }
  }

  return deduplicateParsedKiranaItems(items);
};

/**
 * Helper: Map product keywords to representative emoji icons
 */
export const getProductEmoji = (name: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('चाउमिन') || lower.includes('चाउमीन') || lower.includes('चाऊमीन') || lower.includes('chowmein') || lower.includes('noodles')) return '🍜';
  if (lower.includes('छोला') || lower.includes('छोले') || lower.includes('chhola') || lower.includes('chola') || lower.includes('chole')) return '🥣';
  if (lower.includes('मंचूरियन') || lower.includes('manchurian')) return '🍢';
  if (lower.includes('टिकिया') || lower.includes('tikiya') || lower.includes('tikki')) return '🍽️';
  if (lower.includes('समोसा') || lower.includes('samosa')) return '🥟';
  if (lower.includes('अनार') || lower.includes('anar') || lower.includes('pomegranate')) return '🍎';
  if (lower.includes('केला') || lower.includes('kela') || lower.includes('banana')) return '🍌';
  if (lower.includes('आलू') || lower.includes('आलु') || lower.includes('aloo') || lower.includes('potato')) return '🥔';
  if (lower.includes('प्याज') || lower.includes('प्यास') || lower.includes('pyaz') || lower.includes('onion')) return '🧅';
  if (lower.includes('धनिया') || lower.includes('dhaniya') || lower.includes('coriander') || lower.includes('kothmir')) return '🌿';
  if (lower.includes('टमाटर') || lower.includes('tamatar') || lower.includes('tomato')) return '🍅';
  if (lower.includes('santoor') || lower.includes('संतूर')) return '🧼';
  if (lower.includes('sabun') || lower.includes('साबुन') || lower.includes('soap')) return '🧼';
  if (lower.includes('shampoo') || lower.includes('शैंपू') || lower.includes('शाम्पू')) return '🧴';
  if (lower.includes('cheeni') || lower.includes('चीनी') || lower.includes('sugar') || lower.includes('शक्कर')) return '🍚';
  if (lower.includes('atta') || lower.includes('aata') || lower.includes('आटा') || lower.includes('flour')) return '🌾';
  if (lower.includes('gud') || lower.includes('gur') || lower.includes('गुड़') || lower.includes('jaggery')) return '🍯';
  if (lower.includes('oil') || lower.includes('tel') || lower.includes('तेल') || lower.includes('सरसों') || lower.includes('mustard')) return '🛢️';
  if (lower.includes('masala') || lower.includes('मसाला') || lower.includes('rajesh') || lower.includes('राजेश')) return '🌶️';
  if (lower.includes('nirma') || lower.includes('निरमा') || lower.includes('surf') || lower.includes('सर्फ') || lower.includes('detergent')) return '🧺';
  if (lower.includes('moongfali') || lower.includes('मूंगफली') || lower.includes('peanut')) return '🥜';
  if (lower.includes('हल्दी') || lower.includes('turmeric')) return '🟡';
  if (lower.includes('जरा') || lower.includes('जीरा') || lower.includes('jeera')) return '🌿';
  if (lower.includes('tea') || lower.includes('chai') || lower.includes('चाय')) return '☕';
  if (lower.includes('salt') || lower.includes('namak') || lower.includes('नमक')) return '🧂';
  if (lower.includes('daal') || lower.includes('dal') || lower.includes('दाल')) return '🍲';
  if (lower.includes('rice') || lower.includes('chawal') || lower.includes('चावल')) return '🍚';
  if (lower.includes('biscuit') || lower.includes('बिस्कुट')) return '🍪';
  if (lower.includes('toothpaste') || lower.includes('colgate') || lower.includes('टूथपेस्ट') || lower.includes('मंजन')) return '🪥';
  return '📦';
};

/**
 * Accurately segments compound or multi-item utterances into discrete shopping clauses.
 * Handles explicit conjunctions as well as multi-product sentences without conjunctions
 * (e.g. "1 kilo aloo 1 kilo pyaz ek darjan kela") without breaking product phrases like
 * "₹10 ka Hari Patti Dhaniya".
 */
export const segmentUtterance = (raw: string): string[] => {
  let normalized = (raw || '').trim();
  if (!normalized) return [];

  normalized = normalized.replace(/(?:^|[^\p{L}\p{M}\p{N}])[\u4e00一—–-](?=\s*(?:किलो|kg|kilo|लीटर|दर्जन|पैकेट|ग्राम|पीस|प्लेट|[a-zA-Z\u0900-\u097F]+))/gui, ' एक ');
  const trimmed = normalized.trim();
  if (!trimmed) return [];

  const conjClauses = trimmed
    .split(/(?:\s+(?:और|तथा|एवं|aur|and|tatha|also|bhi|va|evam|saath\s*me|saath\s*mein)\s+|[,\n\r\t;।]+|\s+भी\s+)/i)
    .map((c) => c.trim())
    .filter((c) => c.length >= 2);

  const baseClauses = conjClauses.length > 0 ? conjClauses : [trimmed];
  const finalSegments: string[] = [];

  const starterRegex = /(?:(?:^|[^\p{L}\p{M}\p{N}])(?:\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|darjan|dozen|दर्जन|plate|plates|प्लेट|packet|packets|पैकेट|पैक|piece|pieces|pcs|पीस|नग|litre|liter|ltr|लीटर|bottle|bottles|बोतल|box|boxes|डिब्बा)|(?:^|[^\p{L}\p{M}\p{N}])(?:\d+|ek|do|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच)\s*(?:half|full|हाफ|फुल)\s*(?:plate|plates|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो|darjan|dozen|दर्जन|litre|लीटर|plate|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:dedh|dhai|डेढ़|ढाई|सवा|पौन)\s*(?:kilo|kg|किलो)|(?:^|[^\p{L}\p{M}\p{N}])(?:half|full|हाफ|फुल)\s*(?:plate|plates|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:(?:ek|एक)\s+)?(?:paav|pao|पाव)|(?:(?:₹|rs\.?|रुपये?|रु)\s*\d+|\d+\s*(?:रुपये?|rupaye?|rs|rupees?))\s*(?:ka|ki|ke|वाला|वाली|वाले)?|(?:^|[^\p{L}\p{M}\p{N}])(?:\d+|ek|do|dui|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच)\s*(?:piece|pieces|pcs|पीस)?\s+[a-zA-Z\u0900-\u097F]+)/gui;

  for (const clause of baseClauses) {
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

      // STRICT RULES:
      // 1. If preceding segment has no product noun yet, keep accumulating
      if (!hasProductNoun(prevSegment)) {
        continue;
      }

      // 2. If preceding segment ended in a price variant (₹5 वाला) and following is a packet count (10 पैकेट), DO NOT CUT!
      const prevHasPriceVariant = /(?:₹\s*\d+|\d+\s*रुपये?|दस|पांच|पाँच|बीस|पचास|\d+)\s*(?:वाला|वाली|वाले|wala|wali|wale)$/i.test(prevSegment);
      const followingIsCountOnly = isOnlyQuantityOrFiller(followingText) || /^(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|pcs)\s*$/i.test(followingText);
      if (prevHasPriceVariant && followingIsCountOnly) {
        continue;
      }

      // 3. If following text has NO product noun at all, it cannot be an independent item!
      if (!hasProductNoun(followingText)) {
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

  return finalSegments.filter((s) => s.length >= 2);
};

