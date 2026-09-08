/**
 * Seller Home Dashboard Screen (Screen 2 & Screen 4 Redesign)
 * Modern, clean, light Indian kirana store management dashboard.
 * Focus: Order Groups & Packing Groups dashboard (One Order = One Transaction).
 */

import React from 'react';
import {
  ShoppingBag,
  PackageCheck,
  Plus,
  Boxes,
  ChevronRight,
  Sparkles,
  Tag,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../types/order.ts';
import { Product } from '../../types/product.ts';
import { ShoppingRequest, ShoppingRequestStatus } from '../../types/shoppingRequest.ts';
import { useSellerAuth } from '../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../context/SellerLanguageContext.tsx';
import { SellerTab } from './common/SellerBottomNav.tsx';
import { Mic } from 'lucide-react';

interface HomeScreenProps {
  orders: Order[];
  products: Product[];
  shoppingRequests?: ShoppingRequest[];
  onSelectTab: (tab: SellerTab) => void;
  onOpenShopStatus: () => void;
  onViewOrderDetails: (order: Order) => void;
  onOpenShoppingRequest?: (request: ShoppingRequest) => void;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onOpenAddProduct: () => void;
  onOpenVoiceAssistant?: () => void;
}

// Helper to get consistent avatar initials and accent colors for customers
const getCustomerAvatarConfig = (name: string, index: number) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CU';

  const colorPalettes = [
    { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    { bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    { bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    { bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  ];

  return {
    initials,
    palette: colorPalettes[index % colorPalettes.length],
  };
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  orders,
  products,
  shoppingRequests = [],
  onSelectTab,
  onOpenShopStatus,
  onViewOrderDetails,
  onOpenShoppingRequest,
  onAcceptOrder,
  onRejectOrder,
  onOpenAddProduct,
  onOpenVoiceAssistant,
}) => {
  const { shop } = useSellerAuth();
  const { language, t } = useSellerLanguage();

  if (!shop) return null;

  // Pending voice shopping requests
  const pendingRequests = shoppingRequests.filter(
    (r) => r.status === ShoppingRequestStatus.PENDING_SELLER_REVIEW
  );

  // 1. New Orders (CONFIRMED status waiting for seller acceptance)
  const newOrders = orders.filter((o) => o.status === OrderStatus.CONFIRMED);

  // 2. Packing Orders (ACCEPTED or PREPARING status in fulfillment pipeline)
  const packingOrders = orders.filter(
    (o) => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
  );

  // 3. Ready / Out for Delivery / Completed
  const pickupReadyOrders = orders.filter((o) => o.status === OrderStatus.READY_FOR_PICKUP);
  const deliveryActiveOrders = orders.filter((o) => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);

  const todayEarnings = completedOrders.reduce((sum, o) => sum + o.financials.sellerNetAmount, 0);
  const lowStockCount = products.filter((p) => {
    if (!p) return false;
    const stock = p.currentStockInBaseUnits ?? p.inventory?.currentStockInBaseUnits ?? 0;
    const threshold = p.lowStockThresholdInBaseUnits ?? p.inventory?.lowStockThreshold ?? 5;
    return stock <= threshold;
  }).length;

  return (
    <div className="p-3.5 sm:p-4 space-y-4 max-w-4xl mx-auto">
      {/* ==================================================================== */}
      {/* 0. INCOMING VOICE SHOPPING REQUESTS (पर्चियाँ)                      */}
      {/* ==================================================================== */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-4 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>{language === 'hi' ? '🎙️ नई ग्राहक पर्चियाँ' : '🎙️ Voice Shopping Requests'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-emerald-900 text-[10px] font-black">
                    {pendingRequests.length} {language === 'hi' ? 'नई' : 'New'}
                  </span>
                </h2>
                <p className="text-[11px] text-emerald-100">
                  {language === 'hi'
                    ? 'ग्राहक ने बोलकर सामान मांगा है • बिल फाइनल करके भेजें'
                    : 'Customer requested by voice • Set prices & finalize bill'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onOpenShoppingRequest?.(req)}
                className="bg-white text-slate-900 p-3 rounded-xl shadow-xs border border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900">{req.customerName}</span>
                    <span className="font-mono text-[10px] text-slate-500">{req.requestNumber}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded">
                      {req.items.length} {language === 'hi' ? 'सामान' : 'items'}
                    </span>
                  </div>

                  {req.rawVoiceTranscript && (
                    <p className="text-[11px] text-slate-600 truncate italic mt-0.5">
                      "{req.rawVoiceTranscript}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShoppingRequest?.(req);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-2xs cursor-pointer"
                >
                  {language === 'hi' ? 'बिल बनाएं →' : 'Finalize Bill →'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. MAIN DASHBOARD CARDS: 🛍️ NEW ORDERS & 📦 PACKING GROUPS           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* ---------------- CARD 1: 🛍️ NEW ORDERS (नए ऑर्डर) ---------------- */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-1.5">
                  <span>{language === 'hi' ? '🛍️ नए ऑर्डर' : '🛍️ New Orders'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                    {newOrders.length}
                  </span>
                </h2>
              </div>

              <button
                onClick={() => onSelectTab('orders')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center space-x-0.5"
              >
                <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customer/Order Previews */}
            <div className="p-2.5 space-y-2">
              {newOrders.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">
                    {language === 'hi' ? 'कोई नया ऑर्डर लंबित नहीं है' : 'No new orders pending'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'hi' ? 'नया ऑर्डर आने पर आपको तुरंत सूचना मिलेगी' : 'New incoming customer orders will appear here'}
                  </p>
                </div>
              ) : (
                newOrders.map((order, idx) => {
                  const avatar = getCustomerAvatarConfig(order.customerName, idx);
                  const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;
                  const itemCount = order.items.length;
                  const totalFormatted = order.financials.customerTotal.toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  });

                  return (
                    <div
                      key={order.id}
                      onClick={() => onViewOrderDetails(order)}
                      className="p-3 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      {/* Customer Avatar & Info */}
                      <div className="flex items-center space-x-3 min-w-0">
                        {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
                          <img
                            src={order.customerAvatar}
                            alt={order.customerName}
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${avatar.palette.bg}`}
                          >
                            {avatar.initials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                              {order.customerName}
                            </h3>
                          </div>

                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                            <span className="font-mono font-bold text-slate-700 text-[11px]">{order.orderNumber}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-slate-800">
                              {itemCount} {language === 'hi' ? 'सामान' : 'items'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono font-extrabold text-slate-900">
                              ₹{totalFormatted}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`inline-flex items-center space-x-0.5 font-bold text-[11px] ${
                                isPickup ? 'text-blue-700' : 'text-emerald-700'
                              }`}
                            >
                              {isPickup ? (
                                <>
                                  <Building2 className="w-3 h-3 inline mr-0.5" />
                                  <span>{language === 'hi' ? 'पिकअप' : 'Pickup'}</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3 h-3 inline mr-0.5" />
                                  <span>{language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Arrow & Status */}
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          {language === 'hi' ? 'नया' : 'NEW'}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Button */}
          <div className="p-2.5 pt-0">
            <button
              onClick={() => onSelectTab('orders')}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{language === 'hi' ? 'सभी ऑर्डर देखें →' : 'View All Orders →'}</span>
            </button>
          </div>
        </div>

        {/* ---------------- CARD 2: 📦 PACKING (पैकिंग) ---------------- */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-1.5">
                  <span>{language === 'hi' ? '📦 पैकिंग' : '📦 Packing'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">
                    {packingOrders.length}
                  </span>
                </h2>
              </div>

              <button
                onClick={() => onSelectTab('packing')}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 transition-colors flex items-center space-x-0.5"
              >
                <span>{language === 'hi' ? 'देखें' : 'View'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Customer/Packing Previews */}
            <div className="p-2.5 space-y-2">
              {packingOrders.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">
                    {language === 'hi' ? 'सभी आर्डर पैक हो चुके हैं' : 'All active orders are packed'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'hi' ? 'स्वीकार किए गए ऑर्डर यहाँ पैकिंग हेतु दिखेंगे' : 'Accepted orders ready for packing appear here'}
                  </p>
                </div>
              ) : (
                packingOrders.map((order, idx) => {
                  const avatar = getCustomerAvatarConfig(order.customerName, idx + 2);
                  const totalItems = order.items.length;
                  // Calculate packed progress (simulate or inspect item.isPacked)
                  const packedItemsCount = order.items.filter((i) => i.isPacked).length || (order.status === OrderStatus.PREPARING ? Math.min(8, totalItems) : 0);
                  const isFullyPacked = packedItemsCount === totalItems;

                  return (
                    <div
                      key={order.id}
                      onClick={() => onViewOrderDetails(order)}
                      className="p-3 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      {/* Customer Avatar & Progress */}
                      <div className="flex items-center space-x-3 min-w-0">
                        {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
                          <img
                            src={order.customerAvatar}
                            alt={order.customerName}
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${avatar.palette.bg}`}
                          >
                            {avatar.initials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                              {order.customerName}
                            </h3>
                          </div>

                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                            <span className="font-mono font-bold text-slate-700 text-[11px]">{order.orderNumber}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-purple-800">
                              {packedItemsCount}/{totalItems} {language === 'hi' ? 'सामान पैक' : 'packed'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              ₹{order.financials.customerTotal.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Arrow */}
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isFullyPacked
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isFullyPacked ? '🟢 Ready' : '🟡 Packing'}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Button */}
          <div className="p-2.5 pt-0">
            <button
              onClick={() => onSelectTab('packing')}
              className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer border border-purple-200/60"
            >
              <span>{language === 'hi' ? 'पैकिंग देखें →' : 'View Packing Checklist →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. QUICK ACTION SHORTCUTS (त्वरित कार्य)                              */}
      {/* ==================================================================== */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {language === 'hi' ? 'त्वरित कार्य (Quick Actions):' : 'Quick Actions:'}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. ➕ सामान जोड़ें */}
          <button
            onClick={onOpenAddProduct}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              {language === 'hi' ? '➕ सामान जोड़ें' : 'Add Item'}
            </span>
          </button>

          {/* 2. 💰 भाव बदलें */}
          <button
            onClick={() => onSelectTab('products')}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Tag className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              {language === 'hi' ? '🏷️ भाव बदलें' : 'Change Price'}
            </span>
          </button>

          {/* 3. 📦 स्टॉक बदलें */}
          <button
            onClick={() => onSelectTab('products')}
            className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              {language === 'hi' ? '📦 स्टॉक बदलें' : 'Edit Stock'}
            </span>
          </button>

          {/* 4. 🎙️ AI दूकान सहायक */}
          <button
            onClick={onOpenVoiceAssistant}
            className="p-3 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-400 hover:shadow-xs transition-all flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-950">
              {language === 'hi' ? '🎙️ AI सहायक' : 'AI Assistant'}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PERFORMANCE METRICS SUMMARY                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Today's Earnings */}
        <div
          onClick={() => onSelectTab('earnings')}
          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-0.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">
              {t('earnings.today')}
            </span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-3 h-3" />
            </div>
          </div>
          <div className="font-mono text-base sm:text-lg font-black text-slate-900">
            ₹{todayEarnings.toFixed(0)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block truncate">
            {completedOrders.length} {language === 'hi' ? 'पूर्ण' : 'done'}
          </span>
        </div>

        {/* Ready Orders */}
        <div
          onClick={() => onSelectTab('orders')}
          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all cursor-pointer space-y-0.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">
              {language === 'hi' ? 'तैयार आर्डर' : 'Ready'}
            </span>
            <div className="p-1 rounded-md bg-blue-50 text-blue-700">
              <Truck className="w-3 h-3" />
            </div>
          </div>
          <div className="font-mono text-base sm:text-lg font-black text-blue-700">
            {pickupReadyOrders.length + deliveryActiveOrders.length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block truncate">
            {language === 'hi' ? 'पिकअप / डिलीवरी' : 'Pickup/Delivery'}
          </span>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => onSelectTab('products')}
          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all cursor-pointer space-y-0.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">
              {language === 'hi' ? 'कम स्टॉक' : 'Low Stock'}
            </span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
            </div>
          </div>
          <div className="font-mono text-base sm:text-lg font-black text-amber-700">
            {lowStockCount}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block truncate">
            {language === 'hi' ? 'भरें' : 'Refill'}
          </span>
        </div>
      </div>
    </div>
  );
};
