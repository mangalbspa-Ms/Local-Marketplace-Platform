import React from 'react';
import {
  ShieldCheck,
  Star,
  MapPin,
  Bike,
  Truck,
  ShoppingBag,
  ChevronRight,
  Package,
  User,
  Clock,
  Ban,
  CheckCircle2,
  Percent,
  Settings2,
  Store,
} from 'lucide-react';
import { Shop } from '../../types/market.ts';

export interface ShopCardProps {
  shop: Shop | any;
  variant?: 'customer' | 'admin';
  onClick?: () => void;
  onOpenSetup?: () => void;
  onOpenCommission?: () => void;
  onOpenFulfillment?: () => void;
  onToggleStatus?: (targetStatus: string) => void;
  distanceText?: string;
  language?: 'hi' | 'en';
}

export const DEFAULT_SHOP_PHOTO = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80';

export const getShopPhotoUrl = (shop: any): string => {
  if (!shop) return DEFAULT_SHOP_PHOTO;
  const directPhoto =
    (shop.bannerImageUrl && typeof shop.bannerImageUrl === 'string' && shop.bannerImageUrl.trim()) ||
    (shop.bannerUrl && typeof shop.bannerUrl === 'string' && shop.bannerUrl.trim()) ||
    (shop.photoUrl && typeof shop.photoUrl === 'string' && shop.photoUrl.trim()) ||
    (shop.logoImageUrl && typeof shop.logoImageUrl === 'string' && shop.logoImageUrl.trim());

  if (directPhoto) return directPhoto;

  const category = (shop.category || '').toLowerCase();
  const name = (shop.name || '').toLowerCase();

  if (category.includes('veggie') || category.includes('fruit') || name.includes('veg')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80';
  }
  if (category.includes('dairy') || name.includes('dairy')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80';
  }
  return DEFAULT_SHOP_PHOTO;
};

export const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  variant = 'customer',
  onClick,
  onOpenSetup,
  onOpenCommission,
  onOpenFulfillment,
  onToggleStatus,
  distanceText,
  language = 'hi',
}) => {
  const isClosed = shop.isOpenNow === false || shop.isOpen === false;
  const isVerified = shop.isVerifiedByAdmin !== false;
  const isActive = shop.isActive !== false;

  const deliveryFee = shop.fulfillment?.deliveryFee ?? (shop.fulfillment as any)?.baseDeliveryFee ?? 20;
  const deliveryFeeText =
    deliveryFee === 0
      ? language === 'hi'
        ? 'मुफ्त'
        : 'Free'
      : `₹${deliveryFee}`;

  const isDeliveryOn =
    shop.fulfillment?.homeDeliveryEnabled !== false && shop.fulfillment?.deliveryEnabled !== false;
  const isPickupOn =
    shop.fulfillment?.storePickupEnabled !== false && shop.fulfillment?.pickupEnabled !== false;

  const prepTime =
    shop.fulfillment?.estimatedPreparationTimeMinutes ||
    (shop.fulfillment as any)?.estimatedPrepTimeMinutes ||
    20;

  const rating = shop.averageRating
    ? shop.averageRating.toFixed(1)
    : shop.rating
    ? Number(shop.rating).toFixed(1)
    : '4.6';

  const shopPhoto = getShopPhotoUrl(shop);

  const sellerName = shop.sellerName || 'दुकानदार';

  const areaOrMarket =
    shop.marketName ||
    (typeof shop.address === 'object' ? shop.address?.city || shop.address?.street : '') ||
    (typeof shop.address === 'string' ? shop.address.split(',')[0] : '') ||
    'Local Mandi';

  const categoryName = shop.category || 'किराना / Grocery';

  const totalProducts = shop.totalProductsCount ?? shop.productsCount ?? 24;

  const handleCardClick = () => {
    if (variant === 'admin') {
      if (onOpenSetup) {
        onOpenSetup();
      } else if (onClick) {
        onClick();
      }
    } else {
      onClick?.();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${
        !isVerified
          ? 'border-amber-300 ring-1 ring-amber-400/30'
          : !isActive
          ? 'border-rose-300 opacity-85'
          : 'border-slate-200 hover:border-emerald-400'
      }`}
    >
      {/* 1. Shop Photo Header with Badges */}
      <div>
        <div className="relative w-full h-28 sm:h-32 bg-slate-100 overflow-hidden">
          <img
            src={shopPhoto && shopPhoto.trim() ? shopPhoto : DEFAULT_SHOP_PHOTO}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />

          {/* Top Left: Verification / Status Badge */}
          {!isVerified ? (
            <div className="absolute top-1.5 left-1.5 bg-amber-500/95 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span>{language === 'hi' ? 'सत्यापन पेंडिंग' : 'Pending Approval'}</span>
            </div>
          ) : !isActive ? (
            <div className="absolute top-1.5 left-1.5 bg-rose-600/95 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5">
              <Ban className="w-2.5 h-2.5 shrink-0" />
              <span>{language === 'hi' ? 'सस्पेंड' : 'Suspended'}</span>
            </div>
          ) : (
            <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-xs text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-0.5 border border-emerald-200">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span>{language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
            </div>
          )}

          {/* Top Right: Open / Closed Badge */}
          {isClosed ? (
            <div className="absolute top-1.5 right-1.5 bg-slate-900/90 text-rose-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{language === 'hi' ? 'बंद' : 'Closed'}</span>
            </div>
          ) : (
            <div className="absolute top-1.5 right-1.5 bg-slate-900/90 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === 'hi' ? 'खुला' : 'Open'}</span>
            </div>
          )}

          {/* Bottom Left on Photo: Category Chip */}
          <div className="absolute bottom-1.5 left-1.5 max-w-[80%]">
            <span className="bg-slate-950/75 backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded truncate block border border-white/10">
              {categoryName}
            </span>
          </div>
        </div>

        {/* 2. Shop Information Body */}
        <div className="p-2.5 space-y-1.5">
          {/* Shop Name */}
          <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 flex items-center gap-1">
            <span className="text-emerald-600 font-extrabold shrink-0">✓</span>
            <span className="truncate">{shop.name}</span>
          </h3>

          {/* Seller Name (Admin & Customer visibility) */}
          <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate font-medium">
            <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {language === 'hi' ? `दुकानदार: ${sellerName}` : `Seller: ${sellerName}`}
            </span>
          </div>

          {/* Rating & Location / Area */}
          <div className="flex items-center gap-1 text-[10px] flex-wrap">
            <div className="flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold shrink-0">
              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{rating}</span>
            </div>

            <div className="flex items-center gap-0.5 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium truncate flex-1 min-w-[70px]">
              <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span className="truncate">{distanceText || areaOrMarket}</span>
            </div>
          </div>

          {/* Fulfillment Badges (Delivery & Pickup) */}
          <div className="flex items-center gap-1 pt-0.5 flex-wrap">
            {isDeliveryOn ? (
              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                <Truck className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                <span>डिलीवरी {deliveryFeeText}</span>
              </span>
            ) : (
              <span className="text-[8.5px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                डिलीवरी बंद
              </span>
            )}

            {isPickupOn && (
              <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                <ShoppingBag className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span>पिकअप</span>
              </span>
            )}
          </div>

          {/* Total Products (Item Count) */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Package className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span>कुल सामान:</span>
            </span>
            <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[9.5px]">
              {totalProducts} आइटम्स
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="px-2.5 pb-2.5 space-y-1.5">
        {variant === 'admin' ? (
          <>
            {/* Primary Button: Setup & Catalog */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSetup) onOpenSetup();
                else onClick?.();
              }}
              className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all"
            >
              <Settings2 className="w-3 h-3 shrink-0" />
              <span>दुकान सेटअप व कैटलॉग</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </button>

            {/* Quick Admin Action Toolbar (Fulfillment, Commission, Status Toggle) */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFulfillment?.();
                }}
                title="Delivery & Fulfillment"
                className="py-1 px-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-bold flex items-center justify-center gap-0.5 transition"
              >
                <Truck className="w-2.5 h-2.5 shrink-0" />
                <span>डिलीवरी</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommission?.();
                }}
                title="Commission Rate"
                className="py-1 px-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold flex items-center justify-center gap-0.5 transition"
              >
                <Percent className="w-2.5 h-2.5 shrink-0" />
                <span>{shop.effectiveCommissionPercentage ?? 5}%</span>
              </button>

              {!isVerified ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.('ACTIVE');
                  }}
                  title="Approve Shop"
                  className="py-1 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold flex items-center justify-center gap-0.5 transition shadow-2xs"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                  <span>पास करें</span>
                </button>
              ) : isActive ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.('SUSPENDED');
                  }}
                  title="Suspend Shop"
                  className="py-1 px-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-[9px] font-bold flex items-center justify-center gap-0.5 transition"
                >
                  <Ban className="w-2.5 h-2.5 shrink-0" />
                  <span>रोकें</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus?.('ACTIVE');
                  }}
                  title="Reactivate Shop"
                  className="py-1 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold flex items-center justify-center gap-0.5 transition"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                  <span>चालू करें</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Customer variant primary button */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all"
          >
            <span>{language === 'hi' ? 'दुकान देखें' : 'View Shop'}</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
