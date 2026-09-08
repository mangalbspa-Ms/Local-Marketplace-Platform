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

  const filtered = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.hindiName && p.hindiName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.shopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>Marketplace Product Catalog</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor SKU pricing, fractional stock levels, and merchant inventory across all active mandis.
          </p>
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold max-w-[180px] truncate"
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Stock</option>
            <option value="AVAILABLE">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products (e.g. Sugar, Atta, Tomato, Milk)..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Product Catalog Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading product catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No matching products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`rounded-3xl border p-4 bg-slate-900 shadow-lg flex flex-col justify-between ${
                product.isAvailable && (product.currentStockInBaseUnits ?? 0) > 0
                  ? 'border-slate-800'
                  : 'border-rose-900/40 bg-slate-950/60 opacity-80'
              }`}
            >
              <div>
                {/* Image and Stock Badge */}
                <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3 border border-slate-800 bg-slate-950">
                  <img
                    src={
                      product.imageUrl && product.imageUrl.trim() !== ''
                        ? product.imageUrl
                        : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {product.isAvailable && (product.currentStockInBaseUnits ?? 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-black border border-emerald-700/80 backdrop-blur-xs">
                        IN STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 text-[10px] font-black border border-rose-700/80 backdrop-blur-xs">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    <span>{product.category}</span>
                    <span>•</span>
                    <span className="truncate">{product.shopName}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{product.name}</h3>
                  {product.hindiName && (
                    <p className="text-xs text-slate-400 font-hindi">{product.hindiName}</p>
                  )}
                </div>

                {/* Price & Unit Details */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center mb-3">
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Base Price</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">
                      ₹{product.baseUnitPrice} / {product.baseUnit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Stock Level</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {product.currentStockInBaseUnits ?? 0} {product.baseUnit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleOpenEdit(product)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Adjust Stock / Price</span>
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
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
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
