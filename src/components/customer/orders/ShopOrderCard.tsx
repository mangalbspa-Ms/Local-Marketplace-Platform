import React from 'react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { Shop } from '../../../types/market.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import {
  ShieldCheck,
  Star,
  MapPin,
  ShoppingBag,
  Store,
  Bike,
  ChevronRight,
  Sparkles,
  Clock,
} from 'lucide-react';

interface ShopOrderCardProps {
  order: Order;
  shop?: Shop;
  onViewDetails: (order: Order) => void;
}

export const ShopOrderCard: React.FC<ShopOrderCardProps> = ({
  order,
  shop,
  onViewDetails,
}) => {
  const { language } = useCustomerLanguage();

  const isShopPickupOnly = shop?.fulfillment?.pickupEnabled && !shop?.fulfillment?.deliveryEnabled;
  const isShopDeliveryOnly = !shop?.fulfillment?.pickupEnabled && shop?.fulfillment?.deliveryEnabled;
  const isPickup = isShopPickupOnly || (order.fulfillmentType === FulfillmentType.STORE_PICKUP && !isShopDeliveryOnly);
  const isTerminal =
    order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;
  const totalPayable = order.financials?.customerTotal ?? 0;
  const orderNumberDisplay = order.orderNumber || `#ORD-${order.id.slice(-6).toUpperCase()}`;

  // Use shop metadata with sensible fallbacks
  const shopName = shop?.name || order.shopName || 'Local Mandi Merchant';
  const shopPhoto =
    (shop?.bannerImageUrl && shop.bannerImageUrl.trim()) ||
    (shop?.photoUrl && shop.photoUrl.trim()) ||
    (shop?.logoImageUrl && shop.logoImageUrl.trim()) ||
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
  const rating = shop?.averageRating ? shop.averageRating.toFixed(1) : '4.8';
  const distance = shop?.distanceText || (shop?.distanceKm ? `${shop.distanceKm} km` : '0.5 km');
  const isOpen = shop?.isOpenNow !== undefined ? shop.isOpenNow : true;

  // Format Date & Time: e.g. "31 अगस्त • 5:57 PM"
  const formattedDateTime = (() => {
    try {
      const d = new Date(order.createdAt);
      const datePart = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
      });
      const timePart = d.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart} • ${timePart}`;
    } catch {
      return order.createdAt;
    }
  })();

  // Order status badge styling & label
  const getStatusInfo = () => {
    switch (order.status) {
      case OrderStatus.PAYMENT_PENDING:
      case OrderStatus.CONFIRMED:
        return {
          icon: '🔵',
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: language === 'hi' ? 'ऑर्डर कन्फर्म हुआ' : 'Order Confirmed',
        };
      case OrderStatus.ACCEPTED:
        return {
          icon: '🔵',
          badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
          label: language === 'hi' ? 'दुकानदार ने स्वीकार किया' : 'Accepted by Shop',
        };
      case OrderStatus.PREPARING:
        return {
          icon: '🟡',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
          label: language === 'hi' ? 'ऑर्डर तैयार हो रहा है' : 'Preparing Order',
        };
      case OrderStatus.READY_FOR_PICKUP:
        return {
          icon: '🟢',
          badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/30',
          label: language === 'hi' ? 'पिकअप हेतु तैयार' : 'Ready for Pickup',
        };
      case OrderStatus.OUT_FOR_DELIVERY:
        return {
          icon: '🏠',
          badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          label: language === 'hi' ? 'डिलीवरी के लिए रवाना' : 'Out for Delivery',
        };
      case OrderStatus.COMPLETED:
        return {
          icon: '✅',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: language === 'hi' ? 'पूर्ण हुआ' : 'Delivered / Completed',
        };
      case OrderStatus.CANCELLED:
        return {
          icon: '🔴',
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: language === 'hi' ? 'रद्द हुआ' : 'Cancelled',
        };
      default:
        return {
          icon: '📦',
          badgeBg: 'bg-slate-50 text-slate-800 border-slate-200',
          label: order.status,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const itemsCount = order.items.length;

  return (
    <div
      id={`shop-order-card-${order.id}`}
      onClick={() => onViewDetails(order)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all duration-200 p-3 space-y-2.5 cursor-pointer flex flex-col justify-between"
    >
      {/* 1. Compact Shop Profile Top Row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={shopPhoto}
            alt={shopName}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/80 shrink-0 group-hover:scale-105 transition-transform duration-200"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {shopName}
              </h3>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>{language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-0.5 text-amber-600 font-bold bg-amber-50 px-1 py-0.2 rounded">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-600">
                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                <span>{distance}</span>
              </span>
              <span>•</span>
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  isOpen ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span>
                  {isOpen
                    ? language === 'hi' ? 'खुला' : 'Open'
                    : language === 'hi' ? 'बंद' : 'Closed'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Fulfillment Mode Pill */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
            {isPickup ? (
              <>
                <Store className="w-2.5 h-2.5 text-emerald-600" />
                <span>{language === 'hi' ? 'दुकान पिकअप' : 'Pickup'}</span>
              </>
            ) : (
              <>
                <Bike className="w-2.5 h-2.5 text-indigo-600" />
                <span>{language === 'hi' ? 'होम डिलीवरी' : 'Delivery'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 2. Compact Order Summary Strip */}
      <div className="flex items-center justify-between bg-slate-50/90 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs">
        <div className="flex items-center gap-1 font-bold text-slate-800">
          <span>🛍️</span>
          <span>
            {itemsCount} {language === 'hi' ? 'सामान' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-bold text-[11px]">
            {language === 'hi' ? 'कुल' : 'Total'}:
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-900">
            ₹{totalPayable}
          </span>
        </div>
      </div>

      {/* Special Pickup PIN if Store Pickup and not completed */}
      {isPickup && order.pickupCode && !isTerminal && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px]">
          <span className="text-emerald-900 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{language === 'hi' ? 'पिकअप PIN:' : 'PIN:'}</span>
          </span>
          <span className="font-mono font-black text-emerald-950 tracking-wider bg-white px-1.5 py-0.2 rounded border border-emerald-300">
            {order.pickupCode}
          </span>
        </div>
      )}

      {/* 3. Bottom Row: Status Badge + Date & View Order Button */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusInfo.badgeBg}`}
          >
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </span>

          <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
            {orderNumberDisplay} • {formattedDateTime}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(order);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors shrink-0"
        >
          <span>{language === 'hi' ? 'ऑर्डर देखें' : 'View Order'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
