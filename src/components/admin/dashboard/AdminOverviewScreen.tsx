/**
 * Admin Overview / Home Dashboard
 * 
 * High-level marketplace operational and financial KPIs, interactive charts,
 * quick governance actions, and real-time live activity stream.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { AdminPlatformStats, DailySalesChartPoint } from '../../../types/admin.ts';
import {
  Store,
  Users,
  ShoppingBag,
  IndianRupee,
  Percent,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface AdminOverviewScreenProps {
  onNavigate: (tab: any) => void;
}

export const AdminOverviewScreen: React.FC<AdminOverviewScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [chartData, setChartData] = useState<DailySalesChartPoint[]>([]);
  const [timeFilter, setTimeFilter] = useState<'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH'>('TODAY');
  const [isLoading, setIsLoading] = useState(true);

  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, chartsRes] = await Promise.all([
        adminApi.getStats(timeFilter),
        adminApi.getAnalyticsCharts(),
      ]);
      setStats(statsRes);
      setChartData(chartsRes);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [timeFilter]);

  if (isLoading && !stats) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Aggregating platform intelligence...</p>
      </div>
    );
  }

  const kpis = [
    {
      id: 'today-sales',
      label: "Today's Gross Sales",
      value: `₹${stats?.todaySales?.toLocaleString('en-IN') || 0}`,
      subtext: `From ${stats?.todayOrders || 0} orders today`,
      icon: IndianRupee,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      actionTab: 'orders',
    },
    {
      id: 'platform-comm',
      label: 'Platform Commission',
      value: `₹${stats?.totalPlatformCommission?.toLocaleString('en-IN') || 0}`,
      subtext: 'Auto-calculated platform revenue',
      icon: Percent,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30',
      actionTab: 'commissions',
    },
    {
      id: 'pending-settlements',
      label: 'Pending Payouts',
      value: `₹${stats?.pendingSellerSettlements?.toLocaleString('en-IN') || 0}`,
      subtext: 'Merchant settlements awaiting release',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      actionTab: 'settlements',
    },
    {
      id: 'active-shops',
      label: 'Active Mandi Shops',
      value: `${stats?.activeShops || 0} / ${stats?.totalShops || 0}`,
      subtext: `${stats?.pendingShopApprovals || 0} pending review`,
      icon: Store,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/30',
      actionTab: 'shops',
    },
    {
      id: 'active-orders',
      label: 'Live Active Orders',
      value: `${stats?.activeOrders || 0}`,
      subtext: `${stats?.completedOrders || 0} completed successfully`,
      icon: ShoppingBag,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      actionTab: 'orders',
    },
    {
      id: 'total-customers',
      label: 'Registered Customers',
      value: `${stats?.totalCustomers || 0}`,
      subtext: 'Across local micro-markets',
      icon: Users,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/30',
      actionTab: 'customers',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Time Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Live Governance
            </span>
            <span className="text-slate-400 text-xs">• Dadar Mandi Network</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Marketplace Operations Overview
          </h2>
          <p className="text-xs text-slate-400">
            Real-time financial reconciliation, shop fulfillment monitor, and platform health.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: '7_DAYS', label: '7 Days' },
            { id: '30_DAYS', label: '30 Days' },
            { id: 'THIS_MONTH', label: 'Month' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                timeFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              onClick={() => onNavigate(kpi.actionTab)}
              className={`rounded-3xl border p-5 bg-slate-900/90 hover:bg-slate-800/80 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5 group relative overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <h3 className="text-2xl font-black text-white mt-1 group-hover:text-indigo-200 transition">
                    {kpi.value}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{kpi.subtext}</p>
                </div>

                <div className={`p-3 rounded-2xl border ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-indigo-400">
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Quick Governance Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sales & Commission Revenue Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Gross Merchandise Value & Orders Trend</span>
              </h3>
              <p className="text-xs text-slate-400">Daily sales performance across all verified mandi shops</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Gross Sales (₹)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="Commission (₹)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#commGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Priority Action Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Governance Actions</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pending approvals and financial settlement duties requiring administrative action.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('shops')}
                className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                    {stats?.pendingShopApprovals || 0}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300">
                      Shop Verification Queue
                    </div>
                    <div className="text-[10px] text-slate-400">Review documents & credentials</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('master-catalog')}
                className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-indigo-300">
                      Central Master Catalogue
                    </div>
                    <div className="text-[10px] text-slate-400">Manage 260+ standard kirana items</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('settlements')}
                className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    ₹
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-emerald-300">
                      Weekly Payout Batch
                    </div>
                    <div className="text-[10px] text-slate-400">Disburse net merchant earnings</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('support')}
                className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                    !
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-rose-300">
                      Support & Disputes
                    </div>
                    <div className="text-[10px] text-slate-400">Resolve customer/seller queries</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
            <div className="font-bold flex items-center gap-1.5 text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Full Audit Trail Enforced</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Every status toggle, inventory modification, and commission change is immutably logged with admin identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
