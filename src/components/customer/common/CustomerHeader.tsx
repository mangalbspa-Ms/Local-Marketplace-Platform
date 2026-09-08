/**
 * Customer Header Component
 * 
 * Android app bar with active delivery location, local market selector,
 * customer account switcher, language toggle, and notifications badge.
 * Designed with modern light marketplace aesthetics, emerald accents, and crisp typography.
 */

import React, { useState } from 'react';
import { useCustomerAuth, DEMO_CUSTOMERS } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import {
  MapPin,
  Store,
  ChevronDown,
  Globe,
  Bell,
  User,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

interface CustomerHeaderProps {
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenAddressModal: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  unreadNotifsCount,
  onOpenNotifications,
  onOpenAddressModal,
}) => {
  const { user, selectedAddress, switchCustomer } = useCustomerAuth();
  const { markets, currentMarket, setCurrentMarket } = useCustomerMarket();
  const { language, setLanguage, t } = useCustomerLanguage();

  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 px-4 py-3 shadow-xs">
      {/* Top row: Market Selection & Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Market Badge & Dropdown */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all text-left max-w-full shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold truncate">
              {currentMarket?.name || 'Dadar Central Mandi'}
            </span>
            <ChevronDown className="w-3 h-3 text-emerald-600 shrink-0" />
          </button>

          {/* Market Dropdown Menu */}
          {isMarketDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[11px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider">
                {t('selectMarket')}
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {markets.map((m) => {
                  const isSelected = m.id === currentMarket?.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentMarket(m);
                        setIsMarketDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate flex items-center justify-between">
                          <span>{m.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{m.area}, {m.city}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side controls: Language, Notifications, Account Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 text-xs font-bold transition-all shadow-2xs"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 transition-all shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
              className="flex items-center gap-1 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs"
              title="Switch Demo Customer"
            >
              <User className="w-4 h-4 text-emerald-600" />
            </button>

            {isUserSwitcherOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('switchAccount')}</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="space-y-1 mt-1">
                  {DEMO_CUSTOMERS.map((cust) => {
                    const isSelected = cust.id === user?.id;
                    return (
                      <button
                        key={cust.id}
                        onClick={() => {
                          switchCustomer(cust.id);
                          setIsUserSwitcherOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold">{cust.fullName}</div>
                          <div className="text-[10px] text-slate-500">{cust.phone}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Active Delivery Address Bar */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onOpenAddressModal}
          className="flex items-center gap-2 text-left group overflow-hidden"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
              <span>{t('deliveringTo')}</span>
              <span className="font-bold text-slate-800">
                {selectedAddress?.label || 'Home'}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
              {selectedAddress?.streetAddress || 'Gokhale Road, Dadar West'}
            </div>
          </div>
        </button>

        <button
          onClick={onOpenAddressModal}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 ml-2 transition-colors"
        >
          {t('changeAddress')}
        </button>
      </div>
    </header>
  );
};
