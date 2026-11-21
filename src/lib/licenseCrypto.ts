/**
 * نظام التشفير الذكي لأكواد التفعيل (حروف وأرقام مشفرة مانعة لإعادة الاستخدام والتخمين)
 * Mazareana Pro Cryptographic License Engine
 */

export const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const SECRET_SALT = 0x5A3C9E71; // 32-bit secret
export const REF_EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
export const MASTER_KEY = 'MashrouaMalia2026';

export interface DecodedLicenseResult {
  isValid: boolean;
  tier: 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  expiryDate: string | null;
  durationDays: number | null;
  daysRemaining: number | null;
  isExpired: boolean;
  errorReason?: string;
  errorMessage?: string;
}

// دالة تجزئة رياضية لإنتاج توقيع رقمي للأمان (23 بت)
export function hashPayload(devId: number, days: number, tier: number): number {
  let h = ((devId * 1664525) + (days * 1013904223) + (tier * 374761393) + SECRET_SALT) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = (Math.imul(h, 0x5bd1e995)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return h & 0x7FFFFF; // 23 bits
}

// شبكة فايستل لتشفير وخلط 40 بت (Avalanche Effect)
export function scramble40(val: bigint, devId: number): bigint {
  let L = Number(val >> 20n) & 0xFFFFF;
  let R = Number(val & 0xFFFFFn);
  const key = ((devId ^ SECRET_SALT) >>> 0);

  for (let round = 0; round < 4; round++) {
    const f = ((R * 65539 + key + round * 31) ^ (R >>> 7)) & 0xFFFFF;
    const nextR = (L ^ f) & 0xFFFFF;
    L = R;
    R = nextR;
  }
  return (BigInt(L) << 20n) | BigInt(R);
}

// فك خلط شبكة فايستل
export function unscramble40(val: bigint, devId: number): bigint {
  let L = Number(val >> 20n) & 0xFFFFF;
  let R = Number(val & 0xFFFFFn);
  const key = ((devId ^ SECRET_SALT) >>> 0);

  for (let round = 3; round >= 0; round--) {
    const prevR = L;
    const f = ((prevR * 65539 + key + round * 31) ^ (prevR >>> 7)) & 0xFFFFF;
    const prevL = (R ^ f) & 0xFFFFF;
    L = prevL;
    R = prevR;
  }
  return (BigInt(L) << 20n) | BigInt(R);
}

/**
 * توليد كود تفعيل مشفر يتكون من حروف وأرقام ويحمل تاريخ الصلاحية بداخله
 */
export function encodeLicenseKey(
  deviceId: string | number,
  expiryDate: Date | string | null,
  tier: 'monthly' | 'yearly' | 'lifetime'
): string {
  const numDev = parseInt(String(deviceId).replace(/\D/g, ''), 10) || 0;
  let days = 0x7FFF; // 32767 for lifetime
  const tierNum = tier === 'monthly' ? 0 : tier === 'yearly' ? 1 : 2;
  const prefix = tier === 'monthly' ? 'M' : tier === 'yearly' ? 'Y' : 'L';

  if (tier !== 'lifetime' && expiryDate) {
    const expTime = typeof expiryDate === 'string' ? new Date(expiryDate).getTime() : expiryDate.getTime();
    const diff = expTime - REF_EPOCH;
    days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))) & 0x7FFF;
  }

  const checksum = hashPayload(numDev, days, tierNum);
  // حزم 40 بت: [checksum: 23 bits][days: 15 bits][tier: 2 bits]
  const raw = (BigInt(checksum) << 17n) | (BigInt(days) << 2n) | BigInt(tierNum);
  const scrambled = scramble40(raw, numDev);

  // التحويل إلى 8 خانات Base32 نقية
  let chars = '';
  let temp = scrambled;
  for (let i = 0; i < 8; i++) {
    const idx = Number(temp & 0x1Fn);
    chars = ALPHABET[idx] + chars;
    temp = temp >> 5n;
  }

  return `${prefix}-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/**
 * فك تشفير والتحقق من كود التفعيل واستخراج تاريخ الصلاحية
 */
export function decodeLicenseKey(
  deviceId: string | number,
  code: string
): DecodedLicenseResult {
  const cleanKey = (code || '').trim().toUpperCase();

  // فحص كود الماستر للطوارئ
  if (cleanKey === MASTER_KEY.toUpperCase()) {
    return {
      isValid: true,
      tier: 'lifetime',
      planName: 'مدى الحياة (ماستر)',
      expiryDate: null,
      durationDays: null,
      daysRemaining: null,
      isExpired: false
    };
  }

  // تنظيف الحروف وإزالة المسافات والشرطات
  const clean = cleanKey.replace(/[^A-Z0-9]/g, '');
  if (!clean || clean.length < 8) {
    return {
      isValid: false,
      tier: 'monthly',
      planName: '',
      expiryDate: null,
      durationDays: null,
      daysRemaining: null,
      isExpired: false,
      errorReason: 'format',
      errorMessage: 'صيغة كود التفعيل غير مكتملة.'
    };
  }

  let payloadStr = clean;
  if (clean.length === 9) {
    // بادئة حرف واحد مثل M-XXXX-XXXX
    payloadStr = clean.slice(1);
  } else if (clean.length === 10 && clean.startsWith('MZ')) {
    // بادئة MZ
    payloadStr = clean.slice(2);
  }

  if (payloadStr.length !== 8) {
    return {
      isValid: false,
      tier: 'monthly',
      planName: '',
      expiryDate: null,
      durationDays: null,
      daysRemaining: null,
      isExpired: false,
      errorReason: 'length',
      errorMessage: 'طول كود التفعيل غير صحيح.'
    };
  }

  let val = 0n;
  for (let i = 0; i < 8; i++) {
    const idx = ALPHABET.indexOf(payloadStr[i]);
    if (idx === -1) {
      return {
        isValid: false,
        tier: 'monthly',
        planName: '',
        expiryDate: null,
        durationDays: null,
        daysRemaining: null,
        isExpired: false,
        errorReason: 'invalid_chars',
        errorMessage: 'الكود يحتوي على رموز غير صالحة.'
      };
    }
    val = (val << 5n) | BigInt(idx);
  }

  const numDev = parseInt(String(deviceId).replace(/\D/g, ''), 10) || 0;
  const unscrambled = unscramble40(val, numDev);

  const tierNum = Number(unscrambled & 3n);
  const days = Number((unscrambled >> 2n) & 0x7FFFn);
  const checksum = Number((unscrambled >> 17n) & 0x7FFFFFn);

  const expectedChecksum = hashPayload(numDev, days, tierNum);
  if (checksum !== expectedChecksum) {
    return {
      isValid: false,
      tier: 'monthly',
      planName: '',
      expiryDate: null,
      durationDays: null,
      daysRemaining: null,
      isExpired: false,
      errorReason: 'device_mismatch',
      errorMessage: 'كود التفعيل غير صالح لهذا الجهاز.'
    };
  }

  const tier = tierNum === 0 ? 'monthly' : tierNum === 1 ? 'yearly' : 'lifetime';
  const planName = tier === 'monthly' ? 'الباقة الشهرية' : tier === 'yearly' ? 'الباقة السنوية' : 'مدى الحياة';
  const durationDays = tier === 'monthly' ? 30 : tier === 'yearly' ? 365 : null;

  let expiryDate: string | null = null;
  let isExpired = false;
  let daysRemaining: number | null = null;

  if (tier !== 'lifetime') {
    // التاريخ المحسوب المشفر داخل الكود
    const expTime = REF_EPOCH + days * 86400000;
    const now = Date.now();
    expiryDate = new Date(expTime).toISOString();

    if (now > expTime) {
      isExpired = true;
      daysRemaining = 0;
      const formattedDate = new Date(expTime).toLocaleDateString('ar-EG');
      return {
        isValid: false,
        tier,
        planName,
        expiryDate,
        durationDays,
        daysRemaining,
        isExpired: true,
        errorReason: 'expired',
        errorMessage: `كود التفعيل هذا منتهي الصلاحية بتاريخ ${formattedDate} ولا يمكن استخدامه مجدداً.`
      };
    } else {
      daysRemaining = Math.max(0, Math.ceil((expTime - now) / 86400000));
    }
  }

  return {
    isValid: true,
    tier,
    planName,
    expiryDate,
    durationDays,
    daysRemaining,
    isExpired: false
  };
}
