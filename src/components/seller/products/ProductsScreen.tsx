/**
 * Product Management Screen (Screen 10)
 * Catalog list, search, category filter, active toggle, base price display, and quick actions.
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Scale,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Mic,
} from 'lucide-react';
import { Product, CreateProductDTO } from '../../../types/product.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { AddProductModal } from './AddProductModal.tsx';

interface ProductsScreenProps {
  products: Product[];
  onCreateProduct: (data: CreateProductDTO) => Promise<void>;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onOpenVoiceAssistant?: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenVoiceAssistant,
}) => {
  const { language, t } = useSellerLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkParsedItems, setBulkParsedItems] = useState<any[]>([]);
  const [isParsingBulk, setIsParsingBulk] = useState(false);

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameHindi && p.nameHindi.includes(searchQuery));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleToggleActive = async (product: Product) => {
    setIsUpdatingId(product.id);
    try {
      await onUpdateProduct(product.id, { isAvailable: !product.isAvailable });
    } catch (err) {
      console.error('Failed to toggle product status', err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleQuickPriceEdit = async (product: Product) => {
    const currentPrice = product.basePricePerUnit || product.fractionalConfig?.basePrice || 0;
    const input = prompt(
      language === 'hi'
        ? `"${product.name}" का नया भाव दर्ज करें (प्रति ${product.baseUnit}):`
        : `Enter new price for "${product.name}" (per ${product.baseUnit}):`,
      currentPrice.toString()
    );
    if (input !== null) {
      const newPrice = parseFloat(input);
      if (!isNaN(newPrice) && newPrice > 0) {
        await onUpdateProduct(product.id, { basePricePerUnit: newPrice });
      }
    }
  };

  const handleQuickStockEdit = async (product: Product) => {
    const currentStock = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
    const input = prompt(
      language === 'hi'
        ? `"${product.name}" का नया स्टॉक दर्ज करें (${product.baseUnit || 'kg'}):`
        : `Enter new stock for "${product.name}" (${product.baseUnit || 'kg'}):`,
      currentStock.toString()
    );
    if (input !== null) {
      const newStock = parseFloat(input);
      if (!isNaN(newStock) && newStock >= 0) {
        await onUpdateProduct(product.id, { currentStockInBaseUnits: newStock });
      }
    }
  };

  const handleParseBulk = async () => {
    if (!bulkText.trim()) return;
    setIsParsingBulk(true);
    try {
      const userId = localStorage.getItem('seller_user_id') || 'usr_seller_01';
      const token = localStorage.getItem('seller_auth_token') || localStorage.getItem('auth_token') || `token_${userId}`;
      const res = await fetch('/api/ai/bulk/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-auth-user-id': userId,
        },
        body: JSON.stringify({ rawText: bulkText.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data?.items) {
        setBulkParsedItems(data.data.items);
      }
    } catch (err: any) {
      alert('Failed to parse bulk products: ' + err.message);
    } finally {
      setIsParsingBulk(false);
    }
  };

  const handleConfirmBulkSave = async () => {
    if (bulkParsedItems.length === 0) return;
    try {
      for (const item of bulkParsedItems) {
        await onCreateProduct({
          name: item.name,
          nameHindi: item.nameHindi,
          category: item.category || 'Grocery & Kirana',
          basePrice: item.price,
          baseUnit: item.unit || 'kg',
          stock: item.stock || 50,
          isAvailable: true,
          fractionalPricingEnabled: ['kg', 'g', 'L', 'ml'].includes(item.unit),
        });
      }
      setBulkImportOpen(false);
      setBulkParsedItems([]);
      setBulkText('');
      alert(language === 'hi' ? 'सभी सामान सफलतापूर्वक जोड़े गए!' : 'All products added successfully!');
    } catch (err: any) {
      alert('Failed to save some products: ' + err.message);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm(language === 'hi' ? 'क्या आप इस सामान को हटाना चाहते हैं?' : 'Are you sure you want to delete this product?')) {
      await onDeleteProduct(productId);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>{t('nav.products')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'दुकान के सामान, भाव व तौल विकल्प' : 'Manage catalog, prices & portions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-teal-500/30 flex items-center space-x-1.5 transition-all shadow-md"
            title="Bulk AI Import"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="hidden xs:inline">{language === 'hi' ? 'बल्क इंपोर्ट' : 'Bulk'}</span>
          </button>

          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span>{language === 'hi' ? 'बोलकर सामान जोड़ें' : 'Voice Add'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('product.add_new')}</span>
          </button>
        </div>
      </div>

      {/* Prominent Voice Assistant Quick Banner */}
      {onOpenVoiceAssistant && (
        <div
          onClick={onOpenVoiceAssistant}
          className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">
                {language === 'hi' ? '🎤 AI से बोलकर सामान मैनेज करें' : '🎤 Manage products with AI Voice'}
              </div>
              <div className="text-[11px] text-emerald-300">
                {language === 'hi'
                  ? 'उदा: "चीनी का भाव 70 रुपये किलो कर दो", "काजू 900 रुपये किलो है"'
                  : 'e.g. "Set sugar price to ₹70/kg", "Add Tata Salt 1kg ₹30"'}
              </div>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
            {language === 'hi' ? 'शुरू करें →' : 'Start →'}
          </span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'सामान खोजें (उदा. चीनी, आटा, तेल...)' : 'Search products (e.g. Sugar, Atta)...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Badges */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? (language === 'hi' ? 'सभी सामान' : 'All Items') : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid / List */}
      {filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Package className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No products found matching your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map((product) => {
            const stockLevel = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
            const threshold = product.lowStockThresholdInBaseUnits ?? product.inventory?.lowStockThreshold ?? 5;
            const isLowStock = stockLevel <= threshold;
            const price = product.basePricePerUnit || product.fractionalConfig?.basePrice || 0;
            const unit = product.baseUnit || product.fractionalConfig?.baseUnit || 'kg';
            const options = product.fractionalConfig?.predefinedOptions || [];

            return (
              <div
                key={product.id}
                className={`p-4 rounded-3xl border transition-all ${
                  product.isAvailable
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/40 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-white">{product.name}</h3>
                      {product.nameHindi && (
                        <span className="text-xs text-slate-400 font-medium">({product.nameHindi})</span>
                      )}
                      {!product.isAvailable && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-medium">
                        {product.category}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{price.toFixed(2)} / 1 {unit}
                      </span>
                    </div>
                  </div>

                  {/* On/Off Switch */}
                  <button
                    type="button"
                    disabled={isUpdatingId === product.id}
                    onClick={() => handleToggleActive(product)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                      product.isAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Fractional Portion Chips */}
                {options.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
                      Portions:
                    </span>
                    {options.map((option, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 shrink-0"
                      >
                        {option.label} (₹{(price * option.multiplier).toFixed(0)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Stock Level & Quick Action Controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">Stock:</span>
                    <span className="font-mono font-bold text-sm text-white">
                      {stockLevel} {unit}
                    </span>
                    {isLowStock && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-800 text-amber-300 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleQuickPriceEdit(product)}
                      className="py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors"
                      title="Edit Price"
                    >
                      {language === 'hi' ? 'भाव बदलें' : 'Edit Price'}
                    </button>

                    <button
                      onClick={() => handleQuickStockEdit(product)}
                      className="py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold transition-colors"
                      title="Edit Stock"
                    >
                      {language === 'hi' ? 'स्टॉक बदलें' : 'Edit Stock'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Full Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <span>{language === 'hi' ? 'बल्क AI सामान इंपोर्ट' : 'Bulk Product AI Import'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'hi'
                ? 'नीचे सामानों की सूची लिखें या पेस्ट करें। AI स्वतः तालिका तैयार करेगा।'
                : 'Paste or type a list of items. AI will structure it into a catalog table.'}
            </p>

            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="चीनी 70 रुपये किलो&#10;चावल 50 रुपये किलो&#10;तेल 140 रुपये लीटर&#10;काजू 900 रुपये किलो&#10;Tata Salt 30 रुपये किलो"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono mb-3"
            />

            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleParseBulk}
                disabled={isParsingBulk || !bulkText.trim()}
                className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isParsingBulk ? 'AI समझ रहा है...' : (language === 'hi' ? 'AI से तैयार करें' : 'Parse with AI')}</span>
              </button>

              <button
                onClick={() => {
                  setBulkImportOpen(false);
                  setBulkParsedItems([]);
                  setBulkText('');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>

            {bulkParsedItems.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-teal-300">
                  {language === 'hi' ? 'समीक्षा तालिका (Review Table):' : 'Structured Review Table:'}
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800">
                  <table className="w-full text-[11px] text-left text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2">Product</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {bulkParsedItems.map((item, idx) => (
                        <tr key={idx} className="bg-slate-900/60 hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-white">{item.name}</td>
                          <td className="p-2 font-mono">{item.unit}</td>
                          <td className="p-2 font-mono text-emerald-400 font-bold">₹{item.price}</td>
                          <td className="p-2">{item.category}</td>
                          <td className="p-2 font-mono">{item.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmBulkSave}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    {language === 'hi' ? 'सभी सामान जोड़ें (Confirm All)' : 'Confirm All Products'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={async (dto) => {
          if (editingProduct) {
            await onUpdateProduct(editingProduct.id, dto as any);
          } else {
            await onCreateProduct(dto);
          }
        }}
      />
    </div>
  );
};

