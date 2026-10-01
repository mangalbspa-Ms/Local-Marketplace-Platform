import React, { useState } from 'react';
import {
  Phone,
  X,
  Building,
  MapPin,
  Navigation,
  MessageSquare,
  Mail,
  Pencil,
  Check,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface SellerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellerContactModal: React.FC<SellerContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { shop, updateShopProfile } = useSellerAuth();
  const { t } = useSellerLanguage();

  const [activeEditField, setActiveEditField] = useState<'phone' | 'whatsapp' | 'email' | null>(null);
  const [phoneInput, setPhoneInput] = useState(shop?.phone || '');
  const [whatsappInput, setWhatsappInput] = useState((shop as any)?.whatsapp || shop?.phone || '');
  const [emailInput, setEmailInput] = useState(shop?.email || '');
  const [sameAsShopPhone, setSameAsShopPhone] = useState(
    ((shop as any)?.whatsapp || '') === (shop?.phone || '')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !shop) return null;

  const handleStartEdit = (field: 'phone' | 'whatsapp' | 'email') => {
    setActiveEditField(field);
    setPhoneInput(shop.phone || '');
    setWhatsappInput((shop as any)?.whatsapp || shop.phone || '');
    setEmailInput(shop.email || '');
  };

  const handleCancelEdit = () => {
    setActiveEditField(null);
  };

  const handleSaveField = async (field: 'phone' | 'whatsapp' | 'email') => {
    setIsSaving(true);
    try {
      if (field === 'phone') {
        const newPhone = phoneInput.trim();
        await updateShopProfile({
          phone: newPhone,
          ...(sameAsShopPhone ? { whatsapp: newPhone } : {}),
        });
        if (sameAsShopPhone) setWhatsappInput(newPhone);
      } else if (field === 'whatsapp') {
        await updateShopProfile({
          whatsapp: whatsappInput.trim(),
        });
      } else if (field === 'email') {
        await updateShopProfile({
          email: emailInput.trim(),
        });
      }
      setActiveEditField(null);
      setSaveSuccessMsg(t('contact.success'));
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update contact info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="modal-seller-contact-info"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 px-2.5 sm:px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-md max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Fixed at top, never clipped) */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">
                {t('contact.title')}
              </h3>
              <p className="text-[11px] text-cyan-300/70 truncate">
                {t('contact.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-contact-modal"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition cursor-pointer shrink-0 ml-2"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="px-4 pt-3 bg-[#070e24] shrink-0">
            <div className="py-2 px-3 rounded-xl bg-emerald-950/95 border border-emerald-400/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="break-words">{saveSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Modal Body — ONLY Contact Information (Smooth vertical scrolling) */}
        <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 text-xs overflow-y-auto overscroll-contain flex-1">
          {/* 1. दुकान का मोबाइल नंबर */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-bold truncate">{t('contact.phone')}</span>
              </div>
              {activeEditField !== 'phone' && (
                <button
                  type="button"
                  id="btn-edit-shop-phone"
                  onClick={() => handleStartEdit('phone')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition text-xs font-semibold flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{t('common.change')}</span>
                </button>
              )}
            </div>

            {activeEditField === 'phone' ? (
              <div className="space-y-2.5 pt-1">
                <input
                  type="tel"
                  id="input-edit-shop-phone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 inline" />
                    <span>{t('common.cancel')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveField('phone')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{t('common.save')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-mono font-bold text-white pl-6 break-words">
                {shop.phone || '+91 98290 12345'}
              </p>
            )}
          </div>

          {/* 2. WhatsApp नंबर */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-bold truncate">{t('contact.whatsapp')}</span>
              </div>
              {activeEditField !== 'whatsapp' && (
                <button
                  type="button"
                  id="btn-edit-shop-whatsapp"
                  onClick={() => handleStartEdit('whatsapp')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition text-xs font-semibold flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{t('common.change')}</span>
                </button>
              )}
            </div>

            {activeEditField === 'whatsapp' ? (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[10px] text-cyan-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsShopPhone}
                      onChange={(e) => {
                        setSameAsShopPhone(e.target.checked);
                        if (e.target.checked) setWhatsappInput(shop.phone || '');
                      }}
                      className="w-3.5 h-3.5 accent-cyan-500 rounded"
                    />
                    <span>{t('contact.same_as_phone')}</span>
                  </label>
                </div>
                <input
                  type="tel"
                  id="input-edit-shop-whatsapp"
                  value={whatsappInput}
                  disabled={sameAsShopPhone}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 disabled:opacity-75"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 inline" />
                    <span>{t('common.cancel')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveField('whatsapp')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{t('common.save')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-mono font-bold text-emerald-400 pl-6 break-words">
                {(shop as any)?.whatsapp || shop.phone || '+91 98290 12345'}
              </p>
            )}
          </div>

          {/* 3. दुकान का Email */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-bold truncate">{t('contact.email')}</span>
              </div>
              {activeEditField !== 'email' && (
                <button
                  type="button"
                  id="btn-edit-shop-email"
                  onClick={() => handleStartEdit('email')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition text-xs font-semibold flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{t('common.change')}</span>
                </button>
              )}
            </div>

            {activeEditField === 'email' ? (
              <div className="space-y-2.5 pt-1">
                <input
                  type="email"
                  id="input-edit-shop-email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="shop@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white font-medium text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 inline" />
                    <span>{t('common.cancel')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveField('email')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{t('common.save')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-200 pl-6 break-all">
                {shop.email || 'shop@example.com'}
              </p>
            )}
          </div>

          {/* 4. दुकान का पंजीकृत पता */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
            <div className="flex items-center space-x-2 min-w-0">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-[11px] text-slate-400 font-bold truncate">{t('contact.address')}</span>
            </div>
            <p className="text-xs font-medium text-slate-200 pl-6 leading-relaxed break-words">
              {shop.address || 'Shop No. 12-14, Flower Market Galli, Dadar West, Mumbai 400028'}
            </p>
            <div className="pl-6 pt-1 flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">{t('contact.pincode')}</span>
              <span className="font-mono font-bold text-cyan-300">
                {shop.pincode || shop.postalData?.pincode || '400028'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Fixed at bottom, never behind bottom nav) */}
        <div className="p-3 sm:p-3.5 border-t border-cyan-500/20 bg-[#070e24] shrink-0">
          <button
            type="button"
            id="btn-close-contact-modal-footer"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
