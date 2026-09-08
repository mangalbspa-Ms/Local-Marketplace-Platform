/**
 * Inventory & Stock Screen (Screen 13)
 * Real-time stock monitor in base units with quick + / - adjuster buttons and low stock alerts.
 */

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Scale,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { Product } from '../../../types/product.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

interface InventoryScreenProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onUpdateStock,
}) => {
  const { language, t } = useSellerLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const lowStockCount = products.filter((p) => {
    if (!p) return false;
    const stock = p.currentStockInBaseUnits ?? p.inventory?.currentStockInBaseUnits ?? 0;
    const threshold = p.lowStockThresholdInBaseUnits ?? p.inventory?.lowStockThreshold ?? 5;
    return stock <= threshold;
  }).length;

  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameHindi && p.nameHindi.includes(searchQuery));
    const stock = p.currentStockInBaseUnits ?? p.inventory?.currentStockInBaseUnits ?? 0;
    const threshold = p.lowStockThresholdInBaseUnits ?? p.inventory?.lowStockThreshold ?? 5;
    const isLow = stock <= threshold;
    if (filterLowStockOnly) return matchesSearch && isLow;
    return matchesSearch;
  });

  const handleAdjustStock = async (product: Product, delta: number) => {
    const curr = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
    const newStock = Math.max(0, Number((curr + delta).toFixed(2)));
    setUpdatingId(product.id);
    try {
      await onUpdateStock(product.id, newStock);
    } catch (err) {
      console.error('Failed to update stock', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDirectInput = async (product: Product, valueStr: string) => {
    const val = parseFloat(valueStr);
    if (!isNaN(val) && val >= 0) {
      setUpdatingId(product.id);
      try {
        await onUpdateStock(product.id, val);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.inventory')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'स्टॉक स्तर व त्वरित ± काउंटर समायोजन' : 'Live stock in base units & rapid adjustments'}
          </p>
        </div>

        {lowStockCount > 0 && (
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              filterLowStockOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'hi' ? 'स्टॉक में सामान खोजें...' : 'Search inventory items...'}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const currentStock = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
          const threshold = product.lowStockThresholdInBaseUnits ?? product.inventory?.lowStockThreshold ?? 5;
          const isLow = currentStock <= threshold;
          const isUpdating = updatingId === product.id;
          const price = product.basePricePerUnit || product.fractionalConfig?.basePrice || 0;
          const unit = product.baseUnit || product.fractionalConfig?.baseUnit || 'kg';

          return (
            <div
              key={product.id}
              className={`p-4 rounded-3xl border transition-all ${
                isLow
                  ? 'bg-slate-900 border-amber-500/50 shadow-xs'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">{product.name}</h3>
                    {product.nameHindi && (
                      <span className="text-xs text-slate-400">({product.nameHindi})</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Unit: <span className="text-slate-300 font-mono font-semibold">{unit}</span> • Base: ₹{price}/{unit}
                  </div>
                </div>

                {isLow ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 border border-amber-800 text-amber-300 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t('product.low_stock')} (&le; {product.lowStockThresholdInBaseUnits})</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Stock</span>
                  </span>
                )}
              </div>

              {/* Adjuster Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                {/* Rapid Minus Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={isUpdating || currentStock <= 0}
                    onClick={() => handleAdjustStock(product, -5)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors disabled:opacity-40"
                  >
                    -5
                  </button>
                  <button
                    disabled={isUpdating || currentStock <= 0}
                    onClick={() => handleAdjustStock(product, -1)}
                    className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Display & Direct Edit */}
                <div className="text-center px-2">
                  <div className="flex items-center justify-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={currentStock}
                      key={currentStock}
                      onBlur={(e) => handleDirectInput(product, e.target.value)}
                      className="w-20 text-center font-mono font-black text-lg text-emerald-400 bg-slate-950 border border-slate-800 rounded-xl py-1 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-400 font-mono">{unit}</span>
                  </div>
                </div>

                {/* Rapid Plus Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleAdjustStock(product, 1)}
                    className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleAdjustStock(product, 5)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
