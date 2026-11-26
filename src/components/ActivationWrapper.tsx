import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import {
  Crown,
  Check,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Zap,
  Headphones,
  CreditCard,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
  X,
  Cpu,
  Sparkles,
  Smartphone,
  MessageCircle,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { decodeLicenseKey, encodeLicenseKey, MASTER_KEY } from '@/lib/licenseCrypto';

// ==========================================
// 1. تكوين بيانات التطبيق والباقات وأرقام التواصل
// ==========================================
export const CONFIG = {
  appName: 'مزارعنا برو',
  appNameEn: 'Mazareana Pro',
  appSubtitle: 'الإدارة الذكية لمزارعك وتجارتك',
  primaryPhone: '01015965832', // رقم التحويل الأساسي (فودافون كاش / إنستا باي / واتساب 1)
  secondaryPhone: '01042811502', // رقم الواتساب الثانوي (واتساب 2)
  masterKey: 'MashrouaMalia2026',
  plans: [
    {
      id: 'monthly',
      name: 'الباقة الشهرية',
      price: 30,
      unit: 'جنيه / شهر',
      subtext: 'مرونة كاملة • جرّب براحتك',
      note: 'تتجدد يدوياً كل 30 يوم',
      badge: null,
      pillBadge: null,
      isPopular: false,
    },
    {
      id: 'yearly',
      name: 'الباقة السنوية',
      price: 250,
      unit: 'جنيه / سنة',
      subtext: 'سعر أقل بكثير من الباقة الشهرية',
      note: '≈ ٢١ ج.م فقط في الشهر',
      badge: 'الأكثر توفيراً',
      pillBadge: 'وفّر ١١٠ ج.م',
      isPopular: true,
    },
    {
      id: 'lifetime',
      name: 'مدى الحياة',
      price: 1350,
      originalPrice: 4500,
      unit: 'جنيه مصري',
      subtext: 'ادفع مرة واحدة • استخدم للأبد',
      note: 'بدون تجديد • بدون أي رسوم إضافية',
      badge: 'خصم 70%',
      pillBadge: 'خصم 70%',
      isPopular: false,
    },
  ],
};

// تحويل الأرقام الإنجليزية إلى أرقام عربية هندية لمطابقة التصميم بدقة
export const toArabicDigits = (num: number | string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d, 10)]);
};

// ==========================================
// 2. التحقق من كود التفعيل والربط بمعرف العتاد والباقات الثلاث
// ==========================================
export interface KeyVerificationResult {
  isValid: boolean;
  plan: 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  durationDays: number | null;
  expiryDate?: string | null;
  isExpired?: boolean;
  errorMessage?: string;
}

export interface LicenseStatusResult {
  isActivated: boolean;
  isExpired: boolean;
  isTampered: boolean;
  plan: 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  expiryDate: string | null;
  daysRemaining: number | null;
  licenseInfo: any;
  errorNotice?: string;
}

/**
 * تحليل وفحص كود التفعيل بنظام التشفير الجديد (حروف وأرقام مشفرة بداخلها تاريخ الانتهاء)
 */
export const verifyKeyDetails = (devId: string, key: string): KeyVerificationResult => {
  const cleanKey = (key || '').trim().toUpperCase();
  if (!cleanKey) {
    return { isValid: false, plan: 'monthly', planName: '', durationDays: null };
  }

  // 1. كود الماستر للطوارئ
  if (cleanKey === CONFIG.masterKey.toUpperCase() || cleanKey === MASTER_KEY.toUpperCase()) {
    return {
      isValid: true,
      plan: 'lifetime',
      planName: 'مدى الحياة (ماستر)',
      durationDays: null,
      expiryDate: null,
    };
  }

  // 2. فحص نظام التشفير الجديد المعتمد (Date-Embedded Key)
  const decoded = decodeLicenseKey(devId, cleanKey);
  if (decoded.isValid) {
    return {
      isValid: true,
      plan: decoded.tier,
      planName: decoded.planName,
      durationDays: decoded.durationDays,
      expiryDate: decoded.expiryDate,
      isExpired: false
    };
  }

  // إذا كان الكود صحيحاً ولكن تاريخ صلاحيته قد انتهى
  if (decoded.isExpired) {
    return {
      isValid: false,
      plan: decoded.tier,
      planName: decoded.planName,
      durationDays: decoded.durationDays,
      expiryDate: decoded.expiryDate,
      isExpired: true,
      errorMessage: decoded.errorMessage || 'كود التفعيل هذا منتهي الصلاحية ولا يمكن استخدامه مجدداً.'
    };
  }

  // 3. فحص الأكواد السابقة القديمة (Backward Compatibility للأكواد القديمة إن وجدت)
  const numericOnly = devId.replace(/\D/g, '');
  const numericDevId = parseInt(numericOnly || devId, 10);
  if (!isNaN(numericDevId)) {
    const mCode = (((numericDevId * 7) + 314159) % 1000000).toString().padStart(6, '0');
    const yCode = (((numericDevId * 5) + 654321) % 1000000).toString().padStart(6, '0');
    const lCode = (((numericDevId * 3) + 123456) % 1000000).toString().padStart(6, '0');

    if (cleanKey === mCode || cleanKey === `M-${mCode}` || cleanKey === `M${mCode}`) {
      return { isValid: true, plan: 'monthly', planName: 'الباقة الشهرية', durationDays: 30 };
    }
    if (cleanKey === yCode || cleanKey === `Y-${yCode}` || cleanKey === `Y${yCode}`) {
      return { isValid: true, plan: 'yearly', planName: 'الباقة السنوية', durationDays: 365 };
    }
    if (
      cleanKey === lCode ||
      cleanKey === `L-${lCode}` ||
      cleanKey === `L${lCode}` ||
      cleanKey === `MZ-${lCode}` ||
      cleanKey === `MZ${lCode}`
    ) {
      return { isValid: true, plan: 'lifetime', planName: 'مدى الحياة', durationDays: null };
    }
  }

  return {
    isValid: false,
    plan: 'monthly',
    planName: '',
    durationDays: null,
    errorMessage: decoded.errorMessage || 'كود التفعيل غير صحيح لهذا الجهاز.'
  };
};

/**
 * فحص صحة الكود السريع
 */
export const verifyKey = (devId: string, key: string): boolean => {
  return verifyKeyDetails(devId, key).isValid;
};

export const getPersistentDeviceId = (): string => {
  if (typeof window === 'undefined') return 'MZ-8F92-4A1B-90C3';

  // 1. أولاً: فحص معرّف الجهاز العتادي الثابت من أندرويد
  try {
    const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
    if (bridge && typeof bridge.getDeviceId === 'function') {
      const nativeId = bridge.getDeviceId();
      if (nativeId && nativeId.length >= 6) {
        localStorage.setItem("app_device_id", nativeId);
        return nativeId;
      }
    }
  } catch (err) {
    console.warn("Android native device id error:", err);
  }

  // 2. إذا كان متصفح ويب: استخدام المعرف المحفوظ أو توليد معرّف عشوائي
  let savedDeviceId = localStorage.getItem("app_device_id") || localStorage.getItem("mz_hardware_id");
  if (!savedDeviceId) {
    const seg = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    savedDeviceId = `MZ-${seg()}-${seg()}-${seg()}`;
    localStorage.setItem("app_device_id", savedDeviceId);
    localStorage.setItem("mz_hardware_id", savedDeviceId);
  }
  return savedDeviceId;
};

/**
 * فحص سريان وصلاحية الترخيص النشط وتاريخ الانتهاء وحماية تلاعب الساعة
 */
export const verifyActiveLicense = (hardwareId: string): LicenseStatusResult => {
  if (typeof window === 'undefined') {
    return {
      isActivated: true,
      isExpired: false,
      isTampered: false,
      plan: 'lifetime',
      planName: 'مدى الحياة',
      expiryDate: null,
      daysRemaining: null,
      licenseInfo: null
    };
  }

  let savedKey = localStorage.getItem("app_activation_key") || localStorage.getItem("mz_activation_code");
  if (!savedKey) {
    try {
      const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
      if (bridge && typeof bridge.getPersistentLicense === 'function') {
        const nativeKey = bridge.getPersistentLicense();
        if (nativeKey && verifyKey(hardwareId, nativeKey)) {
          savedKey = nativeKey;
          localStorage.setItem("app_activation_key", nativeKey);
          localStorage.setItem("app_activated", "true");
        }
      }
    } catch {}
  }

  if (!savedKey) {
    return {
      isActivated: false,
      isExpired: false,
      isTampered: false,
      plan: 'monthly',
      planName: '',
      expiryDate: null,
      daysRemaining: null,
      licenseInfo: null
    };
  }

  const keyDetails = verifyKeyDetails(hardwareId, savedKey);
  if (!keyDetails.isValid) {
    return {
      isActivated: false,
      isExpired: false,
      isTampered: false,
      plan: 'monthly',
      planName: '',
      expiryDate: null,
      daysRemaining: null,
      licenseInfo: null
    };
  }

  let licenseInfo: any = null;
  try {
    const raw = localStorage.getItem('mz_active_license');
    if (raw) licenseInfo = JSON.parse(raw);
  } catch {}

  // إذا كانت الباقة مدى الحياة -> تفعيل دائم بدون انتهاء
  if (keyDetails.plan === 'lifetime') {
    return {
      isActivated: true,
      isExpired: false,
      isTampered: false,
      plan: 'lifetime',
      planName: 'مدى الحياة',
      expiryDate: null,
      daysRemaining: null,
      licenseInfo
    };
  }

  // فحص حماية التلاعب بالساعة (Clock Tampering Check)
  const now = Date.now();
  const lastCheckStr = localStorage.getItem("app_license_last_check");
  if (lastCheckStr) {
    const lastCheck = parseInt(lastCheckStr, 10);
    // إذا رجعت الساعة للوراء بأكثر من ساعتين
    if (lastCheck > 0 && now < lastCheck - (2 * 60 * 60 * 1000)) {
      return {
        isActivated: false,
        isExpired: false,
        isTampered: true,
        plan: keyDetails.plan,
        planName: keyDetails.planName,
        expiryDate: localStorage.getItem("app_license_expiry"),
        daysRemaining: null,
        licenseInfo,
        errorNotice: 'تم رصد تراجع في توقيت أو تاريخ الجهاز. يرجى ضبط الوقت التلقائي من شبكة الهاتف للمتابعة.'
      };
    }
  }

  // فحص تاريخ الانتهاء
  let expiryDate = localStorage.getItem("app_license_expiry");
  if (!expiryDate && keyDetails.durationDays) {
    const activatedAtStr = localStorage.getItem("app_license_activated_at") || localStorage.getItem("app_activated_at");
    const baseTime = activatedAtStr ? new Date(activatedAtStr).getTime() : now;
    const exp = new Date(baseTime + keyDetails.durationDays * 24 * 60 * 60 * 1000);
    expiryDate = exp.toISOString();
    localStorage.setItem("app_license_expiry", expiryDate);
  }

  if (expiryDate) {
    const expTime = new Date(expiryDate).getTime();
    if (!isNaN(expTime)) {
      if (now > expTime) {
        // انتهى الاشتراك!
        localStorage.setItem("app_activated", "expired");
        return {
          isActivated: false,
          isExpired: true,
          isTampered: false,
          plan: keyDetails.plan,
          planName: keyDetails.planName,
          expiryDate,
          daysRemaining: 0,
          licenseInfo,
          errorNotice: `انتهت فترة اشتراكك في (${keyDetails.planName}). يرجى إدخال كود تفعيل جديد للتجديد أو التواصل معنا عبر واتساب.`
        };
      } else {
        const daysRemaining = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));
        try {
          localStorage.setItem("app_license_last_check", now.toString());
        } catch {}
        return {
          isActivated: true,
          isExpired: false,
          isTampered: false,
          plan: keyDetails.plan,
          planName: keyDetails.planName,
          expiryDate,
          daysRemaining,
          licenseInfo
        };
      }
    }
  }

  try {
    localStorage.setItem("app_license_last_check", now.toString());
  } catch {}

  return {
    isActivated: true,
    isExpired: false,
    isTampered: false,
    plan: keyDetails.plan,
    planName: keyDetails.planName,
    expiryDate: null,
    daysRemaining: null,
    licenseInfo
  };
};

const getInitialDeviceAndActivation = () => {
  if (typeof window === 'undefined') {
    return {
      hardwareId: 'MZ-8F92-4A1B-90C3',
      isActivated: true,
      licenseInfo: null,
      status: {
        isActivated: true,
        isExpired: false,
        isTampered: false,
        plan: 'lifetime' as const,
        planName: 'مدى الحياة',
        expiryDate: null,
        daysRemaining: null,
        licenseInfo: null
      }
    };
  }
  const hwId = getPersistentDeviceId();
  const status = verifyActiveLicense(hwId);
  return {
    hardwareId: hwId,
    isActivated: status.isActivated,
    licenseInfo: status.licenseInfo,
    status
  };
};

// أيقونة واتساب مخصصة مطابقة للتصميم
const WhatsAppIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.031 2C6.508 2 2.023 6.485 2.023 12.008c0 1.766.46 3.49 1.335 5.012L2 22l5.122-1.343a9.963 9.963 0 0 0 4.909 1.29h.004c5.522 0 10.007-4.485 10.007-10.008A9.946 9.946 0 0 0 19.11 4.93 9.939 9.939 0 0 0 12.031 2zm5.825 14.155c-.246.693-1.428 1.326-1.976 1.409-.506.077-1.147.11-1.851-.114-.427-.136-.976-.318-1.678-.621-2.952-1.275-4.88-4.249-5.027-4.445-.147-.196-1.2-1.596-1.2-3.045 0-1.449.759-2.161 1.029-2.456.27-.295.589-.368.785-.368.196 0 .392.002.564.01.181.009.423-.069.662.505.246.589.835 2.038.908 2.186.074.147.123.319.025.515-.098.196-.147.319-.295.491-.147.172-.31.384-.442.515-.147.147-.301.307-.129.602.172.295.763 1.259 1.639 2.04 1.126 1.004 2.075 1.315 2.37 1.462.295.147.467.123.639-.074.172-.196.737-.859.933-1.154.196-.295.392-.246.662-.147.27.098 1.719.811 2.014.958.295.147.491.221.564.344.074.123.074.712-.172 1.405z" />
  </svg>
);

// شعار التطبيق المخصص (مزارعنا برو)
const AppLogoBadge = () => (
  <div className="relative w-20 h-20 rounded-full bg-slate-900/90 border-2 border-blue-400/40 shadow-2xl flex flex-col items-center justify-center p-2 mx-auto backdrop-blur-md">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 flex items-center justify-center shadow-lg transform -rotate-3 overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Logo"
        className="w-full h-full object-contain p-0.5"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      <span className="text-white font-black text-xl tracking-tighter">M</span>
    </div>
    <span className="text-[9px] font-bold text-emerald-400 mt-1 tracking-tight">
      Mazareana
    </span>
  </div>
);

// ==========================================
// 3. شاشة التفعيل والاشتراكات (ActivationScreen)
// ==========================================
export const ActivationScreen: React.FC<{
  hardwareId: string;
  onSuccess: (licenseData: any) => void;
  triggerToast?: (title: string, subtitle?: string) => void;
  expiredNotice?: string;
  isTampered?: boolean;
}> = ({ hardwareId: propHardwareId, onSuccess, triggerToast, expiredNotice, isTampered }) => {
  const [hardwareId, setHardwareId] = useState(propHardwareId || getPersistentDeviceId());
  const initialView = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('login')) return 'login';
      if (window.location.hash.includes('plans')) return 'plans';
      if ((window as any).AndroidBridge) return 'login';
    }
    return 'landing';
  };
  const [view, setView] = useState<'login' | 'plans' | 'landing'>(initialView);
  const [selectedPlanId, setSelectedPlanId] = useState('yearly');
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

  // حالات تسجيل الدخول بالكود
  const [activationCode, setActivationCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // تحديث معرّف الجهاز عند استقرار WebView
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
          if (bridge && typeof bridge.getDeviceId === 'function') {
            const nativeId = bridge.getDeviceId();
            if (nativeId && nativeId.length >= 6) {
              setHardwareId(nativeId);
              localStorage.setItem("app_device_id", nativeId);
            }
          }
        } catch {}
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const selectedPlan =
    CONFIG.plans.find((p) => p.id === selectedPlanId) || CONFIG.plans[1];

  // نسخ النص للحافظة
  const copyToClipboard = async (text: string) => {
    try {
      const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech || (window as any).AndroidApp;
      if (bridge && typeof bridge.copyToClipboard === 'function') {
        bridge.copyToClipboard(text);
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  };

  const showNotification = (title: string, subtitle = '') => {
    if (triggerToast) {
      triggerToast(title, subtitle);
    } else {
      toast.success(title, { description: subtitle });
    }
    triggerHaptic('light');
  };

  // نسخ معرّف الجهاز Hardware ID
  const handleCopyHardwareId = async () => {
    await copyToClipboard(hardwareId);
    showNotification(
      `تم نسخ معرّف الجهاز (${hardwareId})`,
      'أرسله لنا على واتساب لاستلام كود التفعيل الخاص بجهازك'
    );
  };

  // فتح واتساب برقم ورسالة جاهزة تتضمن معرّف الجهاز
  const openWhatsApp = (phone: string, customMessage: string) => {
    const formattedPhone = phone.startsWith('0') ? `2${phone}` : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      customMessage
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    triggerHaptic('success');
  };

  // معالجة وسائل الدفع الثلاث
  const handlePaymentMethod = async (method: 'vf_link' | 'vf_ussd' | 'instapay') => {
    const amount = selectedPlan.price;
    const phone = CONFIG.primaryPhone;

    if (method === 'vf_link') {
      await copyToClipboard(`${amount}`);
      showNotification(
        `تم نسخ المبلغ (${amount} ج.م) والرقم ${phone}`,
        'جاري فتح صفحة الدفع المباشرة لفودافون كاش...'
      );
      setTimeout(() => {
        window.open(
          `http://vf.eg/vfcash?id=mt&qrId=0&msisdn=${phone}&amount=${amount}`,
          '_blank',
          'noopener,noreferrer'
        );
      }, 600);
    } else if (method === 'vf_ussd') {
      const ussdCode = `*9*7*${phone}*${amount}#`;
      await copyToClipboard(ussdCode);
      showNotification(
        `تم تجهيز الكود السريع: ${ussdCode}`,
        'جاري تحويلك للاتصال أو انسخ الكود للتحويل فوراً'
      );
      setTimeout(() => {
        window.location.href = `tel:${encodeURIComponent(ussdCode)}`;
      }, 500);
    } else if (method === 'instapay') {
      await copyToClipboard(phone);
      showNotification(
        `تم نسخ رقم التحويل (${phone}) بنجاح!`,
        `افتح تطبيق إنستا باي وأرسل مبلغ ${amount} ج.م للرقم المنسوخ`
      );
    }
  };

  // التحقق من كود التفعيل وتحديد الباقة وحساب الانتهاء
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = activationCode.trim();
    if (!cleaned) {
      setLoginError('من فضلك أدخل كود التفعيل للمتابعة');
      triggerHaptic('warning');
      return;
    }

    setIsVerifying(true);
    triggerHaptic('medium');

    setTimeout(() => {
      const keyDetails = verifyKeyDetails(hardwareId, cleaned);
      if (keyDetails.isValid) {
        setLoginError('');
        const now = new Date();
        let expiryDate: string | null = keyDetails.expiryDate || null;
        if (!expiryDate && keyDetails.durationDays) {
          const exp = new Date(now.getTime() + keyDetails.durationDays * 24 * 60 * 60 * 1000);
          expiryDate = exp.toISOString();
        }

        const licenseData = {
          code: cleaned,
          plan: keyDetails.plan,
          planName: keyDetails.planName,
          durationDays: keyDetails.durationDays,
          activatedAt: now.toISOString(),
          activatedAtFormatted: now.toLocaleDateString('ar-EG'),
          expiryDate,
          hardwareId,
        };

        localStorage.setItem("app_activation_key", cleaned);
        localStorage.setItem("app_activated", "true");
        localStorage.setItem("mz_active_license", JSON.stringify(licenseData));
        localStorage.setItem("app_license_plan", keyDetails.plan);
        localStorage.setItem("app_license_plan_name", keyDetails.planName);
        localStorage.setItem("app_license_activated_at", now.toISOString());
        localStorage.setItem("app_license_last_check", Date.now().toString());

        if (expiryDate) {
          localStorage.setItem("app_license_expiry", expiryDate);
        } else {
          localStorage.removeItem("app_license_expiry");
        }

        try {
          const bridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
          if (bridge && typeof bridge.savePersistentLicense === 'function') {
            bridge.savePersistentLicense(cleaned);
          }
        } catch {}

        triggerHaptic('success');
        showNotification(
          `تم تفعيل ${CONFIG.appName} بنجاح!`,
          `الباقة: ${keyDetails.planName} ${keyDetails.durationDays ? `(${keyDetails.durationDays} يوماً)` : '(دائم)'}`
        );
        onSuccess(licenseData);
      } else {
        triggerHaptic('error');
        setLoginError(
          keyDetails.errorMessage ||
          'كود التفعيل غير صحيح لهذا الجهاز. يرجى التأكد من الكود أو التواصل مع الدعم الفني عبر واتساب.'
        );
      }
      setIsVerifying(false);
    }, 400);
  };

  /* =========================================================
     الشاشة الأولى: شاشة الموقع التعريفي (Landing Page)
     ========================================================= */
  if (view === 'landing') {
    return (
      <LandingPage
        onOpenLogin={() => {
          setView('login');
          triggerHaptic('light');
        }}
        onOpenPlans={() => {
          setView('plans');
          triggerHaptic('light');
        }}
        hardwareId={hardwareId}
      />
    );
  }

  /* =========================================================
     الشاشة الثانية: شاشة تسجيل الدخول بكود التفعيل (Login Screen)
     مطابقة تماماً للصورة الثالثة media_1794505057785_30dbd6c8.jpg
     ========================================================= */
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#E9EEF7] flex justify-center p-0 sm:p-4 selection:bg-blue-600 selection:text-white" dir="rtl">
        <div className="w-full max-w-lg min-h-screen sm:min-h-0 bg-[#F4F7FC] relative shadow-2xl sm:rounded-[36px] overflow-x-hidden flex flex-col">
          {/* شريط العودة للموقع التعريفي ومميزات البرنامج */}
          <div className="px-5 py-2.5 bg-[#11255A] flex items-center justify-between text-xs font-bold border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setView('landing');
                triggerHaptic('light');
              }}
              className="text-blue-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer py-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>موقع ومميزات البرنامج</span>
            </button>
            <span className="text-[11px] text-blue-300/80 font-mono">ID: {hardwareId}</span>
          </div>

          <div className="flex-1 flex flex-col bg-[#F1F5FB]">
            {/* الجزء العلوي الأزرق الملكي الداكن (Hero Header) */}
            <div className="relative bg-gradient-to-b from-[#11255A] via-[#193B8E] to-[#1E50C5] text-white pt-8 pb-16 px-6 text-center overflow-hidden">
              {/* دوائر زخرفية في الخلفية */}
              <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-28 -left-16 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />

              <div className="relative z-10">
                <AppLogoBadge />

                <h1 className="text-3xl font-black mt-3.5 tracking-tight">
                  {CONFIG.appName}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                  {CONFIG.appSubtitle}
                </p>
              </div>
            </div>

        {/* الكارت الأبيض بحواف دائرية علوية كبيرة */}
        <div className="relative z-20 -mt-8 mx-4 bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 flex-1 flex flex-col justify-between mb-4">
          <div>
            <div className="text-right mb-5">
              <h2 className="text-2xl font-black text-slate-900">
                تسجيل الدخول
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                أدخل كود التفعيل للمتابعة
              </p>
            </div>

            {/* تنبيه انتهاء الاشتراك أو حماية الوقت والتاريخ */}
            {expiredNotice && (
              <div className="mb-4 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-2.5 text-right animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-black text-rose-900 block">
                    {isTampered ? 'تنبيه أمان: توقيت وتاريخ الجهاز' : 'انتهاء فترة الاشتراك'}
                  </span>
                  <p className="text-[11px] font-bold text-rose-700 mt-0.5 leading-relaxed">
                    {expiredNotice}
                  </p>
                </div>
              </div>
            )}

            {/* شريط معرّف الجهاز Hardware ID القابل للنسخ */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-right">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block leading-none">
                    معرّف الجهاز (Hardware ID)
                  </span>
                  <span
                    dir="ltr"
                    className="text-xs font-mono font-extrabold text-slate-800 tracking-wider"
                  >
                    {hardwareId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyHardwareId}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* حقل إدخال كود التفعيل */}
              <div className="relative">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  type={showCode ? 'text' : 'password'}
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="كود التفعيل"
                  className="w-full bg-slate-50/70 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl py-3.5 pr-12 pl-12 text-right font-bold text-slate-900 placeholder:text-slate-400 placeholder:text-xs outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 left-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCode ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {loginError && (
                <p className="text-xs font-bold text-red-600 text-right pr-1 leading-relaxed">
                  {loginError}
                </p>
              )}

              {/* زر الدخول */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-base shadow-lg shadow-blue-600/25 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <span>جاري التحقق...</span>
                ) : (
                  <span>دخول</span>
                )}
              </button>

              {/* زر: مفيش كود؟ اشترك الآن */}
              <button
                type="button"
                onClick={() => {
                  setView('plans');
                  triggerHaptic('light');
                }}
                className="w-full py-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-extrabold text-sm active:scale-[0.99] transition cursor-pointer"
              >
                مفيش كود؟ اشترك الآن
              </button>
            </form>
          </div>

          {/* قسم التواصل عبر واتساب + تذييل الحماية */}
          <div className="mt-6 pt-3">
            <div className="relative flex items-center justify-center mb-3.5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-bold text-slate-400 whitespace-nowrap">
                تواصل معنا عبر واتساب
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    CONFIG.primaryPhone,
                    `السلام عليكم، أحتاج كود تفعيل لتطبيق ${CONFIG.appName}\nمعرّف الجهاز: ${hardwareId}`
                  )
                }
                className="py-2.5 px-3 rounded-2xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span dir="ltr">{CONFIG.primaryPhone}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    CONFIG.secondaryPhone,
                    `السلام عليكم، أحتاج كود تفعيل لتطبيق ${CONFIG.appName}\nمعرّف الجهاز: ${hardwareId}`
                  )
                }
                className="py-2.5 px-3 rounded-2xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span dir="ltr">{CONFIG.secondaryPhone}</span>
              </button>
            </div>

            {/* شريط الحماية المشفرة */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2.5 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>نظام ترخيص مشفر ومحمي بمعرّف العتاد (Hardware ID)</span>
            </div>
          </div>
        </div>

        {/* حقوق الملكية */}
        <div className="text-center pb-4 text-[11px] font-bold text-slate-400">
          {CONFIG.appNameEn} © ٢٠٢٦
        </div>
      </div>
    </div>
  </div>
    );
  }

  /* =========================================================
     الشاشة الثالثة: شاشة اختيار الباقات (Pricing Plans Screen)
     مطابقة تماماً للصورة الثانية media_1794505057783_7d068ce5.jpg
     ========================================================= */
  return (
    <div className="min-h-screen bg-[#E9EEF7] flex justify-center p-0 sm:p-4 selection:bg-blue-600 selection:text-white" dir="rtl">
      <div className="w-full max-w-lg min-h-screen sm:min-h-0 bg-[#F4F7FC] relative shadow-2xl sm:rounded-[36px] overflow-x-hidden flex flex-col">
        {/* شريط العودة للموقع */}
        <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm flex items-center justify-between text-xs font-bold border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setView('landing');
              triggerHaptic('light');
            }}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition cursor-pointer py-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للموقع التعريفي</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setView('login');
              triggerHaptic('light');
            }}
            className="text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 transition cursor-pointer py-1"
          >
            <span>تسجيل الدخول</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-[#F4F7FC] relative overflow-x-hidden" dir="rtl">
          {/* خلفية زخرفية دائرية علوية مطابقة للصورة */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-200/45 pointer-events-none" />
          <div className="absolute top-12 -right-14 w-36 h-36 rounded-full bg-blue-200/35 pointer-events-none" />

      <div className="relative z-10 px-5 pt-6 pb-32 flex-1">
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => {
              setView('login');
              triggerHaptic('light');
            }}
            title="العودة لتسجيل الدخول"
            className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-extrabold text-blue-700 tracking-wide">
              {CONFIG.appNameEn}
            </span>
          </div>
        </div>

        {/* أيقونة التاج الزرقاء */}
        <div className="flex justify-start mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-600/25 flex items-center justify-center text-white">
            <Crown className="w-7 h-7 fill-white/90" />
          </div>
        </div>

        {/* العنوان والوصف */}
        <div className="text-right mb-6">
          <h1 className="text-[26px] font-black text-slate-900 leading-tight">
            اختار الباقة اللي تناسبك
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
            أدِر مزرعتك وتجارتك بذكاء مع{' '}
            <span className="text-blue-700 font-bold">{CONFIG.appName}</span>،
            وادفع بالطريقة اللي تريحك.
          </p>
        </div>

        {/* بطاقات الباقات الثلاث */}
        <div className="space-y-4 mb-6">
          {CONFIG.plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  triggerHaptic('light');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedPlanId(plan.id);
                  }
                }}
                className={`relative rounded-[24px] p-5 cursor-pointer transition-all duration-300 select-none overflow-visible active:scale-[0.99] ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#16347A] via-[#1B4298] to-[#1D54C6] text-white shadow-xl shadow-blue-900/20 scale-[1.01]'
                    : 'bg-white text-slate-900 border border-slate-200/80 shadow-sm hover:border-blue-300'
                }`}
              >
                {/* شارة "الأكثر توفيراً" العلوية */}
                {plan.badge && (
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-white" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                {/* دوائر زخرفية خفيفة داخل البطاقة المحددة */}
                {isSelected && (
                  <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
                    <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-white/5" />
                    <div className="absolute right-12 -bottom-12 w-32 h-32 rounded-full bg-blue-400/10" />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between gap-3">
                  {/* اليمين: زر الاختيار الدائري + تفاصيل الباقة */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'border-2 border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="text-right">
                      <h2
                        className={`text-lg font-extrabold leading-snug ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {plan.name}
                      </h2>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {plan.subtext}
                      </p>
                      <p
                        className={`text-xs font-bold mt-1 ${
                          isSelected ? 'text-amber-300' : 'text-blue-600'
                        }`}
                      >
                        {plan.note}
                      </p>
                    </div>
                  </div>

                  {/* اليسار: السعر والوحدة والشارة السفلية */}
                  <div className="text-center shrink-0 min-w-[84px]">
                    {'originalPrice' in plan && (plan as any).originalPrice && (
                      <div
                        className={`text-[11px] font-bold line-through mb-0.5 ${
                          isSelected ? 'text-amber-200/90' : 'text-slate-400'
                        }`}
                      >
                        {toArabicDigits((plan as any).originalPrice)} ج.م
                      </div>
                    )}
                    <div
                      className={`text-3xl font-black tracking-tight leading-none ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {toArabicDigits(plan.price)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold mt-1 ${
                        isSelected ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      {plan.unit}
                    </div>

                    {plan.pillBadge && (
                      <div
                        className={`mt-2 inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {plan.pillBadge}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* صف البطاقات المصغرة الثلاث للمميزات */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-snug">
              كود التفعيل
              <br />
              على واتساب
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-snug">
              ٣ طرق
              <br />
              دفع
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-snug">
              دعم
              <br />
              مباشر
            </span>
          </div>
        </div>

        {/* قسم: إزاي بيتم التفعيل؟ */}
        <div className="mb-5">
          <h3 className="text-base font-extrabold text-slate-900 mb-3 text-right">
            إزاي بيتم التفعيل؟
          </h3>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="relative flex items-start justify-between">
              {/* خط أفقي متصل خلف الدوائر */}
              <div className="absolute top-4 right-7 left-7 h-[2px] bg-slate-200 z-0" />

              {[
                { num: '١', line1: 'اختر', line2: 'باقتك' },
                { num: '٢', line1: 'ادفع بأي', line2: 'وسيلة' },
                { num: '٣', line1: 'الكود يوصلك', line2: 'على واتساب' },
                { num: '٤', line1: 'فعّل', line2: 'واستمتع' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="relative z-10 flex flex-col items-center text-center w-1/4"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-extrabold flex items-center justify-center shadow-md shadow-blue-600/20 mb-2">
                    {step.num}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 leading-tight">
                    {step.line1}
                    <br />
                    {step.line2}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* صندوق التنبيه الأخضر */}
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 mb-5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <WhatsAppIcon className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900">
              كود التفعيل بيوصلك على واتساب
            </h4>
            <p className="text-[11px] sm:text-xs text-emerald-800/90 font-medium mt-0.5 leading-relaxed">
              هيوصلك على نفس الرقم اللي دفعت منه، فاتأكد إن عليه واتساب شغال.
            </p>
          </div>
        </div>

        {/* زر: عندي كود تفعيل بالفعل */}
        <button
          onClick={() => {
            setView('login');
            triggerHaptic('light');
          }}
          className="w-full py-3.5 px-5 rounded-2xl bg-white border border-blue-200 text-blue-700 font-extrabold text-sm shadow-sm hover:bg-blue-50 active:scale-[0.99] transition mb-4 cursor-pointer"
        >
          عندي كود تفعيل بالفعل
        </button>

        {/* رابط الدعم المباشر على واتساب */}
        <div className="text-center">
          <button
            onClick={() =>
              openWhatsApp(
                CONFIG.primaryPhone,
                `السلام عليكم، أستفسر بخصوص كود تفعيل تطبيق ${CONFIG.appName}\nمعرّف الجهاز: ${hardwareId}`
              )
            }
            className="inline-flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-xs sm:text-sm py-1 cursor-pointer"
          >
            <span>الكود ماوصلش؟ كلمنا على واتساب</span>
            <WhatsAppIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* الشريط السفلي الثابت (Sticky Checkout Bar) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-5 py-3.5 z-30 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-400">
              {selectedPlan.name}
            </p>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {toArabicDigits(selectedPlan.price)} ج.م
            </p>
          </div>

          <button
            onClick={() => {
              setIsPaymentSheetOpen(true);
              triggerHaptic('medium');
            }}
            className="flex-1 max-w-[230px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>ادفع الآن</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          الشاشة الثالثة: نافذة اختيار وسيلة الدفع (Bottom Sheet Modal)
          مطابقة تماماً للصورة الأولى media_1794505057782_56924af2.jpg
         ========================================================= */}
      {isPaymentSheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" dir="rtl">
          {/* خلفية معتمة */}
          <div
            onClick={() => setIsPaymentSheetOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity"
          />

          {/* محتوى الـ Bottom Sheet */}
          <div className="relative z-50 w-full max-w-[460px] bg-white rounded-t-[32px] px-5 pt-3 pb-7 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* مقبض السحب العلوي */}
            <div
              onClick={() => setIsPaymentSheetOpen(false)}
              className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 cursor-pointer"
            />

            {/* عنوان النافذة */}
            <div className="text-right mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  اختر وسيلة الدفع
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  اضغط على الوسيلة اللي تناسبك والباقي علينا.
                </p>
              </div>
              <button
                onClick={() => setIsPaymentSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بطاقة ملخص الباقة المختارة */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16347A] via-[#1B4298] to-[#1D54C6] text-white p-4 mb-4 shadow-md">
              <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="text-right">
                  <span className="text-[11px] text-blue-200 font-semibold block">
                    الباقة اللي اخترتها
                  </span>
                  <span className="text-base font-extrabold">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black">
                    {toArabicDigits(selectedPlan.price)} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* خيارات الدفع الثلاث */}
            <div className="space-y-3 mb-5">
              {/* 1. فودافون كاش - لينك الدفع */}
              <button
                type="button"
                onClick={() => handlePaymentMethod('vf_link')}
                className="w-full bg-[#EEF3FB] hover:bg-blue-100/70 active:scale-[0.99] transition rounded-2xl p-3.5 flex items-center justify-between gap-3 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#E60000] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                    V
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      فودافون كاش • لينك الدفع
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      يفتح لك صفحة الدفع مباشرة والمبلغ منسوخ
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </button>

              {/* 2. فودافون كاش - كود سريع */}
              <button
                type="button"
                onClick={() => handlePaymentMethod('vf_ussd')}
                className="w-full bg-[#EEF3FB] hover:bg-blue-100/70 active:scale-[0.99] transition rounded-2xl p-3.5 flex items-center justify-between gap-3 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-red-100 text-[#E60000] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      فودافون كاش • كود سريع
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      تحويل بدون إنترنت — المبلغ بيتكتب تلقائي (
                      <span dir="ltr" className="font-bold text-slate-700">
                        {CONFIG.primaryPhone}
                      </span>
                      )
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </button>

              {/* 3. إنستا باي */}
              <button
                type="button"
                onClick={() => handlePaymentMethod('instapay')}
                className="w-full bg-[#EEF3FB] hover:bg-blue-100/70 active:scale-[0.99] transition rounded-2xl p-3.5 flex items-center justify-between gap-3 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      إنستا باي (InstaPay)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      هننسخ الرقم{' '}
                      <span dir="ltr" className="font-bold text-slate-700">
                        {CONFIG.primaryPhone}
                      </span>{' '}
                      — الصقه في التطبيق وحوّل المبلغ
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* تذييل النافذة */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 pt-1">
              <WhatsAppIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                كود التفعيل هيوصلك على واتساب على نفس الرقم اللي دفعت منه.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
  );
};

// ==========================================
// 4. غلاف الحماية والتفعيل (ActivationWrapper)
// ==========================================
export interface ActivationWrapperProps {
  children?: React.ReactNode | ((props: { licenseInfo: any; onLogout: () => void }) => React.ReactNode);
  config?: any;
  onActivated?: (licenseInfo?: any) => void;
}

export const ActivationWrapper: React.FC<ActivationWrapperProps> = ({
  children,
  onActivated,
}) => {
  const location = useLocation();
  const [initialData] = useState(getInitialDeviceAndActivation);
  const [hardwareId, setHardwareId] = useState<string>(initialData.hardwareId);
  const [isActivated, setIsActivated] = useState<boolean>(initialData.isActivated);
  const [licenseInfo, setLicenseInfo] = useState<any>(initialData.licenseInfo);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusResult>(initialData.status);
  const [toastBanner, setToastBanner] = useState<{ title: string; subtitle?: string } | null>(null);

  const triggerToast = (title: string, subtitle = '') => {
    setToastBanner({ title, subtitle });
    setTimeout(() => {
      setToastBanner(null);
    }, 3800);
  };

  // فحص دوري مستمر لصلاحية الترخيص ومراقبة تاريخ الجهاز وحماية التلاعب
  useEffect(() => {
    const checkLicense = () => {
      const currentHwId = getPersistentDeviceId();
      setHardwareId(currentHwId);
      const currentStatus = verifyActiveLicense(currentHwId);
      setLicenseStatus(currentStatus);
      setIsActivated(currentStatus.isActivated);
      if (currentStatus.licenseInfo) {
        setLicenseInfo(currentStatus.licenseInfo);
      }
    };

    // فحص دوري كل 30 ثانية
    const interval = setInterval(checkLicense, 30000);

    // فحص عند عودة التركيز للتطبيق
    const handleVisibility = () => {
      if (!document.hidden) {
        checkLicense();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkLicense);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkLicense);
    };
  }, []);

  const handleActivationSuccess = (newLicense: any) => {
    try {
      localStorage.setItem('mz_active_license', JSON.stringify(newLicense));
      localStorage.setItem('app_activated', 'true');
    } catch {}

    setLicenseInfo(newLicense);
    setIsActivated(true);
    setLicenseStatus({
      isActivated: true,
      isExpired: false,
      isTampered: false,
      plan: newLicense.plan || 'monthly',
      planName: newLicense.planName || 'الباقة النشطة',
      expiryDate: newLicense.expiryDate || null,
      daysRemaining: newLicense.durationDays || null,
      licenseInfo: newLicense,
    });

    triggerToast(
      `تم تفعيل ${CONFIG.appName} بنجاح!`,
      `الترخيص مرتبط بمعرّف الجهاز: ${hardwareId}`
    );
    if (onActivated) onActivated(newLicense);
  };

  const handleResetActivation = () => {
    try {
      localStorage.removeItem('mz_active_license');
      localStorage.removeItem('app_activated');
      localStorage.removeItem('app_activation_key');
      localStorage.removeItem('app_license_expiry');
      localStorage.removeItem('app_license_plan');
      localStorage.removeItem('app_license_plan_name');
    } catch {}
    setIsActivated(false);
    setLicenseInfo(null);
  };

  // إذا كان المسار هو صفحة الهبوط أو الموقع الرئيسي، اعرضها مباشرة للجميع دون حجب
  if (location.pathname === '/' || location.pathname === '/landing') {
    return (
      <>{typeof children === 'function' ? children({ licenseInfo, onLogout: handleResetActivation }) : children}</>
    );
  }

  if (isActivated) {
    return (
      <>
        {toastBanner && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold leading-snug">{toastBanner.title}</p>
                {toastBanner.subtitle && (
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {toastBanner.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => setToastBanner(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {typeof children === 'function'
          ? children({ licenseInfo, onLogout: handleResetActivation })
          : children}
      </>
    );
  }

  return (
    <div
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      className="min-h-screen selection:bg-blue-600 selection:text-white"
    >
      {/* إشعار Toast علوي تفاعلي مطابقة للتصميم */}
      {toastBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold leading-snug">{toastBanner.title}</p>
              {toastBanner.subtitle && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {toastBanner.subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => setToastBanner(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ActivationScreen
        hardwareId={hardwareId}
        onSuccess={handleActivationSuccess}
        triggerToast={triggerToast}
        expiredNotice={licenseStatus?.errorNotice}
        isTampered={licenseStatus?.isTampered}
      />
    </div>
  );
};

export default ActivationWrapper;
