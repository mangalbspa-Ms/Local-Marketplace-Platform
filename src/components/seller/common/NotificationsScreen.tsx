/**
 * Seller Notifications Screen (Screen 18)
 * Order alerts, low stock notices, settlement credits, and announcements.
 */

import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Info,
  Clock,
  CheckCheck,
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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER_PAID:
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case NotificationType.ORDER_STATUS_CHANGED:
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case NotificationType.LOW_STOCK_ALERT:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case NotificationType.SETTLEMENT_PROCESSED:
        return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span>{t('notif.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'आर्डर, स्टॉक व भुगतान संबंधी सूचनाएं' : 'Order alerts, stock warnings & payouts'}
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('notif.mark_all_read')}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'कोई नई सूचना नहीं है' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                notif.isRead
                  ? 'bg-slate-900/60 border-slate-800/60 opacity-80'
                  : 'bg-slate-900 border-emerald-500/40 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
