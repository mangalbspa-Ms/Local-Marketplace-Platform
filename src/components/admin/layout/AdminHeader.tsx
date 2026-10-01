/**
 * Admin Top Navigation & Status Bar
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext.tsx';
import { useAdminPreferences } from '../../../context/AdminPreferencesContext.tsx';
import {
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';
import { AppNotification } from '../../../types/notification.ts';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeSectionTitle: string;
  notifications: AppNotification[];
  currentTab?: string;
  onCloseToHome?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onRefresh,
  isRefreshing,
  activeSectionTitle,
  notifications,
  currentTab = 'overview',
  onCloseToHome,
}) => {
  const { user, logout } = useAdminAuth();
  const { language, setLanguage, theme, setTheme, isDarkMode, t } = useAdminPreferences();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showMenu]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifs(false);
    setShowMenu((prev) => !prev);
  };

  const handleToggleNotifs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowNotifs((prev) => !prev);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-md">
      {/* Left: Mobile Menu Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white shrink-0"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black text-white leading-tight truncate">
              {activeSectionTitle}
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block truncate">
              {t('header.subtitle', 'Marketplace Operations & Governance Control')}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, 3-Dot Menu, Admin Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Prominent Close button at the top when viewing any non-Home screen */}
        {currentTab !== 'overview' && onCloseToHome && (
          <button
            onClick={onCloseToHome}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-950/50 transition active:scale-95 shrink-0"
            title="Close and return to Admin Home Page"
            id="admin-header-close-btn"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{t('header.close', 'Close')}</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
          title={t('header.refresh', 'Refresh Data')}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative shrink-0">
          <button
            onClick={handleToggleNotifs}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t('header.alerts', 'System Alerts')}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {t('header.alerts', 'Platform Alerts')} ({unreadCount} new)
                </span>
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {t('header.close', 'Close')}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 py-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{t('header.noAlerts', 'No recent notifications')}</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        n.isRead
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                          : 'bg-indigo-950/30 border-indigo-800/50 text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-white">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin 3-Dot Menu Toggle */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            ref={menuBtnRef}
            type="button"
            onClick={handleToggleMenu}
            className={`p-2 rounded-xl transition ${
              showMenu
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={t('menu.title', 'Admin Preferences (Language & Theme)')}
            id="admin-3dot-menu-button"
            aria-label="Admin Preferences Menu"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* 3-Dot Menu Dropdown */}
          {showMenu && (
            <div
              id="admin-3dot-menu-dropdown"
              className={`absolute right-[-44px] sm:right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl p-3.5 z-50 space-y-3.5 border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700/90 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
              }`}
            >
              {/* Menu Header */}
              <div className={`flex items-center justify-between pb-2 border-b ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="text-xs font-black flex items-center gap-1.5">
                  <Sliders className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                    {t('menu.title', 'Admin Preferences')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMenu(false)}
                  className={`p-1 rounded-md transition ${
                    isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-label="Close menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 1. Language Option: English / हिंदी with compact toggle */}
              <div className="space-y-1.5" id="admin-menu-language-section">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <Languages className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span>{t('menu.language', 'Language')} / भाषा</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-indigo-700'
                  }`}>
                    {language === 'hi' ? 'हिंदी' : 'English'}
                  </span>
                </div>

                {/* Compact Toggle Switch */}
                <div className={`grid grid-cols-2 p-0.5 rounded-xl border text-xs font-bold gap-1 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    id="admin-lang-en-btn"
                    onClick={() => setLanguage('en')}
                    className={`py-1.5 px-2 rounded-lg transition text-center font-bold flex items-center justify-center gap-1 ${
                      language === 'en'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                    }`}
                  >
                    <span>English</span>
                  </button>
                  <button
                    type="button"
                    id="admin-lang-hi-btn"
                    onClick={() => setLanguage('hi')}
                    className={`py-1.5 px-2 rounded-lg transition text-center font-hindi font-bold flex items-center justify-center gap-1 ${
                      language === 'hi'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                    }`}
                  >
                    <span>हिंदी</span>
                  </button>
                </div>
              </div>

              {/* 2. Theme Option: Dark Mode / Light Mode with compact toggle */}
              <div className="space-y-1.5" id="admin-menu-theme-section">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {isDarkMode ? (
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{t('menu.theme', 'Theme')} / थीम</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-indigo-700'
                  }`}>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>

                {/* Compact Toggle Switch */}
                <div className={`grid grid-cols-2 p-0.5 rounded-xl border text-xs font-bold gap-1 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    id="admin-theme-dark-btn"
                    onClick={() => setTheme('dark')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 font-bold ${
                      isDarkMode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('menu.darkMode', 'Dark Mode')}</span>
                  </button>
                  <button
                    type="button"
                    id="admin-theme-light-btn"
                    onClick={() => setTheme('light')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 font-bold ${
                      !isDarkMode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('menu.lightMode', 'Light Mode')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-800">
          <div className="hidden md:block text-right">
            <div className="text-xs font-black text-white">{user?.fullName || 'Super Admin'}</div>
            <div className="text-[10px] text-indigo-400 font-bold">{t('header.role', 'PLATFORM ADMIN')}</div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700/60 transition shrink-0"
            title={t('menu.signOut', 'Sign Out')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

