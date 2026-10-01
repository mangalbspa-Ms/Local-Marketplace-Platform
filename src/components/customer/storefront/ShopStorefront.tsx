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

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Shop } from '../../../types/market.ts';
import { Product } from '../../../types/product.ts';
import { customerApi } from '../../../services/customerApi.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { CustomPortionModal } from './CustomPortionModal.tsx';
import { ProductDetailModal } from './ProductDetailModal.tsx';
import { ShopInfoSection } from './ShopInfoSection.tsx';
import { triggerHaptic, HAPTIC_FEEDBACK } from '../../../utils/haptics.ts';
import { CoverPhotoSlideshow } from '../../common/CoverPhotoSlideshow.tsx';
import { getShopCoverPhotosList } from '../../shops/ShopCard.tsx';
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mic,
  Navigation,
  Store,
  Info,
  X,
  Maximize2,
  RotateCw,
} from 'lucide-react';

interface ShopStorefrontProps {
  shop: Shop;
  onBack: () => void;
  onViewCart: () => void;
  onOpenVoiceAssistant?: () => void;
}

/**
 * Hook to detect scrolling behavior in ShopStorefront.
 * Enables the shop header to smoothly collapse into a minimal stickied bar on scroll,
 * maximizing the viewport area for products without removing any header information.
 */
export interface UseStorefrontScrollOptions {
  collapseThreshold?: number;
  expandThreshold?: number;
}

export interface UseStorefrontScrollReturn {
  isScrolled: boolean;
  scrollTop: number;
  scrollProgress: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function useStorefrontScroll(
  options: UseStorefrontScrollOptions = {}
): UseStorefrontScrollReturn {
  const { collapseThreshold = 35, expandThreshold = 15 } = options;
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    let ticking = false;

    // Detect closest scrollable container (e.g. within an overflow shell) or fallback to window
    const getScrollContainer = (): HTMLElement | Window => {
      if (sentinel) {
        const scrollableParent = sentinel.closest('.overflow-y-auto') as HTMLElement | null;
        if (scrollableParent) return scrollableParent;
      }
      return window;
    };

    const getScrollTop = (): number => {
      const scrollParent = sentinel?.closest('.overflow-y-auto') as HTMLElement | null;
      const parentScroll = scrollParent ? scrollParent.scrollTop : 0;
      const winScroll =
        typeof window !== 'undefined'
          ? window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
          : 0;
      return Math.max(parentScroll, winScroll);
    };

    const updateScrollState = () => {
      const currentScroll = getScrollTop();
      setScrollTop(currentScroll);

      // Normalized progress: 0 (at top) to 1 (collapsed)
      const progress = Math.min(1, Math.max(0, currentScroll / Math.max(collapseThreshold, 1)));
      setScrollProgress(progress);

      if (currentScroll >= collapseThreshold) {
        setIsScrolled(true);
      } else if (currentScroll <= expandThreshold) {
        setIsScrolled(false);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    // 1. Primary IntersectionObserver using sentinel element
    let observer: IntersectionObserver | null = null;
    if (sentinel && typeof IntersectionObserver !== 'undefined') {
      try {
        const scrollParent = sentinel.closest('.overflow-y-auto') as HTMLElement | null;
        observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (entry) {
              if (!entry.isIntersecting) {
                setIsScrolled(true);
              } else {
                const currentScroll = getScrollTop();
                if (currentScroll <= expandThreshold) {
                  setIsScrolled(false);
                }
              }
            }
          },
          {
            root: scrollParent || null,
            threshold: 0,
            rootMargin: '-10px 0px 0px 0px',
          }
        );
        observer.observe(sentinel);
      } catch (err) {
        console.warn('IntersectionObserver not available or blocked in current frame:', err);
      }
    }

    // 2. Continuous passive scroll event listeners for smooth frame-by-frame updates
    const scrollTarget = getScrollContainer();
    if (scrollTarget !== window && scrollTarget instanceof HTMLElement) {
      scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial check on mount
    updateScrollState();

    return () => {
      if (observer) {
        try {
          observer.disconnect();
        } catch {
          // ignore
        }
      }
      if (scrollTarget !== window && scrollTarget instanceof HTMLElement) {
        scrollTarget.removeEventListener('scroll', onScroll);
      }
      window.removeEventListener('scroll', onScroll);
    };
  }, [collapseThreshold, expandThreshold]);

  return {
    isScrolled,
    scrollTop,
    scrollProgress,
    containerRef,
    sentinelRef,
  };
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
  const [isShopInfoExpanded, setIsShopInfoExpanded] = useState(false);
  const [activeShop, setActiveShop] = useState<Shop>(shop);

  // Synchronize and enrich shop profile if needed
  useEffect(() => {
    if (shop) {
      setActiveShop(shop);
    }
    const sid = shop?.id || (shop as any)?.shopId;
    if (sid) {
      customerApi.getShop(sid).then((fetched) => {
        if (fetched) {
          setActiveShop((prev) => ({ ...prev, ...fetched }));
        }
      }).catch((err) => {
        console.warn('Using existing shop profile info:', err);
      });
    }
  }, [shop?.id, (shop as any)?.shopId]);

  // Hook to detect scrolling behavior and manage header collapse
  const { isScrolled, containerRef, sentinelRef } = useStorefrontScroll({
    collapseThreshold: 35,
    expandThreshold: 15,
  });

  // Always scroll to the very top on mount/shop-change so the full Shop Profile page is shown first
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    const scrollParent = sentinelRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
  }, [shop?.id, (shop as any)?.shopId, sentinelRef]);

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [customPortionProduct, setCustomPortionProduct] = useState<Product | null>(null);
  const [justAddedProductIds, setJustAddedProductIds] = useState<Record<string, boolean>>({});
  const [reloadKey, setReloadKey] = useState(0);

  // Load shop products
  useEffect(() => {
    const sid = shop?.id || (shop as any)?.shopId;
    if (!sid) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const list = await customerApi.getShopProducts(sid);
        if (isMounted) {
          if (Array.isArray(list)) {
            // Show only the products actually assigned to this specific shop
            // If the shop has 5 assigned products, show only those 5.
            // If the shop has 0 assigned products, show 0 products.
            setProducts(list);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn('Notice: Remote shop products fetch failed:', err);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [shop?.id, (shop as any)?.shopId, reloadKey]);

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
    triggerHaptic(HAPTIC_FEEDBACK.action);
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

  // Photos: Extract the real saved cover and profile photos belonging to this shop/seller
  const fallbackCoverPhoto =
    (shop.coverPhotoUrl && typeof shop.coverPhotoUrl === 'string' && shop.coverPhotoUrl.trim()) ||
    ((shop as any).coverImageUrl && typeof (shop as any).coverImageUrl === 'string' && (shop as any).coverImageUrl.trim()) ||
    (shop.bannerImageUrl && typeof shop.bannerImageUrl === 'string' && shop.bannerImageUrl.trim()) ||
    ((shop as any).bannerUrl && typeof (shop as any).bannerUrl === 'string' && (shop as any).bannerUrl.trim()) ||
    (shop.photoUrl && typeof shop.photoUrl === 'string' && shop.photoUrl.trim()) ||
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';

  const coverPhotosList = getShopCoverPhotosList(shop, fallbackCoverPhoto);

  const profilePhotoUrl =
    (shop.profilePhotoUrl && typeof shop.profilePhotoUrl === 'string' && shop.profilePhotoUrl.trim()) ||
    (shop.logoImageUrl && typeof shop.logoImageUrl === 'string' && shop.logoImageUrl.trim()) ||
    ((shop as any).photoUrl && typeof (shop as any).photoUrl === 'string' && (shop as any).photoUrl.trim()) ||
    null;

  const sellerName = (shop as any).sellerName || (shop as any).ownerName;

  // Cover Photo Lightbox Viewer State
  const [isCoverViewerOpen, setIsCoverViewerOpen] = useState(false);
  const [currentCoverPhoto, setCurrentCoverPhoto] = useState<string>(fallbackCoverPhoto);
  const [viewerActiveIndex, setViewerActiveIndex] = useState<number>(0);
  const [viewingProfilePhoto, setViewingProfilePhoto] = useState<boolean>(false);
  const [profileImgFailed, setProfileImgFailed] = useState(false);

  const viewerPhotos = useMemo(() => {
    if (viewingProfilePhoto && profilePhotoUrl) {
      return [profilePhotoUrl];
    }
    return coverPhotosList;
  }, [viewingProfilePhoto, profilePhotoUrl, coverPhotosList]);

  const hasMultiplePhotos = viewerPhotos.length > 1;
  const safeActiveIndex = Math.max(0, Math.min(viewerActiveIndex, Math.max(0, viewerPhotos.length - 1)));
  const activeViewerPhoto = viewerPhotos[safeActiveIndex] || currentCoverPhoto || fallbackCoverPhoto;

  const handleCurrentPhotoChange = useCallback((url: string) => {
    setCurrentCoverPhoto(url);
  }, []);

  const handlePrevPhoto = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      e?.stopPropagation();
      if (viewerPhotos.length <= 1) return;
      triggerHaptic(HAPTIC_FEEDBACK.light);
      setViewerActiveIndex((prev) => (prev > 0 ? prev - 1 : viewerPhotos.length - 1));
    },
    [viewerPhotos.length]
  );

  const handleNextPhoto = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      e?.stopPropagation();
      if (viewerPhotos.length <= 1) return;
      triggerHaptic(HAPTIC_FEEDBACK.light);
      setViewerActiveIndex((prev) => (prev < viewerPhotos.length - 1 ? prev + 1 : 0));
    },
    [viewerPhotos.length]
  );

  const handleCloseViewer = useCallback(() => {
    triggerHaptic(HAPTIC_FEEDBACK.light);
    setIsCoverViewerOpen(false);
    if (!viewingProfilePhoto && viewerPhotos[safeActiveIndex]) {
      setCurrentCoverPhoto(viewerPhotos[safeActiveIndex]);
    }
  }, [viewingProfilePhoto, viewerPhotos, safeActiveIndex]);

  // Touch Swipe Handlers for Fullscreen Lightbox
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleViewerTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleViewerTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = touchStartXRef.current - endX;
    const deltaY = (touchStartYRef.current ?? 0) - endY;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }
  };

  // Keyboard navigation while viewer is open
  useEffect(() => {
    if (!isCoverViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseViewer();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCoverViewerOpen, handleCloseViewer, handlePrevPhoto, handleNextPhoto]);

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
        {/* Cover Photo Backdrop with Dynamic Opacity & Blur (Layer 0) */}
        <CoverPhotoSlideshow
          photos={coverPhotosList}
          fallbackPhoto={fallbackCoverPhoto}
          alt={shop.name}
          isPaused={isCoverViewerOpen || Boolean(selectedProductForDetail || customPortionProduct)}
          onCurrentPhotoChange={handleCurrentPhotoChange}
          onPhotoClick={(url, idx) => {
            triggerHaptic(HAPTIC_FEEDBACK.tap);
            setViewingProfilePhoto(false);
            const foundIdx = coverPhotosList.indexOf(url);
            const targetIdx = foundIdx >= 0 ? foundIdx : (typeof idx === 'number' && idx >= 0 ? idx : 0);
            setViewerActiveIndex(targetIdx);
            setIsCoverViewerOpen(true);
          }}
          containerClassName={`absolute inset-0 w-full h-full transition-all duration-300 z-0 ${
            isScrolled ? 'opacity-20 scale-105 blur-xs pointer-events-none' : 'opacity-90 scale-100'
          }`}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute inset-0 transition-all duration-300 pointer-events-none z-0 ${
            isScrolled
              ? 'bg-slate-950/85 backdrop-blur-xs'
              : 'bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20'
          }`}
        />

        {/* Cover Photo Expand Badge */}
        {!isScrolled && coverPhotosList.length > 0 && (
          <div className="absolute top-14 right-3 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic(HAPTIC_FEEDBACK.tap);
                setViewingProfilePhoto(false);
                const foundIdx = coverPhotosList.indexOf(currentCoverPhoto);
                setViewerActiveIndex(foundIdx >= 0 ? foundIdx : 0);
                setIsCoverViewerOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 hover:bg-black/60 active:scale-95 text-white/90 text-[10px] font-medium backdrop-blur-xs border border-white/20 transition cursor-pointer shadow-xs"
              title="कवर फोटो बड़ा देखें • View full cover photo"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>
                {coverPhotosList.length > 1
                  ? `${coverPhotosList.indexOf(currentCoverPhoto) >= 0 ? coverPhotosList.indexOf(currentCoverPhoto) + 1 : 1}/${coverPhotosList.length}`
                  : 'फोटो'}
              </span>
            </button>
          </div>
        )}

        {/* Inner Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-3 pointer-events-none">
          {/* Top Bar: Back, Shop Identity in shrunk state, Phone, Favorite */}
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_FEEDBACK.light);
                  onBack();
                }}
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
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-white/80 shrink-0 flex items-center justify-center shadow-xs">
                  {profilePhotoUrl && !profileImgFailed ? (
                    <img
                      src={profilePhotoUrl}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Store className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                </div>
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
                    {sellerName ? (
                      <>
                        <span>•</span>
                        <span className="text-emerald-300 font-medium truncate max-w-[80px]">
                          {sellerName}
                        </span>
                      </>
                    ) : shop.address ? (
                      <>
                        <span>•</span>
                        <span className="text-slate-300 truncate max-w-[90px] sm:max-w-[140px]">
                          📍 {shop.address}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Actions: Phone Call, Shop Info Toggle, Favorite */}
            <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  onClick={() => triggerHaptic(HAPTIC_FEEDBACK.tap)}
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

              {/* Shop Info Quick Toggle */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_FEEDBACK.toggle);
                  setIsShopInfoExpanded((prev) => !prev);
                }}
                className={`rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isShopInfoExpanded
                    ? 'bg-emerald-600 text-white shadow-xs w-8 h-8 sm:w-9 sm:h-9'
                    : isScrolled
                    ? 'w-8 h-8 bg-white/10 hover:bg-white/20 text-white'
                    : 'w-9 h-9 bg-white/90 hover:bg-white text-slate-700 shadow-md'
                }`}
                title={isShopInfoExpanded ? 'कम जानकारी • Hide Info' : 'दुकान जानकारी • Shop Info'}
                aria-label="Toggle Shop Info"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_FEEDBACK.toggle);
                  setIsFavorite(!isFavorite);
                }}
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

          {/* Expanded State Bottom Section: Shop Title & Shop Description */}
          <div className="shop-description-wrapper space-y-0.5 pointer-events-auto">
            <div className="flex items-center gap-2.5">
              {/* Real Saved Profile Photo Circular Avatar / Fallback Store Icon */}
              <div
                onClick={() => {
                  if (profilePhotoUrl && !profileImgFailed) {
                    triggerHaptic(HAPTIC_FEEDBACK.tap);
                    setViewingProfilePhoto(true);
                    setViewerActiveIndex(0);
                    setIsCoverViewerOpen(true);
                  }
                }}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white border-2 border-white shadow-md shrink-0 flex items-center justify-center ${
                  profilePhotoUrl && !profileImgFailed ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
                }`}
                title={profilePhotoUrl ? 'फोटो देखें • View Photo' : shop.name}
              >
                {profilePhotoUrl && !profileImgFailed ? (
                  <img
                    src={profilePhotoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setProfileImgFailed(true)}
                  />
                ) : (
                  <Store className="w-5 h-5 text-emerald-700" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-white drop-shadow-sm truncate">{shop.name}</h1>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                {sellerName && (
                  <p className="text-[11px] font-semibold text-emerald-200/90 truncate">
                    {sellerName}
                  </p>
                )}

                {/* Shop Description and Address - Transitions and hides smoothly via CSS transform and opacity */}
                <div className="shop-description space-y-0.5">
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
          </div>
        </div>
      </header>

      <div className={`px-4 space-y-2 sm:space-y-2.5 transition-all duration-300 ${isScrolled ? 'pt-2.5' : '-mt-2.5'}`}>
        {/* 2. Compact Shop Details Section */}
        <ShopInfoSection
          shop={shop}
          distanceText={distanceText}
          language={language}
          isExpanded={isShopInfoExpanded}
          onToggle={() => {
            triggerHaptic(HAPTIC_FEEDBACK.toggle);
            setIsShopInfoExpanded((prev) => !prev);
          }}
        />

        {/* 3. Shop Search Box + Voice Assistant Button */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`🔍 ${shop.name} में सामान खोजें...`}
              className="w-full h-11 bg-white text-slate-900 text-xs sm:text-sm pl-10 pr-9 rounded-2xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 shadow-2xs font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_FEEDBACK.light);
                  setSearchQuery('');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Existing 🎙️ AI Voice Assistant Button with visible label */}
          {onOpenVoiceAssistant && (
            <button
              id="shop-profile-ai-voice-btn"
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_FEEDBACK.voice);
                onOpenVoiceAssistant();
              }}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer border border-emerald-400/40 group font-bold text-xs sm:text-sm"
              title="Build Your List by Voice"
              aria-label="Build Your List by Voice"
            >
              <Mic className="w-4 h-4 text-white group-hover:scale-110 transition-transform drop-shadow-xs shrink-0" />
              <span className="truncate">
                {language === 'hi' ? 'बोलकर लिस्ट बनाएं (Build Your List by Voice)' : 'Build Your List by Voice'}
              </span>
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
                onClick={() => {
                  triggerHaptic(HAPTIC_FEEDBACK.tap);
                  setSelectedCategory(cat.id);
                }}
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
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <div className="text-2xl">📦</div>
              <div className="text-xs font-bold text-slate-800">
                {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No items match your filter'}
              </div>
              {products.length === 0 && (
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'पुनः लोड करें' : 'Reload Store'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const isAdded = justAddedProductIds[product.id];
                const cartItem = cartItems.find((it) => it.product.id === product.id);
                const defaultOpt =
                  product.fractionalConfig?.predefinedOptions?.find((o) => o.isDefault) ||
                  product.fractionalConfig?.predefinedOptions?.[0];
                const portionText = defaultOpt ? defaultOpt.label : `1 ${product.fractionalConfig?.baseUnit || 'unit'}`;
                const rawPrice = product.fractionalConfig?.basePrice ?? product.basePricePerUnit ?? (product as any).basePrice ?? 0;
                const productPrice = Number.isFinite(Number(rawPrice)) && !Number.isNaN(Number(rawPrice)) && Number(rawPrice) >= 0 ? Number(rawPrice) : 0;
                const strikeOldPrice = Math.round(productPrice * 1.15);

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      triggerHaptic(HAPTIC_FEEDBACK.selection);
                      setSelectedProductForDetail(product);
                    }}
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
                        <div className="text-xs font-black text-slate-900">₹{productPrice}</div>
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
                            onClick={() => {
                              triggerHaptic(HAPTIC_FEEDBACK.light);
                              updateItemQuantity(cartItem.id, Math.max(0, cartItem.quantityCount - 1));
                            }}
                            className="w-6 h-6 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-black text-emerald-900">
                            {cartItem.quantityCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(HAPTIC_FEEDBACK.light);
                              updateItemQuantity(cartItem.id, cartItem.quantityCount + 1);
                            }}
                            className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-transform"
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
                            triggerHaptic(HAPTIC_FEEDBACK.action);
                            handleAddToCart(product);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95 ${
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
            onClick={() => {
              triggerHaptic(HAPTIC_FEEDBACK.action);
              onViewCart();
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between cursor-pointer border border-emerald-600 transition-colors active:scale-98"
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
        shop={activeShop}
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
          shop={activeShop}
          isOpen={!!customPortionProduct}
          onClose={() => setCustomPortionProduct(null)}
        />
      )}

      {/* 8. Full-Screen Photo Viewer / Lightbox Modal */}
      {isCoverViewerOpen && (
        <div
          id="shop-photo-lightbox-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
          onClick={handleCloseViewer}
        >
          {/* Top Bar with Shop Identity and Close Button */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/85 via-black/50 to-transparent pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/30 shrink-0 flex items-center justify-center">
                {profilePhotoUrl && !profileImgFailed ? (
                  <img
                    src={profilePhotoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate drop-shadow-xs">{shop.name}</h3>
                <p className="text-[11px] text-slate-300 truncate">
                  {viewingProfilePhoto
                    ? (language === 'hi' ? 'प्रोफाइल फोटो • Profile Photo' : 'Profile Photo')
                    : hasMultiplePhotos
                    ? (language === 'hi'
                        ? `कवर फोटो (${safeActiveIndex + 1}/${viewerPhotos.length})`
                        : `Cover Photo (${safeActiveIndex + 1}/${viewerPhotos.length})`)
                    : (language === 'hi' ? 'कवर फोटो • Cover Photo' : 'Cover Photo')}
                </p>
              </div>
            </div>

            <button
              id="btn-close-shop-lightbox"
              type="button"
              onClick={handleCloseViewer}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
              title="Close (बंद करें)"
              aria-label="Close photo viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Image - Shows complete photo clearly without unnecessary cropping, with swipe support */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full p-3 sm:p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleViewerTouchStart}
            onTouchEnd={handleViewerTouchEnd}
          >
            <img
              key={activeViewerPhoto}
              src={activeViewerPhoto}
              alt={`${shop.name} Photo ${safeActiveIndex + 1}`}
              className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-all select-none animate-in fade-in duration-150"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (fallbackCoverPhoto && (e.target as HTMLImageElement).src !== fallbackCoverPhoto) {
                  (e.target as HTMLImageElement).src = fallbackCoverPhoto;
                }
              }}
            />

            {/* Left / Right Navigation Chevrons when seller has multiple photos */}
            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  id="btn-lightbox-prev-photo"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm border border-white/20 shadow-lg z-20"
                  title="पिछली फोटो • Previous Photo"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  id="btn-lightbox-next-photo"
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm border border-white/20 shadow-lg z-20"
                  title="अगली फोटो • Next Photo"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Bar: Indicators & Tap to Close Hint */}
          <div
            className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dot Pagination indicators if multiple photos */}
            {hasMultiplePhotos && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-md">
                {viewerPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(HAPTIC_FEEDBACK.tap);
                      setViewerActiveIndex(idx);
                    }}
                    className={`transition-all rounded-full cursor-pointer ${
                      idx === safeActiveIndex
                        ? 'w-5 h-1.5 bg-white shadow-xs'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="text-center pointer-events-none">
              <span className="text-xs text-white/70 bg-black/50 px-3.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
                {hasMultiplePhotos
                  ? 'स्वाइप करें या बाहर टैप करके बंद करें • Swipe to view • Tap outside to close'
                  : 'बाहर टैप करके बंद करें • Tap outside to close'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
