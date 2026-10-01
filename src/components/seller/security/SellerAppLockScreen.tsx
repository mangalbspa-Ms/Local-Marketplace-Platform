/**
 * Seller App Lock Screen
 * 
 * Guards the entire Seller App when App Lock is active.
 * Ensures NO seller data, orders, products, earnings, or customer info is rendered
 * before successful biometric or PIN verification.
 * 
 * Key UX Requirements:
 * 1. Automatically trigger native Android fingerprint/biometric prompt upon screen display.
 * 2. Keep existing 4-digit PIN fallback if biometric fails or is cancelled.
 * 3. Clearly visible "Forgot PIN?" option with strictly authenticated reset (account password or verified SMS OTP).
 * 4. Shows actual seller/shop profile photo used in Seller profile.
 * 5. Clean, professional identity header ("Seller App Unlock" + subtitle).
 * 6. Compact, modern, comfortable keypad layout designed for mobile ergonomics.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Fingerprint,
  Delete,
  AlertCircle,
  KeyRound,
  Store,
  ShieldCheck,
  CheckCircle2,
  X,
  Power,
  Sparkles,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { useSellerSecurity } from '../../../context/SellerSecurityContext.tsx';

export const SellerAppLockScreen: React.FC = () => {
  const { user, shop, logout } = useSellerAuth();
  const { language } = useSellerLanguage();
  const {
    pinLength,
    unlockWithPin,
    unlockWithBiometric,
    isBiometricSupported,
    isBiometricEnabled,
    resetPinViaAccountPassword,
    resetPinViaOtp,
    requestPasswordRecovery,
  } = useSellerSecurity();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  const isVerifyingRef = useRef<boolean>(false);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPromptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Forgot PIN modal state
  const [isForgotPinOpen, setIsForgotPinOpen] = useState<boolean>(false);
  const [forgotMethod, setForgotMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [accountPasswordInput, setAccountPasswordInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState<string>('');
  const [recoveryOtpInput, setRecoveryOtpInput] = useState<string>('');
  const [sentRecoveryOtp, setSentRecoveryOtp] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string>('');
  const [forgotPinError, setForgotPinError] = useState<string | null>(null);
  const [forgotPinSuccess, setForgotPinSuccess] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // Determine shop/seller profile photo
  const profileImageSrc =
    shop?.profilePhotoUrl ||
    shop?.photoUrl ||
    (shop as any)?.logoImageUrl ||
    user?.profilePhotoUrl ||
    user?.avatarUrl;

  const shopDisplayName = shop?.name || 'व्यापार केंद्र (Vyapar Kendra)';
  const sellerDisplayName = user?.fullName || 'दुकानदार (Seller)';
  const sellerPhone = user?.phone || shop?.phone || '';

  // Component lifecycle and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (autoPromptTimerRef.current) clearTimeout(autoPromptTimerRef.current);
    };
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsShaking(false);
      }
    }, 500);
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= pinLength || isVerifying || isVerifyingRef.current) return;
    setErrorMsg(null);
    const updated = enteredPin + num;
    setEnteredPin(updated);

    if (updated.length === pinLength) {
      verifyCode(updated);
    }
  };

  const handleDelete = () => {
    if (isVerifying || isVerifyingRef.current) return;
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const verifyCode = async (pinToVerify: string) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setIsVerifying(true);
    try {
      const res = await unlockWithPin(pinToVerify);
      if (!res.success) {
        if (isMountedRef.current) {
          setErrorMsg(res.error || (language === 'hi' ? 'अमान्य पिन (Incorrect PIN)' : 'Incorrect PIN'));
          triggerShake();
          setEnteredPin('');
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMsg(err.message || (language === 'hi' ? 'सत्यापन विफल' : 'Verification failed'));
        triggerShake();
        setEnteredPin('');
      }
    } finally {
      isVerifyingRef.current = false;
      if (isMountedRef.current) {
        setIsVerifying(false);
      }
    }
  };

  const handleBiometricAuth = async () => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await unlockWithBiometric();
      if (!res.success) {
        // Show gentle error or fall back to PIN without blocking keypad
        if (isMountedRef.current && res.error && !res.error.includes('रद्द') && !res.error.includes('Cancelled')) {
          setErrorMsg(res.error);
        }
      }
    } catch (err: any) {
      console.warn('Biometric unlock attempt:', err);
    } finally {
      isVerifyingRef.current = false;
      if (isMountedRef.current) {
        setIsVerifying(false);
      }
    }
  };

  // Requirement 1: Automatically trigger native Android fingerprint/biometric prompt upon screen mount
  useEffect(() => {
    if (isBiometricEnabled && isBiometricSupported && !hasAutoPrompted) {
      setHasAutoPrompted(true);
      // Slight delay ensures the UI has painted cleanly before the native BiometricPrompt displays
      autoPromptTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && !isVerifyingRef.current) {
          handleBiometricAuth();
        }
      }, 350);
    }
    return () => {
      if (autoPromptTimerRef.current) clearTimeout(autoPromptTimerRef.current);
    };
  }, [isBiometricEnabled, isBiometricSupported, hasAutoPrompted]);

  // Forgot PIN: Method 1 - Reset via Account Password
  const handleResetPinViaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPinError(null);

    if (!accountPasswordInput) {
      setForgotPinError(language === 'hi' ? 'कृपया अपना खाता पासवर्ड दर्ज करें' : 'Please enter your account password');
      return;
    }
    if (newPinInput.length !== pinLength) {
      setForgotPinError(
        language === 'hi'
          ? `पिन ठीक ${pinLength} अंकों का होना चाहिए`
          : `PIN must be exactly ${pinLength} digits`
      );
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setForgotPinError(language === 'hi' ? 'दोनों पिन मेल नहीं खाते' : 'PINs do not match');
      return;
    }

    const res = await resetPinViaAccountPassword(accountPasswordInput, newPinInput);
    if (res.success) {
      if (isMountedRef.current) {
        setForgotPinSuccess(language === 'hi' ? 'पिन सफलतापूर्वक बदल गया और ऐप अनलॉक हो गया!' : 'PIN reset successfully and app unlocked!');
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsForgotPinOpen(false);
          }
        }, 1000);
      }
    } else {
      if (isMountedRef.current) {
        setForgotPinError(res.error || (language === 'hi' ? 'पासवर्ड अमान्य है' : 'Invalid password'));
      }
    }
  };

  // Forgot PIN: Send OTP
  const handleSendRecoveryOtp = async () => {
    setIsSendingOtp(true);
    setForgotPinError(null);
    try {
      const res = await requestPasswordRecovery();
      if (isMountedRef.current) {
        if (res.success) {
          setMaskedTarget(res.maskedTarget);
          setSentRecoveryOtp(res.otp || null);
          setForgotPinSuccess(
            language === 'hi'
              ? `सत्यापन कोड भेजा गया: ${res.maskedTarget}`
              : `Verification OTP sent to ${res.maskedTarget}`
          );
        } else {
          setForgotPinError(res.message);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setForgotPinError(err.message || 'OTP भेजने में विफल');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSendingOtp(false);
      }
    }
  };

  // Forgot PIN: Method 2 - Reset via Verified OTP
  const handleResetPinViaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPinError(null);

    if (!recoveryOtpInput || recoveryOtpInput.length < 4) {
      setForgotPinError(language === 'hi' ? 'कृपया मान्य OTP दर्ज करें' : 'Please enter valid OTP');
      return;
    }
    if (newPinInput.length !== pinLength) {
      setForgotPinError(
        language === 'hi'
          ? `पिन ठीक ${pinLength} अंकों का होना चाहिए`
          : `PIN must be exactly ${pinLength} digits`
      );
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setForgotPinError(language === 'hi' ? 'दोनों पिन मेल नहीं खाते' : 'PINs do not match');
      return;
    }

    const res = await resetPinViaOtp(recoveryOtpInput, newPinInput);
    if (res.success) {
      if (isMountedRef.current) {
        setForgotPinSuccess(language === 'hi' ? 'पिन सफलतापूर्वक अपडेट हो गया!' : 'PIN reset successfully!');
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsForgotPinOpen(false);
          }
        }, 1000);
      }
    } else {
      if (isMountedRef.current) {
        setForgotPinError(res.error || (language === 'hi' ? 'अमान्य OTP' : 'Invalid OTP'));
      }
    }
  };

  return (
    <div
      id="seller-app-lock-screen"
      className="min-h-screen bg-[#070e24] text-slate-100 flex flex-col justify-between max-w-sm mx-auto relative shadow-2xl px-5 py-4 select-none overflow-hidden"
    >
      {/* Background Ambience Glow */}
      <div className="absolute -top-28 -left-28 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Seller App Unlock & Profile */}
      <div className="pt-2 text-center space-y-2 z-10 shrink-0">
        {/* Profile / Shop Image Avatar with Security Badge */}
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <div className="w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-900">
              {profileImageSrc && !imageFailed ? (
                <img
                  src={profileImageSrc}
                  alt={shopDisplayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-cyan-950/80 flex items-center justify-center text-cyan-300">
                  <Store className="w-7 h-7 stroke-[2]" />
                </div>
              )}
            </div>
          </div>
          {/* Subtle Verified Shield Badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#070e24] flex items-center justify-center text-slate-950 shadow-sm"
            title="Secured Shop"
          >
            <ShieldCheck className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        {/* Clear Professional Heading & Subtitle */}
        <div className="space-y-0.5">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-cyan-400/90 tracking-wide uppercase">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>{language === 'hi' ? 'सेलर ऐप अनलॉक' : 'Seller App Unlock'}</span>
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-white line-clamp-1">
            {shopDisplayName}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {sellerDisplayName} {sellerPhone ? `• ${sellerPhone}` : ''}
          </p>
        </div>
      </div>

      {/* Middle Section: PIN Dots, Prompts & Biometric Fallback Button */}
      <div className="py-2 text-center space-y-2.5 z-10 shrink-0">
        <p className="text-xs font-medium text-slate-300">
          {language === 'hi'
            ? isBiometricEnabled && isBiometricSupported
              ? `फिंगरप्रिंट लगाएं या ${pinLength}-अंकों का पिन दर्ज करें`
              : `अपना ${pinLength}-अंकों का सुरक्षा पिन दर्ज करें`
            : isBiometricEnabled && isBiometricSupported
            ? `Use fingerprint or enter ${pinLength}-digit PIN`
            : `Enter your ${pinLength}-digit Security PIN`}
        </p>

        {/* PIN Fill Dots */}
        <div
          className={`flex items-center justify-center space-x-3 transition-transform duration-200 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: pinLength }).map((_, idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.9)] scale-110'
                    : 'bg-slate-800/90 border border-slate-700/80'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex items-center justify-center space-x-1.5 text-rose-400 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{errorMsg}</span>
          </div>
        )}

        {/* Biometric Prompt Helper Banner (Tap anytime to re-trigger) */}
        {isBiometricEnabled && isBiometricSupported && (
          <div className="pt-0.5">
            <button
              type="button"
              id="lock-btn-biometric-banner"
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cyan-950/70 hover:bg-cyan-900/90 active:scale-95 border border-cyan-500/35 text-cyan-300 text-[11px] font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-3.5 h-3.5 stroke-[2.2] text-cyan-400 animate-pulse" />
              <span>{language === 'hi' ? 'फिंगरप्रिंट से अनलॉक करें' : 'Unlock with Fingerprint'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Numeric Keypad: Compact, Modern & Mobile Ergonomic */}
      <div className="space-y-2.5 z-10 pb-2 shrink-0">
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              id={`lock-keypad-${digit}`}
              onClick={() => handleKeyPress(digit)}
              disabled={isVerifying}
              className="w-14 h-14 mx-auto rounded-2xl bg-slate-900/90 hover:bg-cyan-950/70 active:bg-cyan-500 active:text-slate-950 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Left: Fingerprint Icon Button (Primary biometric trigger) */}
          <div className="flex items-center justify-center">
            {isBiometricEnabled && isBiometricSupported ? (
              <button
                type="button"
                id="lock-btn-biometric"
                onClick={handleBiometricAuth}
                disabled={isVerifying}
                title={language === 'hi' ? 'बायोमेट्रिक से खोलें' : 'Unlock with Fingerprint'}
                className="w-14 h-14 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900/90 active:scale-95 border border-cyan-500/50 text-cyan-300 flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                <Fingerprint className="w-6 h-6 stroke-[2.2]" />
              </button>
            ) : (
              <div className="w-14 h-14" />
            )}
          </div>

          {/* Key 0 */}
          <button
            type="button"
            id="lock-keypad-0"
            onClick={() => handleKeyPress('0')}
            disabled={isVerifying}
            className="w-14 h-14 mx-auto rounded-2xl bg-slate-900/90 hover:bg-cyan-950/70 active:bg-cyan-500 active:text-slate-950 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          {/* Backspace Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              id="lock-keypad-delete"
              onClick={handleDelete}
              disabled={isVerifying || enteredPin.length === 0}
              title={language === 'hi' ? 'मिटाएं' : 'Delete'}
              className="w-14 h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800/90 active:scale-95 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-sm transition-all cursor-pointer disabled:opacity-25"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer Actions: Clearly Visible "Forgot PIN?" & Logout */}
        <div className="flex items-center justify-between pt-2 px-3 text-xs">
          <button
            type="button"
            id="btn-forgot-pin-lock"
            onClick={() => {
              setIsForgotPinOpen(true);
              setForgotPinError(null);
              setForgotPinSuccess(null);
            }}
            className="text-cyan-400 hover:text-cyan-300 active:text-cyan-200 font-semibold transition cursor-pointer flex items-center space-x-1.5 py-1 px-2 rounded-lg hover:bg-cyan-950/40"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पिन भूल गए? (Forgot PIN)' : 'Forgot PIN?'}</span>
          </button>

          <button
            type="button"
            id="btn-logout-from-lock"
            onClick={() => logout()}
            className="text-rose-400/80 hover:text-rose-300 font-medium transition cursor-pointer flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-rose-950/20"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'लॉग आउट' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Forgot PIN / Authenticated Reset Modal */}
      {isForgotPinOpen && (
        <div
          id="modal-forgot-pin"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsForgotPinOpen(false)}
        >
          <div
            className="bg-[#0b142c] border border-cyan-500/30 rounded-3xl p-5 w-full max-w-sm text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {language === 'hi' ? 'पिन रीसेट करें (Reset PIN)' : 'Reset App PIN'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {language === 'hi' ? 'खाता प्रमाणीकरण के बाद ही नया पिन बनाएं' : 'Authenticate seller account to set new PIN'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPinOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch Reset Method */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setForgotMethod('PASSWORD');
                  setForgotPinError(null);
                }}
                className={`py-1.5 rounded-lg transition ${
                  forgotMethod === 'PASSWORD'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? 'खाता पासवर्ड' : 'Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMethod('OTP');
                  setForgotPinError(null);
                  if (!sentRecoveryOtp) handleSendRecoveryOtp();
                }}
                className={`py-1.5 rounded-lg transition ${
                  forgotMethod === 'OTP'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? 'SMS / OTP' : 'SMS / OTP'}
              </button>
            </div>

            {/* Method 1: Password Form */}
            {forgotMethod === 'PASSWORD' && (
              <form onSubmit={handleResetPinViaPassword} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'hi' ? 'अपना खाता पासवर्ड दर्ज करें' : 'Account Password'}
                  </label>
                  <input
                    type="password"
                    id="input-forgot-pin-password"
                    value={accountPasswordInput}
                    onChange={(e) => setAccountPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {language === 'hi' ? '(डिफ़ॉल्ट टेस्ट पासवर्ड: Seller@123)' : '(Default test password: Seller@123)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'नया पिन' : 'New PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={pinLength}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 अंक"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-xs tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'पिन पुष्टि' : 'Confirm'}
                    </label>
                    <input
                      type="password"
                      maxLength={pinLength}
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 अंक"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-xs tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {forgotPinError && (
                  <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{forgotPinError}</span>
                  </div>
                )}

                {forgotPinSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{forgotPinSuccess}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPinOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-reset-pin-pw"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 cursor-pointer"
                  >
                    {language === 'hi' ? 'पिन बदलें व अनलॉक करें' : 'Update & Unlock'}
                  </button>
                </div>
              </form>
            )}

            {/* Method 2: OTP Form */}
            {forgotMethod === 'OTP' && (
              <form onSubmit={handleResetPinViaOtp} className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      {language === 'hi' ? 'सत्यापन OTP' : 'Verification OTP'}
                    </label>
                    <button
                      type="button"
                      onClick={handleSendRecoveryOtp}
                      disabled={isSendingOtp}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      {isSendingOtp ? 'भेजा जा रहा है...' : 'दोबारा भेजें (Resend)'}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    id="input-forgot-pin-otp"
                    value={recoveryOtpInput}
                    onChange={(e) => setRecoveryOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-अंकों का OTP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-xs tracking-widest focus:outline-none focus:border-cyan-400"
                  />
                  {sentRecoveryOtp && (
                    <span className="text-[10px] text-cyan-300 font-semibold block mt-1">
                      📱 टेस्ट OTP भेजा गया: <strong className="text-white bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/40">{sentRecoveryOtp}</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'नया पिन' : 'New PIN'}
                    </label>
                    <input
                      type="password"
                      maxLength={pinLength}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 अंक"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-xs tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'hi' ? 'पिन पुष्टि' : 'Confirm'}
                    </label>
                    <input
                      type="password"
                      maxLength={pinLength}
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4 अंक"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center text-xs tracking-widest focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {forgotPinError && (
                  <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{forgotPinError}</span>
                  </div>
                )}

                {forgotPinSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{forgotPinSuccess}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPinOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-reset-pin-otp"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 cursor-pointer"
                  >
                    {language === 'hi' ? 'सत्यापित करें व अनलॉक करें' : 'Verify & Unlock'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
