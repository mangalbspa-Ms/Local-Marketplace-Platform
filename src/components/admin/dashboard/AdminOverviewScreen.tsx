/**
 * Admin Overview / Home Dashboard
 * 
 * High-level marketplace operational and financial KPIs, interactive charts,
 * quick governance actions, and real-time live activity stream.
 * Mobile-first dark premium dashboard layout matching the reference image.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { AdminPlatformStats, DailySalesChartPoint } from '../../../types/admin.ts';
import { useAdminAuth } from '../../../context/AdminAuthContext.tsx';
import { useAdminPreferences } from '../../../context/AdminPreferencesContext.tsx';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import { AppNotification } from '../../../types/notification.ts';
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
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Sparkles,
  RefreshCw,
  Home,
  Sliders,
  ChevronRight,
  Bell,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AdminOverviewScreenProps {
  onNavigate: (tab: any) => void;
}

export const AdminOverviewScreen: React.FC<AdminOverviewScreenProps> = ({ onNavigate }) => {
  const { user } = useAdminAuth();
  const { language, t } = useAdminPreferences();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [chartData, setChartData] = useState<DailySalesChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [timeFilter, setTimeFilter] = useState<'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH'>('TODAY');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showChart, setShowChart] = useState(true);

  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, chartsRes, notifsRes, ordersRes] = await Promise.all([
        adminApi.getStats(timeFilter),
        adminApi.getAnalyticsCharts(),
        adminApi.getNotifications().catch(() => []),
        adminApi.getOrders().catch(() => []),
      ]);
      setStats(statsRes);
      setChartData(chartsRes);
      setNotifications(notifsRes || []);
      setRecentOrders((ordersRes || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [timeFilter]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadOverviewData();
  };

  if (isLoading && !stats) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Loading marketplace dashboard...</p>
      </div>
    );
  }

  // Exactly 4 Primary KPI Summary Cards in 2x2 Grid
  const primaryKpis = [
    {
      id: 'today-sales',
      label: language === 'hi' ? 'कुल बिक्री' : "Total Sales",
      value: `₹${stats?.todaySales?.toLocaleString('en-IN') || 0}`,
      badge: language === 'hi' ? `${stats?.todayOrders || 0} आज` : `${stats?.todayOrders || 0} today`,
      badgeColor: 'text-emerald-400 bg-emerald-500/15',
      icon: IndianRupee,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      actionTab: 'orders',
    },
    {
      id: 'platform-comm',
      label: language === 'hi' ? 'कमीशन आय' : 'Commission',
      value: `₹${stats?.totalPlatformCommission?.toLocaleString('en-IN') || 0}`,
      badge: language === 'hi' ? 'ऑटो सिंक' : 'Auto Sync',
      badgeColor: 'text-indigo-400 bg-indigo-500/15',
      icon: Percent,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30',
      actionTab: 'commissions',
    },
    {
      id: 'active-shops',
      label: language === 'hi' ? 'सक्रिय दुकानें' : 'Active Shops',
      value: `${stats?.activeShops || 0} / ${stats?.totalShops || 0}`,
      badge: language === 'hi' ? `${stats?.pendingShopApprovals || 0} लंबित` : `${stats?.pendingShopApprovals || 0} pending`,
      badgeColor: 'text-sky-400 bg-sky-500/15',
      icon: Store,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      actionTab: 'shops',
    },
    {
      id: 'active-orders',
      label: language === 'hi' ? 'कुल ऑर्डर्स' : 'Total Orders',
      value: `${stats?.activeOrders || 0}`,
      badge: language === 'hi' ? `${stats?.completedOrders || 0} पूर्ण` : `${stats?.completedOrders || 0} done`,
      badgeColor: 'text-amber-400 bg-amber-500/15',
      icon: ShoppingBag,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      actionTab: 'orders',
    },
  ];

  // Quick Action cards (4 colorful cards in 2x2 grid)
  const quickActions = [
    {
      id: 'verify-shops',
      title: 'Verify Shops',
      badge: `${stats?.pendingShopApprovals || 0} Pending`,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      subtext: 'Review KYC documents',
      icon: Store,
      iconColor: 'text-amber-400',
      cardStyle: 'bg-[#1a1714] border-amber-500/30 hover:border-amber-500/60',
      actionTab: 'shops',
    },
    {
      id: 'master-catalog',
      title: 'Master Catalog',
      badge: '260+ Items',
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      subtext: 'Central Kirana list',
      icon: BookOpen,
      iconColor: 'text-indigo-400',
      cardStyle: 'bg-[#151726] border-indigo-500/30 hover:border-indigo-500/60',
      actionTab: 'master-catalog',
    },
    {
      id: 'settlements',
      title: 'Weekly Payouts',
      badge: `₹${stats?.pendingSellerSettlements?.toLocaleString('en-IN') || 0}`,
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      subtext: 'Merchant settlements',
      icon: IndianRupee,
      iconColor: 'text-emerald-400',
      cardStyle: 'bg-[#12201b] border-emerald-500/30 hover:border-emerald-500/60',
      actionTab: 'settlements',
    },
    {
      id: 'support-disputes',
      title: 'Support & Help',
      badge: 'Active',
      badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      subtext: 'Disputes & queries',
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      cardStyle: 'bg-[#201418] border-rose-500/30 hover:border-rose-500/60',
      actionTab: 'support',
    },
  ];

  return (
    <div className="max-w-md sm:max-w-2xl lg:max-w-6xl mx-auto space-y-3.5 sm:space-y-4 pb-24 lg:pb-8">
      {/* 1. Header Layout & Greeting Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center font-extrabold text-white text-sm shadow-md ring-2 ring-indigo-500/30 shrink-0">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Welcome back,</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {user?.fullName || 'Super Admin'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('orders')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition relative"
              title="Platform Alerts"
            >
              <Bell className="w-4 h-4" />
              {(stats?.pendingShopApprovals || 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Time Filter Pills bar */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Period
          </span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: '7_DAYS', label: '7 Days' },
              { id: '30_DAYS', label: '30 Days' },
              { id: 'THIS_MONTH', label: 'Month' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  timeFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Exactly 4 Compact Summary / Stat Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              onClick={() => onNavigate(kpi.actionTab)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(kpi.actionTab);
                }
              }}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/90 hover:bg-slate-850 hover:border-slate-700/80 p-3.5 transition cursor-pointer shadow-sm group flex flex-col justify-between min-h-[108px]"
            >
              <div className="flex items-center justify-between gap-1">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${kpi.iconBg} ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.badgeColor} truncate`}>
                  {kpi.badge}
                </span>
              </div>

              <div className="my-1.5">
                <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:text-indigo-200 transition truncate">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                  {kpi.label}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 group-hover:text-indigo-400 transition pt-1 border-t border-slate-800/80">
                <span>View Details</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Green Promotional / Guide Banner Placement (Directly below the 4 stat cards) */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 border border-emerald-400/40 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg shadow-emerald-950/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
              Onboard New Kirana Shop
            </h3>
            <p className="text-[11px] text-emerald-100/90 line-clamp-1 mt-0.5">
              Rapid 2-minute shop setup & central master catalog auto-sync.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('onboard')}
          className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-white text-emerald-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shrink-0 shadow-md hover:bg-emerald-50 active:scale-95"
        >
          <span>Onboard Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Quick Actions Section with Compact Colorful Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Actions</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Platform Controls</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.id}
                onClick={() => onNavigate(qa.actionTab)}
                className={`rounded-2xl border p-3.5 text-left transition group flex flex-col justify-between min-h-[96px] ${qa.cardStyle}`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className={`p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/50 ${qa.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate ${qa.badgeStyle}`}>
                    {qa.badge}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-200 transition truncate">
                    {qa.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {qa.subtext}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Activity Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent Activity</span>
          </h3>
          <button
            onClick={() => onNavigate('orders')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>See All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-sm space-y-2">
          {recentOrders.length > 0 ? (
            recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => onNavigate('orders')}
                role="button"
                tabIndex={0}
                className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      Order #{order.id?.slice(-5).toUpperCase() || 'MANDI'} • {order.shopName || 'Shop'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {order.customerName || 'Customer'} • {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div className="text-xs font-extrabold text-white">
                    ₹{order.totalAmount || 0}
                  </div>
                  <OrderStatusBadge
                    status={order.status || 'CONFIRMED'}
                    variant="dark"
                    size="sm"
                    language={language}
                  />
                </div>
              </div>
            ))
          ) : notifications.length > 0 ? (
            notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{n.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{n.message}</div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-xs text-slate-400">
              No recent activity recorded today
            </div>
          )}
        </div>
      </div>

      {/* Analytics Trend AreaChart (Collapsible / Compact preservation) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">Revenue & Orders Performance</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Sales
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Commission
            </span>
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded-md bg-slate-800"
            >
              {showChart ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {showChart && (
          <div className="h-40 sm:h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                    padding: '6px 10px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales (₹)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="Commission (₹)"
                  stroke="#10b981"
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#commGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

