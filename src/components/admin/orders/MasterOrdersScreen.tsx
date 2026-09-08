/**
 * Master Orders Management Screen
 * 
 * Central marketplace order monitor with cross-shop filtering, live statuses,
 * financial totals, and detail view.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { Order, OrderStatus } from '../../../types/order.ts';
import { AdminOrderDetailModal } from './AdminOrderDetailModal.tsx';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Store,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  Calendar,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const MasterOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
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
          paymentStatus: paymentFilter !== 'ALL' ? paymentFilter : undefined,
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
  }, [statusFilter, paymentFilter, fulfillmentFilter, selectedShopId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case OrderStatus.OUT_FOR_DELIVERY:
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case OrderStatus.PREPARING:
      case OrderStatus.ACCEPTED:
      case OrderStatus.CONFIRMED:
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case OrderStatus.PAYMENT_PENDING:
      case OrderStatus.REFUND_PENDING:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case OrderStatus.CANCELLED:
      case OrderStatus.PAYMENT_FAILED:
      case OrderStatus.REFUNDED:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <span>Master Orders Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time live monitoring of customer orders, merchant preparations, delivery cycles, and financial reconciliation.
          </p>
        </div>

        {/* Multi-Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Shop */}
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold max-w-[150px] truncate"
          >
            <option value="ALL">All Shops</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Fulfillment */}
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Types</option>
            <option value="HOME_DELIVERY">Home Delivery</option>
            <option value="STORE_PICKUP">Store Pickup</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order ID, Customer Name or Phone..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </form>

      {/* Orders Grid / List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Querying master orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-800 p-5 bg-slate-900 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-black font-mono text-white">{order.id}</span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Shop & Customer */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/60 mb-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <Store className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[160px]">{order.shopName}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {order.fulfillmentType === 'HOME_DELIVERY' ? 'Delivery' : 'Pickup'}
                    </span>
                  </div>

                  <div className="text-slate-300 font-medium">
                    Customer: <span className="font-bold text-white">{order.customerName}</span> ({order.customerPhone})
                  </div>
                </div>

                {/* Items Summary & Items Count */}
                <div className="text-xs text-slate-400 mb-3">
                  <span className="font-bold text-slate-200">{order.items?.length || 0} items</span>:
                  <span className="ml-1 truncate inline-block max-w-[200px] align-bottom">
                    {order.items?.map((i: any) => `${i.productName} (${i.quantityCount}${i.unit})`).join(', ')}
                  </span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/80 mb-3 text-center">
                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Customer Paid</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      ₹{order.financials?.customerTotal || 0}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Platform Fee</div>
                    <div className="text-xs font-black text-indigo-400 mt-0.5">
                      ₹{order.financials?.commissionAmount || 0}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Seller Net</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">
                      ₹{order.financials?.sellerNetAmount || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit & View Details</span>
              </button>
            </div>
          ))}
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
