/**
 * Master Orders Management Screen
 * 
 * Compact, high-density marketplace order monitor with cross-shop filtering,
 * compact horizontal status filter row, live financial totals, and detail view.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { Order, OrderStatus } from '../../../types/order.ts';
import { AdminOrderDetailModal } from './AdminOrderDetailModal.tsx';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import { useAdminPreferences } from '../../../context/AdminPreferencesContext.tsx';
import {
  ShoppingBag,
  Search,
  Eye,
  Store,
  Clock,
  Truck,
  User,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

type QuickStatusFilter = 'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export const MasterOrdersScreen: React.FC = () => {
  const { t, language } = useAdminPreferences();
  const [orders, setOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickStatusFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL');
  const [selectedShopId, setSelectedShopId] = useState('ALL');

  // Selected Order for detail modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const [ordersData, shopsData] = await Promise.all([
        adminApi.getOrders({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          fulfillment: fulfillmentFilter !== 'ALL' ? fulfillmentFilter : undefined,
          shopId: selectedShopId !== 'ALL' ? selectedShopId : undefined,
          search: searchQuery.trim() || undefined,
        }),
        adminApi.getShops(),
      ]);
      setOrders(ordersData);
      setShops(shopsData);
    } catch (err) {
      console.error('Failed to load master orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, fulfillmentFilter, selectedShopId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case OrderStatus.OUT_FOR_DELIVERY:
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case OrderStatus.PREPARING:
      case OrderStatus.ACCEPTED:
      case OrderStatus.CONFIRMED:
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case OrderStatus.PAYMENT_PENDING:
      case OrderStatus.REFUND_PENDING:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case OrderStatus.CANCELLED:
      case OrderStatus.PAYMENT_FAILED:
      case OrderStatus.REFUNDED:
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Filter orders according to quickFilter
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Quick status filter
      if (quickFilter === 'NEW') {
        if (!['PLACED', 'CONFIRMED', 'NEW', 'PAYMENT_PENDING'].includes(order.status)) return false;
      } else if (quickFilter === 'PREPARING') {
        if (!['PREPARING', 'ACCEPTED'].includes(order.status)) return false;
      } else if (quickFilter === 'READY') {
        if (!['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'READY'].includes(order.status)) return false;
      } else if (quickFilter === 'COMPLETED') {
        if (order.status !== OrderStatus.COMPLETED) return false;
      } else if (quickFilter === 'CANCELLED') {
        if (!['CANCELLED', 'PAYMENT_FAILED', 'REFUNDED'].includes(order.status)) return false;
      }

      // 2. Client-side search match fallback (if not submitted via enter)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = order.id?.toLowerCase().includes(q);
        const custMatch = order.customerName?.toLowerCase().includes(q);
        const phoneMatch = order.customerPhone?.includes(q);
        const shopMatch = order.shopName?.toLowerCase().includes(q);
        if (!idMatch && !custMatch && !phoneMatch && !shopMatch) return false;
      }

      return true;
    });
  }, [orders, quickFilter, searchQuery]);

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter((o) =>
    ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
  const totalGmvAmount = orders.reduce((sum, o) => sum + (o.financials?.customerTotal || o.totalAmount || 0), 0);

  return (
    <div className="space-y-2.5 animate-fade-in text-xs">
      {/* Compact Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white leading-tight">
              {t('orders.title', 'Master Orders')}
            </h2>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredOrders.length} / {totalOrdersCount}
            </span>
          </div>
        </div>

        {/* View Toggle & Refresh */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700/60 flex items-center gap-1 transition active:scale-95"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3 h-3 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('header.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* 4 Ultra-Compact KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('orders.total', 'Total Orders')}</div>
            <div className="text-sm font-black text-white font-mono">{totalOrdersCount}</div>
          </div>
          <div className="text-[9px] text-slate-500 font-medium">All shops</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">{t('orders.active', 'In Progress')}</div>
            <div className="text-sm font-black text-amber-400 font-mono">{activeOrdersCount}</div>
          </div>
          <div className="text-[9px] text-amber-400/70 font-medium">Active</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{t('orders.completed', 'Completed')}</div>
            <div className="text-sm font-black text-emerald-400 font-mono">{completedOrdersCount}</div>
          </div>
          <div className="text-[9px] text-emerald-400/70 font-medium">Fulfilled</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t('orders.gmv', 'Total Volume')}</div>
            <div className="text-sm font-black text-indigo-300 font-mono">₹{totalGmvAmount.toLocaleString('en-IN')}</div>
          </div>
          <div className="text-[9px] text-indigo-400/70 font-medium">GMV</div>
        </div>
      </div>

      {/* Compact Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
          {/* Compact Search Field */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Customer, Phone..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 pl-7 text-xs text-white placeholder-slate-500 outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          {/* Quick Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium max-w-[140px] truncate"
            >
              <option value="ALL">All Shops</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="HOME_DELIVERY">Delivery</option>
              <option value="STORE_PICKUP">Pickup</option>
            </select>
          </div>
        </div>

        {/* Compact Horizontal Filter Row: All | New | Preparing | Ready | Completed | Cancelled */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {[
            { id: 'ALL' as QuickStatusFilter, label: t('filter.all', 'All') },
            { id: 'NEW' as QuickStatusFilter, label: t('filter.new', 'New') },
            { id: 'PREPARING' as QuickStatusFilter, label: t('filter.preparing', 'Preparing') },
            { id: 'READY' as QuickStatusFilter, label: t('filter.ready', 'Ready') },
            { id: 'COMPLETED' as QuickStatusFilter, label: t('filter.completed', 'Completed') },
            { id: 'CANCELLED' as QuickStatusFilter, label: t('filter.cancelled', 'Cancelled') },
          ].map((tab) => {
            const isActive = quickFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 text-[11px] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Table View */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-400 animate-spin" />
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No orders found matching the filter criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* Compact Table View */
        <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-900/80 shadow-xs">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">{t('orders.orderId', 'Order ID')}</th>
                <th className="p-2">{t('orders.shop', 'Shop')}</th>
                <th className="p-2">{t('orders.customer', 'Customer')}</th>
                <th className="p-2">{t('orders.type', 'Type')}</th>
                <th className="p-2">{t('orders.status', 'Status')}</th>
                <th className="p-2 text-right">{t('orders.amount', 'Amount')}</th>
                <th className="p-2 text-center">{t('orders.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-2 font-mono font-bold text-white whitespace-nowrap">
                    #{order.id?.slice(-8).toUpperCase() || order.id}
                    <div className="text-[10px] text-slate-500 font-normal">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span className="font-semibold text-indigo-300">{order.shopName || 'Shop'}</span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="font-semibold text-white">{order.customerName}</div>
                    <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {order.fulfillmentType === 'HOME_DELIVERY' ? (language === 'hi' ? 'डिलीवरी' : 'Delivery') : (language === 'hi' ? 'पिकअप' : 'Pickup')}
                    </span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <OrderStatusBadge
                      status={order.status}
                      variant="dark"
                      size="sm"
                      language={language}
                    />
                  </td>
                  <td className="p-2 text-right font-mono whitespace-nowrap">
                    <div className="font-black text-white">
                      ₹{order.financials?.customerTotal || order.totalAmount || 0}
                    </div>
                    <div className="text-[10px] text-indigo-400 font-bold">
                      {language === 'hi' ? 'फीस' : 'Fee'}: ₹{order.financials?.commissionAmount || 0}
                    </div>
                  </td>
                  <td className="p-2 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white transition flex items-center gap-1 mx-auto text-[11px] font-bold border border-slate-700/60"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t('orders.viewDetails', 'View Details')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Compact Information-Dense Order Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredOrders.map((order) => {
            const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const isDelivery = order.fulfillmentType === 'HOME_DELIVERY';
            const itemsCount = order.items?.length || 0;
            const itemsSummary = order.items?.map((i: any) => `${i.productName} (${i.quantityCount}${i.unit})`).join(', ') || 'Items basket';
            const totalAmount = order.financials?.customerTotal || order.totalAmount || 0;
            const commissionFee = order.financials?.commissionAmount || 0;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group cursor-pointer rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:bg-slate-900 p-2.5 sm:p-3 shadow-xs transition flex flex-col justify-between gap-2"
              >
                {/* 1. Header Strip: Order ID, Time/Date, Fulfillment Badge & Status */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-black font-mono text-white truncate">
                      #{order.id?.slice(-8).toUpperCase() || order.id}
                    </span>
                    <span className="text-slate-600 text-[10px]">•</span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {timeStr} • {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pickup / Delivery Badge */}
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                      {isDelivery ? <Truck className="w-2.5 h-2.5 text-sky-400" /> : <Store className="w-2.5 h-2.5 text-amber-400" />}
                      <span>{isDelivery ? (language === 'hi' ? 'डिलीवरी' : 'Delivery') : (language === 'hi' ? 'पिकअप' : 'Pickup')}</span>
                    </span>

                    {/* Status Badge */}
                    <OrderStatusBadge
                      status={order.status}
                      variant="dark"
                      size="sm"
                      language={language}
                    />
                  </div>
                </div>

                {/* 2. Customer Name & Shop Name */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      <span>{t('orders.customer', 'Customer')}</span>
                    </div>
                    <div className="font-bold text-white truncate text-[11px]">{order.customerName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{order.customerPhone}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                      <Store className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{t('orders.shop', 'Shop')}</span>
                    </div>
                    <div className="font-bold text-indigo-300 truncate text-[11px]">{order.shopName || 'Shop'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{order.marketName || 'Local Mandi'}</div>
                  </div>
                </div>

                {/* 3. Items Summary */}
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                  <span className="font-bold text-slate-200 shrink-0 px-1 py-0.2 rounded bg-slate-800 text-[9px]">
                    {language === 'hi' ? `${itemsCount} वस्तुएं` : `${itemsCount} ${itemsCount === 1 ? 'item' : 'items'}`}
                  </span>
                  <span className="truncate text-slate-400">
                    {itemsSummary}
                  </span>
                </div>

                {/* 4. Bottom Row: Total Amount & Small "View Details" Action */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white font-mono">
                      ₹{totalAmount}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium font-mono">
                      ({language === 'hi' ? 'फीस' : 'Fee'}: ₹{commissionFee})
                    </span>
                  </div>

                  {/* Small "View Details" Action (replacing large button) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(order.id);
                    }}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white text-[11px] font-bold flex items-center gap-1 transition active:scale-95 border border-slate-700/70 shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500"
                    title="View Details"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{t('orders.viewDetails', 'View Details')}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};
