import { Shop } from '../../../types/market.ts';

/**
 * Normalizes text for voice matching
 */
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common Hindi-to-English phonetic / transliteration map for local market search
 */
const TRANSLITERATION_MAP: Record<string, string> = {
  'मनीष': 'manish',
  'कृष्णा': 'krishna',
  'कृष्ण': 'krishna',
  'गुप्ता': 'gupta',
  'पटेल': 'patel',
  'शर्मा': 'sharma',
  'जाधव': 'jadhav',
  'देशमुख': 'deshmukh',
  'गोकुल': 'gokul',
  'गणेश': 'ganesh',
  'महालक्ष्मी': 'mahalaxmi',
  'लक्ष्मी': 'laxmi',
  'संजीवनी': 'sanjeevani',
  'दादर': 'dadar',
  'बांद्रा': 'bandra',
  'वस्त्र': 'vastra',
  'संगम': 'sangam',
  'हार्वेस्ट': 'harvest',
  'गोल्डन': 'golden',
  'मॉडर्न': 'modern',
  'किराना': 'kirana',
  'स्टोर': 'store',
  'दुकान': 'shop',
  'डेयरी': 'dairy',
  'मिठाई': 'sweets',
  'बेकरी': 'bakery',
  'केमिस्ट': 'chemist',
  'हार्डवेयर': 'hardware',
  'पाली': 'pali',
  'हिल': 'hill',
  'सेंट्रल': 'central',
  'मंडी': 'mandi',
};

/**
 * Distinctive keywords associated with specific shops or seller families
 */
const DISTINCTIVE_SELLER_NAMES = new Set([
  'manish', 'मनीष', 'mehta', 'मेहता',
  'krishna', 'कृष्णा', 'कृष्ण',
  'gupta', 'गुप्ता',
  'patel', 'पटेल',
  'sharma', 'शर्मा',
  'jadhav', 'जाधव',
  'deshmukh', 'देशमुख',
  'malhotra', 'मल्होत्रा',
  'gokul', 'गोकुल',
  'ganesh', 'गणेश',
  'mahalaxmi', 'महालक्ष्मी', 'laxmi', 'lakshmi', 'लक्ष्मी',
  'sanjeevani', 'संजीवनी',
  'bandra', 'बांद्रा',
  'dadar', 'दादर',
  'vastra', 'वस्त्र',
  'sangam', 'संगम',
  'harvest', 'हार्वेस्ट',
  'golden', 'गोल्डन',
  'modern', 'मॉडर्न',
  'pali', 'पाली',
]);

/**
 * Shop specialty types
 */
const SPECIALTY_KEYWORDS = new Set([
  'sweets', 'mithai', 'मिठाई', 'पेड़ा',
  'dairy', 'दूध', 'पनीर', 'मक्खन',
  'bakery', 'बेकरी', 'bread', 'पाव', 'cakes', 'bakes',
  'chemist', 'pharmacy', 'दवा', 'दवाई',
  'electricals', 'electronics', 'मोबाइल', 'इलेक्ट्रिकल',
  'hardware', 'टूल्स', 'हार्डवेयर',
  'handloom', 'cotton', 'कपड़े', 'साड़ी',
  'farm', 'produce', 'vegetables', 'veggies', 'सब्जी', 'भाजी',
  'supermarket', 'superstore', 'depot', 'mandi',
  'general', 'daily', 'needs', 'किराना', 'kirana', 'grocers', 'grocery'
]);

/**
 * Stopwords to ignore in voice queries
 */
const STOP_WORDS = new Set([
  'open', 'show', 'go', 'to', 'chalo', 'le', 'kholo', 'dikhaye', 'dekho',
  'par', 'ki', 'ka', 'ke', 'ko', 'se', 'me', 'mein', 'hai', 'aur', 'and', 'the',
  'store', 'shop', 'dukan', 'dukaan', 'दुकान', 'स्टोर', 'खोलें', 'खोलो', 'दुकानदार'
]);

/**
 * Expands a token with its phonetic/transliterated equivalents (Hindi <-> English)
 */
function getEquivalentTokens(token: string): string[] {
  const norm = normalizeText(token);
  const results = [norm];
  if (TRANSLITERATION_MAP[norm]) {
    results.push(TRANSLITERATION_MAP[norm]);
  }
  for (const [hi, en] of Object.entries(TRANSLITERATION_MAP)) {
    if (en === norm && !results.includes(hi)) {
      results.push(hi);
    }
  }
  return results;
}

/**
 * Robust helper to match a spoken transcript to a seller or shop name with multi-token scoring.
 * Prevents misrouting to incorrect or empty shops.
 */
export function findMatchingShop(spokenText: string, availableShops: Shop[]): Shop | null {
  if (!spokenText || !availableShops || availableShops.length === 0) return null;

  const rawClean = normalizeText(spokenText);
  if (!rawClean) return null;

  // Filter out leading intent commands and trailing words
  const strippedSpoken = rawClean
    .replace(/^(open|show|go to|chalo|le chalo|kholo|dikhaye|dekho|दुकान|खोलें|खोलो|पर चलो|दुकानदार)\s+/i, '')
    .replace(/\s+(store|shop|dukaan|dukan|ki dukaan|ki dukan|दुकान|स्टोर|मंडी)$/i, '')
    .trim();

  const queryTokens = (strippedSpoken || rawClean)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  if (queryTokens.length === 0) return null;

  // Check if query mentions a distinctive seller name
  const distinctiveInQuery = queryTokens.some((t) => {
    const equivalents = getEquivalentTokens(t);
    return equivalents.some((eq) => DISTINCTIVE_SELLER_NAMES.has(eq));
  });

  let bestShop: Shop | null = null;
  let highestScore = 0;

  for (const shop of availableShops) {
    if (!shop || !shop.name) continue;

    const sNameNorm = normalizeText(shop.name);
    const sHindiNorm = (shop as any).nameHindi ? normalizeText((shop as any).nameHindi) : '';
    const sTaglineNorm = shop.tagline ? normalizeText(shop.tagline) : '';

    const shopTokens = `${sNameNorm} ${sHindiNorm}`
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

    // Also include transliterated equivalents of shop tokens
    const expandedShopTokens = new Set<string>();
    for (const st of shopTokens) {
      for (const eq of getEquivalentTokens(st)) {
        expandedShopTokens.add(eq);
      }
    }

    let score = 0;

    // 1. Exact full name match
    if (
      sNameNorm === rawClean ||
      sNameNorm === strippedSpoken ||
      sHindiNorm === rawClean ||
      sHindiNorm === strippedSpoken
    ) {
      score += 1000;
    }

    // 2. Substring match
    if (
      rawClean.includes(sNameNorm) ||
      strippedSpoken.includes(sNameNorm) ||
      (sHindiNorm && (rawClean.includes(sHindiNorm) || strippedSpoken.includes(sHindiNorm)))
    ) {
      score += 500;
    } else if (
      (sNameNorm.includes(strippedSpoken) && strippedSpoken.length >= 4) ||
      (sHindiNorm && sHindiNorm.includes(strippedSpoken) && strippedSpoken.length >= 4)
    ) {
      score += 400;
    }

    // 3. Token-level analysis
    let totalMatchedTokens = 0;
    let matchedDistinctive = false;

    for (const qToken of queryTokens) {
      const eqTokens = getEquivalentTokens(qToken);
      const isDistinctive = eqTokens.some((t) => DISTINCTIVE_SELLER_NAMES.has(t));
      const isSpecialty = eqTokens.some((t) => SPECIALTY_KEYWORDS.has(t));

      const hasExactToken = eqTokens.some((t) => expandedShopTokens.has(t));
      const hasFuzzyToken =
        !hasExactToken &&
        Array.from(expandedShopTokens).some((st) =>
          eqTokens.some((t) => st.includes(t) || t.includes(st))
        );

      if (hasExactToken) {
        totalMatchedTokens++;
        if (isDistinctive) {
          score += 180;
          matchedDistinctive = true;
        } else if (isSpecialty) {
          score += 65;
        } else {
          score += 40;
        }
      } else if (hasFuzzyToken) {
        totalMatchedTokens += 0.5;
        if (isDistinctive) {
          score += 100;
          matchedDistinctive = true;
        } else {
          score += 30;
        }
      }
    }

    // If query has a distinctive seller name but this shop does not match it, reject this shop
    if (distinctiveInQuery && !matchedDistinctive) {
      continue;
    }

    // 4. Specialty contradiction penalties
    for (const qToken of queryTokens) {
      const eqTokens = getEquivalentTokens(qToken);
      if (eqTokens.some((t) => ['general', 'kirana', 'grocers', 'grocery'].includes(t))) {
        if (
          sNameNorm.includes('sweets') ||
          sNameNorm.includes('mithai') ||
          sNameNorm.includes('bakery') ||
          sNameNorm.includes('chemist')
        ) {
          score -= 120;
        }
      }
      if (eqTokens.some((t) => ['sweets', 'mithai', 'peda'].includes(t))) {
        if (
          sNameNorm.includes('hardware') ||
          sNameNorm.includes('electricals') ||
          sNameNorm.includes('chemist')
        ) {
          score -= 120;
        }
      }
      if (eqTokens.some((t) => ['dairy', 'doodh', 'milk'].includes(t))) {
        if (
          sNameNorm.includes('hardware') ||
          sNameNorm.includes('electricals') ||
          sNameNorm.includes('chemist') ||
          sNameNorm.includes('bakery')
        ) {
          score -= 120;
        }
      }
    }

    // 5. Complete token match bonus
    if (queryTokens.length > 1 && totalMatchedTokens >= queryTokens.length) {
      score += 120;
    }

    if ((shop as any).isVerified || shop.verifiedAt) score += 5;
    if (shop.isActive) score += 5;

    if (score > highestScore && score >= 40) {
      highestScore = score;
      bestShop = shop;
    }
  }

  return bestShop;
}
