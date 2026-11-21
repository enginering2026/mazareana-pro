// ============================================================
// arabicNLP.ts — Offline Arabic NLP Engine (Egyptian dialect)
// ============================================================
// Handles: number parsing, date parsing, fuzzy client matching,
// intent classification, payment terms (cash vs credit),
// operation name extraction, and full entity extraction.
// ============================================================

import type { Client } from '@/contexts/AppContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceIntent =
  | 'ADD_REVENUE'
  | 'ADD_EXPENSE'
  | 'ADD_PAYMENT'
  | 'QUERY_PROFIT'
  | 'QUERY_REVENUES'
  | 'QUERY_EXPENSES'
  | 'QUERY_CLIENT_BALANCE'
  | 'QUERY_PARTNER_SHARE'
  | 'UNKNOWN';

export interface ExtractedEntities {
  intent: VoiceIntent;
  transactionType?: string;     // e.g. "بيض", "دواجن", "علف"
  operationName?: string;       // اسم العمل / بيان المعاملة الصافي
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  paidAmount?: number;          // المبلغ المسدد فعلاً
  paymentMethod?: string;       // "cash" | "credit" | "transfer" | "check"
  paymentTerms?: 'cash' | 'credit' | 'partial';
  paymentStatus?: 'مدفوعة' | 'آجل (على الحساب)' | 'سداد جزئي';
  isCredit?: boolean;
  clientName?: string;
  clientId?: string;
  date?: string;                // ISO YYYY-MM-DD
  notes?: string;
  partnerName?: string;
  rawText: string;
}

// ─── Normalization & Tashkeel ────────────────────────────────────────────────

export function stripTashkeel(text: string): string {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '').trim();
}

export function normalizeArabic(text: string): string {
  return stripTashkeel(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function latinizeDigits(text: string): string {
  return text.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// ─── Arabic Number Parser ─────────────────────────────────────────────────────

const ONES: Record<string, number> = {
  'صفر': 0, 'واحد': 1, 'واحده': 1, 'اتنين': 2, 'اثنين': 2, 'تلاته': 3, 'ثلاثه': 3,
  'اربعه': 4, 'خمسه': 5, 'سته': 6, 'سبعه': 7, 'تمانيه': 8, 'ثمانيه': 8, 'تسعه': 9,
  'عشره': 10, 'عشر': 10,
  'احد عشر': 11, 'حداشر': 11, 'اتناشر': 12, 'اثناشر': 12, 'اثني عشر': 12,
  'تلتاشر': 13, 'ثلاثه عشر': 13, 'اربعتاشر': 14, 'اربعه عشر': 14,
  'خمستاشر': 15, 'خمسه عشر': 15, 'ستاشر': 16, 'سته عشر': 16,
  'سبعتاشر': 17, 'سبعه عشر': 17, 'تمنتاشر': 18, 'ثمانيه عشر': 18,
  'تسعتاشر': 19, 'تسعه عشر': 19,
};

const TENS: Record<string, number> = {
  'عشرين': 20, 'عشرون': 20, 'تلاتين': 30, 'ثلاثين': 30,
  'اربعين': 40, 'خمسين': 50, 'ستين': 60,
  'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90,
};

const HUNDREDS: Record<string, number> = {
  'ميه': 100, 'مية': 100, 'مئه': 100, 'مائه': 100,
  'ميتين': 200, 'مئتين': 200,
  'تلتميه': 300, 'ثلاثميه': 300, 'ثلاثمائه': 300,
  'اربعميه': 400, 'اربعمائه': 400,
  'خمسميه': 500, 'خمسمائه': 500,
  'ستميه': 600, 'ستمائه': 600,
  'سبعميه': 700, 'سبعمائه': 700,
  'تمنميه': 800, 'ثمانمائه': 800,
  'تسعميه': 900, 'تسعمائه': 900,
};

const SPECIAL: Record<string, number> = {
  'نص': 0.5, 'نصف': 0.5, 'ربع': 0.25, 'تلت': 0.333,
  'الف': 1000, 'الفين': 2000, 'الاف': 1000,
  'مليون': 1000000, 'ملايين': 1000000, 'مليار': 1000000000,
};

export function parseArabicNumber(text: string): number | null {
  if (!text) return null;
  const norm = normalizeArabic(text);
  const latinized = latinizeDigits(norm);

  if (/^\d+(\.\d+)?$/.test(latinized)) return parseFloat(latinized);

  for (const [word, val] of Object.entries(SPECIAL)) {
    if (normalizeArabic(word) === norm) return val;
  }
  for (const [word, val] of Object.entries(HUNDREDS)) {
    if (normalizeArabic(word) === norm) return val;
  }
  for (const [word, val] of Object.entries(TENS)) {
    if (normalizeArabic(word) === norm) return val;
  }
  for (const [word, val] of Object.entries(ONES)) {
    if (normalizeArabic(word) === norm) return val;
  }

  // Compound: "X و Y" e.g. "خمسه وعشرين" = 25
  const waMatch = norm.match(/^(.+?)\s+و\s*(.+)$/);
  if (waMatch) {
    const a = parseArabicNumber(waMatch[1]);
    const b = parseArabicNumber(waMatch[2]);
    if (a !== null && b !== null) return a + b;
  }

  return null;
}

// ─── Arabic Date Parser (Advanced) ──────────────────────────────────────────

const ARABIC_DAYS: Record<string, number> = {
  'الاحد': 0, 'الاثنين': 1, 'الاتنين': 1,
  'التلات': 2, 'الثلاثاء': 2, 'التلاتا': 2,
  'الاربعاء': 3, 'الاربع': 3,
  'الخميس': 4, 'الجمعه': 5, 'السبت': 6,
};

const ARABIC_MONTHS: Record<string, number> = {
  'يناير': 1, 'كانون الثاني': 1, 'كانون تاني': 1,
  'فبراير': 2, 'شباط': 2,
  'مارس': 3, 'اذار': 3,
  'ابريل': 4, 'نيسان': 4,
  'مايو': 5, 'ايار': 5,
  'يونيو': 6, 'حزيران': 6,
  'يوليو': 7, 'تموز': 7,
  'اغسطس': 8, 'اب': 8,
  'سبتمبر': 9, 'ايلول': 9,
  'اكتوبر': 10, 'تشرين الاول': 10, 'تشرين اول': 10,
  'نوفمبر': 11, 'تشرين الثاني': 11, 'تشرين تاني': 11,
  'ديسمبر': 12, 'كانون الاول': 12, 'كانون اول': 12,
};

const DAY_WORDS: Record<string, number> = {
  'واحد': 1, 'واحده': 1, 'الاول': 1, 'اول': 1,
  'اتنين': 2, 'اثنين': 2, 'تاني': 2, 'ثاني': 2,
  'تلاته': 3, 'ثلاثه': 3, 'تالت': 3, 'ثالث': 3,
  'اربعه': 4, 'رابع': 4,
  'خمسه': 5, 'خامس': 5,
  'سته': 6, 'سادس': 6,
  'سبعه': 7, 'سابع': 7,
  'تمانيه': 8, 'ثمانيه': 8, 'تامن': 8, 'ثامن': 8,
  'تسعه': 9, 'تاسع': 9,
  'عشره': 10, 'عاشر': 10,
  'حداشر': 11, 'احد عشر': 11,
  'اتناشر': 12, 'اثناشر': 12, 'اثني عشر': 12,
  'تلتاشر': 13, 'ثلاثه عشر': 13,
  'اربعتاشر': 14, 'اربعه عشر': 14,
  'خمستاشر': 15, 'خمسه عشر': 15,
  'ستاشر': 16, 'سته عشر': 16,
  'سبعتاشر': 17, 'سبعه عشر': 17,
  'تمنتاشر': 18, 'ثمانيه عشر': 18,
  'تسعتاشر': 19, 'تسعه عشر': 19,
  'عشرين': 20, 'عشرون': 20,
  'واحد وعشرين': 21, 'واحد وعشرون': 21,
  'اتنين وعشرين': 22, 'اثنين وعشرين': 22,
  'تلاته وعشرين': 23, 'ثلاثه وعشرين': 23,
  'اربعه وعشرين': 24, 'خمسه وعشرين': 25,
  'سته وعشرين': 26, 'سبعه وعشرين': 27,
  'تمانيه وعشرين': 28, 'ثمانيه وعشرين': 28,
  'تسعه وعشرين': 29, 'تلاتين': 30, 'واحد وتلاتين': 31
};

function formatIso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseArabicDate(rawText: string): string {
  if (!rawText) return new Date().toISOString().split('T')[0];

  const norm = normalizeArabic(rawText);
  const latinized = latinizeDigits(norm);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  // 1. Explicit full date format: YYYY-MM-DD or YYYY/MM/DD
  const isoFullMatch = latinized.match(/\b(20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoFullMatch) {
    return formatIso(parseInt(isoFullMatch[1]), parseInt(isoFullMatch[2]), parseInt(isoFullMatch[3]));
  }

  // 2. Explicit format: DD-MM-YYYY or DD/MM/YYYY
  const dmyFullMatch = latinized.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d\d)\b/);
  if (dmyFullMatch) {
    return formatIso(parseInt(dmyFullMatch[3]), parseInt(dmyFullMatch[2]), parseInt(dmyFullMatch[1]));
  }

  // 3. Short explicit format: DD-MM or DD/MM (e.g. 15-10 or 15/10)
  const dmyShortMatch = latinized.match(/(?:بتاريخ|تاريخ|يوم|في)?\s*\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])\b/);
  if (dmyShortMatch) {
    const day = parseInt(dmyShortMatch[1]);
    const month = parseInt(dmyShortMatch[2]);
    let yr = currentYear;
    if (month > currentMonth + 1) yr -= 1;
    return formatIso(yr, month, day);
  }

  // 4. Relative time expressions
  if (/النهارده|النهارد|اليوم|الان/.test(norm)) return toISO(today);

  if (/امس|امبارح/.test(norm) && !/اول امس|اول امبارح/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return toISO(d);
  }

  if (/اول امس|اول امبارح|اوله/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return toISO(d);
  }

  if (/الاسبوع اللي فات|الاسبوع الماضي|الاسبوع السابق/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return toISO(d);
  }

  if (/اسبوعين/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 14);
    return toISO(d);
  }

  if (/من شهر|قبل شهر|الشهر اللي فات/.test(norm)) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toISO(d);
  }

  // "من X أيام" or "قبل X يوم"
  const relDaysMatch = latinized.match(/(?:من|قبل)\s*([٠-٩\d]+|[أ-ي\s]+)\s*(?:ايام|أيام|يوم)/);
  if (relDaysMatch) {
    const numPart = relDaysMatch[1].trim();
    let numDays: number | null = null;
    if (/^\d+$/.test(numPart)) {
      numDays = parseInt(numPart);
    } else {
      numDays = parseArabicNumber(numPart);
    }
    if (numDays && numDays > 0 && numDays <= 365) {
      const d = new Date(today);
      d.setDate(d.getDate() - numDays);
      return toISO(d);
    }
  }

  // 5. Month name parsing (e.g. "بتاريخ 5 أكتوبر", "12 نوفمبر", "خمسة اكتوبر")
  for (const [monthName, monthIndex] of Object.entries(ARABIC_MONTHS)) {
    const normMonth = normalizeArabic(monthName);
    if (norm.includes(normMonth)) {
      let parsedDay: number | null = null;

      // Look for day right before month (e.g. "بتاريخ 5 اكتوبر", "خمسه اكتوبر")
      const beforeMonthPattern = new RegExp(`(?:بتاريخ|تاريخ|يوم|في)?\\s*([٠-٩\\d]+|[أ-ي]+(?:\\s+و\\s*[أ-ي]+)?)\\s*(?:من\\s+شهر|شهر)?\\s*${normMonth}`);
      const beforeMatch = latinized.match(beforeMonthPattern);
      if (beforeMatch && beforeMatch[1]) {
        const cand = beforeMatch[1].trim();
        if (/^\d+$/.test(cand)) {
          parsedDay = parseInt(cand);
        } else if (DAY_WORDS[cand]) {
          parsedDay = DAY_WORDS[cand];
        } else {
          parsedDay = parseArabicNumber(cand);
        }
      }

      // Look for day right after month (e.g. "اكتوبر 5")
      if (!parsedDay) {
        const afterMonthPattern = new RegExp(`${normMonth}\\s*(?:يوم|بتاريخ|تاريخ)?\\s*([٠-٩\\d]+|[أ-ي]+)`);
        const afterMatch = latinized.match(afterMonthPattern);
        if (afterMatch && afterMatch[1]) {
          const cand = afterMatch[1].trim();
          if (/^\d+$/.test(cand)) parsedDay = parseInt(cand);
          else if (DAY_WORDS[cand]) parsedDay = DAY_WORDS[cand];
        }
      }

      const finalDay = parsedDay && parsedDay >= 1 && parsedDay <= 31 ? parsedDay : 1;
      let yr = currentYear;
      if (monthIndex > currentMonth + 1) yr -= 1;
      return formatIso(yr, monthIndex, finalDay);
    }
  }

  // 6. "يوم X اللي فات" / "بتاريخ X اللي فات" / "يوم X في الشهر"
  const dayPastMatch = latinized.match(/(?:يوم|بتاريخ|تاريخ)\s*(\d{1,2}|[أ-ي\s]+)\s*(?:اللي\s*فات|الماضي|في\s*الشهر)/);
  if (dayPastMatch) {
    const cand = dayPastMatch[1].trim();
    let dNum = /^\d+$/.test(cand) ? parseInt(cand) : DAY_WORDS[cand] || parseArabicNumber(cand);
    if (dNum && dNum >= 1 && dNum <= 31) {
      let m = currentMonth;
      let y = currentYear;
      if (dNum > currentDay) {
        m -= 1;
        if (m === 0) { m = 12; y -= 1; }
      }
      return formatIso(y, m, dNum);
    }
  }

  // 7. Day of the week (e.g. "الخميس اللي فات", "يوم السبت")
  for (const [dayName, dayNum] of Object.entries(ARABIC_DAYS)) {
    if (norm.includes(dayName)) {
      const d = new Date(today);
      const diff = (today.getDay() - dayNum + 7) % 7;
      d.setDate(today.getDate() - (diff === 0 ? 7 : diff));
      return toISO(d);
    }
  }

  return toISO(today);
}

// ─── Payment Terms & Cash vs Credit Detector ─────────────────────────────────

export interface PaymentTermsResult {
  paymentMethod: 'cash' | 'credit' | 'transfer' | 'check';
  paymentStatus: 'مدفوعة' | 'آجل (على الحساب)' | 'سداد جزئي';
  paidAmount: number;
  isCredit: boolean;
}

export function detectPaymentTerms(text: string, totalAmount = 0): PaymentTermsResult {
  const norm = normalizeArabic(text);
  const latinized = latinizeDigits(norm);

  // 1. Partial payment: "دفع 5000 والباقي آجل" or "سدد 10 آلاف والباقي على الحساب"
  const partialMatch = latinized.match(/(?:دفع|سدد|قبضت|استلمت)\s+(?:منهم|كاش|مبلغ)?\s*(\d+(?:\.\d+)?(?:\s*(?:الف|الاف))?)\s*(?:والباقي|والباقى)\s*(?:اجل|آجل|علي الحساب|على الحساب|شكك|دين)/);
  if (partialMatch) {
    let partialVal = 0;
    const rawVal = partialMatch[1].trim();
    if (rawVal.includes('الف') || rawVal.includes('الاف')) {
      const numOnly = parseFloat(rawVal.replace(/[^\d.]/g, '')) || 1;
      partialVal = numOnly * 1000;
    } else {
      partialVal = parseFloat(rawVal) || 0;
    }

    return {
      paymentMethod: 'credit',
      paymentStatus: 'سداد جزئي',
      paidAmount: partialVal,
      isCredit: true
    };
  }

  // 2. Explicit Credit / Debt / On Account
  const hasCreditWord = /(?:اجل|آجل|علي الحساب|على الحساب|شكك|دين|بدون دفع|متبقي|غير مدفوع|لسه مادفعش)/.test(norm);
  if (hasCreditWord) {
    return {
      paymentMethod: 'credit',
      paymentStatus: 'آجل (على الحساب)',
      paidAmount: 0,
      isCredit: true
    };
  }

  // 3. Bank Transfer
  if (/(?:تحويل|بنكي|فودافون كاش|انستاباي|انستا باي)/.test(norm)) {
    return {
      paymentMethod: 'transfer',
      paymentStatus: 'مدفوعة',
      paidAmount: totalAmount,
      isCredit: false
    };
  }

  // 4. Check
  if (/شيك|شيكات/.test(norm)) {
    return {
      paymentMethod: 'check',
      paymentStatus: 'مدفوعة',
      paidAmount: totalAmount,
      isCredit: false
    };
  }

  // 5. Explicit Cash
  const hasCashWord = /(?:كاش|نقدي|نقد|خالص|كامل المبلغ|سدد كامل|مسدد بالكامل|كاش بالكامل|دفع كامل)/.test(norm);
  if (hasCashWord) {
    return {
      paymentMethod: 'cash',
      paymentStatus: 'مدفوعة',
      paidAmount: totalAmount,
      isCredit: false
    };
  }

  // 6. Default to cash (with paidAmount = totalAmount)
  return {
    paymentMethod: 'cash',
    paymentStatus: 'مدفوعة',
    paidAmount: totalAmount,
    isCredit: false
  };
}

// ─── Stop Words & Client Extraction ──────────────────────────────────────────

const STOP_WORDS = new Set([
  'خد', 'اخد', 'مني', 'اشترى', 'طلب', 'جاب', 'دفع', 'سحب', 'استلم', 'باع',
  'راح', 'جه', 'سعر', 'جنيه', 'طبق', 'كيس', 'كيلو', 'طن', 'عدد', 'كرتونه',
  'في', 'علي', 'من', 'عشان', 'علشان', 'النهارده', 'امس', 'امبارح', 'بكام', 'بـ',
  'كام', 'حسابه', 'رصيده', 'دفعه', 'ايراد', 'مصروف', 'بيع', 'شراء', 'كاش', 'اجل',
  'بتاريخ', 'تاريخ', 'يوم', 'شهر', 'فاتورة', 'قيد', 'سجل', 'اكتب', 'ضيف'
]);

function cleanCandidateName(candidate: string): string {
  if (!candidate) return '';
  const words = candidate.trim().split(/\s+/);
  const clean: string[] = [];
  for (const w of words) {
    if (STOP_WORDS.has(w) || /^[٠-٩\d]+$/.test(w)) break;
    clean.push(w);
  }
  return clean.join(' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export function extractClient(
  text: string,
  clients: Client[] = []
): { id?: string; name?: string } {
  const norm = normalizeArabic(text);

  // 1. Direct contains check on existing clients (longest name first)
  const sortedClients = [...clients].sort((a, b) => b.name.length - a.name.length);
  for (const c of sortedClients) {
    const cNorm = normalizeArabic(c.name);
    if (cNorm.length > 2 && norm.includes(cNorm)) {
      return { id: c.id, name: c.name };
    }
  }

  // 2. Extract after indicators
  const indicators = /(?:^|\s)(?:من عند|من المورد|من التاجر|من العميل|من الحاج|للعميل|للتاجر|للزبون|للمورد|للحاج|عميل|زبون|تاجر|مورد|من)\s+([^\s]+(?:\s+[^\s]+){0,3})/;
  const match = norm.match(indicators);
  if (match) {
    const cleaned = cleanCandidateName(match[1]);
    if (cleaned && cleaned.length >= 2) {
      let best: Client | null = null;
      let bestDist = Infinity;
      for (const c of clients) {
        const cNorm = normalizeArabic(c.name);
        const dist = levenshtein(cleaned, cNorm);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      if (best && bestDist <= 2) {
        return { id: best.id, name: best.name };
      }
      return { id: undefined, name: cleaned };
    }
  }

  return { id: undefined, name: undefined };
}

// ─── Operation Description Extractor (اسم العمل / البيان) ────────────────────

export function extractOperationDescription(rawText: string, defaultType: string): string {
  if (!rawText) return defaultType;

  let cleaned = rawText
    .replace(/^(?:سجل لي|سجل|اكتب عندك|اكتب|ضيف لي|ضيف|عايز اسجل|من فضلك سجل)\s*/gi, '')
    .trim();

  // Strip trailing payment & date phrases from description
  cleaned = cleaned
    .replace(/(?:بتاريخ|تاريخ|يوم|شهر)\s+[^,،]+/gi, '')
    .replace(/(?:كاش|نقدا|نقداً|اجل|آجل|علي الحساب|على الحساب|شكك)/gi, '')
    .replace(/(?:للعميل|للتاجر|من المورد|من التاجر|للحاج|من الحاج)\s+[^,،]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 3 ? cleaned : defaultType;
}

// ─── Intent Classifier ───────────────────────────────────────────────────────

export function classifyIntent(text: string): VoiceIntent {
  const norm = normalizeArabic(text);

  // 1. Guard against treating transactions with "حساب" as balance queries
  // A sentence is an inquiry/query ONLY if it has an interrogative or explicit query pattern
  const isQuery = !/(?:سجل|ضيف|اكتب|اشتريت|شراء|بعت|بيع|صرفت|دفعت|قبضت|استلمت|سددت)/.test(norm)
    && (/(?:كام|كم|استعلم|استفسار|وريني|عرفني|مكسبي|كسبنا|صرفنا|بعنا)/.test(norm)
      || /(?:رصيد|حساب|ديون|مديونيه)\s*(?:العميل|الزبون|التاجر)?[^\d]*كام/.test(norm)
      || /(?:صافي\s*الربح|صافي\s*الارباح|نسبه\s*الشريك)/.test(norm));

  if (isQuery) {
    if (/(?:رصيد|حساب|ديون|مديونيه|عليه\s*كام|ليه\s*كام)/.test(norm)) return 'QUERY_CLIENT_BALANCE';
    if (/(?:صافي\s*الربح|صافي\s*الارباح|مكسبي|كسبنا|الارباح|الربح)/.test(norm)) return 'QUERY_PROFIT';
    if (/(?:ايراد|مبيعات|بعنا)/.test(norm)) return 'QUERY_REVENUES';
    if (/(?:مصروف|مصاريف|صرفنا)/.test(norm)) return 'QUERY_EXPENSES';
    if (/(?:شريك|نسبه|حصه)/.test(norm)) return 'QUERY_PARTNER_SHARE';
    return 'UNKNOWN';
  }

  // 2. Action Intents (Mutations)
  // Payment from client (pure debt collection / cash receipt without items)
  if (/(?:دفعه\s*من|تحصيل\s*من|سداد\s*من|قبضت\s*من|استلمت\s*من|دفع\s*لي)/.test(norm) && !/(?:علف|فراخ|بيض|شراء|بيع)/.test(norm)) {
    return 'ADD_PAYMENT';
  }

  // Revenue (selling poultry, eggs, manure, or general sales)
  if (
    /(?:بيع|بعت|بعنا|باع|مبيعات|ايراد|ايرادات|توريد)/.test(norm) ||
    /(?:فراخ|دواجن|لحم|بيض|سماد|سباخ)/.test(norm)
  ) {
    return 'ADD_REVENUE';
  }

  // Expense (purchasing feed, meds, paying bills, labor, etc.)
  if (
    /(?:شراء|اشتريت|اشترى|اشترينا|جبنا|صرفت|صرفنا|دفعت|دفعنا|مصروف|مصاريف|تكلفه|تكاليف|فاتوره|سداد)/.test(norm) ||
    /(?:علف|بادي|نامي|ناهي|دوا|علاج|تحصين|فيتامين|نشاره|نشارة|كهربا|كهرباء|ميه|مياه|غاز|سولار|عمال|عامل|مرتب|صيان|تصليح|نقل|شحن|انترنت|كاميرا)/.test(norm)
  ) {
    return 'ADD_EXPENSE';
  }

  // Default for transactions
  return 'ADD_EXPENSE';
}

// ─── Transaction Type Detector ───────────────────────────────────────────────

const REVENUE_TYPES = [
  { ar: 'بيض', en: 'بيض مائدة' },
  { ar: 'دواجن', en: 'دواجن لحم' },
  { ar: 'لحم', en: 'دواجن لحم' },
  { ar: 'كتاكيت', en: 'كتاكيت' },
  { ar: 'كتكوت', en: 'كتاكيت' },
  { ar: 'سماد', en: 'سباخ وسماد' },
  { ar: 'سباخ', en: 'سباخ وسماد' },
  { ar: 'دجاج', en: 'دواجن لحم' },
];

const EXPENSE_TYPES = [
  { ar: 'علف', en: 'علف' },
  { ar: 'بادي', en: 'علف' },
  { ar: 'نامي', en: 'علف' },
  { ar: 'ناهي', en: 'علف' },
  { ar: 'دواء', en: 'دواء وعلاج' },
  { ar: 'ادويه', en: 'دواء وعلاج' },
  { ar: 'بيطر', en: 'دواء وعلاج' },
  { ar: 'تحصين', en: 'دواء وعلاج' },
  { ar: 'كهرباء', en: 'كهرباء' },
  { ar: 'كهربا', en: 'كهرباء' },
  { ar: 'مياه', en: 'مياه' },
  { ar: 'ميه', en: 'مياه' },
  { ar: 'غاز', en: 'غاز' },
  { ar: 'سولار', en: 'غاز' },
  { ar: 'نشاره', en: 'نشارة' },
  { ar: 'نشارة', en: 'نشارة' },
  { ar: 'عماله', en: 'عمالة' },
  { ar: 'عامل', en: 'عمالة' },
  { ar: 'مرتب', en: 'عمالة' },
  { ar: 'صيانه', en: 'صيانة' },
  { ar: 'تصليح', en: 'صيانة' },
  { ar: 'نقل', en: 'نقل وشحن' },
  { ar: 'شحن', en: 'نقل وشحن' },
  { ar: 'انترنت', en: 'إنترنت' },
  { ar: 'كاميرات', en: 'كاميرات' },
  { ar: 'معدات', en: 'معدات وأدوات' },
];

function detectTransactionType(text: string, intent: VoiceIntent): string {
  const norm = normalizeArabic(text);
  const list = intent === 'ADD_EXPENSE' ? EXPENSE_TYPES : REVENUE_TYPES;
  for (const item of list) {
    if (norm.includes(item.ar)) return item.en;
  }
  return intent === 'ADD_EXPENSE' ? 'مصروفات عامة' : 'إيرادات عامة';
}

// ─── Quantity & Price Extractor ───────────────────────────────────────────────

function extractQuantityAndPrice(text: string): { quantity?: number; unitPrice?: number; totalAmount?: number } {
  const result: { quantity?: number; unitPrice?: number; totalAmount?: number } = {};
  const norm = normalizeArabic(text);
  const latinized = latinizeDigits(norm);

  // Pattern A: "5 طن بسعر 21 الف" or "300 طبق سعر الطبق 140 جنيه"
  const fullPattern = /(\d+(?:\.\d+)?)\s*(?:طبق|كيس|قطعة|كيلو|طن|وحدة|كرتونة|عبوة|راس|فرخة|طائر)[^\d]*(\d+(?:\.\d+)?(?:\s*(?:الف|الاف))?)/;
  const m1 = latinized.match(fullPattern);
  if (m1) {
    result.quantity = parseFloat(m1[1]);
    const priceStr = m1[2].trim();
    if (priceStr.includes('الف') || priceStr.includes('الاف')) {
      const pNum = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 1;
      result.unitPrice = pNum * 1000;
    } else {
      result.unitPrice = parseFloat(priceStr);
    }
    result.totalAmount = result.quantity * result.unitPrice;
    return result;
  }

  // Pattern B: Quantity + Ton/Kg/Chick
  const tonMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(?:طن|اطنان)/);
  if (tonMatch) result.quantity = parseFloat(tonMatch[1]);

  const kgMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(?:كيلو|كجم)/);
  if (kgMatch) result.quantity = parseFloat(kgMatch[1]);

  const priceMatch = latinized.match(/(?:بسعر|سعر|الكيلو ب|الطن ب|الواحده ب|الطبق ب)\s*(\d+(?:\.\d+)?(?:\s*(?:الف|الاف))?)/);
  if (priceMatch) {
    const pStr = priceMatch[1].trim();
    if (pStr.includes('الف') || pStr.includes('الاف')) {
      const pNum = parseFloat(pStr.replace(/[^\d.]/g, '')) || 1;
      result.unitPrice = pNum * 1000;
    } else {
      result.unitPrice = parseFloat(pStr);
    }
  }

  // Pattern C: Total amount directly mentioned "بمبلغ 50 الف" or "بقيمة 1500"
  const amountMatch = latinized.match(/(?:بمبلغ|مبلغ|بقيمة|بقيم|بـ)\s*(\d+(?:\.\d+)?(?:\s*(?:الف|الاف))?)/);
  if (amountMatch) {
    const aStr = amountMatch[1].trim();
    if (aStr.includes('الف') || aStr.includes('الاف')) {
      const aNum = parseFloat(aStr.replace(/[^\d.]/g, '')) || 1;
      result.totalAmount = aNum * 1000;
    } else {
      result.totalAmount = parseFloat(aStr);
    }
  }

  if (result.quantity && result.unitPrice && !result.totalAmount) {
    result.totalAmount = result.quantity * result.unitPrice;
  }

  // Fallback: Standalone numbers
  if (!result.totalAmount) {
    const nums = latinized.match(/\d+(?:\.\d+)?/g);
    if (nums && nums.length > 0) {
      const parsed = nums.map(n => parseFloat(n));
      const maxNum = Math.max(...parsed);
      if (latinized.includes(`${maxNum} الف`) || latinized.includes(`${maxNum} ألف`)) {
        result.totalAmount = maxNum * 1000;
      } else {
        result.totalAmount = maxNum;
      }
    }
  }

  return result;
}

// ─── Main Entity Extractor ────────────────────────────────────────────────────

export function extractEntities(
  rawText: string,
  clients: Client[] = []
): ExtractedEntities {
  const text = rawText.trim();
  const intent = classifyIntent(text);

  const result: ExtractedEntities = { intent, rawText: text };

  // 1. Date extraction
  result.date = parseArabicDate(text);

  // 2. Type detection
  if (intent === 'ADD_REVENUE' || intent === 'ADD_EXPENSE') {
    result.transactionType = detectTransactionType(text, intent);
  }

  // 3. Quantity and price
  const qp = extractQuantityAndPrice(text);
  if (qp.quantity !== undefined) result.quantity = qp.quantity;
  if (qp.unitPrice !== undefined) result.unitPrice = qp.unitPrice;
  if (qp.totalAmount !== undefined) result.totalAmount = qp.totalAmount;

  // 4. Payment terms & status (cash vs credit)
  const payment = detectPaymentTerms(text, result.totalAmount || 0);
  result.paymentMethod = payment.paymentMethod;
  result.paymentTerms = payment.paymentStatus === 'سداد جزئي' ? 'partial' : payment.isCredit ? 'credit' : 'cash';
  result.paymentStatus = payment.paymentStatus;
  result.paidAmount = payment.paidAmount;
  result.isCredit = payment.isCredit;

  // 5. Operation description (اسم العمل الصافي)
  result.operationName = extractOperationDescription(text, result.transactionType || 'معاملة مالية');
  result.notes = result.operationName;

  // 6. Client extraction
  const clientInfo = extractClient(text, clients);
  if (clientInfo.name) {
    result.clientName = clientInfo.name;
    result.clientId = clientInfo.id;
  }

  return result;
}
