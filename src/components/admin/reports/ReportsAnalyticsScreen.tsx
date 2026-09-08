/**
 * Reports & Deep Marketplace Analytics Screen
 * 
 * Aggregates platform take-rate commission revenue, shop ranking performance,
 * order volume analytics, and micro-market share.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { ShopPerformanceReport, CommissionReportSummary } from '../../../types/admin.ts';
import {
  BarChart3,
  TrendingUp,
  Store,
  MapPin,
  IndianRupee,
  ShoppingBag,
  Percent,
  Award,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const ReportsAnalyticsScreen: React.FC = () => {
  const [commSummary, setCommSummary] = useState<any | null>(null);
  const [shopPerformances, setShopPerformances] = useState<ShopPerformanceReport[]>([]);
  const [orderAnalytics, setOrderAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [commData, perfData, orderData] = await Promise.all([
        adminApi.getCommissionReports(),
        adminApi.getShopPerformance(),
        adminApi.getOrderAnalytics(),
      ]);
      setCommSummary(commData);
      setShopPerformances(perfData);
      setOrderAnalytics(orderData);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Marketplace Intelligence & Financial Reports</span>
          </h2>
          <p className="text-xs text-slate-400">
            Platform revenue trends, merchant GMV rankings, and localized micro-market volume distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Gross Platform GMV</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2 font-mono">
            ₹{commSummary?.totalGrossSales?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Across all verified merchant orders</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Commission Earned</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-400 mt-2 font-mono">
            ₹{commSummary?.totalCommissionEarned?.toLocaleString('en-IN') || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Effective take-rate: {commSummary?.effectivePlatformTakeRate || 5}%
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Average Ticket Size</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-400 mt-2 font-mono">
            ₹{orderAnalytics?.averageOrderValue || 0}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            From {orderAnalytics?.totalOrders || 0} customer orders
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Shops Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Merchant Gross GMV (₹)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Leaderboard</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shopPerformances.slice(0, 5)}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shopName"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(name) => (name.length > 12 ? name.substring(0, 10) + '...' : name)}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="totalGrossSales" name="Gross Sales (₹)" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Fulfillment Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Fulfillment & Category Share</span>
            </h3>
            <span className="text-[11px] text-slate-400">Distribution</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-xs font-bold text-slate-400">Home Delivery</div>
              <div className="text-xl font-black text-white mt-1">
                {orderAnalytics?.fulfillmentBreakdown?.homeDelivery || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Orders delivered to doorstep</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-xs font-bold text-slate-400">Store Pickup</div>
              <div className="text-xl font-black text-white mt-1">
                {orderAnalytics?.fulfillmentBreakdown?.storePickup || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Direct counter collection</p>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span>Completed Orders</span>
              <span className="font-bold text-emerald-400">
                {orderAnalytics?.statusBreakdown?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Cancelled / Rejected Orders</span>
              <span className="font-bold text-rose-400">
                {orderAnalytics?.statusBreakdown?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Performance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Store className="w-4 h-4 text-indigo-400" />
          <span>Shop Performance Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Shop Name</th>
                <th className="pb-3">Market Territory</th>
                <th className="pb-3 text-center">Total Orders</th>
                <th className="pb-3 text-right">Gross GMV</th>
                <th className="pb-3 text-right">Commission</th>
                <th className="pb-3 text-right">Merchant Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shopPerformances.map((perf) => (
                <tr key={perf.shopId} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-bold text-white font-sans">{perf.shopName}</td>
                  <td className="py-3 text-slate-400 font-sans">{perf.marketName}</td>
                  <td className="py-3 text-center text-slate-300">{perf.totalOrders}</td>
                  <td className="py-3 text-right font-black text-white">₹{perf.totalGrossSales}</td>
                  <td className="py-3 text-right font-bold text-indigo-400">
                    ₹{perf.platformCommissionEarned}
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-400">
                    ₹{perf.netSellerDisbursements}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
