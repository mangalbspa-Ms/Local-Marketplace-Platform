/**
 * Add / Edit Product Modal with Fractional Pricing Configuration (Screens 11 & 12)
 * Sets up base unit prices, stock, and fractional portion presets (e.g. 250g Sugar = ₹25).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Plus,
  Scale,
  IndianRupee,
  Calculator,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ProductUnitType, BaseUnit, CreateProductDTO, Product } from '../../../types/product.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: CreateProductDTO) => Promise<void>;
  editingProduct?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}) => {
  const { language, t } = useSellerLanguage();

  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [category, setCategory] = useState('Grains & Flours');
  const [unitType, setUnitType] = useState<ProductUnitType>(ProductUnitType.WEIGHT);
  const [baseUnit, setBaseUnit] = useState<BaseUnit>('kg');
  const [basePrice, setBasePrice] = useState<number>(100);
  const [currentStock, setCurrentStock] = useState<number>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [allowCustomFractions, setAllowCustomFractions] = useState<boolean>(true);
  const [predefinedFractions, setPredefinedFractions] = useState<
    Array<{ label: string; multiplier: number; unitLabel: string }>
  >([
    { label: '100g', multiplier: 0.1, unitLabel: 'grams' },
    { label: '250g', multiplier: 0.25, unitLabel: 'grams' },
    { label: '500g', multiplier: 0.5, unitLabel: 'grams' },
    { label: '1kg', multiplier: 1.0, unitLabel: 'kg' },
    { label: '2kg', multiplier: 2.0, unitLabel: 'kg' },
    { label: '5kg', multiplier: 5.0, unitLabel: 'kg' },
  ]);

  // Test simulation calculator
  const [testFractionMultiplier, setTestFractionMultiplier] = useState<number>(0.25);
  const [testFractionLabel, setTestFractionLabel] = useState<string>('250g');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setNameHindi(editingProduct.nameHindi || '');
      setCategory(editingProduct.category);
      setUnitType(editingProduct.fractionalConfig.unitType);
      setBaseUnit(editingProduct.fractionalConfig.baseUnit);
      setBasePrice(editingProduct.basePricePerUnit || editingProduct.fractionalConfig.basePrice);
      setCurrentStock(editingProduct.currentStockInBaseUnits);
      setLowStockThreshold(editingProduct.lowStockThresholdInBaseUnits);
      setAllowCustomFractions(editingProduct.fractionalConfig.allowCustomFractionalInput);
      setPredefinedFractions(editingProduct.fractionalConfig.predefinedOptions || []);
    } else {
      setName('');
      setNameHindi('');
      setCategory('Grains & Flours');
      setUnitType(ProductUnitType.WEIGHT);
      setBaseUnit('kg');
      setBasePrice(100);
      setCurrentStock(50);
      setLowStockThreshold(10);
      setAllowCustomFractions(true);
      setPredefinedFractions([
        { label: '100g', multiplier: 0.1, unitLabel: 'grams' },
        { label: '250g', multiplier: 0.25, unitLabel: 'grams' },
        { label: '500g', multiplier: 0.5, unitLabel: 'grams' },
        { label: '1kg', multiplier: 1.0, unitLabel: 'kg' },
        { label: '2kg', multiplier: 2.0, unitLabel: 'kg' },
        { label: '5kg', multiplier: 5.0, unitLabel: 'kg' },
      ]);
    }
  }, [editingProduct, isOpen]);

  // Auto-switch default fractions when unit type changes
  const handleUnitTypeChange = (type: ProductUnitType) => {
    setUnitType(type);
    if (type === ProductUnitType.WEIGHT) {
      setBaseUnit('kg');
      setPredefinedFractions([
        { label: '100g', multiplier: 0.1, unitLabel: 'grams' },
        { label: '250g', multiplier: 0.25, unitLabel: 'grams' },
        { label: '500g', multiplier: 0.5, unitLabel: 'grams' },
        { label: '1kg', multiplier: 1.0, unitLabel: 'kg' },
        { label: '2kg', multiplier: 2.0, unitLabel: 'kg' },
        { label: '5kg', multiplier: 5.0, unitLabel: 'kg' },
      ]);
      setTestFractionMultiplier(0.25);
      setTestFractionLabel('250g');
    } else if (type === ProductUnitType.VOLUME) {
      setBaseUnit('L');
      setPredefinedFractions([
        { label: '200ml', multiplier: 0.2, unitLabel: 'ml' },
        { label: '500ml', multiplier: 0.5, unitLabel: 'ml' },
        { label: '1 Litre', multiplier: 1.0, unitLabel: 'L' },
        { label: '2 Litres', multiplier: 2.0, unitLabel: 'L' },
      ]);
      setTestFractionMultiplier(0.5);
      setTestFractionLabel('500ml');
    } else {
      setBaseUnit('piece');
      setPredefinedFractions([
        { label: '1 pc', multiplier: 1.0, unitLabel: 'piece' },
        { label: '6 pcs (Half Dozen)', multiplier: 6.0, unitLabel: 'piece' },
        { label: '12 pcs (1 Dozen)', multiplier: 12.0, unitLabel: 'piece' },
      ]);
      setTestFractionMultiplier(1.0);
      setTestFractionLabel('1 pc');
    }
  };

  const calculatedTestPrice = (basePrice * testFractionMultiplier).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(language === 'hi' ? 'कृपया सामान का नाम दर्ज करें' : 'Please enter product name');
      return;
    }
    if (basePrice <= 0) {
      setError(language === 'hi' ? 'कृपया मान्य मूल्य दर्ज करें' : 'Base price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        nameHindi: nameHindi.trim() || undefined,
        category,
        unitType,
        baseUnit,
        basePrice: Number(basePrice),
        currentStock: Number(currentStock),
        lowStockThreshold: Number(lowStockThreshold),
        allowCustomFractionalInput: allowCustomFractions,
        predefinedOptions: predefinedFractions,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {editingProduct
                  ? (language === 'hi' ? 'सामान संपादित करें' : 'Edit Product')
                  : t('product.add_new')}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'hi' ? 'मूल भाव, स्टॉक व तौल विकल्प सेट करें' : 'Set base unit price, stock & fractional portions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Names (English & Hindi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'सामान का नाम (English) *' : 'Product Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pure White Sugar"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'नाम (हिंदी / स्थानीय भाषा)' : 'Name (Hindi / Local)'}
              </label>
              <input
                type="text"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
                placeholder="उदा. शुद्ध सफेद चीनी"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {language === 'hi' ? 'श्रेणी (Category)' : 'Product Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Grains & Flours">Grains & Flours (अनाज व आटा)</option>
              <option value="Sugar & Sweeteners">Sugar & Sweeteners (चीनी व गुड़)</option>
              <option value="Edible Oils & Ghee">Edible Oils & Ghee (तेल व घी)</option>
              <option value="Spices & Masala">Spices & Masala (मसाले)</option>
              <option value="Pulses & Dals">Pulses & Dals (दालें)</option>
              <option value="Dairy & Milk">Dairy & Milk (दूध व डेयरी)</option>
              <option value="Fresh Vegetables">Fresh Vegetables (ताजी सब्जियां)</option>
              <option value="Fresh Fruits">Fresh Fruits (ताजे फल)</option>
              <option value="Packaged Foods">Packaged Snacks (नाश्ता व स्नैक्स)</option>
            </select>
          </div>

          {/* Unit Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              {language === 'hi' ? 'माप की इकाई (Unit Measurement Type)' : 'Unit Measurement Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: ProductUnitType.WEIGHT, label: 'Weight (वजन/किलो)', icon: Scale },
                { type: ProductUnitType.VOLUME, label: 'Volume (लीटर/ml)', icon: Package },
                { type: ProductUnitType.PIECE, label: 'Piece (नग/दर्जन)', icon: Layers },
              ].map((u) => {
                const isSelected = unitType === u.type;
                const Icon = u.icon;
                return (
                  <button
                    key={u.type}
                    type="button"
                    onClick={() => handleUnitTypeChange(u.type)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center space-y-1 ${
                      isSelected
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] text-center">{u.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Base Price & Base Unit */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('product.base_price')}</span>
              </span>
              <span className="text-[11px] text-slate-400">Price per 1 {baseUnit}</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm">
                / 1 {baseUnit}
              </div>
            </div>
          </div>

          {/* Fractional Pricing Config & Instant Preview Simulator (Screen 12) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {language === 'hi' ? 'तौल/मात्रा कैलकुलेटर (Fractional Preview)' : 'Fractional Pricing Engine Preview'}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Auto Exact ₹
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {language === 'hi'
                ? `यदि मूल भाव ₹${basePrice}/${baseUnit} है, तो ग्राहक को भिन्न मात्रा पर यह दर लगेगी:`
                : `Simulate what customer pays at ₹${basePrice}/${baseUnit}:`}
            </p>

            {/* Quick Portion Buttons for simulation */}
            <div className="flex flex-wrap gap-2">
              {predefinedFractions.map((fraction, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTestFractionMultiplier(fraction.multiplier);
                    setTestFractionLabel(fraction.label);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    testFractionMultiplier === fraction.multiplier
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {fraction.label}
                </button>
              ))}
            </div>

            {/* Calculated Result Box */}
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-800/80 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400">{testFractionLabel} {name || 'Item'} =</span>
                <div className="font-bold text-white font-mono">
                  ({testFractionMultiplier} × ₹{basePrice})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 block font-semibold">Customer Pays:</span>
                <span className="font-mono font-black text-xl text-emerald-300">
                  ₹{calculatedTestPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Stock & Low Stock Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {language === 'hi' ? `उपलब्ध स्टॉक (${baseUnit})` : `Stock (${baseUnit})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-semibold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'कम स्टॉक चेतावनी' : 'Low Stock Alert'}
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-semibold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {editingProduct
                      ? (language === 'hi' ? 'बदलाव सेव करें' : 'Save Changes')
                      : (language === 'hi' ? 'प्रोडक्ट जोड़ें' : 'Add Product')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
