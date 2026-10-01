/**
 * Kirana & General Store Master Product Catalog
 * Single Source of Truth for Indian Kirana Store Products.
 * Reusable by Voice Shopping Assistant, search, catalog matching, and inventory.
 */

import { EXTENDED_KIRANA_CATALOG } from './extendedCatalog';
import { INDIAN_MARKET_CATALOG } from './indianMarketCatalog';

export interface KiranaMasterProduct {
  id: string;
  category: string;
  subcategory: string;
  canonicalNameHindi: string;
  canonicalNameEnglish: string;
  brand?: string;
  searchableAliases: string[];
  brandAliases?: string[];
  commonSpokenNames: string[];
  awadhiHindiAliases: string[];
  defaultUnits: string[];
  supportedUnits: string[];
  supportsWeight: boolean;
  supportsPieceQuantity: boolean;
  supportsPriceVariant: boolean;
  isActive: boolean;
}

export const KIRANA_CATEGORIES = [
  'अनाज / चावल / आटा',
  'दाल / बीन्स / चना',
  'तेल / घी',
  'नमक / चीनी / गुड़',
  'मसाले / साबुत मसाले / मसाला पैक',
  'ड्राई फ्रूट / मेवा / बीज',
  'चाय / कॉफी / पेय',
  'बिस्कुट',
  'नमकीन / चिप्स / स्नैक्स',
  'चॉकलेट / टॉफी / कैंडी',
  'नूडल्स / पास्ता / इंस्टेंट फूड',
  'सॉस / केचप / अचार / जैम',
  'डेयरी',
  'ब्रेड / बेकरी',
  'साबुन / शैंपू / पर्सनल केयर',
  'टूथपेस्ट / टूथब्रश / ओरल केयर',
  'हेयर ऑयल / क्रीम / कॉस्मेटिक्स',
  'डिटर्जेंट / कपड़े धोने का सामान',
  'बर्तन साफ करने का सामान',
  'फर्श / टॉयलेट / घर की सफाई',
  'पेपर / टिश्यू / डिस्पोजेबल',
  'पूजा सामग्री',
  'बेबी केयर',
  'स्टेशनरी',
  'घरेलू / किचन उपयोगी सामान',
  'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
  'अन्य सामान्य किराना / जनरल स्टोर सामान',
] as const;

export const MASTER_KIRANA_CATALOG: KiranaMasterProduct[] = [
  // =========================================================================
  // 1. अनाज / चावल / आटा (Grains, Rice & Flour)
  // =========================================================================
  {
    id: 'prod_suji',
    category: 'अनाज / चावल / आटा',
    subcategory: 'रवा / सूजी',
    canonicalNameHindi: 'सूजी',
    canonicalNameEnglish: 'Suji / Semolina',
    searchableAliases: ['सूजी', 'सुजी', 'रवा', 'suji', 'sooji', 'sooji rava', 'rawa', 'semolina'],
    commonSpokenNames: ['सूजी', 'सुजी', 'रवा', 'sooji', 'suji'],
    awadhiHindiAliases: ['सुजी', 'रवा'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_maida',
    category: 'अनाज / चावल / आटा',
    subcategory: 'मैदा',
    canonicalNameHindi: 'मैदा',
    canonicalNameEnglish: 'Maida / Refined Flour',
    searchableAliases: ['मैदा', 'maida', 'refined flour', 'white flour', 'मैदा आटा'],
    commonSpokenNames: ['मैदा', 'maida'],
    awadhiHindiAliases: ['मैदा'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_atta',
    category: 'अनाज / चावल / आटा',
    subcategory: 'गेहूं का आटा',
    canonicalNameHindi: 'गेहूं का आटा',
    canonicalNameEnglish: 'Wheat Atta / Flour',
    searchableAliases: ['आटा', 'गेहूं का आटा', 'गेहूँ का आटा', 'चक्की आटा', 'चक्की फ्रेश आटा', 'atta', 'aata', 'gehu atta', 'wheat flour'],
    commonSpokenNames: ['आटा', 'गेहूं का आटा', 'atta', 'aata'],
    awadhiHindiAliases: ['आटा', 'पिसान'],
    defaultUnits: ['kg', 'packet'],
    supportedUnits: ['kg', 'packet'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_aashirvaad_atta',
    category: 'अनाज / चावल / आटा',
    subcategory: 'ब्रांडेड आटा',
    canonicalNameHindi: 'आशीर्वाद आटा',
    canonicalNameEnglish: 'Aashirvaad Atta',
    brand: 'Aashirvaad',
    brandAliases: ['aashirvaad', 'आशीर्वाद', 'ashirwad'],
    searchableAliases: ['आशीर्वाद आटा', 'aashirvaad atta', 'ashirwad atta', 'aashirvad aata'],
    commonSpokenNames: ['आशीर्वाद आटा', 'aashirvaad atta'],
    awadhiHindiAliases: ['आशीर्वाद आटा'],
    defaultUnits: ['kg', 'packet'],
    supportedUnits: ['kg', 'packet'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_chawal',
    category: 'अनाज / चावल / आटा',
    subcategory: 'चावल',
    canonicalNameHindi: 'चावल',
    canonicalNameEnglish: 'Rice',
    searchableAliases: ['चावल', 'सादा चावल', 'सामान्य चावल', 'rice', 'chawal', 'plain rice', 'bhaat'],
    commonSpokenNames: ['चावल', 'chawal', 'rice'],
    awadhiHindiAliases: ['चाउर', 'चावल', 'अछत'],
    defaultUnits: ['kg', 'packet'],
    supportedUnits: ['kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_basmati_rice',
    category: 'अनाज / चावल / आटा',
    subcategory: 'बासमती चावल',
    canonicalNameHindi: 'बासमती चावल',
    canonicalNameEnglish: 'Basmati Rice',
    searchableAliases: ['बासमती चावल', 'बासमती', 'basmati rice', 'basmati chawal', 'biryani rice'],
    commonSpokenNames: ['बासमती चावल', 'basmati rice'],
    awadhiHindiAliases: ['बासमती चावल', 'बासमती'],
    defaultUnits: ['kg', 'packet'],
    supportedUnits: ['kg', 'packet'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_besan',
    category: 'अनाज / चावल / आटा',
    subcategory: 'बेसन',
    canonicalNameHindi: 'बेसन',
    canonicalNameEnglish: 'Besan / Gram Flour',
    searchableAliases: ['बेसन', 'चना बेसन', 'besan', 'gram flour', 'chana besan'],
    commonSpokenNames: ['बेसन', 'besan'],
    awadhiHindiAliases: ['बेसन'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_sattu',
    category: 'अनाज / चावल / आटा',
    subcategory: 'सत्तू',
    canonicalNameHindi: 'सत्तू',
    canonicalNameEnglish: 'Sattu / Roasted Gram Flour',
    searchableAliases: ['सत्तू', 'चना सत्तू', 'जौ सत्तू', 'sattu', 'chana sattu'],
    commonSpokenNames: ['सत्तू', 'sattu'],
    awadhiHindiAliases: ['सत्तू', 'सतुआ'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_poha',
    category: 'अनाज / चावल / आटा',
    subcategory: 'पोहा / चूड़ा',
    canonicalNameHindi: 'पोहा / चूड़ा',
    canonicalNameEnglish: 'Poha / Flattened Rice',
    searchableAliases: ['पोहा', 'चूड़ा', 'चिउड़ा', 'चिवड़ा', 'poha', 'chuda', 'chiwda', 'flattened rice'],
    commonSpokenNames: ['पोहा', 'चूड़ा', 'poha'],
    awadhiHindiAliases: ['चूड़ा', 'चिउड़ा'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_daliya',
    category: 'अनाज / चावल / आटा',
    subcategory: 'दलिया',
    canonicalNameHindi: 'दलिया',
    canonicalNameEnglish: 'Daliya / Broken Wheat',
    searchableAliases: ['दलिया', 'गेहूं दलिया', 'daliya', 'broken wheat', 'dalia'],
    commonSpokenNames: ['दलिया', 'daliya'],
    awadhiHindiAliases: ['दलिया'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_sabudana',
    category: 'अनाज / चावल / आटा',
    subcategory: 'साबूदाना',
    canonicalNameHindi: 'साबूदाना',
    canonicalNameEnglish: 'Sabudana / Tapioca Sago',
    searchableAliases: ['साबूदाना', 'सबुदाना', 'sabudana', 'sago'],
    commonSpokenNames: ['साबूदाना', 'sabudana'],
    awadhiHindiAliases: ['सबुदाना', 'साबूदाना'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 2. दाल / बीन्स / चना (Pulses, Dals, Beans & Chana)
  // =========================================================================
  {
    id: 'prod_chana_dal',
    category: 'दाल / बीन्स / चना',
    subcategory: 'चना दाल',
    canonicalNameHindi: 'चना दाल',
    canonicalNameEnglish: 'Chana Dal / Split Bengal Gram',
    searchableAliases: ['चना दाल', 'चनादाल', 'चने की दाल', 'चना की दाल', 'chana dal', 'chana daal', 'chane ki dal'],
    commonSpokenNames: ['चना दाल', 'chana dal', 'चने की दाल'],
    awadhiHindiAliases: ['चना दाल', 'चना के दाल'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_arhar_dal',
    category: 'दाल / बीन्स / चना',
    subcategory: 'अरहर / तुअर दाल',
    canonicalNameHindi: 'अरहर दाल',
    canonicalNameEnglish: 'Arhar Dal / Toor Dal',
    searchableAliases: ['अरहर दाल', 'तुअर दाल', 'तूर दाल', 'अरहर की दाल', 'arhar dal', 'toor dal', 'tuar dal', 'arhar daal'],
    commonSpokenNames: ['अरहर दाल', 'तुअर दाल', 'arhar dal'],
    awadhiHindiAliases: ['रहरी दाल', 'रहरी के दाल', 'अरहर दाल'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_moong_dal',
    category: 'दाल / बीन्स / चना',
    subcategory: 'मूंग दाल',
    canonicalNameHindi: 'मूंग दाल',
    canonicalNameEnglish: 'Moong Dal',
    searchableAliases: ['मूंग दाल', 'धुली मूंग', 'मूंग की दाल', 'moong dal', 'mung dal', 'moong daal', 'dhuli moong'],
    commonSpokenNames: ['मूंग दाल', 'moong dal'],
    awadhiHindiAliases: ['मूंग दाल', 'मूंग के दाल'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_masoor_dal',
    category: 'दाल / बीन्स / चना',
    subcategory: 'मसूर दाल',
    canonicalNameHindi: 'मसूर दाल',
    canonicalNameEnglish: 'Masoor Dal / Red Lentil',
    searchableAliases: ['मसूर दाल', 'मलका मसूर', 'मसूर की दाल', 'masoor dal', 'red lentil', 'masoor daal'],
    commonSpokenNames: ['मसूर दाल', 'masoor dal'],
    awadhiHindiAliases: ['मसूरी दाल', 'मसूर दाल'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_urad_dal',
    category: 'दाल / बीन्स / चना',
    subcategory: 'उड़द दाल',
    canonicalNameHindi: 'उड़द दाल',
    canonicalNameEnglish: 'Urad Dal / Black Gram',
    searchableAliases: ['उड़द दाल', 'धुली उड़द', 'उड़द की दाल', 'urad dal', 'urad daal', 'dhuli urad'],
    commonSpokenNames: ['उड़द दाल', 'urad dal'],
    awadhiHindiAliases: ['उरिदी दाल', 'उरद दाल'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_rajma',
    category: 'दाल / बीन्स / चना',
    subcategory: 'राजमा',
    canonicalNameHindi: 'राजमा',
    canonicalNameEnglish: 'Rajma / Kidney Beans',
    searchableAliases: ['राजमा', 'चित्रा राजमा', 'लाल राजमा', 'rajma', 'kidney beans'],
    commonSpokenNames: ['राजमा', 'rajma'],
    awadhiHindiAliases: ['राजमा'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kabuli_chana',
    category: 'दाल / बीन्स / चना',
    subcategory: 'काबुली चना / छोले',
    canonicalNameHindi: 'काबुली चना / छोले',
    canonicalNameEnglish: 'Kabuli Chana / Chickpeas',
    searchableAliases: ['काबुली चना', 'सफेद चना', 'छोले', 'छोला चना', 'kabuli chana', 'chole', 'white chana', 'chickpeas'],
    commonSpokenNames: ['काबुली चना', 'छोले', 'kabuli chana'],
    awadhiHindiAliases: ['काबुली चना', 'बड़का चना'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kala_chana',
    category: 'दाल / बीन्स / चना',
    subcategory: 'काला चना',
    canonicalNameHindi: 'काला चना',
    canonicalNameEnglish: 'Kala Chana / Brown Chickpeas',
    searchableAliases: ['काला चना', 'देशी चना', 'छोटा चना', 'kala chana', 'desi chana', 'black chana'],
    commonSpokenNames: ['काला चना', 'देशी चना', 'kala chana'],
    awadhiHindiAliases: ['चना', 'काला चना', 'छोटका चना'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_soyabean_badi',
    category: 'दाल / बीन्स / चना',
    subcategory: 'सोयाबीन बड़ी',
    canonicalNameHindi: 'सोयाबीन बड़ी',
    canonicalNameEnglish: 'Soyabean Badi / Soya Chunks',
    searchableAliases: ['सोयाबीन बड़ी', 'सोयाबीन', 'सोया चंक्स', 'न्यूट्रेला', 'soyabean badi', 'soya chunks', 'nutrela', 'soya badi'],
    commonSpokenNames: ['सोयाबीन बड़ी', 'सोयाबीन', 'nutrela'],
    awadhiHindiAliases: ['सोयाबीन बड़ी', 'सोयाबीन'],
    defaultUnits: ['packet', 'gram', 'kg'],
    supportedUnits: ['packet', 'gram', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 3. तेल / घी (Oils & Ghee)
  // =========================================================================
  {
    id: 'prod_sarson_tel',
    category: 'तेल / घी',
    subcategory: 'सरसों तेल',
    canonicalNameHindi: 'सरसों तेल',
    canonicalNameEnglish: 'Mustard Oil / Sarson Tel',
    searchableAliases: ['सरसों तेल', 'सरसों का तेल', 'कड़वा तेल', 'सरसो तेल', 'mustard oil', 'sarson tel', 'sarson ka tel', 'kadwa tel'],
    commonSpokenNames: ['सरसों तेल', 'कड़वा तेल', 'mustard oil'],
    awadhiHindiAliases: ['कड़वा तेल', 'सरसो तेल', 'करुवा तेल'],
    defaultUnits: ['litre', 'packet', 'बोतल'],
    supportedUnits: ['litre', 'packet', 'बोतल', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_fortune_oil',
    category: 'तेल / घी',
    subcategory: 'ब्रांडेड तेल',
    canonicalNameHindi: 'फॉर्च्यून तेल',
    canonicalNameEnglish: 'Fortune Oil',
    brand: 'Fortune',
    brandAliases: ['fortune', 'फॉर्च्यून', 'फार्च्यून'],
    searchableAliases: ['फॉर्च्यून तेल', 'फॉर्च्यून रिफाइंड', 'फॉर्च्यून सरसों तेल', 'fortune oil', 'fortune refined'],
    commonSpokenNames: ['फॉर्च्यून तेल', 'fortune oil'],
    awadhiHindiAliases: ['फॉर्च्यून तेल'],
    defaultUnits: ['litre', 'packet', 'बोतल'],
    supportedUnits: ['litre', 'packet', 'बोतल'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_refined_oil',
    category: 'तेल / घी',
    subcategory: 'रिफाइंड तेल',
    canonicalNameHindi: 'रिफाइंड तेल',
    canonicalNameEnglish: 'Refined Cooking Oil',
    searchableAliases: ['रिफाइंड तेल', 'रिफाइंड', 'सोयाबीन तेल', 'refined oil', 'soyabean oil', 'cooking oil'],
    commonSpokenNames: ['रिफाइंड तेल', 'रिफाइंड', 'refined oil'],
    awadhiHindiAliases: ['रिफाइन', 'रिफाइंड तेल'],
    defaultUnits: ['litre', 'packet', 'बोतल'],
    supportedUnits: ['litre', 'packet', 'बोतल'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_desi_ghee',
    category: 'तेल / घी',
    subcategory: 'देशी घी',
    canonicalNameHindi: 'देशी घी',
    canonicalNameEnglish: 'Desi Ghee / Clarified Butter',
    searchableAliases: ['देशी घी', 'घी', 'शुद्ध घी', 'desi ghee', 'ghee', 'pure ghee', 'amul ghee'],
    commonSpokenNames: ['देशी घी', 'घी', 'ghee'],
    awadhiHindiAliases: ['घी', 'घियु', 'देशी घी'],
    defaultUnits: ['kg', 'gram', 'packet', 'डिब्बा'],
    supportedUnits: ['kg', 'gram', 'packet', 'डिब्बा', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_dalda',
    category: 'तेल / घी',
    subcategory: 'वनस्पति घी',
    canonicalNameHindi: 'डालडा / वनस्पति',
    canonicalNameEnglish: 'Dalda / Vanaspati Ghee',
    searchableAliases: ['डालडा', 'वनस्पति', 'dalda', 'vanaspati'],
    commonSpokenNames: ['डालडा', 'dalda'],
    awadhiHindiAliases: ['डालडा'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 4. नमक / चीनी / गुड़ (Salt, Sugar & Jaggery)
  // =========================================================================
  {
    id: 'prod_tata_namak',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'नमक',
    canonicalNameHindi: 'टाटा नमक',
    canonicalNameEnglish: 'Tata Salt',
    brand: 'Tata',
    brandAliases: ['tata', 'टाटा'],
    searchableAliases: ['टाटा नमक', 'tata namak', 'tata salt'],
    commonSpokenNames: ['टाटा नमक', 'tata namak', 'tata salt'],
    awadhiHindiAliases: ['टाटा नमक'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_namak',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'सादा नमक',
    canonicalNameHindi: 'नमक',
    canonicalNameEnglish: 'Salt / Table Salt',
    searchableAliases: ['नमक', 'सादा नमक', 'salt', 'namak', 'safed namak'],
    commonSpokenNames: ['नमक', 'salt', 'namak'],
    awadhiHindiAliases: ['नोन', 'नमक'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kala_namak',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'सेंधा / काला नमक',
    canonicalNameHindi: 'काला नमक',
    canonicalNameEnglish: 'Black Salt / Kala Namak',
    searchableAliases: ['काला नमक', 'सेंधा नमक', 'व्रत वाला नमक', 'kala namak', 'sendha namak', 'black salt'],
    commonSpokenNames: ['काला नमक', 'सेंधा नमक'],
    awadhiHindiAliases: ['काला नोन', 'सेंधा नोन'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_chini',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'चीनी / शक्कर',
    canonicalNameHindi: 'चीनी',
    canonicalNameEnglish: 'Sugar / Chini',
    searchableAliases: ['चीनी', 'शक्कर', 'sugar', 'chini', 'shakkar'],
    commonSpokenNames: ['चीनी', 'sugar', 'chini'],
    awadhiHindiAliases: ['चीनी', 'चीनि'],
    defaultUnits: ['kg', 'gram'],
    supportedUnits: ['kg', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_gud',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'गुड़',
    canonicalNameHindi: 'गुड़',
    canonicalNameEnglish: 'Jaggery / Gud',
    searchableAliases: ['गुड़', 'देशी गुड़', 'भेली', 'jaggery', 'gud', 'desi gud', 'bheli'],
    commonSpokenNames: ['गुड़', 'gud', 'देशी गुड़'],
    awadhiHindiAliases: ['गुड़', 'भेली', 'गुर'],
    defaultUnits: ['kg', 'gram'],
    supportedUnits: ['kg', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_honey',
    category: 'नमक / चीनी / गुड़',
    subcategory: 'शहद',
    canonicalNameHindi: 'डाबर शहद',
    canonicalNameEnglish: 'Dabar Honey',
    brand: 'Dabur',
    brandAliases: ['dabur', 'डाबर'],
    searchableAliases: ['शहद', 'डाबर शहद', 'honey', 'shahad', 'dabur honey'],
    commonSpokenNames: ['शहद', 'डाबर शहद', 'honey'],
    awadhiHindiAliases: ['शहद', 'महुरी'],
    defaultUnits: ['बोतल', 'gram'],
    supportedUnits: ['बोतल', 'gram'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 5. मसाले / साबुत मसाले / मसाला पैक (Spices & Blends)
  // =========================================================================
  {
    id: 'prod_haldi_powder',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'हल्दी',
    canonicalNameHindi: 'हल्दी पाउडर',
    canonicalNameEnglish: 'Turmeric Powder / Haldi',
    searchableAliases: ['हल्दी', 'हल्दी पाउडर', 'पिसी हल्दी', 'turmeric powder', 'haldi', 'haldi powder', 'turmeric'],
    commonSpokenNames: ['हल्दी पाउडर', 'हल्दी', 'haldi powder'],
    awadhiHindiAliases: ['हल्दी', 'हरदी'],
    defaultUnits: ['gram', 'packet', 'kg'],
    supportedUnits: ['gram', 'packet', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_mirch_powder',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'लाल मिर्च',
    canonicalNameHindi: 'लाल मिर्च पाउडर',
    canonicalNameEnglish: 'Red Chilli Powder',
    searchableAliases: ['लाल मिर्च', 'लाल मिर्च पाउडर', 'मिर्च पाउडर', 'मिर्चा पाउडर', 'red chilli powder', 'mirchi powder', 'lal mirch'],
    commonSpokenNames: ['लाल मिर्च पाउडर', 'लाल मिर्च', 'mirchi powder'],
    awadhiHindiAliases: ['लाल मिर्चा', 'मिर्चा पाउडर'],
    defaultUnits: ['gram', 'packet', 'kg'],
    supportedUnits: ['gram', 'packet', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_dhaniya_powder',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'धनिया',
    canonicalNameHindi: 'धनिया पाउडर',
    canonicalNameEnglish: 'Coriander Powder / Dhaniya',
    searchableAliases: ['धनिया पाउडर', 'पिसा धनिया', 'धनिया', 'coriander powder', 'dhaniya powder'],
    commonSpokenNames: ['धनिया पाउडर', 'धनिया', 'dhaniya powder'],
    awadhiHindiAliases: ['धनिया पाउडर', 'धनिया'],
    defaultUnits: ['gram', 'packet', 'kg'],
    supportedUnits: ['gram', 'packet', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_jeera',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'जीरा',
    canonicalNameHindi: 'जीरा',
    canonicalNameEnglish: 'Cumin Seeds / Jeera',
    searchableAliases: ['जीरा', 'जरा', 'साबुत जीरा', 'जीरा साबुत', 'jeera', 'cumin', 'cumin seeds', 'jira', 'zira'],
    commonSpokenNames: ['जीरा', 'जरा', 'jeera'],
    awadhiHindiAliases: ['जरा', 'जीरा'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_hing',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'हींग',
    canonicalNameHindi: 'हींग',
    canonicalNameEnglish: 'Asafoetida / Hing',
    searchableAliases: ['हींग', 'कैच हींग', 'एमडीएच हींग', 'hing', 'heeng', 'asafoetida'],
    commonSpokenNames: ['हींग', 'hing'],
    awadhiHindiAliases: ['हींग'],
    defaultUnits: ['डिब्बी', 'packet', 'gram'],
    supportedUnits: ['डिब्बी', 'packet', 'gram'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_ajwain',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'अजवाइन',
    canonicalNameHindi: 'अजवाइन',
    canonicalNameEnglish: 'Carom Seeds / Ajwain',
    searchableAliases: ['अजवाइन', 'अजवायन', 'ajwain', 'carom seeds'],
    commonSpokenNames: ['अजवाइन', 'ajwain'],
    awadhiHindiAliases: ['अजवाइन'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_saunf',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'सौंफ',
    canonicalNameHindi: 'सौंफ',
    canonicalNameEnglish: 'Fennel Seeds / Saunf',
    searchableAliases: ['सौंफ', 'सॉफ', 'saunf', 'fennel seeds'],
    commonSpokenNames: ['सौंफ', 'saunf'],
    awadhiHindiAliases: ['सौंफ', 'सॉफ'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_methi_dana',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'मेथी दाना',
    canonicalNameHindi: 'मेथी दाना',
    canonicalNameEnglish: 'Fenugreek Seeds / Methi',
    searchableAliases: ['मेथी दाना', 'मेथी', 'methi dana', 'fenugreek seeds'],
    commonSpokenNames: ['मेथी दाना', 'मेथी'],
    awadhiHindiAliases: ['मेथी'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kali_mirch',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'काली मिर्च',
    canonicalNameHindi: 'काली मिर्च',
    canonicalNameEnglish: 'Black Pepper / Kali Mirch',
    searchableAliases: ['काली मिर्च', 'गोल मिर्च', 'काली मिर्च पाउडर', 'kali mirch', 'black pepper', 'gol mirch'],
    commonSpokenNames: ['काली मिर्च', 'kali mirch'],
    awadhiHindiAliases: ['काली मिर्च', 'गोल मिर्च'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_elaichi',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'इलायची',
    canonicalNameHindi: 'हरी इलायची',
    canonicalNameEnglish: 'Green Cardamom / Elaichi',
    searchableAliases: ['इलायची', 'हरी इलायची', 'छोटी इलायची', 'elaichi', 'green cardamom', 'chhoti elaichi'],
    commonSpokenNames: ['इलायची', 'हरी इलायची', 'elaichi'],
    awadhiHindiAliases: ['इलायची'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_laung',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'लौंग',
    canonicalNameHindi: 'लौंग',
    canonicalNameEnglish: 'Cloves / Laung',
    searchableAliases: ['लौंग', 'लौंग साबुत', 'laung', 'clove', 'cloves', 'long'],
    commonSpokenNames: ['लौंग', 'laung'],
    awadhiHindiAliases: ['लौंग'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_dalchini',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'दालचीनी',
    canonicalNameHindi: 'दालचीनी',
    canonicalNameEnglish: 'Cinnamon / Dalchini',
    searchableAliases: ['दालचीनी', 'दाल चीनी', 'dalchini', 'cinnamon'],
    commonSpokenNames: ['दालचीनी', 'dalchini'],
    awadhiHindiAliases: ['दालचीनी'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_tejpatta',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'तेजपत्ता',
    canonicalNameHindi: 'तेज पत्ता',
    canonicalNameEnglish: 'Bay Leaf / Tejpatta',
    searchableAliases: ['तेज पत्ता', 'तेजपत्ता', 'tejpatta', 'bay leaf'],
    commonSpokenNames: ['तेज पत्ता', 'tejpatta'],
    awadhiHindiAliases: ['तेज पत्ता'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_garam_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'गरम मसाला',
    canonicalNameHindi: 'गरम मसाला',
    canonicalNameEnglish: 'Garam Masala',
    searchableAliases: ['गरम मसाला', 'पिसा गरम मसाला', 'garam masala'],
    commonSpokenNames: ['गरम मसाला', 'garam masala'],
    awadhiHindiAliases: ['गरम मसाला'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_rajesh_meat_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'ब्रांडेड मसाला',
    canonicalNameHindi: 'राजेश मीट मसाला',
    canonicalNameEnglish: 'Rajesh Meat Masala',
    brand: 'Rajesh',
    brandAliases: ['rajesh', 'राजेश'],
    searchableAliases: ['राजेश मीट मसाला', 'rajesh meat masala', 'rajesh meet masala'],
    commonSpokenNames: ['राजेश मीट मसाला', 'rajesh meat masala'],
    awadhiHindiAliases: ['राजेश मीट मसाला'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_rajesh_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'ब्रांडेड मसाला',
    canonicalNameHindi: 'राजेश मसाला',
    canonicalNameEnglish: 'Rajesh Masala',
    brand: 'Rajesh',
    brandAliases: ['rajesh', 'राजेश'],
    searchableAliases: ['राजेश मसाला', 'rajesh masala', 'राजेश का मसाला', 'rajesh ka masala'],
    commonSpokenNames: ['राजेश मसाला', 'rajesh masala'],
    awadhiHindiAliases: ['राजेश मसाला'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_mdh_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'ब्रांडेड मसाला',
    canonicalNameHindi: 'MDH मसाला',
    canonicalNameEnglish: 'MDH Masala',
    brand: 'MDH',
    searchableAliases: ['एमडीएच मसाला', 'mdh masala', 'mdh garam masala', 'mdh degi mirch'],
    commonSpokenNames: ['एमडीएच मसाला', 'mdh masala'],
    awadhiHindiAliases: ['एमडीएच मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_everest_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'ब्रांडेड मसाला',
    canonicalNameHindi: 'एवरेस्ट मसाला',
    canonicalNameEnglish: 'Everest Masala',
    brand: 'Everest',
    searchableAliases: ['एवरेस्ट मसाला', 'एवरेस्ट गरम मसाला', 'एवरेस्ट चिकन मसाला', 'everest masala'],
    commonSpokenNames: ['एवरेस्ट मसाला', 'everest masala'],
    awadhiHindiAliases: ['एवरेस्ट मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_catch_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'ब्रांडेड मसाला',
    canonicalNameHindi: 'कैच मसाला',
    canonicalNameEnglish: 'Catch Masala',
    brand: 'Catch',
    searchableAliases: ['कैच मसाला', 'कैच चाट मसाला', 'catch masala', 'catch chat masala'],
    commonSpokenNames: ['कैच मसाला', 'catch masala'],
    awadhiHindiAliases: ['कैच मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_sabji_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'सब्जी मसाला',
    canonicalNameHindi: 'सब्जी मसाला',
    canonicalNameEnglish: 'Sabji Masala',
    searchableAliases: ['सब्जी मसाला', 'सब्जी का मसाला', 'sabji masala', 'vegetable masala', 'sabzi masala', 'sabjee masala'],
    commonSpokenNames: ['सब्जी मसाला', 'sabji masala'],
    awadhiHindiAliases: ['सब्जी मसाला', 'तरकारी मसाला'],
    defaultUnits: ['packet', 'gram'],
    supportedUnits: ['packet', 'gram'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_chana_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'चना मसाला',
    canonicalNameHindi: 'चना मसाला',
    canonicalNameEnglish: 'Chana Masala',
    searchableAliases: ['चना मसाला', 'छोले मसाला', 'chana masala', 'chole masala', 'chhole masala', 'chana masala packet'],
    commonSpokenNames: ['चना मसाला', 'chana masala', 'छोले मसाला'],
    awadhiHindiAliases: ['चना मसाला', 'छोला मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_meat_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'मीट मसाला',
    canonicalNameHindi: 'मीट मसाला',
    canonicalNameEnglish: 'Meat Masala',
    searchableAliases: ['मीट मसाला', 'meat masala', 'meet masala', 'meat masala packet'],
    commonSpokenNames: ['मीट मसाला', 'meat masala'],
    awadhiHindiAliases: ['मीट मसाला'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_chicken_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'चिकन मसाला',
    canonicalNameHindi: 'चिकन मसाला',
    canonicalNameEnglish: 'Chicken Masala',
    searchableAliases: ['चिकन मसाला', 'chicken masala', 'chicken masala packet'],
    commonSpokenNames: ['चिकन मसाला', 'chicken masala'],
    awadhiHindiAliases: ['चिकन मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_pav_bhaji_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'पाव भाजी मसाला',
    canonicalNameHindi: 'पाव भाजी मसाला',
    canonicalNameEnglish: 'Pav Bhaji Masala',
    searchableAliases: ['पाव भाजी मसाला', 'pav bhaji masala', 'paav bhaji masala'],
    commonSpokenNames: ['पाव भाजी मसाला', 'pav bhaji masala'],
    awadhiHindiAliases: ['पाव भाजी मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_paneer_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'पनीर मसाला',
    canonicalNameHindi: 'पनीर मसाला',
    canonicalNameEnglish: 'Paneer Masala',
    searchableAliases: ['पनीर मसाला', 'शाही पनीर मसाला', 'paneer masala', 'shahi paneer masala'],
    commonSpokenNames: ['पनीर मसाला', 'paneer masala'],
    awadhiHindiAliases: ['पनीर मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_kitchen_king',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'किचन किंग',
    canonicalNameHindi: 'किचन किंग मसाला',
    canonicalNameEnglish: 'Kitchen King Masala',
    searchableAliases: ['किचन किंग मसाला', 'किचन किंग', 'kitchen king', 'kitchen king masala'],
    commonSpokenNames: ['किचन किंग', 'kitchen king'],
    awadhiHindiAliases: ['किचन किंग'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_sambar_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'सांभर मसाला',
    canonicalNameHindi: 'सांभर मसाला',
    canonicalNameEnglish: 'Sambar Masala',
    searchableAliases: ['सांभर मसाला', 'sambar masala', 'sambhar masala'],
    commonSpokenNames: ['सांभर मसाला', 'sambar masala'],
    awadhiHindiAliases: ['सांभर मसाला'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_chaat_masala',
    category: 'मसाले / साबुत मसाले / मसाला पैक',
    subcategory: 'चाट मसाला',
    canonicalNameHindi: 'चाट मसाला',
    canonicalNameEnglish: 'Chaat Masala',
    searchableAliases: ['चाट मसाला', 'chaat masala', 'chat masala'],
    commonSpokenNames: ['चाट मसाला', 'chaat masala'],
    awadhiHindiAliases: ['चाट मसाला'],
    defaultUnits: ['packet', 'डिब्बी'],
    supportedUnits: ['packet', 'डिब्बी'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 6. ड्राई फ्रूट / मेवा / बीज (Dry Fruits & Nuts)
  // =========================================================================
  {
    id: 'prod_badam',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'बादाम',
    canonicalNameHindi: 'बादाम',
    canonicalNameEnglish: 'Almonds / Badam',
    searchableAliases: ['बादाम', 'बदाम', 'almonds', 'badam', 'california badam'],
    commonSpokenNames: ['बादाम', 'badam', 'almonds'],
    awadhiHindiAliases: ['बादाम', 'बदाम'],
    defaultUnits: ['gram', 'kg', 'packet'],
    supportedUnits: ['gram', 'kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kaju',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'काजू',
    canonicalNameHindi: 'काजू',
    canonicalNameEnglish: 'Cashew Nuts / Kaju',
    searchableAliases: ['काजू', 'काजू टुकड़ा', 'cashew', 'kaju', 'cashews', 'whole kaju'],
    commonSpokenNames: ['काजू', 'kaju'],
    awadhiHindiAliases: ['काजू'],
    defaultUnits: ['gram', 'kg', 'packet'],
    supportedUnits: ['gram', 'kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_kishmish',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'किशमिश',
    canonicalNameHindi: 'किशमिश',
    canonicalNameEnglish: 'Raisins / Kishmish',
    searchableAliases: ['किशमिश', 'किसमिस', 'दाख', 'raisins', 'kishmish', 'kismis'],
    commonSpokenNames: ['किशमिश', 'kishmish'],
    awadhiHindiAliases: ['किशमिश', 'किसमिस'],
    defaultUnits: ['gram', 'kg', 'packet'],
    supportedUnits: ['gram', 'kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_makhana',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'मखाना',
    canonicalNameHindi: 'फूल मखाना',
    canonicalNameEnglish: 'Fox Nuts / Makhana',
    searchableAliases: ['मखाना', 'फूल मखाना', 'makhana', 'fox nuts', 'phool makhana'],
    commonSpokenNames: ['मखाना', 'फूल मखाना', 'makhana'],
    awadhiHindiAliases: ['मखाना', 'मखान'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_mungfali',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'मूंगफली',
    canonicalNameHindi: 'मूंगफली',
    canonicalNameEnglish: 'Peanuts / Groundnuts',
    searchableAliases: ['मूंगफली', 'मूंगफली दाना', 'सींगदाना', 'peanut', 'groundnut', 'peanuts', 'mungfali', 'moongfali'],
    commonSpokenNames: ['मूंगफली', 'मूंगफली दाना', 'peanut'],
    awadhiHindiAliases: ['मूंगफली', 'बादाम दाना', 'मूंगफली दाना'],
    defaultUnits: ['gram', 'kg', 'packet'],
    supportedUnits: ['gram', 'kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_akhrot',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'अखरोट',
    canonicalNameHindi: 'अखरोट गिरी',
    canonicalNameEnglish: 'Walnuts / Akhrot',
    searchableAliases: ['अखरोट', 'अखरोट गिरी', 'walnut', 'akhrot', 'walnuts'],
    commonSpokenNames: ['अखरोट', 'akhrot'],
    awadhiHindiAliases: ['अखरोट'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_khajoor',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'खजूर',
    canonicalNameHindi: 'खजूर',
    canonicalNameEnglish: 'Dates / Khajoor',
    searchableAliases: ['खजूर', 'dates', 'khajoor'],
    commonSpokenNames: ['खजूर', 'khajoor'],
    awadhiHindiAliases: ['खजूर'],
    defaultUnits: ['packet', 'gram'],
    supportedUnits: ['packet', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_nariyal_gola',
    category: 'ड्राई फ्रूट / मेवा / बीज',
    subcategory: 'सूखा नारियल',
    canonicalNameHindi: 'सूखा नारियल / गरी गोला',
    canonicalNameEnglish: 'Dry Coconut / Gari Gola',
    searchableAliases: ['गरी गोला', 'सूखा नारियल', 'गरी', 'dry coconut', 'gari gola', 'khopra'],
    commonSpokenNames: ['गरी गोला', 'सूखा नारियल', 'गरी'],
    awadhiHindiAliases: ['गरी गोला', 'गरी'],
    defaultUnits: ['piece', 'gram', 'kg'],
    supportedUnits: ['piece', 'gram', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 7. चाय / कॉफी / पेय (Tea, Coffee & Beverages)
  // =========================================================================
  {
    id: 'prod_tata_tea',
    category: 'चाय / कॉफी / पेय',
    subcategory: 'चायपत्ती',
    canonicalNameHindi: 'टाटा टी प्रीमियम',
    canonicalNameEnglish: 'Tata Tea Premium',
    brand: 'Tata Tea',
    brandAliases: ['tata tea', 'टाटा टी', 'tata'],
    searchableAliases: ['टाटा चाय', 'टाटा टी', 'टाटा टी प्रीमियम', 'tata tea', 'tata tea premium'],
    commonSpokenNames: ['टाटा चाय', 'tata tea'],
    awadhiHindiAliases: ['टाटा चाय'],
    defaultUnits: ['packet', 'gram', 'kg'],
    supportedUnits: ['packet', 'gram', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_red_label_tea',
    category: 'चाय / कॉफी / पेय',
    subcategory: 'चायपत्ती',
    canonicalNameHindi: 'रेड लेबल चाय',
    canonicalNameEnglish: 'Red Label Tea',
    brand: 'Red Label',
    brandAliases: ['red label', 'रेड लेबल', 'brooke bond'],
    searchableAliases: ['रेड लेबल', 'रेड लेबल चाय', 'red label tea', 'brooke bond red label'],
    commonSpokenNames: ['रेड लेबल चाय', 'red label tea'],
    awadhiHindiAliases: ['रेड लेबल चाय'],
    defaultUnits: ['packet', 'gram', 'kg'],
    supportedUnits: ['packet', 'gram', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_chayapatti',
    category: 'चाय / कॉफी / पेय',
    subcategory: 'सामान्य चायपत्ती',
    canonicalNameHindi: 'चायपत्ती',
    canonicalNameEnglish: 'Tea Leaves / Chai Patti',
    searchableAliases: ['चाय', 'चायपत्ती', 'चाय पत्ती', 'tea', 'chai patti', 'tea powder'],
    commonSpokenNames: ['चायपत्ती', 'चाय पत्ती', 'chai patti'],
    awadhiHindiAliases: ['चायपत्ती', 'चाहपत्ती'],
    defaultUnits: ['gram', 'packet', 'kg'],
    supportedUnits: ['gram', 'packet', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_nescafe_coffee',
    category: 'चाय / कॉफी / पेय',
    subcategory: 'कॉफी',
    canonicalNameHindi: 'नेस्कैफे कॉफी',
    canonicalNameEnglish: 'Nescafe Coffee',
    brand: 'Nescafe',
    brandAliases: ['nescafe', 'नेस्कैफे', 'nescafe classic'],
    searchableAliases: ['कॉफी', 'नेस्कैफे', 'नेस्कैफे कॉफी', 'nescafe', 'coffee', 'bru coffee'],
    commonSpokenNames: ['नेस्कैफे कॉफी', 'कॉफी', 'nescafe'],
    awadhiHindiAliases: ['कॉफी'],
    defaultUnits: ['packet', 'डिब्बी', 'sachet'],
    supportedUnits: ['packet', 'डिब्बी', 'sachet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_glucon_d',
    category: 'चाय / कॉफी / पेय',
    subcategory: 'ग्लूकोज',
    canonicalNameHindi: 'ग्लूकॉन-डी',
    canonicalNameEnglish: 'Glucon-D Energy Drink',
    brand: 'Glucon-D',
    brandAliases: ['glucon-d', 'glucond', 'ग्लूकॉन डी', 'ग्लूकोज'],
    searchableAliases: ['ग्लूकॉन डी', 'ग्लूकोज', 'glucon d', 'glucose'],
    commonSpokenNames: ['ग्लूकॉन डी', 'glucon d'],
    awadhiHindiAliases: ['ग्लूकोज'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 8. बिस्कुट (Biscuits & Cookies)
  // =========================================================================
  {
    id: 'prod_parle_g',
    category: 'बिस्कुट',
    subcategory: 'ग्लूकोज बिस्कुट',
    canonicalNameHindi: 'पारले-जी बिस्कुट',
    canonicalNameEnglish: 'Parle-G Biscuit',
    brand: 'Parle-G',
    brandAliases: ['parle-g', 'parle g', 'पारले जी', 'पारलेजी', 'parle'],
    searchableAliases: ['पारले जी', 'पारले-जी', 'पारले जी बिस्कुट', 'parle g', 'parle-g', 'parle-g biscuit', 'parle biscuit'],
    commonSpokenNames: ['पारले जी', 'पारले-जी बिस्कुट', 'parle g'],
    awadhiHindiAliases: ['पारले जी', 'पारलेजी'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_good_day',
    category: 'बिस्कुट',
    subcategory: 'बटर / काजू कुकीज',
    canonicalNameHindi: 'गुड डे बिस्कुट',
    canonicalNameEnglish: 'Britannia Good Day Biscuit',
    brand: 'Britannia',
    brandAliases: ['britannia', 'ब्रिटानिया', 'good day', 'गुड डे'],
    searchableAliases: ['गुड डे', 'गुडडे', 'गुड डे बिस्कुट', 'good day', 'good day biscuit', 'britannia good day'],
    commonSpokenNames: ['गुड डे बिस्कुट', 'गुड डे', 'good day biscuit'],
    awadhiHindiAliases: ['गुड डे बिस्कुट'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_marie_gold',
    category: 'बिस्कुट',
    subcategory: 'मैरी बिस्कुट',
    canonicalNameHindi: 'मैरी गोल्ड बिस्कुट',
    canonicalNameEnglish: 'Britannia Marie Gold Biscuit',
    brand: 'Britannia',
    brandAliases: ['britannia', 'marie gold', 'मैरी गोल्ड', 'मेरी गोल्ड'],
    searchableAliases: ['मैरी गोल्ड', 'मेरी गोल्ड', 'मैरी बिस्कुट', 'marie gold', 'marie biscuit', 'marie gold biscuit'],
    commonSpokenNames: ['मैरी गोल्ड बिस्कुट', 'मैरी गोल्ड', 'marie gold'],
    awadhiHindiAliases: ['मैरी बिस्कुट', 'मेरी गोल्ड'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_rusk',
    category: 'बिस्कुट',
    subcategory: 'रस्क / टोस्ट',
    canonicalNameHindi: 'सूजी रस्क / टोस्ट',
    canonicalNameEnglish: 'Suji Rusk / Toast',
    searchableAliases: ['रस्क', 'टोस्ट', 'सूजी रस्क', 'rusk', 'toast', 'suji rusk'],
    commonSpokenNames: ['रस्क', 'टोस्ट', 'rusk'],
    awadhiHindiAliases: ['टोस्ट', 'पापा'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 9. नमकीन / चिप्स / स्नैक्स (Namkeen, Chips & Snacks)
  // =========================================================================
  {
    id: 'prod_haldiram_bhujia',
    category: 'नमकीन / चिप्स / स्नैक्स',
    subcategory: 'भुजिया / नमकीन',
    canonicalNameHindi: 'हल्दीराम भुजिया',
    canonicalNameEnglish: 'Haldiram Bhujia Sev',
    brand: 'Haldiram',
    brandAliases: ['haldiram', 'हल्दीराम', 'haldirams'],
    searchableAliases: ['हल्दीराम भुजिया', 'आलू भुजिया', 'बीकानेरी भुजिया', 'haldiram bhujia', 'aloo bhujia', 'bhujia sev'],
    commonSpokenNames: ['हल्दीराम भुजिया', 'आलू भुजिया', 'aloo bhujia'],
    awadhiHindiAliases: ['भुजिया', 'हल्दीराम भुजिया'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_kurkure',
    category: 'नमकीन / चिप्स / स्नैक्स',
    subcategory: 'कुरकुरे',
    canonicalNameHindi: 'कुरकुरे',
    canonicalNameEnglish: 'Kurkure',
    brand: 'Kurkure',
    brandAliases: ['kurkure', 'कुरकुरे'],
    searchableAliases: ['कुरकुरे', 'kurkure', 'masala munch'],
    commonSpokenNames: ['कुरकुरे', 'kurkure'],
    awadhiHindiAliases: ['कुरकुरे'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_lays_chips',
    category: 'नमकीन / चिप्स / स्नैक्स',
    subcategory: 'चिप्स',
    canonicalNameHindi: 'लेज़ चिप्स',
    canonicalNameEnglish: "Lay's Potato Chips",
    brand: "Lay's",
    brandAliases: ['lays', 'lay', 'लेज़', 'लेज'],
    searchableAliases: ['लेज़ चिप्स', 'चिप्स', 'लेज चिप्स', 'lays chips', 'potato chips', 'lays'],
    commonSpokenNames: ['लेज़ चिप्स', 'चिप्स', 'lays chips'],
    awadhiHindiAliases: ['चिप्स', 'लेज चिप्स'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 10. चॉकलेट / टॉफी / कैंडी (Chocolates & Candy)
  // =========================================================================
  {
    id: 'prod_dairy_milk',
    category: 'चॉकलेट / टॉफी / कैंडी',
    subcategory: 'चॉकलेट',
    canonicalNameHindi: 'कैडबरी डेयरी मिल्क',
    canonicalNameEnglish: 'Cadbury Dairy Milk Chocolate',
    brand: 'Cadbury',
    brandAliases: ['cadbury', 'कैडबरी', 'dairy milk'],
    searchableAliases: ['डेयरी मिल्क', 'कैडबरी चॉकलेट', 'चॉकलेट', 'dairy milk', 'cadbury chocolate', 'chocolate'],
    commonSpokenNames: ['डेयरी मिल्क', 'चॉकलेट', 'dairy milk'],
    awadhiHindiAliases: ['चॉकलेट', 'डेयरी मिल्क'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_kitkat',
    category: 'चॉकलेट / टॉफी / कैंडी',
    subcategory: 'चॉकलेट',
    canonicalNameHindi: 'किट कैट',
    canonicalNameEnglish: 'Nestle KitKat',
    brand: 'Nestle',
    brandAliases: ['nestle', 'kitkat', 'किट कैट'],
    searchableAliases: ['किट कैट', 'kitkat', 'kit kat'],
    commonSpokenNames: ['किट कैट', 'kitkat'],
    awadhiHindiAliases: ['किट कैट'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 11. नूडल्स / पास्ता / इंस्टेंट फूड (Noodles, Pasta & Instant)
  // =========================================================================
  {
    id: 'prod_maggi_noodles',
    category: 'नूडल्स / पास्ता / इंस्टेंट फूड',
    subcategory: 'मैगी',
    canonicalNameHindi: 'मैगी नूडल्स',
    canonicalNameEnglish: 'Maggi 2-Minute Noodles',
    brand: 'Maggi',
    brandAliases: ['maggi', 'मैगी', 'मग्गी'],
    searchableAliases: ['मैगी', 'मैगी नूडल्स', 'नूडल्स', 'maggi', 'maggi noodles', 'noodles'],
    commonSpokenNames: ['मैगी', 'मैगी नूडल्स', 'maggi'],
    awadhiHindiAliases: ['मैगी'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_macaroni_pasta',
    category: 'नूडल्स / पास्ता / इंस्टेंट फूड',
    subcategory: 'मैकरोनी / पास्ता',
    canonicalNameHindi: 'मैकरोनी / पास्ता',
    canonicalNameEnglish: 'Macaroni / Pasta',
    searchableAliases: ['मैकरोनी', 'पास्ता', 'macaroni', 'pasta'],
    commonSpokenNames: ['मैकरोनी', 'पास्ता', 'macaroni'],
    awadhiHindiAliases: ['मैकरोनी'],
    defaultUnits: ['kg', 'gram', 'packet'],
    supportedUnits: ['kg', 'gram', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_sevai',
    category: 'नूडल्स / पास्ता / इंस्टेंट फूड',
    subcategory: 'सेवई / वर्मिसेली',
    canonicalNameHindi: 'सेवई / वर्मिसेली',
    canonicalNameEnglish: 'Vermicelli / Sevai',
    searchableAliases: ['सेवई', 'सेंवई', 'सेवइयां', 'sevai', 'sewai', 'vermicelli'],
    commonSpokenNames: ['सेवई', 'sevai'],
    awadhiHindiAliases: ['सेवई'],
    defaultUnits: ['packet', 'gram'],
    supportedUnits: ['packet', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 12. सॉस / केचप / अचार / जैम (Sauces, Pickles & Jam)
  // =========================================================================
  {
    id: 'prod_kissan_ketchup',
    category: 'सॉस / केचप / अचार / जैम',
    subcategory: 'टोमैटो सॉस',
    canonicalNameHindi: 'किसान टोमैटो केचप',
    canonicalNameEnglish: 'Kissan Tomato Ketchup',
    brand: 'Kissan',
    brandAliases: ['kissan', 'किसान'],
    searchableAliases: ['टोमैटो सॉस', 'टोमैटो केचप', 'किसान केचप', 'सॉस', 'ketchup', 'tomato sauce', 'kissan ketchup'],
    commonSpokenNames: ['टोमैटो सॉस', 'किसान केचप', 'ketchup'],
    awadhiHindiAliases: ['सॉस', 'टोमैटो सॉस'],
    defaultUnits: ['बोतल', 'packet', 'pouch'],
    supportedUnits: ['बोतल', 'packet', 'pouch'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_aam_achar',
    category: 'सॉस / केचप / अचार / जैम',
    subcategory: 'अचार',
    canonicalNameHindi: 'आम का अचार',
    canonicalNameEnglish: 'Mango Pickle / Aam Ka Achar',
    searchableAliases: ['अचार', 'आम का अचार', 'मिक्स्ड अचार', 'pickle', 'achar', 'aam ka achar'],
    commonSpokenNames: ['आम का अचार', 'अचार', 'achar'],
    awadhiHindiAliases: ['अचार', 'आम के अचार'],
    defaultUnits: ['डिब्बा', 'packet', 'kg', 'gram'],
    supportedUnits: ['डिब्बा', 'packet', 'kg', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 13. डेयरी (Dairy Products)
  // =========================================================================
  {
    id: 'prod_amul_doodh',
    category: 'डेयरी',
    subcategory: 'दूध',
    canonicalNameHindi: 'अमूल दूध',
    canonicalNameEnglish: 'Amul Milk',
    brand: 'Amul',
    brandAliases: ['amul', 'अमूल'],
    searchableAliases: ['दूध', 'अमूल दूध', 'अमूल गोल्ड', 'अमूल ताज़ा', 'milk', 'amul milk', 'amul doodh', 'doodh'],
    commonSpokenNames: ['अमूल दूध', 'दूध', 'amul milk'],
    awadhiHindiAliases: ['दूध', 'गोरस'],
    defaultUnits: ['packet', 'litre'],
    supportedUnits: ['packet', 'litre'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_amul_butter',
    category: 'डेयरी',
    subcategory: 'मक्खन',
    canonicalNameHindi: 'अमूल मक्खन',
    canonicalNameEnglish: 'Amul Butter',
    brand: 'Amul',
    brandAliases: ['amul', 'अमूल'],
    searchableAliases: ['मक्खन', 'अमूल बटर', 'बटर', 'butter', 'amul butter', 'makkhan'],
    commonSpokenNames: ['अमूल मक्खन', 'बटर', 'butter'],
    awadhiHindiAliases: ['मक्खन', 'नैनू'],
    defaultUnits: ['डिब्बा', 'gram', 'packet'],
    supportedUnits: ['डिब्बा', 'gram', 'packet'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_paneer',
    category: 'डेयरी',
    subcategory: 'पनीर',
    canonicalNameHindi: 'पनीर',
    canonicalNameEnglish: 'Fresh Paneer / Cottage Cheese',
    searchableAliases: ['पनीर', 'ताज़ा पनीर', 'अमूल पनीर', 'paneer', 'fresh paneer'],
    commonSpokenNames: ['पनीर', 'paneer'],
    awadhiHindiAliases: ['पनीर'],
    defaultUnits: ['gram', 'kg', 'packet'],
    supportedUnits: ['gram', 'kg', 'packet', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 14. ब्रेड / बेकरी (Bread & Bakery)
  // =========================================================================
  {
    id: 'prod_white_bread',
    category: 'ब्रेड / बेकरी',
    subcategory: 'ब्रेड',
    canonicalNameHindi: 'व्हाइट ब्रेड',
    canonicalNameEnglish: 'White Bread / Sandwich Bread',
    searchableAliases: ['ब्रेड', 'व्हाइट ब्रेड', 'सैंडविच ब्रेड', 'bread', 'white bread', 'pav'],
    commonSpokenNames: ['ब्रेड', 'bread'],
    awadhiHindiAliases: ['ब्रेड', 'पावरोटी'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 15. साबुन / शैंपू / पर्सनल केयर (Soap, Shampoo & Personal Care)
  // =========================================================================
  {
    id: 'prod_dove_shampoo',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'शैंपू',
    canonicalNameHindi: 'डव शैंपू',
    canonicalNameEnglish: 'Dove Shampoo',
    brand: 'Dove',
    brandAliases: ['dove', 'डव', 'डोव'],
    searchableAliases: ['डव शैंपू', 'dove shampoo', 'dove sampoo', 'डव सैंपू'],
    commonSpokenNames: ['डव शैंपू', 'dove shampoo'],
    awadhiHindiAliases: ['डव शैंपू', 'डव सैंपू'],
    defaultUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportedUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_clinic_plus_shampoo',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'शैंपू',
    canonicalNameHindi: 'क्लिनिक प्लस शैंपू',
    canonicalNameEnglish: 'Clinic Plus Shampoo',
    brand: 'Clinic Plus',
    brandAliases: ['clinic plus', 'clinicplus', 'क्लिनिक प्लस', 'क्लिनिकप्लस', 'क्लीनिक प्लस'],
    searchableAliases: ['क्लिनिक प्लस शैंपू', 'clinic plus shampoo', 'clinic plus sampoo', 'क्लिनिक प्लस सैंपू'],
    commonSpokenNames: ['क्लिनिक प्लस शैंपू', 'clinic plus shampoo'],
    awadhiHindiAliases: ['क्लिनिक प्लस शैंपू', 'क्लिनिक प्लस सैंपू'],
    defaultUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportedUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_sunsilk_shampoo',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'शैंपू',
    canonicalNameHindi: 'सनसिल्क शैंपू',
    canonicalNameEnglish: 'Sunsilk Shampoo',
    brand: 'Sunsilk',
    brandAliases: ['sunsilk', 'सनसिल्क'],
    searchableAliases: ['सनसिल्क शैंपू', 'sunsilk shampoo', 'sunsilk sampoo', 'सनसिल्क'],
    commonSpokenNames: ['सनसिल्क शैंपू', 'sunsilk shampoo'],
    awadhiHindiAliases: ['सनसिल्क शैंपू'],
    defaultUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportedUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_head_shoulders_shampoo',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'शैंपू',
    canonicalNameHindi: 'हेड एंड शोल्डर्स शैंपू',
    canonicalNameEnglish: 'Head & Shoulders Shampoo',
    brand: 'Head & Shoulders',
    brandAliases: ['head and shoulders', 'head & shoulders', 'हेड एंड शोल्डर', 'head shoulders'],
    searchableAliases: ['हेड एंड शोल्डर शैंपू', 'head and shoulders shampoo', 'head & shoulders shampoo'],
    commonSpokenNames: ['हेड एंड शोल्डर्स शैंपू', 'head & shoulders'],
    awadhiHindiAliases: ['हेड एंड शोल्डर'],
    defaultUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportedUnits: ['packet', 'sachet', 'बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_santoor_soap',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'नहाने का साबुन',
    canonicalNameHindi: 'संतूर साबुन',
    canonicalNameEnglish: 'Santoor Soap',
    brand: 'Santoor',
    brandAliases: ['santoor', 'संतूर', 'santur'],
    searchableAliases: ['संतूर साबुन', 'संतूर', 'santoor soap', 'santoor sabun'],
    commonSpokenNames: ['संतूर साबुन', 'संतूर', 'santoor soap'],
    awadhiHindiAliases: ['संतूर साबुन', 'संतूर'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_lux_soap',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'नहाने का साबुन',
    canonicalNameHindi: 'लक्स साबुन',
    canonicalNameEnglish: 'Lux Soap',
    brand: 'Lux',
    brandAliases: ['lux', 'लक्स'],
    searchableAliases: ['लक्स साबुन', 'लक्स', 'lux soap', 'lux sabun'],
    commonSpokenNames: ['लक्स साबुन', 'लक्स', 'lux soap'],
    awadhiHindiAliases: ['लक्स साबुन'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_lifebuoy_soap',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'नहाने का साबुन',
    canonicalNameHindi: 'लाइफबॉय साबुन',
    canonicalNameEnglish: 'Lifebuoy Soap',
    brand: 'Lifebuoy',
    brandAliases: ['lifebuoy', 'लाइफबॉय', 'लाइफब्वॉय'],
    searchableAliases: ['लाइफबॉय साबुन', 'लाइफबॉय', 'lifebuoy soap', 'lifebuoy sabun'],
    commonSpokenNames: ['लाइफबॉय साबुन', 'लाइफबॉय', 'lifebuoy'],
    awadhiHindiAliases: ['लाइफबॉय साबुन'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_dettol_soap',
    category: 'साबुन / शैंपू / पर्सनल केयर',
    subcategory: 'नहाने का साबुन',
    canonicalNameHindi: 'डेटॉल साबुन',
    canonicalNameEnglish: 'Dettol Soap',
    brand: 'Dettol',
    brandAliases: ['dettol', 'डेटॉल', 'डिटॉल'],
    searchableAliases: ['डेटॉल साबुन', 'डेटॉल', 'dettol soap', 'dettol sabun'],
    commonSpokenNames: ['डेटॉल साबुन', 'डेटॉल', 'dettol soap'],
    awadhiHindiAliases: ['डेटॉल साबुन'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 16. टूथपेस्ट / टूथब्रश / ओरल केयर (Oral Care)
  // =========================================================================
  {
    id: 'prod_colgate_paste',
    category: 'टूथपेस्ट / टूथब्रश / ओरल केयर',
    subcategory: 'टूथपेस्ट',
    canonicalNameHindi: 'कोलगेट टूथपेस्ट',
    canonicalNameEnglish: 'Colgate Toothpaste',
    brand: 'Colgate',
    brandAliases: ['colgate', 'कोलगेट'],
    searchableAliases: ['कोलगेट', 'कोलगेट टूथपेस्ट', 'colgate toothpaste', 'colgate paste', 'colgate'],
    commonSpokenNames: ['कोलगेट टूथपेस्ट', 'कोलगेट', 'colgate'],
    awadhiHindiAliases: ['कोलगेट'],
    defaultUnits: ['piece', 'packet', 'gram'],
    supportedUnits: ['piece', 'packet', 'gram'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_pepsodent_paste',
    category: 'टूथपेस्ट / टूथब्रश / ओरल केयर',
    subcategory: 'टूथपेस्ट',
    canonicalNameHindi: 'पेप्सोडेंट टूथपेस्ट',
    canonicalNameEnglish: 'Pepsodent Toothpaste',
    brand: 'Pepsodent',
    brandAliases: ['pepsodent', 'पेप्सोडेंट'],
    searchableAliases: ['पेप्सोडेंट', 'pepsodent toothpaste', 'pepsodent'],
    commonSpokenNames: ['पेप्सोडेंट टूथपेस्ट', 'पेप्सोडेंट', 'pepsodent'],
    awadhiHindiAliases: ['पेप्सोडेंट'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_closeup_paste',
    category: 'टूथपेस्ट / टूथब्रश / ओरल केयर',
    subcategory: 'टूथपेस्ट',
    canonicalNameHindi: 'क्लोज़ अप टूथपेस्ट',
    canonicalNameEnglish: 'Closeup Toothpaste',
    brand: 'Closeup',
    brandAliases: ['closeup', 'close up', 'क्लोज़ अप', 'क्लोजअप'],
    searchableAliases: ['क्लोज अप', 'क्लोज़अप टूथपेस्ट', 'closeup toothpaste', 'close up'],
    commonSpokenNames: ['क्लोज़ अप टूथपेस्ट', 'closeup'],
    awadhiHindiAliases: ['क्लोज़ अप'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_toothbrush',
    category: 'टूथपेस्ट / टूथब्रश / ओरल केयर',
    subcategory: 'टूथब्रश',
    canonicalNameHindi: 'टूथब्रश',
    canonicalNameEnglish: 'Toothbrush',
    searchableAliases: ['ब्रश', 'टूथब्रश', 'दातुन', 'toothbrush', 'brush'],
    commonSpokenNames: ['टूथब्रश', 'toothbrush', 'ब्रश'],
    awadhiHindiAliases: ['ब्रश', 'टूथब्रश'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 17. हेयर ऑयल / क्रीम / कॉस्मेटिक्स (Hair Oil & Cosmetics)
  // =========================================================================
  {
    id: 'prod_parachute_oil',
    category: 'हेयर ऑयल / क्रीम / कॉस्मेटिक्स',
    subcategory: 'नारियल तेल',
    canonicalNameHindi: 'पैराशूट नारियल तेल',
    canonicalNameEnglish: 'Parachute Coconut Hair Oil',
    brand: 'Parachute',
    brandAliases: ['parachute', 'पैराशूट', 'पैरासुट'],
    searchableAliases: ['पैराशूट तेल', 'पैराशूट नारियल तेल', 'नारियल का तेल', 'parachute oil', 'coconut oil', 'parachute coconut oil'],
    commonSpokenNames: ['पैराशूट तेल', 'parachute oil'],
    awadhiHindiAliases: ['पैराशूट तेल', 'नारियल तेल'],
    defaultUnits: ['बोतल', 'piece'],
    supportedUnits: ['बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_navratna_oil',
    category: 'हेयर ऑयल / क्रीम / कॉस्मेटिक्स',
    subcategory: 'ठंडा तेल',
    canonicalNameHindi: 'नवरत्न तेल',
    canonicalNameEnglish: 'Navratna Cool Hair Oil',
    brand: 'Navratna',
    brandAliases: ['navratna', 'नवरत्न'],
    searchableAliases: ['नवरत्न तेल', 'ठंडा तेल', 'navratna oil', 'thanda tel'],
    commonSpokenNames: ['नवरत्न तेल', 'navratna oil', 'ठंडा तेल'],
    awadhiHindiAliases: ['नवरत्न तेल', 'ठंडा तेल'],
    defaultUnits: ['बोतल', 'packet', 'sachet'],
    supportedUnits: ['बोतल', 'packet', 'sachet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_dabur_amla_oil',
    category: 'हेयर ऑयल / क्रीम / कॉस्मेटिक्स',
    subcategory: 'आंवला तेल',
    canonicalNameHindi: 'डाबर आंवला तेल',
    canonicalNameEnglish: 'Dabur Amla Hair Oil',
    brand: 'Dabur',
    brandAliases: ['dabur', 'डाबर'],
    searchableAliases: ['डाबर आंवला', 'आंवला तेल', 'dabur amla', 'amla oil', 'dabur amla oil'],
    commonSpokenNames: ['डाबर आंवला तेल', 'dabur amla'],
    awadhiHindiAliases: ['डाबर आंवला तेल'],
    defaultUnits: ['बोतल', 'piece'],
    supportedUnits: ['बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 18. डिटर्जेंट / कपड़े धोने का सामान (Detergent & Laundry)
  // =========================================================================
  {
    id: 'prod_nirma_powder',
    category: 'डिटर्जेंट / कपड़े धोने का सामान',
    subcategory: 'डिटर्जेंट पाउडर',
    canonicalNameHindi: 'निरमा वाशिंग पाउडर',
    canonicalNameEnglish: 'Nirma Washing Powder',
    brand: 'Nirma',
    brandAliases: ['nirma', 'निरमा'],
    searchableAliases: ['निरमा', 'निरमा पाउडर', 'निरमा वाशिंग पाउडर', 'nirma washing powder', 'nirma powder', 'nirma detergent'],
    commonSpokenNames: ['निरमा', 'निरमा पाउडर', 'nirma'],
    awadhiHindiAliases: ['निरमा', 'निरमा पाउडर'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_surf_excel',
    category: 'डिटर्जेंट / कपड़े धोने का सामान',
    subcategory: 'डिटर्जेंट पाउडर',
    canonicalNameHindi: 'सर्फ एक्सेल',
    canonicalNameEnglish: 'Surf Excel Detergent Powder',
    brand: 'Surf Excel',
    brandAliases: ['surf excel', 'surf', 'सर्फ एक्सेल', 'सर्फ'],
    searchableAliases: ['सर्फ एक्सेल', 'सर्फ', 'surf excel', 'surf excel powder', 'surf'],
    commonSpokenNames: ['सर्फ एक्सेल', 'सर्फ', 'surf excel'],
    awadhiHindiAliases: ['सर्फ एक्सेल', 'सर्फ'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_tide_detergent',
    category: 'डिटर्जेंट / कपड़े धोने का सामान',
    subcategory: 'डिटर्जेंट पाउडर',
    canonicalNameHindi: 'टाइड डिटर्जेंट पाउडर',
    canonicalNameEnglish: 'Tide Detergent Powder',
    brand: 'Tide',
    brandAliases: ['tide', 'टाइड'],
    searchableAliases: ['टाइड', 'टाइड पाउडर', 'tide', 'tide powder', 'tide detergent'],
    commonSpokenNames: ['टाइड पाउडर', 'tide'],
    awadhiHindiAliases: ['टाइड'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_ghadi_powder',
    category: 'डिटर्जेंट / कपड़े धोने का सामान',
    subcategory: 'डिटर्जेंट पाउडर',
    canonicalNameHindi: 'घड़ी डिटर्जेंट पाउडर',
    canonicalNameEnglish: 'Ghadi Detergent Powder',
    brand: 'Ghadi',
    brandAliases: ['ghadi', 'घड़ी', 'ghari'],
    searchableAliases: ['घड़ी पाउडर', 'घड़ी डिटर्जेंट', 'ghadi powder', 'ghadi detergent'],
    commonSpokenNames: ['घड़ी पाउडर', 'ghadi'],
    awadhiHindiAliases: ['घड़ी पाउडर'],
    defaultUnits: ['packet', 'kg'],
    supportedUnits: ['packet', 'kg'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_rin_bar',
    category: 'डिटर्जेंट / कपड़े धोने का सामान',
    subcategory: 'कपड़े धोने का साबुन',
    canonicalNameHindi: 'रिन साबुन',
    canonicalNameEnglish: 'Rin Detergent Bar',
    brand: 'Rin',
    brandAliases: ['rin', 'रिन'],
    searchableAliases: ['रिन साबुन', 'रिन टिकिया', 'rin bar', 'rin soap', 'rin'],
    commonSpokenNames: ['रिन साबुन', 'rin bar'],
    awadhiHindiAliases: ['रिन साबुन', 'रिन टिकिया'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 19. बर्तन साफ करने का सामान (Dishwashing)
  // =========================================================================
  {
    id: 'prod_vim_bar',
    category: 'बर्तन साफ करने का सामान',
    subcategory: 'डिशवॉश बार',
    canonicalNameHindi: 'विम बार साबुन',
    canonicalNameEnglish: 'Vim Dishwash Bar',
    brand: 'Vim',
    brandAliases: ['vim', 'विम'],
    searchableAliases: ['विम बार', 'विम साबुन', 'बर्तन धोने का साबुन', 'vim bar', 'vim soap', 'dishwash bar'],
    commonSpokenNames: ['विम बार', 'विम साबुन', 'vim bar'],
    awadhiHindiAliases: ['विम टिकिया', 'विम साबुन'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_steel_scrubber',
    category: 'बर्तन साफ करने का सामान',
    subcategory: 'जूना / स्क्रबर',
    canonicalNameHindi: 'स्टील जूना / स्क्रबर',
    canonicalNameEnglish: 'Steel Scrubber / Juna',
    searchableAliases: ['जूना', 'स्टील जूना', 'स्क्रबर', 'steel scrubber', 'juna', 'scrub pad'],
    commonSpokenNames: ['जूना', 'स्टील जूना', 'scrubber'],
    awadhiHindiAliases: ['जूना'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 20. फर्श / टॉयलेट / घर की सफाई (Cleaning & Disinfectant)
  // =========================================================================
  {
    id: 'prod_harpic',
    category: 'फर्श / टॉयलेट / घर की सफाई',
    subcategory: 'टॉयलेट क्लीनर',
    canonicalNameHindi: 'हार्पिक टॉयलेट क्लीनर',
    canonicalNameEnglish: 'Harpic Toilet Cleaner',
    brand: 'Harpic',
    brandAliases: ['harpic', 'हार्पिक'],
    searchableAliases: ['हार्पिक', 'टॉयलेट क्लीनर', 'harpic', 'harpic cleaner', 'toilet cleaner'],
    commonSpokenNames: ['हार्पिक', 'harpic'],
    awadhiHindiAliases: ['हार्पिक'],
    defaultUnits: ['बोतल', 'piece'],
    supportedUnits: ['बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_lizol',
    category: 'फर्श / टॉयलेट / घर की सफाई',
    subcategory: 'फर्श क्लीनर',
    canonicalNameHindi: 'लाइजोल फ्लोर क्लीनर',
    canonicalNameEnglish: 'Lizol Floor Cleaner',
    brand: 'Lizol',
    brandAliases: ['lizol', 'लाइजोल'],
    searchableAliases: ['लाइजोल', 'फ्लोर क्लीनर', 'फिनाइल', 'lizol', 'floor cleaner', 'phenyl'],
    commonSpokenNames: ['लाइजोल', 'lizol'],
    awadhiHindiAliases: ['लाइजोल', 'फिनाइल'],
    defaultUnits: ['बोतल', 'piece'],
    supportedUnits: ['बोतल', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 21. पेपर / टिश्यू / डिस्पोजेबल (Paper & Disposables)
  // =========================================================================
  {
    id: 'prod_aluminium_foil',
    category: 'पेपर / टिश्यू / डिस्पोजेबल',
    subcategory: 'फॉइल पेपर',
    canonicalNameHindi: 'एल्युमिनियम फॉयल',
    canonicalNameEnglish: 'Aluminium Foil Roll',
    searchableAliases: ['फॉइल', 'एल्युमिनियम फॉयल', 'रोटी लपेटने वाला पेपर', 'aluminium foil', 'foil paper'],
    commonSpokenNames: ['एल्युमिनियम फॉयल', 'foil paper'],
    awadhiHindiAliases: ['फॉइल'],
    defaultUnits: ['roll', 'piece'],
    supportedUnits: ['roll', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },

  // =========================================================================
  // 22. पूजा सामग्री (Puja Items)
  // =========================================================================
  {
    id: 'prod_agarbatti',
    category: 'पूजा सामग्री',
    subcategory: 'अगरबत्ती',
    canonicalNameHindi: 'अगरबत्ती',
    canonicalNameEnglish: 'Incense Sticks / Agarbatti',
    searchableAliases: ['अगरबत्ती', 'धूपबत्ती', 'अगरबती', 'agarbatti', 'incense sticks', 'dhoop', 'dhoopbatti'],
    commonSpokenNames: ['अगरबत्ती', 'agarbatti'],
    awadhiHindiAliases: ['अगरबत्ती', 'अगरबती'],
    defaultUnits: ['packet', 'डिब्बा'],
    supportedUnits: ['packet', 'डिब्बा'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_kapoor',
    category: 'पूजा सामग्री',
    subcategory: 'कपूर',
    canonicalNameHindi: 'कपूर',
    canonicalNameEnglish: 'Camphor / Kapoor',
    searchableAliases: ['कपूर', 'कपूर की टिकिया', 'भीमसेनी कपूर', 'kapoor', 'camphor'],
    commonSpokenNames: ['कपूर', 'kapoor'],
    awadhiHindiAliases: ['कपूर'],
    defaultUnits: ['डिब्बी', 'packet'],
    supportedUnits: ['डिब्बी', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_matchbox',
    category: 'पूजा सामग्री',
    subcategory: 'माचिस',
    canonicalNameHindi: 'माचिस',
    canonicalNameEnglish: 'Matchbox',
    searchableAliases: ['माचिस', 'दियासलाई', 'matchbox', 'machis', 'matches'],
    commonSpokenNames: ['माचिस', 'matchbox'],
    awadhiHindiAliases: ['माचिस', 'दियासलाई'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 23. बेबी केयर (Baby Care)
  // =========================================================================
  {
    id: 'prod_baby_diaper',
    category: 'बेबी केयर',
    subcategory: 'डायपर',
    canonicalNameHindi: 'बेबी डायपर',
    canonicalNameEnglish: 'Baby Diapers',
    searchableAliases: ['डायपर', 'पैम्पर्स', 'हग्गीज', 'diaper', 'baby diaper', 'pampers', 'huggies'],
    commonSpokenNames: ['डायपर', 'pampers', 'diaper'],
    awadhiHindiAliases: ['डायपर'],
    defaultUnits: ['packet', 'piece'],
    supportedUnits: ['packet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 24. स्टेशनरी (Stationery)
  // =========================================================================
  {
    id: 'prod_pen_ballpoint',
    category: 'स्टेशनरी',
    subcategory: 'पेन',
    canonicalNameHindi: 'बॉल पेन',
    canonicalNameEnglish: 'Ballpoint Pen',
    searchableAliases: ['पेन', 'बॉल पेन', 'कलम', 'pen', 'ball pen'],
    commonSpokenNames: ['पेन', 'pen'],
    awadhiHindiAliases: ['पेन', 'कलम'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 25. घरेलू / किचन उपयोगी सामान (Household Utilities)
  // =========================================================================
  {
    id: 'prod_mosquito_refill',
    category: 'घरेलू / किचन उपयोगी सामान',
    subcategory: 'मच्छर रोधी',
    canonicalNameHindi: 'ऑल आउट / गुड नाइट रिफिल',
    canonicalNameEnglish: 'All Out / Good Knight Mosquito Refill',
    brand: 'All Out',
    brandAliases: ['all out', 'ऑल आउट', 'good knight', 'गुड नाइट'],
    searchableAliases: ['ऑल आउट', 'गुड नाइट', 'मच्छर वाली अगरबत्ती', 'मच्छर दवा', 'all out', 'good knight', 'mosquito refill'],
    commonSpokenNames: ['ऑल आउट', 'गुड नाइट रिफिल'],
    awadhiHindiAliases: ['ऑल आउट'],
    defaultUnits: ['piece', 'packet'],
    supportedUnits: ['piece', 'packet'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 26. अगर दुकान में उपलब्ध हो तो फल / सब्जियां (Fresh Produce)
  // =========================================================================
  {
    id: 'prod_aloo',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'आलू',
    canonicalNameHindi: 'आलू',
    canonicalNameEnglish: 'Potato / Aloo',
    searchableAliases: ['आलू', 'आलु', 'बटाटा', 'potato', 'aloo', 'potatoes'],
    commonSpokenNames: ['आलू', 'aloo'],
    awadhiHindiAliases: ['आलू', 'आलु'],
    defaultUnits: ['kg'],
    supportedUnits: ['kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_pyaaz',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'प्याज',
    canonicalNameHindi: 'प्याज',
    canonicalNameEnglish: 'Onion / Pyaaz',
    searchableAliases: ['प्याज', 'प्यास', 'कांदा', 'onion', 'pyaaz', 'onions', 'pyaz', 'pyaj', 'piyaj'],
    commonSpokenNames: ['प्याज', 'pyaaz', 'pyaj'],
    awadhiHindiAliases: ['पियाज', 'प्याज', 'कांदा', 'pyaj'],
    defaultUnits: ['kg'],
    supportedUnits: ['kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_tamatar',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'टमाटर',
    canonicalNameHindi: 'टमाटर',
    canonicalNameEnglish: 'Tomato / Tamatar',
    searchableAliases: ['टमाटर', 'tamatar', 'tomato', 'tomatoes'],
    commonSpokenNames: ['टमाटर', 'tamatar'],
    awadhiHindiAliases: ['टमाटर'],
    defaultUnits: ['kg'],
    supportedUnits: ['kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: false,
    isActive: true,
  },
  {
    id: 'prod_hari_dhaniya',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'धनिया पत्ती',
    canonicalNameHindi: 'हरा धनिया',
    canonicalNameEnglish: 'Fresh Coriander / Hari Dhaniya',
    searchableAliases: [
      'हरा धनिया',
      'हरी धनिया',
      'धनिया पत्ती',
      'धनिया पत्ता',
      'हरी पत्ती धनिया',
      'धनिया हरी पत्ती',
      'hari dhaniya',
      'hara dhaniya',
      'dhaniya patti',
      'hari patti dhaniya',
      'hari dhaniya patti',
      'dhaniya hari patti',
      'fresh coriander',
      'coriander leaves',
      'kothmir',
      'कोथमीर'
    ],
    commonSpokenNames: ['हरा धनिया', 'हरी धनिया', 'hari dhaniya', 'hara dhaniya', 'धनिया पत्ती', 'hari patti dhaniya', 'हरी पत्ती धनिया'],
    awadhiHindiAliases: ['हरी धनिया', 'हरा धनिया', 'धनिया पत्ती', 'हरी पत्ती धनिया'],
    defaultUnits: ['packet', 'gram'],
    supportedUnits: ['packet', 'gram', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_hari_mirch',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'हरी मिर्च',
    canonicalNameHindi: 'हरी मिर्च',
    canonicalNameEnglish: 'Green Chilli / Hari Mirch',
    searchableAliases: [
      'हरी मिर्च',
      'हरी मिरचा',
      'मिर्ची',
      'तीखी मिर्च',
      'hari mirch',
      'green chilli',
      'green chili',
      'mirchi',
      'hari mirchi'
    ],
    commonSpokenNames: ['हरी मिर्च', 'hari mirch', 'mirchi'],
    awadhiHindiAliases: ['हरी मिरचा', 'मिरचा', 'हरी मिर्च'],
    defaultUnits: ['gram', 'packet'],
    supportedUnits: ['gram', 'packet', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_adrak',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'अदरक',
    canonicalNameHindi: 'अदरक',
    canonicalNameEnglish: 'Ginger / Adrak',
    searchableAliases: ['अदरक', 'अदी', 'adrak', 'ginger', 'aadi'],
    commonSpokenNames: ['अदरक', 'adrak'],
    awadhiHindiAliases: ['अदी', 'अदरक'],
    defaultUnits: ['gram', 'पाव'],
    supportedUnits: ['gram', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_lahsun',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'लहसुन',
    canonicalNameHindi: 'लहसुन',
    canonicalNameEnglish: 'Garlic / Lahsun',
    searchableAliases: ['लहसुन', 'लहसन', 'garlic', 'lahsun', 'lehsun'],
    commonSpokenNames: ['लहसुन', 'lahsun'],
    awadhiHindiAliases: ['लहसुन', 'लहसन'],
    defaultUnits: ['gram', 'पाव'],
    supportedUnits: ['gram', 'kg', 'पाव'],
    supportsWeight: true,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  {
    id: 'prod_nimbu',
    category: 'अगर दुकान में उपलब्ध हो तो फल / सब्जियां',
    subcategory: 'नींबू',
    canonicalNameHindi: 'नींबू',
    canonicalNameEnglish: 'Lemon / Nimbu',
    searchableAliases: ['नींबू', 'निम्बू', 'lemon', 'nimbu', 'lemons'],
    commonSpokenNames: ['नींबू', 'nimbu'],
    awadhiHindiAliases: ['नींबू', 'नेबू'],
    defaultUnits: ['piece'],
    supportedUnits: ['piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },

  // =========================================================================
  // 27. अन्य सामान्य किराना / जनरल स्टोर सामान (Other Kirana Items)
  // =========================================================================
  {
    id: 'prod_eno',
    category: 'अन्य सामान्य किराना / जनरल स्टोर सामान',
    subcategory: 'एंटासिड',
    canonicalNameHindi: 'इनो पाउच',
    canonicalNameEnglish: 'Eno Fruit Salt Sachet',
    brand: 'Eno',
    brandAliases: ['eno', 'इनो'],
    searchableAliases: ['इनो', 'eno', 'eno sachet', 'eno pouch'],
    commonSpokenNames: ['इनो', 'eno'],
    awadhiHindiAliases: ['इनो'],
    defaultUnits: ['packet', 'sachet', 'piece'],
    supportedUnits: ['packet', 'sachet', 'piece'],
    supportsWeight: false,
    supportsPieceQuantity: true,
    supportsPriceVariant: true,
    isActive: true,
  },
  ...EXTENDED_KIRANA_CATALOG,
  ...INDIAN_MARKET_CATALOG,
];

// =========================================================================
// CATALOG MATCHING & BOUNDARY SEPARATION UTILITIES
// =========================================================================

/**
 * Returns all active master products from the catalog
 */
export const getAllMasterCatalogProducts = (): KiranaMasterProduct[] => {
  return MASTER_KIRANA_CATALOG.filter((p) => p.isActive);
};

/**
 * Normalizes text for alias matching (lowercase, whitespace collapse, punctuation trim)
 */
export const normalizeCatalogQuery = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .replace(/[,\.\-\+\/\:\;\"\'\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Recognized Kirana Brands registry with exact canonical English and Hindi names.
 */
export interface RecognizedKiranaBrand {
  name: string;
  hindiName: string;
  aliases: string[];
}

export const RECOGNIZED_KIRANA_BRANDS: RecognizedKiranaBrand[] = [
  { name: 'Everest', hindiName: 'एवरेस्ट', aliases: ['everest', 'एवरेस्ट'] },
  { name: 'Rajesh', hindiName: 'राजेश', aliases: ['rajesh', 'राजेश'] },
  { name: 'MDH', hindiName: 'एमडीएच', aliases: ['mdh', 'एमडीएच'] },
  { name: 'Catch', hindiName: 'कैच', aliases: ['catch', 'कैच'] },
  { name: 'Tata', hindiName: 'टाटा', aliases: ['tata', 'टाटा'] },
  { name: 'Red Label', hindiName: 'रेड लेबल', aliases: ['red label', 'रेड लेबल', 'brooke bond'] },
  { name: 'Fortune', hindiName: 'फॉर्च्यून', aliases: ['fortune', 'फॉर्च्यून'] },
  { name: 'Patanjali', hindiName: 'पतंजलि', aliases: ['patanjali', 'पतंजलि'] },
  { name: 'Parle-G', hindiName: 'पारले-जी', aliases: ['parle-g', 'parle g', 'पारले जी', 'पारलेजी', 'parle'] },
  { name: 'Good Day', hindiName: 'गुड डे', aliases: ['good day', 'goodday', 'गुड डे', 'गुडडे'] },
  { name: 'Marie Gold', hindiName: 'मैरी गोल्ड', aliases: ['marie gold', 'mariegold', 'मैरी गोल्ड', 'मेरी गोल्ड'] },
  { name: 'Maggi', hindiName: 'मैगी', aliases: ['maggi', 'मैगी'] },
  { name: 'Dove', hindiName: 'डव', aliases: ['dove', 'डव', 'डोव'] },
  { name: 'Clinic Plus', hindiName: 'क्लिनिक प्लस', aliases: ['clinic plus', 'clinicplus', 'क्लिनिक प्लस', 'क्लीनिक प्लस'] },
  { name: 'Sunsilk', hindiName: 'सनसिल्क', aliases: ['sunsilk', 'सनसिल्क'] },
  { name: 'Head & Shoulders', hindiName: 'हेड एंड शोल्डर्स', aliases: ['head and shoulders', 'head & shoulders', 'हेड एंड शोल्डर', 'हेड एंड शोल्डर्स'] },
  { name: 'Pantene', hindiName: 'पैंटीन', aliases: ['pantene', 'पैंटीन'] },
  { name: 'Santoor', hindiName: 'संतूर', aliases: ['santoor', 'संतूर', 'santur'] },
  { name: 'Santosh', hindiName: 'संतोष', aliases: ['santosh', 'संतोष', 'santhosh'] },
  { name: 'Lifebuoy', hindiName: 'लाइफबॉय', aliases: ['lifebuoy', 'लाइफबॉय'] },
  { name: 'Lux', hindiName: 'लक्स', aliases: ['lux', 'लक्स'] },
  { name: 'Dettol', hindiName: 'डेटॉल', aliases: ['dettol', 'डेटॉल', 'डिटॉल'] },
  { name: 'Nirma', hindiName: 'निरमा', aliases: ['nirma', 'निरमा'] },
  { name: 'Surf Excel', hindiName: 'सर्फ एक्सेल', aliases: ['surf excel', 'सर्फ एक्सेल', 'surf', 'सर्फ'] },
  { name: 'Tide', hindiName: 'टाइड', aliases: ['tide', 'टाइड'] },
  { name: 'Wheel', hindiName: 'व्हील', aliases: ['wheel', 'व्हील'] },
  { name: 'Ghadi', hindiName: 'घड़ी', aliases: ['ghadi', 'घड़ी'] },
  { name: 'Rin', hindiName: 'रिन', aliases: ['rin', 'रिन'] },
  { name: 'Vim', hindiName: 'विम', aliases: ['vim', 'विम'] },
  { name: 'Exo', hindiName: 'एक्सो', aliases: ['exo', 'एक्सो'] },
  { name: 'Colgate', hindiName: 'कोलगेट', aliases: ['colgate', 'कोलगेट'] },
  { name: 'Pepsodent', hindiName: 'पेप्सोडेंट', aliases: ['pepsodent', 'पेप्सोडेंट'] },
  { name: 'Closeup', hindiName: 'क्लोजअप', aliases: ['closeup', 'क्लोजअप', 'क्लोज़अप'] },
  { name: 'Dabur', hindiName: 'डाबर', aliases: ['dabur', 'डाबर'] },
  { name: 'Aashirvaad', hindiName: 'आशीर्वाद', aliases: ['aashirvaad', 'आशीर्वाद'] },
  { name: 'Amul', hindiName: 'अमूल', aliases: ['amul', 'अमूल'] },
  { name: 'Haldiram', hindiName: 'हल्दीराम', aliases: ['haldiram', 'हल्दीराम'] },
  { name: 'Lays', hindiName: 'लेज़', aliases: ['lays', 'लेज़', 'लेज'] },
  { name: 'Kurkure', hindiName: 'कुरकुरे', aliases: ['kurkure', 'कुरकुरे'] },
  { name: 'Harpic', hindiName: 'हार्पिक', aliases: ['harpic', 'हार्पिक'] },
  { name: 'Lizol', hindiName: 'लाइजोल', aliases: ['lizol', 'लाइजोल'] },
  { name: 'Eno', hindiName: 'ईनो', aliases: ['eno', 'ईनो', 'इनो'] },
  { name: 'Goldiee', hindiName: 'गोल्डी', aliases: ['goldiee', 'goldy', 'गोल्डी'] },
  { name: 'Rakesh', hindiName: 'राकेश', aliases: ['rakesh', 'राकेश'] },
  { name: 'Badshah', hindiName: 'बादशाह', aliases: ['badshah', 'बादशाह'] },
  { name: 'Britannia', hindiName: 'ब्रिटानिया', aliases: ['britannia', 'ब्रिटानिया'] },
  { name: 'Parle', hindiName: 'पारले', aliases: ['parle', 'पारले'] },
  { name: 'ITC', hindiName: 'आईटीसी', aliases: ['itc', 'sunfeast', 'सनफीस्ट'] },
  { name: 'Cadbury', hindiName: 'कैडबरी', aliases: ['cadbury', 'कैडबरी'] },
  { name: 'Nestle', hindiName: 'नेस्ले', aliases: ['nestle', 'नेस्ले'] },
  { name: 'Wagh Bakri', hindiName: 'वाघ बकरी', aliases: ['wagh bakri', 'वाघ बकरी'] },
  { name: 'Taj Mahal', hindiName: 'ताज महल', aliases: ['taj mahal', 'tajmahal', 'ताज महल'] },
  { name: 'Kissan', hindiName: 'किसान', aliases: ['kissan', 'किसान'] },
  { name: 'Chings', hindiName: 'चिंग्स', aliases: ['chings', 'ching secret', 'चिंग्स'] },
  { name: 'Nutrela', hindiName: 'न्यूट्रेला', aliases: ['nutrela', 'न्यूट्रेला'] },
  { name: 'Lijjat', hindiName: 'लिज्जत', aliases: ['lijjat', 'लिज्जत'] },
  { name: 'Cinthol', hindiName: 'सिंथॉल', aliases: ['cinthol', 'सिंथॉल'] },
  { name: 'Godrej No. 1', hindiName: 'गोदरेज नंबर 1', aliases: ['godrej no 1', 'गोदरेज नंबर 1', 'गोदरेज'] },
  { name: 'Medimix', hindiName: 'मेडीमिक्स', aliases: ['medimix', 'मेडीमिक्स'] },
  { name: 'Pears', hindiName: 'पेयर्स', aliases: ['pears', 'पेयर्स'] },
  { name: 'Chik', hindiName: 'चिक', aliases: ['chik', 'चिक'] },
  { name: 'Savlon', hindiName: 'सैवलॉन', aliases: ['savlon', 'सैवलॉन'] },
  { name: 'Sensodyne', hindiName: 'सेंसोडाइन', aliases: ['sensodyne', 'सेंसोडाइन'] },
  { name: 'Parachute', hindiName: 'पैराशूट', aliases: ['parachute', 'पैराशूट'] },
  { name: 'Boroline', hindiName: 'बोरोलीन', aliases: ['boroline', 'बोरोलीन'] },
  { name: 'BoroPlus', hindiName: 'बोरोप्लस', aliases: ['boroplus', 'बोरोप्लस'] },
  { name: 'Vaseline', hindiName: 'वैसलीन', aliases: ['vaseline', 'वैसलीन'] },
  { name: 'Fair & Lovely', hindiName: 'फेयर एंड लवली', aliases: ['fair and lovely', 'fair & lovely', 'glow and lovely', 'glow & lovely', 'फेयर एंड लवली', 'ग्लो एंड लवली'] },
  { name: 'Ponds', hindiName: 'पांड्स', aliases: ['ponds', 'पांड्स', 'पोंड्स'] },
  { name: 'Ariel', hindiName: 'एरियल', aliases: ['ariel', 'एरियल'] },
  { name: 'Ujala', hindiName: 'उजाला', aliases: ['ujala', 'उजाला'] },
  { name: 'Comfort', hindiName: 'कम्फर्ट', aliases: ['comfort', 'कम्फर्ट'] },
  { name: 'Colin', hindiName: 'कॉलिन', aliases: ['colin', 'कॉलिन'] },
  { name: 'Good Knight', hindiName: 'गुड नाईट', aliases: ['good knight', 'गुड नाईट'] },
  { name: 'All Out', hindiName: 'ऑल आउट', aliases: ['all out', 'ऑल आउट'] },
  { name: 'Odonil', hindiName: 'ओडोनिल', aliases: ['odonil', 'ओडोनिल'] },
  { name: 'Cycle', hindiName: 'साइकिल', aliases: ['cycle', 'साइकिल'] },
  { name: 'Mangaldeep', hindiName: 'मंगलदीप', aliases: ['mangaldeep', 'मंगलदीप'] },
  { name: 'Pampers', hindiName: 'पैम्पर्स', aliases: ['pampers', 'पैम्पर्स'] },
  { name: 'MamyPoko', hindiName: 'मैमीपोको', aliases: ['mamypoko', 'मैमीपोको'] },
  { name: 'Whisper', hindiName: 'व्हिस्पर', aliases: ['whisper', 'व्हिस्पर'] },
  { name: 'Stayfree', hindiName: 'स्टेफ्री', aliases: ['stayfree', 'स्टेफ्री'] },
  { name: 'Fevicol', hindiName: 'फेविकोल', aliases: ['fevicol', 'फेविकोल'] },
];

/**
 * Lookup table building: sorted by alias character length descending so that
 * longer / more specific products match first (e.g. "चना दाल" before "दाल",
 * "राजेश मीट मसाला" before "मसाला", "क्लिनिक प्लस शैंपू" before "शैंपू").
 */
interface CompiledCatalogEntry {
  alias: string;
  normalizedAlias: string;
  product: KiranaMasterProduct;
  isBrandSpecific: boolean;
}

const buildCompiledCatalog = (): CompiledCatalogEntry[] => {
  const list: CompiledCatalogEntry[] = [];
  const registeredAliases = new Set<string>();

  const addEntry = (alias: string, prod: KiranaMasterProduct, isBrand: boolean) => {
    const norm = normalizeCatalogQuery(alias);
    if (norm.length >= 2 && !registeredAliases.has(norm)) {
      registeredAliases.add(norm);
      list.push({
        alias,
        normalizedAlias: norm,
        product: prod,
        isBrandSpecific: isBrand,
      });
    }
  };

  // 1. Specific Brand + Masala / Staple compound combinations
  const brandMasalaCombos: {
    brand: RecognizedKiranaBrand;
    baseProduct: KiranaMasterProduct;
    aliases: string[];
  }[] = [];

  const sabjiMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_sabji_masala')!;
  const garamMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_garam_masala')!;
  const meatMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_meat_masala')!;
  const chanaMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_chana_masala')!;
  const chickenMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_chicken_masala')!;
  const chaatMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_chaat_masala')!;
  const pavBhajiMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_pav_bhaji_masala')!;
  const paneerMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_paneer_masala')!;
  const kitchenKing = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_kitchen_king')!;
  const sambarMasala = MASTER_KIRANA_CATALOG.find((p) => p.id === 'prod_sambar_masala')!;

  const everestBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Everest')!;
  const rajeshBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Rajesh')!;
  const mdhBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'MDH')!;
  const catchBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Catch')!;
  const goldieeBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Goldiee');
  const rakeshBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Rakesh');
  const badshahBrand = RECOGNIZED_KIRANA_BRANDS.find((b) => b.name === 'Badshah');

  // Everest Sabji Masala
  if (everestBrand && sabjiMasala) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...sabjiMasala,
        id: 'prod_everest_sabji_masala',
        brand: 'Everest',
        canonicalNameHindi: 'Everest सब्जी मसाला',
        canonicalNameEnglish: 'Everest Sabji Masala',
      },
      aliases: [
        'everest sabji masala',
        'everest sabzi masala',
        'everest sabjee masala',
        'everest सब्जी मसाला',
        'एवरेस्ट सब्जी मसाला',
        'एवरेस्ट का सब्जी मसाला',
      ],
    });
  }

  // Rajesh Meat Masala
  if (rajeshBrand && meatMasala) {
    brandMasalaCombos.push({
      brand: rajeshBrand,
      baseProduct: {
        ...meatMasala,
        id: 'prod_rajesh_meat_masala',
        brand: 'Rajesh',
        canonicalNameHindi: 'राजेश मीट मसाला',
        canonicalNameEnglish: 'Rajesh Meat Masala',
      },
      aliases: [
        'rajesh meat masala',
        'rajesh meet masala',
        'rajesh meat masala packet',
        'rajesh मीट मसाला',
        'राजेश मीट मसाला',
        'राजेश का मीट मसाला',
      ],
    });
  }

  // Rajesh Masala (General)
  if (rajeshBrand) {
    brandMasalaCombos.push({
      brand: rajeshBrand,
      baseProduct: {
        id: 'prod_rajesh_masala',
        category: 'मसाले / साबुत मसाले / मसाला पैक',
        subcategory: 'ब्रांडेड मसाला',
        canonicalNameHindi: 'राजेश मसाला',
        canonicalNameEnglish: 'Rajesh Masala',
        brand: 'Rajesh',
        searchableAliases: ['राजेश मसाला', 'rajesh masala'],
        commonSpokenNames: ['राजेश मसाला', 'rajesh masala'],
        awadhiHindiAliases: ['राजेश मसाला'],
        defaultUnits: ['packet', 'piece'],
        supportedUnits: ['packet', 'piece'],
        supportsWeight: false,
        supportsPieceQuantity: true,
        supportsPriceVariant: true,
        isActive: true,
      },
      aliases: [
        'rajesh masala',
        'राजेश मसाला',
        'rajesh masla',
        'rajesh ka masala',
        'राजेश का मसाला',
      ],
    });
  }

  // Everest Garam Masala
  if (everestBrand && garamMasala) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...garamMasala,
        id: 'prod_everest_garam_masala',
        brand: 'Everest',
        canonicalNameHindi: 'Everest गरम मसाला',
        canonicalNameEnglish: 'Everest Garam Masala',
      },
      aliases: [
        'everest garam masala',
        'everest garam masla',
        'everest गरम मसाला',
        'एवरेस्ट गरम मसाला',
        'एवरेस्ट का गरम मसाला',
      ],
    });
  }

  // MDH Chana Masala
  if (mdhBrand && chanaMasala) {
    brandMasalaCombos.push({
      brand: mdhBrand,
      baseProduct: {
        ...chanaMasala,
        id: 'prod_mdh_chana_masala',
        brand: 'MDH',
        canonicalNameHindi: 'MDH चना मसाला',
        canonicalNameEnglish: 'MDH Chana Masala',
      },
      aliases: [
        'mdh chana masala',
        'mdh chole masala',
        'mdh chhole masala',
        'mdh चना मसाला',
        'mdh छोले मसाला',
        'एमडीएच चना मसाला',
        'एमडीएच छोले मसाला',
      ],
    });
  }

  // Rajesh Sabji Masala
  if (rajeshBrand && sabjiMasala) {
    brandMasalaCombos.push({
      brand: rajeshBrand,
      baseProduct: {
        ...sabjiMasala,
        id: 'prod_rajesh_sabji_masala',
        brand: 'Rajesh',
        canonicalNameHindi: 'Rajesh सब्जी मसाला',
        canonicalNameEnglish: 'Rajesh Sabji Masala',
      },
      aliases: [
        'rajesh sabji masala',
        'rajesh sabzi masala',
        'rajesh सब्जी मसाला',
        'राजेश सब्जी मसाला',
      ],
    });
  }

  // MDH Garam Masala
  if (mdhBrand && garamMasala) {
    brandMasalaCombos.push({
      brand: mdhBrand,
      baseProduct: {
        ...garamMasala,
        id: 'prod_mdh_garam_masala',
        brand: 'MDH',
        canonicalNameHindi: 'MDH गरम मसाला',
        canonicalNameEnglish: 'MDH Garam Masala',
      },
      aliases: [
        'mdh garam masala',
        'mdh गरम मसाला',
        'एमडीएच गरम मसाला',
      ],
    });
  }

  // Catch Sabji Masala & Catch Chat Masala
  if (catchBrand && sabjiMasala) {
    brandMasalaCombos.push({
      brand: catchBrand,
      baseProduct: {
        ...sabjiMasala,
        id: 'prod_catch_sabji_masala',
        brand: 'Catch',
        canonicalNameHindi: 'Catch सब्जी मसाला',
        canonicalNameEnglish: 'Catch Sabji Masala',
      },
      aliases: [
        'catch sabji masala',
        'catch sabzi masala',
        'catch सब्जी मसाला',
        'कैच सब्जी मसाला',
      ],
    });
  }
  if (catchBrand && chaatMasala) {
    brandMasalaCombos.push({
      brand: catchBrand,
      baseProduct: {
        ...chaatMasala,
        id: 'prod_catch_chaat_masala',
        brand: 'Catch',
        canonicalNameHindi: 'Catch चाट मसाला',
        canonicalNameEnglish: 'Catch Chaat Masala',
      },
      aliases: [
        'catch chat masala',
        'catch chaat masala',
        'catch चाट मसाला',
        'कैच चाट मसाला',
      ],
    });
  }

  // Everest Chana Masala, Chicken Masala, Pav Bhaji, Kitchen King
  if (everestBrand && chanaMasala) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...chanaMasala,
        id: 'prod_everest_chana_masala',
        brand: 'Everest',
        canonicalNameHindi: 'Everest चना मसाला',
        canonicalNameEnglish: 'Everest Chana Masala',
      },
      aliases: ['everest chana masala', 'everest chole masala', 'everest चना मसाला', 'एवरेस्ट चना मसाला'],
    });
  }
  if (everestBrand && chickenMasala) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...chickenMasala,
        id: 'prod_everest_chicken_masala',
        brand: 'Everest',
        canonicalNameHindi: 'Everest चिकन मसाला',
        canonicalNameEnglish: 'Everest Chicken Masala',
      },
      aliases: ['everest chicken masala', 'everest चिकन मसाला', 'एवरेस्ट चिकन मसाला'],
    });
  }
  if (everestBrand && pavBhajiMasala) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...pavBhajiMasala,
        id: 'prod_everest_pav_bhaji_masala',
        brand: 'Everest',
        canonicalNameHindi: 'Everest पाव भाजी मसाला',
        canonicalNameEnglish: 'Everest Pav Bhaji Masala',
      },
      aliases: ['everest pav bhaji masala', 'everest पाव भाजी मसाला', 'एवरेस्ट पाव भाजी मसाला'],
    });
  }
  if (everestBrand && kitchenKing) {
    brandMasalaCombos.push({
      brand: everestBrand,
      baseProduct: {
        ...kitchenKing,
        id: 'prod_everest_kitchen_king',
        brand: 'Everest',
        canonicalNameHindi: 'Everest किचन किंग मसाला',
        canonicalNameEnglish: 'Everest Kitchen King Masala',
      },
      aliases: ['everest kitchen king', 'everest kitchen king masala', 'everest किचन किंग', 'एवरेस्ट किचन किंग'],
    });
  }

  // Goldiee Masalas
  if (goldieeBrand && sabjiMasala) {
    brandMasalaCombos.push({
      brand: goldieeBrand,
      baseProduct: {
        ...sabjiMasala,
        id: 'prod_goldiee_sabji_masala',
        brand: 'Goldiee',
        canonicalNameHindi: 'Goldiee सब्जी मसाला',
        canonicalNameEnglish: 'Goldiee Sabji Masala',
      },
      aliases: ['goldiee sabji masala', 'goldy sabji masala', 'गोल्डी सब्जी मसाला', 'गोल्डी का सब्जी मसाला'],
    });
  }
  if (goldieeBrand && meatMasala) {
    brandMasalaCombos.push({
      brand: goldieeBrand,
      baseProduct: {
        ...meatMasala,
        id: 'prod_goldiee_meat_masala',
        brand: 'Goldiee',
        canonicalNameHindi: 'Goldiee मीट मसाला',
        canonicalNameEnglish: 'Goldiee Meat Masala',
      },
      aliases: ['goldiee meat masala', 'goldy meat masala', 'गोल्डी मीट मसाला', 'गोल्डी का मीट मसाला'],
    });
  }
  if (goldieeBrand && garamMasala) {
    brandMasalaCombos.push({
      brand: goldieeBrand,
      baseProduct: {
        ...garamMasala,
        id: 'prod_goldiee_garam_masala',
        brand: 'Goldiee',
        canonicalNameHindi: 'Goldiee गरम मसाला',
        canonicalNameEnglish: 'Goldiee Garam Masala',
      },
      aliases: ['goldiee garam masala', 'goldy garam masala', 'गोल्डी गरम मसाला'],
    });
  }

  // Rakesh Masalas
  if (rakeshBrand && sabjiMasala) {
    brandMasalaCombos.push({
      brand: rakeshBrand,
      baseProduct: {
        ...sabjiMasala,
        id: 'prod_rakesh_sabji_masala',
        brand: 'Rakesh',
        canonicalNameHindi: 'Rakesh सब्जी मसाला',
        canonicalNameEnglish: 'Rakesh Sabji Masala',
      },
      aliases: ['rakesh sabji masala', 'राकेश सब्जी मसाला', 'राकेश का सब्जी मसाला'],
    });
  }
  if (rakeshBrand && meatMasala) {
    brandMasalaCombos.push({
      brand: rakeshBrand,
      baseProduct: {
        ...meatMasala,
        id: 'prod_rakesh_meat_masala',
        brand: 'Rakesh',
        canonicalNameHindi: 'Rakesh मीट मसाला',
        canonicalNameEnglish: 'Rakesh Meat Masala',
      },
      aliases: ['rakesh meat masala', 'राकेश मीट मसाला', 'राकेश का मीट मसाला'],
    });
  }

  // Badshah Masalas
  if (badshahBrand && garamMasala) {
    brandMasalaCombos.push({
      brand: badshahBrand,
      baseProduct: {
        ...garamMasala,
        id: 'prod_badshah_garam_masala',
        brand: 'Badshah',
        canonicalNameHindi: 'Badshah गरम मसाला',
        canonicalNameEnglish: 'Badshah Garam Masala',
      },
      aliases: ['badshah garam masala', 'badshah rajwadi garam masala', 'बादशाह गरम मसाला'],
    });
  }

  // Register all brand masala combos first (highest priority)
  for (const combo of brandMasalaCombos) {
    for (const a of combo.aliases) {
      addEntry(a, combo.baseProduct, true);
    }
  }

  // 2. Register all master catalog products
  for (const prod of MASTER_KIRANA_CATALOG) {
    const allAliases = new Set<string>([
      prod.canonicalNameHindi,
      prod.canonicalNameEnglish,
      ...prod.searchableAliases,
      ...(prod.brandAliases || []),
      ...prod.commonSpokenNames,
      ...prod.awadhiHindiAliases,
    ]);

    for (const a of allAliases) {
      addEntry(a, prod, !!prod.brand);
    }
  }

  // Sort descending by normalized length to match the most specific product first
  list.sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);
  return list;
};

const COMPILED_CATALOG = buildCompiledCatalog();

/**
 * Match a text fragment against the master catalog.
 * Returns the matched KiranaMasterProduct and exact matched alias.
 */
export const matchKiranaMasterProduct = (
  text: string
): { product: KiranaMasterProduct; matchedAlias: string } | null => {
  if (!text || text.trim().length < 2) return null;
  const norm = normalizeCatalogQuery(text);

  // 1. Exact alias match (canonical product names, searchable aliases, Hindi/English, transliterations)
  for (const entry of COMPILED_CATALOG) {
    if (norm === entry.normalizedAlias) {
      return { product: entry.product, matchedAlias: entry.alias };
    }
  }

  // 2. Exact match after stripping connecting prepositions & completion verbs ("का", "की", "के", "वाला", "दे दो", "चाहिए")
  const strippedNorm = norm
    .replace(/(?:^|[^\p{L}\p{M}\p{N}])(दे दो|दे दा|देइ दा|चाहिए|मुझे चाहिए|दीजिए|दीजिये|bhai|bhaiya|de do|chahiye)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ')
    .replace(/(?:^|[^\p{L}\p{M}\p{N}])(का|की|के|ka|ki|ke|वाला|वाली|वाले|wala|wali|wale)(?=[^\p{L}\p{M}\p{N}]|$)/gui, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (strippedNorm && strippedNorm !== norm) {
    for (const entry of COMPILED_CATALOG) {
      if (strippedNorm === entry.normalizedAlias) {
        return { product: entry.product, matchedAlias: entry.alias };
      }
    }
  }

  // 3. Substring match with strict remainder validation:
  // If the query contains entry.normalizedAlias, the remaining text MUST consist ONLY of fillers/courtesy/quantity words.
  // If the remaining text contains substantive unknown words (e.g. "संतोष" in "संतोष साबुन", "हमारा" in "हमारा सामान"),
  // DO NOT match! Never guess or collapse a distinct brand/item into a generic product.
  for (const entry of COMPILED_CATALOG) {
    const escaped = entry.normalizedAlias.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s])${escaped}(?:$|[\\s])`, 'i');
    if (regex.test(norm)) {
      const remainder = norm.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      if (!remainder || remainder.length < 2) {
        return { product: entry.product, matchedAlias: entry.alias };
      }
      const isFillerRemainder = /^(?:भाई|भैया|जी|अरे|सुनो|दे दो|दे दा|चाहिए|मुझे चाहिए|दीजिए|दीजिये|bhai|bhaiya|de do|chahiye|का|की|के|ka|ki|ke|वाला|वाली|वाले|ek|do|एक|दो|किलो|पैकेट|packet|kg|ग्राम|gram|लीटर|liter|l|\d+)+$/ui.test(
        remainder.replace(/\s+/g, '')
      );
      if (isFillerRemainder) {
        return { product: entry.product, matchedAlias: entry.alias };
      }
    }
  }

  return null;
};

/**
 * Splits a long spoken utterance containing multiple products into individual item phrases
 * by identifying catalog product boundaries, quantities, weights, units, and conjunctions.
 *
 * Example:
 * "सूजी 1 किलो 1 किलो चना दाल" -> ["सूजी 1 किलो", "1 किलो चना दाल"]
 * "1 किलो सूजी 1 किलो चना दाल और 1 किलो मैदा" -> ["1 किलो सूजी", "1 किलो चना दाल", "1 किलो मैदा"]
 * "एक पाव सूजी एक पाव काजू एक पाव मैदा एक पाव बादाम" -> ["एक पाव सूजी", "एक पाव काजू", "एक पाव मैदा", "एक पाव बादाम"]
 */
export const splitUtteranceByCatalogBoundaries = (rawText: string): string[] => {
  if (!rawText || rawText.trim().length === 0) return [];

  let text = rawText.trim();

  // 1. Clean introductory fillers & normalize speech recognition artifacts like Chinese numeral 一 to Hindi "एक"
  text = text.replace(/^(भाई|भैया|भइया|जी|अरे भाई|अरे|सुनो|bhai|bhaiya|are|suno)\s*/gi, '');
  text = text.replace(/(?:^|[^\p{L}\p{M}\p{N}])[\u4e00一—–-](?=\s*(?:किलो|kg|kilo|लीटर|दर्जन|पैकेट|ग्राम|पीस|प्लेट|[a-zA-Z\u0900-\u097F]+))/gui, ' एक ');

  // 2. Primary split by natural conjunctions & punctuation
  const initialClauses = text
    .split(/(?:\s+(?:और|तथा|एवं|aur|tatha|also|bhi|va|evam)\s+|[,\n\r\t]+|\s+भी\s+)/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const finalClauses: string[] = [];
  const starterRegex = /(?:(?:^|[^\p{L}\p{M}\p{N}])(?:\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|darjan|dozen|दर्जन|plate|plates|प्लेट|packet|packets|पैकेट|पैक|piece|pieces|pcs|पीस|नग|litre|liter|ltr|लीटर|bottle|bottles|बोतल|box|boxes|डिब्बा)|(?:^|[^\p{L}\p{M}\p{N}])(?:\d+|ek|do|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच)\s*(?:half|full|हाफ|फुल)\s*(?:plate|plates|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो|darjan|dozen|दर्जन|litre|लीटर|plate|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:dedh|dhai|डेढ़|ढाई|सवा|पौन)\s*(?:kilo|kg|किलो)|(?:^|[^\p{L}\p{M}\p{N}])(?:half|full|हाफ|फुल)\s*(?:plate|plates|प्लेट)|(?:^|[^\p{L}\p{M}\p{N}])(?:(?:ek|एक)\s+)?(?:paav|pao|पाव)|(?:(?:₹|rs\.?|रुपये?|रु)\s*\d+|\d+\s*(?:रुपये?|rupaye?|rs|rupees?))\s*(?:ka|ki|ke|वाला|वाली|वाले)?|(?:^|[^\p{L}\p{M}\p{N}])(?:\d+|ek|do|dui|teen|char|chaar|paanch|panch|एक|दो|दुई|तीन|चार|पांच|पाँच)\s*(?:piece|pieces|pcs|पीस)?\s+[a-zA-Z\u0900-\u097F]+)/gui;

  for (const clause of initialClauses) {
    const matches = [...clause.matchAll(starterRegex)];
    if (matches.length > 1) {
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
          finalClauses.push(prevSegment);
          lastCut = matchIdx;
        }
      }
      const tail = clause.substring(lastCut).trim();
      if (tail) finalClauses.push(tail);
    } else {
      // If clause has multiple distinct catalog products, split them!
      const subSegments = splitSingleClauseByProducts(clause);
      finalClauses.push(...subSegments);
    }
  }

  return finalClauses.filter((c) => c.length > 0);
};

/**
 * Examines a single clause to see if multiple catalog products are conjoined without a pause,
 * e.g. "सूजी 1 किलो 1 किलो चना दाल" or "एक पाव सूजी एक पाव काजू"
 */
function splitSingleClauseByProducts(clause: string): string[] {
  if (!clause || clause.trim().length < 4) return [clause];

  // Find all matches of known products in the clause
  const lower = normalizeCatalogQuery(clause);
  const foundProducts: { start: number; end: number; product: KiranaMasterProduct }[] = [];

  for (const entry of COMPILED_CATALOG) {
    let searchPos = 0;
    while (searchPos < lower.length) {
      const idx = lower.indexOf(entry.normalizedAlias, searchPos);
      if (idx === -1) break;

      // Check word boundary: character before idx (if any) and after idx + len (if any) must be whitespace or punctuation
      const prevChar = idx > 0 ? lower[idx - 1] : ' ';
      const nextChar = idx + entry.normalizedAlias.length < lower.length ? lower[idx + entry.normalizedAlias.length] : ' ';
      const isWordBounded = /[\s,।\.\-\+\/]/.test(prevChar) && /[\s,।\.\-\+\/]/.test(nextChar);

      if (isWordBounded) {
        // Check if already covered by an existing longer match
        const overlaps = foundProducts.some((p) => Math.max(idx, p.start) < Math.min(idx + entry.normalizedAlias.length, p.end));
        if (!overlaps) {
          foundProducts.push({
            start: idx,
            end: idx + entry.normalizedAlias.length,
            product: entry.product,
          });
        }
      }
      searchPos = idx + entry.normalizedAlias.length;
    }
  }

  // If 0 or 1 product detected, no multi-product split needed
  if (foundProducts.length <= 1) {
    return [clause];
  }

  // Sort detected products by their position in speech
  foundProducts.sort((a, b) => a.start - b.start);

  // COALESCE BRAND + PRODUCT COMBINATIONS:
  // A recognized brand immediately preceding a product noun must NEVER be split into separate items!
  // E.g. "Everest" + "Sabji Masala" -> ONE entity "Everest Sabji Masala"
  // E.g. "Rajesh" + "Meat Masala" -> ONE entity "Rajesh Meat Masala"
  const coalesced: { start: number; end: number; product: KiranaMasterProduct }[] = [];
  for (let i = 0; i < foundProducts.length; i++) {
    const cur = foundProducts[i];
    if (coalesced.length === 0) {
      coalesced.push(cur);
      continue;
    }
    const prev = coalesced[coalesced.length - 1];
    const between = clause.substring(prev.end, cur.start).trim().toLowerCase();

    const isBrandPrev = Boolean(
      prev.product.brand ||
      RECOGNIZED_KIRANA_BRANDS.some((b) =>
        b.aliases.some((a) => prev.product.id.includes(a) || prev.product.canonicalNameEnglish.toLowerCase().includes(a))
      )
    );

    // If gap between them has no quantity/price/conjunction boundary, coalesce into ONE item
    const hasBoundaryInBetween = /(?:(?:\d+|एक|दो|दुई|तीन|चार|पांच|पाँच|दस)\s*(?:किलो|kg|ग्राम|g|packet|पैकेट|पैक|लीटर)|₹\s*\d+|और|aur|तथा|एवं)/i.test(between);
    const isConnectorOnly = between === '' || between === 'ka' || between === 'ki' || between === 'ke' || between === 'का' || between === 'की' || between === 'के';

    if (isBrandPrev && !hasBoundaryInBetween && isConnectorOnly) {
      // Merge into a single entity!
      prev.end = cur.end;
      if (cur.product) {
        prev.product = cur.product;
      }
    } else {
      coalesced.push(cur);
    }
  }

  if (coalesced.length <= 1) {
    const starterRegex = /(?:(?:\d+(?:\.\d+)?|ek|do|teen|char|chaar|paanch|panch|chhah|chhe|saat|aath|nau|das|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस)\s*(?:kilo|kg|kgs|किलो|केजी|gram|gm|gms|ग्राम|darjan|dozen|दर्जन|plate|plates|प्लेट|packet|packets|पैकेट|पैक|piece|pieces|pcs|पीस|नग|litre|liter|ltr|लीटर|bottle|bottles|बोतल|box|boxes|डिब्बा)|\b(?:aadha|adha|आधा)\s*(?:kilo|kg|किलो|darjan|dozen|दर्जन|litre|लीटर|plate|प्लेट)|\b(?:dedh|dhai|डेढ़|ढाई|सवा|पौन)\s*(?:kilo|kg|किलो)|\b(?:half|full|हाफ|फुल)\s*plate|\b(?:ek\s+)?(?:paav|pao|पाव)|(?:(?:₹|rs\.?|रुपये?|रु)\s*\d+|\d+\s*(?:रुपये?|rupaye?|rs|rupees?))\s*(?:ka|ki|ke|वाला|वाली|वाले)?|\b\d+\s*(?:piece|pieces|pcs)?\s+[a-zA-Z\u0900-\u097F]+)/gi;

    const matches = [...clause.matchAll(starterRegex)];
    if (matches.length > 1) {
      const segs: string[] = [];
      let last = 0;
      for (let i = 1; i < matches.length; i++) {
        const idx = matches[i].index!;
        const prev = clause.substring(last, idx).trim();
        const following = clause.substring(idx).trim();
        const prevHasPriceVariant = /(?:₹\s*\d+|\d+\s*रुपये?|दस|पांच|पाँच|बीस|पचास|\d+)\s*(?:वाला|वाली|वाले|wala|wali|wale)$/i.test(prev);
        const followingIsCountOnly = /^(?:\d+|दस|पांच|पाँच|चार|तीन|दो|दुई|एक)\s*(?:packet|packets|pack|packs|पैकेट|पैक|पैट|पीस|piece|pieces|pcs)\s*$/i.test(following);
        if (prevHasPriceVariant && followingIsCountOnly) {
          continue;
        }
        if (prev.length >= 3) {
          segs.push(prev);
          last = idx;
        }
      }
      const tail = clause.substring(last).trim();
      if (tail) segs.push(tail);
      if (segs.length > 1) return segs;
    }

    return [clause];
  }

  // Split into segments based on coalesced product positions + intervening quantities
  const segments: string[] = [];
  let lastCut = 0;

  const QTY_REGEX_STR =
    '(?:(?:\\d+(?:\\.\\d+)?|एक|दो|दुई|तीन|चार|पांच|पाँच|दस)\\s*(?:किलो|kg|kilo|kilos|ग्राम|g|gm|packet|packets|pack|packs|पैकेट|पैक|पैट|लीटर|litre|l|darjan|dozen|दर्जन|plate|plates|प्लेट|piece|pieces|pcs|पीस)|आधा\\s*(?:किलो|darjan|dozen|दर्जन)|(?:half|full|हाफ|फुल)\\s*plate|पाव|एक\\s*पाव|(?:₹|रुपये?|रु\\.?|rs\\.?|rupaye)?\\s*\\d+\\s*(?:रुपये?|रुपए|रु|rupaye|rupees)?\\s*(?:वाला|वाली|वाले|का|की|के)?)';

  for (let i = 1; i < coalesced.length; i++) {
    const prev = coalesced[i - 1];
    const curr = coalesced[i];

    // Gap between previous product and current product
    // Example: in "सूजी 1 किलो 1 किलो चना दाल", gap between "सूजी" and "चना दाल" is " 1 किलो 1 किलो "
    const gap = clause.substring(prev.end, curr.start);

    const gapMatches = [...gap.matchAll(new RegExp(QTY_REGEX_STR, 'gi'))];
    let cutIndex = curr.start;

    if (gapMatches.length >= 2) {
      // Cut between first quantity (belongs to prev) and second quantity (belongs to curr)
      cutIndex = prev.end + gapMatches[0].index! + gapMatches[0][0].length;
    } else if (gapMatches.length === 1) {
      // Check if preceding product already had a prefix quantity before it (e.g. "1 kilo aloo 1 kilo pyaj")
      const beforePrev = clause.substring(lastCut, prev.start);
      const prevHasPrefixQty = new RegExp(QTY_REGEX_STR, 'i').test(beforePrev);

      if (prevHasPrefixQty) {
        // Preceding product has prefix qty, so qty in gap belongs to curr product -> cut BEFORE it!
        cutIndex = prev.end + gapMatches[0].index!;
      } else {
        // Preceding product had NO prefix qty, so qty in gap is postfix for prev product -> cut AFTER it!
        cutIndex = prev.end + gapMatches[0].index! + gapMatches[0][0].length;
      }
    } else {
      cutIndex = curr.start;
    }

    if (cutIndex > lastCut && cutIndex < clause.length) {
      const seg = clause.substring(lastCut, cutIndex).trim();
      if (seg) segments.push(seg);
      lastCut = cutIndex;
    }
  }

  const remaining = clause.substring(lastCut).trim();
  if (remaining) segments.push(remaining);

  return segments.length > 0 ? segments : [clause];
}
