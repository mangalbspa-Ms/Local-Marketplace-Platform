/**
 * Safe Web Speech API & Microphone Permission Helper
 * 
 * In Chromium browsers and sandboxed iframes, native `window.SpeechRecognition`
 * is exposed as an unconstructible IDL interface without a constructor,
 * causing `new SpeechRecognition()` to throw:
 * "Uncaught TypeError: Illegal constructor".
 * 
 * This helper strictly uses `webkitSpeechRecognition` (which is constructible in Chrome/Edge),
 * provides unified microphone permission request logic via getUserMedia / Capacitor native Android plugin,
 * and handles permission denials with clear user feedback.
 */

export interface MicPermissionResult {
  granted: boolean;
  error?: 'denied' | 'not_found' | 'not_supported' | 'unknown';
  message?: string;
}

/**
 * Checks whether speech recognition constructor is available in current environment.
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
}

/**
 * Instantiates the speech recognition engine safely.
 */
export function createSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;

  const SpeechConstructor =
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

  if (!SpeechConstructor) {
    return null;
  }

  try {
    return new SpeechConstructor();
  } catch (err) {
    console.warn('SpeechRecognition constructor unavailable in this environment:', err);
    return null;
  }
}

/**
 * Checks current microphone permission state without triggering a prompt
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (typeof window === 'undefined') return 'unknown';

  // Check Capacitor native Android plugin if available
  try {
    const capacitor = (window as any).Capacitor;
    if (capacitor?.isNativePlatform?.() && capacitor.Plugins?.NativeAudioPermission) {
      const res = await capacitor.Plugins.NativeAudioPermission.checkPermission();
      if (res?.granted) return 'granted';
      if (res?.state === 'DENIED') return 'denied';
      return 'prompt';
    }
  } catch {
    // Continue to web check
  }

  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return status.state;
    } catch {
      // permissions.query for microphone may throw in some browsers or iframes
      return 'unknown';
    }
  }

  return 'unknown';
}

/**
 * Explicitly requests microphone permission from the user:
 * 1. On Android Capacitor: Invokes NativeAudioPermission plugin for Android runtime RECORD_AUDIO permission.
 * 2. On Web Preview / Browser: Calls navigator.mediaDevices.getUserMedia({ audio: true }),
 *    which triggers the browser's native permission request prompt.
 * 
 * Once granted, temporary audio stream tracks are immediately stopped so Web Speech API
 * has exclusive access to the microphone hardware.
 */
export async function requestMicrophonePermission(): Promise<MicPermissionResult> {
  if (typeof window === 'undefined') {
    return { granted: false, error: 'not_supported', message: 'Window not available' };
  }

  // 1. Android Capacitor Native Platform Check
  try {
    const capacitor = (window as any).Capacitor;
    if (capacitor?.isNativePlatform?.() && capacitor.Plugins?.NativeAudioPermission) {
      const nativeRes = await capacitor.Plugins.NativeAudioPermission.requestPermission();
      if (!nativeRes?.granted) {
        return {
          granted: false,
          error: 'denied',
          message: 'Android microphone permission was denied by the user.',
        };
      }
    }
  } catch (nativeErr) {
    console.warn('Native audio permission plugin error, falling back to getUserMedia:', nativeErr);
  }

  // 2. Web Browser / Preview Permission Prompt via getUserMedia
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop all tracks to release hardware for SpeechRecognition
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      return { granted: true };
    } catch (err: any) {
      console.warn('getUserMedia microphone permission error:', err);
      const name = err?.name || '';
      const msg = err?.message || '';

      if (
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('dismissed')
      ) {
        return {
          granted: false,
          error: 'denied',
          message: 'Microphone permission was denied or dismissed.',
        };
      }

      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return {
          granted: false,
          error: 'not_found',
          message: 'No microphone hardware device found on this system.',
        };
      }

      return {
        granted: false,
        error: 'unknown',
        message: msg || 'Failed to obtain microphone permission.',
      };
    }
  }

  // Fallback for legacy navigator.getUserMedia if modern mediaDevices is absent
  const legacyGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia;

  if (typeof legacyGetUserMedia === 'function') {
    return new Promise((resolve) => {
      legacyGetUserMedia.call(
        navigator,
        { audio: true },
        (stream: MediaStream) => {
          stream.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {
              // ignore
            }
          });
          resolve({ granted: true });
        },
        (err: any) => {
          const isDenied =
            err?.name === 'NotAllowedError' ||
            err?.name === 'PermissionDeniedError' ||
            err?.message?.toLowerCase().includes('denied');
          resolve({
            granted: false,
            error: isDenied ? 'denied' : 'unknown',
            message: err?.message || 'Permission denied',
          });
        }
      );
    });
  }

  // If environment has no getUserMedia (e.g. older embedded browser),
  // let SpeechRecognition attempt directly
  return { granted: true };
}
