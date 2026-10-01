/**
 * Customer Notifications Modal
 * 
 * Displays order status alerts, price drop updates, and local mandi announcements.
 */

import React, { useEffect, useState } from 'react';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerAuth } from '../../../context/CustomerAuthContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { AppNotification, NotificationType } from '../../../types/notification.ts';
import { Bell, CheckCircle2, Package, Sparkles, Tag, ShieldAlert, Store, Bike, MapPin } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useCustomerLanguage();
  const { user } = useCustomerAuth();
  const [serverNotifications, setServerNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    customerApi.getNotifications()
      .then((data) => {
        if (isMounted) {
          // Filter to ensure only this customer's notifications are shown
          const filtered = (data || []).filter((n) => !user?.id || n.recipientUserId === user.id);
          setServerNotifications(filtered);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch customer notifications:', err);
      });

    // Mark notifications as read
    customerApi.markAllNotificationsAsRead().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Static fallback mandi announcements
  const fallbackAnnouncements = [
    {
      id: 'n1',
      titleEn: 'Fresh Harvest Arrived at Mandi',
      titleHi: 'मंडी में ताजी सब्जियां व फल पहुंचे',
      descEn: 'Ramesh Patel Farm Fresh Vegetables added fresh Palak, Methi, and organic Tomatoes today.',
      descHi: 'रमेश पटेल फार्म फ्रेश ने आज ताजी पालक, मेथी और टमाटर जोड़े हैं।',
      time: language === 'hi' ? '10 मिनट पहले' : '10 mins ago',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/20',
    },
    {
      id: 'n2',
      titleEn: 'Pickup PIN Reminder',
      titleHi: 'पिकअप पिन सुरक्षा सूचना',
      descEn: 'Keep your 4-digit PIN ready when collecting your order at the counter.',
      descHi: 'काउंटर से सामान लेते समय अपना ४-अंकों का पिन दुकानदार को दिखाएं।',
      time: language === 'hi' ? '1 घंटा पहले' : '1 hour ago',
      icon: Package,
      color: 'text-amber-400 bg-amber-500/20',
    },
    {
      id: 'n3',
      titleEn: 'Transparent Pricing Guarantee',
      titleHi: 'पारदर्शी मूल्य आश्वासन',
      descEn: 'All shop prices in this Mandi are verified directly by our pricing engine with zero hidden costs.',
      descHi: 'मंडी के सभी उत्पाद सही तौल और प्रामाणिक दरों पर उपलब्ध हैं।',
      time: language === 'hi' ? 'कल' : 'Yesterday',
      icon: Tag,
      color: 'text-sky-400 bg-sky-500/20',
    },
  ];

  // Helper to get icon & badge color for customer notification
  const getStyleForNotif = (notif: AppNotification) => {
    const text = `${notif.title} ${notif.titleHi || ''} ${notif.message || ''}`.toLowerCase();

    if (text.includes('पहुंच गया') || text.includes('arrived')) {
      return { icon: MapPin, color: 'text-purple-400 bg-purple-500/20' };
    }
    if (text.includes('डिलीवरी के लिए') || text.includes('out for delivery') || text.includes('delivery')) {
      return { icon: Bike, color: 'text-indigo-400 bg-indigo-500/20' };
    }
    if (text.includes('पिकअप के लिए') || text.includes('ready for pickup') || text.includes('pickup')) {
      return { icon: Store, color: 'text-emerald-400 bg-emerald-500/20' };
    }
    if (text.includes('सामान तैयार') || text.includes('पैक') || text.includes('preparing') || text.includes('packing')) {
      return { icon: Package, color: 'text-amber-400 bg-amber-500/20' };
    }
    if (notif.type === NotificationType.PAYMENT_UPDATE || text.includes('भुगतान') || text.includes('payment')) {
      return { icon: Sparkles, color: 'text-teal-400 bg-teal-500/20' };
    }
    if (text.includes('स्वीकार') || text.includes('accepted') || text.includes('पूर्ण') || text.includes('completed')) {
      return { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/20' };
    }
    if (notif.type === NotificationType.ORDER_CANCELLED || text.includes('रद्द') || text.includes('cancelled')) {
      return { icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/20' };
    }
    if (text.includes('भेजा गया') || text.includes('sent') || notif.orderId) {
      return { icon: Package, color: 'text-sky-400 bg-sky-500/20' };
    }
    return { icon: Tag, color: 'text-sky-400 bg-sky-500/20' };
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return language === 'hi' ? 'अभी' : 'Just now';
    try {
      const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return language === 'hi' ? 'अभी' : 'Just now';
      if (mins < 60) return language === 'hi' ? `${mins} मिनट पहले` : `${mins} mins ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return language === 'hi' ? `${hours} घंटे पहले` : `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return language === 'hi' ? 'कल' : 'Yesterday';
      return language === 'hi' ? `${days} दिन पहले` : `${days} days ago`;
    } catch {
      return language === 'hi' ? 'हाल ही में' : 'Recently';
    }
  };

  // Convert server notifications into display items
  const dynamicItems = serverNotifications.map((notif) => {
    const style = getStyleForNotif(notif);
    return {
      id: notif.id,
      titleEn: notif.titleEn || notif.title,
      titleHi: notif.titleHi || notif.title,
      descEn: notif.descEn || notif.message,
      descHi: notif.descHi || notif.message,
      time: formatRelativeTime(notif.createdAt),
      icon: style.icon,
      color: style.color,
    };
  });

  const displayList = dynamicItems.length > 0 ? [...dynamicItems, ...fallbackAnnouncements] : fallbackAnnouncements;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100">{t('notifications')}</h3>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' ? 'ताजा मंडी समाचार व अपडेट्स' : 'Mandi alerts & order updates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-0.5">
          {displayList.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">
                      {language === 'hi' ? notif.titleHi : notif.titleEn}
                    </h4>
                    <span className="text-[9px] text-slate-500">{notif.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language === 'hi' ? notif.descHi : notif.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
