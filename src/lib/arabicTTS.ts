// ============================================================
// arabicTTS.ts — Arabic Text-to-Speech (with Toast Fallback)
// ============================================================

import type { ExtractedEntities } from './arabicNLP';

// ─── Voice Initialization ─────────────────────────────────────────────────────

let cachedVoice: SpeechSynthesisVoice | null = null;

function getArabicVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (!window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  const priority = ['ar-EG', 'ar-SA', 'ar-AE', 'ar'];

  for (const lang of priority) {
    const v = voices.find(v => v.lang.startsWith(lang));
    if (v) { cachedVoice = v; return v; }
  }
  const any = voices.find(v => v.lang.startsWith('ar'));
  if (any) { cachedVoice = any; return any; }
  return null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getArabicVoice(); };
}

// ─── TTS Speaker ─────────────────────────────────────────────────────────────

/**
 * Speak Arabic text. Always resolves (never throws).
 * Falls back to toast.info if SpeechSynthesis is unavailable (Capacitor WebView).
 */
export async function speak(text: string, rate = 0.95, pitch = 1.0): Promise<void> {
  // Check availability
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    // Silent fallback — text is shown via UI state in VoiceOrb
    return;
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'ar-EG';
      utt.rate = rate;
      utt.pitch = pitch;
      utt.volume = 1;

      const voice = getArabicVoice();
      if (voice) utt.voice = voice;

      utt.onend = () => resolve();
      utt.onerror = () => resolve(); // Never reject — TTS errors are non-fatal

      // Chrome/WebView bug: must delay after cancel()
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utt);
        } catch {
          resolve();
        }
      }, 100);

      // Safety timeout — don't hang forever waiting for TTS
      setTimeout(resolve, 8000);
    } catch {
      resolve();
    }
  });
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch { /* ignore */ }
}

// ─── Number Formatter ─────────────────────────────────────────────────────────

function sayNumber(n: number): string {
  return n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
}

// ─── Response Template Generator ─────────────────────────────────────────────

interface ResponseContext {
  entities: ExtractedEntities;
  success?: boolean;
  totalRevenues?: number;
  totalExpenses?: number;
  netProfit?: number;
  clientBalance?: { sales: number; paid: number; balance: number };
  partnerName?: string;
  partnerPercentage?: number;
  partnerShare?: number;
  errorMessage?: string;
}

export function generateResponse(ctx: ResponseContext): string {
  const { entities } = ctx;

  if (ctx.errorMessage) {
    return `تنبيه: ${ctx.errorMessage}`;
  }

  switch (entities.intent) {
    case 'ADD_REVENUE': {
      if (!ctx.success) return 'تعذر تسجيل الإيراد، يرجى المحاولة مرة أخرى.';
      const parts: string[] = ['✅ تم تسجيل الإيراد بنجاح:'];
      if (entities.operationName && entities.operationName !== entities.transactionType) {
        parts.push(entities.operationName);
      } else if (entities.transactionType) {
        parts.push(entities.transactionType);
      }
      if (entities.quantity) parts.push(`${sayNumber(entities.quantity)}`);
      if (entities.unitPrice) parts.push(`بسعر ${sayNumber(entities.unitPrice)} ج`);
      if (entities.totalAmount) parts.push(`(الإجمالي: ${sayNumber(entities.totalAmount)} جنيه)`);
      if (entities.paymentStatus) parts.push(`[${entities.paymentStatus}]`);
      if (entities.clientName) parts.push(`- العميل: ${entities.clientName}`);
      if (entities.date) parts.push(`بتاريخ ${entities.date}`);
      return parts.join(' ');
    }

    case 'ADD_EXPENSE': {
      if (!ctx.success) return 'تعذر تسجيل المصروف، يرجى المحاولة مرة أخرى.';
      const parts: string[] = ['✅ تم تسجيل المصروف بنجاح:'];
      if (entities.operationName && entities.operationName !== entities.transactionType) {
        parts.push(entities.operationName);
      } else if (entities.transactionType) {
        parts.push(entities.transactionType);
      }
      if (entities.totalAmount) parts.push(`بمبلغ ${sayNumber(entities.totalAmount)} جنيه`);
      if (entities.paymentStatus) parts.push(`[${entities.paymentStatus}]`);
      if (entities.clientName) parts.push(`- المورد: ${entities.clientName}`);
      if (entities.date) parts.push(`بتاريخ ${entities.date}`);
      return parts.join(' ');
    }

    case 'ADD_PAYMENT': {
      if (!ctx.success) return 'تعذر تسجيل الدفعة، يرجى المحاولة مرة أخرى.';
      const parts: string[] = ['✅ تم تسجيل الدفعة بنجاح:'];
      if (entities.totalAmount) parts.push(`مبلغ ${sayNumber(entities.totalAmount)} جنيه`);
      if (entities.clientName) parts.push(`من العميل: ${entities.clientName}`);
      if (entities.date) parts.push(`بتاريخ ${entities.date}`);
      return parts.join(' ');
    }

    case 'QUERY_PROFIT': {
      if (ctx.netProfit === undefined) return 'تعذر احتساب صافي الأرباح في الوقت الحالي.';
      const sign = ctx.netProfit >= 0 ? '💰 صافي الأرباح' : '📉 صافي الخسارة';
      return `${sign}: ${sayNumber(Math.abs(ctx.netProfit))} جنيه`;
    }

    case 'QUERY_REVENUES': {
      if (ctx.totalRevenues === undefined) return 'تعذر احتساب إجمالي الإيرادات في الوقت الحالي.';
      return `📈 إجمالي الإيرادات: ${sayNumber(ctx.totalRevenues)} جنيه`;
    }

    case 'QUERY_EXPENSES': {
      if (ctx.totalExpenses === undefined) return 'تعذر احتساب إجمالي المصروفات في الوقت الحالي.';
      return `📊 إجمالي المصروفات: ${sayNumber(ctx.totalExpenses)} جنيه`;
    }

    case 'QUERY_CLIENT_BALANCE': {
      if (!ctx.clientBalance || !entities.clientName) {
        return 'لم يتم العثور على حساب العميل المطلوب. يرجى ذكر الاسم بوضوح.';
      }
      const { sales, paid, balance } = ctx.clientBalance;
      return `👤 حساب ${entities.clientName}: مبيعات ${sayNumber(sales)} ج | مدفوع ${sayNumber(paid)} ج | المتبقي ${sayNumber(balance)} جنيه`;
    }

    case 'QUERY_PARTNER_SHARE': {
      if (ctx.partnerShare === undefined) return 'تعذر احتساب حصة الشريك في الوقت الحالي.';
      const name = ctx.partnerName || 'الشريك';
      return `🤝 حصة ${name} (${ctx.partnerPercentage ?? 0}%): ${sayNumber(ctx.partnerShare)} جنيه`;
    }

    case 'UNKNOWN':
    default:
      return 'لم أتمكن من فهم الطلب بدقة. يمكنك القول أو الكتابة مثلاً: "سجل إيراد بيض 100 طبق بسعر 120 جنيه" أو "صافي الأرباح"';
  }
}

/** Error response */
export function speakError(msg?: string): void {
  speak(msg ?? 'عفواً، لم أتمكن من استيعاب الأمر. يرجى المحاولة ثانية.').catch(() => {});
}
