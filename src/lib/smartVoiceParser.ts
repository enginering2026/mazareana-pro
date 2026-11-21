// ============================================================
// smartVoiceParser.ts — Smart Natural Arabic Voice Transaction Parser
// ============================================================
// Analyzes natural Arabic spoken speech and turns it into structured financial entries
// with accurate date recognition, client extraction, cash/credit classification,
// and operation description.
// ============================================================

import {
  parseArabicDate,
  extractClient,
  detectPaymentTerms,
  extractOperationDescription,
  latinizeDigits,
  normalizeArabic
} from './arabicNLP';

export interface ParsedTransaction {
  type: 'expense' | 'revenue' | 'payment';
  category: string;
  operationName?: string;       // اسم العمل / بيان المعاملة
  amount: number;
  paidAmount?: number;          // المبلغ المسدد فعلاً
  paymentMethod?: string;       // "cash" | "credit" | "transfer" | "check"
  paymentStatus?: 'مدفوعة' | 'آجل (على الحساب)' | 'سداد جزئي';
  isCredit?: boolean;
  date: string;                 // ISO YYYY-MM-DD
  quantity?: number;
  unitPrice?: number;
  unit?: string;
  clientName?: string;
  clientId?: string;
  notes?: string;
  rawText: string;
}

// Convert common Arabic spoken number words to numeric values
export const parseArabicSpokenNumbers = (text: string): number => {
  if (!text) return 0;
  let s = text.toLowerCase()
    .replace(/أ|إ|آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/,/g, '')
    .trim();

  s = latinizeDigits(s);

  // Direct digits check first
  const directMatch = s.match(/(\d+(?:\.\d+)?)/);
  let baseNumber = directMatch ? parseFloat(directMatch[1]) : 0;

  // Handle words like "ألف" (thousand)
  if (s.includes('الف') || s.includes('الاف')) {
    if (baseNumber === 0) {
      if (s.includes('ميت') || s.includes('مائت')) baseNumber = 200;
      else if (s.includes('ميه') || s.includes('مائه')) baseNumber = 100;
      else if (s.includes('عشرين')) baseNumber = 20;
      else if (s.includes('ثلاثين') || s.includes('تلاتين')) baseNumber = 30;
      else if (s.includes('اربعين')) baseNumber = 40;
      else if (s.includes('خمسين')) baseNumber = 50;
      else if (s.includes('ستين')) baseNumber = 60;
      else if (s.includes('سبعين')) baseNumber = 70;
      else if (s.includes('ثمانين') || s.includes('تمانين')) baseNumber = 80;
      else if (s.includes('تسعين')) baseNumber = 90;
      else if (s.includes('عشره')) baseNumber = 10;
      else if (s.includes('تسعه')) baseNumber = 9;
      else if (s.includes('ثمانيه') || s.includes('تمانيه')) baseNumber = 8;
      else if (s.includes('سبعه')) baseNumber = 7;
      else if (s.includes('سته')) baseNumber = 6;
      else if (s.includes('خمسه')) baseNumber = 5;
      else if (s.includes('اربعه')) baseNumber = 4;
      else if (s.includes('ثلاثه') || s.includes('تلاته')) baseNumber = 3;
      else if (s.includes('الفين')) baseNumber = 2;
      else baseNumber = 1;
    }
    return baseNumber * 1000;
  }

  // Handle words like "مليون"
  if (s.includes('مليون')) {
    if (baseNumber === 0) baseNumber = 1;
    return baseNumber * 1000000;
  }

  return baseNumber;
};

// Main Smart Parser function
export const parseArabicSpeechToTransaction = (
  rawText: string,
  existingClients: Array<{ id: string; name: string; type: string; phone?: string; balance?: number; totalInvoiced?: number; totalPaid?: number }> = []
): ParsedTransaction | null => {
  if (!rawText || !rawText.trim()) return null;

  const text = rawText.trim();
  const normalized = normalizeArabic(text);
  const latinized = latinizeDigits(normalized);

  // 1. Detect Transaction Type
  let type: 'expense' | 'revenue' | 'payment' = 'expense';
  if (
    normalized.includes('قبضت') ||
    normalized.includes('استلمت') ||
    normalized.includes('دفعه من') ||
    normalized.includes('سداد من') ||
    normalized.includes('تحصيل من')
  ) {
    type = 'payment';
  } else if (
    normalized.includes('بيعت') ||
    normalized.includes('بيع') ||
    normalized.includes('ايراد') ||
    normalized.includes('فراخ لحم') ||
    normalized.includes('بيع فراخ') ||
    normalized.includes('بيع بيض')
  ) {
    type = 'revenue';
  } else {
    type = 'expense'; // default for purchases, feeds, drugs, labor, electricity
  }

  // 2. Detect Category
  let category = 'مصروفات أخرى';
  if (type === 'revenue') {
    if (normalized.includes('لحم') || normalized.includes('فراخ') || normalized.includes('دواجن')) {
      category = 'دواجن لحم';
    } else if (normalized.includes('بيض')) {
      category = 'بيض مائدة';
    } else if (normalized.includes('كتكوت') || normalized.includes('كتاكيت')) {
      category = 'كتاكيت';
    } else if (normalized.includes('سباخ') || normalized.includes('سماد') || normalized.includes('زبل')) {
      category = 'سباخ وسماد';
    } else {
      category = 'إيرادات عامة';
    }
  } else if (type === 'expense') {
    if (normalized.includes('علف') || normalized.includes('بادي') || normalized.includes('نامي') || normalized.includes('ناهي')) {
      category = 'علف';
    } else if (normalized.includes('كتكوت') || normalized.includes('كتاكيت')) {
      category = 'كتاكيت';
    } else if (normalized.includes('دوا') || normalized.includes('علاج') || normalized.includes('بيطر') || normalized.includes('تحصين') || normalized.includes('فيتامين')) {
      category = 'دواء';
    } else if (normalized.includes('نشاره') || normalized.includes('نشارة') || normalized.includes('فرشه') || normalized.includes('تبن')) {
      category = 'نشارة';
    } else if (normalized.includes('نت') || normalized.includes('انترنت') || normalized.includes('إنترنت') || normalized.includes('راوتر') || normalized.includes('واي فاي')) {
      category = 'إنترنت';
    } else if (normalized.includes('كامير') || normalized.includes('كاميرا') || normalized.includes('كاميرات') || normalized.includes('مراقبه')) {
      category = 'كاميرات';
    } else if (normalized.includes('كهربا') || normalized.includes('كهرباء')) {
      category = 'كهرباء';
    } else if (normalized.includes('ميه') || normalized.includes('مياه')) {
      category = 'مياه';
    } else if (normalized.includes('سولار') || normalized.includes('غاز') || normalized.includes('انبوبه') || normalized.includes('وقود') || normalized.includes('تدفئ')) {
      category = 'غاز';
    } else if (normalized.includes('عامل') || normalized.includes('عمال') || normalized.includes('يومي') || normalized.includes('راتب') || normalized.includes('مرتب')) {
      category = 'عمالة';
    } else if (normalized.includes('صيان') || normalized.includes('تصليح') || normalized.includes('قطع غيار')) {
      category = 'صيانة';
    } else if (normalized.includes('نقل') || normalized.includes('شحن')) {
      category = 'نقل وشحن';
    } else if (normalized.includes('ايجار')) {
      category = 'أخرى';
    }
  } else {
    category = 'دفعة نقدية';
  }

  // 3. Extract Quantity and Unit
  let quantity: number | undefined = undefined;
  let unit: string | undefined = undefined;

  const tonMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(طن|اطنان)/);
  const kgMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(كيلو|كجم|كغ)/);
  const chickMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(كتكوت|فرخه|دجاجه|راس|عدد|طائر)/);
  const eggMatch = latinized.match(/(\d+(?:\.\d+)?)\s*(طبق|كرتونة|كرتونه)/);

  if (tonMatch) {
    quantity = parseFloat(tonMatch[1]);
    unit = 'طن';
  } else if (kgMatch) {
    quantity = parseFloat(kgMatch[1]);
    unit = 'كجم';
  } else if (chickMatch) {
    quantity = parseFloat(chickMatch[1]);
    unit = 'طائر';
  } else if (eggMatch) {
    quantity = parseFloat(eggMatch[1]);
    unit = 'طبق';
  } else if (normalized.includes('نص طن') || normalized.includes('نصف طن')) {
    quantity = 0.5;
    unit = 'طن';
  } else if (normalized.includes('طن ونص') || normalized.includes('طن ونصف')) {
    quantity = 1.5;
    unit = 'طن';
  }

  // 4. Extract Amounts & Prices
  let unitPrice: number | undefined = undefined;
  let amount = 0;

  // Pattern A: "بسعر X" or "سعر X"
  const priceMatch = latinized.match(/(?:بسعر|سعر|الكيلو ب|الطن ب|الواحده ب|الطبق ب)\s*([^\s,]+(?:\s*(?:الف|الاف))?)/);
  if (priceMatch) {
    unitPrice = parseArabicSpokenNumbers(priceMatch[1]);
  }

  // Pattern B: Look for general monetary amount in the text
  const amountMatch = latinized.match(/(?:بمبلغ|مبلغ|بقيم|بـ|بقيمة)\s*([^\s,]+(?:\s*(?:الف|الاف))?)/);
  if (amountMatch) {
    amount = parseArabicSpokenNumbers(amountMatch[1]);
  }

  // If amount is not set but we have quantity & unitPrice:
  if (amount === 0 && quantity && unitPrice) {
    amount = quantity * unitPrice;
  }

  // Fallback: extract biggest number found in sentence if amount still 0
  if (amount === 0) {
    const allNumbers = latinized.match(/\d+(?:\.\d+)?/g);
    if (allNumbers && allNumbers.length > 0) {
      const parsedNums = allNumbers.map(n => parseArabicSpokenNumbers(n));
      const maxNum = Math.max(...parsedNums);
      if (normalized.includes(`${maxNum} الف`) || normalized.includes(`${maxNum} ألف`)) {
        amount = maxNum * 1000;
      } else {
        amount = maxNum;
      }
    }
  }

  // 5. Match or Extract Client Name
  // Cast existingClients to Client-compatible structure
  const clientInfo = extractClient(text, existingClients as any);
  let matchedClientName = clientInfo.name;
  let matchedClientId = clientInfo.id;

  // 6. Extract Historical or Relative Date (never defaults to today if spoken)
  const parsedDate = parseArabicDate(text);

  // 7. Payment Terms Analysis (Cash vs Credit vs Partial)
  const paymentTerms = detectPaymentTerms(text, amount);

  // 8. Operation Description (اسم العمل / البيان الصافي)
  const operationName = extractOperationDescription(text, category);

  return {
    type,
    category,
    operationName,
    amount,
    paidAmount: paymentTerms.paidAmount,
    paymentMethod: paymentTerms.paymentMethod,
    paymentStatus: paymentTerms.paymentStatus,
    isCredit: paymentTerms.isCredit,
    date: parsedDate,
    quantity,
    unitPrice,
    unit,
    clientName: matchedClientName,
    clientId: matchedClientId,
    notes: operationName || text,
    rawText: text
  };
};
