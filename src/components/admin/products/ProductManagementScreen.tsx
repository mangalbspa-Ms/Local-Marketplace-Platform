/**
 * Platform Product Catalog & Stock Governance Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import {
  Package,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Store,
  MapPin,
  Tag,
  IndianRupee,
  Layers,
  X,
} from 'lucide-react';

export const ProductManagementScreen: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState('ALL');
  const [selectedShopId, setSelectedShopId] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Edit Modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editAvailable, setEditAvailable] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, shopsData, marketsData] = await Promise.all([
        adminApi.getProducts({
          marketId: selectedMarketId !== 'ALL' ? selectedMarketId : undefined,
          shopId: selectedShopId !== 'ALL' ? selectedShopId : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          stockStatus: stockFilter !== 'ALL' ? stockFilter : undefined,
        }),
        adminApi.getShops(),
        adminApi.getMarkets(),
      ]);
      setProducts(productsData);
      setShops(shopsData);
      setMarkets(marketsData);
    } catch (err) {
      console.error('Failed to load catalog', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMarketId, selectedShopId, categoryFilter, stockFilter]);

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setEditPrice(prod.baseUnitPrice);
    setEditStock(prod.currentStockInBaseUnits);
    setEditAvailable(prod.isAvailable);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      await adminApi.updateProduct(editingProduct.id, {
        baseUnitPrice: Number(editPrice),
        currentStockInBaseUnits: Number(editStock),
        isAvailable: Boolean(editAvailable),
      });
      await loadData();
      setEditingProduct(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter((p) => {
    const q = (searchQuery || '').toLowerCase();
    const hindi = (p?.nameHindi || (p as any)?.hindiName || '');
    return (
      (p?.name || '').toLowerCase().includes(q) ||
      (hindi ? hindi.toLowerCase().includes(q) : false) ||
      (p?.shopName || '').toLowerCase().includes(q) ||
      (p?.category || '').toLowerCase().includes(q)
    );
  });

  const inStockCount = products.filter((p) => p.isAvailable && (p.currentStockInBaseUnits ?? 0) > 0).length;
  const outOfStockCount = products.filter((p) => !p.isAvailable || (p.currentStockInBaseUnits ?? 0) <= 0).length;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Marketplace Product Catalog</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} SKUs
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Monitor SKU pricing, fractional stock levels, and merchant inventory across all shops
            </p>
          </div>
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-semibold max-w-[150px] truncate"
          >
            <option value="ALL">All Shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="ALL">All Stock</option>
            <option value="AVAILABLE">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active SKUs</p>
            <h3 className="text-lg font-black text-white mt-0.5">{products.length}</h3>
            <p className="text-[10px] text-slate-500">Across {shops.length} merchants</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">In-Stock Inventory</p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">{inStockCount}</h3>
            <p className="text-[10px] text-emerald-400/70">Ready for customer ordering</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-lg font-black text-rose-400 mt-0.5">{outOfStockCount}</h3>
            <p className="text-[10px] text-rose-400/70">Depleted stock levels</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products (e.g. Sugar, Atta, Tomato, Milk)..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Product Catalog Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          Loading product catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No matching products found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`rounded-xl border p-2.5 sm:p-3 bg-slate-900/90 shadow-sm flex flex-col justify-between hover:border-slate-700 transition ${
                product.isAvailable && (product.currentStockInBaseUnits ?? 0) > 0
                  ? 'border-slate-800'
                  : 'border-rose-900/40 bg-slate-950/60 opacity-85'
              }`}
            >
              <div>
                {/* Image and Stock Badge */}
                <div className="relative w-full h-24 sm:h-28 rounded-lg overflow-hidden mb-2 border border-slate-800 bg-slate-950">
                  <img
                    src={
                      product.imageUrl && product.imageUrl.trim() !== ''
                        ? product.imageUrl
                        : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    {product.isAvailable && (product.currentStockInBaseUnits ?? 0) > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 text-[8px] font-black border border-emerald-700/80 backdrop-blur-xs">
                        IN STOCK
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-950/90 text-rose-300 text-[8px] font-black border border-rose-700/80 backdrop-blur-xs">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-0.5 mb-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-wider truncate">
                    <span>{product.category}</span>
                    <span>•</span>
                    <span className="truncate">{product.shopName}</span>
                  </div>
                  <h3 className="text-xs font-black text-white truncate">{product.name}</h3>
                  {product.hindiName && (
                    <p className="text-[11px] text-slate-400 truncate">{product.hindiName}</p>
                  )}
                </div>

                {/* Price & Unit Details */}
                <div className="grid grid-cols-2 gap-1 p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-center mb-2">
                  <div>
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Price</div>
                    <div className="text-[11px] font-black text-emerald-400 mt-0.5 truncate">
                      ₹{product.baseUnitPrice}/{product.baseUnit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Stock</div>
                    <div className="text-[11px] font-black text-white mt-0.5 truncate">
                      {product.currentStockInBaseUnits ?? 0} {product.baseUnit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleOpenEdit(product)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-98 border border-slate-700/60"
              >
                <Edit2 className="w-3 h-3 text-indigo-400" />
                <span>Adjust</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Inventory & Price Adjustment</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-sm">{editingProduct.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {editingProduct.shopName} • Base Unit: <span className="font-bold text-indigo-400 font-mono">{editingProduct.baseUnit}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Base Unit Price (₹ per {editingProduct.baseUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Available Stock ({editingProduct.baseUnit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <label htmlFor="availCheck" className="text-slate-300 font-bold cursor-pointer">
                  Product is listed & available for customer purchase
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30"
                >
                  {isSaving ? 'Saving...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
