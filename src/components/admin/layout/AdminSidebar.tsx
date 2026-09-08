/**
 * Admin Sidebar Navigation Component
 * 
 * Responsive navigation for mobile drawers and desktop sidebar with active indicators and badges.
 */

import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Store,
  Users,
  UserCheck,
  Package,
  ShoppingBag,
  CreditCard,
  Percent,
  Banknote,
  BarChart3,
  HelpCircle,
  History,
  Settings,
  Zap,
  UserPlus,
  BookOpen,
  X,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'onboard'
  | 'markets'
  | 'shops'
  | 'sellers'
  | 'customers'
  | 'master-catalog'
  | 'products'
  | 'orders'
  | 'payments'
  | 'commissions'
  | 'subscriptions'
  | 'settlements'
  | 'reports'
  | 'support'
  | 'audit'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingShopsCount?: number;
  openTicketsCount?: number;
  pendingSettlementsCount?: number;
  activeOrdersCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingShopsCount = 0,
  openTicketsCount = 0,
  pendingSettlementsCount = 0,
  activeOrdersCount = 0,
}) => {
  const navGroups = [
    {
      title: 'DASHBOARD & OPERATIONS',
      items: [
        { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Master Orders', icon: ShoppingBag, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined, badgeColor: 'bg-emerald-500 text-slate-950' },
        { id: 'payments', label: 'Payment Monitor', icon: CreditCard },
      ],
    },
    {
      title: 'MARKETPLACE DIRECTORY',
      items: [
        { id: 'onboard', label: '⚡ Quick Shop Setup', icon: UserPlus, badge: 'New', badgeColor: 'bg-emerald-500 text-slate-950 font-black' },
        { id: 'markets', label: 'Local Markets', icon: MapPin },
        { id: 'shops', label: 'दुकानदार / दुकानें', icon: Store, badge: pendingShopsCount > 0 ? `${pendingShopsCount} New` : undefined, badgeColor: 'bg-amber-500 text-slate-950' },
        { id: 'master-catalog', label: 'Master Catalogue', icon: BookOpen, badge: 'Central', badgeColor: 'bg-indigo-500 text-white font-semibold' },
        { id: 'sellers', label: 'Seller Accounts', icon: Users },
        { id: 'customers', label: 'Customer Directory', icon: UserCheck },
        { id: 'products', label: 'All Shop Products', icon: Package },
      ],
    },
    {
      title: 'FINANCIALS & REVENUE',
      items: [
        { id: 'commissions', label: 'Commission Engine', icon: Percent },
        { id: 'subscriptions', label: 'Subscriptions & Plans', icon: Zap },
        { id: 'settlements', label: 'Seller Settlements', icon: Banknote, badge: pendingSettlementsCount > 0 ? pendingSettlementsCount : undefined, badgeColor: 'bg-indigo-500 text-white' },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'support', label: 'Support & Disputes', icon: HelpCircle, badge: openTicketsCount > 0 ? openTicketsCount : undefined, badgeColor: 'bg-rose-500 text-white' },
        { id: 'audit', label: 'Audit Trail Logs', icon: History },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-600/30">
              LB
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">LOCAL BAZAAR</div>
              <div className="text-[10px] font-extrabold text-indigo-400 tracking-wider uppercase">
                ADMIN CONSOLE
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id as AdminTab);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>v2.4.0 • Enterprise Mandi</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Engine
          </span>
        </div>
      </aside>
    </>
  );
};
