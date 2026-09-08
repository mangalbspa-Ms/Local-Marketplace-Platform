/**
 * Add / Edit Product Modal for Shop Catalog
 * Supports Hindi/English names, brands, base units, prices, stock, and price-variants.
 */

import React, { useState, useEffect } from 'react';
import { Product, ProductUnitType } from '../../../../types/product.ts';
import { adminApi } from '../../../../services/adminApi.ts';
import {
  X,
  Save,
  Package,
  IndianRupee,
  Layers,
  Image as ImageIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CATEGORY_IMAGE_MAP, DEFAULT_PRODUCT_IMAGE } from '../utils/catalogDefaults.ts';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  productToEdit?: Product | null;
  onProductSaved: (savedProduct: Product) => void;
}

const COMMON_CATEGORIES = [
  'Grocery & Kirana',
  'अनाज / चावल / आटा',
  'दाल / बीन्स / चना',
  'तेल / घी',
  'मसाले व मसालेदार पैकेट',
  'नमक / चीनी / गुड़',
  'चाय / कॉफी / बिस्कुट',
  'नमकीन व स्नैक्स',
  'साबुन, शैंपू व डिटर्जेंट',
  'डेयरी व बेकरी',
  'फल व सब्ज़ी',
];

const COMMON_UNITS = [
  { value: 'kg', label: 'किलो (kg)' },
  { value: 'g', label: 'ग्राम (g)' },
  { value: 'packet', label: 'पैकेट (packet)' },
  { value: 'piece', label: 'पीस / इकाई (piece)' },
  { value: 'L', label: 'लीटर (L)' },
  { value: 'ml', label: 'मिलीलीटर (ml)' },
  { value: 'pouch', label: 'पाउच (pouch)' },
  { value: 'bottle', label: 'बोतल (bottle)' },
  { value: 'box', label: 'डिब्बा / बॉक्स (box)' },
  { value: 'dozen', label: 'दर्जन (dozen)' },
];

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  productToEdit,
  onProductSaved,
}) => {
  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Grocery & Kirana');
  const [baseUnit, setBaseUnit] = useState('kg');
  const [basePrice, setBasePrice] = useState<number | ''>(100);
  const [currentStock, setCurrentStock] = useState<number | ''>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(5);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState(DEFAULT_PRODUCT_IMAGE);
  const [description, setDescription] = useState('');

  // Price Variants (e.g. ₹5 वाला, ₹10 वाला)
  const [hasPriceVariants, setHasPriceVariants] = useState(false);
  const [priceVariantsText, setPriceVariantsText] = useState('5, 10, 20');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setNameHindi(productToEdit.nameHindi || '');
      setBrand(productToEdit.brand || '');
      setCategory(productToEdit.category || 'Grocery & Kirana');
      setBaseUnit(productToEdit.baseUnit || productToEdit.fractionalConfig?.baseUnit || 'kg');
      setBasePrice(productToEdit.basePricePerUnit || productToEdit.fractionalConfig?.basePrice || 100);
      setCurrentStock(productToEdit.currentStockInBaseUnits ?? 50);
      setLowStockThreshold(productToEdit.lowStockThresholdInBaseUnits ?? 5);
      setIsAvailable(productToEdit.isAvailable !== false);
      setImageUrl(productToEdit.imageUrl || DEFAULT_PRODUCT_IMAGE);
      setDescription(productToEdit.description || '');

      // Check for price variants in predefined options or tags
      const hasVariants = Boolean(
        productToEdit.fractionalConfig?.amountQuickPills?.length ||
        productToEdit.tags?.some((t) => t.includes('वाला') || t.includes('wala'))
      );
      setHasPriceVariants(hasVariants);
      if (productToEdit.fractionalConfig?.amountQuickPills?.length) {
        setPriceVariantsText(productToEdit.fractionalConfig.amountQuickPills.join(', '));
      }
    } else {
      // Defaults for new product
      setName('');
      setNameHindi('');
      setBrand('');
      setCategory('Grocery & Kirana');
      setBaseUnit('kg');
      setBasePrice(100);
      setCurrentStock(50);
      setLowStockThreshold(5);
      setIsAvailable(true);
      setImageUrl(DEFAULT_PRODUCT_IMAGE);
      setDescription('');
      setHasPriceVariants(false);
      setPriceVariantsText('5, 10, 20');
    }
    setErrorMessage(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('कृपया प्रोडक्ट का नाम (Product Name) दर्ज करें');
      return;
    }
    if (basePrice === '' || Number(basePrice) < 0) {
      setErrorMessage('कृपया मान्य मूल्य (Valid Price) दर्ज करें');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const priceNum = Number(basePrice);
      const stockNum = currentStock === '' ? 0 : Number(currentStock);
      const thresholdNum = lowStockThreshold === '' ? 5 : Number(lowStockThreshold);

      // Determine unit type
      let unitType = ProductUnitType.PIECE;
      if (['kg', 'g', 'gram'].includes(baseUnit)) {
        unitType = ProductUnitType.WEIGHT;
      } else if (['L', 'litre', 'ml'].includes(baseUnit)) {
        unitType = ProductUnitType.VOLUME;
      }

      // Predefined options based on unit
      const predefinedOptions =
        unitType === ProductUnitType.WEIGHT
          ? [
              { id: 'opt-250', label: '250 g', multiplier: 0.25, unitLabel: 'grams' },
              { id: 'opt-500', label: '500 g', multiplier: 0.5, unitLabel: 'grams' },
              { id: 'opt-1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
              { id: 'opt-5kg', label: '5 kg', multiplier: 5.0, unitLabel: 'kg' },
            ]
          : unitType === ProductUnitType.VOLUME
          ? [
              { id: 'opt-500ml', label: '500 ml', multiplier: 0.5, unitLabel: 'ml' },
              { id: 'opt-1l', label: '1 L', multiplier: 1.0, unitLabel: 'L', isDefault: true },
            ]
          : [
              { id: 'opt-1pc', label: '1 पीस', multiplier: 1.0, unitLabel: 'piece', isDefault: true },
              { id: 'opt-2pc', label: '2 पीस', multiplier: 2.0, unitLabel: 'piece' },
              { id: 'opt-5pc', label: '5 पीस', multiplier: 5.0, unitLabel: 'piece' },
            ];

      // Parse price variant pills if enabled
      let amountQuickPills: number[] | undefined = undefined;
      if (hasPriceVariants) {
        amountQuickPills = priceVariantsText
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n > 0);
      }

      const fractionalConfig = {
        unitType,
        baseUnit: baseUnit as any,
        basePrice: priceNum,
        minQuantityMultiplier: unitType === ProductUnitType.WEIGHT ? 0.05 : 1,
        maxQuantityMultiplier: 100,
        stepQuantityMultiplier: unitType === ProductUnitType.WEIGHT ? 0.05 : 1,
        allowCustomFractionalInput: true,
        allowAmountBasedPurchase: true,
        amountQuickPills,
        predefinedOptions,
      };

      const productPayload: any = {
        shopId,
        name: name.trim(),
        nameHindi: nameHindi.trim() || undefined,
        brand: brand.trim() || undefined,
        category: category.trim(),
        description: description.trim() || `${name} ताज़ा स्टॉक`,
        imageUrl: imageUrl.trim() || DEFAULT_PRODUCT_IMAGE,
        baseUnit: baseUnit as any,
        basePricePerUnit: priceNum,
        currentStockInBaseUnits: stockNum,
        lowStockThresholdInBaseUnits: thresholdNum,
        isAvailable,
        fractionalConfig,
      };

      let saved: Product;
      if (isEditing && productToEdit) {
        saved = await adminApi.updateProduct(productToEdit.id, productPayload);
      } else {
        saved = await adminApi.createProduct(productPayload);
      }

      onProductSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setErrorMessage(err.message || 'प्रोडक्ट सेव करने में त्रुटि हुई');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEditing ? 'प्रोडक्ट विवरण संपादित करें (Edit Product)' : 'नया प्रोडक्ट जोड़ें (Add New Product)'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">दुकान: {shopName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                प्रोडक्ट का नाम (English Name) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                हिंदी नाम (Hindi Name)
              </label>
              <input
                type="text"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
                placeholder="उदा. आशीर्वाद शुद्ध चक्की आटा"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Brand & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ब्रांड (Brand)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Fortune, Rajesh, Santoor, Tata"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                श्रेणी (Category)
              </label>
              <input
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or enter category"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: Pricing, Unit & Stock */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>मूल्य, इकाई व स्टॉक (Price, Unit & Stock)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  बेस इकाई (Base Unit)
                </label>
                <select
                  value={baseUnit}
                  onChange={(e) => setBaseUnit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  प्रति इकाई मूल्य (₹ Price / {baseUnit}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  वर्तमान स्टॉक ({baseUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  कम स्टॉक चेतावनी सीमा (Low Stock Alert At)
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">उपलब्धता (In Stock)</div>
                  <div className="text-[10px] text-slate-400">दुकान में बिक्री के लिए चालू रखें</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                    isAvailable ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                </button>
              </div>
            </div>
          </div>

          {/* Price Variants (₹5 वाला, ₹10 वाला) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>प्राइस-वेरिएंट (Price Variants: ₹5 वाला, ₹10 वाला आदि)</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  मसाले, शैंपू, नमकीन, बिस्कुट आदि के छोटे-बड़े पैकेट
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasPriceVariants(!hasPriceVariants)}
                className={`w-10 h-5 rounded-full transition p-0.5 flex items-center ${
                  hasPriceVariants ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            {hasPriceVariants && (
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  उपलब्ध मूल्य पैकेट्स (कॉमा लगाकर लिखें, उदा. 5, 10, 20)
                </label>
                <input
                  type="text"
                  value={priceVariantsText}
                  onChange={(e) => setPriceVariantsText(e.target.value)}
                  placeholder="5, 10, 20"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {priceVariantsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((val) => (
                      <span
                        key={val}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black"
                      >
                        ₹{val} वाला
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Image & Description */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              फोटो URL (Product Image URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950 flex items-center justify-center">
                {imageUrl && imageUrl.trim() !== '' ? (
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </div>

            {/* Quick image preset pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-500">त्वरित फोटो:</span>
              {Object.entries(CATEGORY_IMAGE_MAP).slice(0, 5).map(([cat, img]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {cat.split('/')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              विवरण (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ताज़ा और शुद्ध गुणवत्ता वाला किराना सामान..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : isEditing ? 'बदलाव सुरक्षित करें (Update)' : 'प्रोडक्ट जोड़ें (Add Product)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
