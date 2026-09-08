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
  matchedProductId?: string;
  matchedProductName?: string;
  matchedProductImage?: string;
  isCatalogMatch: boolean;
  masterProduct?: KiranaMasterProduct;
  masterCategory?: string;
}

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
  let stripped = (text || '').toLowerCase().trim();

  // Strip opening fillers
  stripped = stripped.replace(
    /^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|सुनिये|सुनिए|यार|देखो|दिखाओ|bhai|bhaiya|are|suno)\s*/gi,
    ''
  );

  // Strip closing completion verbs & fillers
  stripped = stripped.replace(
    /\s*(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|चाहिए|मुझे चाहिए|मुझे|दे देना|होगा|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|ले आना|दीजिये|दीजिए|bhejo|bhej do|de do|chahiye|la do|बस|देखो|दिखाओ)$/gi,
    ''
  );

  // Strip numbers (Hindi words and digits)
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{N}])(एक|दो|दुई|दोइ|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|बीस|पचास|सवा|डेढ़|ढाई|आधा|पाव|पौना|सौ|sau|so|ek|do|teen|chaar|paanch|aadha|paav)(?=[^\p{L}\p{N}]|$)/gui,
    ' '
  );
  stripped = stripped.replace(/\b\d+(\.\d+)?\b/g, ' ');

  // Strip packaging & unit words with Unicode boundary support
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{N}])(किलो|ग्राम|kg|g|gm|packet|packets|पैकेट|पैक|पैट|लीटर|litre|l|बोतल|डिब्बा|डब्बा|pack|पैकेटों|पीस|piece|टुकड़ा|वाला|वाली|वाले|छोटा|बड़ा|छोटका|बड़का|chota|bada|wala|wali)(?=[^\p{L}\p{N}]|$)/gui,
    ' '
  );

  // Strip money currency, prepositions & conjunctions with Unicode boundary protection
  // (Prevents stripping "का" from "काजू" or "की" from "किशमिश")
  stripped = stripped.replace(
    /(?:^|[^\p{L}\p{N}])(₹|रुपये?|रु\.?|रुपइया|rupaye?|rs\.?|ka|ki|ke|का|की|के|बाय|मुझे|mujhe|aur|और)(?=[^\p{L}\p{N}]|$)/gui,
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
    /\d+\s*(?:packet|packets|पैकेट|पैक|पैट|पीस|piece|pieces|किलो|kg|ग्राम|g|gm|लीटर|l|litre|बोतल|डिब्बा|डब्बा)/i.test(lower) ||
    /(?:^|[^\p{L}\p{N}])(?:दस|नौ|आठ|सात|छह|पांच|पाँच|चार|तीन|दो|दुई|दोइ|एक)\s*(?:packet|packets|पैकेट|पैक|पैट|पीस|piece|pieces|किलो|kg|ग्राम|लीटर|बोतल|डिब्बा|डब्बा)/ui.test(lower) ||
    /(?:आधा किलो|aadha kilo|एक पाव|पाव भर|पाव किलो|पाव|पउवा|पौवा|paav|pauwa|pauva|पौना किलो|डेढ़ किलो|डेढ किलो|ढाई किलो|सवा किलो|सौ ग्राम|sau gram|100 ग्राम|250 ग्राम|500 ग्राम|1 किलो|2 किलो|दो किलो|दुई किलो)/i.test(lower) ||
    /(?:छोटा वाला|बड़ा वाला|छोटा पैकेट|बड़ा पैकेट|छोटा पैक|बड़ा पैक|छोटका|बड़का)/i.test(lower) ||
    /(?:मसाला|साबुन|शैंपू|शाम्पू|चीनी|आटा|निरमा|बिस्कुट|काजू|सूजी|मैदा|बादाम)\s+(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)/i.test(lower) ||
    /(?:^|[^\p{L}\p{N}])(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)\s*(?:पैकेट|पैकेटों|पैक|पैट|पीस|piece|टुकड़ा|किलो|ग्राम|gm|kg|लीटर)(?=[^\p{L}\p{N}]|$)/ui.test(lower)
  );
};

/**
 * Check if speech has an explicit completion verb or closing marker
 */
export const hasCompletionVerb = (text: string): boolean => {
  const lower = (text || '').toLowerCase();
  return (
    /(?:^|[^\p{L}\p{N}])(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|दे देना|चाहिए|मुझे चाहिए|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|दीजिये|दीजिए|बस|bhejo|bhej do|de do|chahiye|la do)(?=[^\p{L}\p{N}]|$)/ui.test(
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
    /(?:^|[^\p{L}\p{N}])(?:दस|पांच|पाँच|बीस|पचास|सौ)\s*(?:वाला|वाली|वाले)/ui.test(lower) ||
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

/**
 * Parse a single customer spoken clause into a normalized Kirana shopping-list item.
 * Adheres strictly to the Single Source of Truth rules:
 * - NO "1 इकाई" invented.
 * - Exact product names preserved.
 * - Standard Kirana slip formatting:
 *     [PRODUCT NAME] — [PRICE VARIANT] — [QUANTITY]
 *     [PRODUCT NAME] — [MONEY AMOUNT]
 *     [PRODUCT NAME] — [WEIGHT]
 *     [PRODUCT NAME] — [QUANTITY]
 */
export const parseVoiceShoppingSlipItem = (
  clause: string,
  shopProducts: Product[] = []
): ParsedKiranaItem | null => {
  const deRepeated = removeRepeatedPhrases(clause);
  const trimmed = deRepeated.trim();
  if (trimmed.length < 2) return null;
  if (isOnlyQuantityOrFiller(trimmed)) return null;

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
    (/(?:शैंपू|शाम्पू|साबुन|मसाला|santoor|बिस्कुट)\s+(?:दस|10)\b/i.test(lower) ||
    /(?:^|[^\p{L}\p{N}])(?:दस|10)\s*(?:दे दा|देइ दा|दे दो|चाहिए)$/ui.test(lower)
      ? [null, '10']
      : null) ||
    (/(?:मसाला|साबुन|शैंपू|शाम्पू|बिस्कुट)\s+(?:दो|दुई|2)\b/i.test(lower) ||
    /(?:^|[^\p{L}\p{N}])(?:दो|दुई|2)\s*(?:दे दो|दे दा|चाहिए)?$/ui.test(lower)
      ? [null, '2']
      : null) ||
    (/(?:मसाला|साबुन|शैंपू|शाम्पू|बिस्कुट)\s+(?:एक|1)\b/i.test(lower) ||
    /(?:^|[^\p{L}\p{N}])(?:एक|1)\s*(?:दे दो|दे दा|चाहिए)?$/ui.test(lower)
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
    multiplier = 0.75;
    baseUnit = 'kg';
    unitDisplay = '750 ग्राम';
    requestedPortion = '750 ग्राम';
  } else if (
    lower.includes('दो पाव') ||
    lower.includes('2 पाव') ||
    lower.includes('दुई पाव') ||
    lower.includes('दोइ पाव') ||
    lower.includes('दो पौवा') ||
    lower.includes('do paav')
  ) {
    // 2 पाव = 500 ग्राम
    multiplier = 0.5;
    baseUnit = 'kg';
    unitDisplay = '500 ग्राम';
    requestedPortion = '500 ग्राम';
  } else if (
    lower.includes('500g') ||
    lower.includes('500 gram') ||
    lower.includes('500 ग्राम') ||
    lower.includes('aadha kilo') ||
    lower.includes('आधा किलो') ||
    lower.includes('आधा kg')
  ) {
    multiplier = 0.5;
    baseUnit = 'kg';
    unitDisplay = '500 ग्राम';
    requestedPortion = '500 ग्राम';
  } else if (
    lower.includes('250g') ||
    lower.includes('250 gram') ||
    lower.includes('250 ग्राम') ||
    lower.includes('paav') ||
    lower.includes('पाव भर') ||
    lower.includes('पाव किलो') ||
    lower.includes('एक पाव') ||
    lower.includes('1 पाव') ||
    lower.includes('पउवा') ||
    lower.includes('पौवा') ||
    lower.includes('pauwa') ||
    lower.includes('pauva') ||
    /(?:^|[^\p{L}\p{N}])पाव(?=[^\p{L}\p{N}]|$)/u.test(lower)
  ) {
    // 1 पाव = 250 ग्राम
    multiplier = 0.25;
    baseUnit = 'kg';
    unitDisplay = '250 ग्राम';
    requestedPortion = '250 ग्राम';
  } else if (
    lower.includes('100g') ||
    lower.includes('100 gram') ||
    lower.includes('100 ग्राम') ||
    lower.includes('सौ ग्राम')
  ) {
    multiplier = 0.1;
    baseUnit = 'kg';
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
    count = 1;
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
    count = 1;
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
  // 4. EXTRACT SPOKEN PRODUCT IDENTITY & BRAND (Rules 1, 2, 6, 9)
  // -------------------------------------------------------------
  // Clean raw utterance to isolate the spoken product name without mutating or genericizing
  let s = trimmed;
  // Opening greetings/fillers
  s = s.replace(/^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|सुनिये|सुनिए|यार|देखो|दिखाओ|bhai|bhaiya|bhai sahab|are|suno)\s*/gi, '');
  // Closing verbs/fillers
  s = s.replace(/\s*(दे दो|दे दा|देइ दा|देइ द्या|दे द्या|चाहिए|मुझे चाहिए|मुझे|दे देना|होगा|ला दो|ला देना|लगा दो|लगा द्या|डाल दो|डाल द्या|पैक कर दो|पैक कर द्या|ले आना|दीजिये|दीजिए|bhejo|bhej do|de do|chahiye|la do|बस|देखो|दिखाओ)$/gi, '');
  // Price variant phrases (any position)
  s = s.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*\d+\s*(?:का|की|के)\s*(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)?\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/gi, ' ');
  s = s.replace(/(?:₹|रुपये?|रु\.?|रुपइया|rs\.?|rs)?\s*\d+\s*(?:रुपये?|रु\.?|रुपइया|rs\.?|rs|rupaye|rupayee|rupees)?\s*(?:वाला|वाली|वाले|wala|wali|wale)/gi, ' ');
  s = s.replace(/(?:दस|पांच|पाँच|बीस|पचास|दो|दुई|एक|das|paanch|panch|chaar|teen)\s*(?:रुपइया|रुपये?|रुपए|rupaye)?\s*(?:वाला|वाली|वाले|wala|wali|wale)/gi, ' ');
  // Quantities / packet counts (any position)
  s = s.replace(/\b\d+\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|इकाई)\b/gi, ' ');
  s = s.replace(/(?:दस|पांच|पाँच|चार|तीन|दो|दुई|एक|das|paanch|panch|chaar|teen|do|dui|ek)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces)/gi, ' ');
  // Weights
  s = s.replace(/\b\d+(\.\d+)?\s*(?:किलो|ग्राम|kg|g|gm|लीटर|litre|l)\b/gi, '');
  s = s.replace(/(?:चार|तीन|दो|दुई|दोइ|एक)?\s*(?:पाव|पौवा|पउवा|paav|pauwa)(?:\s*भर|\s*किलो)?/gi, '');
  s = s.replace(/(?:आधा|डेढ़|ढाई|पौना|एक|दो|तीन|चार|पांच|दस)\s*(?:किलो|ग्राम)/gi, '');
  // Money amounts
  s = s.replace(/(?:₹|रुपये?|रु\.?|रुपइया)?\s*\d+\s*(?:का|की|के|ka|ki|ke)/gi, '');
  s = s.replace(/(?:दस|बीस|पचास|सौ)\s*(?:रुपये?|रुपइया)?\s*(?:का|की|के)/gi, '');
  // Leftover units
  s = s.replace(/(?:^|[^\p{L}\p{N}])(packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|ग्राम|किलो|kg|g|gm|लीटर|litre|l)(?=[^\p{L}\p{N}]|$)/gui, ' ');
  // Leftover numbers
  s = s.replace(/\b\d+(\.\d+)?\b/g, '');
  s = s.replace(/[,।\.\-\+\/\s]+/g, ' ').trim();

  let productName = s;
  let brand: string | undefined = undefined;

  // 4B. MATCH AGAINST CENTRAL KIRANA PRODUCT MASTER
  const masterMatch = matchKiranaMasterProduct(s) || matchKiranaMasterProduct(trimmed);
  let masterProduct: KiranaMasterProduct | undefined = masterMatch?.product;
  let masterCategory: string | undefined = masterMatch?.product.category;

  if (masterMatch) {
    const mp = masterMatch.product;
    if (mp.brand) {
      brand = mp.brand;
    }
    if (mp.canonicalNameHindi) {
      productName = mp.canonicalNameHindi;
    } else if (mp.canonicalNameEnglish) {
      productName = mp.canonicalNameEnglish;
    }
  } else {
    // Colloquial Awadhi & common rural grocery normalization for unmatched products:
    const pLower = (productName || '').toLowerCase();
    if (pLower === 'राजेश मसाला' || pLower === 'राजेश मीट मसाला' || (pLower.includes('राजेश') && (pLower.includes('मीट') || pLower.includes('मसाला')))) {
      productName = 'Rajesh मीट मसाला';
      brand = 'Rajesh';
    } else if (pLower === 'संतूर' || pLower === 'संतूर साबुन' || pLower === 'santoor' || pLower === 'santoor sabun') {
      productName = 'Santoor साबुन';
      brand = 'Santoor';
    } else if (pLower === 'सुजी') {
      productName = 'सूजी';
    } else if (pLower === 'जरा') {
      productName = 'जरा';
    } else if (pLower === 'हल्दी') {
      productName = 'हल्दी पाउडर';
    }
  }

  // Detect brand if not already detected from master catalog
  if (!brand) {
    for (const b of RECOGNIZED_KIRANA_BRANDS) {
      for (const alias of b.aliases) {
        const reg = new RegExp(`(?:^|[\\s,।\\.\\-])${alias}(?:$|[\\s,।\\.\\-])`, 'i');
        if (reg.test(lower) || reg.test(trimmed)) {
          brand = b.name;
          break;
        }
      }
      if (brand) break;
    }
  }

  // ALWAYS treat Brand + Product type as ONE product entity
  if (brand) {
    const bLower = brand.toLowerCase();
    const pLower = productName.toLowerCase();
    const matchedBrandObj = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name.toLowerCase() === bLower);
    const hasBrandInProduct = pLower.includes(bLower) || (matchedBrandObj && productName.includes(matchedBrandObj.hindiName));

    if (!hasBrandInProduct) {
      const spokenHindiBrand = matchedBrandObj?.aliases.find((a) => lower.includes(a) && /[\u0900-\u097F]/.test(a));
      const brandPrefix = spokenHindiBrand ? matchedBrandObj?.hindiName || brand : brand;
      productName = `${brandPrefix} ${productName}`;
    }
  }

  // Fallback if product name was empty
  if (!productName || productName.trim().length < 2) {
    productName = trimmed;
  }

  const cleanItemName = productName;

  // -------------------------------------------------------------
  // 5. CATALOG MATCHING (Rule 10: Secondary to spoken product identity)
  // -------------------------------------------------------------
  let matchedProductId: string | undefined = masterMatch?.product.id;
  let matchedProductName: string | undefined = masterMatch?.product.canonicalNameHindi || masterMatch?.product.canonicalNameEnglish;
  let matchedProductImage: string | undefined = undefined;
  let unitPrice: number | undefined = priceVariant || (moneyAmount ? moneyAmount : undefined);
  let isCatalogMatch = Boolean(masterMatch);
  let isEstimated = !priceVariant && !moneyAmount;

  // Check shop catalog products for auxiliary metadata (price, image, shop-specific ID)
  const catalogMatch = shopProducts.find((p) => {
    const pName = (p.name || '').toLowerCase();
    const pHindi = (p.nameHindi || '').toLowerCase();
    return (pName && lower.includes(pName)) || (pHindi && lower.includes(pHindi));
  });

  if (catalogMatch) {
    matchedProductId = catalogMatch.id;
    matchedProductName = catalogMatch.name;
    matchedProductImage = catalogMatch.imageUrl;
    unitPrice = priceVariant || catalogMatch.fractionalConfig?.basePrice || catalogMatch.basePricePerUnit;
    isCatalogMatch = true;
    isEstimated = false;
    baseUnit = catalogMatch.baseUnit || baseUnit;
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
    cleanTitle = `${cleanItemName} — ${moneyAmountDisplay}`;
    unitDisplay = undefined;
    finalQuantity = 1;
    finalUnit = 'money';
  } else if (unitDisplay) {
    if (unitDisplay.includes('ग्राम') || unitDisplay.includes('किलो') || unitDisplay.includes('लीटर')) {
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
      .replace(/^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|bhai|bhaiya|are|suno)\s*/gi, '')
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
    matchedProductId,
    matchedProductName: matchedProductName || cleanItemName,
    matchedProductImage,
    isCatalogMatch,
    masterProduct,
    masterCategory,
  };
};

/**
 * Helper: Map product keywords to representative emoji icons
 */
export const getProductEmoji = (name: string): string => {
  const lower = (name || '').toLowerCase();
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
