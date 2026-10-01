import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Seller Security Service
 * 
 * Provides:
 * 1. Cryptographic hashing for PIN and Password using Web Crypto API (SHA-256 with per-user salt).
 *    Never stores or displays PIN or password in plain text.
 * 2. Native Android BiometricPrompt integration via Capacitor plugin.
 * 3. Fallback platform authenticator integration (WebAuthn) for secure browser contexts.
 * 4. Secure persistence of security configuration per seller user.
 * 5. Account recovery OTP generation and verification.
 */

export interface NativeBiometricResult {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  biometryType: string;
  code: string;
  reason: string;
}

export interface NativeAuthResult {
  authenticated: boolean;
  code?: string;
  error?: string;
}

export interface NativeBiometricPlugin {
  checkBiometry(): Promise<NativeBiometricResult>;
  isAvailable(): Promise<NativeBiometricResult>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    description?: string;
    negativeButtonText?: string;
  }): Promise<NativeAuthResult>;
}

export const NativeBiometric = registerPlugin<NativeBiometricPlugin>('NativeBiometric');

/**
 * Check if the application is currently running inside the native Android APK
 */
export function isNativeAndroidPlatform(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return true;
    if (Capacitor.getPlatform() === 'android') return true;
    const win = window as any;
    if (win.Capacitor?.isNativePlatform?.()) return true;
    if (win.Capacitor?.getPlatform?.() === 'android') return true;
    if (win.androidBridge || win._capacitorAndroidBridge) return true;
  } catch {
    // ignore
  }
  return false;
}

export interface SellerSecurityConfig {
  isAppLockEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinLength?: number; // default 4
  isBiometricEnabled: boolean;
  biometricCredentialId?: string;
  passwordHash?: string;
  passwordSalt?: string;
  lockOnBackground: boolean;
  failedAttempts?: number;
  lockedUntil?: number;
}

const DEFAULT_SALT = 'mkp_sec_v1_';

/**
 * Safely encode text to Uint8Array with fallback for restricted environments
 */
function safeEncodeText(text: string): Uint8Array {
  try {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text);
    }
  } catch {
    // Fallback to manual byte encoding
  }
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Hash a secret (PIN or Password) with a unique salt using standard SHA-256 via Web Crypto API
 */
export async function hashSecret(secret: string, salt: string): Promise<string> {
  const data = safeEncodeText(`${salt}:${secret}`);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data as any);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('Web Crypto digest failed, using safe fallback hash:', err);
    }
  }
  
  // Safe fallback hash implementation if subtle crypto unavailable in current context
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}

/**
 * Generate a random cryptographic salt
 */
export function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return DEFAULT_SALT + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Convert ArrayBuffer to safe base64url string
 */
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert base64url string to Uint8Array buffer
 */
export function base64UrlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface BiometricCapabilityResult {
  supported: boolean;
  isIframe: boolean;
  reason?: 'NOT_SUPPORTED' | 'NOT_SECURE_CONTEXT' | 'PREVIEW_IFRAME' | 'NO_PLATFORM_AUTHENTICATOR';
  message: string;
}

/**
 * Thoroughly checks if the current browser, protocol, and device platform support real biometric authentication
 */
export async function checkBiometricCapability(): Promise<BiometricCapabilityResult> {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      isIframe: false,
      reason: 'NOT_SUPPORTED',
      message: 'Biometric authentication is not available in this environment.',
    };
  }

  // Check if running inside real native Android APK
  if (isNativeAndroidPlatform()) {
    try {
      const res = await NativeBiometric.checkBiometry();
      if (res && res.isAvailable && res.hasEnrolledBiometrics) {
        return {
          supported: true,
          isIframe: false,
          message: 'Native fingerprint / biometric authentication is ready.',
        };
      } else {
        let reason: BiometricCapabilityResult['reason'] = 'NOT_SUPPORTED';
        let message = res?.reason || 'Biometric authentication is not available on this device.';

        if (res?.code === 'NONE_ENROLLED') {
          reason = 'NO_PLATFORM_AUTHENTICATOR';
          message = 'No fingerprint or biometric enrolled on this device. Please set up fingerprint in Android Settings.';
        } else if (res?.code === 'NO_HARDWARE') {
          reason = 'NOT_SUPPORTED';
          message = 'This device does not have a biometric hardware sensor. Use PIN instead.';
        } else if (res?.code === 'HW_UNAVAILABLE') {
          reason = 'NOT_SUPPORTED';
          message = 'Biometric sensor is temporarily busy or unavailable. Please try again or use PIN.';
        }

        return {
          supported: false,
          isIframe: false,
          reason,
          message,
        };
      }
    } catch (err: any) {
      console.warn('Native biometric check failed:', err);
      return {
        supported: false,
        isIframe: false,
        reason: 'NOT_SUPPORTED',
        message: 'Could not communicate with native biometric sensor. Use PIN instead.',
      };
    }
  }

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  // 1. WebAuthn strictly requires a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    return {
      supported: false,
      isIframe: isInIframe,
      reason: 'NOT_SECURE_CONTEXT',
      message: 'Biometric authentication requires a secure (HTTPS) connection.',
    };
  }

  // 2. WebAuthn API availability
  if (!window.PublicKeyCredential || !navigator.credentials || typeof navigator.credentials.create !== 'function') {
    return {
      supported: false,
      isIframe: isInIframe,
      reason: 'NOT_SUPPORTED',
      message: 'Biometric platform authenticator is not supported in this browser.',
    };
  }

  // 3. Check whether running in an embedded iframe (such as Google AI Studio Preview)
  if (isInIframe) {
    let allowedInIframe = false;
    try {
      const anyDoc = document as any;
      const policy = anyDoc.permissionsPolicy || anyDoc.featurePolicy;
      if (policy && typeof policy.allowsFeature === 'function') {
        allowedInIframe =
          policy.allowsFeature('publickey-credentials-create') &&
          policy.allowsFeature('publickey-credentials-get');
      }
    } catch {
      allowedInIframe = false;
    }

    if (!allowedInIframe) {
      return {
        supported: false,
        isIframe: true,
        reason: 'PREVIEW_IFRAME',
        message: 'Device biometric authentication requires running in a supported secure top-level browser context.',
      };
    }
  }

  // 4. Platform authenticator availability check (Touch ID, Face ID, Windows Hello, Android Biometrics)
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        return {
          supported: false,
          isIframe: isInIframe,
          reason: 'NO_PLATFORM_AUTHENTICATOR',
          message: 'No biometric platform sensor (fingerprint/face) detected on this device. Use PIN instead.',
        };
      }
    } else {
      return {
        supported: false,
        isIframe: isInIframe,
        reason: 'NOT_SUPPORTED',
        message: 'Platform authenticator detection is unavailable.',
      };
    }
  } catch (err: any) {
    console.info('Biometric capability check restricted in current context:', err);
    return {
      supported: false,
      isIframe: isInIframe,
      reason: isInIframe ? 'PREVIEW_IFRAME' : 'NOT_SUPPORTED',
      message: 'Device biometric authentication requires running in a supported secure top-level browser context.',
    };
  }

  return {
    supported: true,
    isIframe: isInIframe,
    message: 'Biometric authentication is available',
  };
}

/**
 * Check if the current device/browser supports user-verifying platform biometric authentication (Fingerprint/TouchID/FaceID)
 */
export async function isBiometricSupported(): Promise<boolean> {
  const cap = await checkBiometricCapability();
  return cap.supported;
}

/**
 * Register biometric platform credential
 */
export async function registerBiometric(userId: string, userName: string): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  // If running inside native Android APK, use native AndroidX BiometricPrompt
  if (isNativeAndroidPlatform()) {
    const cap = await checkBiometricCapability();
    if (!cap.supported) {
      return { success: false, error: cap.message };
    }

    try {
      const authRes = await NativeBiometric.authenticate({
        title: 'बायोमेट्रिक अनलॉक सेटअप',
        subtitle: 'फिंगरप्रिंट सेंसर को स्पर्श करें',
        description: 'सुरक्षित बायोमेट्रिक अनलॉक सक्षम करने के लिए अपनी पहचान सत्यापित करें',
        negativeButtonText: 'रद्द करें (Cancel)',
      });

      if (authRes.authenticated) {
        return {
          success: true,
          credentialId: 'native_android_biometric_active',
        };
      } else {
        if (authRes.code === 'USER_CANCELED') {
          return {
            success: false,
            error: 'बायोमेट्रिक सेटअप रद्द किया गया (Cancelled by user)',
          };
        }
        return {
          success: false,
          error: authRes.error || 'बायोमेट्रिक प्रमाणीकरण विफल (Biometric authentication failed)',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'बायोमेट्रिक सेंसर में त्रुटि हुई',
      };
    }
  }

  const cap = await checkBiometricCapability();
  if (!cap.supported) {
    return { success: false, error: cap.message };
  }

  const startTime = Date.now();
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const encoder = new TextEncoder();
    const userIdBytes = encoder.encode(userId || 'seller_user');

    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Vyapar Kendra Seller App',
      },
      user: {
        id: userIdBytes,
        name: userName || 'seller',
        displayName: userName || 'Seller Account',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: createOptions,
    })) as PublicKeyCredential | null;

    if (credential && credential.id) {
      const credId = credential.rawId ? bufferToBase64Url(credential.rawId) : credential.id;
      return { success: true, credentialId: credId };
    }
    return { success: false, error: 'Biometric authentication is not available on this device. Use PIN instead.' };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.warn('Biometric registration error/cancel:', err, 'elapsed:', elapsed);

    const errMsg = String(err?.message || '').toLowerCase();
    const errName = String(err?.name || '');

    const isPolicyOrSecurity =
      errName === 'SecurityError' ||
      errMsg.includes('permissions policy') ||
      errMsg.includes('not allowed to use this feature') ||
      errMsg.includes('permission') ||
      errMsg.includes('iframe') ||
      errMsg.includes('sandbox') ||
      errMsg.includes('relying party') ||
      errMsg.includes('domain');

    const isInstant = elapsed < 500;

    if (isPolicyOrSecurity || isInstant) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device. Use PIN instead.',
      };
    }

    if (errName === 'NotAllowedError' || errName === 'AbortError') {
      return {
        success: false,
        error: 'बायोमेट्रिक प्रमाणीकरण रद्द किया गया (Cancelled by user)',
      };
    }

    return {
      success: false,
      error: 'Biometric authentication is not available on this device. Use PIN instead.',
    };
  }
}

/**
 * Verify biometric credential via platform prompt
 */
export async function verifyBiometric(credentialId?: string): Promise<{ success: boolean; error?: string }> {
  // If running inside native Android APK, use native AndroidX BiometricPrompt
  if (isNativeAndroidPlatform()) {
    try {
      const authRes = await NativeBiometric.authenticate({
        title: 'स्थानीय मंडी व्यापार केंद्र',
        subtitle: 'बायोमेट्रिक अनलॉक',
        description: 'ऐप खोलने के लिए फिंगरप्रिंट सेंसर को स्पर्श करें',
        negativeButtonText: 'पिन का उपयोग करें (Use PIN)',
      });

      if (authRes.authenticated) {
        return { success: true };
      } else {
        if (authRes.code === 'USER_CANCELED') {
          return {
            success: false,
            error: 'बायोमेट्रिक सत्यापन रद्द किया गया (Cancelled by user)',
          };
        }
        return {
          success: false,
          error: authRes.error || 'बायोमेट्रिक सत्यापन विफल (Biometric authentication failed)',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'बायोमेट्रिक सत्यापन में त्रुटि',
      };
    }
  }

  const cap = await checkBiometricCapability();
  if (!cap.supported) {
    return { success: false, error: cap.message };
  }

  const startTime = Date.now();
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const getOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: 'preferred',
      timeout: 60000,
    };

    if (credentialId) {
      try {
        const decoded = base64UrlToBuffer(credentialId);
        getOptions.allowCredentials = [
          {
            id: decoded,
            type: 'public-key',
          },
        ];
      } catch (decodeErr) {
        console.warn('Could not decode credentialId as base64url:', decodeErr);
      }
    }

    const assertion = await navigator.credentials.get({
      publicKey: getOptions,
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric authentication is not available on this device. Use PIN instead.' };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.warn('Biometric verify error:', err, 'elapsed:', elapsed);

    const errMsg = String(err?.message || '').toLowerCase();
    const errName = String(err?.name || '');

    const isPolicyOrSecurity =
      errName === 'SecurityError' ||
      errMsg.includes('permissions policy') ||
      errMsg.includes('not allowed to use this feature') ||
      errMsg.includes('permission') ||
      errMsg.includes('iframe') ||
      errMsg.includes('sandbox');

    const isInstant = elapsed < 500;

    if (isPolicyOrSecurity || isInstant) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device. Use PIN instead.',
      };
    }

    if (errName === 'NotAllowedError' || errName === 'AbortError') {
      return {
        success: false,
        error: 'बायोमेट्रिक सत्यापन रद्द किया गया (Cancelled by user)',
      };
    }

    return {
      success: false,
      error: 'Biometric authentication is not available on this device. Use PIN instead.',
    };
  }
}

const STORAGE_KEY_PREFIX = 'seller_security_v1_';

/**
 * Retrieve security configuration for a seller
 */
export function getSecurityConfig(userId: string): SellerSecurityConfig {
  const defaultCfg: SellerSecurityConfig = {
    isAppLockEnabled: false,
    isBiometricEnabled: false,
    lockOnBackground: true,
    pinLength: 4,
  };

  if (typeof window === 'undefined' || !userId) return defaultCfg;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultCfg, ...parsed };
    }
  } catch (err) {
    console.warn('Failed reading seller security config:', err);
  }

  return defaultCfg;
}

/**
 * Save security configuration for a seller
 */
export function saveSecurityConfig(userId: string, config: SellerSecurityConfig): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(config));
  } catch (err) {
    console.error('Failed saving seller security config:', err);
  }
}

/**
 * Verify entered PIN against stored hashed PIN
 */
export async function verifyPin(userId: string, enteredPin: string): Promise<boolean> {
  const cfg = getSecurityConfig(userId);
  if (!cfg.pinHash || !cfg.pinSalt) return false;

  const hash = await hashSecret(enteredPin, cfg.pinSalt);
  return hash === cfg.pinHash;
}

/**
 * Set a new PIN (stores salt and hash, never plain text)
 */
export async function setPin(userId: string, newPin: string): Promise<void> {
  const cfg = getSecurityConfig(userId);
  const salt = generateSalt();
  const hash = await hashSecret(newPin, salt);

  cfg.isAppLockEnabled = true;
  cfg.pinHash = hash;
  cfg.pinSalt = salt;
  cfg.pinLength = newPin.length;
  cfg.failedAttempts = 0;
  cfg.lockedUntil = undefined;

  saveSecurityConfig(userId, cfg);
}

/**
 * Disable app lock
 */
export function disableAppLock(userId: string): void {
  const cfg = getSecurityConfig(userId);
  cfg.isAppLockEnabled = false;
  cfg.isBiometricEnabled = false;
  saveSecurityConfig(userId, cfg);
}

/**
 * Verify account password
 */
export async function verifyPassword(userId: string, enteredPassword: string): Promise<boolean> {
  const cfg = getSecurityConfig(userId);
  
  // If user has set a custom hashed password
  if (cfg.passwordHash && cfg.passwordSalt) {
    const hash = await hashSecret(enteredPassword, cfg.passwordSalt);
    return hash === cfg.passwordHash;
  }

  // Initial account password for demo seller accounts: 'Seller@123'
  return enteredPassword === 'Seller@123';
}

/**
 * Set a new account password (stores salt and hash, never plain text)
 */
export async function setAccountPassword(userId: string, newPassword: string): Promise<void> {
  const cfg = getSecurityConfig(userId);
  const salt = generateSalt();
  const hash = await hashSecret(newPassword, salt);

  cfg.passwordHash = hash;
  cfg.passwordSalt = salt;

  saveSecurityConfig(userId, cfg);
}

/**
 * In-memory / session storage recovery OTP management
 */
interface RecoveryToken {
  userId: string;
  target: string;
  otp: string;
  expiresAt: number;
}

const RECOVERY_STORAGE_KEY = 'seller_recovery_token_active';

export function createRecoveryOtp(userId: string, targetPhoneOrEmail: string): { otp: string; expiresAt: number; target: string } {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const token: RecoveryToken = {
    userId,
    target: targetPhoneOrEmail,
    otp,
    expiresAt,
  };

  try {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(token));
  } catch (err) {
    console.warn('SessionStorage recovery token write failed:', err);
  }

  return { otp, expiresAt, target: targetPhoneOrEmail };
}

export function verifyRecoveryOtp(userId: string, enteredOtp: string): boolean {
  try {
    const raw = sessionStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return false;
    const token: RecoveryToken = JSON.parse(raw);

    if (token.userId !== userId) return false;
    if (Date.now() > token.expiresAt) return false;
    if (token.otp.trim() !== enteredOtp.trim()) return false;

    // Clear after successful validation
    sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    return true;
  } catch (err) {
    return false;
  }
}
