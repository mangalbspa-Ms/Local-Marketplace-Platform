import React, { useState } from 'react';
import { Star, Navigation, Clock, ChevronDown, ChevronUp, MapPin, Store, CreditCard, ShieldCheck } from 'lucide-react';
import { Shop } from '../../../types/market.ts';
import { triggerHaptic, HAPTIC_FEEDBACK } from '../../../utils/haptics.ts';

interface ShopInfoSectionProps {
  shop: Shop;
  distanceText: string;
  language: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * Compact, grid-based shop information section displaying essential
 * shop attributes (rating, distance, delivery time, fulfillment options).
 * Engineered for minimal vertical footprint so product listings and search elevate higher,
 * with subtle haptic tactile feedback when toggling shop details.
 */
export const ShopInfoSection: React.FC<ShopInfoSectionProps> = ({
  shop,
  distanceText,
  language,
  isExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  const handleToggle = () => {
    // Subtle mobile tactile feedback using navigator.vibrate()
    triggerHaptic(HAPTIC_FEEDBACK.toggle);
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const isDeliveryEnabled = shop.fulfillment?.deliveryEnabled !== false;
  const isPickupEnabled = shop.fulfillment?.pickupEnabled !== false;
  const isOrderingClosed = !isDeliveryEnabled && !isPickupEnabled;
  const deliveryTime = shop.fulfillment?.estimatedPreparationTimeMinutes
    ? `${shop.fulfillment.estimatedPreparationTimeMinutes + 10} min`
    : '20–25 min';

  return (
    <div
      id="shop-info-section"
      className="bg-white border border-slate-200/90 rounded-xl p-1.5 sm:p-2 shadow-2xs space-y-1 transition-all"
    >
      {/* Welcome Banner, Operational Status & Interactive Details Toggle */}
      <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center justify-between gap-1.5">
        <span className="truncate font-semibold">
          {shop.name} में आपका स्वागत है 🙏
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            खुला है • Open
          </span>

          <button
            type="button"
            onClick={handleToggle}
            className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200/60 active:scale-95 transition-all cursor-pointer border border-emerald-300/80 bg-white/70 shadow-2xs"
            title={expanded ? 'कम जानकारी • Collapse' : 'दुकान विवरण • Expand'}
            aria-expanded={expanded}
          >
            <span>{language === 'hi' ? 'विवरण' : 'Details'}</span>
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-emerald-700" />
            ) : (
              <ChevronDown className="w-3 h-3 text-emerald-700" />
            )}
          </button>
        </div>
      </div>

      {/* Compact Grid of Shop Attributes: Rating, Distance, Delivery Time */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {/* Rating Block */}
        <div className="bg-slate-50/90 border border-slate-100/90 px-1 py-0.5 sm:py-1 rounded-lg flex flex-col items-center justify-center min-w-0">
          <div className="text-xs font-black text-amber-700 flex items-center justify-center gap-0.5 leading-tight">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span>{shop.rating?.toFixed(1) || '4.6'}</span>
          </div>
          <div className="text-[9px] text-slate-500 truncate w-full leading-tight">
            (324 समीक्षाएं)
          </div>
        </div>

        {/* Distance Block */}
        <div className="bg-slate-50/90 border border-slate-100/90 px-1 py-0.5 sm:py-1 rounded-lg flex flex-col items-center justify-center min-w-0">
          <div className="text-xs font-black text-slate-900 flex items-center justify-center gap-0.5 leading-tight">
            <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{distanceText}</span>
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            {language === 'hi' ? 'दूरी' : 'Distance'}
          </div>
        </div>

        {/* Delivery Time Block */}
        <div className="bg-slate-50/90 border border-slate-100/90 px-1 py-0.5 sm:py-1 rounded-lg flex flex-col items-center justify-center min-w-0">
          <div className="text-xs font-black text-slate-900 flex items-center justify-center gap-0.5 leading-tight">
            <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">{deliveryTime}</span>
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            {language === 'hi' ? 'डिलीवरी समय' : 'Delivery Time'}
          </div>
        </div>
      </div>

      {/* Fulfillment Options (Compact chips) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isDeliveryEnabled && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/80 text-purple-800 text-[10px] font-bold leading-tight">
            <span className="text-[11px] leading-none">🏠</span>
            <span>
              {language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}
              {shop.fulfillment?.freeDeliveryThreshold
                ? ` (₹${shop.fulfillment.freeDeliveryThreshold}+ पर मुफ्त)`
                : ''}
            </span>
          </span>
        )}

        {isPickupEnabled && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-800 text-[10px] font-bold leading-tight">
            <span className="text-[11px] leading-none">🏪</span>
            <span>
              {language === 'hi' ? 'दुकान से पिकअप (मुफ्त)' : 'Store Pickup (Free)'}
            </span>
          </span>
        )}

        {isOrderingClosed && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold leading-tight">
            <span className="text-[11px] leading-none">⚠️</span>
            <span>
              {language === 'hi'
                ? 'वर्तमान में ऑर्डर बंद हैं'
                : 'Currently Not Accepting Orders'}
            </span>
          </span>
        )}
      </div>

      {/* Expandable Extended Shop Info Drawer */}
      {expanded && (
        <div
          id="shop-expanded-details"
          className="pt-1 mt-0.5 border-t border-slate-100 space-y-1 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {shop.address && (
            <div className="flex items-start gap-2 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 block uppercase leading-tight">
                  {language === 'hi' ? 'पता एवं लैंडमार्क' : 'Address & Landmark'}
                </span>
                <span className="text-[11px] font-medium text-slate-800 leading-snug">
                  {shop.address}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-slate-50/80 p-1 rounded-lg border border-slate-100 flex items-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                  {language === 'hi' ? 'समय' : 'Hours'}
                </span>
                <span className="text-[10px] font-semibold text-slate-800 leading-tight">
                  7:00 AM – 10:00 PM
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-1 rounded-lg border border-slate-100 flex items-start gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                  {language === 'hi' ? 'भुगतान' : 'Payments'}
                </span>
                <span className="text-[10px] font-semibold text-slate-800 leading-tight">
                  COD, UPI & QR
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>प्रमाणित स्थानीय व्यापारी • Verified Merchant</span>
            </span>
            <span className="font-semibold text-slate-600">
              FSSAI Registered
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
