/**
 * Haptic Feedback Utility - نظام الاهتزاز التفاعلي اللمسي
 * يدعم كلا من جسر أندرويد الأصلي (AndroidBridge) وواجهة المتصفح القياسية (navigator.vibrate)
 * مع صلاحية VIBRATE المعتمدة في النظام.
 */

export type HapticFeedbackType = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

export const isHapticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const direct = localStorage.getItem('haptics_enabled');
    if (direct !== null) return direct !== 'false';
    const settings = localStorage.getItem('app_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (typeof parsed.haptics === 'boolean') return parsed.haptics;
    }
  } catch {}
  return true;
};

export const setHapticsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('haptics_enabled', enabled ? 'true' : 'false');
    const settings = localStorage.getItem('app_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      parsed.haptics = enabled;
      localStorage.setItem('app_settings', JSON.stringify(parsed));
    }
  } catch {}
};

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof window === 'undefined') return;
  if (!isHapticsEnabled()) return;

  const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

  try {
    switch (type) {
      case 'light':
        // نقرة خفيفة عند الضغط على الأزرار والفلاتر والتنقل
        if (bridge && typeof bridge.vibrate === 'function') {
          bridge.vibrate(20);
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate(20);
        }
        break;

      case 'medium':
        // نقرة متوسطة عند فتح النوافذ المنبثقة أو العمليات الأساسية
        if (bridge && typeof bridge.vibrate === 'function') {
          bridge.vibrate(40);
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate(40);
        }
        break;

      case 'selection':
        // نبضة قصيرة عند تغيير اختيار أو خانة
        if (bridge && typeof bridge.vibrate === 'function') {
          bridge.vibrate(25);
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate(25);
        }
        break;

      case 'success':
        // نبضتان متتاليتان واضحتان عند إتمام الحفظ أو السداد
        if (bridge && typeof bridge.vibratePattern === 'function') {
          bridge.vibratePattern("0,35,80,45");
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate([35, 80, 45]);
        }
        break;

      case 'warning':
        // اهتزاز تحذيري عند تجاوز الحد الائتماني
        if (bridge && typeof bridge.vibratePattern === 'function') {
          bridge.vibratePattern("0,45,90,45");
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate([45, 90, 45]);
        }
        break;

      case 'error':
        // اهتزاز ثلاثي عند الحذف
        if (bridge && typeof bridge.vibratePattern === 'function') {
          bridge.vibratePattern("0,55,70,55,70,55");
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate([55, 70, 55, 70, 55]);
        }
        break;

      default:
        if (bridge && typeof bridge.vibrate === 'function') {
          bridge.vibrate(25);
        } else if (window.navigator?.vibrate) {
          window.navigator.vibrate(25);
        }
        break;
    }
  } catch (err) {
    console.debug('Haptics trigger error:', err);
  }
};
