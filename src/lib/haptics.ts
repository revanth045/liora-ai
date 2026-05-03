/** Lightweight haptic helpers. No-op on devices without `navigator.vibrate`. */

const canVibrate = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const vibrate = (pattern: number | number[]) => {
  try { if (canVibrate()) navigator.vibrate(pattern); } catch { /* ignore */ }
};

export const haptics = {
  tap:     () => vibrate(8),
  select:  () => vibrate(12),
  success: () => vibrate([10, 40, 20]),
  warning: () => vibrate([20, 30, 20]),
  error:   () => vibrate([30, 50, 30, 50, 30]),
};
