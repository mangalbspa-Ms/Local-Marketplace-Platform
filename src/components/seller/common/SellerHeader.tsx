/**
 * Seller Header Component (Android-style Futuristic Top App Bar)
 * 
 * Features:
 * 1. Compact Seller Top Header with Shop Photo & Name.
 * 2. Small Camera Icon on Avatar for direct Phone Gallery image upload & instant persist.
 * 3. Tapping the Header toggles the Quick-Control Panel directly below it.
 * 4. Outside-click / touch automatically closes the Quick-Control Panel.
 * 5. Quick-Control Panel contains ONLY:
 *    - दुकान की स्थिति (दुकान चालू करें / दुकान बंद करें)
 *    - सेवा विकल्प (Pickup / Delivery)
 *    - दुकान का समय (खुलने का समय / बंद होने का समय)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Bell,
  Power,
  ChevronDown,
  MapPin,
  CheckCircle2,
  Menu,
  X,
  RefreshCw,
  Camera,
  Check,
  User,
  Phone,
  Globe,
  Settings,
  HelpCircle,
  ChevronRight,
  Mail,
  Building,
  Navigation,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Moon,
  Sun,
  Image as ImageIcon,
  Lock,
} from 'lucide-react';
import { useSellerAuth, DEMO_SELLERS } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { useSellerTheme } from '../../../context/SellerThemeContext.tsx';
import { SellerPersonalInfoModal } from './SellerPersonalInfoModal.tsx';
import { SellerContactModal } from './SellerContactModal.tsx';
import { SellerSettingsModal } from './SellerSettingsModal.tsx';
import { SellerLockSecurityModal } from '../security/SellerLockSecurityModal.tsx';
import { CoverPhotoSlideshow } from '../../common/CoverPhotoSlideshow.tsx';
import { getShopCoverPhotosList } from '../../shops/ShopCard.tsx';

interface SellerHeaderProps {
  onOpenNotifications: () => void;
  onOpenShopStatus?: () => void;
  onNavigateToProfile?: () => void;
  unreadNotifsCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const SellerHeader: React.FC<SellerHeaderProps> = ({
  onOpenNotifications,
  onOpenShopStatus,
  onNavigateToProfile,
  unreadNotifsCount,
  onRefresh,
  isRefreshing,
}) => {
  const {
    user,
    shop,
    loginAsDemoSeller,
    logout,
    toggleShopStatus,
    updateFulfillmentSettings,
    updateShopProfile,
    updateShopPhoto,
  } = useSellerAuth();
  const { language, setLanguage, t } = useSellerLanguage();
  const { theme, toggleTheme, isDark } = useSellerTheme();

  // Quick Menu (☰ Hamburger) state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Quick modals triggered from Menu
  type QuickModalType =
    | 'personal_info'
    | 'contact_address'
    | 'language'
    | 'settings'
    | 'lock_security'
    | 'support'
    | 'logout'
    | null;
  const [activeQuickModal, setActiveQuickModal] = useState<QuickModalType>(null);

  // Quick Control Panel state (Header tap)
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);

  // Quick Control Panel local inputs
  const [openTimeInput, setOpenTimeInput] = useState(shop?.operatingHours?.openTime || '07:30 AM');
  const [closeTimeInput, setCloseTimeInput] = useState(shop?.operatingHours?.closeTime || '09:30 PM');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);
  const [isSavingTimings, setIsSavingTimings] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Refs for outside-click detection and file picker
  const headerRef = useRef<HTMLDivElement>(null);
  const quickPanelRef = useRef<HTMLDivElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs whenever shop data updates
  useEffect(() => {
    if (shop?.operatingHours) {
      if (shop.operatingHours.openTime) setOpenTimeInput(shop.operatingHours.openTime);
      if (shop.operatingHours.closeTime) setCloseTimeInput(shop.operatingHours.closeTime);
    }
  }, [shop?.operatingHours?.openTime, shop?.operatingHours?.closeTime]);

  // Outside click / touch detection: Closes Menu when tapping anywhere outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isMenuOpen]);

  // Outside click / touch detection: Closes Quick Panel when tapping outside
  useEffect(() => {
    if (!isQuickPanelOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        quickPanelRef.current &&
        !quickPanelRef.current.contains(target) &&
        headerRef.current &&
        !headerRef.current.contains(target)
      ) {
        setIsQuickPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isQuickPanelOpen]);

  if (!shop || !user) return null;

  // Status Handlers
  const handleOpenShop = async () => {
    if (shop.isOpen) return;
    setIsUpdatingStatus(true);
    try {
      await toggleShopStatus(true);
      setToastMsg(language === 'hi' ? 'दुकान चालू हो गई है (OPEN)' : 'Shop is now OPEN');
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setToastMsg(err.message || 'त्रुटि हुई');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseShop = async () => {
    if (!shop.isOpen) return;
    setIsUpdatingStatus(true);
    try {
      await toggleShopStatus(false);
      setToastMsg(language === 'hi' ? 'दुकान बंद कर दी गई है (CLOSED)' : 'Shop is now CLOSED');
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
      setToastMsg(err.message || 'त्रुटि हुई');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fulfillment Handlers
  const pickupActive = shop.fulfillment?.pickupEnabled ?? true;
  const deliveryActive = shop.fulfillment?.deliveryEnabled ?? true;

  const handleTogglePickup = async () => {
    const nextPickup = !pickupActive;
    if (!nextPickup && !deliveryActive) {
      setToastMsg(
        language === 'hi'
          ? 'कम से कम एक विकल्प (Pickup या Delivery) चालू रहना चाहिए'
          : 'At least one option must be active'
      );
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    setIsUpdatingFulfillment(true);
    try {
      await updateFulfillmentSettings({
        pickupEnabled: nextPickup,
        deliveryEnabled: deliveryActive,
      });
      setToastMsg(language === 'hi' ? 'सेवा विकल्प अपडेट हो गया' : 'Service options updated');
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  const handleToggleDelivery = async () => {
    const nextDelivery = !deliveryActive;
    if (!pickupActive && !nextDelivery) {
      setToastMsg(
        language === 'hi'
          ? 'कम से कम एक विकल्प (Pickup या Delivery) चालू रहना चाहिए'
          : 'At least one option must be active'
      );
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    setIsUpdatingFulfillment(true);
    try {
      await updateFulfillmentSettings({
        pickupEnabled: pickupActive,
        deliveryEnabled: nextDelivery,
      });
      setToastMsg(language === 'hi' ? 'सेवा विकल्प अपडेट हो गया' : 'Service options updated');
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  // Timings Handler
  const handleSaveTimings = async () => {
    setIsSavingTimings(true);
    try {
      await updateShopProfile({
        operatingHours: {
          openTime: openTimeInput.trim() || '07:30 AM',
          closeTime: closeTimeInput.trim() || '09:30 PM',
          openDays: shop.operatingHours?.openDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
      });
      setToastMsg(language === 'hi' ? 'दुकान का समय सुरक्षित हो गया!' : 'Shop timings saved successfully!');
      setTimeout(() => setToastMsg(null), 2500);
    } catch (err: any) {
      console.error('Failed to save timings', err);
      setToastMsg(err.message || 'समय सुरक्षित करने में विफल');
    } finally {
      setIsSavingTimings(false);
    }
  };

  // Direct Phone Gallery Profile Photo Upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMsg(language === 'hi' ? 'कृपया केवल इमेज फ़ाइल चुनें' : 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMsg(language === 'hi' ? 'फ़ाइल का आकार 5MB से कम होना चाहिए' : 'File must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) return;

      setToastMsg(language === 'hi' ? 'प्रोफ़ाइल फोटो अपडेट हो रही है...' : 'Updating profile photo...');
      try {
        await updateShopPhoto({
          type: 'profile',
          action: 'set',
          imageData: dataUrl,
        });
        setToastMsg(
          language === 'hi'
            ? 'प्रोफ़ाइल फोटो सफलतापूर्वक अपडेट हो गई!'
            : 'Profile photo updated successfully!'
        );
        setTimeout(() => setToastMsg(null), 3000);
      } catch (err: any) {
        console.error('Photo update error:', err);
        setToastMsg(language === 'hi' ? 'फोटो अपडेट करने में विफल' : 'Failed to update photo');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle uploading/updating cover photo from header
  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMsg(language === 'hi' ? 'कृपया केवल इमेज फाइल चुनें' : 'Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToastMsg(language === 'hi' ? 'फोटो 10MB से छोटी होनी चाहिए' : 'Photo must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) return;

      setToastMsg(language === 'hi' ? 'कवर फोटो अपडेट हो रही है...' : 'Updating cover photo...');
      try {
        await updateShopPhoto({
          type: 'cover',
          action: 'set',
          imageData: dataUrl,
        });
        setToastMsg(
          language === 'hi'
            ? 'कवर फोटो सफलतापूर्वक अपडेट हो गई!'
            : 'Cover photo updated successfully!'
        );
        setTimeout(() => setToastMsg(null), 3000);
      } catch (err: any) {
        console.error('Cover photo update error:', err);
        setToastMsg(language === 'hi' ? 'कवर फोटो अपडेट करने में विफल' : 'Failed to update cover photo');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real saved cover photo from Seller Profile
  const fallbackCoverPhoto =
    shop.coverPhotoUrl ||
    (shop as any).bannerUrl ||
    (shop as any).bannerImageUrl ||
    (shop as any).coverUrl ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';

  const coverPhotosList = getShopCoverPhotosList(shop, fallbackCoverPhoto);

  return (
    <header
      id="seller-top-header"
      className={`sticky top-0 z-40 w-full select-none shrink-0 transition-colors duration-150 ${
        isDark
          ? 'bg-[#070e24] text-slate-100 shadow-xl shadow-black/70 border-b border-cyan-500/30'
          : 'bg-white text-slate-900 shadow-md shadow-slate-200/80 border-b border-slate-200'
      }`}
    >
      {/* Top Status Bar Mimic */}
      <div
        className={`relative z-20 px-4 py-1 flex items-center justify-between text-[11px] font-medium border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'text-cyan-400/80 border-cyan-950/80 bg-[#040816]/95'
            : 'text-slate-600 border-slate-200/80 bg-slate-50/90'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Online Hub</span>
          <span className={isDark ? 'text-cyan-800' : 'text-slate-300'}>•</span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>
            {shop.marketName || 'Dadar Central Mandi'}
          </span>
        </div>
        <div className={`flex items-center space-x-2 font-mono text-[10px] ${isDark ? 'text-cyan-300/80' : 'text-slate-500'}`}>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Top App Bar with Real Saved Cover Photo Background */}
      <div className="relative w-full h-[74px] overflow-visible">
        {/* Real Saved Cover Photo Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <CoverPhotoSlideshow
            imgId="seller-header-cover-img"
            photos={coverPhotosList}
            fallbackPhoto={fallbackCoverPhoto}
            alt={`${shop.name} Cover`}
            containerClassName="absolute inset-0 w-full h-full"
            className={`w-full h-full object-cover select-none transition-all duration-200 ${
              isDark
                ? 'filter brightness-[0.70] contrast-[1.05]'
                : 'filter brightness-[1.0] contrast-[1.0]'
            }`}
          />
          {/* Theme-sensitive overlay: subtle & readable without obscuring or color-distorting the cover photo */}
          {isDark ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-[#070e24]/92 via-[#070e24]/80 to-[#070e24]/65" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070e24]/85 via-transparent to-black/25" />
              <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-[0.5px]" />
            </>
          ) : (
            <>
              {/* Light Mode: gentle white fade behind text on the left, clear colorful cover photo on the right */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/75 to-white/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
            </>
          )}
        </div>

        {/* Action Controls & Info sitting on top of Cover Photo */}
        <div className="relative z-10 px-3.5 py-2.5 h-full flex items-center justify-between gap-2.5">
          {/* Left: Hamburger Menu (☰) */}
          <button
            ref={menuBtnRef}
            id="seller-header-menu-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="मुख्य मेनू (Menu)"
            className={`p-2 rounded-xl border transition cursor-pointer shrink-0 shadow-sm backdrop-blur-md ${
              isMenuOpen
                ? isDark
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                : isDark
                ? 'bg-slate-950/80 border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950/80'
                : 'bg-white/95 border-slate-300 text-slate-700 hover:text-slate-950 hover:bg-white hover:border-slate-400'
            }`}
          >
            <Menu className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Center: Seller Header Toggle (Tap to open/close Quick Control Panel) */}
          <div
            ref={headerRef}
            onClick={() => setIsQuickPanelOpen((prev) => !prev)}
            className={`flex items-center space-x-2.5 min-w-0 cursor-pointer select-none group flex-1 py-1 px-1 rounded-xl transition ${
              isDark ? 'hover:bg-cyan-950/40' : 'hover:bg-white/60'
            }`}
            title="त्वरित नियंत्रण (Tap to toggle Quick Control Panel)"
          >
            {/* Shop Circular Avatar with Camera Badge (Both Profile Icon and Cover Photo shown!) */}
            <div className="relative shrink-0">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 transition-all ${
                  isDark
                    ? 'bg-cyan-950/80 border-2 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-black/40 text-cyan-300'
                    : 'bg-white border-2 border-white shadow-md ring-1 ring-slate-300/80 text-cyan-700'
                }`}
              >
                {shop.profilePhotoUrl || shop.photoUrl ? (
                  <img
                    src={shop.profilePhotoUrl || shop.photoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Store className={`w-5 h-5 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`} />
                )}
              </div>

              {/* Small Camera Icon Badge on Profile Icon (Tap to pick profile photo) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  profilePhotoInputRef.current?.click();
                }}
                title="प्रोफाइल फोटो बदलें (Change Profile Photo)"
                className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md cursor-pointer transition active:scale-90 z-10 ${
                  isDark
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white border-2 border-white shadow-sm'
                }`}
              >
                <Camera className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>

              {/* Hidden file input for profile photo selection */}
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoUpload}
              />
            </div>

            {/* Shop Name + Status Pill + Location */}
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <span
                  className={`text-sm sm:text-base font-black tracking-tight transition-colors truncate max-w-[140px] sm:max-w-[200px] ${
                    isDark
                      ? 'text-white group-hover:text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                      : 'text-slate-950 group-hover:text-cyan-700'
                  }`}
                >
                  {shop.name}
                </span>

                {/* Compact Status Pill */}
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 backdrop-blur-xs ${
                    shop.isOpen
                      ? isDark
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-400/80 shadow-xs'
                      : isDark
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
                      : 'bg-rose-100 text-rose-900 border-rose-400/80 shadow-xs'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      shop.isOpen
                        ? isDark ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600 animate-pulse'
                        : isDark ? 'bg-rose-400' : 'bg-rose-600'
                    }`}
                  />
                  <span>
                    {shop.isOpen ? (language === 'hi' ? 'खुली' : 'OPEN') : (language === 'hi' ? 'बंद' : 'CLOSED')}
                  </span>
                </span>

                {/* Toggle indicator arrow */}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    isQuickPanelOpen ? 'rotate-180' : ''
                  } ${
                    isDark
                      ? 'text-cyan-400 group-hover:text-cyan-300'
                      : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                />
              </div>

              <div
                className={`flex items-center text-[11px] sm:text-xs font-semibold truncate space-x-1 mt-0.5 ${
                  isDark
                    ? 'text-cyan-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                    : 'text-slate-700'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
                <span className="truncate">{shop.marketName || 'Dadar Central Mandi'}</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Hidden Cover Photo Input + Notifications Bell */}
          <div className="flex items-center space-x-1 shrink-0">
            <input
              ref={coverPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPhotoUpload}
            />

            <button
              id="seller-header-notifs-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNotifications();
              }}
              className={`relative p-2 rounded-xl border transition cursor-pointer shadow-sm backdrop-blur-md ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300'
                  : 'bg-white/95 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
              title="सूचनाएं (Notifications)"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-white dark:ring-slate-950 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* QUICK MENU (Compact, High-Contrast Futuristic Card)                  */}
        {/* Exactly 7 options in strict order:                                   */}
        {/* 1. 🏪 दुकान जानकारी                                                   */}
        {/* 2. 👤 व्यक्तिगत जानकारी                                                */}
        {/* 3. 📞 कॉन्टेक्ट और पता                                                 */}
        {/* 4. 🌐 भाषा (Hindi / English)                                        */}
        {/* 5. ⚙️ सेटिंग्स                                                        */}
        {/* 6. ❓ सहायता और सपोर्ट                                                */}
        {/* 7. 🚪 लॉग आउट                                                         */}
        {/* ==================================================================== */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            id="seller-quick-menu"
            className="absolute left-2 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-1rem)] bg-[#0b142c]/98 border border-cyan-500/35 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] p-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col max-h-[calc(100dvh-170px)] sm:max-h-[calc(100vh-175px)]"
          >
            {/* Context Header with Clear ✕ Close Button (Fixed at top of menu) */}
            <div className="shrink-0 px-2.5 py-1.5 mb-1.5 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  {t('menu.quick_menu')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">
                  • {shop.name}
                </span>
              </div>
              <button
                id="seller-menu-close-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                className="p-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-slate-300 hover:text-white hover:bg-rose-950/60 hover:border-rose-500/50 transition cursor-pointer flex items-center justify-center"
                title={t('menu.close')}
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Vertically scrollable menu content allowing user to scroll down and see item #8 */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1 text-xs pr-1 pb-8 scrollbar-thin">
              {/* 1. 🏪 दुकान जानकारी */}
              <button
                id="menu-item-shop-info"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateToProfile?.();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.shop_info')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 2. 👤 व्यक्तिगत जानकारी */}
              <button
                id="menu-item-personal-info"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('personal_info');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.personal_info')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 3. 📞 संपर्क और पता */}
              <button
                id="menu-item-contact-address"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('contact_address');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.contact_address')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 4. 🌐 भाषा (Direct Inline Selectable - No Popup/Modal) */}
              <div
                id="menu-item-language"
                className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-cyan-950/20 border border-cyan-500/20"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs text-slate-200">
                    {t('menu.language')}
                  </span>
                </div>
                {/* Directly selectable Hindi & English buttons */}
                <div className="flex items-center p-0.5 rounded-lg bg-[#070e24] border border-cyan-500/30 shrink-0 ml-1">
                  <button
                    type="button"
                    id="btn-quick-lang-hi"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage('hi');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      language === 'hi'
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-extrabold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={language === 'hi' ? 'हिन्दी चुनें' : 'Select Hindi'}
                  >
                    {language === 'hi' && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>हिन्दी</span>
                  </button>
                  <button
                    type="button"
                    id="btn-quick-lang-en"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguage('en');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      language === 'en'
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-extrabold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={language === 'hi' ? 'अंग्रेज़ी चुनें' : 'Select English'}
                  >
                    {language === 'en' && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 5. ⚙️ सेटिंग्स */}
              <button
                id="menu-item-settings"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('settings');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.settings')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 6. 🔒 ताला और सुरक्षा (Lock & Security) */}
              <button
                id="menu-item-lock-security"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('lock_security');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.lock_security')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 7. ❓ सहायता और सपोर्ट */}
              <button
                id="menu-item-support"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('support');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-950/50 text-slate-200 hover:text-white transition group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 group-hover:border-cyan-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold truncate text-xs">
                    {t('menu.support')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-cyan-500/10 my-0.5" />

              {/* 8. 🎨 Theme / Light-Dark Mode (STANDALONE OPTION #8) */}
              <button
                id="menu-item-theme-toggle"
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition group cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 text-slate-200 hover:text-white'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-slate-800 hover:text-slate-950'
                }`}
                title={theme === 'dark' ? (language === 'hi' ? 'लाइट मोड में बदलें' : 'Switch to Light Mode') : (language === 'hi' ? 'डार्क मोड में बदलें' : 'Switch to Dark Mode')}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      theme === 'dark'
                        ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 group-hover:border-cyan-400'
                        : 'bg-amber-100/90 border-amber-400/50 text-amber-600 group-hover:border-amber-500'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5" />
                    ) : (
                      <Sun className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-bold truncate text-xs">
                    {theme === 'dark' ? t('menu.theme_dark') : t('menu.theme_light')}
                  </span>
                </div>

                {/* Right Side Compact Switch Button */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider border shadow-xs ${
                      theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {theme === 'dark' ? 'ON' : 'OFF'}
                  </span>
                  <div
                    className={`w-8 h-4.5 rounded-full p-0.5 flex items-center shadow-inner transition-colors duration-200 ${
                      theme === 'dark'
                        ? 'bg-cyan-500 justify-end'
                        : 'bg-slate-400 justify-start'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </button>

              {/* Subtle Divider */}
              <div className="border-b border-rose-500/20 my-1" />

              {/* 9. 🚪 लॉग आउट (ALWAYS FINAL OPTION #9, BELOW THEME) */}
              <button
                id="menu-item-logout"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setActiveQuickModal('logout');
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-rose-950/20 hover:bg-rose-950/50 border border-rose-500/25 text-rose-300 hover:text-rose-200 transition group cursor-pointer active:scale-98"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-950/90 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <Power className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-rose-300 text-xs truncate">
                    {t('menu.logout')}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400/60 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* QUICK CONTROL PANEL (Directly below the small header)                */}
      {/* ==================================================================== */}
      {isQuickPanelOpen && (
        <div
          ref={quickPanelRef}
          id="seller-quick-control-panel"
          className="border-t border-cyan-500/20 border-b border-cyan-500/30 bg-[#0b142c] shadow-[0_15px_35px_rgba(0,0,0,0.85)] p-3.5 space-y-3.5 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150"
        >
          {/* Toast feedback banner inside quick panel if active */}
          {toastMsg && (
            <div className="py-1 px-2.5 rounded-lg bg-cyan-950/90 border border-cyan-400/50 text-[11px] text-cyan-200 font-bold flex items-center justify-between">
              <span>{toastMsg}</span>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-cyan-400 hover:text-white text-xs font-black ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. दुकान की स्थिति */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                {language === 'hi' ? 'दुकान की स्थिति' : 'Shop Status'}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  shop.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {shop.isOpen
                  ? (language === 'hi' ? '● दुकान चालू है' : '● Shop is Open')
                  : (language === 'hi' ? '○ दुकान बंद है' : '○ Shop is Closed')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* दुकान चालू करें */}
              <button
                type="button"
                onClick={handleOpenShop}
                disabled={isUpdatingStatus}
                className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  shop.isOpen
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-400'
                    : 'bg-[#070e24] text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {shop.isOpen && <Check className="w-4 h-4 stroke-[3]" />}
                <span>{language === 'hi' ? 'दुकान चालू करें' : 'Open Shop'}</span>
              </button>

              {/* दुकान बंद करें */}
              <button
                type="button"
                onClick={handleCloseShop}
                disabled={isUpdatingStatus}
                className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  !shop.isOpen
                    ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] border border-rose-500'
                    : 'bg-[#070e24] text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {!shop.isOpen && <X className="w-4 h-4 stroke-[3]" />}
                <span>{language === 'hi' ? 'दुकान बंद करें' : 'Close Shop'}</span>
              </button>
            </div>
          </div>

          {/* 2. सेवा विकल्प (Pickup / Delivery) */}
          <div className="space-y-1.5 pt-2 border-t border-cyan-500/15">
            <span className="text-xs font-black text-white">
              {language === 'hi' ? 'सेवा विकल्प' : 'Service Options'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Pickup */}
              <button
                type="button"
                disabled={isUpdatingFulfillment}
                onClick={handleTogglePickup}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  pickupActive
                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-[#070e24] border-slate-700/60 text-slate-400 hover:text-slate-300'
                } border`}
              >
                {pickupActive ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block" />
                )}
                <span>Pickup</span>
              </button>

              {/* Delivery */}
              <button
                type="button"
                disabled={isUpdatingFulfillment}
                onClick={handleToggleDelivery}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  deliveryActive
                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-[#070e24] border-slate-700/60 text-slate-400 hover:text-slate-300'
                } border`}
              >
                {deliveryActive ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block" />
                )}
                <span>Delivery</span>
              </button>
            </div>
          </div>

          {/* 3. दुकान का समय */}
          <div className="space-y-2 pt-2 border-t border-cyan-500/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">
                {language === 'hi' ? 'दुकान का समय' : 'Shop Timings'}
              </span>
              <button
                type="button"
                onClick={handleSaveTimings}
                disabled={isSavingTimings}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
              >
                {isSavingTimings ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>{language === 'hi' ? 'सुरक्षित करें' : 'Save'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  {language === 'hi' ? 'खुलने का समय' : 'Opening Time'}
                </label>
                <input
                  type="text"
                  value={openTimeInput}
                  onChange={(e) => setOpenTimeInput(e.target.value)}
                  placeholder="07:30 AM"
                  className="w-full px-2.5 py-1.5 bg-[#070e24] border border-cyan-500/30 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  {language === 'hi' ? 'बंद होने का समय' : 'Closing Time'}
                </label>
                <input
                  type="text"
                  value={closeTimeInput}
                  onChange={(e) => setCloseTimeInput(e.target.value)}
                  placeholder="09:30 PM"
                  className="w-full px-2.5 py-1.5 bg-[#070e24] border border-cyan-500/30 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3-DOT QUICK MENU MODALS (Personal Info, Contact, etc.)              */}
      {/* ==================================================================== */}

      {/* 2. 👤 व्यक्तिगत जानकारी Modal */}
      {activeQuickModal === 'personal_info' && (
        <SellerPersonalInfoModal
          isOpen={true}
          onClose={() => setActiveQuickModal(null)}
        />
      )}

      {/* 3. 📞 कॉन्टेक्ट और पता Modal */}
      {activeQuickModal === 'contact_address' && (
        <SellerContactModal
          isOpen={true}
          onClose={() => setActiveQuickModal(null)}
        />
      )}

      {/* 5. ⚙️ सेटिंग्स Modal */}
      {activeQuickModal === 'settings' && (
        <SellerSettingsModal
          isOpen={true}
          onClose={() => setActiveQuickModal(null)}
          onOpenShopStatus={() => {
            setActiveQuickModal(null);
            onOpenShopStatus?.();
          }}
        />
      )}

      {/* Lock & Security Modal */}
      <SellerLockSecurityModal
        isOpen={activeQuickModal === 'lock_security'}
        onClose={() => setActiveQuickModal(null)}
      />

      {/* 6. ❓ सहायता और सपोर्ट Modal */}
      {activeQuickModal === 'support' && (
        <div
          id="modal-help-support"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 px-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setActiveQuickModal(null)}
        >
          <div
            className="bg-[#0b142c] border border-cyan-500/30 rounded-3xl p-5 w-full max-w-md max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-4 overflow-y-auto shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{t('support.title')}</h3>
                  <p className="text-[11px] text-cyan-300/70">{t('support.subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuickModal(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Support Channels */}
            <div className="space-y-2.5 bg-[#070e24] p-3.5 rounded-2xl border border-cyan-500/20 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">{t('support.helpline')}</span>
                    <span className="font-mono text-cyan-300 text-xs font-semibold">+91 98765 43210</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                  24x7 Live
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">{t('support.whatsapp')}</span>
                    <span className="text-slate-400 text-[11px]">+91 98765 43210</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                  {t('support.chat_now')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">{t('support.email')}</span>
                    <span className="font-mono text-slate-300 text-[11px]">support@apnidukan.local</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  {t('support.reply_time')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-500/20 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveQuickModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 🚪 लॉग आउट Confirmation Modal */}
      {activeQuickModal === 'logout' && (
        <div
          id="modal-seller-logout-confirm"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 px-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setActiveQuickModal(null)}
        >
          <div
            className="bg-[#0b142c] border border-rose-500/40 rounded-3xl p-5 w-full max-w-sm max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] text-slate-100 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-4 overflow-y-auto shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Icon & Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-lg">{t('logout.confirm_title')}</h3>
              <p className="text-xs text-slate-300 px-2 leading-relaxed">
                {t('logout.confirm_desc')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-rose-500/20">
              <button
                type="button"
                onClick={() => setActiveQuickModal(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                id="btn-confirm-logout"
                type="button"
                onClick={() => {
                  setActiveQuickModal(null);
                  logout();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition cursor-pointer active:scale-98"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{t('logout.confirm_btn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
