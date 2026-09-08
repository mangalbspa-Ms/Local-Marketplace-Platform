/**
 * Custom Fractional Portion Modal
 * 
 * Allows customers to input custom fractional quantities:
 * 1. By Quantity / Weight (e.g., 350g, 750g, 1.5kg, 350ml)
 * 2. By Budget / Amount in ₹ (e.g., "Buy for ₹50", "Buy for ₹100")
 * with instant live price & portion calculation backed by server base rate.
 */

import React, { useState, useMemo } from 'react';
import { Product, ProductUnitType } from '../../../types/product.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { PricingEngine } from '../../../core/pricingEngine.ts';
import { Scale, Check, AlertCircle, IndianRupee, Layers } from 'lucide-react';

interface CustomPortionModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (multiplier: number, displayLabel: string, quantityCount: number) => void;
}

export const CustomPortionModal: React.FC<CustomPortionModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  const { language, t } = useCustomerLanguage();

  const [entryMode, setEntryMode] = useState<'quantity' | 'amount'>('quantity');
  const [inputVal, setInputVal] = useState<string>('500');
  const [amountVal, setAmountVal] = useState<string>('50');
  const [unitMode, setUnitMode] = useState<'grams' | 'kg' | 'ml' | 'liters'>('grams');
  const [quantityCount, setQuantityCount] = useState<number>(1);

  const config = product?.fractionalConfig;
  const isWeight = config?.unitType === ProductUnitType.WEIGHT;
  const isVolume = config?.unitType === ProductUnitType.VOLUME;

  // 1. Calculations when user chooses "By Quantity / Weight"
  const qtyCalculatedMultiplier = useMemo(() => {
    const num = parseFloat(inputVal) || 0;
    if (num <= 0) return 0;

    if (isWeight) {
      if (unitMode === 'grams') return num / 1000.0;
      return num; // in kg
    }
    if (isVolume) {
      if (unitMode === 'ml') return num / 1000.0;
      return num; // in liters
    }
    return num;
  }, [inputVal, unitMode, isWeight, isVolume]);

  // 2. Calculations when user chooses "By Budget / Amount in ₹"
  const amountCalculation = useMemo(() => {
    if (!product) return { multiplier: 0, exactPrice: 0, displayQuantity: '' };
    const targetAmt = parseFloat(amountVal) || 0;
    return PricingEngine.calculateQuantityFromAmount(product, targetAmt);
  }, [product, amountVal]);

  // Active Multiplier and Totals based on current Tab
  const activeMultiplier = entryMode === 'quantity' ? qtyCalculatedMultiplier : amountCalculation.multiplier;
  const calculatedUnitPrice =
    entryMode === 'quantity' && config
      ? Math.round(config.basePrice * activeMultiplier * 100) / 100
      : amountCalculation.exactPrice;
  const calculatedTotal = Math.round(calculatedUnitPrice * quantityCount * 100) / 100;

  // Validation
  const isValid =
    config &&
    activeMultiplier >= (config.minQuantityMultiplier || 0.05) &&
    activeMultiplier <= (config.maxQuantityMultiplier || 50.0);

  const displayLabel = useMemo(() => {
    if (entryMode === 'amount') {
      return `${amountCalculation.displayQuantity} (₹${amountCalculation.exactPrice})`;
    }
    if (isWeight) {
      if (activeMultiplier < 1.0) {
        return `${Math.round(activeMultiplier * 1000)} g`;
      }
      return `${activeMultiplier} kg`;
    }
    if (isVolume) {
      if (activeMultiplier < 1.0) {
        return `${Math.round(activeMultiplier * 1000)} ml`;
      }
      return `${activeMultiplier} L`;
    }
    return `${activeMultiplier} ${config?.baseUnit || ''}`;
  }, [entryMode, amountCalculation, isWeight, isVolume, activeMultiplier, config?.baseUnit]);

  if (!isOpen || !product || !config) return null;

  const handleApply = () => {
    if (!isValid) return;
    onConfirm(activeMultiplier, displayLabel, quantityCount);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('customPortion')}</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Quantity vs Rupee Amount */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setEntryMode('quantity')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'quantity'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'hi' ? 'वजन अनुसार' : 'By Weight'}</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('amount')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'amount'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'hi' ? 'रुपये के बजट से (₹)' : 'By Rupee Budget (₹)'}</span>
          </button>
        </div>

        {/* Base Rate Reference */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">{t('perBaseUnit')} 1 {config.baseUnit}</span>
          <span className="font-bold text-slate-900">₹{config.basePrice}</span>
        </div>

        {/* Custom Input Section */}
        {entryMode === 'quantity' ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              {language === 'hi' ? 'वांछित मात्रा / वजन दर्ज करें:' : 'Enter Custom Quantity / Weight:'}
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. 350, 750"
                step="any"
                min="1"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />

              {/* Unit toggle */}
              {isWeight && (
                <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('grams');
                      setInputVal('500');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unitMode === 'grams'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Grams (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('kg');
                      setInputVal('1.5');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unitMode === 'kg'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kg
                  </button>
                </div>
              )}

              {isVolume && (
                <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('ml');
                      setInputVal('500');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unitMode === 'ml'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ml
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('liters');
                      setInputVal('1.5');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unitMode === 'liters'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Litre
                  </button>
                </div>
              )}
            </div>

            {/* Fast Quick Weight chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '250 g', val: '250', unit: 'grams' as const },
                { label: '500 g (आधा किलो)', val: '500', unit: 'grams' as const },
                { label: '750 g (पौना किलो)', val: '750', unit: 'grams' as const },
                { label: '1.5 kg (डेढ़ किलो)', val: '1.5', unit: 'kg' as const },
                { label: '2.5 kg (ढाई किलो)', val: '2.5', unit: 'kg' as const },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setInputVal(chip.val);
                    setUnitMode(chip.unit);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-emerald-300"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Budget / Rupee Amount Mode */
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              {language === 'hi' ? 'रुपये का बजट दर्ज करें (जैसे ₹20, ₹50):' : 'Enter Target Rupee Budget (e.g. ₹20, ₹50):'}
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                value={amountVal}
                onChange={(e) => setAmountVal(e.target.value)}
                placeholder="50"
                step="1"
                min="5"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Fast Rupee Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[10, 20, 30, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountVal(amt.toString())}
                  className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold hover:border-emerald-300"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calculation Outcome Summary Card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {language === 'hi' ? 'अनुमानित मात्रा:' : 'Calculated Portion:'}
            </span>
            <span className="font-bold text-emerald-800 text-sm">{displayLabel}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
            <span className="text-slate-600 font-medium">
              {language === 'hi' ? 'कुल राशि:' : 'Line Total:'}
            </span>
            <span className="font-black text-slate-900 text-base">₹{calculatedTotal}</span>
          </div>
        </div>

        {/* Quantity Packs Counter */}
        <div className="flex items-center justify-between pt-1 text-xs font-bold text-slate-700">
          <span>{language === 'hi' ? 'पैकेट / संख्या:' : 'Number of portions:'}</span>
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantityCount((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs"
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-bold text-slate-900">{quantityCount}</span>
            <button
              type="button"
              onClick={() => setQuantityCount((prev) => Math.min(20, prev + 1))}
              className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={!isValid}
          onClick={handleApply}
          className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            isValid
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>
            {language === 'hi'
              ? `कार्ट में जोड़ें (₹${calculatedTotal})`
              : `Add to Cart (₹${calculatedTotal})`}
          </span>
        </button>
      </div>
    </div>
  );
};
