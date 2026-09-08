/**
 * Orders Management Hub Screen (Screen 5 & 6)
 * Filter by fulfillment type (Store Pickup vs Home Delivery) and status lifecycle.
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
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
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case OrderStatus.ACCEPTED:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case OrderStatus.PREPARING:
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-teal-50 border-teal-200 text-teal-800';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case OrderStatus.COMPLETED:
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-slate-900 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <span>{t('nav.orders')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'hi' ? 'दुकान के सभी चालू व पूर्ण आर्डर (समय अनुसार)' : 'All shop orders organized by time'}
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-mono">
          {filteredOrders.length} / {orders.length}
        </span>
      </div>

      {/* Fulfillment Toggle Pills */}
      <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setFulfillmentFilter('ALL')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            fulfillmentFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'hi' ? 'सभी आर्डर' : 'All'}
        </button>
        <button
          onClick={() => setFulfillmentFilter(FulfillmentType.STORE_PICKUP)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            fulfillmentFilter === FulfillmentType.STORE_PICKUP
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'पिकअप' : 'Pickup'}</span>
        </button>
        <button
          onClick={() => setFulfillmentFilter(FulfillmentType.HOME_DELIVERY)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            fulfillmentFilter === FulfillmentType.HOME_DELIVERY
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'डिलीवरी' : 'Delivery'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'hi' ? 'आर्डर नंबर या ग्राहक के नाम से खोजें...' : 'Search by order #, customer name...'}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Orders Grouped by Time Slots */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <ShoppingBag className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {language === 'hi' ? 'कोई आर्डर नहीं मिला' : 'No orders found matching filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {timeGroups.map((group) => (
            <div key={group.id} className="space-y-2.5">
              {/* Time Slot Section Header */}
              <div className="flex items-center justify-between px-1.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/70">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{group.icon}</span>
                  <h2 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    {language === 'hi' ? group.titleHi : group.titleEn}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded-full font-mono">
                    {group.orders.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
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
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                    >
                      {/* Customer Row Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Real Customer Photo */}
                          {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
                            <img
                              src={order.customerAvatar}
                              alt={order.customerName}
                              className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border bg-emerald-100 text-emerald-800 border-emerald-300">
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
                            <div className="flex items-center space-x-2">
                              <h3 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                {order.customerName}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                                {t(`status.${order.status}`)}
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                              <span className="font-mono font-bold text-slate-700 text-[11px]">{order.orderNumber}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-slate-800">
                                {itemCount} {language === 'hi' ? 'सामान' : 'items'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono font-black text-slate-900">
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
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Items Thumbnails Ribbon (Compact preview) */}
                      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-1.5 overflow-hidden flex-1">
                          {order.items.slice(0, 4).map((item, iIdx) => (
                            <div
                              key={iIdx}
                              className="flex items-center space-x-1 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200/80 shrink-0 shadow-2xs"
                            >
                              {item.productImage && item.productImage.trim() !== '' ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-5 h-5 rounded object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              ) : (
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-700 text-[11px] truncate max-w-[90px]">
                                {item.productName}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                ({item.orderedQuantityDisplay})
                              </span>
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
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
                            className="py-1 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs shrink-0 cursor-pointer"
                          >
                            {language === 'hi' ? 'पैकिंग करें' : 'Pack Order'}
                          </button>
                        )}

                        {order.status === OrderStatus.READY_FOR_PICKUP && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPickupVerification(order);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{language === 'hi' ? 'पिन चेक' : 'Verify PIN'}</span>
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

