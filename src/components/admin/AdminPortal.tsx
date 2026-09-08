/**
 * Admin Portal Master Orchestrator Component
 * 
 * Orchestrates Admin layout, RBAC security gates, and navigation tabs.
 */

import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext.tsx';
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

const AdminPortalContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [counts, setCounts] = useState({
    pendingShops: 0,
    openTickets: 0,
    pendingSettlements: 0,
    activeOrders: 0,
  });

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
        return 'Platform Governance Overview';
      case 'onboard':
        return '⚡ Quick Shop Onboarding (Field Agent)';
      case 'markets':
        return 'Local Market Territories';
      case 'shops':
        return 'दुकानदार / दुकानें (Shops & Catalog Management)';
      case 'sellers':
        return 'Seller Accounts';
      case 'customers':
        return 'Customer Directory';
      case 'master-catalog':
        return 'Central Master Catalogue (सेंट्रल मास्टर कैटलॉग)';
      case 'products':
        return 'Marketplace Catalog';
      case 'orders':
        return 'Master Orders Monitor';
      case 'payments':
        return 'Payment Transactions';
      case 'commissions':
        return 'Commission Policy';
      case 'subscriptions':
        return 'Subscription Plans & Billing';
      case 'settlements':
        return 'Merchant Settlements';
      case 'reports':
        return 'Financial Reports & Analytics';
      case 'support':
        return 'Support & Disputes';
      case 'audit':
        return 'Audit Logs';
      case 'settings':
        return 'System Settings';
      default:
        return 'Admin Console';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
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
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && <AdminOverviewScreen onNavigate={(t) => setCurrentTab(t)} />}
          {currentTab === 'onboard' && <QuickShopSetup onSuccess={() => setCurrentTab('shops')} />}
          {currentTab === 'markets' && <MarketManagementScreen />}
          {currentTab === 'shops' && <ShopManagementScreen onNavigateToOnboarding={() => setCurrentTab('onboard')} />}
          {currentTab === 'sellers' && <SellerManagementScreen />}
          {currentTab === 'customers' && <CustomerManagementScreen />}
          {currentTab === 'master-catalog' && <MasterCatalogScreen onNavigateToShops={() => setCurrentTab('shops')} />}
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
      </div>
    </div>
  );
};

export const AdminPortal: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminPortalContent />
    </AdminAuthProvider>
  );
};
