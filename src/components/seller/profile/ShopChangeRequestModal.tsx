import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Send,
  AlertCircle,
  Check,
  Loader2,
  Clock,
  MapPin,
  Store,
  CreditCard,
  Building,
  Navigation,
} from 'lucide-react';
import { Shop, ShopChangeRequest, MarketCoordinates, LocationSource } from '../../../types/market';
import { sellerApi } from '../../../services/sellerApi';
import { GoogleMapsLocationPickerModal } from './GoogleMapsLocationPickerModal';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface ShopChangeRequestModalProps {
  isOpen: boolean;
  shop: Shop;
  initialField?: 'name' | 'category' | 'address' | 'coordinates' | 'upiPayoutId';
  onClose: () => void;
  onSubmitted?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

const LOCKED_FIELD_OPTIONS = [
  {
    id: 'name',
    labelHi: 'दुकान का नाम (Shop Name)',
    labelEn: 'Shop Name',
    icon: Store,
    placeholderHi: 'नई दुकान का नाम दर्ज करें',
    placeholderEn: 'Enter new shop name',
  },
  {
    id: 'category',
    labelHi: 'दुकान की श्रेणी (Category)',
    labelEn: 'Category',
    icon: Building,
    placeholderHi: 'नई श्रेणी चुनें',
    placeholderEn: 'Select new category',
  },
  {
    id: 'address',
    labelHi: 'दुकान का पता व पिनकोड (Address & Pincode)',
    labelEn: 'Address & Pincode',
    icon: MapPin,
    placeholderHi: 'नया पता व 6-अंकीय पिनकोड दर्ज करें',
    placeholderEn: 'Enter new address and 6-digit pincode',
  },
  {
    id: 'coordinates',
    labelHi: 'दुकान की Google Maps लोकेशन (Coordinates)',
    labelEn: 'Google Maps Location (Coordinates)',
    icon: Navigation,
    placeholderHi: 'मैप से नई लोकेशन चुनें',
    placeholderEn: 'Select new location from map',
  },
  {
    id: 'upiPayoutId',
    labelHi: 'UPI भुगतान आईडी (UPI Payout ID)',
    labelEn: 'UPI Payout ID',
    icon: CreditCard,
    placeholderHi: 'उदा. username@okaxis या bank upi id',
    placeholderEn: 'e.g. username@okaxis or bank upi id',
  },
];

const SHOP_CATEGORIES = [
  { hi: 'किराना एवं जनरल स्टोर (Grocery & Kirana)', en: 'Grocery & Kirana' },
  { hi: 'ताज़ी सब्जी एवं फल (Fresh Fruits & Vegetables)', en: 'Fresh Fruits & Vegetables' },
  { hi: 'डेयरी एवं मिठाई (Dairy & Sweets)', en: 'Dairy & Sweets' },
  { hi: 'जनरल एवं स्टेशनरी (General Store)', en: 'General Store & Stationery' },
  { hi: 'मेडिकल एवं फार्मेसी (Pharmacy & Medical)', en: 'Pharmacy & Medical' },
  { hi: 'बेकरी एवं कन्फेक्शनरी (Bakery & Snacks)', en: 'Bakery & Snacks' },
  { hi: 'पूजा सामग्री एवं मसाले (Spices & Puja Needs)', en: 'Spices & Puja Needs' },
  { hi: 'अन्य स्थानीय विक्रेता (Other Local Merchant)', en: 'Other Local Merchant' },
];

export const ShopChangeRequestModal: React.FC<ShopChangeRequestModalProps> = ({
  isOpen,
  shop,
  initialField = 'name',
  onClose,
  onSubmitted,
  onShowToast,
}) => {
  const { language } = useSellerLanguage();
  const isHindi = language === 'hi';

  const [selectedField, setSelectedField] = useState<string>(initialField);
  const [newValueText, setNewValueText] = useState('');
  const [newCoordinates, setNewCoordinates] = useState<MarketCoordinates | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Existing requests
  const [existingRequests, setExistingRequests] = useState<ShopChangeRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedField(initialField);
      setNewValueText('');
      setNewCoordinates(null);
      setReason('');
      fetchExistingRequests();
    }
  }, [isOpen, initialField, shop.id]);

  const fetchExistingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await sellerApi.getChangeRequests(shop.id);
      setExistingRequests(data || []);
    } catch (err) {
      console.warn('Could not fetch change requests', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  if (!isOpen) return null;

  const currentFieldValue = () => {
    switch (selectedField) {
      case 'name':
        return shop.name;
      case 'category':
        return shop.category;
      case 'address':
        return typeof shop.address === 'string' ? shop.address : JSON.stringify(shop.address);
      case 'coordinates':
        return shop.coordinates
          ? `${shop.coordinates.lat.toFixed(5)}° N, ${shop.coordinates.lng.toFixed(5)}° E`
          : (isHindi ? 'सेट नहीं है' : 'Not set');
      case 'upiPayoutId':
        return (shop as any)?.upiPayoutId || shop.financials?.payoutUpiId || (isHindi ? 'सेट नहीं है' : 'Not set');
      default:
        return '';
    }
  };

  const hasPendingRequestForField = existingRequests.some(
    (req) => req.status === 'PENDING' && req.requestedFields && req.requestedFields[selectedField] !== undefined
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      onShowToast?.(
        isHindi
          ? 'कृपया बदलाव का कारण (Reason) दर्ज करें'
          : 'Please enter the reason for this change',
        'error'
      );
      return;
    }

    let valToSubmit: any = newValueText.trim();
    if (selectedField === 'coordinates') {
      if (!newCoordinates) {
        onShowToast?.(
          isHindi
            ? 'कृपया मैप से नई लोकेशन चुनें'
            : 'Please choose the new location from the map',
          'error'
        );
        return;
      }
      valToSubmit = newCoordinates;
    } else if (!newValueText.trim()) {
      onShowToast?.(
        isHindi
          ? 'कृपया नया मान (New value) दर्ज करें'
          : 'Please enter the new value',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerApi.submitChangeRequest(shop.id, {
        requestedFields: {
          [selectedField]: valToSubmit,
        },
        reason: reason.trim(),
      });

      onShowToast?.(
        isHindi
          ? 'बदलाव अनुरोध सफलतापूर्वक जमा हो गया! एडमिन समीक्षा के बाद यह लागू होगा।'
          : 'Change request submitted successfully! It will apply after admin review.',
        'success'
      );
      onSubmitted?.();
      fetchExistingRequests();
      setNewValueText('');
      setNewCoordinates(null);
      setReason('');
    } catch (err: any) {
      onShowToast?.(err?.message || (isHindi ? 'अनुरोध भेजने में विफल' : 'Failed to submit request'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="shop-change-request-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-amber-500/30 rounded-3xl p-4 sm:p-5 w-full max-w-lg text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] space-y-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>{isHindi ? 'सत्यापित विवरण में बदलाव अनुरोध' : 'Change Request for Verified Details'}</span>
              </h3>
              <p className="text-[11px] text-amber-300/80">
                {isHindi
                  ? 'सत्यापित दुकानों के मुख्य विवरण में संशोधन हेतु एडमिन अनुमति आवश्यक है'
                  : 'Admin approval is required to modify primary verified details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Active Pending Warning Banner if applicable */}
          {hasPendingRequestForField && (
            <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {isHindi ? 'अनुरोध समीक्षाधीन है (Pending Approval)' : 'Request Under Review (Pending Approval)'}
                </span>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  {isHindi
                    ? 'इस फील्ड के लिए आपका अनुरोध पहले से एडमिन के पास विचाराधीन है। नया अनुरोध भेजने से पहले एडमिन के निर्णय की प्रतीक्षा करें।'
                    : 'A change request for this field is already pending with the admin. Please await their review before submitting a new one.'}
                </p>
              </div>
            </div>
          )}

          {/* Select Field to Request Change */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {isHindi ? 'किस जानकारी में बदलाव करना चाहते हैं?' : 'Which detail would you like to change?'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {LOCKED_FIELD_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedField === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedField(opt.id);
                      setNewValueText('');
                      setNewCoordinates(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#070e24] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold truncate">
                      {isHindi ? opt.labelHi : opt.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Verified Value */}
          <div className="p-3 rounded-2xl bg-[#070e24] border border-cyan-500/20">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
              {isHindi ? 'वर्तमान सत्यापित मान (Current Verified Value):' : 'Current Verified Value:'}
            </span>
            <p className="text-xs text-cyan-200 font-semibold mt-1 break-words">
              {currentFieldValue()}
            </p>
          </div>

          {/* New Requested Value Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isHindi ? 'प्रस्तावित नया मान (New Requested Value)' : 'Proposed New Value'}{' '}
              <span className="text-rose-400">*</span>:
            </label>

            {selectedField === 'category' ? (
              <select
                value={newValueText}
                onChange={(e) => setNewValueText(e.target.value)}
                className="w-full px-3 py-2 bg-[#070e24] border border-amber-500/30 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="">{isHindi ? '-- नई श्रेणी चुनें --' : '-- Select New Category --'}</option>
                {SHOP_CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat.hi} className="bg-[#0b142c] text-white">
                    {isHindi ? cat.hi : cat.en}
                  </option>
                ))}
              </select>
            ) : selectedField === 'coordinates' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow"
                >
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>
                    {newCoordinates
                      ? (isHindi
                          ? `चयनित: ${newCoordinates.lat.toFixed(5)}° N, ${newCoordinates.lng.toFixed(5)}° E`
                          : `Selected: ${newCoordinates.lat.toFixed(5)}° N, ${newCoordinates.lng.toFixed(5)}° E`)
                      : (isHindi ? '🗺️ Google Maps से नई लोकेशन चुनें' : '🗺️ Select New Location from Google Maps')}
                  </span>
                </button>
                {newCoordinates && (
                  <p className="text-[11px] text-emerald-300 font-mono text-center">
                    {isHindi ? 'सटीक कोऑर्डिनेट्स:' : 'Precise Coordinates:'} {newCoordinates.lat.toFixed(6)}, {newCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={newValueText}
                onChange={(e) => setNewValueText(e.target.value)}
                placeholder={
                  isHindi
                    ? LOCKED_FIELD_OPTIONS.find((o) => o.id === selectedField)?.placeholderHi
                    : LOCKED_FIELD_OPTIONS.find((o) => o.id === selectedField)?.placeholderEn
                }
                className="w-full px-3 py-2 bg-[#070e24] border border-amber-500/30 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          {/* Reason for Change */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isHindi ? 'बदलाव का कारण (Reason for Change)' : 'Reason for Change'}{' '}
              <span className="text-rose-400">*</span>:
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isHindi
                  ? 'उदा. दुकान का नया पता शिफ्ट हुआ है / बैंक खाता अपडेट किया गया है'
                  : 'e.g. Shop shifted to a new location / bank account updated'
              }
              className="w-full px-3 py-2 bg-[#070e24] border border-amber-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Past Request History for this Shop */}
          {existingRequests.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
                {isHindi ? 'हाल के बदलाव अनुरोध (Recent Requests):' : 'Recent Change Requests:'}
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {existingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-[#070e24] border border-slate-800 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">
                        {Object.keys(req.requestedFields || {}).join(', ')}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {isHindi ? 'कारण:' : 'Reason:'} {req.reason}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] shrink-0 ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {req.status === 'APPROVED'
                        ? (isHindi ? 'स्वीकृत ✓' : 'Approved ✓')
                        : req.status === 'REJECTED'
                        ? (isHindi ? 'अस्वीकृत ❌' : 'Rejected ❌')
                        : (isHindi ? 'लंबित ⏳' : 'Pending ⏳')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            id="btn-submit-change-request"
            type="button"
            disabled={isSubmitting || hasPendingRequestForField}
            onClick={handleSubmit}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isHindi ? 'अनुरोध भेजें (Submit Request)' : 'Submit Request'}</span>
          </button>
        </div>
      </div>

      {/* Google Maps Location Picker Modal for New Coordinates */}
      {isMapPickerOpen && (
        <GoogleMapsLocationPickerModal
          isOpen={isMapPickerOpen}
          initialCoordinates={shop.coordinates}
          shopName={shop.name}
          onClose={() => setIsMapPickerOpen(false)}
          onSaveLocation={(coords) => {
            setNewCoordinates(coords);
            setIsMapPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
