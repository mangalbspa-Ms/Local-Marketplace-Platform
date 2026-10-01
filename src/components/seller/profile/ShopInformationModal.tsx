import React, { useState, useEffect } from 'react';
import {
  Store,
  X,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  User,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Power,
  Save,
  ShoppingBag,
  Loader2,
  Check,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';
import { ShopInformationScreen } from './ShopInformationScreen';

interface ShopInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEditor?: () => void;
}

export const ShopInformationModal: React.FC<ShopInformationModalProps> = ({
  isOpen,
  onClose,
  onOpenFullEditor,
}) => {
  const {
    shop,
    user,
    toggleShopStatus,
    updateFulfillmentSettings,
    updateShopProfile,
  } = useSellerAuth();
  const { language } = useSellerLanguage();

  // Mode: 'summary' = Clean compact summary view with Quick Controls
  //       'full_editor' = Complete 7-section Shop Information Full Editor
  const [viewMode, setViewMode] = useState<'summary' | 'full_editor'>('summary');
  const [toastNotice, setToastNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Controls local states & loaders
  const [openTimeInput, setOpenTimeInput] = useState(shop?.operatingHours?.openTime || '06:00 AM');
  const [closeTimeInput, setCloseTimeInput] = useState(shop?.operatingHours?.closeTime || '08:00 PM');
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  const [isSavingTimings, setIsSavingTimings] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);

  useEffect(() => {
    if (shop?.operatingHours?.openTime) {
      setOpenTimeInput(shop.operatingHours.openTime);
    }
    if (shop?.operatingHours?.closeTime) {
      setCloseTimeInput(shop.operatingHours.closeTime);
    }
  }, [shop?.operatingHours?.openTime, shop?.operatingHours?.closeTime]);

  if (!isOpen || !shop) return null;

  const isShopVerified = shop.verificationStatus === 'VERIFIED' || Boolean(shop.isVerifiedByAdmin);
  const postal = shop.postalData;
  const coordinates = shop.coordinates || { lat: 19.0182, lng: 72.8469 };
  const ownerName =
    (shop as any).ownerName ||
    (shop as any).merchantName ||
    user?.fullName ||
    (user as any)?.name ||
    'दुकानदार';

  const upiId =
    shop.upiPayoutId ||
    shop.financials?.payoutUpiId ||
    (shop as any).upiId ||
    'shreekrishna@okaxis';
  const qrImage = (shop as any).upiQrUrl || (shop as any).qrCodeUrl;

  const isDeliveryEnabled =
    shop.fulfillment?.deliveryEnabled ?? (shop as any)?.fulfillmentModes?.delivery ?? true;
  const isPickupEnabled =
    shop.fulfillment?.pickupEnabled ?? (shop as any)?.fulfillmentModes?.pickup ?? true;

  const profilePhotoDisplay =
    shop.profilePhotoUrl || shop.photoUrl || (shop as any)?.logoImageUrl;
  const coverPhotoDisplay =
    shop.coverPhotoUrl ||
    (shop as any)?.bannerUrl ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastNotice({ text, type });
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleGoToFullEditor = () => {
    setViewMode('full_editor');
  };

  // Quick Control 1: Toggle Shop Open / Closed
  const handleToggleShopStatus = async () => {
    if (!shop) return;
    setIsTogglingStatus(true);
    try {
      const nextState = !shop.isOpen;
      await toggleShopStatus(nextState);
      showToast(
        nextState
          ? '🟢 दुकान खोल दी गई है (Shop is OPEN)'
          : '🔴 दुकान बंद कर दी गई है (Shop is CLOSED)',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'स्थिति बदलने में विफल', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Quick Control 2: Save Opening / Closing Timings
  const handleSaveTimings = async () => {
    if (!openTimeInput.trim() || !closeTimeInput.trim()) {
      showToast('कृपया खुलने व बंद होने का समय दर्ज करें', 'error');
      return;
    }
    setIsSavingTimings(true);
    try {
      await updateShopProfile({
        operatingHours: {
          openTime: openTimeInput.trim(),
          closeTime: closeTimeInput.trim(),
          openDays: shop.operatingHours?.openDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
      });
      showToast('दुकान का समय सुरक्षित हो गया!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'समय सुरक्षित करने में त्रुटि', 'error');
    } finally {
      setIsSavingTimings(false);
    }
  };

  // Quick Control 3: Toggle Home Delivery ON / OFF
  const handleToggleDelivery = async () => {
    const nextDelivery = !isDeliveryEnabled;
    if (!nextDelivery && !isPickupEnabled) {
      showToast('कम से कम एक विकल्प (Pickup या Delivery) चालू रहना चाहिए', 'error');
      return;
    }
    setIsUpdatingDelivery(true);
    try {
      await updateFulfillmentSettings({
        deliveryEnabled: nextDelivery,
        pickupEnabled: isPickupEnabled,
      });
      showToast(`होम डिलीवरी ${nextDelivery ? 'चालू (ON)' : 'बंद (OFF)'} कर दी गई`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'अपडेट विफल', 'error');
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  // Quick Control 4: Toggle Store Pickup ON / OFF
  const handleTogglePickup = async () => {
    const nextPickup = !isPickupEnabled;
    if (!nextPickup && !isDeliveryEnabled) {
      showToast('कम से कम एक विकल्प (Pickup या Delivery) चालू रहना चाहिए', 'error');
      return;
    }
    setIsUpdatingPickup(true);
    try {
      await updateFulfillmentSettings({
        pickupEnabled: nextPickup,
        deliveryEnabled: isDeliveryEnabled,
      });
      showToast(`काउंटर पिकअप ${nextPickup ? 'चालू (ON)' : 'बंद (OFF)'} कर दी गई`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'अपडेट विफल', 'error');
    } finally {
      setIsUpdatingPickup(false);
    }
  };

  // If in Full Editor mode, render the Complete Shop Information Editor
  if (viewMode === 'full_editor') {
    return (
      <div
        id="modal-shop-full-editor-container"
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      >
        <div
          className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable container for the Full Editor with internal scroll */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
            <ShopInformationScreen
              onBack={() => setViewMode('summary')}
              onClose={onClose}
              onShowToast={showToast}
            />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // F) SHOP INFORMATION SUMMARY VIEW (Compact, Clean 14-Point View)
  // =========================================================================
  return (
    <div
      id="modal-shop-information-summary"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-xl max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed & Always Visible at Top (No Clipping) */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0 sticky top-0 z-20">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-1.5 truncate">
                <span>{language === 'hi' ? '🏪 दुकान जानकारी' : '🏪 Shop Information'}</span>
              </h3>
              <p className="text-[11px] text-cyan-300/70 truncate">
                {shop.name} {shop.category ? `• ${shop.category}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-shop-summary-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition cursor-pointer shrink-0 ml-2"
            title={language === 'hi' ? 'बंद करें' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Toast inside modal */}
        {toastNotice && (
          <div
            className={`mx-4 mt-2.5 py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 shrink-0 ${
              toastNotice.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-400/60 text-emerald-200'
                : 'bg-rose-950/95 border-rose-400/60 text-rose-200'
            }`}
          >
            {toastNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastNotice.text}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* ========================================================================= */}
          {/* 🏪 दुकान जानकारी — MAIN CONTROLS (2×2 Compact Grid)                       */}
          {/* ========================================================================= */}
          <div
            id="section-shop-main-controls-top"
            className="p-3.5 sm:p-4 rounded-3xl bg-[#08122d] border border-cyan-500/40 space-y-3 shadow-[0_0_25px_rgba(6,182,212,0.15)]"
          >
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/25">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    {language === 'hi' ? '🏪 दुकान जानकारी' : '🏪 Shop Information'}
                  </h4>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">
                    MAIN CONTROLS
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                {language === 'hi' ? '4 मुख्य नियंत्रण' : '4 Main Controls'}
              </span>
            </div>

            {/* 2×2 GRID OF MAIN CONTROLS */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. 🟢 दुकान की स्थिति */}
              <div
                id="control-shop-status"
                className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  shop.isOpen
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-black text-white flex items-center gap-1 truncate">
                    <span>{shop.isOpen ? '🟢' : '🔴'}</span>
                    <span className="truncate">{language === 'hi' ? 'दुकान की स्थिति' : 'Shop Status'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-cyan-500/10 gap-1.5">
                  <span
                    className={`text-[11px] font-black ${
                      shop.isOpen ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {shop.isOpen ? (language === 'hi' ? 'खुली है' : 'OPEN') : (language === 'hi' ? 'बंद है' : 'CLOSED')}
                  </span>
                  <button
                    id="btn-quick-toggle-shop-open"
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={handleToggleShopStatus}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0 ${
                      shop.isOpen
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    }`}
                  >
                    {isTogglingStatus ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Power className="w-3 h-3" />
                    )}
                    <span>{shop.isOpen ? (language === 'hi' ? 'चालू' : 'Active') : (language === 'hi' ? 'खोलें' : 'Open')}</span>
                  </button>
                </div>
              </div>

              {/* 2. 🕐 दुकान का समय */}
              <div
                id="control-shop-timing"
                className="p-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-black text-white flex items-center gap-1 truncate">
                    <span>🕐</span>
                    <span className="truncate">{language === 'hi' ? 'दुकान का समय' : 'Shop Timings'}</span>
                  </span>
                  <button
                    id="btn-quick-save-shop-timings"
                    type="button"
                    disabled={isSavingTimings}
                    onClick={handleSaveTimings}
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 flex items-center gap-0.5 transition cursor-pointer active:scale-95 shrink-0"
                    title={language === 'hi' ? 'समय सुरक्षित करें' : 'Save Timings'}
                  >
                    {isSavingTimings ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Save className="w-2.5 h-2.5 stroke-[2.5]" />
                    )}
                    <span>{language === 'hi' ? 'सेव' : 'Save'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 mt-auto">
                  <input
                    id="input-quick-open-time"
                    type="text"
                    value={openTimeInput}
                    onChange={(e) => setOpenTimeInput(e.target.value)}
                    placeholder="06:00"
                    className="w-full px-1.5 py-1 rounded-lg bg-[#070e24] border border-cyan-500/30 text-cyan-200 text-[10px] font-mono font-bold text-center focus:outline-none focus:border-cyan-400"
                    title={language === 'hi' ? 'खुलने का समय' : 'Opening Time'}
                  />
                  <input
                    id="input-quick-close-time"
                    type="text"
                    value={closeTimeInput}
                    onChange={(e) => setCloseTimeInput(e.target.value)}
                    placeholder="20:00"
                    className="w-full px-1.5 py-1 rounded-lg bg-[#070e24] border border-cyan-500/30 text-cyan-200 text-[10px] font-mono font-bold text-center focus:outline-none focus:border-cyan-400"
                    title={language === 'hi' ? 'बंद होने का समय' : 'Closing Time'}
                  />
                </div>
              </div>

              {/* 3. 🚚 डिलीवरी */}
              <div
                id="control-shop-delivery"
                className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isDeliveryEnabled
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
                    : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-black text-white flex items-center gap-1 truncate">
                    <span>🚚</span>
                    <span className="truncate">{language === 'hi' ? 'डिलीवरी' : 'Delivery'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-cyan-500/10 gap-1.5">
                  <span
                    className={`text-[11px] font-black ${
                      isDeliveryEnabled ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {isDeliveryEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    id="btn-quick-toggle-home-delivery"
                    type="button"
                    disabled={isUpdatingDelivery}
                    onClick={handleToggleDelivery}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0 ${
                      isDeliveryEnabled
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {isUpdatingDelivery ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Truck className="w-3 h-3" />
                    )}
                    <span>{isDeliveryEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* 4. 🛍️ पिकअप */}
              <div
                id="control-shop-pickup"
                className={`p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isPickupEnabled
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
                    : 'bg-slate-900/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-black text-white flex items-center gap-1 truncate">
                    <span>🛍️</span>
                    <span className="truncate">{language === 'hi' ? 'पिकअप' : 'Pickup'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-cyan-500/10 gap-1.5">
                  <span
                    className={`text-[11px] font-black ${
                      isPickupEnabled ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {isPickupEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    id="btn-quick-toggle-store-pickup"
                    type="button"
                    disabled={isUpdatingPickup}
                    onClick={handleTogglePickup}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0 ${
                      isPickupEnabled
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {isUpdatingPickup ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-3 h-3" />
                    )}
                    <span>{isPickupEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 📊 वर्तमान स्थिति (CURRENT STATUS) COMPACT CARD                            */}
          {/* ========================================================================= */}
          <div
            id="section-shop-current-status-summary-top"
            className="p-3 rounded-2xl bg-[#060e22] border border-cyan-500/35 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📊</span>
                <span>{language === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'hi' ? 'लाइव स्टेटस' : 'Live Status'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* 🟢 दुकान खुली है / 🔴 दुकान बंद है */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center space-x-2">
                <span className="text-sm">{shop.isOpen ? '🟢' : '🔴'}</span>
                <span className="font-bold text-slate-200 text-[11px] truncate">
                  {shop.isOpen ? (language === 'hi' ? 'दुकान खुली है' : 'Shop is OPEN') : (language === 'hi' ? 'दुकान बंद है' : 'Shop is CLOSED')}
                </span>
              </div>

              {/* 🕐 06:00 – 20:00 */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center space-x-2">
                <span className="text-sm">🕐</span>
                <span className="font-mono font-bold text-cyan-300 text-[11px] truncate">
                  {openTimeInput} – {closeTimeInput}
                </span>
              </div>

              {/* 🚚 Delivery ON / OFF */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center space-x-2">
                <span className="text-sm">🚚</span>
                <span className="font-bold text-slate-200 text-[11px] truncate">
                  Delivery{' '}
                  <span className={isDeliveryEnabled ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                    {isDeliveryEnabled ? 'ON' : 'OFF'}
                  </span>
                </span>
              </div>

              {/* 🛍️ Pickup ON / OFF */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center space-x-2">
                <span className="text-sm">🛍️</span>
                <span className="font-bold text-slate-200 text-[11px] truncate">
                  Pickup{' '}
                  <span className={isPickupEnabled ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                    {isPickupEnabled ? 'ON' : 'OFF'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🔵 दुकान जानकारी विस्तृत संपादक & ⚫ बंद करें (Close) CARDS               */}
          {/* ========================================================================= */}
          <div
            id="card-shop-full-editor-link"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#071330] to-cyan-950/60 border border-cyan-400/40 shadow-sm space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">🔵</span>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  {language === 'hi' ? 'दुकान जानकारी विस्तृत संपादक' : 'Shop Details Full Editor'}
                </h4>
                <p className="text-[10px] text-cyan-300/80 mt-0.5 leading-relaxed">
                  {language === 'hi' ? '“पता, PIN, GPS/Google Map, UPI, verification आदि”' : '“Address, PIN, GPS/Google Map, UPI, verification etc.”'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-open-shop-full-editor-top"
                onClick={handleGoToFullEditor}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition cursor-pointer active:scale-98"
              >
                <span>{language === 'hi' ? 'विस्तृत संपादक खोलें' : 'Open Full Editor'}</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                id="btn-close-shop-summary-top"
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0 active:scale-98 flex items-center gap-1"
              >
                <span>⚫</span>
                <span>{language === 'hi' ? 'बंद करें (Close)' : 'Close'}</span>
              </button>
            </div>
          </div>

          {/* Point 1: Shop photo / identity (Cover + Profile avatar) */}
          <div className="relative rounded-2xl overflow-hidden bg-[#070e24] border border-cyan-500/25 shadow-sm">
            <div className="relative w-full h-28 sm:h-32 bg-slate-900">
              <img
                src={coverPhotoDisplay}
                alt="Shop Cover"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070e24] via-black/40 to-transparent" />
              <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
                {language === 'hi' ? '1. 📸 दुकान पहचान (Identity)' : '1. 📸 Shop Identity'}
              </span>
            </div>

            <div className="px-3.5 pb-3 pt-1 flex items-center space-x-3 -mt-7 relative z-10">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400 bg-cyan-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0 flex items-center justify-center">
                {profilePhotoDisplay ? (
                  <img
                    src={profilePhotoDisplay}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-7 h-7 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-black text-white block truncate">
                  {shop.name}
                </span>
                <span className="text-[11px] text-cyan-300 font-semibold block truncate">
                  {shop.category || (language === 'hi' ? 'किराना एवं जनरल स्टोर' : 'Grocery & General Store')}
                </span>
              </div>
            </div>
          </div>

          {/* Point 13 & 14: Admin Verification & Lock Status Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 13. Admin Verification status */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-xs ${
                isShopVerified
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : 'bg-amber-950/40 border-amber-500/40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck
                  className={`w-4 h-4 shrink-0 ${
                    isShopVerified ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span className="text-[11px] font-extrabold text-slate-200 truncate">
                  {language === 'hi' ? '13. सत्यापन स्थिति:' : '13. Verification Status:'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                  isShopVerified
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                }`}
              >
                {isShopVerified ? (language === 'hi' ? '🛡️ Admin द्वारा सत्यापित' : '🛡️ Verified by Admin') : (language === 'hi' ? '⏳ समीक्षाधीन' : '⏳ Under Review')}
              </span>
            </div>

            {/* 14. Lock status */}
            <div className="p-3 rounded-2xl bg-[#070e24] border border-cyan-500/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock
                  className={`w-4 h-4 shrink-0 ${
                    isShopVerified ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                />
                <span className="text-[11px] font-extrabold text-slate-200 truncate">
                  {language === 'hi' ? '14. लॉक स्थिति:' : '14. Lock Status:'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                  isShopVerified
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {isShopVerified ? (language === 'hi' ? '🔒 सुरक्षित विवरण लॉक' : '🔒 Secure Details Locked') : (language === 'hi' ? '✏️ संपादन योग्य' : '✏️ Editable')}
              </span>
            </div>
          </div>

          {/* Points 2, 3, 4: Basic Identity Information */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'मूल पहचान विवरण' : 'Basic Identity Details'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 2. दुकान का नाम */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {language === 'hi' ? '2. दुकान का नाम' : '2. Shop Name'}
                </span>
                <span className="font-black text-white text-xs block mt-0.5 truncate">
                  {shop.name}
                </span>
              </div>

              {/* 3. दुकान की Category */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {language === 'hi' ? '3. दुकान की Category' : '3. Shop Category'}
                </span>
                <span className="font-bold text-cyan-300 text-xs block mt-0.5 truncate">
                  {shop.category || (language === 'hi' ? 'किराना एवं जनरल स्टोर' : 'Grocery & General Store')}
                </span>
              </div>

              {/* 4. दुकानदार का नाम */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 col-span-1 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {language === 'hi' ? '4. दुकानदार का नाम (Shop Owner)' : '4. Shop Owner Name'}
                  </span>
                  <span className="font-bold text-slate-200 text-xs block mt-0.5">
                    {ownerName}
                  </span>
                </div>
                <User className="w-4 h-4 text-cyan-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Points 5, 6, 7: Address, PIN Code & Location Status */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'दुकान का पता व लोकेशन' : 'Shop Address & Location'}
            </span>

            {/* 5. दुकान का पता */}
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">
                {language === 'hi' ? '5. दुकान का पता' : '5. Shop Address'}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {shop.address ||
                  (language === 'hi' ? 'दुकान संख्या 42, मुख्य मंडी चौराहा, राजा पार्क, जयपुर - 302004' : 'Shop No. 42, Main Mandi Square, Raja Park, Jaipur - 302004')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* 6. PIN Code */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {language === 'hi' ? '6. PIN Code' : '6. PIN Code'}
                </span>
                <span className="font-mono text-cyan-300 font-black text-xs block mt-0.5">
                  {(shop as any)?.pincode || postal?.pincode || '302004'}
                </span>
              </div>

              {/* 7. Location status */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {language === 'hi' ? '7. Location स्थिति' : '7. Location Status'}
                </span>
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{language === 'hi' ? 'GPS सेट है ✓' : 'GPS is Set ✓'}</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400 block truncate">
                  {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* UPI / Payment status */}
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'hi' ? 'UPI / पेमेंट स्थिति (Payment Information)' : 'UPI / Payment Information'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {language === 'hi' ? 'दुकान UPI ID:' : 'Shop UPI ID:'}
                </span>
                <span className="font-mono text-cyan-300 font-bold text-xs block truncate mt-0.5">
                  {upiId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {qrImage ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    <span>{language === 'hi' ? 'QR उपलब्ध' : 'QR Available'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                    {language === 'hi' ? 'QR नहीं है' : 'No QR'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer — EXACTLY THE TWO REQUESTED BUTTONS */}
        <div className="p-3.5 sm:p-4 border-t border-cyan-500/20 bg-[#070e24] flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-20">
          {/* 🔵 “दुकान जानकारी विस्तृत संपादक (Full Editor)” */}
          <button
            type="button"
            id="btn-open-shop-full-editor"
            onClick={handleGoToFullEditor}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition cursor-pointer active:scale-98"
          >
            <span>{language === 'hi' ? 'दुकान जानकारी विस्तृत संपादक (Full Editor)' : 'Shop Details (Full Editor)'}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* ⚫ “बंद करें (Close)” */}
          <button
            type="button"
            id="btn-close-shop-summary-footer"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0 active:scale-98"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
