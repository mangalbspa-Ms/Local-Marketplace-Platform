/**
 * Customer Orders Screen — Shop-Wise Profile UI
 * 
 * Implements:
 * 1. Screen Header: "मेरे ऑर्डर्स 🛍️" with subtitle "आपकी खरीदी हुई दुकानों के ऑर्डर"
 * 2. Active Orders and Past Orders tabs
 * 3. Dedicated SHOP PROFILE CARDS (1 card per shop order, distinct and isolated)
 * 4. Dedicated Order Details flow (ShopOrderDetailsScreen)
 * 5. Full support for live merchant polling, pickup PIN, billing, and fulfillment tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { Order, OrderStatus } from '../../../types/order.ts';
import { Shop } from '../../../types/market.ts';
import { ShoppingRequest, ShoppingRequestStatus } from '../../../types/shoppingRequest.ts';
import { ShopOrderCard } from './ShopOrderCard.tsx';
import { ShopOrderDetailsScreen } from './ShopOrderDetailsScreen.tsx';
import { ShoppingRequestDetailModal } from './ShoppingRequestDetailModal.tsx';
import { normalizeCustomerShopOrders, partitionCustomerOrders } from '../../../utils/orderNormalization.ts';
import {
  ShoppingBag,
  RefreshCw,
  Store,
  ChevronRight,
  Sparkles,
  Package,
  Mic,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface OrdersListScreenProps {
  onBrowseShops: () => void;
  onOpenStorefront?: (shopId: string) => void;
}

export const OrdersListScreen: React.FC<OrdersListScreenProps> = ({
  onBrowseShops,
  onOpenStorefront,
}) => {
  const { user } = useCustomerAuth();
  const { language } = useCustomerLanguage();

  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [shoppingRequests, setShoppingRequests] = useState<ShoppingRequest[]>([]);
  const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ShoppingRequest | null>(null);

  // Load orders, shopping requests, and shop metadata
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orderList, shopsList, requestList] = await Promise.all([
        customerApi.getMyOrders(),
        customerApi.getShops().catch(() => [] as Shop[]),
        customerApi.getMyShoppingRequests().catch(() => [] as ShoppingRequest[]),
      ]);

      setRawOrders(orderList);
      setShoppingRequests(requestList);

      const map: Record<string, Shop> = {};
      shopsList.forEach((s) => {
        map[s.id] = s;
      });
      setShopsMap(map);
    } catch (err) {
      console.error('Failed to load orders or shops:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, user?.id]);

  // Enforce ONE SHOP = ONE SHOP CARD architecture
  const normalizedOrders = normalizeCustomerShopOrders(rawOrders, user?.id);
  const { activeOrders, pastOrders } = partitionCustomerOrders(normalizedOrders);

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  // If a specific order is selected, show the dedicated ShopOrderDetailsScreen
  if (selectedOrder) {
    const shopForSelected = shopsMap[selectedOrder.shopId];
    return (
      <ShopOrderDetailsScreen
        order={selectedOrder}
        shop={shopForSelected}
        onBack={() => {
          setSelectedOrder(null);
          loadData();
        }}
        onOrderUpdated={(updated) => {
          setSelectedOrder(updated);
          setRawOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          );
        }}
        onOpenStorefront={onOpenStorefront}
      />
    );
  }

  return (
    <div className="space-y-4 p-4 pb-28 bg-slate-50 min-h-screen">
      {/* 1. Header & Subtitle */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{language === 'hi' ? 'मेरे ऑर्डर्स' : 'My Orders'}</span>
                <span className="text-base">🛍️</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {language === 'hi'
                  ? 'आपकी खरीदी हुई दुकानों के ऑर्डर'
                  : 'Orders from your visited shops'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className={`p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all ${
              isLoading ? 'animate-spin text-emerald-600' : ''
            }`}
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Active Orders vs Past Orders Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{language === 'hi' ? 'सक्रिय ऑर्डर्स' : 'Active Orders'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'past'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{language === 'hi' ? 'पिछले ऑर्डर्स' : 'Past Orders'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'past'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pastOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2.5 Active Voice Shopping Requests (पर्चियाँ) */}
      {shoppingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Mic className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'hi' ? 'बोलकर भेजी गई पर्चियाँ' : 'Voice Shopping Requests'}</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-500">
              {shoppingRequests.length} {language === 'hi' ? 'पर्चियाँ' : 'Requests'}
            </span>
          </div>

          <div className="space-y-2.5">
            {shoppingRequests.map((req) => {
              const shop = shopsMap[req.shopId];
              const isFinalized = req.status === ShoppingRequestStatus.BILL_FINALIZED;
              const isPending = req.status === ShoppingRequestStatus.PENDING_SELLER_REVIEW;
              const isPaid = req.status === ShoppingRequestStatus.PAYMENT_COMPLETED;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                    isFinalized
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400 shadow-md ring-2 ring-emerald-300'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm truncate ${isFinalized ? 'text-white' : 'text-slate-900'}`}>
                          {shop?.name || req.shopName || 'Mandi Shop'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isFinalized
                              ? 'bg-white text-emerald-900 animate-pulse'
                              : isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isFinalized
                            ? language === 'hi'
                              ? '✓ बिल तैयार है (Finalized)'
                              : '✓ Bill Finalized'
                            : isPending
                            ? language === 'hi'
                              ? '⏳ दुकानदार देख रहे हैं'
                              : '⏳ Seller Reviewing'
                            : language === 'hi'
                            ? 'ऑर्डर हो गया'
                            : 'Paid'}
                        </span>
                      </div>

                      <div className={`text-xs mt-1 font-semibold ${isFinalized ? 'text-emerald-100' : 'text-slate-600'}`}>
                        {req.items.length} {language === 'hi' ? 'सामान' : 'items'}
                        {req.rawVoiceTranscript && (
                          <span className="italic truncate block text-[11px] opacity-90">
                            "{req.rawVoiceTranscript}"
                          </span>
                        )}
                      </div>
                    </div>

                    {isFinalized && req.finalizedBill ? (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase text-emerald-100 font-bold">
                          {language === 'hi' ? 'कुल बिल' : 'Total Bill'}
                        </div>
                        <div className="text-lg font-black font-mono text-white">
                          ₹{req.finalizedBill.customerTotal}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100/30 flex items-center justify-between text-xs font-bold">
                    <span className={`text-[11px] ${isFinalized ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {req.requestNumber}
                    </span>

                    <span className="flex items-center gap-1 font-black underline">
                      {isFinalized
                        ? language === 'hi'
                          ? 'बिल देखें व भुगतान करें →'
                          : 'View Bill & Pay →'
                        : language === 'hi'
                        ? 'पर्ची का विवरण देखें →'
                        : 'View Details →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Shop Profile Cards List */}
      {isLoading && rawOrders.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">
            {language === 'hi' ? 'दुकानों के ऑर्डर्स लोड हो रहे हैं...' : 'Loading shop orders...'}
          </p>
        </div>
      ) : displayedOrders.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs space-y-4 my-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              {activeTab === 'active'
                ? language === 'hi'
                  ? 'कोई सक्रिय ऑर्डर नहीं है'
                  : 'No active orders'
                : language === 'hi'
                ? 'कोई पिछला ऑर्डर नहीं है'
                : 'No past orders'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {language === 'hi'
                ? 'स्थानीय मंडी की दुकानों से ताज़ा सामान, सब्जियां या राशन मंगाएं।'
                : 'Order fresh groceries, produce, or daily essentials from your trusted neighborhood shops.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onBrowseShops}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors mx-auto"
          >
            <Store className="w-4 h-4" />
            <span>{language === 'hi' ? 'दुकानें देखें' : 'Browse Local Shops'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Distinct Shop Profile Cards (1 card per shop order) */
        <div className="space-y-3.5 sm:space-y-4">
          {displayedOrders.map((order) => {
            const shop = shopsMap[order.shopId];
            return (
              <ShopOrderCard
                key={order.id}
                order={order}
                shop={shop}
                onViewDetails={(ord) => setSelectedOrder(ord)}
              />
            );
          })}
        </div>
      )}

      {/* Shopping Request Detail & Bill Payment Modal */}
      <ShoppingRequestDetailModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onOrderPaid={(confirmedOrder) => {
          setSelectedRequest(null);
          loadData();
          setSelectedOrder(confirmedOrder);
        }}
      />
    </div>
  );
};
