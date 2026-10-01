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
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Marketplace Intelligence & Analytics</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live Metrics
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Platform revenue trends, merchant GMV rankings, and micro-market volume distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Platform GMV</p>
            <h3 className="text-lg font-black text-white mt-0.5 font-mono">
              ₹{commSummary?.totalGrossSales?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[10px] text-slate-500">All verified merchant orders</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Commission Earned</p>
            <h3 className="text-lg font-black text-indigo-400 mt-0.5 font-mono">
              ₹{commSummary?.totalCommissionEarned?.toLocaleString('en-IN') || 0}
            </h3>
            <p className="text-[10px] text-indigo-400/70">
              Take-rate: {commSummary?.effectivePlatformTakeRate || 5}%
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Avg Ticket Size</p>
            <h3 className="text-lg font-black text-purple-400 mt-0.5 font-mono">
              ₹{orderAnalytics?.averageOrderValue || 0}
            </h3>
            <p className="text-[10px] text-purple-400/70">
              {orderAnalytics?.totalOrders || 0} customer orders
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Performing Shops Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white">Top Merchant Gross GMV (₹)</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Leaderboard</span>
          </div>

          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shopPerformances.slice(0, 5)}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shopName"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(name) => (name.length > 10 ? name.substring(0, 8) + '..' : name)}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="totalGrossSales" name="Gross Sales (₹)" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Fulfillment Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white">Fulfillment & Status Share</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Distribution</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Home Delivery</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {orderAnalytics?.fulfillmentBreakdown?.homeDelivery || 0}
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">Doorstep orders</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Store Pickup</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {orderAnalytics?.fulfillmentBreakdown?.storePickup || 0}
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">Counter collections</p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-1.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span>Completed Orders</span>
              <span className="font-bold text-emerald-400">
                {orderAnalytics?.statusBreakdown?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300 text-[11px]">
              <span>Cancelled / Rejected Orders</span>
              <span className="font-bold text-rose-400">
                {orderAnalytics?.statusBreakdown?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Performance Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <Store className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-black text-white">Shop Performance Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-2">Shop Name</th>
                <th className="pb-2">Market Territory</th>
                <th className="pb-2 text-center">Orders</th>
                <th className="pb-2 text-right">Gross GMV</th>
                <th className="pb-2 text-right">Commission</th>
                <th className="pb-2 text-right">Merchant Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shopPerformances.map((perf) => (
                <tr key={perf.shopId} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-white font-sans text-xs">{perf.shopName}</td>
                  <td className="py-2.5 text-slate-400 font-sans text-[11px]">{perf.marketName}</td>
                  <td className="py-2.5 text-center text-slate-300 text-xs">{perf.totalOrders}</td>
                  <td className="py-2.5 text-right font-black text-white text-xs">₹{perf.totalGrossSales}</td>
                  <td className="py-2.5 text-right font-bold text-indigo-400 text-xs">
                    ₹{perf.platformCommissionEarned}
                  </td>
                  <td className="py-2.5 text-right font-bold text-emerald-400 text-xs">
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
