/**
 * Shop Profile & Settings Screen (Screen 17)
 * Edit shop details, operating hours, delivery parameters, and view customer shop QR.
 */

import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  QrCode,
  ShieldCheck,
  Check,
  Power,
  Save,
  AlertCircle,
  AlertTriangle,
  Truck,
  ShoppingBag,
  IndianRupee,
  Lock,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

export const ShopProfileScreen: React.FC = () => {
  const { shop, updateShopProfile, updateFulfillmentSettings, logout } = useSellerAuth();
  const { language, t } = useSellerLanguage();

  const [name, setName] = useState(shop?.name || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [phone, setPhone] = useState(shop?.phone || '');

  // Fulfillment State
  const isFulfillmentLockedByAdmin = shop?.fulfillment?.sellerCanManageFulfillment === false;
  const [pickupEnabled, setPickupEnabled] = useState(shop?.fulfillment?.pickupEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(shop?.fulfillment?.deliveryEnabled ?? true);
  const [deliveryFee, setDeliveryFee] = useState<number>(shop?.fulfillment?.deliveryFee ?? 25);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(shop?.fulfillment?.freeDeliveryThreshold ?? 499);
  const [minOrderValueForDelivery, setMinOrderValueForDelivery] = useState<number>(shop?.fulfillment?.minOrderValueForDelivery ?? 0);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState<number>(shop?.fulfillment?.maxDeliveryRadiusKm ?? 5.0);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(shop?.fulfillment?.estimatedPreparationTimeMinutes ?? 20);
  const [pickupInstructions, setPickupInstructions] = useState(shop?.fulfillment?.pickupInstructions || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!shop) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateShopProfile({
        name,
        description,
        phone,
      });

      if (!isFulfillmentLockedByAdmin) {
        await updateFulfillmentSettings({
          pickupEnabled,
          deliveryEnabled,
          deliveryFee: Number(deliveryFee),
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
          minOrderValueForDelivery: Number(minOrderValueForDelivery),
          maxDeliveryRadiusKm: Number(maxDeliveryRadiusKm),
          estimatedPreparationTimeMinutes: Number(prepTimeMinutes),
          pickupInstructions,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to update shop profile', err);
      alert(err.message || 'Failed to update shop profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span>{language === 'hi' ? 'दुकान प्रोफाइल व सेटिंग्स' : 'Shop Profile & Settings'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'दुकान का विवरण, समय व डिलीवरी सेटिंग्स' : 'Business details, hours & fulfillment config'}
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold">
          {shop.category}
        </span>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{language === 'hi' ? 'दुकान का विवरण व सेटिंग्स सफलतापूर्वक सुरक्षित हो गईं!' : 'Shop profile & fulfillment settings updated successfully!'}</span>
        </div>
      )}

      {/* QR Code Card for Customers */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
            <QrCode className="w-4 h-4" />
            <span>{language === 'hi' ? 'ग्राहक दुकान QR कोड' : 'Customer Shop QR'}</span>
          </div>
          <div className="font-bold text-sm text-white">{shop.name}</div>
          <p className="text-[11px] text-slate-400">
            {language === 'hi' ? 'ग्राहक इसे स्कैन करके केवल आपकी दुकान देख सकते हैं' : 'Customers scan to open your isolated shop catalog'}
          </p>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-inner">
          <div className="w-full h-full border-2 border-slate-950 rounded flex items-center justify-center text-[10px] font-mono font-bold text-slate-950 text-center leading-tight">
            [SHOP QR]
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-5 shadow-md">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {language === 'hi' ? 'मुख्य जानकारी संपादित करें:' : 'Shop Details:'}
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {language === 'hi' ? 'दुकान का विवरण / विशेषता' : 'Description / Specialties'}
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {language === 'hi' ? 'संपर्क मोबाइल नंबर' : 'Contact Phone'}
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Operating Hours Info */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-bold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'hi' ? 'दुकान खुलने का समय:' : 'Operating Hours:'}</span>
          </div>
          <div className="text-white font-medium">
            {shop.operatingHours.openTime} - {shop.operatingHours.closeTime}
          </div>
          <div className="text-[11px] text-slate-400">
            Open Days: {shop.operatingHours.openDays ? shop.operatingHours.openDays.join(', ') : 'All Days (Mon - Sun)'}
          </div>
        </div>

        {/* Fulfillment Configuration Section */}
        <div className="pt-2 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {language === 'hi' ? 'डिलीवरी व स्टोर पिकअप सेटिंग्स (Fulfillment)' : 'Fulfillment & Delivery Settings'}
              </h3>
            </div>
            {isFulfillmentLockedByAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Admin Locked</span>
              </span>
            )}
          </div>

          {isFulfillmentLockedByAdmin && (
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'आपकी दुकान की डिलीवरी व पिकअप सेटिंग्स एडमिन द्वारा नियंत्रित हैं।'
                  : 'Fulfillment controls are managed and locked by platform administration.'}
              </span>
            </div>
          )}

          {/* Toggle Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Store Pickup Toggle */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              pickupEnabled ? 'bg-blue-950/30 border-blue-500/40' : 'bg-slate-950 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-950 text-blue-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{language === 'hi' ? 'स्टोर पिकअप' : 'Store Pickup'}</div>
                    <div className="text-[10px] text-slate-400">{language === 'hi' ? 'दुकान से उठाएं' : 'Counter pickup'}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={isFulfillmentLockedByAdmin}
                  checked={pickupEnabled}
                  onChange={(e) => setPickupEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer rounded disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Home Delivery Toggle */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              deliveryEnabled ? 'bg-purple-950/30 border-purple-500/40' : 'bg-slate-950 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-950 text-purple-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}</div>
                    <div className="text-[10px] text-slate-400">{language === 'hi' ? 'घर तक पहुंचाएं' : 'Direct dispatch'}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={isFulfillmentLockedByAdmin}
                  checked={deliveryEnabled}
                  onChange={(e) => setDeliveryEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer rounded disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Delivery Parameters Inputs */}
          {deliveryEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'hi' ? 'डिलीवरी शुल्क (₹)' : 'Delivery Fee (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isFulfillmentLockedByAdmin}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'hi' ? 'मुफ्त डिलीवरी सीमा (₹)' : 'Free Delivery Above (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isFulfillmentLockedByAdmin}
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'hi' ? 'न्यूनतम आर्डर राशि (₹)' : 'Min Order For Delivery (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isFulfillmentLockedByAdmin}
                  value={minOrderValueForDelivery}
                  onChange={(e) => setMinOrderValueForDelivery(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {language === 'hi' ? 'अधिकतम दूरी (km)' : 'Max Delivery Radius (km)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  disabled={isFulfillmentLockedByAdmin}
                  value={maxDeliveryRadiusKm}
                  onChange={(e) => setMaxDeliveryRadiusKm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {/* Prep time and pickup instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {language === 'hi' ? 'तैयारी का अनुमानित समय (मिनट)' : 'Prep Time (Minutes)'}
              </label>
              <input
                type="number"
                min="5"
                step="5"
                disabled={isFulfillmentLockedByAdmin}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {language === 'hi' ? 'पिकअप निर्देश / काउंटर नोट' : 'Pickup Instructions'}
              </label>
              <input
                type="text"
                disabled={isFulfillmentLockedByAdmin}
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: काउंटर 1 पर आर्डर ID दिखाएं' : 'e.g. Collect at counter 1'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950 flex items-center justify-center space-x-1.5 transition-all"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{language === 'hi' ? 'प्रोफाइल व सेटिंग्स सुरक्षित करें' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </form>

      {/* Logout button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="w-full py-3 rounded-2xl bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
        >
          <Power className="w-4 h-4" />
          <span>{t('login.logout', 'Logout from Seller Hub')}</span>
        </button>
      </div>
    </div>
  );
};
