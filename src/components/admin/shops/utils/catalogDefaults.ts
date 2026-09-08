/**
 * Catalog Defaults & Presets for Kirana Products
 * Provides realistic default pricing, base units, and imagery for Kirana master catalog items.
 */

export interface MasterKiranaPresetItem {
  id: string;
  name: string;
  nameHindi: string;
  brand?: string;
  category: string;
  baseUnit: string;
  defaultPrice: number;
  defaultStock: number;
  imageUrl: string;
  isEssential?: boolean;
}

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'अनाज / चावल / आटा': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
  'दाल / बीन्स / चना': 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=60',
  'तेल / घी': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
  'नमक / चीनी / गुड़': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  'मसाले / साबुत मसाले / मसाला पैक': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
  'ड्राई फ्रूट / मेवा / बीज': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&auto=format&fit=crop&q=60',
  'चाय / कॉफी / पेय': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60',
  'बिस्कुट': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
  'नमकीन / चिप्स / स्नैक्स': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60',
  'साबुन / शैंपू / पर्सनल केयर': 'https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60',
  'डिटर्जेंट / कपड़े धोने का सामान': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  'डेयरी': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  'ब्रेड / बेकरी': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
};

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';

export function getDefaultPriceForMasterProduct(product: {
  category: string;
  canonicalNameHindi: string;
  canonicalNameEnglish: string;
  supportsWeight?: boolean;
}): { price: number; unit: string } {
  const name = (product.canonicalNameEnglish || '').toLowerCase();
  const hindi = product.canonicalNameHindi || '';

  if (name.includes('atta') || hindi.includes('आटा')) return { price: 45, unit: 'kg' };
  if (name.includes('rice') || hindi.includes('चावल')) return { price: 55, unit: 'kg' };
  if (name.includes('dal') || hindi.includes('दाल') || hindi.includes('अरहर')) return { price: 130, unit: 'kg' };
  if (name.includes('besan') || hindi.includes('बेसन')) return { price: 90, unit: 'kg' };
  if (name.includes('oil') || name.includes('tel') || hindi.includes('तेल')) return { price: 145, unit: 'L' };
  if (name.includes('ghee') || hindi.includes('घी')) return { price: 580, unit: 'kg' };
  if (name.includes('sugar') || hindi.includes('चीनी')) return { price: 44, unit: 'kg' };
  if (name.includes('salt') || hindi.includes('नमक')) return { price: 28, unit: 'packet' };
  if (name.includes('tea') || hindi.includes('चाय')) return { price: 120, unit: 'packet' };
  if (name.includes('masala') || hindi.includes('मसाला')) return { price: 10, unit: 'packet' };
  if (name.includes('maggi') || hindi.includes('मैगी')) return { price: 14, unit: 'packet' };
  if (name.includes('soap') || name.includes('santoor') || hindi.includes('साबुन')) return { price: 38, unit: 'piece' };
  if (name.includes('shampoo') || hindi.includes('शैंपू')) return { price: 2, unit: 'packet' };
  if (name.includes('biscuit') || hindi.includes('बिस्कुट')) return { price: 20, unit: 'packet' };
  if (name.includes('surf') || name.includes('detergent') || hindi.includes('सर्फ')) return { price: 85, unit: 'kg' };

  if (product.supportsWeight) return { price: 80, unit: 'kg' };
  return { price: 50, unit: 'packet' };
}
