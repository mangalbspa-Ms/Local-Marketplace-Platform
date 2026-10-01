/**
 * Inventory & Stock Screen (2050 Futuristic Command)
 * Real-time stock monitor in base units with rapid adjuster controls and alerts.
 */

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Search,
  Package,
  Layers,
  Sparkles,
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

  const totalStockUnits = products.reduce((sum, p) => {
    return sum + (p.currentStockInBaseUnits ?? p.inventory?.currentStockInBaseUnits ?? 0);
  }, 0);

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
    <div id="seller-inventory-screen" className="p-3 sm:p-4 space-y-4 max-w-4xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <span>{t('nav.inventory')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'स्टॉक स्तर व त्वरित ± काउंटर समायोजन' : 'Live stock in base units & rapid adjustments'}
          </p>
        </div>

        {lowStockCount > 0 && (
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterLowStockOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}
      </div>

      {/* Futuristic KPI Strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">कुल सामान</div>
          <div className="font-mono text-lg font-black text-white mt-0.5">{products.length}</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">SKUs Active</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 shadow-md">
          <div className="text-[10px] uppercase font-bold text-slate-400">कुल स्टॉक इकाइयाँ</div>
          <div className="font-mono text-lg font-black text-cyan-300 mt-0.5">{totalStockUnits.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Base Units</div>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 shadow-md cursor-pointer hover:border-amber-400/50 transition"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400">कम स्टॉक चेतावनी</div>
          <div className={`font-mono text-lg font-black mt-0.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {lowStockCount > 0 ? 'Reorder Needed' : 'All Sufficient'}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'hi' ? 'स्टॉक में सामान खोजें...' : 'Search inventory items...'}
          className="w-full pl-10 pr-4 py-2.5 bg-[#0b142c]/90 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
        />
      </div>

      {/* Inventory List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-[#0b142c]/90 border border-cyan-500/20 rounded-3xl space-y-2">
            <Package className="w-8 h-8 text-cyan-500/40 mx-auto" />
            <p className="text-xs text-slate-400">
              {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No items match your filter'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const currentStock = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
            const threshold = product.lowStockThresholdInBaseUnits ?? product.inventory?.lowStockThreshold ?? 5;
            const isOutOfStock = currentStock <= 0;
            const isLow = !isOutOfStock && currentStock <= threshold;
            const isUpdating = updatingId === product.id;
            const price = product.basePricePerUnit || product.fractionalConfig?.basePrice || 0;
            const unit = product.baseUnit || product.fractionalConfig?.baseUnit || 'kg';

            return (
              <div
                key={product.id}
                className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                  isOutOfStock
                    ? 'bg-[#0b142c]/90 border-rose-500/40 shadow-md'
                    : isLow
                    ? 'bg-[#0b142c]/90 border-amber-500/40 shadow-md'
                    : 'bg-[#0b142c]/90 border-cyan-500/20 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-white truncate">{product.name}</h3>
                        {product.nameHindi && (
                          <span className="text-xs text-slate-400">({product.nameHindi})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Unit: <span className="text-cyan-300 font-mono font-semibold">{unit}</span> • Base: ₹{price}/{unit}
                      </div>
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center space-x-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Out of Stock</span>
                    </span>
                  ) : isLow ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950/80 border border-amber-500 text-amber-300 flex items-center space-x-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('product.low_stock')} (&le; {threshold})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>In Stock</span>
                    </span>
                  )}
                </div>

                {/* Adjuster Bar */}
                <div className="mt-3.5 pt-3 border-t border-cyan-500/15 flex items-center justify-between gap-2">
                  {/* Rapid Minus Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={isUpdating || currentStock <= 0}
                      onClick={() => handleAdjustStock(product, -5)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#070e24] border border-cyan-500/20 hover:border-rose-400 text-xs font-mono font-bold text-slate-300 hover:text-rose-300 transition disabled:opacity-40 cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      disabled={isUpdating || currentStock <= 0}
                      onClick={() => handleAdjustStock(product, -1)}
                      className="p-1.5 rounded-xl bg-[#070e24] border border-cyan-500/20 hover:border-rose-400 text-xs font-mono font-bold text-slate-300 hover:text-rose-300 transition disabled:opacity-40 cursor-pointer"
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
                        className="w-20 text-center font-mono font-black text-lg text-cyan-300 bg-[#070e24] border border-cyan-500/30 rounded-xl py-1 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      />
                      <span className="text-xs font-bold text-cyan-400/80 font-mono">{unit}</span>
                    </div>
                  </div>

                  {/* Rapid Plus Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAdjustStock(product, 1)}
                      className="p-1.5 rounded-xl bg-[#070e24] border border-cyan-500/20 hover:border-emerald-400 text-xs font-mono font-bold text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleAdjustStock(product, 5)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#070e24] border border-cyan-500/20 hover:border-emerald-400 text-xs font-mono font-bold text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
