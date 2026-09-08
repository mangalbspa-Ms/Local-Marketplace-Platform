/**
 * Master Catalog Bulk Add Modal
 * 
 * Allows Admin to browse the Central Master Catalogue and add products to a specific shop.
 * Features:
 * - Search by Name, Hindi Name, Aliases
 * - Filter by Category and Subcategory
 * - Select individual products, multiple products, entire category, or all products
 * - Prevents duplicate products if already present in shop
 * - Automatically copies photo and identity from Master Catalogue
 * - Does not overwrite shop-specific price/stock settings
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
  Package,
  Filter,
  Layers,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { MasterProduct, Product } from '../../../../types/product.ts';
import { adminApi } from '../../../../services/adminApi.ts';
import { getAllMasterCatalogProducts } from '../../../../data/products/kiranaProductCatalog.ts';

interface MasterCatalogBulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  existingProductNames?: Set<string>;
  existingProducts?: Product[];
  onBulkAdded: (count: number) => void;
}

export const MasterCatalogBulkAddModal: React.FC<MasterCatalogBulkAddModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  existingProductNames,
  existingProducts = [],
  onBulkAdded,
}) => {
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [resultNotice, setResultNotice] = useState<{ added: number; skipped: number } | null>(null);

  // Set of existing product identifiers in this shop to strictly prevent duplicates
  const existingIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    const hindiNames = new Set<string>();

    existingProducts.forEach((p) => {
      if (p.masterProductId) ids.add(p.masterProductId);
      if (p.name) names.add(p.name.trim().toLowerCase());
      if (p.nameHindi) hindiNames.add(p.nameHindi.trim().toLowerCase());
    });

    if (existingProductNames) {
      existingProductNames.forEach((n) => names.add(n.trim().toLowerCase()));
    }

    return { ids, names, hindiNames };
  }, [existingProducts, existingProductNames]);

  // Check if a master product is already in the shop
  const isProductAlreadyInShop = (item: MasterProduct): boolean => {
    if (existingIdentifiers.ids.has(item.id)) return true;
    if (existingIdentifiers.names.has(item.name.trim().toLowerCase())) return true;
    if (item.nameHindi && existingIdentifiers.hindiNames.has(item.nameHindi.trim().toLowerCase())) return true;
    return false;
  };

  // Load Master Products from Central Master API
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    setSelectedProductIds({});
    setResultNotice(null);

    const loadMaster = async () => {
      try {
        const res = await adminApi.getMasterProducts();
        if (isMounted) {
          if (res && res.products && res.products.length > 0) {
            setMasterProducts(res.products);
          } else {
            // Fallback to local Kirana catalog if DB state was empty
            const fallback = getAllMasterCatalogProducts().map((k) => ({
              id: k.id,
              name: k.canonicalNameEnglish || k.canonicalNameHindi,
              nameHindi: k.canonicalNameHindi,
              aliases: k.searchableAliases || [],
              category: k.category,
              subCategory: k.subcategory,
              imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
              brand: k.brand,
              defaultUnit: k.defaultUnits?.[0] || 'kg',
              isActive: true,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            }));
            setMasterProducts(fallback);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load master catalogue from API, using fallback', err);
        if (isMounted) {
          const fallback = getAllMasterCatalogProducts().map((k) => ({
            id: k.id,
            name: k.canonicalNameEnglish || k.canonicalNameHindi,
            nameHindi: k.canonicalNameHindi,
            aliases: k.searchableAliases || [],
            category: k.category,
            subCategory: k.subcategory,
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
            brand: k.brand,
            defaultUnit: k.defaultUnits?.[0] || 'kg',
            isActive: true,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          }));
          setMasterProducts(fallback);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMaster();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    masterProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [masterProducts]);

  // Subcategories list for currently selected category
  const subCategories = useMemo(() => {
    const set = new Set<string>();
    masterProducts.forEach((p) => {
      if (selectedCategory === 'ALL' || p.category === selectedCategory) {
        if (p.subCategory && p.subCategory.trim() !== '') {
          set.add(p.subCategory.trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [masterProducts, selectedCategory]);

  // Filter master catalog items
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return masterProducts.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubCategory !== 'ALL' && p.subCategory !== selectedSubCategory) {
        return false;
      }
      // Search filter (English name, Hindi name, Aliases, Brand)
      if (q.length > 0) {
        const matchesEng = (p.name || '').toLowerCase().includes(q);
        const matchesHindi = (p.nameHindi || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesSubcat = (p.subCategory || '').toLowerCase().includes(q);
        const matchesAlias = p.aliases?.some((a) => a.toLowerCase().includes(q));
        if (!matchesEng && !matchesHindi && !matchesBrand && !matchesSubcat && !matchesAlias) {
          return false;
        }
      }
      return true;
    });
  }, [masterProducts, searchQuery, selectedCategory, selectedSubCategory]);

  // Count items already present vs selectable
  const alreadyInShopCount = useMemo(() => {
    return masterProducts.filter((p) => isProductAlreadyInShop(p)).length;
  }, [masterProducts, existingIdentifiers]);

  const selectedCount = Object.values(selectedProductIds).filter(Boolean).length;

  if (!isOpen) return null;

  const handleToggleSelect = (item: MasterProduct) => {
    if (isProductAlreadyInShop(item)) return; // Prevent selecting items already in shop
    setSelectedProductIds((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

  // Select all filtered items (skipping ones already in shop)
  const handleSelectAllFiltered = () => {
    const newSelected = { ...selectedProductIds };
    filteredProducts.forEach((p) => {
      if (!isProductAlreadyInShop(p)) {
        newSelected[p.id] = true;
      }
    });
    setSelectedProductIds(newSelected);
  };

  // Select all items in current category (skipping ones already in shop)
  const handleSelectCurrentCategory = () => {
    const newSelected = { ...selectedProductIds };
    masterProducts.forEach((p) => {
      if ((selectedCategory === 'ALL' || p.category === selectedCategory) && !isProductAlreadyInShop(p)) {
        newSelected[p.id] = true;
      }
    });
    setSelectedProductIds(newSelected);
  };

  // Select Essentials (Staples: Atta, Rice, Dal, Oil, Ghee, Sugar, Salt, Spices, Tea, Biscuits, Soap)
  const handleSelectEssentials = () => {
    const newSelected = { ...selectedProductIds };
    const keywords = [
      'atta', 'आटा', 'rice', 'चावल', 'dal', 'दाल', 'oil', 'तेल', 'ghee', 'घी',
      'sugar', 'चीनी', 'salt', 'नमक', 'masala', 'मसाला', 'haldi', 'हल्दी',
      'jeera', 'जीरा', 'mirch', 'मिर्च', 'tea', 'चाय', 'biscuit', 'बिस्कुट',
      'maggi', 'मैगी', 'soap', 'साबुन', 'surf', 'सर्फ', 'toothpaste', 'कोलगेट'
    ];

    masterProducts.forEach((p) => {
      if (isProductAlreadyInShop(p)) return;
      const eng = (p.name || '').toLowerCase();
      const hindi = (p.nameHindi || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const isMatch = keywords.some((kw) => eng.includes(kw) || hindi.includes(kw) || brand.includes(kw));
      if (isMatch) {
        newSelected[p.id] = true;
      }
    });

    setSelectedProductIds(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedProductIds({});
  };

  // Add selected products to shop
  const handleImportSelected = async () => {
    const idsToImport = Object.keys(selectedProductIds).filter((id) => selectedProductIds[id]);
    if (idsToImport.length === 0) return;

    setIsImporting(true);
    try {
      const result = await adminApi.bulkAddFromMaster(shopId, idsToImport);
      setResultNotice({ added: result.addedCount, skipped: result.skippedCount });
      onBulkAdded(result.addedCount);

      // Close modal after showing success brief
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to add products from master', err);
      alert(err.message || 'सामान जोड़ने में त्रुटि हुई');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Master Catalogue से सामान जोड़ें
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline">
                  दुकान: {shopName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                सामान चुनकर एक क्लिक में जोड़ें — फोटो व पहचान स्वतः जुड़ जाएगी, मूल्य व स्टॉक बाद में तय करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Notice Banner */}
        {resultNotice && (
          <div className="bg-emerald-600 px-5 py-3 text-sm font-bold text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                {resultNotice.added} सामान दुकान के कैटलॉग में सफलतापूर्वक जोड़े गए!{' '}
                {resultNotice.skipped > 0 && `(${resultNotice.skipped} सामान पहले से मौजूद होने के कारण छोड़े गए)`}
              </span>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="border-b border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="सामान का नाम खोजें (हिंदी, English, Aliases, Brand)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory('ALL');
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="ALL">सभी श्रेणियां ({masterProducts.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Dropdown */}
            {subCategories.length > 0 && (
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-hidden"
              >
                <option value="ALL">सभी उप-श्रेणियां</option>
                {subCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 font-semibold"
              >
                ✓ सभी चुनें (Select All)
              </button>
              <button
                type="button"
                onClick={handleSelectCurrentCategory}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700 font-semibold"
              >
                पूरी श्रेणी चुनें
              </button>
              <button
                type="button"
                onClick={handleSelectEssentials}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300 hover:bg-amber-500/20 font-bold flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                जरूरी सामान (40+ Essentials)
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="rounded-lg border border-slate-700 px-2.5 py-1 text-slate-400 hover:text-white"
                >
                  अनचेक करें
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              दिख रहे हैं: <span className="text-white font-bold">{filteredProducts.length}</span> | पहले से मौजूद:{' '}
              <span className="text-emerald-400 font-bold">{alreadyInShopCount}</span>
            </div>
          </div>
        </div>

        {/* Product List Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400 mb-3" />
              <p className="text-sm text-slate-300">मास्टर कैटलॉग लोड हो रहा है...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Package className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">कोई सामान नहीं मिला</p>
              <p className="text-xs text-slate-500 mt-1">खोज शब्द या फ़िल्टर बदलकर देखें</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const alreadyIn = isProductAlreadyInShop(p);
                const isSelected = Boolean(selectedProductIds[p.id]);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleSelect(p)}
                    className={`relative flex items-start gap-3 rounded-xl border p-3 transition cursor-pointer select-none ${
                      alreadyIn
                        ? 'border-emerald-500/30 bg-emerald-950/20 opacity-75 cursor-default'
                        : isSelected
                        ? 'border-amber-500/80 bg-amber-500/10 shadow-md shadow-amber-500/5'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="mt-0.5 shrink-0">
                      {alreadyIn ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : isSelected ? (
                        <CheckSquare className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                      )}
                    </div>

                    {/* Product Photo */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-800">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{p.nameHindi}</h4>
                        {alreadyIn && (
                          <span className="shrink-0 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            ✓ मौजूद है
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.name}</p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">{p.category}</span>
                        {p.brand && (
                          <span className="rounded bg-amber-950/60 px-1.5 py-0.5 text-amber-300 border border-amber-800/40">
                            {p.brand}
                          </span>
                        )}
                        <span className="text-slate-500">इकाई: {p.defaultUnit || 'kg'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="text-xs text-slate-300">
            चयनित सामान:{' '}
            <span className="text-sm font-black text-amber-400">{selectedCount}</span> सामान
            {selectedCount > 0 && (
              <span className="text-slate-400 ml-2">(बिना किसी डुप्लीकेट के सीधे दुकान में जुड़ेंगे)</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
            >
              रद्द करें
            </button>
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedCount === 0 || isImporting}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-lg transition active:scale-95 ${
                selectedCount > 0 && !isImporting
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isImporting && <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />}
              <span>{selectedCount > 0 ? `चयनित ${selectedCount} सामान दुकान में जोड़ें` : 'सामान चुनें'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
