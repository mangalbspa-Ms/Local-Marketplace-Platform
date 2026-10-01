/**
 * Screen 4 — Product Details Modal / View
 * 
 * Clean, high-conversion product details matching Indian grocery marketplace standards:
 * - Top header with Back, Favorite & Cart shortcut
 * - Large product image with discount and category badges
 * - Product title (Hindi & English), shop name with verified badge
 * - Rating (⭐ 4.5 • 150+ खरीदार) and stock status (✓ स्टॉक में)
 * - Clear price hierarchy (₹ Price, ₹ Old Price, XX% OFF)
 * - Quantity stepper [ − 1 + ]
 * - Predefined fractional portion chips (250g, 500g, 1kg, Custom)
 * - Rupee-based buying chips (₹10, ₹20, ₹50, ₹100)
 * - Primary [ 🛒 कार्ट में जोड़ें ] and Secondary [ अभी खरीदें ] action buttons
 * - "इस दुकान के अन्य प्रोडक्ट" (More from this shop)
 */

import React, { useState } from 'react';
import { Product, ProductUnitType } from '../../../types/product.ts';
import { Shop } from '../../../types/market.ts';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { PricingEngine } from '../../../core/pricingEngine.ts';
import { triggerHaptic, HAPTIC_FEEDBACK } from '../../../utils/haptics.ts';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Star,
  Check,
  Plus,
  Minus,
  Scale,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  shop: Shop | null;
  otherProducts?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onBuyNow?: (product: Product, multiplier: number, count: number, portionLabel: string) => void;
  onViewCart?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  shop,
  otherProducts = [],
  isOpen,
  onClose,
  onSelectProduct,
  onBuyNow,
  onViewCart,
}) => {
  const { language, t } = useCustomerLanguage();
  const { addToCart, items: cartItems } = useCustomerCart();

  const [quantityCount, setQuantityCount] = useState<number>(1);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(() => {
    return (
      product?.fractionalConfig?.predefinedOptions?.find((o) => o.isDefault)?.multiplier ||
      product?.fractionalConfig?.predefinedOptions?.[0]?.multiplier ||
      1.0
    );
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);
  const [customGramsInput, setCustomGramsInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Sync state when product changes
  React.useEffect(() => {
    if (product) {
      const defaultMult =
        product.fractionalConfig?.predefinedOptions?.find((o) => o.isDefault)?.multiplier ||
        product.fractionalConfig?.predefinedOptions?.[0]?.multiplier ||
        1.0;
      setSelectedMultiplier(defaultMult);
      setQuantityCount(1);
      setIsCustomMode(false);
      setCustomGramsInput('');
    }
  }, [product?.id]);

  if (!isOpen || !product || !shop) return null;

  const isWeightBased = product.fractionalConfig?.unitType === ProductUnitType.WEIGHT;
  const baseUnit = product.fractionalConfig?.baseUnit || 'kg';
  const predefinedOptions = product.fractionalConfig?.predefinedOptions || [];

  // Calculate prices with foolproof numeric fallbacks
  const rawBase = product.fractionalConfig?.basePrice ?? product.basePricePerUnit ?? (product as any)?.basePrice ?? 0;
  const safeBasePrice = Number.isFinite(Number(rawBase)) && !Number.isNaN(Number(rawBase)) && Number(rawBase) >= 0 ? Number(rawBase) : 0;
  const unitCalculatedPrice = Math.round(safeBasePrice * (selectedMultiplier || 1));
  const totalItemPrice = unitCalculatedPrice * (quantityCount || 1);

  // Derive active portion label
  const activeOption = predefinedOptions.find(
    (o) => Math.abs(o.multiplier - selectedMultiplier) < 0.001
  );
  const portionLabel = activeOption
    ? activeOption.label
    : isWeightBased
    ? selectedMultiplier < 1
      ? `${Math.round(selectedMultiplier * 1000)}g`
      : `${selectedMultiplier} ${baseUnit}`
    : `${selectedMultiplier} ${baseUnit}`;

  // Estimate old / strike price
  const estimatedMrp = Math.round(safeBasePrice * 1.15);
  const strikeOldPrice = Math.round(estimatedMrp * (selectedMultiplier || 1) * (quantityCount || 1));
  const discountPercent = strikeOldPrice > 0 ? Math.max(5, Math.round(((strikeOldPrice - totalItemPrice) / strikeOldPrice) * 100)) : 0;

  const handleAddToCart = () => {
    triggerHaptic(HAPTIC_FEEDBACK.action);
    const success = addToCart(product, shop, selectedMultiplier, quantityCount, portionLabel);
    if (success) {
      setIsAddedAnimation(true);
      setTimeout(() => setIsAddedAnimation(false), 1800);
    }
  };

  const handleDirectBuyNow = () => {
    triggerHaptic(HAPTIC_FEEDBACK.action);
    if (onBuyNow) {
      onBuyNow(product, selectedMultiplier, quantityCount, portionLabel);
    } else {
      addToCart(product, shop, selectedMultiplier, quantityCount, portionLabel);
      if (onViewCart) {
        onClose();
        onViewCart();
      }
    }
  };

  const handleApplyCustomGrams = () => {
    const grams = parseFloat(customGramsInput);
    if (!isNaN(grams) && grams > 0) {
      setSelectedMultiplier(grams / 1000);
      setIsCustomMode(false);
    }
  };

  // Quick rupee-based buying presets (e.g., ₹10, ₹20, ₹50, ₹100 worth)
  const rupeePresets = [10, 20, 50, 100];

  const handleSelectRupeePreset = (rupees: number) => {
    const baseRate = safeBasePrice > 0 ? safeBasePrice : 1;
    const calculatedMultiplier = rupees / baseRate;
    setSelectedMultiplier(Number(calculatedMultiplier.toFixed(3)));
    setQuantityCount(1);
    setIsCustomMode(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar: Back, Title, Favorite & Cart */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center truncate px-2">
            <span className="text-xs font-bold text-slate-900 truncate">
              {language === 'hi' ? 'प्रोडक्ट विवरण' : 'Product Details'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            {onViewCart && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewCart();
                }}
                className="relative w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Product Image Stage */}
          <div className="relative w-full aspect-4/3 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center shadow-xs">
            {product.imageUrl && product.imageUrl.trim() !== '' ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-5xl">🛒</div>
            )}

            {/* Discount Ribbon */}
            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <span>{discountPercent}% OFF</span>
            </div>

            {/* In Stock Badge */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2 py-0.8 rounded-md border border-emerald-200 shadow-2xs flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{language === 'hi' ? '✓ स्टॉक में' : '✓ In Stock'}</span>
            </div>
          </div>

          {/* Product Title, Shop & Ratings */}
          <div className="space-y-1">
            <h1 className="text-base font-bold text-slate-900 leading-snug">
              {language === 'hi' && product.nameHindi ? product.nameHindi : product.name}
            </h1>
            {language !== 'hi' && product.nameHindi && (
              <p className="text-xs text-slate-500 font-medium">{product.nameHindi}</p>
            )}

            {/* Shop Badge */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.8 rounded-lg border border-slate-200">
                <span>{shop.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.8 rounded-lg border border-amber-200">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>4.5</span>
                <span className="text-slate-400 font-normal">| 150+ खरीदार</span>
              </div>
            </div>
          </div>

          {/* Price Hierarchy Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {language === 'hi' ? 'विशेष मंडी कीमत' : 'Special Mandi Price'}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-900">₹{totalItemPrice}</span>
                <span className="text-xs text-slate-400 line-through">₹{strikeOldPrice}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {discountPercent}% OFF
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {portionLabel} {quantityCount > 1 ? `× ${quantityCount}` : ''} • ₹{safeBasePrice}/{baseUnit}
              </div>
            </div>

            {/* Quantity Counter Stepper */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantityCount((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-slate-900">
                {quantityCount}
              </span>
              <button
                type="button"
                onClick={() => setQuantityCount((prev) => prev + 1)}
                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fractional Quantity Selection Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'hi' ? 'वजन / मात्रा चुनें' : 'Select Portion / Weight'}</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-bold">{portionLabel}</span>
            </div>

            {/* Predefined Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {predefinedOptions.map((opt) => {
                const isSelected = !isCustomMode && Math.abs(opt.multiplier - selectedMultiplier) < 0.001;
                const optPrice = Math.round(safeBasePrice * opt.multiplier);

                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setSelectedMultiplier(opt.multiplier);
                      setIsCustomMode(false);
                    }}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      ₹{optPrice}
                    </div>
                  </button>
                );
              })}

              {/* Custom Weight Chip */}
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                  isCustomMode
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="text-[11px] font-bold">{language === 'hi' ? 'कस्टम' : 'Custom'}</div>
                <div className={`text-[10px] mt-0.5 ${isCustomMode ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {language === 'hi' ? 'ग्राम भरें' : 'Enter g'}
                </div>
              </button>
            </div>

            {/* Custom grams inline input */}
            {isCustomMode && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-100">
                <input
                  type="number"
                  placeholder="e.g. 350 grams"
                  value={customGramsInput}
                  onChange={(e) => setCustomGramsInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomGrams}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Rupee-based Buying Shortcuts (e.g. "₹10 का धनिया", "₹20 का मिर्च") */}
          {isWeightBased && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>⚡ {language === 'hi' ? 'रुपये के हिसाब से खरीदें' : 'Buy by Fixed Rupee Amount'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rupeePresets.map((amt) => {
                  const estPortion = (amt / product.fractionalConfig.basePrice) * 1000;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectRupeePreset(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
                    >
                      ₹{amt} ({Math.round(estPortion)}g)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900">{t('aboutItem')}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* "इस दुकान के अन्य प्रोडक्ट" (More from this shop) */}
          {otherProducts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'इस दुकान के अन्य प्रोडक्ट' : 'More from this Shop'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {otherProducts.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProduct && onSelectProduct(item)}
                    className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl p-2 cursor-pointer transition-all space-y-1"
                  >
                    <div className="aspect-square bg-white rounded-lg overflow-hidden border border-slate-200">
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">🛒</div>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 truncate">
                      {language === 'hi' && item.nameHindi ? item.nameHindi : item.name}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700">₹{item.fractionalConfig?.basePrice || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Sticky Bottom Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center gap-2 shadow-lg">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 ${
              isAddedAnimation
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isAddedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'hi' ? 'कार्ट में जोड़ा गया!' : 'Added to Cart!'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {language === 'hi' ? '🛒 कार्ट में जोड़ें' : 'Add to Cart'} (₹{totalItemPrice})
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDirectBuyNow}
            className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
          >
            <Zap className="w-4 h-4" />
            <span>{language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
