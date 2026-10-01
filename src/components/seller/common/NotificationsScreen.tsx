/**
 * Seller Notifications Screen (Screen 18)
 * Order alerts, low stock notices, settlement credits, and announcements.
 */

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Info,
  Clock,
  CheckCheck,
  X,
  ArrowLeft,
  Check,
  Package,
} from 'lucide-react';
import { AppNotification, NotificationType } from '../../../types/notification.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const { language, t } = useSellerLanguage();
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
      case NotificationType.NEW_ORDER_PAID:
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.ORDER_ACCEPTED:
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case NotificationType.ORDER_CANCELLED:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case NotificationType.LOW_STOCK:
      case NotificationType.LOW_STOCK_ALERT:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case NotificationType.SETTLEMENT_PROCESSED:
      case NotificationType.SETTLEMENT_UPDATE:
      case NotificationType.PAYMENT_UPDATE:
        return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-purple-400" />;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
      case NotificationType.NEW_ORDER_PAID:
        return language === 'hi' ? 'नया आर्डर' : 'New Order';
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.ORDER_ACCEPTED:
        return language === 'hi' ? 'आर्डर स्थिति' : 'Order Status';
      case NotificationType.ORDER_CANCELLED:
        return language === 'hi' ? 'आर्डर रद्द' : 'Order Cancelled';
      case NotificationType.LOW_STOCK:
      case NotificationType.LOW_STOCK_ALERT:
        return language === 'hi' ? 'स्टॉक चेतावनी' : 'Low Stock';
      case NotificationType.SETTLEMENT_PROCESSED:
      case NotificationType.SETTLEMENT_UPDATE:
      case NotificationType.PAYMENT_UPDATE:
        return language === 'hi' ? 'भुगतान / सेटलमेंट' : 'Payout Update';
      case NotificationType.ADMIN_ANNOUNCEMENT:
        return language === 'hi' ? 'मंडी घोषणा' : 'Announcement';
      default:
        return language === 'hi' ? 'सूचना' : 'Notification';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-100">
      {/* Detail View Mode */}
      {selectedNotif ? (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-150">
          {/* Detail Header with ✕ Close in Top-Right */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <button
                type="button"
                id="btn-back-to-notifications-list"
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer shrink-0"
                title="वापस जाएं"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h2 className="font-bold text-sm sm:text-base text-white truncate">
                  {language === 'hi' ? 'सूचना का विवरण' : 'Notification Detail'}
                </h2>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  {new Date(selectedNotif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                  {new Date(selectedNotif.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* ✕ Close Button at Top-Right of Notification Detail */}
            <button
              type="button"
              id="btn-close-notification-detail"
              onClick={() => setSelectedNotif(null)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer shrink-0 ml-2"
              title="विवरण बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Detail Body (Smooth scrolling, complete content) */}
          <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto overscroll-contain flex-1">
            {/* Type and Status Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
                {getNotificationIcon(selectedNotif.type)}
                <span>{getNotificationTypeLabel(selectedNotif.type)}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <Check className="w-3 h-3" />
                <span>{language === 'hi' ? 'सत्यापित सूचना' : 'Verified'}</span>
              </span>
            </div>

            {/* Main Info Card */}
            <div className="p-4 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2.5 shadow-md">
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-snug break-words">
                {selectedNotif.title}
              </h3>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  {new Date(selectedNotif.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-line">
                  {selectedNotif.message}
                </p>
              </div>
            </div>

            {/* Additional Details (Order ID, Product ID, Amount) */}
            {(selectedNotif.orderId || typeof selectedNotif.amount === 'number' || selectedNotif.productId) && (
              <div className="p-3.5 rounded-2xl bg-[#070e24] border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">
                  {language === 'hi' ? 'अतिरिक्त विवरण' : 'Additional Details'}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedNotif.orderId && (
                    <div className="px-3 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/30 text-blue-300 font-mono font-bold flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>ऑर्डर ID: #{selectedNotif.orderId}</span>
                    </div>
                  )}
                  {typeof selectedNotif.amount === 'number' && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-mono font-bold flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>राशि: ₹{selectedNotif.amount}</span>
                    </div>
                  )}
                  {selectedNotif.productId && (
                    <div className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-300 font-mono font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>उत्पाद ID: {selectedNotif.productId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Back to all notifications link */}
            <div className="pt-1">
              <button
                type="button"
                id="btn-back-to-notifications-bottom"
                onClick={() => setSelectedNotif(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'वापस सभी सूचनाओं पर जाएं' : 'Back to all notifications'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Notifications List Mode */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Header with ✕ Close to the right of “सूचनाएं” */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight truncate">
                  {t('notif.title')}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  {language === 'hi' ? 'आर्डर, स्टॉक व भुगतान संबंधी सूचनाएं' : 'Order alerts, stock warnings & payouts'}
                </p>
              </div>
            </div>

            {/* Right side: Mark all read + ✕ Close */}
            <div className="flex items-center space-x-2 shrink-0 ml-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  type="button"
                  id="btn-mark-all-read"
                  onClick={onMarkAllAsRead}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-emerald-400 transition-colors cursor-pointer"
                  title={t('notif.mark_all_read')}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">{t('notif.mark_all_read')}</span>
                </button>
              )}

              {/* ✕ Close button to the right of “सूचनाएं” heading */}
              <button
                type="button"
                id="btn-close-notifications-top"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                title="सूचनाएं बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List Body */}
          <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 text-xs overflow-y-auto overscroll-contain flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {language === 'hi' ? 'कोई नई सूचना नहीं है' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  id={`notification-item-${notif.id}`}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    setSelectedNotif(notif);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 active:scale-[0.99] ${
                    notif.isRead
                      ? 'bg-[#070e24]/70 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-700'
                      : 'bg-[#070e24] border-emerald-500/40 shadow-sm hover:border-emerald-500/70'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 break-words">
                      {notif.message}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400/90 font-medium hover:underline">
                        {language === 'hi' ? 'पूरा विवरण देखें →' : 'View full detail →'}
                      </span>
                      {!notif.isRead && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{language === 'hi' ? 'नई' : 'New'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
