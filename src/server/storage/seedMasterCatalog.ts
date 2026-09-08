/**
 * Initial Master Catalog Seed Products
 * Populates the Central Master Catalogue with 250+ standard Indian Kirana products.
 * Master products contain identity, photo, category, subcategory, Hindi/English names and aliases.
 * Prices and stock are strictly NOT set in the Master Catalogue.
 */

import { MasterProduct } from '../../types/product.ts';
import { MASTER_KIRANA_CATALOG } from '../../data/products/kiranaProductCatalog.ts';

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'अनाज / चावल / आटा': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
  'दाल / बीन्स / चना': 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=60',
  'तेल / घी': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
  'नमक / चीनी / गुड़': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  'मसाले / साबुत मसाले / मसाला पैक': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
  'ड्राई फ्रूट / मेवा / बीज': 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&auto=format&fit=crop&q=60',
  'चाय / कॉफी / पेय': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60',
  'बिस्कुट': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
  'नमकीन / चिप्स / स्नैक्स': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60',
  'चॉकलेट / टॉफी / कैंडी': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=60',
  'नूडल्स / पास्ता / इंस्टेंट फूड': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60',
  'सॉस / केचप / अचार / जैम': 'https://images.unsplash.com/photo-1589135233689-d56d1c817293?w=500&auto=format&fit=crop&q=60',
  'डेयरी': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60',
  'ब्रेड / बेकरी': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
  'साबुन / शैंपू / पर्सनल केयर': 'https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60',
  'टूथपेस्ट / टूथब्रश / ओरल केयर': 'https://images.unsplash.com/photo-1559591937-e1104e768e7d?w=500&auto=format&fit=crop&q=60',
  'हेयर ऑयल / क्रीम / कॉस्मेटिक्स': 'https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60',
  'डिटर्जेंट / कपड़े धोने का सामान': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  'बर्तन साफ करने का सामान': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  'फर्श / टॉयलेट / घर की सफाई': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=60',
  'पेपर / टिश्यू / डिस्पोजेबल': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=500&auto=format&fit=crop&q=60',
  'पूजा सामग्री': 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=500&auto=format&fit=crop&q=60',
  'बेबी केयर': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=60',
  'स्टेशनरी': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
  'घरेलू / किचन उपयोगी सामान': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60',
  'अगर दुकान में उपलब्ध हो तो फल / सब्जियां': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=60',
  'अन्य सामान्य किराना / जनरल स्टोर सामान': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
};

const SPECIFIC_PRODUCT_IMAGES: Record<string, string> = {
  prod_atta: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
  prod_rice_basmati: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
  prod_dal_toor: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=60',
  prod_oil_mustard: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
  prod_ghee_desi: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  prod_sugar: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60',
  prod_salt_tata: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500&auto=format&fit=crop&q=60',
  prod_tea_red_label: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60',
  prod_maggi: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60',
  prod_soap_santoor: 'https://images.unsplash.com/photo-1608248597359-00994f068c2d?w=500&auto=format&fit=crop&q=60',
  prod_surf_excel: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60',
  prod_colgate_paste: 'https://images.unsplash.com/photo-1559591937-e1104e768e7d?w=500&auto=format&fit=crop&q=60',
  prod_parle_g: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60',
};

export function getSeedMasterProducts(): MasterProduct[] {
  const now = '2026-08-01T00:00:00Z';
  return MASTER_KIRANA_CATALOG.map((item) => {
    const specificImg = SPECIFIC_PRODUCT_IMAGES[item.id];
    const categoryImg = CATEGORY_DEFAULT_IMAGES[item.category];
    const finalImg = specificImg || categoryImg || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';

    return {
      id: item.id,
      name: item.canonicalNameEnglish || item.canonicalNameHindi,
      nameHindi: item.canonicalNameHindi,
      aliases: item.searchableAliases || [],
      category: item.category,
      subCategory: item.subcategory,
      imageUrl: finalImg,
      brand: item.brand,
      defaultUnit: item.defaultUnits?.[0] || (item.supportsWeight ? 'kg' : 'packet'),
      description: `${item.canonicalNameHindi || item.canonicalNameEnglish} (${item.subcategory || item.category})`,
      isActive: item.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
  });
}
