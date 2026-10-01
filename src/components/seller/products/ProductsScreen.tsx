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
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    setDeleteError(null);
    try {
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'सामान हटाने में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>{t('nav.products')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'दुकान के सामान, भाव व तौल विकल्प' : 'Manage catalog, prices & portions'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="py-2.5 px-3 rounded-2xl bg-[#0b142c] hover:bg-cyan-950/60 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            title="Bulk AI Import"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="hidden xs:inline">{language === 'hi' ? 'बल्क इंपोर्ट' : 'Bulk'}</span>
          </button>

          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
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
            className="py-2.5 px-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'hi' ? '+ नया सामान जोड़ें' : '+ Add Product'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Voice Assistant Quick Banner */}
      {onOpenVoiceAssistant && (
        <div
          onClick={onOpenVoiceAssistant}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0b142c] via-[#091f38] to-[#072428] border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? '🎤 AI से बोलकर सामान मैनेज करें' : '🎤 Manage products with AI Voice'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 text-[9px] font-black border border-cyan-400/40">
                  2050 Live
                </span>
              </div>
              <div className="text-[11px] text-cyan-200/80 mt-0.5">
                {language === 'hi'
                  ? 'उदा: "चीनी का भाव 70 रुपये किलो कर दो", "काजू 900 रुपये किलो है"'
                  : 'e.g. "Set sugar price to ₹70/kg", "Add Tata Salt 1kg ₹30"'}
              </div>
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
            {language === 'hi' ? 'शुरू करें →' : 'Start →'}
          </span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'सामान खोजें (उदा. चीनी, आटा, तेल...)' : 'Search products (e.g. Sugar, Atta)...'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0b142c]/90 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-[#0b142c]/80 border-cyan-500/20 text-slate-400 hover:text-slate-200'
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
        <div className="p-8 text-center bg-[#0b142c]/90 border border-cyan-500/20 rounded-3xl space-y-3">
          <Package className="w-8 h-8 text-cyan-500/40 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No products found matching your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map((product) => {
            const stockLevel = product.currentStockInBaseUnits ?? product.inventory?.currentStockInBaseUnits ?? 0;
            const threshold = product.lowStockThresholdInBaseUnits ?? product.inventory?.lowStockThreshold ?? 5;
            const isOutOfStock = stockLevel <= 0;
            const isLowStock = !isOutOfStock && stockLevel <= threshold;
            const price = product.basePricePerUnit || product.fractionalConfig?.basePrice || 0;
            const unit = product.baseUnit || product.fractionalConfig?.baseUnit || 'kg';
            const options = product.fractionalConfig?.predefinedOptions || [];

            return (
              <div
                key={product.id}
                className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                  product.isAvailable
                    ? 'bg-[#0b142c]/90 border-cyan-500/25 hover:border-cyan-400/50 shadow-lg'
                    : 'bg-[#070e24]/70 border-cyan-500/10 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Product Photo or Futuristic Icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                        <h3 className="font-bold text-sm text-white truncate">{product.name}</h3>
                        {product.nameHindi && (
                          <span className="text-xs text-slate-400 font-medium">({product.nameHindi})</span>
                        )}
                        {!product.isAvailable && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-950/80 text-rose-400 border border-rose-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                        <span className="px-2 py-0.5 rounded-lg bg-[#070e24] text-cyan-300 border border-cyan-500/20 font-medium text-[11px]">
                          {product.category}
                        </span>
                        <span className="font-mono font-black text-cyan-300 text-sm">
                          ₹{price.toFixed(2)} / 1 {unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* On/Off Switch */}
                  <button
                    type="button"
                    disabled={isUpdatingId === product.id}
                    onClick={() => handleToggleActive(product)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer shrink-0 ${
                      product.isAvailable ? 'bg-cyan-500 justify-end shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>

                {/* Fractional Portion Chips */}
                {options.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-cyan-500/15 flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold shrink-0">
                      Portions:
                    </span>
                    {options.map((option, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#070e24] border border-cyan-500/20 text-[11px] font-mono text-slate-300 shrink-0"
                      >
                        {option.label} (₹{(price * option.multiplier).toFixed(0)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Stock Level & Quick Action Controls */}
                <div className="mt-3 pt-2.5 border-t border-cyan-500/15 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium">स्टॉक:</span>
                    <span className="font-mono font-bold text-sm text-white">
                      {stockLevel} {unit}
                    </span>

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center space-x-1 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Out of Stock</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500 text-amber-300 flex items-center space-x-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleQuickPriceEdit(product)}
                      className="py-1 px-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition cursor-pointer"
                      title="Edit Price"
                    >
                      {language === 'hi' ? 'भाव बदलें' : 'Edit Price'}
                    </button>

                    <button
                      onClick={() => handleQuickStockEdit(product)}
                      className="py-1 px-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-500/30 text-blue-300 text-xs font-bold transition cursor-pointer"
                      title="Edit Stock"
                    >
                      {language === 'hi' ? 'स्टॉक बदलें' : 'Edit Stock'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
                      title="Full Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* RED TRASH / DELETE BUTTON */}
                    <button
                      id={`delete-product-${product.id}`}
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setProductToDelete(product);
                      }}
                      className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] transition cursor-pointer"
                      title={language === 'hi' ? 'सामान हटाएँ' : 'Delete Product'}
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

      {/* Product Delete Confirmation Modal */}
      {productToDelete && (
        <div id="delete-product-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">
              क्या आप इस सामान को हटाना चाहते हैं?
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              क्या आप वाकई <strong className="text-white">"{productToDelete.nameHindi || productToDelete.name}"</strong> को अपनी दुकान के कैटलॉग से हटाना चाहते हैं?
            </p>

            {deleteError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                id="btn-cancel-delete"
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingProduct}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                रद्द करें
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={confirmDeleteProduct}
                disabled={isDeletingProduct}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-rose-950 disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <span>हटाया जा रहा है...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएँ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

