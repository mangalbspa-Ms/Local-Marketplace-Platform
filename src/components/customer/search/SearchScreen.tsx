/**
 * Screen 2 — Customer Catalog Search & Price Comparison
 * 
 * 1. Header: Back trigger, Search input with clear button, Voice Assistant mic 🎙️
 * 2. Category Filter Chips: सभी | आटा | चावल | दाल | तेल | मसाला | दूध
 * 3. Vertical Product List with Product Image, Name, Shop, ₹ Price, Unit/Weight, Stock status, and Add button
 * 4. "कीमत की तुलना करें" (Compare Prices) mode grouping items across shops
 * 5. Full support for opening Product Details (Screen 4)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { Product } from '../../../types/product.ts';
import { Shop } from '../../../types/market.ts';
import { findMatchingShop } from '../voice/shopVoiceMatcher.ts';
import { createSpeechRecognition, requestMicrophonePermission } from '../../../utils/speechRecognitionHelper.ts';
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
  MicOff,
  ArrowLeft,
  ArrowUpDown,
  TrendingDown,
  ShieldCheck,
  History,
  Clock,
  Trash2,
} from 'lucide-react';

interface SearchScreenProps {
  initialQuery?: string;
  autoStartVoice?: boolean;
  onSelectShop: (shop: Shop) => void;
  onOpenVoiceAssistant?: () => void;
  onOpenProductDetails?: (product: Product, shop: Shop) => void;
  onBack?: () => void;
}

const RECENT_SEARCHES_STORAGE_KEY = 'mandi_customer_recent_searches';

const SUGGESTED_SEARCHES = [
  { term: 'आटा', label: 'आटा (Atta)' },
  { term: 'चावल', label: 'चावल (Rice)' },
  { term: 'दाल', label: 'दाल (Dal)' },
  { term: 'तेल', label: 'सरसों तेल (Oil)' },
  { term: 'दूध', label: 'दूध (Milk)' },
  { term: 'टमाटर', label: 'टमाटर (Tomato)' },
];

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
  autoStartVoice = false,
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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Local storage recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0
          );
        }
      }
    } catch (err) {
      console.error('Error loading recent searches from localStorage:', err);
    }
    return [];
  });

  const saveRecentSearch = useCallback((searchTerm: string) => {
    const clean = (searchTerm || '').trim();
    if (!clean || clean.toLowerCase() === 'all') return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => (item || '').toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recent search to localStorage:', err);
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((termToRemove: string) => {
    const target = (termToRemove || '').toLowerCase();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => (item || '').toLowerCase() !== target);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error removing recent search from localStorage:', err);
      }
      return updated;
    });
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing recent searches from localStorage:', err);
    }
  }, []);

  const lastTranscriptRef = useRef('');

  const performSearch = useCallback(
    async (keyword: string, queryLabelToSave?: string) => {
      setIsSearching(true);
      try {
        const searchTerm = keyword.trim();
        if (searchTerm) {
          const matchedShop = findMatchingShop(searchTerm, shops);
          if (matchedShop && onSelectShop) {
            setIsSearching(false);
            onSelectShop(matchedShop);
            return;
          }
        }

        const apiParam = !searchTerm || searchTerm.toLowerCase() === 'all' ? '' : searchTerm;
        const found = await customerApi.searchCatalog(
          apiParam,
          currentMarket?.id
        );
        setResults(found);

        // Save to local storage ONLY if search is successful (returned matching products)
        const termToRecord = (queryLabelToSave || searchTerm).trim();
        if (
          termToRecord &&
          termToRecord.toLowerCase() !== 'all' &&
          found &&
          found.length > 0
        ) {
          saveRecentSearch(termToRecord);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    },
    [currentMarket, onSelectShop, saveRecentSearch, shops]
  );

  // Initial load
  useEffect(() => {
    performSearch(initialQuery);
  }, [initialQuery, performSearch]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startRecognition = useCallback(async () => {
    stopRecognition();

    const permResult = await requestMicrophonePermission();
    if (!permResult.granted) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        return;
      }
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const cleanFinal = finalTranscript.trim();
        const cleanInterim = interimTranscript.trim();
        lastTranscriptRef.current = cleanFinal || cleanInterim;

        if (cleanFinal) {
          setQuery(cleanFinal);
          const matchedShop = findMatchingShop(cleanFinal, shops);
          if (matchedShop && onSelectShop) {
            stopRecognition();
            onSelectShop(matchedShop);
            return;
          }
          performSearch(cleanFinal);
        } else if (cleanInterim) {
          setQuery(cleanInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice search recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        const candidate = (lastTranscriptRef.current || '').trim();
        if (candidate) {
          const matchedShop = findMatchingShop(candidate, shops);
          if (matchedShop && onSelectShop) {
            onSelectShop(matchedShop);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start voice search', err);
      setIsListening(false);
    }
  }, [language, onSelectShop, performSearch, shops, stopRecognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }, [isListening, startRecognition, stopRecognition]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  // Auto-start voice search if requested (e.g. routed from Customer Home Voice button)
  useEffect(() => {
    if (autoStartVoice) {
      startRecognition();
    }
  }, [autoStartVoice, startRecognition]);

  const handleChipClick = (chip: (typeof SEARCH_CATEGORY_CHIPS)[0]) => {
    setSelectedCategoryChip(chip.id);
    if (chip.q) {
      setQuery(chip.labelHi);
      performSearch(chip.q, chip.labelHi);
    } else {
      setQuery('');
      performSearch('');
    }
  };

  const handleRecentSearchClick = (item: string) => {
    setQuery(item);
    setSelectedCategoryChip('all');
    const matchedShop = findMatchingShop(item, shops);
    if (matchedShop && onSelectShop) {
      onSelectShop(matchedShop);
      return;
    }
    performSearch(item);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = query.trim();
    if (cleanQ) {
      const matchedShop = findMatchingShop(cleanQ, shops);
      if (matchedShop && onSelectShop) {
        onSelectShop(matchedShop);
        return;
      }
    }
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
      const rawName = item?.product?.name || '';
      const cleanName = rawName
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
        const getPrice = (p: typeof itemsList[0]['product']) =>
          p.fractionalConfig?.basePrice ?? p.basePricePerUnit ?? (p as any).basePrice ?? 0;
        const sorted = [...itemsList].sort(
          (a, b) => getPrice(a.product) - getPrice(b.product)
        );
        const lowest = getPrice(sorted[0].product);
        const highest = getPrice(sorted[sorted.length - 1].product);

        comparisons.push({
          commodityName: itemsList[0].product.name.split('(')[0].trim(),
          items: sorted.map((it) => ({
            product: it.product,
            shop: it.shop,
            rate: getPrice(it.product),
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
      {/* 1. Header with Recent Searches on top, Search Input, and Categories */}
      <div id="customer-search-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-200 shadow-2xs space-y-2">
        {/* Recent Searches Chips: Displayed ABOVE the search input field for quick re-use */}
        {recentSearches.length > 0 && (
          <div id="recent-searches-header-bar" className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar touch-pan-x">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 shrink-0 pr-0.5">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'hi' ? 'हाल की खोज:' : 'Recent Searches:'}</span>
            </div>
            {recentSearches.map((item) => (
              <div
                key={item}
                id={`recent-search-chip-${encodeURIComponent(item)}`}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-300 transition-colors shrink-0 group cursor-pointer shadow-2xs"
                onClick={() => handleRecentSearchClick(item)}
                title={language === 'hi' ? `"${item}" खोजें` : `Search "${item}"`}
              >
                <span className="font-medium truncate max-w-[120px]">{item}</span>
                <button
                  type="button"
                  id={`remove-recent-search-${encodeURIComponent(item)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(item);
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label={`Remove ${item}`}
                  title={language === 'hi' ? 'हटाएं' : 'Remove'}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              id="clear-recent-searches-header-btn"
              onClick={clearAllRecentSearches}
              className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline shrink-0 px-1 font-medium transition-colors"
            >
              {language === 'hi' ? 'साफ़ करें' : 'Clear'}
            </button>
          </div>
        )}

        {/* Search Input Row with Back, Input & Voice Mic */}
        <div id="search-input-row" className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              id="search-back-button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <form id="search-input-form" onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="search-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isListening
                  ? (language === 'hi' ? '🎙️ सुन रहे हैं... दुकान या सामान का नाम बोलें' : '🎙️ Listening... speak shop or item name')
                  : (language === 'hi' ? 'सामान या दुकान खोजें (उदा. मनीष किराना, आटा)...' : 'Search groceries or shops...')
              }
              className={`w-full text-xs pl-9 pr-16 py-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-50 border-rose-300 text-rose-900 placeholder:text-rose-500'
                  : 'bg-slate-100 text-slate-900 border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:bg-white'
              }`}
              autoFocus
            />
            <div className="absolute right-2 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  id="search-clear-query-btn"
                  onClick={() => {
                    setQuery('');
                    performSearch('');
                  }}
                  className="w-5 h-5 flex items-center justify-center text-xs text-slate-400 hover:text-slate-600 font-bold rounded-full hover:bg-slate-200 transition-colors"
                  title={language === 'hi' ? 'हटाएं' : 'Clear'}
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                id="search-execute-submit-btn"
                className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs shadow-2xs transition-colors shrink-0"
                title={language === 'hi' ? 'खोजें' : 'Search'}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <button
            type="button"
            id="search-voice-mic-btn"
            onClick={() => {
              if (onOpenVoiceAssistant) {
                onOpenVoiceAssistant();
              } else {
                toggleListening();
              }
            }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 shadow-2xs cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-2 ring-rose-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={language === 'hi' ? 'बोलकर खोजें' : 'Voice Search'}
            aria-label="Voice Search"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        </div>

        {/* Voice Search Active Banner */}
        {isListening && (
          <div className="px-4 py-1.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
              <span>{language === 'hi' ? 'बोलें... दुकान या सामान खोजा जा रहा है' : 'Listening... searching shops or items'}</span>
            </div>
            <button
              type="button"
              onClick={stopRecognition}
              className="text-[11px] font-semibold text-rose-600 underline hover:text-rose-800"
            >
              {language === 'hi' ? 'रोकें' : 'Stop'}
            </button>
          </div>
        )}

        {/* 2. Category Chips (सभी | आटा | चावल | दाल | तेल | मसाला | दूध) */}
        <div id="search-category-chips-row" className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar touch-pan-x">
          {SEARCH_CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedCategoryChip === chip.id;
            return (
              <button
                key={chip.id}
                id={`search-category-chip-${chip.id}`}
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
        !query.trim() ? (
          /* Zero/Initial state when no search has been entered yet */
          <div className="px-4 py-4 space-y-4">
            {recentSearches.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'hi' ? 'हाल की खोजें (Recent Searches)' : 'Recent Searches'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllRecentSearches}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'hi' ? 'साफ़ करें' : 'Clear All'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <div
                      key={item}
                      onClick={() => handleRecentSearchClick(item)}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs cursor-pointer transition-all"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(item);
                        }}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 ml-0.5 transition-colors"
                        title={language === 'hi' ? 'हटाएं' : 'Remove'}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'hi' ? 'लोकप्रिय खोजें' : 'Popular Searches'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SEARCHES.map((sug) => (
                  <button
                    key={sug.term}
                    id={`suggested-search-${sug.term}`}
                    type="button"
                    onClick={() => {
                      setQuery(sug.term);
                      performSearch(sug.term, sug.term);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Zero results for query */
          <div className="px-4 py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">
                {language === 'hi' ? `"${query}" के लिए कोई सामान नहीं मिला` : `No Products Found for "${query}"`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'hi' ? 'कृपया अन्य नाम या श्रेणी खोजें' : 'Try searching for another grocery item'}
              </p>
            </div>

            {recentSearches.length > 0 && (
              <div className="pt-2 max-w-sm mx-auto space-y-2">
                <div className="text-[11px] font-bold text-slate-500">
                  {language === 'hi' ? 'हाल की खोजें आज़माएं:' : 'Try your recent searches:'}
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {recentSearches.slice(0, 5).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleRecentSearchClick(item)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
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
                    ₹{product.fractionalConfig?.basePrice ?? product.basePricePerUnit ?? (product as any).basePrice ?? 0}
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
