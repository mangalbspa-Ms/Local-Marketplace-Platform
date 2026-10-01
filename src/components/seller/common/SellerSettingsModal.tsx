import React, { useState } from 'react';
import {
  Settings,
  X,
  Store,
  Truck,
  ShoppingBag,
  Bell,
  Volume2,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
  Save,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface SellerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShopStatus?: () => void;
}

export const SellerSettingsModal: React.FC<SellerSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenShopStatus,
}) => {
  const { shop, toggleShopStatus, toggleOrderAcceptance, updateFulfillmentSettings } = useSellerAuth();
  const { t } = useSellerLanguage();

  const [notificationSound, setNotificationSound] = useState<boolean>(() => {
    return localStorage.getItem('seller_pref_notif_sound') !== 'false';
  });
  const [orderAlerts, setOrderAlerts] = useState<boolean>(() => {
    return localStorage.getItem('seller_pref_order_alerts') !== 'false';
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen || !shop) return null;

  const isPickupEnabled = shop.fulfillment?.pickupEnabled ?? (shop as any)?.fulfillmentModes?.pickup ?? true;
  const isDeliveryEnabled = shop.fulfillment?.deliveryEnabled ?? (shop as any)?.fulfillmentModes?.delivery ?? true;

  const handleToggleShop = async () => {
    setIsUpdating(true);
    try {
      await toggleShopStatus();
      setFeedbackMsg(!shop.isOpen ? t('settings.shop_open_desc') : t('settings.shop_closed_desc'));
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleOrders = async () => {
    setIsUpdating(true);
    try {
      await toggleOrderAcceptance();
      setFeedbackMsg(shop.isAcceptingOrders !== false ? t('settings.accept_orders_off') : t('settings.accept_orders_on'));
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePickup = async () => {
    setIsUpdating(true);
    try {
      await updateFulfillmentSettings({
        pickupEnabled: !isPickupEnabled,
      });
      setFeedbackMsg(`${t('settings.pickup')}: ${!isPickupEnabled ? 'Active' : 'Inactive'}`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDelivery = async () => {
    setIsUpdating(true);
    try {
      await updateFulfillmentSettings({
        deliveryEnabled: !isDeliveryEnabled,
      });
      setFeedbackMsg(`${t('settings.delivery')}: ${!isDeliveryEnabled ? 'Active' : 'Inactive'}`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSoundToggle = (val: boolean) => {
    setNotificationSound(val);
    localStorage.setItem('seller_pref_notif_sound', String(val));
  };

  const handleOrderAlertsToggle = (val: boolean) => {
    setOrderAlerts(val);
    localStorage.setItem('seller_pref_order_alerts', String(val));
  };

  return (
    <div
      id="modal-seller-quick-settings"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 px-3 sm:px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-md max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-5 py-3.5 bg-[#070e24]/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {t('settings.title')}
              </h3>
              <p className="text-[11px] text-cyan-300/70">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mx-4 mt-3 py-2 px-3 rounded-xl bg-emerald-950/95 border border-emerald-400/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body — ONLY Settings Controls */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto overscroll-contain flex-1 scrollbar-thin">
          {/* 1. Shop Status Setting */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold text-white text-xs block">{t('settings.shop_status')}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {shop.isOpen ? t('settings.shop_open_desc') : t('settings.shop_closed_desc')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-toggle-shop-status-settings"
                disabled={isUpdating}
                onClick={handleToggleShop}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  shop.isOpen
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-rose-950 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                ) : shop.isOpen ? (
                  t('common.open')
                ) : (
                  t('common.closed')
                )}
              </button>
            </div>
          </div>

          {/* 2. Order Acceptance Setting */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-white text-xs block">{t('settings.accept_orders')}</span>
                <span className="text-[10px] text-slate-400 block">
                  {shop.isAcceptingOrders !== false ? t('settings.accept_orders_on') : t('settings.accept_orders_off')}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-toggle-orders-settings"
              disabled={isUpdating}
              onClick={handleToggleOrders}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                shop.isAcceptingOrders !== false ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                  shop.isAcceptingOrders !== false ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* 3. Delivery / Pickup Preferences */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2.5">
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
              {t('settings.fulfillment_title')}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">{t('settings.pickup')}</span>
                  <span className="text-[10px] text-slate-400 block">Self Pickup</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-pickup-settings"
                  disabled={isUpdating}
                  onClick={handleTogglePickup}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    isPickupEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                      isPickupEnabled ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">{t('settings.delivery')}</span>
                  <span className="text-[10px] text-slate-400 block">Home Delivery</span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-delivery-settings"
                  disabled={isUpdating}
                  onClick={handleToggleDelivery}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    isDeliveryEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                      isDeliveryEnabled ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Notification Alerts & Audio Sounds */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2.5">
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
              {t('settings.notifications_title')}
            </span>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white text-xs block">{t('settings.sound_alert')}</span>
                    <span className="text-[10px] text-slate-400 block">{t('settings.sound_desc')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-toggle-sound-settings"
                  onClick={() => handleSoundToggle(!notificationSound)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    notificationSound ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                      notificationSound ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white text-xs block">{t('settings.push_alerts')}</span>
                    <span className="text-[10px] text-slate-400 block">{t('settings.push_desc')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-toggle-order-alerts-settings"
                  onClick={() => handleOrderAlertsToggle(!orderAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    orderAlerts ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                      orderAlerts ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3.5 border-t border-cyan-500/20 bg-[#070e24]/80 flex items-center justify-between gap-2.5 shrink-0">
          {onOpenShopStatus && (
            <button
              type="button"
              id="btn-open-status-from-settings"
              onClick={() => {
                onClose();
                onOpenShopStatus();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <span>{t('settings.open_status_screen')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id="btn-close-settings-modal-footer"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
