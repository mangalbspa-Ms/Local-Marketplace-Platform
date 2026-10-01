/**
 * Admin Portal Master Orchestrator Component
 * 
 * Orchestrates Admin layout, RBAC security gates, and navigation tabs.
 */

import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext.tsx';
import { AdminPreferencesProvider, useAdminPreferences } from '../../context/AdminPreferencesContext.tsx';
import { AdminLoginScreen } from './auth/AdminLoginScreen.tsx';
import { AdminHeader } from './layout/AdminHeader.tsx';
import { AdminSidebar, AdminTab } from './layout/AdminSidebar.tsx';
import { AdminOverviewScreen } from './dashboard/AdminOverviewScreen.tsx';
import { MarketManagementScreen } from './markets/MarketManagementScreen.tsx';
import { ShopManagementScreen } from './shops/ShopManagementScreen.tsx';
import { SellerManagementScreen } from './sellers/SellerManagementScreen.tsx';
import { CustomerManagementScreen } from './customers/CustomerManagementScreen.tsx';
import { ProductManagementScreen } from './products/ProductManagementScreen.tsx';
import { MasterCatalogScreen } from './master-catalog/MasterCatalogScreen.tsx';
import { MasterOrdersScreen } from './orders/MasterOrdersScreen.tsx';
import { PaymentMonitorScreen } from './payments/PaymentMonitorScreen.tsx';
import { CommissionManagementScreen } from './commissions/CommissionManagementScreen.tsx';
import { SubscriptionBillingScreen } from './subscriptions/SubscriptionBillingScreen.tsx';
import { SettlementManagementScreen } from './settlements/SettlementManagementScreen.tsx';
import { ReportsAnalyticsScreen } from './reports/ReportsAnalyticsScreen.tsx';
import { SupportTicketsScreen } from './support/SupportTicketsScreen.tsx';
import { AuditLogsScreen } from './audit/AuditLogsScreen.tsx';
import { SystemSettingsScreen } from './settings/SystemSettingsScreen.tsx';
import { QuickShopSetup } from './onboarding/QuickShopSetup.tsx';
import { adminApi } from '../../services/adminApi.ts';
import { AppNotification } from '../../types/notification.ts';
import {
  Home,
  Store,
  ShoppingBag,
  IndianRupee,
  Sliders,
  X,
  ArrowLeft,
} from 'lucide-react';

const AdminPortalContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { language, theme, isDarkMode, t } = useAdminPreferences();
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    try {
      const saved = localStorage.getItem('admin_current_tab');
      if (saved) return saved as AdminTab;
    } catch {}
    return 'overview';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [counts, setCounts] = useState({
    pendingShops: 0,
    openTickets: 0,
    pendingSettlements: 0,
    activeOrders: 0,
  });

  const navigateToTab = (tab: AdminTab) => {
    if (tab !== currentTab) {
      window.history.pushState({ adminTab: tab }, '', window.location.href);
      setCurrentTab(tab);
      try {
        localStorage.setItem('admin_current_tab', tab);
      } catch {}
    }
  };

  const handleCloseToHome = () => {
    setCurrentTab('overview');
    try {
      localStorage.setItem('admin_current_tab', 'overview');
    } catch {}
    window.history.replaceState({ adminTab: 'overview' }, '', window.location.href);
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.adminTab) {
        setCurrentTab(event.state.adminTab);
        try {
          localStorage.setItem('admin_current_tab', event.state.adminTab);
        } catch {}
      } else {
        setCurrentTab('overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadBadgeCounts = async () => {
    try {
      const stats = await adminApi.getStats();
      const notifs = await adminApi.getNotifications();
      setNotifications(notifs);
      setCounts({
        pendingShops: stats.pendingShopApprovals || 0,
        openTickets: stats.activeOrders || 0,
        pendingSettlements: stats.pendingSellerSettlements ? 1 : 0,
        activeOrders: stats.activeOrders || 0,
      });
    } catch (err) {
      // Ignore background badge error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBadgeCounts();
    }
  }, [isAuthenticated, currentTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBadgeCounts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
          Verifying Platform Governance Permissions...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginScreen />;
  }

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'overview':
        return t('nav.overview', 'Platform Governance Overview');
      case 'onboard':
        return language === 'hi' ? '⚡ त्वरित दुकान सेटअप (फील्ड एजेंट)' : '⚡ Quick Shop Onboarding (Field Agent)';
      case 'markets':
        return t('nav.markets', 'Local Market Territories');
      case 'shops':
        return language === 'hi' ? 'दुकानें एवं कैटलॉग प्रबंधन' : 'दुकानदार / दुकानें (Shops & Catalog Management)';
      case 'sellers':
        return t('nav.sellers', 'Seller Accounts');
      case 'customers':
        return t('nav.customers', 'Customer Directory');
      case 'master-catalog':
        return language === 'hi' ? 'सेंट्रल मास्टर कैटलॉग' : 'Central Master Catalogue (सेंट्रल मास्टर कैटलॉग)';
      case 'products':
        return t('nav.products', 'Marketplace Catalog');
      case 'orders':
        return t('nav.orders', 'Master Orders Monitor');
      case 'payments':
        return t('nav.payments', 'Payment Transactions');
      case 'commissions':
        return t('nav.commissions', 'Commission Policy');
      case 'subscriptions':
        return t('nav.subscriptions', 'Subscription Plans & Billing');
      case 'settlements':
        return t('nav.settlements', 'Merchant Settlements');
      case 'reports':
        return t('nav.reports', 'Financial Reports & Analytics');
      case 'support':
        return t('nav.support', 'Support & Disputes');
      case 'audit':
        return t('nav.audit', 'Audit Logs');
      case 'settings':
        return t('nav.settings', 'System Settings');
      default:
        return 'Admin Console';
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} admin-theme-${theme}`}>
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => navigateToTab(tab)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pendingShopsCount={counts.pendingShops}
        openTicketsCount={counts.openTickets}
        pendingSettlementsCount={counts.pendingSettlements}
        activeOrdersCount={counts.activeOrders}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          activeSectionTitle={getSectionTitle()}
          notifications={notifications}
          currentTab={currentTab}
          onCloseToHome={handleCloseToHome}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {/* Top Panel Sticky Close Bar when viewing any screen opened from Home */}
          {currentTab !== 'overview' && (
            <div className="sticky top-14 sm:top-16 z-30 mb-3.5 sm:mb-5 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 sm:p-3.5 px-3.5 sm:px-5 flex items-center justify-between shadow-xl ring-1 ring-white/5">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <button
                  onClick={handleCloseToHome}
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold shrink-0 active:scale-95"
                  title="Return to Admin Home"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('header.returnHome', 'Admin Home')}</span>
                </button>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    <span className="truncate">{getSectionTitle()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {t('header.returnHomeTip', 'Tap Close to return to Admin Home Page')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseToHome}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-950/40 transition active:scale-95 shrink-0"
                id="admin-panel-top-close-btn"
                title="Close and return to Admin Home Page"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>{t('header.close', 'Close')}</span>
              </button>
            </div>
          )}

          {currentTab === 'overview' && <AdminOverviewScreen onNavigate={(t) => navigateToTab(t)} />}
          {currentTab === 'onboard' && <QuickShopSetup onSuccess={() => navigateToTab('shops')} />}
          {currentTab === 'markets' && <MarketManagementScreen />}
          {currentTab === 'shops' && <ShopManagementScreen onNavigateToOnboarding={() => navigateToTab('onboard')} />}
          {currentTab === 'sellers' && <SellerManagementScreen />}
          {currentTab === 'customers' && <CustomerManagementScreen />}
          {currentTab === 'master-catalog' && <MasterCatalogScreen onNavigateToShops={() => navigateToTab('shops')} />}
          {currentTab === 'products' && <ProductManagementScreen />}
          {currentTab === 'orders' && <MasterOrdersScreen />}
          {currentTab === 'payments' && <PaymentMonitorScreen />}
          {currentTab === 'commissions' && <CommissionManagementScreen />}
          {currentTab === 'subscriptions' && <SubscriptionBillingScreen />}
          {currentTab === 'settlements' && <SettlementManagementScreen />}
          {currentTab === 'reports' && <ReportsAnalyticsScreen />}
          {currentTab === 'support' && <SupportTicketsScreen />}
          {currentTab === 'audit' && <AuditLogsScreen />}
          {currentTab === 'settings' && <SystemSettingsScreen />}
        </main>

        {/* Mobile Bottom Navigation Bar (Always present and functional) */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around shadow-2xl"
        >
          <button
            onClick={() => navigateToTab('overview')}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition active:scale-95 ${
              currentTab === 'overview' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">{t('nav.home', 'Home')}</span>
            {currentTab === 'overview' && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
          </button>

          <button
            onClick={() => navigateToTab('shops')}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition active:scale-95 relative ${
              currentTab === 'shops' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t('nav.shops', 'Shops')}</span>
            {counts.pendingShops > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
            )}
            {currentTab === 'shops' && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
          </button>

          <button
            onClick={() => navigateToTab('orders')}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition active:scale-95 relative ${
              currentTab === 'orders' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t('nav.orders', 'Orders')}</span>
            {counts.activeOrders > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-slate-900" />
            )}
            {currentTab === 'orders' && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
          </button>

          <button
            onClick={() => navigateToTab('settlements')}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition active:scale-95 ${
              currentTab === 'settlements' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t('nav.settlements', 'Payouts')}</span>
            {currentTab === 'settlements' && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
          </button>

          <button
            onClick={() => navigateToTab('settings')}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] transition active:scale-95 ${
              currentTab === 'settings' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t('nav.settings', 'Settings')}</span>
            {currentTab === 'settings' && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
          </button>
        </nav>
      </div>
    </div>
  );
};

export const AdminPortal: React.FC = () => {
  return (
    <AdminPreferencesProvider>
      <AdminAuthProvider>
        <AdminPortalContent />
      </AdminAuthProvider>
    </AdminPreferencesProvider>
  );
};

