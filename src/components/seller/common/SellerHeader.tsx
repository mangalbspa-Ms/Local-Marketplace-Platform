/**
 * Seller Header Component (Android-style Top App Bar)
 */

import React, { useState } from 'react';
import {
  Store,
  Bell,
  Languages,
  Power,
  ChevronDown,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useSellerAuth, DEMO_SELLERS } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { AppNotification } from '../../../types/notification.ts';

interface SellerHeaderProps {
  onOpenNotifications: () => void;
  onOpenShopStatus: () => void;
  unreadNotifsCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const SellerHeader: React.FC<SellerHeaderProps> = ({
  onOpenNotifications,
  onOpenShopStatus,
  unreadNotifsCount,
  onRefresh,
  isRefreshing,
}) => {
  const { user, shop, toggleShopStatus, loginAsDemoSeller, logout } = useSellerAuth();
  const { language, setLanguage, t } = useSellerLanguage();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  if (!shop || !user) return null;

  return (
    <header className="bg-white text-slate-900 sticky top-0 z-30 shadow-xs border-b border-slate-200">
      {/* Top Status Bar Mimic */}
      <div className="px-4 py-1 flex items-center justify-between text-[11px] font-medium text-slate-500 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center space-x-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-700">Online</span>
          <span className="text-slate-300">•</span>
          <span>Dadar Market Hub</span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-slate-500">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Top App Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Shop Info & Switcher */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 font-bold">
              <Store className="w-4 h-4" />
            </div>
            <button
              onClick={onOpenShopStatus}
              title={shop.isOpen ? 'Shop is Open (Tap to toggle)' : 'Shop is Closed (Tap to open)'}
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center transition-transform hover:scale-125 ${
                shop.isOpen ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="text-left min-w-0">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center space-x-1 text-sm font-black text-slate-900 tracking-tight hover:text-emerald-700 transition-colors truncate"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{shop.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Compact Power Status Pill */}
              <button
                onClick={onOpenShopStatus}
                title={shop.isOpen ? 'दुकान खुली है (Tap to manage)' : 'दुकान बंद है (Tap to open)'}
                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 cursor-pointer transition-all ${
                  shop.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{shop.isOpen ? (language === 'hi' ? 'खुली' : 'OPEN') : (language === 'hi' ? 'बंद' : 'CLOSED')}</span>
              </button>
            </div>

            <div className="flex items-center text-[11px] text-slate-500 space-x-1 font-medium truncate">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{shop.marketName || 'Dadar Central Market'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 border border-emerald-200 transition-colors"
            title="Change Language / भाषा बदलें"
          >
            <Languages className="w-3 h-3" />
            <span>{language === 'hi' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Demo Switcher & Account Dropdown Modal */}
      {showAccountDropdown && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
          onClick={() => setShowAccountDropdown(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-4 w-full max-w-sm text-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">विक्रेता खाता (Seller Account)</h3>
                <p className="text-xs text-slate-500">Shop Isolation Active: Only your shop data is shown</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                PRO SELLER
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Demo Shop (Testing)</p>
              {DEMO_SELLERS.map((s) => {
                const isCurrent = user.id === s.userId;
                return (
                  <button
                    key={s.userId}
                    onClick={() => {
                      loginAsDemoSeller(s.userId);
                      setShowAccountDropdown(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{s.shopName}</div>
                      <div className="text-xs text-slate-500">{s.name} • {s.phone}</div>
                    </div>
                    {isCurrent && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  logout();
                  setShowAccountDropdown(false);
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                <Power className="w-3.5 h-3.5" />
                <span>लॉगआउट करें (Logout)</span>
              </button>
              <button
                onClick={() => setShowAccountDropdown(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
