/**
 * Shop Status Modal / Screen (Screen 3)
 * Manage Open/Close status, closing reason, next opening time, and fulfillment options.
 */

import React, { useState } from 'react';
import {
  Power,
  X,
  Clock,
  ShoppingBag,
  Truck,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useSellerAuth } from '../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../context/SellerLanguageContext.tsx';

interface ShopStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopStatusModal: React.FC<ShopStatusModalProps> = ({ isOpen, onClose }) => {
  const { shop, toggleShopStatus, updateFulfillmentSettings } = useSellerAuth();
  const { language, t } = useSellerLanguage();

  const isFulfillmentLockedByAdmin = shop?.fulfillment?.sellerCanManageFulfillment === false;

  const [shopOpen, setShopOpen] = useState(shop?.isOpenNow ?? shop?.isOpen ?? true);
  const [closedReason, setClosedReason] = useState(shop?.closedReason || '');
  const [nextOpenTime, setNextOpenTime] = useState(shop?.reopenTime || 'Tomorrow 08:00 AM');
  const [pickupEnabled, setPickupEnabled] = useState(shop?.fulfillment?.pickupEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(shop?.fulfillment?.deliveryEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !shop) return null;

  const quickReasons = [
    { hi: 'लंच ब्रेक (1 घंटा)', en: 'Lunch Break (1 hr)' },
    { hi: 'स्टॉक रिफिल / नया माल आगमन', en: 'Stock Restocking / Arrival' },
    { hi: 'मार्केट साप्ताहिक छुट्टी', en: 'Market Weekly Holiday' },
    { hi: 'दुकान सफाई व मेंटेनेंस', en: 'Shop Cleaning & Maintenance' },
    { hi: 'आज के लिए आर्डर पूरे हो गए', en: 'Order capacity full for today' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await toggleShopStatus(shopOpen, shopOpen ? undefined : closedReason, shopOpen ? undefined : nextOpenTime);
      if (!isFulfillmentLockedByAdmin) {
        await updateFulfillmentSettings({
          pickupEnabled,
          deliveryEnabled,
        });
      }
      setSuccessMessage(language === 'hi' ? 'दुकान की स्थिति सफलतापूर्वक अपडेट हो गई!' : 'Shop status successfully updated!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to update shop status', err);
      alert(err.message || 'Failed to update shop status');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${shopOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {language === 'hi' ? 'दुकान चालू / बंद स्थिति' : 'Shop Operational Status'}
              </h2>
              <p className="text-xs text-slate-500">{shop.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Main On/Off Switch */}
          <div className={`p-4 rounded-2xl border transition-all ${
            shopOpen
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-red-50/70 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {language === 'hi' ? 'दुकान की मुख्य स्थिति' : 'Primary Shop Status'}
                </span>
                <h3 className="text-base font-extrabold mt-0.5 text-slate-900 flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${shopOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span>{shopOpen ? t('shop.status.open') : t('shop.status.closed')}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {shopOpen
                    ? (language === 'hi' ? 'ग्राहक आपकी दुकान से आर्डर कर सकते हैं' : 'Customers can browse and place orders')
                    : (language === 'hi' ? 'दुकान बंद दिखेगी, कोई नया आर्डर नहीं आएगा' : 'Shop is marked closed, new orders paused')}
                </p>
              </div>

              {/* Large Toggle */}
              <button
                type="button"
                onClick={() => setShopOpen(!shopOpen)}
                className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center shadow-inner cursor-pointer ${
                  shopOpen ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[10px] text-slate-900">
                  {shopOpen ? 'ON' : 'OFF'}
                </div>
              </button>
            </div>
          </div>

          {/* Offline Reason & Next Open Time if closed */}
          {!shopOpen && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {language === 'hi' ? 'दुकान बंद करने का कारण चुनें:' : 'Reason for Closing:'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickReasons.map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setClosedReason(language === 'hi' ? r.hi : r.en)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        closedReason === (language === 'hi' ? r.hi : r.en)
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'hi' ? r.hi : r.en}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={closedReason}
                  onChange={(e) => setClosedReason(e.target.value)}
                  placeholder={language === 'hi' ? 'या अन्य कारण यहाँ लिखें...' : 'Or enter custom reason...'}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'hi' ? 'दुकान पुनः कब खुलेगी?' : 'Expected Reopening Time:'}</span>
                </label>
                <input
                  type="text"
                  value={nextOpenTime}
                  onChange={(e) => setNextOpenTime(e.target.value)}
                  placeholder="e.g. Today 04:00 PM / Tomorrow 08:00 AM"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Fulfillment Modes */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {language === 'hi' ? 'आर्डर प्राप्ति विकल्प (Fulfillment)' : 'Fulfillment Channels'}
              </h4>
              {isFulfillmentLockedByAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  🔒 {language === 'hi' ? 'एडमिन द्वारा प्रबंधित' : 'Admin Governed'}
                </span>
              )}
            </div>

            {isFulfillmentLockedByAdmin && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {language === 'hi'
                    ? 'आपकी दुकान के डिलीवरी व पिकअप विकल्प एडमिन द्वारा लॉक किए गए हैं।'
                    : 'Fulfillment options for your shop are locked by platform administration.'}
                </span>
              </div>
            )}

            {/* Store Pickup */}
            <div className={`p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between ${isFulfillmentLockedByAdmin ? 'opacity-60' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{t('shop.status.pickup_enabled')}</div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'ग्राहक दुकान पर आकर सामान उठाएंगे' : 'Customers collect from shop counter'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={isFulfillmentLockedByAdmin}
                checked={pickupEnabled}
                onChange={(e) => setPickupEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Home Delivery */}
            <div className={`p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between ${isFulfillmentLockedByAdmin ? 'opacity-60' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{t('shop.status.delivery_enabled')}</div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'दुकान या डिलीवरी बॉय द्वारा घर पहुँचाएं' : 'Dispatched to customer address'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={isFulfillmentLockedByAdmin}
                checked={deliveryEnabled}
                onChange={(e) => setDeliveryEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center space-x-2.5 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{language === 'hi' ? 'स्थिति लागू करें' : 'Save Status'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
