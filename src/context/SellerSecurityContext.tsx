/**
 * Seller Security & App Lock Context
 * 
 * Manages:
 * - App Lock state (Locked vs Unlocked)
 * - Reliable lock triggers on app start/restart and when resuming from background
 * - PIN & Biometric authentication flow
 * - Change PIN (requires current PIN)
 * - Account Password management & secure recovery (Forgot Password)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSellerAuth } from './SellerAuthContext.tsx';
import {
  SellerSecurityConfig,
  getSecurityConfig,
  saveSecurityConfig,
  verifyPin,
  setPin,
  disableAppLock as disableAppLockService,
  verifyPassword,
  setAccountPassword,
  isBiometricSupported as checkBiometricSupport,
  checkBiometricCapability,
  registerBiometric,
  verifyBiometric,
  createRecoveryOtp,
  verifyRecoveryOtp,
} from '../services/sellerSecurity.ts';

interface SellerSecurityContextType {
  isAppLockEnabled: boolean;
  isLocked: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isIframePreview: boolean;
  biometricNotice: string | null;
  pinLength: number;
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWithBiometric: () => Promise<{ success: boolean; error?: string }>;
  enableAppLock: (pin: string, enableBiometric?: boolean) => Promise<{ success: boolean; error?: string }>;
  disableAppLock: (currentPin: string) => Promise<{ success: boolean; error?: string }>;
  toggleBiometric: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordRecovery: () => Promise<{ success: boolean; maskedTarget: string; otp?: string; message: string }>;
  verifyRecoveryAndResetPassword: (otp: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  resetPinViaAccountPassword: (password: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  resetPinViaOtp: (otp: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
}

const SellerSecurityContext = createContext<SellerSecurityContextType | null>(null);

export const SellerSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useSellerAuth();
  const userId = user?.id || '';

  const [isAppLockEnabled, setIsAppLockEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [isIframePreview, setIsIframePreview] = useState<boolean>(false);
  const [biometricNotice, setBiometricNotice] = useState<string | null>(null);
  const [pinLength, setPinLength] = useState<number>(4);

  const backgroundTimeRef = useRef<number | null>(null);
  const isAuthenticatingRef = useRef<boolean>(false);

  // Check biometric support once on mount
  useEffect(() => {
    let mounted = true;
    checkBiometricCapability().then((cap) => {
      if (!mounted) return;
      setIsBiometricSupported(cap.supported);
      const isPreview = cap.isIframe && !cap.supported;
      setIsIframePreview(isPreview);
      if (isPreview) {
        setIsBiometricEnabled(false);
        setBiometricNotice(cap.message);
      } else if (!cap.supported) {
        setIsBiometricEnabled(false);
        setBiometricNotice(cap.message);
      } else {
        setBiometricNotice(null);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load user security config whenever active user changes
  useEffect(() => {
    if (!userId) {
      setIsAppLockEnabled(false);
      setIsLocked(false);
      return;
    }

    const cfg = getSecurityConfig(userId);
    setIsAppLockEnabled(!!cfg.isAppLockEnabled);
    setPinLength(cfg.pinLength || 4);

    checkBiometricCapability().then((cap) => {
      setIsBiometricSupported(cap.supported);
      const isPreview = cap.isIframe && !cap.supported;
      setIsIframePreview(isPreview);
      if (isPreview || !cap.supported) {
        setIsBiometricEnabled(false);
        setBiometricNotice(cap.message);
      } else {
        setIsBiometricEnabled(!!cfg.isBiometricEnabled);
        setBiometricNotice(null);
      }
    });

    // If app lock is enabled, start locked on app launch/restart
    if (cfg.isAppLockEnabled) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [userId]);

  // Handle visibility changes (locking when returning from background)
  useEffect(() => {
    if (!isAppLockEnabled || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (isAuthenticatingRef.current) return;

      if (document.visibilityState === 'hidden') {
        backgroundTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        // App resumed from background - lock only if it was hidden for at least 5000ms
        const elapsed = backgroundTimeRef.current ? Date.now() - backgroundTimeRef.current : 0;
        if (backgroundTimeRef.current && elapsed >= 5000 && isAppLockEnabled && !isAuthenticatingRef.current) {
          setIsLocked(true);
        }
        backgroundTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAppLockEnabled, isAuthenticated]);

  const lockApp = useCallback(() => {
    if (isAppLockEnabled) {
      backgroundTimeRef.current = null;
      setIsLocked(true);
    }
  }, [isAppLockEnabled]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      
      const isValid = await verifyPin(userId, pin);
      if (isValid) {
        backgroundTimeRef.current = null;
        setIsLocked(false);
        return { success: true };
      }
      return { success: false, error: 'गलत पिन दर्ज किया गया (Incorrect PIN)' };
    },
    [userId]
  );

  const unlockWithBiometric = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
    const cfg = getSecurityConfig(userId);
    if (!cfg.isBiometricEnabled) {
      return { success: false, error: 'बायोमेट्रिक लॉक सक्षम नहीं है' };
    }

    isAuthenticatingRef.current = true;
    try {
      const res = await verifyBiometric(cfg.biometricCredentialId);
      if (res.success) {
        backgroundTimeRef.current = null;
        setIsLocked(false);
        return { success: true };
      }
      return { success: false, error: res.error || 'बायोमेट्रिक प्रमाणीकरण विफल' };
    } finally {
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 600);
    }
  }, [userId]);

  const enableAppLock = useCallback(
    async (pin: string, enableBiometric: boolean = false): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      if (!pin || pin.length < 4) {
        return { success: false, error: 'पिन कम से कम 4 अंकों का होना चाहिए' };
      }

      await setPin(userId, pin);
      setIsAppLockEnabled(true);
      setPinLength(pin.length);

      if (enableBiometric) {
        const cap = await checkBiometricCapability();
        if (cap.supported) {
          isAuthenticatingRef.current = true;
          try {
            const bioRes = await registerBiometric(userId, user?.fullName || 'Seller');
            if (bioRes.success) {
              const cfg = getSecurityConfig(userId);
              cfg.isBiometricEnabled = true;
              cfg.biometricCredentialId = bioRes.credentialId;
              saveSecurityConfig(userId, cfg);
              setIsBiometricEnabled(true);
              setIsBiometricSupported(true);
            }
          } finally {
            setTimeout(() => {
              isAuthenticatingRef.current = false;
            }, 600);
          }
        }
      }

      return { success: true };
    },
    [userId, user?.fullName]
  );

  const disableAppLock = useCallback(
    async (currentPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValid = await verifyPin(userId, currentPin);
      if (!isValid) {
        return { success: false, error: 'वर्तमान पिन गलत है' };
      }

      disableAppLockService(userId);
      setIsAppLockEnabled(false);
      setIsBiometricEnabled(false);
      setIsLocked(false);
      return { success: true };
    },
    [userId]
  );

  const toggleBiometric = useCallback(
    async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const cfg = getSecurityConfig(userId);

      if (enabled) {
        const cap = await checkBiometricCapability();
        if (!cap.supported) {
          setIsBiometricSupported(false);
          return { success: false, error: cap.message };
        }

        isAuthenticatingRef.current = true;
        try {
          const bioRes = await registerBiometric(userId, user?.fullName || 'Seller');
          if (bioRes.success) {
            backgroundTimeRef.current = null;
            cfg.isBiometricEnabled = true;
            cfg.biometricCredentialId = bioRes.credentialId;
            saveSecurityConfig(userId, cfg);
            setIsBiometricEnabled(true);
            setIsBiometricSupported(true);
            return { success: true };
          } else {
            if (bioRes.error?.includes('not available')) {
              setIsBiometricSupported(false);
              setIsBiometricEnabled(false);
            }
            return { success: false, error: bioRes.error || 'Biometric authentication is not available on this device. Use PIN instead.' };
          }
        } finally {
          setTimeout(() => {
            isAuthenticatingRef.current = false;
          }, 600);
        }
      } else {
        cfg.isBiometricEnabled = false;
        saveSecurityConfig(userId, cfg);
        setIsBiometricEnabled(false);
        return { success: true };
      }
    },
    [userId, user?.fullName]
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValid = await verifyPin(userId, currentPin);
      if (!isValid) {
        return { success: false, error: 'वर्तमान पिन गलत है (Incorrect Current PIN)' };
      }
      if (!newPin || newPin.length < 4) {
        return { success: false, error: 'नया पिन कम से कम 4 अंकों का होना चाहिए' };
      }

      await setPin(userId, newPin);
      setPinLength(newPin.length);
      return { success: true };
    },
    [userId]
  );

  const changePassword = useCallback(
    async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValid = await verifyPassword(userId, currentPass);
      if (!isValid) {
        return { success: false, error: 'वर्तमान पासवर्ड गलत है (Incorrect Current Password)' };
      }
      if (!newPass || newPass.length < 6) {
        return { success: false, error: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' };
      }

      await setAccountPassword(userId, newPass);
      return { success: true };
    },
    [userId]
  );

  const requestPasswordRecovery = useCallback(async (): Promise<{
    success: boolean;
    maskedTarget: string;
    otp?: string;
    message: string;
  }> => {
    if (!userId) {
      return { success: false, maskedTarget: '', message: 'यूजर सत्र उपलब्ध नहीं है' };
    }

    const phone = user?.phone || '+919820000001';
    const email = user?.email || '';
    const target = phone || email;

    // Mask phone e.g. +91 98200*****01
    const maskedTarget = phone.length >= 10
      ? `${phone.slice(0, 5)}*****${phone.slice(-2)}`
      : phone;

    const { otp } = createRecoveryOtp(userId, target);

    return {
      success: true,
      maskedTarget,
      otp, // provided so developer/seller can test immediately via toast or modal display
      message: `सत्यापन कोड (OTP) आपके पंजीकृत नंबर ${maskedTarget} पर भेजा गया है।`,
    };
  }, [userId, user?.phone, user?.email]);

  const verifyRecoveryAndResetPassword = useCallback(
    async (otp: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValidOtp = verifyRecoveryOtp(userId, otp);
      if (!isValidOtp) {
        return { success: false, error: 'अमान्य या समाप्त हो चुका OTP (Invalid or expired OTP)' };
      }

      if (!newPass || newPass.length < 6) {
        return { success: false, error: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' };
      }

      await setAccountPassword(userId, newPass);
      return { success: true };
    },
    [userId]
  );

  const resetPinViaAccountPassword = useCallback(
    async (password: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValid = await verifyPassword(userId, password);
      if (!isValid) {
        return { success: false, error: 'खाता पासवर्ड गलत है (Incorrect Account Password)' };
      }
      if (!newPin || newPin.length < 4) {
        return { success: false, error: 'नया पिन कम से कम 4 अंकों का होना चाहिए' };
      }

      await setPin(userId, newPin);
      setPinLength(newPin.length);
      backgroundTimeRef.current = null;
      setIsLocked(false);
      return { success: true };
    },
    [userId]
  );

  const resetPinViaOtp = useCallback(
    async (otp: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'यूजर सत्र उपलब्ध नहीं है' };
      const isValidOtp = verifyRecoveryOtp(userId, otp);
      if (!isValidOtp) {
        return { success: false, error: 'अमान्य या समाप्त हो चुका OTP (Invalid or expired OTP)' };
      }
      if (!newPin || newPin.length < 4) {
        return { success: false, error: 'नया पिन कम से कम 4 अंकों का होना चाहिए' };
      }

      await setPin(userId, newPin);
      setPinLength(newPin.length);
      backgroundTimeRef.current = null;
      setIsLocked(false);
      return { success: true };
    },
    [userId]
  );

  return (
    <SellerSecurityContext.Provider
      value={{
        isAppLockEnabled,
        isLocked,
        isBiometricSupported,
        isBiometricEnabled,
        isIframePreview,
        biometricNotice,
        pinLength,
        lockApp,
        unlockWithPin,
        unlockWithBiometric,
        enableAppLock,
        disableAppLock,
        toggleBiometric,
        changePin,
        changePassword,
        requestPasswordRecovery,
        verifyRecoveryAndResetPassword,
        resetPinViaAccountPassword,
        resetPinViaOtp,
      }}
    >
      {children}
    </SellerSecurityContext.Provider>
  );
};

export const useSellerSecurity = () => {
  const context = useContext(SellerSecurityContext);
  if (!context) {
    throw new Error('useSellerSecurity must be used within a SellerSecurityProvider');
  }
  return context;
};
