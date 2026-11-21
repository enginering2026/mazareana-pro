/**
 * Payment & Instant Activation Service
 * نظام الدفع المباشر والتفعيل وإدارة التراخيص (شهري • سنوي • مدى الحياة)
 * مع التحقق من صلاحية وتاريخ التفعيل وحماية تلاعب الساعة
 */

import { triggerHaptic } from './haptics';
import { encodeLicenseKey } from './licenseCrypto';

export interface SubscriptionPlan {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  price: number;
  period: string;
  durationDays: number | null; // null for lifetime
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'الباقة الشهرية',
    price: 30,
    period: 'شهرياً (٣٠ يوماً)',
    durationDays: 30,
    popular: false,
    features: [
      'صلاحية لمدة 30 يوماً من تاريخ التفعيل',
      'مرونة كاملة وتجديد حسب الرغبة',
      'إدارة المزارع والقطعان والمحاسبة',
      'المساعد الصوتي الذكي وكشوفات PDF'
    ]
  },
  {
    id: 'yearly',
    name: 'الباقة السنوية',
    price: 250,
    period: 'سنوياً (٣٦٥ يوماً)',
    durationDays: 365,
    popular: true,
    features: [
      'صلاحية لمدة سنة كاملة قابلة للتجديد',
      'وفر أكثر من 110 جنيه مقارنة بالشهري',
      'إدارة جميع المزارع والعمليات بلا حدود',
      'المزامنة السحابية الكاملة والتقارير الاحترافية',
      'تحديثات النظام طوال فترة الاشتراك'
    ]
  },
  {
    id: 'lifetime',
    name: 'الترخيص الدائم (مدى الحياة)',
    price: 1350,
    period: 'دفعة واحدة للأبد',
    durationDays: null,
    popular: false,
    features: [
      'استخدام مفتوح لمدى الحياة بدون أي تجديد',
      'إدارة عدد لا نهائي من المزارع والعنابر',
      'النسخ الاحتياطي ومشاركة واتساب وPDF',
      'تحديثات مجانية مستمرة ودعم فني دائم'
    ]
  }
];

export type PaymentMethodType = 'wallet' | 'card' | 'gateway';

export interface PaymentTransaction {
  txId: string;
  deviceId: string;
  planId: string;
  amount: number;
  method: PaymentMethodType;
  payerPhone?: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
}

/**
 * حساب مفتاح التفعيل الرسمي المعتمد للجهاز بنظام التشفير الذكي
 */
export const calculateDeviceKey = (
  devId: string,
  plan: 'monthly' | 'yearly' | 'lifetime' = 'lifetime',
  expiryDate?: Date | string | null
): string => {
  let exp = expiryDate;
  if (!exp && plan !== 'lifetime') {
    const days = plan === 'monthly' ? 30 : 365;
    exp = new Date(Date.now() + days * 86400000);
  }
  return encodeLicenseKey(devId, exp || null, plan);
};

/**
 * جلب تفاصيل الترخيص المحفوظ بالجهاز مع فحص الصلاحية وحساب الأيام المتبقية
 */
export const getStoredLicenseInfo = () => {
  if (typeof window === 'undefined') return null;

  const rawActivated = localStorage.getItem("app_activated");
  const isActivated = rawActivated === "true";
  const plan = (localStorage.getItem("app_license_plan") || (isActivated ? "lifetime" : "monthly")) as 'monthly' | 'yearly' | 'lifetime';
  const planName = localStorage.getItem("app_license_plan_name") || (
    plan === 'monthly' ? 'الباقة الشهرية' : plan === 'yearly' ? 'الباقة السنوية' : 'مدى الحياة'
  );
  const activatedAt = localStorage.getItem("app_license_activated_at") || localStorage.getItem("app_activated_at");
  const expiryDate = localStorage.getItem("app_license_expiry");
  const txRaw = localStorage.getItem("app_license_tx");

  let tx: PaymentTransaction | null = null;
  try {
    if (txRaw) tx = JSON.parse(txRaw);
  } catch {}

  const now = Date.now();
  let isExpired = false;
  let daysRemaining: number | null = null;
  let isTampered = false;

  // فحص حماية التلاعب بالساعة
  const lastCheckStr = localStorage.getItem("app_license_last_check");
  if (lastCheckStr) {
    const lastCheck = parseInt(lastCheckStr, 10);
    // إذا كانت الساعة رجعت للخلف بأكثر من ساعتين
    if (lastCheck > 0 && now < lastCheck - (2 * 60 * 60 * 1000)) {
      isTampered = true;
    }
  }

  // فحص تاريخ الانتهاء للباقات غير الدائمة
  if (plan !== 'lifetime' && expiryDate) {
    const expTime = new Date(expiryDate).getTime();
    if (!isNaN(expTime)) {
      if (now > expTime) {
        isExpired = true;
      } else {
        daysRemaining = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));
      }
    }
  }

  // تحديث آخر توقيت تشغيل مسجل إذا لم يكن هناك تلاعب
  if (!isTampered) {
    try {
      localStorage.setItem("app_license_last_check", now.toString());
    } catch {}
  }

  return {
    isActivated: isActivated && !isExpired && !isTampered,
    rawActivated: isActivated,
    isExpired,
    isTampered,
    plan,
    planName,
    activatedAt,
    expiryDate,
    daysRemaining,
    tx
  };
};

/**
 * إتمام التفعيل الفوري التلقائي وحفظ الترخيص في الجهاز
 */
export const applyInstantActivation = (
  deviceId: string,
  planId: 'monthly' | 'yearly' | 'lifetime',
  method: PaymentMethodType,
  payerPhone?: string
): { success: boolean; key: string } => {
  try {
    const txId = "TX-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    
    // حساب تاريخ الانتهاء
    let expiryDate: string | null = null;
    let planName = 'مدى الحياة';

    if (planId === 'monthly') {
      planName = 'الباقة الشهرية';
      const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expiryDate = exp.toISOString();
    } else if (planId === 'yearly') {
      planName = 'الباقة السنوية';
      const exp = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      expiryDate = exp.toISOString();
    }

    const verifiedKey = encodeLicenseKey(deviceId, expiryDate, planId);

    // حفظ مفتاح وبيانات التفعيل الأساسية
    localStorage.setItem("app_activation_key", verifiedKey);
    localStorage.setItem("app_activated", "true");
    localStorage.setItem("app_license_plan", planId);
    localStorage.setItem("app_license_plan_name", planName);
    localStorage.setItem("app_license_activated_at", now.toISOString());
    localStorage.setItem("app_license_last_check", Date.now().toString());

    if (expiryDate) {
      localStorage.setItem("app_license_expiry", expiryDate);
    } else {
      localStorage.removeItem("app_license_expiry");
    }

    const txInfo: PaymentTransaction = {
      txId,
      deviceId,
      planId,
      amount: planId === 'lifetime' ? 1350 : planId === 'yearly' ? 250 : 30,
      method,
      payerPhone: payerPhone || '',
      status: 'success',
      timestamp: now.toISOString()
    };
    
    localStorage.setItem("app_license_tx", JSON.stringify(txInfo));
    triggerHaptic('success');

    return { success: true, key: verifiedKey };
  } catch (err) {
    console.error("Activation apply error:", err);
    return { success: false, key: "" };
  }
};

/**
 * رابط بوابة الدفع المباشرة المخصص
 */
export const getCustomGatewayUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem("paymob_custom_link") || "";
};

export const setCustomGatewayUrl = (url: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("paymob_custom_link", url.trim());
};
