/**
 * Customer Bottom Navigation Bar
 * 
 * Fixed Android bottom tab bar with dynamic cart badge and order tracking alerts.
 * Designed with modern light marketplace aesthetics, emerald accents, and crisp typography.
 */

import React from 'react';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { Store, Search, ShoppingBag, Receipt, Mic, User } from 'lucide-react';

export type CustomerTab = 'home' | 'search' | 'voice' | 'cart' | 'orders' | 'profile';

interface CustomerBottomNavProps {
  currentTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  onOpenVoice?: () => void;
  activeOrdersCount?: number;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoice,
  activeOrdersCount = 0,
}) => {
  const { language } = useCustomerLanguage();
  const { itemCount, itemSubtotal, shop: cartShop } = useCustomerCart();

  const tabs: Array<{
    id: CustomerTab;
    labelEn: string;
    labelHi: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    isSpecialVoice?: boolean;
  }> = [
    {
      id: 'home',
      labelEn: 'Home',
      labelHi: 'होम',
      icon: Store,
    },
    {
      id: 'search',
      labelEn: 'Search',
      labelHi: 'खोजें',
      icon: Search,
    },
    {
      id: 'voice',
      labelEn: 'Voice',
      labelHi: 'आवाज़',
      icon: Mic,
      isSpecialVoice: true,
    },
    {
      id: 'orders',
      labelEn: 'Orders',
      labelHi: 'ऑर्डर्स',
      icon: Receipt,
      badgeCount: activeOrdersCount,
    },
    {
      id: 'profile',
      labelEn: 'Profile',
      labelHi: 'प्रोफ़ाइल',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      {/* Floating Sticky Cart Summary Bar above bottom nav when cart has items */}
      {itemCount > 0 && currentTab !== 'cart' && (
        <div className="px-3 pb-2 pointer-events-auto animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => onSelectTab('cart')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs text-white">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black leading-tight text-white">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • ₹{itemSubtotal}
                </div>
                <div className="text-[10px] font-medium text-emerald-100 truncate max-w-[170px]">
                  From {cartShop?.name || 'Local Mandi Shop'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <span>{language === 'hi' ? 'कार्ट देखें' : 'View Cart'}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="bg-white/98 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-lg pointer-events-auto">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;

            if (tab.isSpecialVoice) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (onOpenVoice) {
                      onOpenVoice();
                    } else {
                      onSelectTab('voice');
                    }
                  }}
                  className="relative -top-3.5 flex flex-col items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform ring-4 ring-white">
                    <Mic className="w-5 h-5 text-white stroke-[2.2px]" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 mt-0.5 tracking-tight">
                    {language === 'hi' ? tab.labelHi : tab.labelEn}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-150 ${
                  isActive
                    ? 'text-emerald-700 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-emerald-600' : 'stroke-2 text-slate-400'}`} />
                  {!!tab.badgeCount && tab.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                      {tab.badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">
                  {language === 'hi' ? tab.labelHi : tab.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
