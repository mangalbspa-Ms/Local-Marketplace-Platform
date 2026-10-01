/**
 * Seller Lock & Security Modal
 * 
 * Includes:
 * 1. App Lock (PIN and Fingerprint / Biometric authentication)
 * 2. Change PIN (requires current PIN before creating new PIN)
 * 3. Change Password (requires current password)
 * 4. Forgot Password / Recovery flow (using seller's registered phone / OTP)
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Shield,
  Smartphone,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { useSellerSecurity } from '../../../context/SellerSecurityContext.tsx';

interface SellerLockSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveView = 'MAIN' | 'ENABLE_LOCK' | 'DISABLE_LOCK' | 'CHANGE_PIN' | 'CHANGE_PASSWORD' | 'FORGOT_PASSWORD';

export const SellerLockSecurityModal: React.FC<SellerLockSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useSellerAuth();
  const { language } = useSellerLanguage();
  const {
    isAppLockEnabled,
    isBiometricSupported,
    isBiometricEnabled,
    isIframePreview,
    biometricNotice,
    pinLength,
    enableAppLock,
    disableAppLock,
    toggleBiometric,
    changePin,
    changePassword,
    requestPasswordRecovery,
    verifyRecoveryAndResetPassword,
    lockApp,
  } = useSellerSecurity();

  const [activeView, setActiveView] = useState<ActiveView>('MAIN');

  // Form states: Setup / Enable PIN
  const [setupPin, setSetupPin] = useState('');
  const [setupPinConfirm, setSetupPinConfirm] = useState('');
  const [setupBiometric, setSetupBiometric] = useState(false);

  // Form states: Disable Lock
  const [disableCurrentPin, setDisableCurrentPin] = useState('');

  // Form states: Change PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // Form states: Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Form states: Forgot Password / Recovery
  const [recoveryStep, setRecoveryStep] = useState<'REQUEST' | 'VERIFY_RESET'>('REQUEST');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryNewPassConfirm, setRecoveryNewPassConfirm] = useState('');
  const [recoveryMaskedTarget, setRecoveryMaskedTarget] = useState('');
  const [recoveryTestOtp, setRecoveryTestOtp] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Status banners
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingBio, setIsTogglingBio] = useState(false);

  if (!isOpen) return null;

  const resetFormState = () => {
    setActiveView('MAIN');
    setSetupPin('');
    setSetupPinConfirm('');
    setSetupBiometric(false);
    setDisableCurrentPin('');
    setCurrentPin('');
    setNewPin('');
    setNewPinConfirm('');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setRecoveryStep('REQUEST');
    setRecoveryOtp('');
    setRecoveryNewPass('');
    setRecoveryNewPassConfirm('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsTogglingBio(false);
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  // Biometric toggle handler
  const handleToggleBiometric = async () => {
    if (isTogglingBio) return;
    if (isIframePreview) {
      // In embedded Preview, platform biometric is unavailable due to iframe sandbox
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsTogglingBio(true);

    try {
      const nextState = !isBiometricEnabled;
      const res = await toggleBiometric(nextState);
      if (res.success) {
        setSuccessMsg(
          nextState
            ? (language === 'hi' ? 'बायोमेट्रिक अनलॉक सफलतापूर्वक चालू किया गया!' : 'Biometric unlock enabled successfully!')
            : (language === 'hi' ? 'बायोमेट्रिक अनलॉक बंद कर दिया गया।' : 'Biometric unlock disabled.')
        );
      } else {
        setErrorMsg(res.error || (language === 'hi' ? 'बायोमेट्रिक सक्षम नहीं हो सका' : 'Could not enable biometric unlock'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'hi' ? 'बायोमेट्रिक त्रुटि' : 'Biometric error'));
    } finally {
      setIsTogglingBio(false);
    }
  };

  // 1. Enable App Lock
  const handleEnableLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (setupPin.length < 4) {
      setErrorMsg(language === 'hi' ? 'पिन कम से कम 4 अंकों का होना चाहिए' : 'PIN must be at least 4 digits');
      return;
    }
    if (setupPin !== setupPinConfirm) {
      setErrorMsg(language === 'hi' ? 'दोनों पिन मेल नहीं खाते' : 'PINs do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await enableAppLock(setupPin, setupBiometric);
      if (res.success) {
        setSuccessMsg(language === 'hi' ? 'ऐप लॉक सफलतापूर्वक चालू हो गया!' : 'App Lock enabled successfully!');
        setTimeout(() => {
          setActiveView('MAIN');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'त्रुटि हुई');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Disable App Lock
  const handleDisableLock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!disableCurrentPin) {
      setErrorMsg(language === 'hi' ? 'कृपया वर्तमान पिन दर्ज करें' : 'Please enter current PIN');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await disableAppLock(disableCurrentPin);
      if (res.success) {
        setSuccessMsg(language === 'hi' ? 'ऐप लॉक बंद कर दिया गया है' : 'App Lock disabled');
        setTimeout(() => {
          setActiveView('MAIN');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'पिन अमान्य है');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Change PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPin) {
      setErrorMsg(language === 'hi' ? 'कृपया वर्तमान पिन दर्ज करें' : 'Please enter current PIN');
      return;
    }
    if (newPin.length < 4) {
      setErrorMsg(language === 'hi' ? 'नया पिन कम से कम 4 अंकों का होना चाहिए' : 'New PIN must be at least 4 digits');
      return;
    }
    if (newPin !== newPinConfirm) {
      setErrorMsg(language === 'hi' ? 'नया पिन और पुष्टि पिन मेल नहीं खाते' : 'New PIN and confirmation do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePin(currentPin, newPin);
      if (res.success) {
        setSuccessMsg(language === 'hi' ? 'सुरक्षा पिन सफलतापूर्वक बदल दिया गया!' : 'Security PIN updated successfully!');
        setTimeout(() => {
          setActiveView('MAIN');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'पिन बदलने में विफलता');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg(language === 'hi' ? 'कृपया वर्तमान पासवर्ड दर्ज करें' : 'Please enter current password');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(language === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setErrorMsg(language === 'hi' ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते' : 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMsg(language === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया!' : 'Password updated successfully!');
        setTimeout(() => {
          setActiveView('MAIN');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'पासवर्ड बदलने में विफलता');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Forgot Password Recovery
  const handleStartRecovery = async () => {
    setErrorMsg(null);
    setIsSendingOtp(true);
    try {
      const res = await requestPasswordRecovery();
      if (res.success) {
        setRecoveryMaskedTarget(res.maskedTarget);
        setRecoveryTestOtp(res.otp || null);
        setRecoveryStep('VERIFY_RESET');
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'रिकवरी शुरू करने में विफल');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleCompleteRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recoveryOtp || recoveryOtp.length < 4) {
      setErrorMsg(language === 'hi' ? 'कृपया मान्य 6-अंकों का OTP दर्ज करें' : 'Please enter valid OTP');
      return;
    }
    if (recoveryNewPass.length < 6) {
      setErrorMsg(language === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
      return;
    }
    if (recoveryNewPass !== recoveryNewPassConfirm) {
      setErrorMsg(language === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyRecoveryAndResetPassword(recoveryOtp, recoveryNewPass);
      if (res.success) {
        setSuccessMsg(language === 'hi' ? 'पासवर्ड सफलतापूर्वक रीसेट हो गया!' : 'Password reset successfully!');
        setTimeout(() => {
          setActiveView('MAIN');
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'अमान्य OTP');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-seller-lock-security"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start pt-[84px] sm:pt-[90px] pb-24 px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/30 rounded-3xl w-full max-w-sm text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-cyan-500/20 bg-[#070e24]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Lock className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">
                {language === 'hi' ? 'ताला और सुरक्षा (Lock & Security)' : 'Lock & Security'}
              </h3>
              <p className="text-[10px] text-cyan-300/80 font-medium">
                {language === 'hi' ? 'ऐप लॉक, पिन, बायोमेट्रिक व पासवर्ड सुरक्षा' : 'App lock, PIN, biometrics & password security'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-lock-security-modal"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-cyan-500/20 text-slate-400 hover:text-white hover:border-cyan-400 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 space-y-4 max-h-[calc(100dvh-200px)] overflow-y-auto">
          {/* Notification Banners */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: MAIN SECURITY DASHBOARD */}
          {activeView === 'MAIN' && (
            <div className="space-y-4">
              {/* SECTION 1: APP LOCK */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                      {isAppLockEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <span className="font-black text-xs text-white block">
                        {language === 'hi' ? 'ऐप लॉक (App Lock)' : 'App Lock'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {language === 'hi' ? 'पिन या फिंगरप्रिंट से ऐप सुरक्षित रखें' : 'Protect app with PIN or Fingerprint'}
                      </span>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle Action */}
                  {isAppLockEnabled ? (
                    <button
                      type="button"
                      id="btn-trigger-disable-lock"
                      onClick={() => {
                        setErrorMsg(null);
                        setActiveView('DISABLE_LOCK');
                      }}
                      className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/50 transition-colors"
                      title={language === 'hi' ? 'बंद करने के लिए क्लिक करें' : 'Click to disable'}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{language === 'hi' ? 'सक्रिय (Active)' : 'Active'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-trigger-enable-lock"
                      onClick={() => {
                        setErrorMsg(null);
                        setActiveView('ENABLE_LOCK');
                      }}
                      className="px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-black hover:bg-cyan-400 transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    >
                      {language === 'hi' ? 'चालू करें' : 'Enable'}
                    </button>
                  )}
                </div>

                {/* If App Lock is Enabled, show Biometric & PIN controls */}
                {isAppLockEnabled && (
                  <div className="pt-2 border-t border-cyan-500/10 space-y-2 text-xs">
                    {/* Biometric Toggle Row */}
                    <div
                      onClick={!isIframePreview ? handleToggleBiometric : undefined}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isIframePreview
                          ? 'bg-slate-900/40 border-slate-800/80'
                          : isTogglingBio
                          ? 'bg-slate-900/80 border-slate-800 cursor-wait opacity-75'
                          : 'bg-slate-900/80 border-slate-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mr-2">
                        <Fingerprint
                          className={`w-4 h-4 shrink-0 ${
                            isBiometricEnabled
                              ? 'text-cyan-400'
                              : isIframePreview
                              ? 'text-slate-500'
                              : isBiometricSupported
                              ? 'text-slate-400'
                              : 'text-slate-500'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {language === 'hi' ? 'बायोमेट्रिक अनलॉक (Biometric Unlock)' : 'Biometric Unlock'}
                          </span>
                          <span className="text-[10px] block leading-tight text-slate-400">
                            {isIframePreview
                              ? (language === 'hi'
                                  ? 'पूर्वावलोकन मोड: डिवाइस बायोमेट्रिक के लिए ऐप को सुरक्षित टॉप-लेवल ब्राउज़र टैब में खोलें। पूर्वावलोकन में पिन का उपयोग करें।'
                                  : 'Preview Mode: Device biometric authentication requires running in a supported secure top-level browser context. Use PIN in Preview.')
                              : isBiometricEnabled
                              ? (language === 'hi'
                                  ? 'सक्रिय: फिंगरप्रिंट / फेस आईडी से अनलॉक करें'
                                  : 'Active: Unlock with fingerprint / face ID')
                              : isBiometricSupported
                              ? (language === 'hi'
                                  ? 'डिवाइस फिंगरप्रिंट / फेस आईडी चालू करें'
                                  : 'Enable device fingerprint / face ID')
                              : biometricNotice
                              ? biometricNotice
                              : (language === 'hi'
                                  ? 'इस डिवाइस में बायोमेट्रिक सेंसर उपलब्ध नहीं है। पिन का उपयोग करें।'
                                  : 'No biometric sensor detected on this device. Use PIN instead.')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-toggle-biometric"
                        disabled={isIframePreview || isTogglingBio}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isIframePreview) {
                            handleToggleBiometric();
                          }
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                          isIframePreview
                            ? 'bg-slate-800 border border-slate-700/50 cursor-not-allowed opacity-40'
                            : isBiometricEnabled
                            ? 'bg-cyan-500 cursor-pointer'
                            : 'bg-slate-700 cursor-pointer'
                        } ${isTogglingBio ? 'opacity-60 cursor-wait' : ''}`}
                        title={
                          isIframePreview
                            ? (language === 'hi'
                                ? 'पूर्वावलोकन में बायोमेट्रिक प्रमाणीकरण अक्षम है'
                                : 'Biometric authentication is disabled in Preview')
                            : !isBiometricSupported
                            ? (language === 'hi'
                                ? 'डिवाइस पर बायोमेट्रिक सेंसर उपलब्ध नहीं है'
                                : 'Biometric sensor not available')
                            : (language === 'hi'
                                ? 'बायोमेट्रिक अनलॉक चालू या बंद करें'
                                : 'Toggle Biometric Unlock')
                        }
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                            isBiometricEnabled ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Change PIN Action */}
                    <button
                      type="button"
                      id="btn-trigger-change-pin"
                      onClick={() => {
                        setErrorMsg(null);
                        setActiveView('CHANGE_PIN');
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-bold text-xs">
                          {language === 'hi' ? 'सुरक्षा पिन बदलें (Change PIN)' : 'Change PIN'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    {/* Instant Lock Test Button */}
                    <button
                      type="button"
                      id="btn-instant-lock-now"
                      onClick={() => {
                        handleClose();
                        lockApp();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'अभी ऐप लॉक करें (Lock Now)' : 'Lock Now'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 2: PASSWORD SECURITY */}
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="font-black text-xs text-white">
                    {language === 'hi' ? 'पासवर्ड सुरक्षा (Password Security)' : 'Password Security'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* Change Password Option */}
                  <button
                    type="button"
                    id="btn-trigger-change-password"
                    onClick={() => {
                      setErrorMsg(null);
                      setActiveView('CHANGE_PASSWORD');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition cursor-pointer"
                  >
                    <span className="font-bold text-xs">
                      {language === 'hi' ? 'खाता पासवर्ड बदलें (Change Password)' : 'Change Password'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Forgot Password Option */}
                  <button
                    type="button"
                    id="btn-trigger-forgot-password"
                    onClick={() => {
                      setErrorMsg(null);
                      setActiveView('FORGOT_PASSWORD');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    <span className="font-semibold text-xs">
                      {language === 'hi' ? 'पासवर्ड भूल गए? (Forgot Password?)' : 'Forgot Password?'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ENABLE APP LOCK FORM */}
          {activeView === 'ENABLE_LOCK' && (
            <form onSubmit={handleEnableLock} className="space-y-3">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  {language === 'hi' ? 'नया सुरक्षा पिन बनाएं' : 'Create Security PIN'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'ऐप खोलने के लिए 4-अंकों का पिन दर्ज करें' : 'Enter 4-digit PIN to lock and unlock the app'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? '4-अंकों का पिन दर्ज करें' : 'Enter 4-digit PIN'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  id="input-setup-pin"
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-lg tracking-widest text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'पिन की पुष्टि करें' : 'Confirm PIN'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  id="input-setup-pin-confirm"
                  value={setupPinConfirm}
                  onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-lg tracking-widest text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Biometric Toggle during setup if supported */}
              {isBiometricSupported && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      {language === 'hi' ? 'साथ ही बायोमेट्रिक भी चालू करें' : 'Also enable Biometric'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={setupBiometric}
                    onChange={(e) => setSetupBiometric(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveView('MAIN')}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="btn-save-enable-lock"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  {language === 'hi' ? 'पिन बनाएं व चालू करें' : 'Save PIN & Enable'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: DISABLE APP LOCK FORM */}
          {activeView === 'DISABLE_LOCK' && (
            <form onSubmit={handleDisableLock} className="space-y-3">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-rose-950 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-2">
                  <Unlock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  {language === 'hi' ? 'ऐप लॉक बंद करें' : 'Disable App Lock'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'पुष्टि के लिए अपना वर्तमान सुरक्षा पिन दर्ज करें' : 'Enter your current PIN to confirm disabling'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'वर्तमान पिन' : 'Current PIN'}
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  id="input-disable-current-pin"
                  value={disableCurrentPin}
                  onChange={(e) => setDisableCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-lg tracking-widest text-white focus:outline-none focus:border-rose-400"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveView('MAIN')}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="btn-confirm-disable-lock"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer"
                >
                  {language === 'hi' ? 'ऐप लॉक बंद करें' : 'Disable App Lock'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: CHANGE PIN FORM */}
          {activeView === 'CHANGE_PIN' && (
            <form onSubmit={handleChangePin} className="space-y-3">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  {language === 'hi' ? 'सुरक्षा पिन बदलें' : 'Change PIN'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'नया पिन बनाने के लिए पहले वर्तमान पिन दर्ज करें' : 'Current PIN is required before creating a new PIN'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? '1. वर्तमान पिन दर्ज करें' : '1. Current PIN'}
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  id="input-change-current-pin"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-base tracking-widest text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'hi' ? '2. नया पिन' : '2. New PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    id="input-change-new-pin"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-base tracking-widest text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'hi' ? '3. पुष्टि करें' : '3. Confirm'}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    id="input-change-new-pin-confirm"
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-base tracking-widest text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveView('MAIN')}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="btn-save-change-pin"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  {language === 'hi' ? 'पिन बदलें' : 'Update PIN'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 5: CHANGE PASSWORD FORM */}
          {activeView === 'CHANGE_PASSWORD' && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  {language === 'hi' ? 'खाता पासवर्ड बदलें' : 'Change Password'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'सुरक्षा हेतु वर्तमान पासवर्ड दर्ज करके नया पासवर्ड बनाएं' : 'Enter current password to set a new password'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    id="input-change-current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {language === 'hi' ? '(डिफ़ॉल्ट टेस्ट पासवर्ड: Seller@123)' : '(Default test password: Seller@123)'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    id="input-change-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="कम से कम 6 अक्षर"
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  id="input-change-new-password-confirm"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveView('MAIN')}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="btn-save-change-password"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  {language === 'hi' ? 'पासवर्ड बदलें' : 'Save Password'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 6: FORGOT PASSWORD RECOVERY FLOW */}
          {activeView === 'FORGOT_PASSWORD' && (
            <div className="space-y-3">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">
                  {language === 'hi' ? 'पासवर्ड रिकवरी (Password Recovery)' : 'Password Recovery'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {language === 'hi' ? 'पंजीकृत मोबाइल नंबर पर OTP सत्यापन के माध्यम से रीसेट करें' : 'Recover password via registered contact OTP verification'}
                </p>
              </div>

              {recoveryStep === 'REQUEST' && (
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {language === 'hi' ? 'पंजीकृत खाता विवरण:' : 'Registered Account Details:'}
                    </span>
                    <div className="p-2 rounded-xl bg-[#070e24] border border-cyan-500/20 text-xs">
                      <div className="font-bold text-white">{user?.fullName}</div>
                      <div className="text-cyan-300 font-mono text-[11px]">{user?.phone}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'hi'
                      ? 'सुरक्षा सत्यापन हेतु आपके पंजीकृत नंबर पर 6-अंकों का OTP भेजा जाएगा।'
                      : 'A 6-digit OTP will be sent to your verified registered phone number.'}
                  </p>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('MAIN')}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      {language === 'hi' ? 'वापस' : 'Back'}
                    </button>
                    <button
                      type="button"
                      id="btn-send-recovery-otp"
                      disabled={isSendingOtp}
                      onClick={handleStartRecovery}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      {isSendingOtp ? (language === 'hi' ? 'भेज रहे हैं...' : 'Sending...') : (language === 'hi' ? 'OTP भेजें' : 'Send OTP')}
                    </button>
                  </div>
                </div>
              )}

              {recoveryStep === 'VERIFY_RESET' && (
                <form onSubmit={handleCompleteRecovery} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        {language === 'hi' ? 'प्राप्त 6-अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP'}
                      </label>
                      <button
                        type="button"
                        onClick={handleStartRecovery}
                        disabled={isSendingOtp}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        {language === 'hi' ? 'दोबारा भेजें' : 'Resend'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      id="input-recovery-otp"
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-अंकों का OTP"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-cyan-400"
                      autoFocus
                    />
                    {recoveryTestOtp && (
                      <span className="text-[10px] text-cyan-300 font-semibold block mt-1">
                        📱 सत्यापन कोड: <strong className="text-white bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/40">{recoveryTestOtp}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      id="input-recovery-new-password"
                      value={recoveryNewPass}
                      onChange={(e) => setRecoveryNewPass(e.target.value)}
                      placeholder="कम से कम 6 अक्षर"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}
                    </label>
                    <input
                      type="password"
                      id="input-recovery-new-password-confirm"
                      value={recoveryNewPassConfirm}
                      onChange={(e) => setRecoveryNewPassConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('MAIN')}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-recovery-reset"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-[#070e24]/90 flex justify-end">
          <button
            type="button"
            id="btn-close-lock-security-footer"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
