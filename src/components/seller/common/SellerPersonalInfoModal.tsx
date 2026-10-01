import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Pencil,
  Camera,
  Check,
  RotateCcw,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface SellerPersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditableField = 'name' | 'phone' | 'email' | null;

export const SellerPersonalInfoModal: React.FC<SellerPersonalInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateSellerProfile, updateSellerPhoto } = useSellerAuth();
  const { t } = useSellerLanguage();

  const [activeEditField, setActiveEditField] = useState<EditableField>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs whenever user changes or modal opens
  useEffect(() => {
    if (user) {
      setNameInput(user.fullName || (user as any).name || '');
      setPhoneInput(user.phone || '');
      setEmailInput(user.email || '');
    }
  }, [user, isOpen]);

  // Clear messages when active edit field changes
  useEffect(() => {
    setErrorMessage(null);
  }, [activeEditField]);

  if (!isOpen || !user) return null;

  const handleStartEdit = (field: EditableField) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (field === 'name') setNameInput(user.fullName || (user as any).name || '');
    if (field === 'phone') setPhoneInput(user.phone || '');
    if (field === 'email') setEmailInput(user.email || '');
    setActiveEditField(field);
  };

  const handleCancelEdit = () => {
    setErrorMessage(null);
    if (user) {
      setNameInput(user.fullName || (user as any).name || '');
      setPhoneInput(user.phone || '');
      setEmailInput(user.email || '');
    }
    setActiveEditField(null);
  };

  const handleSaveField = async (field: 'name' | 'phone' | 'email') => {
    setErrorMessage(null);
    setIsSaving(true);
    try {
      if (field === 'name') {
        const trimmed = nameInput.trim();
        if (!trimmed) {
          setErrorMessage('कृपया दुकानदार का वैध नाम दर्ज करें (Name cannot be empty)');
          setIsSaving(false);
          return;
        }
        await updateSellerProfile({ fullName: trimmed });
        setSuccessMessage('नाम सफलतापूर्वक सुरक्षित किया गया (Name updated successfully)');
      } else if (field === 'phone') {
        const cleanPhone = phoneInput.trim();
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          setErrorMessage('कृपया कम से कम 10 अंकों का वैध मोबाइल नंबर दर्ज करें');
          setIsSaving(false);
          return;
        }
        const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${digitsOnly.slice(-10)}`;
        await updateSellerProfile({ phone: formattedPhone });
        setSuccessMessage('मोबाइल नंबर सुरक्षित किया गया (Phone number updated)');
      } else if (field === 'email') {
        const trimmed = emailInput.trim();
        if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          setErrorMessage('कृपया वैध ईमेल ID दर्ज करें (Invalid email format)');
          setIsSaving(false);
          return;
        }
        await updateSellerProfile({ email: trimmed });
        setSuccessMessage('ईमेल ID सफलतापूर्वक सुरक्षित की गई (Email updated)');
      }
      setActiveEditField(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'परिवर्तन सुरक्षित करने में विफल (Failed to save)');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया वैध फोटो फ़ाइल (JPG/PNG/WebP) चुनें');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('फ़ाइल का आकार 5MB से कम होना चाहिए (Max 5MB)');
      return;
    }

    setIsPhotoUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await updateSellerPhoto({
          type: 'profile',
          action: 'set',
          imageData: base64Data,
        });
        setSuccessMessage('प्रोफाइल फोटो सफलतापूर्वक बदली गई (Photo updated)');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'फोटो अपलोड करने में विफल (Photo upload failed)');
      } finally {
        setIsPhotoUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('फोटो पढ़ने में त्रुटि हुई');
      setIsPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCloseModal = () => {
    // ✕ must ONLY close this panel and discard any uncommitted edits
    handleCancelEdit();
    onClose();
  };

  const currentPhoto = user.profilePhotoUrl || user.avatarUrl;
  const sellerDisplayName = user.fullName || (user as any).name || 'दुकानदार';

  return (
    <div
      id="modal-personal-info-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[104px] sm:pt-[108px] pb-24 sm:pb-28 px-2.5 sm:px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={handleCloseModal}
    >
      <div
        id="modal-personal-info"
        className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-md max-h-[calc(100dvh-185px)] sm:max-h-[calc(100vh-190px)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Panel Header (Fixed at top, never clipped) */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate">{t('personal.title')}</h3>
              <p className="text-[11px] text-cyan-300/80 truncate">{t('personal.subtitle')}</p>
            </div>
          </div>
          {/* Top-Right ✕ Close Button */}
          <button
            type="button"
            id="personal-info-close-btn"
            onClick={handleCloseModal}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer shrink-0 ml-2"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input for Profile Photo */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoFileChange}
        />

        {/* 2. Scrollable Body (Smooth vertical scrolling inside modal) */}
        <div className="p-3.5 sm:p-4 space-y-3 text-xs overflow-y-auto overscroll-contain flex-1">
          {/* Feedback Toasts */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
              <span className="break-words">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-100 ml-2 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5 break-words">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {successMessage}
              </span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-400 hover:text-emerald-100 ml-2 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 2. D. 🖼️ प्रोफाइल फोटो (Profile Photo Card) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-cyan-950/60 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={sellerDisplayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-300 font-bold text-lg sm:text-xl">
                    {sellerDisplayName.charAt(0) || 'द'}
                  </div>
                )}
                {isPhotoUploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-medium block">🖼️ {t('personal.photo')}</span>
                <h4 className="font-bold text-white text-xs sm:text-sm truncate">{sellerDisplayName}</h4>
                <span className="text-[10px] text-cyan-300/80 truncate block">{t('personal.photo_sub')}</span>
              </div>
            </div>

            <button
              type="button"
              id="change-seller-photo-btn"
              disabled={isPhotoUploading}
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-[11px] sm:text-xs flex items-center space-x-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition shrink-0 cursor-pointer active:scale-95"
            >
              {isPhotoUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('personal.uploading')}</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t('personal.change_photo')}</span>
                </>
              )}
            </button>
          </div>

          {/* Rows/Cards for Personal Information */}
          <div className="space-y-2.5 sm:space-y-3">
            {/* 2. A. 👤 दुकानदार का नाम */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-bold truncate">👤 {t('personal.name')}</span>
                </div>
                {activeEditField !== 'name' && (
                  <button
                    type="button"
                    id="edit-seller-name-btn"
                    onClick={() => handleStartEdit('name')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition text-xs font-semibold flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{t('common.change')}</span>
                  </button>
                )}
              </div>

              {activeEditField === 'name' ? (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    id="input-seller-name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t('personal.name_placeholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white font-medium text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                  />
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('common.cancel')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveField('name')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>{t('common.save')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-bold text-white pl-6 break-words">
                  {sellerDisplayName}
                </p>
              )}
            </div>

            {/* 2. B. 📱 मोबाइल नंबर */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-bold truncate">📱 {t('personal.phone')}</span>
                </div>
                {activeEditField !== 'phone' && (
                  <button
                    type="button"
                    id="edit-seller-phone-btn"
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
                    id="input-seller-phone"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={t('personal.phone_placeholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white font-mono font-medium text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                  />
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('common.cancel')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveField('phone')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>{t('common.save')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-mono font-bold text-white pl-6 break-words">
                  {user.phone || t('personal.no_phone')}
                </p>
              )}
            </div>

            {/* 2. C. 📧 ईमेल ID */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-bold truncate">📧 {t('personal.email')}</span>
                </div>
                {activeEditField !== 'email' && (
                  <button
                    type="button"
                    id="edit-seller-email-btn"
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
                    id="input-seller-email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t('personal.email_placeholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white font-medium text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    autoFocus
                  />
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('common.cancel')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveField('email')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>{t('common.save')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-200 pl-6 break-all">
                  {user.email || t('personal.no_email')}
                </p>
              )}
            </div>

            {/* 2. E. 🛡️ सत्यापन स्थिति (Display-Only) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-medium block">🛡️ {t('personal.verification')}</span>
                  <span className="font-bold text-white text-xs truncate block">{t('personal.verified_account')}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)] flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Check className="w-3 h-3" />
                {t('personal.verified_badge')}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Panel Footer (Fixed at bottom, never hidden behind bottom nav) */}
        <div className="p-3 sm:p-3.5 border-t border-cyan-500/20 bg-[#070e24] shrink-0">
          <button
            type="button"
            id="personal-info-footer-close-btn"
            onClick={handleCloseModal}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
