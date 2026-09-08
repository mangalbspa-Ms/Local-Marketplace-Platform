/**
 * Screen 2 — Customer Catalog Search & Price Comparison
 * 
 * 1. Header: Back trigger, Search input with clear button, Voice Assistant mic 🎙️
 * 2. Category Filter Chips: सभी | आटा | चावल | दाल | तेल | मसाला | दूध
 * 3. Vertical Product List with Product Image, Name, Shop, ₹ Price, Unit/Weight, Stock status, and Add button
 * 4. "कीमत की तुलना करें" (Compare Prices) mode grouping items across shops
 * 5. Full support for opening Product Details (Screen 4)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { Product } from '../../../types/product.ts';
import { Shop } from '../../../types/market.ts';
import {
  Search,
  Store,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Scale,
  Star,
  Mic,
  ArrowLeft,
  ArrowUpDown,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

interface SearchScreenProps {
  initialQuery?: string;
  onSelectShop: (shop: Shop) => void;
  onOpenVoiceAssistant?: () => void;
  onOpenProductDetails?: (product: Product, shop: Shop) => void;
  onBack?: () => void;
}

const SEARCH_CATEGORY_CHIPS = [
  { id: 'all', labelEn: 'All', labelHi: 'सभी', q: '' },
  { id: 'atta', labelEn: 'Atta / Flour', labelHi: 'आटा', q: 'atta' },
  { id: 'rice', labelEn: 'Rice / Chawal', labelHi: 'चावल', q: 'rice' },
  { id: 'dal', labelEn: 'Dal / Pulses', labelHi: 'दाल', q: 'dal' },
  { id: 'oil', labelEn: 'Oil / Ghee', labelHi: 'तेल', q: 'oil' },
  { id: 'masala', labelEn: 'Masala / Spices', labelHi: 'मसाला', q: 'masala' },
  { id: 'milk', labelEn: 'Milk / Dairy', labelHi: 'दूध', q: 'milk' },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  onSelectShop,
  onOpenVoiceAssistant,
  onOpenProductDetails,
  onBack,
}) => {
  const { currentMarket, getShopDistance, shops } = useCustomerMarket();
  const { language, t } = useCustomerLanguage();
  const { addToCart, items: cartItems } = useCustomerCart();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('all');
  const [results, setResults] = useState<{ product: Product; shop: Shop }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'compare'>('list');
  const [justAddedProductIds, setJustAddedProductIds] = useState<Record<string, boolean>>({});

  const performSearch = useCallback(
    async (keyword: string) => {
      setIsSearching(true);
      try {
        const searchTerm = keyword.trim() || 'all';
        const found = await customerApi.searchCatalog(
          searchTerm === 'all' ? '' : searchTerm,
          currentMarket?.id
        );
        setResults(found);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    },
    [currentMarket]
  );

  // Initial load
  useEffect(() => {
    performSearch(initialQuery);
  }, [initialQuery, performSearch]);

  const handleChipClick = (chip: (typeof SEARCH_CATEGORY_CHIPS)[0]) => {
    setSelectedCategoryChip(chip.id);
    if (chip.q) {
      setQuery(chip.labelHi);
      performSearch(chip.q);
    } else {
      setQuery('');
      performSearch('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleAddToCart = (product: Product, shop: Shop) => {
    const defaultOpt =
      product.fractionalConfig.predefinedOptions?.find((o) => o.isDefault) ||
      product.fractionalConfig.predefinedOptions?.[0];
    const multiplier = defaultOpt ? defaultOpt.multiplier : 1.0;
    const label = defaultOpt ? defaultOpt.label : `1 ${product.fractionalConfig.baseUnit}`;

    const success = addToCart(product, shop, multiplier, 1, label);
    if (success) {
      setJustAddedProductIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setJustAddedProductIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  // Group items by normalized commodity for "कीमत की तुलना करें" (Price Comparison Mode)
  const groupedComparisons = useMemo(() => {
    if (results.length === 0) return [];

    const map = new Map<string, { product: Product; shop: Shop }[]>();

    for (const item of results) {
      const cleanName = item.product.name
        .split('(')[0]
        .split('-')[0]
        .trim()
        .toLowerCase();

      if (!map.has(cleanName)) {
        map.set(cleanName, []);
      }
      map.get(cleanName)!.push(item);
    }

    const comparisons: Array<{
      commodityName: string;
      items: { product: Product; shop: Shop; rate: number }[];
      lowestPrice: number;
      highestPrice: number;
      savings: number;
    }> = [];

    map.forEach((itemsList, name) => {
      if (itemsList.length > 0) {
        const sorted = [...itemsList].sort(
          (a, b) => a.product.fractionalConfig.basePrice - b.product.fractionalConfig.basePrice
        );
        const lowest = sorted[0].product.fractionalConfig.basePrice;
        const highest = sorted[sorted.length - 1].product.fractionalConfig.basePrice;

        comparisons.push({
          commodityName: itemsList[0].product.name.split('(')[0].trim(),
          items: sorted.map((it) => ({
            product: it.product,
            shop: it.shop,
            rate: it.product.fractionalConfig.basePrice,
          })),
          lowestPrice: lowest,
          highestPrice: highest,
          savings: highest - lowest,
        });
      }
    });

    return comparisons;
  }, [results]);

  return (
    <div className="space-y-4 pb-28 bg-white min-h-screen">
      {/* 1. Header with Search Input & Voice Mic */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'hi' ? 'सामान खोजें (उदा. आटा, दाल, टमाटर)...' : 'Search grocery, atta, rice...'}
              className="w-full bg-slate-100 text-slate-900 text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  performSearch('');
                }}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </form>

          {onOpenVoiceAssistant && (
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
              title="Voice Search"
            >
              <Mic className="w-4 h-4 text-emerald-600" />
            </button>
          )}
        </div>

        {/* 2. Category Chips (सभी | आटा | चावल | दाल | तेल | मसाला | दूध) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {SEARCH_CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedCategoryChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {language === 'hi' ? chip.labelHi : chip.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. View Mode Toggle & Results Count */}
      <div className="px-4 flex items-center justify-between">
        <div className="text-xs font-bold text-slate-900">
          {results.length} {language === 'hi' ? 'सामान उपलब्ध' : 'Products Found'}
        </div>

        {/* "कीमत की तुलना करें" / List Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'सभी सामान' : 'Product List'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTab === 'compare'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>{language === 'hi' ? 'कीमत की तुलना' : 'Compare Rates'}</span>
          </button>
        </div>
      </div>

      {/* 4. Results Display */}
      {isSearching ? (
        <div className="py-16 text-center text-xs text-slate-500">
          {language === 'hi' ? 'दुकानों में सामान खोज रहे हैं...' : 'Searching local mandi shops...'}
        </div>
      ) : results.length === 0 ? (
        <div className="px-4 py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900">
              {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No Products Found'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'कृपया अन्य नाम या श्रेणी खोजें' : 'Try searching for another grocery item'}
            </p>
          </div>
        </div>
      ) : activeTab === 'list' ? (
        /* Vertical Product List Matching Reference */
        <div className="px-4 space-y-2.5">
          {results.map(({ product, shop }) => {
            const isAdded = justAddedProductIds[product.id];
            const defaultOpt =
              product.fractionalConfig.predefinedOptions?.find((o) => o.isDefault) ||
              product.fractionalConfig.predefinedOptions?.[0];
            const portionText = defaultOpt ? defaultOpt.label : `1 ${product.fractionalConfig.baseUnit}`;

            return (
              <div
                key={`${shop.id}_${product.id}`}
                onClick={() => onOpenProductDetails && onOpenProductDetails(product, shop)}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 shadow-2xs flex items-center gap-3 transition-all cursor-pointer group"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shrink-0 relative">
                  {product.imageUrl && product.imageUrl.trim() !== '' ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                </div>

                {/* Information */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {language === 'hi' && product.nameHindi ? product.nameHindi : product.name}
                  </h3>

                  {/* Shop Name */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShop(shop);
                    }}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer truncate"
                  >
                    <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{shop.name}</span>
                  </div>

                  {/* Unit / Weight & Stock */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="text-emerald-700 font-bold">{portionText}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">✓ स्टॉक में</span>
                  </div>

                  {/* Price */}
                  <div className="text-xs font-extrabold text-slate-900 pt-0.5">
                    ₹{product.basePrice}
                  </div>
                </div>

                {/* Action: [+] or Stepper */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product, shop);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all shadow-2xs ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* "कीमत की तुलना करें" (Compare Prices Mode Grouped by Commodity) */
        <div className="px-4 space-y-4">
          {groupedComparisons.map((group) => (
            <div
              key={group.commodityName}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{group.commodityName}</h3>
                  <div className="text-[10px] text-slate-500">{group.items.length} दुकानों में उपलब्ध</div>
                </div>

                {group.savings > 0 && (
                  <div className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-emerald-600" />
                    <span>₹{group.savings} तक की बचत</span>
                  </div>
                )}
              </div>

              {/* Shop offers list */}
              <div className="space-y-2">
                {group.items.map(({ product, shop, rate }, idx) => {
                  const isLowest = idx === 0 && group.items.length > 1;
                  const distanceInfo = getShopDistance(shop);
                  const distance = distanceInfo?.distanceText || shop.distanceText || '500 m';

                  return (
                    <div
                      key={`${shop.id}_${product.id}`}
                      onClick={() => onOpenProductDetails && onOpenProductDetails(product, shop)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isLowest
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{shop.name}</span>
                          {isLowest && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold">
                              सबसे सस्ता
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{distance}</span>
                          <span>•</span>
                          <span>{shop.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">₹{rate}</div>
                          <div className="text-[9px] text-slate-500">per {product.fractionalConfig.baseUnit}</div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, shop);
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
