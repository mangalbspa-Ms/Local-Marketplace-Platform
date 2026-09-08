/**
 * Screen 3 — Shop Details & Storefront Screen
 * 
 * 1. Top Cover / Photo with Back button & Favorite toggle ♡
 * 2. Shop Details Card: Verified badge, ⭐ Rating (324), 📍 Distance, ⏱ 20–25 मिनट
 * 3. Welcome Banner: "{shopName} में आपका स्वागत है 🙏"
 * 4. Shop Search: "🔍 इस दुकान में सामान खोजें" + 🎙️
 * 5. Category Chips: सभी | किराना | चावल | आटा | तेल | मसाला | स्नैक्स
 * 6. Product Cards (2-column & list view) with image, name, weight, ₹ price, discount, and [ − 1 + ] stepper
 * 7. Bottom Floating Cart Bar with 1-click checkout trigger
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shop } from '../../../types/market.ts';
import { Product } from '../../../types/product.ts';
import { customerApi } from '../../../services/customerApi.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { CustomPortionModal } from './CustomPortionModal.tsx';
import { ProductDetailModal } from './ProductDetailModal.tsx';
import {
  ArrowLeft,
  Heart,
  Star,
  Clock,
  Bike,
  ShoppingBag,
  Search,
  Check,
  Plus,
  Minus,
  Scale,
  Phone,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Mic,
  Navigation,
} from 'lucide-react';

interface ShopStorefrontProps {
  shop: Shop;
  onBack: () => void;
  onViewCart: () => void;
  onOpenVoiceAssistant?: () => void;
}

const SHOP_CATEGORIES = [
  { id: 'all', labelEn: 'All', labelHi: 'सभी' },
  { id: 'kirana', labelEn: 'Grocery', labelHi: 'किराना', match: ['grocery', 'kirana'] },
  { id: 'chawal', labelEn: 'Rice & Dal', labelHi: 'चावल व दाल', match: ['rice', 'dal', 'grain'] },
  { id: 'atta', labelEn: 'Atta & Flours', labelHi: 'आटा', match: ['atta', 'flour'] },
  { id: 'oil', labelEn: 'Oil & Ghee', labelHi: 'तेल व घी', match: ['oil', 'ghee'] },
  { id: 'masala', labelEn: 'Spices', labelHi: 'मसाले', match: ['masala', 'spice'] },
  { id: 'snacks', labelEn: 'Snacks & Dairy', labelHi: 'स्नैक्स व डेयरी', match: ['snack', 'dairy', 'milk', 'paneer'] },
];

export const ShopStorefront: React.FC<ShopStorefrontProps> = ({
  shop,
  onBack,
  onViewCart,
  onOpenVoiceAssistant,
}) => {
  const { language, t } = useCustomerLanguage();
  const {
    addToCart,
    items: cartItems,
    shopId: cartShopId,
    itemCount,
    itemSubtotal,
    updateItemQuantity,
  } = useCustomerCart();
  const { getShopDistance } = useCustomerMarket();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver to detect when the user scrolls down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Detect scroll container (<main className="flex-1 overflow-y-auto"> in customer shell)
    const scrollContainer = sentinel.closest('.overflow-y-auto') as HTMLElement | null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry) {
          // When sentinel is in view at the top, isScrolled is false.
          // When sentinel scrolls out of view, user has scrolled down -> isScrolled is true.
          setIsScrolled(!entry.isIntersecting);
        }
      },
      {
        root: scrollContainer || null,
        threshold: 0,
        rootMargin: '-15px 0px 0px 0px',
      }
    );

    observer.observe(sentinel);

    // Fallback window / container scroll handler for older browsers or synthetic environments
    const handleScroll = () => {
      let currentScroll = 0;
      if (scrollContainer) {
        currentScroll = scrollContainer.scrollTop;
      }
      if (typeof window !== 'undefined') {
        const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (winScroll > currentScroll) {
          currentScroll = winScroll;
        }
      }
      if (currentScroll > 35 && !isScrolled) {
        setIsScrolled(true);
      } else if (currentScroll <= 15 && isScrolled) {
        setIsScrolled(false);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isScrolled]);

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [customPortionProduct, setCustomPortionProduct] = useState<Product | null>(null);
  const [justAddedProductIds, setJustAddedProductIds] = useState<Record<string, boolean>>({});

  // Load shop products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const list = await customerApi.getShopProducts(shop.id);
        setProducts(list);
      } catch (err) {
        console.error('Failed to load shop products', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [shop.id]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = (product.name || '').toLowerCase().includes(q);
        const matchesHindi = product.nameHindi?.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesHindi && !matchesDesc) return false;
      }

      // 2. Category Chip
      if (selectedCategory !== 'all') {
        const catObj = SHOP_CATEGORIES.find((c) => c.id === selectedCategory);
        if (catObj?.match) {
          const pCat = (product.category || '').toLowerCase();
          const pSub = (product.subCategory || '').toLowerCase();
          const matches = catObj.match.some((m) => pCat.includes(m) || pSub.includes(m));
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product) => {
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

  const isCartFromThisShop = cartShopId === shop.id && cartItems.length > 0;
  const distanceInfo = getShopDistance(shop);
  const distanceText = distanceInfo?.distanceText || shop.distanceText || '500 m';

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pb-28 relative">
      {/* Top Sentinel for IntersectionObserver to detect when user scrolls down */}
      <div
        ref={sentinelRef}
        id="shop-header-sentinel"
        className="absolute top-0 left-0 right-0 h-6 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* 1. Scroll-Triggered Animated Sticky Shop Header Bar (.shop-header-sticky) */}
      <header
        id="shop-header-sticky"
        className={`shop-header-sticky ${isScrolled ? 'scrolled' : ''} sticky top-0 z-30 w-full overflow-hidden select-none ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-md shadow-md border-b border-slate-700/60'
            : 'bg-slate-900 shadow-sm'
        }`}
      >
        {/* Cover Photo Backdrop with Dynamic Opacity & Blur */}
        <img
          src={
            ((shop as any).coverImageUrl && typeof (shop as any).coverImageUrl === 'string' && (shop as any).coverImageUrl.trim()) ||
            (shop.bannerImageUrl && typeof shop.bannerImageUrl === 'string' && shop.bannerImageUrl.trim()) ||
            (shop.photoUrl && typeof shop.photoUrl === 'string' && shop.photoUrl.trim()) ||
            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80'
          }
          alt={shop.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 pointer-events-none ${
            isScrolled ? 'opacity-20 scale-105 blur-xs' : 'opacity-90 scale-100'
          }`}
          referrerPolicy="no-referrer"
        />
        <div
          className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
            isScrolled
              ? 'bg-slate-950/85 backdrop-blur-xs'
              : 'bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20'
          }`}
        />

        {/* Inner Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-3">
          {/* Top Bar: Back, Shop Identity in shrunk state, Phone, Favorite */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className={`rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isScrolled
                    ? 'w-8 h-8 bg-white/10 hover:bg-white/20 text-white'
                    : 'w-9 h-9 bg-white/90 hover:bg-white text-slate-800 shadow-md'
                }`}
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Shrunk State: Compact Shop Identity appearing inline when scrolled */}
              <div className="shop-compact-title flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h1 className="text-xs font-black text-white truncate">{shop.name}</h1>
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      ★ {shop.rating?.toFixed(1) || '4.6'}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-300 font-medium truncate">{distanceText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Actions: Phone Call, Favorite */}
            <div className="flex items-center gap-1.5 shrink-0">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className={`rounded-full flex items-center justify-center transition-all ${
                    isScrolled
                      ? 'w-8 h-8 bg-white/10 hover:bg-white/20 text-emerald-400'
                      : 'w-9 h-9 bg-white/90 hover:bg-white text-emerald-700 shadow-md'
                  }`}
                  title="Call Shop"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-500 text-white'
                    : isScrolled
                    ? 'w-8 h-8 bg-white/10 hover:bg-white/20 text-white'
                    : 'w-9 h-9 bg-white/90 hover:bg-white text-slate-700 shadow-md'
                }`}
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded State Bottom Section: Shop Title & Shop Description (Hides completely on scroll via .scrolled .shop-description using CSS transforms and opacity) */}
          <div className="shop-description-wrapper space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white drop-shadow-sm truncate">{shop.name}</h1>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {/* Shop Description and Address - Transitions and hides smoothly via CSS transform and opacity */}
            <div className="shop-description">
              <p className="text-xs text-emerald-100 font-medium truncate">
                {shop.description || shop.tagline || shop.address}
              </p>
              {shop.description && (
                <p className="text-[10px] text-slate-300 truncate">
                  📍 {shop.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`px-4 space-y-3.5 transition-all duration-300 ${isScrolled ? 'pt-3' : '-mt-2'}`}>
        {/* 2. Shop Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
          {/* Welcome Message */}
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between">
            <span>{shop.name} में आपका स्वागत है 🙏</span>
            <span className="text-[10px] font-bold text-emerald-700">खुला है • Open</span>
          </div>

          {/* Quick Metrics: Rating, Distance, Time, Min Order */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <div className="text-xs font-black text-amber-700 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{shop.rating?.toFixed(1) || '4.6'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">(324 समीक्षाएं)</div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <div className="text-xs font-black text-slate-900 flex items-center justify-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>{distanceText}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">दूरी</div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
              <div className="text-xs font-black text-slate-900 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{shop.fulfillment?.estimatedPreparationTimeMinutes ? `${shop.fulfillment.estimatedPreparationTimeMinutes + 10} min` : '20–25 min'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">डिलीवरी समय</div>
            </div>
          </div>

          {/* Fulfillment Badges */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {shop.fulfillment?.deliveryEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold">
                <span>🏠</span>
                <span>
                  {language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}
                  {shop.fulfillment?.freeDeliveryThreshold
                    ? ` (₹${shop.fulfillment.freeDeliveryThreshold}+ पर मुफ्त)`
                    : ''}
                </span>
              </span>
            )}

            {shop.fulfillment?.pickupEnabled !== false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                <span>🏪</span>
                <span>{language === 'hi' ? 'दुकान से पिकअप (मुफ्त)' : 'Store Pickup (Free)'}</span>
              </span>
            )}

            {shop.fulfillment?.deliveryEnabled === false && shop.fulfillment?.pickupEnabled === false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                <span>⚠️</span>
                <span>{language === 'hi' ? 'वर्तमान में ऑर्डर बंद हैं' : 'Currently Not Accepting Orders'}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Shop Search Box + Compact 🎙️ AI Voice Button */}
        <div className="relative flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`🔍 ${shop.name} में सामान खोजें...`}
              className="w-full h-[52px] bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-9 rounded-2xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 shadow-2xs font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Compact 🎙️ AI Voice Assistant Button */}
          {onOpenVoiceAssistant && (
            <button
              id="shop-profile-ai-voice-btn"
              type="button"
              onClick={onOpenVoiceAssistant}
              className="relative w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg transition-all cursor-pointer border border-emerald-400/40 group"
              title="Shop AI Voice Assistant • बोलकर ऑर्डर करें"
              aria-label="Shop AI Voice Assistant"
            >
              {/* Very small AI badge */}
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full shadow-xs border-2 border-white leading-none tracking-tight">
                AI
              </span>
              <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform drop-shadow-xs" />
            </button>
          )}
        </div>

        {/* 4. Category Filter Chips (सभी | किराना | चावल | आटा | तेल | मसाला | स्नैक्स) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SHOP_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {language === 'hi' ? cat.labelHi : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* 5. Products in 2-Column Clean Cards Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'दुकान के प्रोडक्ट्स' : 'Store Products'}
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {filteredProducts.length} {language === 'hi' ? 'सामान' : 'items'}
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              {language === 'hi' ? 'सामान लोड हो रहा है...' : 'Loading store catalog...'}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <div className="text-2xl">📦</div>
              <div className="text-xs font-bold text-slate-800">
                {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No items match your filter'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const isAdded = justAddedProductIds[product.id];
                const cartItem = cartItems.find((it) => it.product.id === product.id);
                const defaultOpt =
                  product.fractionalConfig.predefinedOptions?.find((o) => o.isDefault) ||
                  product.fractionalConfig.predefinedOptions?.[0];
                const portionText = defaultOpt ? defaultOpt.label : `1 ${product.fractionalConfig.baseUnit}`;
                const strikeOldPrice = Math.round(product.basePrice * 1.15);

                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductForDetail(product)}
                    className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl p-2.5 shadow-2xs flex flex-col justify-between transition-all cursor-pointer group"
                  >
                    <div>
                      {/* Thumbnail & Discount */}
                      <div className="relative w-full aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-100 mb-2">
                        {product.imageUrl && product.imageUrl.trim() !== '' ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                        )}

                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                          15% OFF
                        </div>
                      </div>

                      {/* Title & Weight */}
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {language === 'hi' && product.nameHindi ? product.nameHindi : product.name}
                      </h3>
                      <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{portionText}</p>
                    </div>

                    {/* Price and Cart Stepper / Add Button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-900">₹{product.basePrice}</div>
                        <div className="text-[9px] text-slate-400 line-through">₹{strikeOldPrice}</div>
                      </div>

                      {cartItem ? (
                        /* Stepper if already in cart */
                        <div
                          className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-xl p-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateItemQuantity(cartItem.id, Math.max(0, cartItem.quantityCount - 1))
                            }
                            className="w-6 h-6 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-black text-emerald-900">
                            {cartItem.quantityCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(cartItem.id, cartItem.quantityCount + 1)}
                            className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        /* Add Button */
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs ${
                            isAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>जोड़ा</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{language === 'hi' ? 'कार्ट में' : 'Add'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Persistent Floating Cart Bar (Matching Indian grocery app UX) */}
      {isCartFromThisShop && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-3 duration-200">
          <div
            onClick={onViewCart}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between cursor-pointer border border-emerald-600 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold">
                  {itemCount} {itemCount === 1 ? 'सामान' : 'सामान'} • ₹{itemSubtotal}
                </div>
                <div className="text-[10px] text-emerald-200">{shop.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-white">
              <span>{language === 'hi' ? 'कार्ट देखें' : 'View Cart'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal (Screen 4) */}
      <ProductDetailModal
        product={selectedProductForDetail}
        shop={shop}
        otherProducts={products.filter((p) => p.id !== selectedProductForDetail?.id)}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onSelectProduct={(p) => setSelectedProductForDetail(p)}
        onViewCart={onViewCart}
      />

      {/* Custom Portion Modal */}
      {customPortionProduct && (
        <CustomPortionModal
          product={customPortionProduct}
          shop={shop}
          isOpen={!!customPortionProduct}
          onClose={() => setCustomPortionProduct(null)}
        />
      )}
    </div>
  );
};
