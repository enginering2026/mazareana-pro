// WhatsApp Direct Statement & Invoice Sharing System
// Mazareana Pro - المنظومة المالية
// Enhanced Professional Arabic WhatsApp Financial Reports

import { toast } from "sonner";
import type { Client, Invoice } from "@/contexts/AppContext";

// Clean and normalize phone numbers for WhatsApp international format (e.g. Egypt +20)
export const normalizeWhatsAppPhone = (phone: string | undefined | null): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with 0 (Egyptian local standard like 010..., 011..., 012..., 015...), convert to +20
  if (cleaned.startsWith("0") && cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = "20" + cleaned.substring(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

interface ClientTotals {
  totalInvoices: number;
  totalPayments: number;
  remaining: number;
  lastPaymentDate?: string;
  recentPayments?: Array<{ date: string; amount: number; notes?: string }>;
}

// Generates an elegant, professional Arabic message for Client Account Statement
export const generateClientStatementMessage = (
  client: Client,
  totals: ClientTotals,
  farmName = "مزارعنا برو"
): string => {
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const formatNum = (n: number) => Math.round(n || 0).toLocaleString("en-US");

  let msg = `*كشف حساب مالي تفصيلي* 🏛️\n`;
  msg += `*${farmName}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *العميل / التاجر:* ${client.name}\n`;
  if (client.phone) {
    msg += `📞 *رقم الهاتف:* ${client.phone}\n`;
  }
  msg += `🏷️ *صفة الحساب:* ${client.type === "مورد" ? "مورد مستلزمات" : "عميل مبيعات"}\n`;
  msg += `📅 *تاريخ التقرير:* ${dateStr} (${timeStr})\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📊 *الموقف المالي الحالي:*\n`;
  msg += `💵 *إجمالي التعاملات:* ${formatNum(totals.totalInvoices)} ج.م\n`;
  msg += `✅ *إجمالي المسدد:* ${formatNum(totals.totalPayments)} ج.م\n`;

  if (totals.remaining > 0) {
    msg += `⚠️ *الرصيد المتبقي (المستحق):* *${formatNum(totals.remaining)} ج.م*\n`;
  } else if (totals.remaining < 0) {
    msg += `🟢 *رصيد دائن للمصلحة:* *${formatNum(Math.abs(totals.remaining))} ج.م*\n`;
  } else {
    msg += `✨ *حالة الحساب:* *متزن بالكامل (خالص)* ✅\n`;
  }

  // Credit Limit & Due Date
  if (client.creditLimit && client.creditLimit > 0) {
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🛡️ *الحد الائتماني المعتمد:* ${formatNum(client.creditLimit)} ج.م\n`;
    if (totals.remaining > client.creditLimit) {
      const overLimit = totals.remaining - client.creditLimit;
      msg += `🚨 *تنبيه:* تجاوز السقف الائتماني بمقدار *${formatNum(overLimit)} ج.م*\n`;
    } else {
      const availableCredit = client.creditLimit - Math.max(0, totals.remaining);
      msg += `🟢 *الائتمان المتاح:* ${formatNum(availableCredit)} ج.م\n`;
    }
  }

  if (client.nextPaymentDate) {
    msg += `⏰ *موعد استحقاق السداد القادم:* ${client.nextPaymentDate}\n`;
  }

  // Recent Payments
  if (totals.recentPayments && totals.recentPayments.length > 0) {
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📝 *سجل الدفعات والتحصيلات المسجلة (${totals.recentPayments.length} حركة):*\n`;
    totals.recentPayments.forEach((p, idx) => {
      msg += `${idx + 1}. ${p.date} • *${formatNum(p.amount)} ج.م*`;
      if (p.notes && p.notes.trim()) msg += ` (${p.notes.trim()})`;
      msg += `\n`;
    });
  } else if (totals.lastPaymentDate) {
    msg += `🕒 *تاريخ آخر دفعة:* ${totals.lastPaymentDate}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_يسعدنا ونتشرف دائماً بالتعامل معكم!_ 🌾\n`;
  msg += `*نظام Mazareana Pro لإدارة الحسابات*`;

  return msg;
};

import {
  generatePaymentsStatementMessage,
  type StatementParams,
  type StatementPaymentItem,
  type StatementTotals
} from "./clientStatementTemplate";

export {
  generatePaymentsStatementMessage,
  type StatementParams,
  type StatementPaymentItem,
  type StatementTotals
};

// Generates an elegant WhatsApp message specifically for Payments Log (سجل الدفعات والتحصيلات)
export const generatePaymentsLogMessage = (
  client: Client,
  paymentsList: Array<{ date: string; amount: number; notes?: string }>,
  totals: { totalInvoices: number; totalPayments: number; remaining: number },
  farmName = "مزرعة الأمل للدواجن والإنتاج الحيواني"
): string => {
  const isSupplier = client.type === "مورد";
  let status: "مسدد بالكامل" | "سداد جزئي" | "مستحق" | "مستحق السداد";
  if (totals.remaining <= 0) {
    status = "مسدد بالكامل";
  } else if (totals.totalPayments > 0) {
    status = "سداد جزئي";
  } else {
    status = isSupplier ? "مستحق السداد" : "مستحق";
  }

  return generatePaymentsStatementMessage({
    client,
    paymentsList,
    totals: {
      totalDeals: totals.totalInvoices,
      totalPaid: totals.totalPayments,
      totalCollected: totals.totalPayments,
      remaining: totals.remaining,
      status,
      movementsCount: paymentsList.length
    },
    farmName
  });
};

// Generates an elegant WhatsApp message for an Invoice
export const generateInvoiceMessage = (
  invoice: Invoice,
  farmName = "مزارعنا برو"
): string => {
  const formatNum = (n: number) => Math.round(n || 0).toLocaleString("en-US");

  let msg = `*فاتورة ${invoice.type === "شراء" ? "مشتريات" : "مبيعات"} رسمية* 🧾\n`;
  msg += `*${farmName}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔢 *رقم الفاتورة:* #${invoice.number || "INV"}\n`;
  msg += `👤 *الجهة / العميل:* ${invoice.clientName}\n`;
  msg += `📅 *تاريخ الفاتورة:* ${invoice.date}\n`;
  msg += `💳 *طريقة السداد:* ${invoice.paymentMethod === "cash" ? "نقدي (كاش)" : "آجل (على الحساب)"}\n`;
  msg += `📌 *الحالة:* ${invoice.status === "مدفوعة" ? "✅ مسددة بالكامل" : "⏳ آجل غير مسدد"}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *تفاصيل البنود والأصناف:*\n`;

  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.type}*\n`;
      msg += `   الكمية: ${item.quantity.toLocaleString()} × السعر: ${formatNum(item.unitPrice)} ج.م\n`;
      msg += `   الإجمالي: *${formatNum(item.total || item.quantity * item.unitPrice)} ج.م*\n`;
    });
  } else {
    msg += `بند مالي بقيمة: *${formatNum(invoice.totalAmount)} ج.م*\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *الإجمالي المستحق النهائي:* *${formatNum(invoice.totalAmount)} ج.م*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_شكراً لثقتكم الغالية بنا ونسعد بخدمتكم دائماً!_ 🌾\n`;
  msg += `*منظومة Mazareana Pro المالية*`;

  return msg;
};

// Generates an elegant WhatsApp message for a comprehensive Financial Report
export const generateFinancialReportMessage = (
  report: {
    period: string;
    startDate: string;
    endDate: string;
    totalRevenues: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin?: string;
    totalCashIn?: number;
    totalCashOut?: number;
    netCashFlow?: number;
    totalCollectedPayments?: number;
    totalDisbursedPayments?: number;
    creditRevenues?: number;
    remainingExpenses?: number;
    revenuesCount?: number;
    expensesCount?: number;
    invoicesCount?: number;
    selectedClient?: { name: string; type: string; phone?: string } | null;
    clientTotals?: { sales: number; paid: number; balance: number } | null;
  },
  farmName = "مزارعنا برو"
): string => {
  const formatNum = (n: number) => Math.round(n || 0).toLocaleString("en-US");

  let msg = `*تقرير الأداء المالي والأرباح* 📊\n`;
  msg += `*${farmName}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📅 *الفترة:* من ${report.startDate} إلى ${report.endDate}\n`;

  if (report.selectedClient) {
    msg += `👤 *الجهة:* ${report.selectedClient.name} (${report.selectedClient.type})\n`;
    if (report.clientTotals) {
      const isSupplier = report.selectedClient.type === "مورد";
      const bal = report.clientTotals.balance;
      msg += `💰 *إجمالي التعاملات:* ${formatNum(report.clientTotals.sales)} ج.م\n`;
      msg += `💵 *المسدد:* ${formatNum(report.clientTotals.paid)} ج.م\n`;
      msg += `⚖️ *${isSupplier ? "المستحق له" : "المستحق عليه"}:* *${formatNum(Math.abs(bal))} ج.م* ${bal > 0 ? "⚠️" : "✅"}\n`;
    }
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📈 *إجمالي الإيرادات:* *${formatNum(report.totalRevenues)} ج.م* (${report.revenuesCount || 0} حركة)\n`;
  msg += `📉 *إجمالي المصروفات:* *${formatNum(report.totalExpenses)} ج.م* (${report.expensesCount || 0} حركة)\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

  if (report.netProfit >= 0) {
    msg += `🏆 *صافي الأرباح:* *+${formatNum(report.netProfit)} ج.م* 🟢\n`;
    if (report.profitMargin) {
      msg += `📊 *هامش الربح:* *${report.profitMargin}%*\n`;
    }
  } else {
    msg += `⚠️ *صافي العجز:* *${formatNum(report.netProfit)} ج.م* (خسارة) 🔴\n`;
  }

  const cashIn = report.totalCashIn !== undefined ? report.totalCashIn : report.totalCollectedPayments;
  const cashOut = report.totalCashOut !== undefined ? report.totalCashOut : report.totalDisbursedPayments;

  if (cashIn !== undefined && cashOut !== undefined) {
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *حركة الخزينة والسيولة الفعلية:*\n`;
    msg += `📥 المقبوضات النقدية: ${formatNum(cashIn)} ج.م\n`;
    msg += `📤 المدفوعات النقدية: ${formatNum(cashOut)} ج.م\n`;
    const cashFlow = report.netCashFlow !== undefined ? report.netCashFlow : (cashIn - cashOut);
    msg += `⚖️ صافي حركة السيولة: *${formatNum(cashFlow)} ج.م*\n`;
  }

  if ((report.creditRevenues && report.creditRevenues > 0) || (report.remainingExpenses && report.remainingExpenses > 0)) {
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⏳ *الأرصدة الآجلة للفترة:*\n`;
    if (report.creditRevenues && report.creditRevenues > 0) {
      msg += `🔹 مبيعات آجلة طرف العملاء: ${formatNum(report.creditRevenues)} ج.م\n`;
    }
    if (report.remainingExpenses && report.remainingExpenses > 0) {
      msg += `🔸 متبقي مستحق للموردين: ${formatNum(report.remainingExpenses)} ج.م\n`;
    }
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_تم الاستخراج آلياً عبر منظومة Mazareana Pro_ 🏛️`;

  return msg;
};

// Opens WhatsApp directly with the recipient and pre-filled message
export const openWhatsApp = (phone: string | undefined | null, text: string): boolean => {
  try {
    const normalizedPhone = normalizeWhatsAppPhone(phone);
    const encodedText = encodeURIComponent(text);

    let url = "";
    if (normalizedPhone) {
      url = `https://wa.me/${normalizedPhone}?text=${encodedText}`;
    } else {
      url = `https://wa.me/?text=${encodedText}`;
    }

    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
    if (androidBridge && typeof androidBridge.openExternalBrowser === "function") {
      androidBridge.openExternalBrowser(url);
      return true;
    }

    window.open(url, "_blank");
    return true;
  } catch (err: any) {
    console.error("WhatsApp launch error:", err);
    toast.error("تعذر فتح تطبيق WhatsApp");
    return false;
  }
};
