/**
 * Orders Management Hub Screen (2050 Futuristic Command)
 * Grouped orders lifecycle, pickup vs delivery filters, real customer avatars, and fast actions.
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Building2,
  Package,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { groupOrdersByTimeSlot } from '../../../utils/orderTimeGroups.ts';

interface OrdersScreenProps {
  orders: Order[];
  onViewOrderDetails: (order: Order) => void;
  onOpenPacking: (order: Order) => void;
  onOpenPickupVerification: (order: Order) => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  orders,
  onViewOrderDetails,
  onOpenPacking,
  onOpenPickupVerification,
}) => {
  const { language, t } = useSellerLanguage();

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'ALL' | FulfillmentType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesFulfillment = fulfillmentFilter === 'ALL' || o.fulfillmentType === fulfillmentFilter;
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerPhone || '').includes(searchQuery);
    return matchesStatus && matchesFulfillment && matchesSearch;
  });

  const timeGroups = groupOrdersByTimeSlot(filteredOrders);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case OrderStatus.ACCEPTED:
        return 'bg-cyan-950/80 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]';
      case OrderStatus.PREPARING:
        return 'bg-purple-950/80 border-purple-400/50 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-teal-950/80 border-teal-400/50 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.3)]';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'bg-indigo-950/80 border-indigo-400/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]';
      case OrderStatus.COMPLETED:
        return 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]';
      case OrderStatus.CANCELLED:
        return 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <div id="seller-orders-screen" className="p-3 sm:p-4 space-y-4 max-w-4xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <span>{t('nav.orders')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'दुकान के सभी चालू व पूर्ण आर्डर (समय अनुसार)' : 'All shop orders organized by time slots'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0b142c] border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono shadow-sm">
            {filteredOrders.length} / {orders.length} ऑर्डर्स
          </span>
        </div>
      </div>

      {/* Fulfillment Toggle Pills (Futuristic Segment Switch) */}
      <div className="flex p-1 bg-[#0b142c]/90 rounded-2xl border border-cyan-500/20 shadow-md">
        <button
          type="button"
          onClick={() => setFulfillmentFilter('ALL')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            fulfillmentFilter === 'ALL'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {language === 'hi' ? 'सभी आर्डर (All)' : 'All Orders'}
        </button>
        <button
          type="button"
          onClick={() => setFulfillmentFilter(FulfillmentType.STORE_PICKUP)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            fulfillmentFilter === FulfillmentType.STORE_PICKUP
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'दुकान पिकअप' : 'Pickup'}</span>
        </button>
        <button
          type="button"
          onClick={() => setFulfillmentFilter(FulfillmentType.HOME_DELIVERY)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            fulfillmentFilter === FulfillmentType.HOME_DELIVERY
              ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'होम डिलीवरी' : 'Delivery'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'hi' ? 'आर्डर नंबर या ग्राहक के नाम से खोजें...' : 'Search by order #, customer name...'}
          className="w-full pl-10 pr-4 py-2.5 bg-[#0b142c]/90 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
        />
      </div>

      {/* Status Filter Badges */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: language === 'hi' ? 'सभी' : 'All' },
          { id: OrderStatus.CONFIRMED, label: t('status.CONFIRMED') },
          { id: OrderStatus.ACCEPTED, label: t('status.ACCEPTED') },
          { id: OrderStatus.PREPARING, label: t('status.PREPARING') },
          { id: OrderStatus.READY_FOR_PICKUP, label: t('status.READY_FOR_PICKUP') },
          { id: OrderStatus.OUT_FOR_DELIVERY, label: t('status.OUT_FOR_DELIVERY') },
          { id: OrderStatus.COMPLETED, label: t('status.COMPLETED') },
        ].map((item) => {
          const isSelected = statusFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-[#0b142c]/80 border-cyan-500/20 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Orders Grouped by Time Slots */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-[#0b142c]/90 border border-cyan-500/20 rounded-3xl space-y-2">
          <ShoppingBag className="w-8 h-8 text-cyan-500/40 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'कोई आर्डर नहीं मिला' : 'No orders found matching filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeGroups.map((group) => (
            <div key={group.id} className="space-y-2.5">
              {/* Time Slot Section Header */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-[#0b142c]/70 border border-cyan-500/20">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{group.icon}</span>
                  <h2 className="font-extrabold text-xs sm:text-sm text-white">
                    {language === 'hi' ? group.titleHi : group.titleEn}
                  </h2>
                  <span className="text-[10px] font-bold text-cyan-300 bg-[#070e24] border border-cyan-500/30 px-2 py-0.2 rounded-full font-mono">
                    {group.orders.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'hi' ? group.badgeHi : group.badgeEn}
                </span>
              </div>

              {/* Transaction Cards in this group */}
              <div className="space-y-2.5">
                {group.orders.map((order) => {
                  const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;
                  const itemCount = order.items.length;
                  const totalFormatted = order.financials.customerTotal.toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  });

                  return (
                    <div
                      key={order.id}
                      onClick={() => onViewOrderDetails(order)}
                      className="p-3.5 rounded-3xl bg-[#0b142c]/90 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer space-y-2.5 shadow-lg group"
                    >
                      {/* Customer Row Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Customer Photo */}
                          {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
                            <img
                              src={order.customerAvatar}
                              alt={order.customerName}
                              className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-cyan-500/30"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border bg-cyan-950 text-cyan-300 border-cyan-500/40 font-mono">
                              {order.customerName
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase() || 'CU'}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                              <h3 className="font-extrabold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                                {order.customerName}
                              </h3>
                              <OrderStatusBadge
                                status={order.status}
                                variant="seller"
                                size="sm"
                                customLabel={t(`status.${order.status}`)}
                              />
                            </div>

                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono font-bold text-cyan-400 text-[11px]">{order.orderNumber}</span>
                              <span className="text-slate-600">•</span>
                              <span className="font-bold text-slate-300">
                                {itemCount} {language === 'hi' ? 'सामान' : 'items'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="font-mono font-black text-cyan-300">
                                ₹{totalFormatted}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span
                                className={`inline-flex items-center space-x-0.5 font-bold text-[11px] ${
                                  isPickup ? 'text-blue-400' : 'text-purple-400'
                                }`}
                              >
                                {isPickup ? (
                                  <>
                                    <Building2 className="w-3 h-3 inline mr-0.5" />
                                    <span>{language === 'hi' ? 'दुकान पिकअप' : 'Pickup'}</span>
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

                        {/* Right: Order Time & Action Arrow */}
                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-[#070e24] text-slate-400 border border-cyan-500/20 group-hover:border-cyan-400 group-hover:text-cyan-300 flex items-center justify-center transition">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Items Thumbnails Ribbon (Compact preview) */}
                      <div className="p-2 rounded-2xl bg-[#070e24]/80 border border-cyan-500/15 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-1.5 overflow-hidden flex-1">
                          {order.items.slice(0, 4).map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-[#0b142c] border border-cyan-500/20 shrink-0"
                            >
                              {item.productImage && item.productImage.trim() !== '' ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-4 h-4 rounded-md object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              )}
                              <span className="font-semibold text-white text-[11px] truncate max-w-[90px]">
                                {item.productName}
                              </span>
                              <span className="text-cyan-300 font-mono text-[10px]">
                                ({item.orderedQuantityDisplay})
                              </span>
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <span className="text-[10px] font-bold text-cyan-300 bg-[#0b142c] border border-cyan-500/20 px-1.5 py-0.5 rounded-lg shrink-0">
                              +{order.items.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Quick Action Buttons */}
                        {order.status === OrderStatus.ACCEPTED && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPacking(order);
                            }}
                            className="py-1 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)] shrink-0 cursor-pointer"
                          >
                            {language === 'hi' ? 'पैकिंग शुरू करें' : 'Start Packing'}
                          </button>
                        )}

                        {order.status === OrderStatus.READY_FOR_PICKUP && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPickupVerification(order);
                            }}
                            className="py-1 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{language === 'hi' ? 'पिन सत्यापित करें' : 'Verify PIN'}</span>
                          </button>
                        )}
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

