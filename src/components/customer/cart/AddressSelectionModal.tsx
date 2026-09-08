/**
 * Address Selection & Management Modal
 * 
 * Allows customer to select delivery address, add new address with landmark,
 * and set default addresses for local market deliveries.
 */

import React, { useState } from 'react';
import { useCustomerAuth } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { UserAddress } from '../../../types/auth.ts';
import { MapPin, Plus, Check, Trash2, Home, Briefcase, Building, Sparkles } from 'lucide-react';

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, selectedAddress, setSelectedAddress, addAddress, deleteAddress, setDefaultAddress } =
    useCustomerAuth();
  const { language, t } = useCustomerLanguage();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [label, setLabel] = useState('Home');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('Dadar West');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400028');
  const [isDefault, setIsDefault] = useState(false);

  if (!isOpen) return null;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim()) return;

    await addAddress({
      label,
      streetAddress: streetAddress.trim(),
      landmark: landmark.trim(),
      area,
      city,
      pincode,
      isDefault,
    });

    setIsAddingNew(false);
    setStreetAddress('');
    setLandmark('');
  };

  const addresses = user?.addresses || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('deliveryAddress')}</h3>
              <p className="text-[10px] text-slate-500">
                {language === 'hi' ? 'सामान प्राप्त करने का स्थान चुनें' : 'Choose where to deliver your orders'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Existing Addresses List */}
        {!isAddingNew ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {(addr.label || '').toLowerCase().includes('work') ? (
                          <Briefcase className="w-3.5 h-3.5" />
                        ) : (
                          <Home className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-tight">
                          {addr.streetAddress}
                        </p>
                        {addr.landmark && (
                          <p className="text-[10px] text-slate-500">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500">
                          {addr.area}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(addr.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Address Button */}
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? '+ नया पता जोड़ें' : '+ Add New Delivery Address'}</span>
            </button>
          </div>
        ) : (
          /* Add New Address Form */
          <form onSubmit={handleSaveAddress} className="space-y-3">
            {/* Label selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'पते का प्रकार:' : 'Address Label:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      label === l
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Flat / Building / Street */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'घर / फ्लैट नं. व सड़क का नाम:' : 'House/Flat No., Building & Street:'}
              </label>
              <textarea
                required
                rows={2}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Flat 302, Sai Shraddha Apts, Ranade Road"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {language === 'hi' ? 'लैंडमार्क (पहचान चिन्ह):' : 'Nearby Landmark (optional):'}
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opp. Shiv Sena Bhavan"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Area, City, Pincode */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Area</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Make Default checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{language === 'hi' ? 'इसे प्राथमिक पता बनाएं' : 'Make this my default address'}</span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
              >
                {language === 'hi' ? 'सहेजें व चुनें' : 'Save Address'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
