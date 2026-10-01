/**
 * Tactile Haptic Feedback Utility using navigator.vibrate()
 * Provides subtle, satisfying mobile vibration feedback across browser environments.
 */

/**
 * Triggers a subtle vibration on supported mobile devices.
 * Safely guards against desktop browsers, unsupported webviews, and permission errors.
 *
 * @param pattern Duration in ms or an array of duration/pause intervals
 * @returns boolean indicating if the vibration was successfully triggered
 */
export const triggerHaptic = (pattern: number | readonly number[] | number[] = 10): boolean => {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      return navigator.vibrate(pattern as VibratePattern);
    } catch {
      // Gracefully fall back if restricted or not allowed in current context
      return false;
    }
  }
  return false;
};

/**
 * Preset subtle haptic vibration durations (in milliseconds)
 * Kept intentionally short (8-20ms) so they feel crisp and premium rather than buzzy.
 */
export const HAPTIC_FEEDBACK = {
  tap: 10,           // Standard light tap (category chip, pill, tab)
  toggle: 14,        // Toggle switch, shop info collapse/expand, favorite
  light: 8,          // Micro tap (clear search, close)
  selection: 12,     // Selecting product, opening modal
  action: 15,        // Adding to cart, incrementing/decrementing
  voice: [10, 30, 15], // Subtle double-pulse for activating AI Voice Assistant
} as const;
