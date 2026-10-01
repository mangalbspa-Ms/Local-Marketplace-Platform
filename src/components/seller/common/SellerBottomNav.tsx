/**
 * Seller Bottom Navigation Bar (Android Mobile-First App Bar)
 */

import React from 'react';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  Boxes,
  IndianRupee,
} from 'lucide-react';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

export type SellerTab =
  | 'home'
  | 'orders'
  | 'packing'
  | 'products'
  | 'profile'
  | 'inventory'
  | 'earnings'
  | 'more';

interface SellerBottomNavProps {
  currentTab: SellerTab;
  onSelectTab: (tab: SellerTab) => void;
  pendingOrdersCount: number;
  preparingOrdersCount?: number;
  lowStockCount?: number;
}

export const SellerBottomNav: React.FC<SellerBottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount,
  preparingOrdersCount = 0,
  lowStockCount = 0,
}) => {
  const { language } = useSellerLanguage();

  const isProductsActive = currentTab === 'products' || currentTab === 'inventory';
  const isEarningsActive = currentTab === 'earnings';

  // EXACT SPECIFICATION ORDER:
  // 1. 🏠 होम  2. 🛍️ ऑर्डर्स  3. 📦 पैकिंग  4. 🧩 प्रोडक्ट्स  5. 💰 कमाई
  const navItems = [
    {
      id: 'home' as SellerTab,
      label: language === 'hi' ? 'होम' : 'Home',
      icon: Home,
      badge: 0,
      badgeColor: '',
      isActive: currentTab === 'home',
    },
    {
      id: 'orders' as SellerTab,
      label: language === 'hi' ? 'ऑर्डर्स' : 'Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount,
      badgeColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] text-white',
      isActive: currentTab === 'orders',
    },
    {
      id: 'packing' as SellerTab,
      label: language === 'hi' ? 'पैकिंग' : 'Packing',
      icon: ClipboardList,
      badge: preparingOrdersCount,
      badgeColor: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.7)] text-slate-950 font-black',
      isActive: currentTab === 'packing',
    },
    {
      id: 'products' as SellerTab,
      label: language === 'hi' ? 'प्रोडक्ट्स' : 'Products',
      icon: Boxes,
      badge: lowStockCount,
      badgeColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] text-slate-950 font-black',
      isActive: isProductsActive,
    },
    {
      id: 'earnings' as SellerTab,
      label: language === 'hi' ? 'कमाई' : 'Earnings',
      icon: IndianRupee,
      badge: 0,
      badgeColor: '',
      isActive: isEarningsActive,
    },
  ];

  return (
    <nav
      id="seller-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#070e24]/90 backdrop-blur-xl border-t border-cyan-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] safe-area-pb"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              id={`seller-nav-tab-${item.id}`}
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active
                      ? 'stroke-[2.4px] text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'stroke-2'
                  }`}
                />
                {item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-slate-950 animate-pulse ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-bold truncate max-w-[56px] transition-colors ${
                  active ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
