/**
 * Seller Bottom Navigation Bar (Android Mobile-First App Bar)
 */

import React from 'react';
import {
  Home,
  ShoppingBag,
  CheckSquare,
  Package,
  IndianRupee,
  Store,
} from 'lucide-react';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

export type SellerTab = 'home' | 'orders' | 'packing' | 'products' | 'earnings' | 'more';

interface SellerBottomNavProps {
  currentTab: SellerTab;
  onSelectTab: (tab: SellerTab) => void;
  pendingOrdersCount: number;
  preparingOrdersCount: number;
}

export const SellerBottomNav: React.FC<SellerBottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount,
  preparingOrdersCount,
}) => {
  const { t } = useSellerLanguage();

  const navItems = [
    {
      id: 'home' as SellerTab,
      label: t('nav.home', 'Home'),
      icon: Home,
      badge: 0,
    },
    {
      id: 'orders' as SellerTab,
      label: t('nav.orders', 'Orders'),
      icon: ShoppingBag,
      badge: pendingOrdersCount,
    },
    {
      id: 'packing' as SellerTab,
      label: t('nav.packing', 'Packing'),
      icon: CheckSquare,
      badge: preparingOrdersCount,
    },
    {
      id: 'products' as SellerTab,
      label: t('nav.products', 'Products'),
      icon: Package,
      badge: 0,
    },
    {
      id: 'earnings' as SellerTab,
      label: t('nav.earnings', 'Earnings'),
      icon: IndianRupee,
      badge: 0,
    },
    {
      id: 'more' as SellerTab,
      label: t('nav.more', 'Shop'),
      icon: Store,
      badge: 0,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md safe-area-pb">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-black scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[54px]">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
