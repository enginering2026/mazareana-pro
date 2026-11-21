// ============================================================
// clientStatementTemplate.ts — Dynamic Statement of Cash Payments & Collections
// Mazareana Pro - منظومة إدارة المزارع والحسابات المالية
// ============================================================

import type { Client } from "@/contexts/AppContext";

export interface StatementPaymentItem {
  date: string;
  amount: number;
  notes?: string;
}

export interface StatementTotals {
  totalDeals: number;          // إجمالي التعاملات
  totalPaid: number;           // إجمالي الدفعات المسددة
  totalCollected: number;      // إجمالي المبالغ المحصلة
  remaining: number;           // الرصيد المتبقي
  status: "مسدد بالكامل" | "سداد جزئي" | "مستحق" | "مستحق السداد";
  movementsCount: number;      // عدد الحركات
}

export interface StatementParams {
  client: Client;
  paymentsList: StatementPaymentItem[];
  totals: StatementTotals;
  farmName?: string;
  isDemo?: boolean;
}

// Convert ordinal index into Arabic words (الدفعة الأولى، الثانية...)
export const getArabicOrdinal = (n: number): string => {
  const ordinals: Record<number, string> = {
    1: "الأولى",
    2: "الثانية",
    3: "الثالثة",
    4: "الرابعة",
    5: "الخامسة",
    6: "السادسة",
    7: "السابعة",
    8: "الثامنة",
    9: "التاسعة",
    10: "العاشرة",
    11: "الحادية عشرة",
    12: "الثانية عشرة",
    13: "الثالثة عشرة",
    14: "الرابعة عشرة",
    15: "الخامسة عشرة",
    16: "السادسة عشرة",
    17: "السابعة عشرة",
    18: "الثامنة عشرة",
    19: "التاسعة عشرة",
    20: "العشرون",
    21: "الحادية والعشرون",
    22: "الثانية والعشرون",
    23: "الثالثة والعشرون",
    24: "الرابعة والعشرون",
    25: "الخامسة والعشرون",
    26: "السادسة والعشرون",
    27: "السابعة والعشرون",
    28: "الثامنة والعشرون",
    29: "التاسعة والعشرون",
    30: "الثلاثون"
  };

  return ordinals[n] || `رقم ${n}`;
};

// Calculate financial totals and account status dynamically
export const calculateClientStatementTotals = (
  client: Client,
  salesAmount: number,
  paidAmount: number,
  paymentsCount: number
): StatementTotals => {
  const isSupplier = client.type === "مورد";
  const remaining = salesAmount - paidAmount;

  let status: StatementTotals["status"];
  if (remaining <= 0) {
    status = "مسدد بالكامل";
  } else if (paidAmount > 0) {
    status = "سداد جزئي";
  } else {
    status = isSupplier ? "مستحق السداد" : "مستحق";
  }

  return {
    totalDeals: Math.round(salesAmount || 0),
    totalPaid: Math.round(paidAmount || 0),
    totalCollected: Math.round(paidAmount || 0),
    remaining: Math.round(remaining || 0),
    status,
    movementsCount: paymentsCount
  };
};

// Generates the exact professional WhatsApp message requested by user
export const generatePaymentsStatementMessage = ({
  client,
  paymentsList,
  totals,
  farmName = "مزرعة الأمل للدواجن والإنتاج الحيواني",
  isDemo = false
}: StatementParams): string => {
  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const formatNum = (num: number) => Math.round(num || 0).toLocaleString("en-US");
  const isSupplier = client.type === "مورد";

  let msg = `🧾 *كشف الدفعات والتحصيلات النقدية*\n`;
  msg += `*${farmName}*\n`;
  if (isDemo) {
    msg += `⚠️ _[كشف تجريبي للمعاينة والاختبار فقط - غير مسجل بالحسابات المالية]_\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. بيانات الحساب
  msg += `📋 *بيانات الحساب*\n\n`;
  msg += `👤 *الجهة:* ${client.name}\n`;
  msg += `📞 *رقم الهاتف:* ${client.phone || "غير مسجل"}\n`;
  msg += `🏷️ *صفة الحساب:* ${isSupplier ? "مورد مستلزمات" : "عميل مبيعات"}\n`;
  msg += `📅 *تاريخ البيان:* ${currentDate}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 2. الموقف المالي العام
  msg += `📊 *الموقف المالي العام*\n\n`;
  msg += `💵 *إجمالي التعاملات:* ${formatNum(totals.totalDeals)} جنيه مصري\n`;
  msg += `✅ *إجمالي الدفعات المسددة:* ${formatNum(totals.totalPaid)} جنيه مصري\n`;
  if (!isSupplier || totals.totalCollected > 0) {
    msg += `📥 *إجمالي المبالغ المحصّلة:* ${formatNum(totals.totalCollected)} جنيه مصري\n`;
  }
  if (totals.remaining >= 0) {
    msg += `💰 *الرصيد المتبقي:* ${formatNum(totals.remaining)} جنيه مصري\n`;
  } else {
    msg += `💰 *رصيد دائن للمصلحة:* ${formatNum(Math.abs(totals.remaining))} جنيه مصري\n`;
  }
  msg += `📌 *حالة الحساب:* ${totals.status}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 3. سجل الدفعات والتحصيلات التفصيلي
  msg += `🧾 *سجل الدفعات والتحصيلات التفصيلي*\n\n`;

  if (!paymentsList || paymentsList.length === 0) {
    msg += `_لا توجد حركات دفع أو تحصيل مسجلة حتى الآن._\n\n`;
  } else {
    paymentsList.forEach((p, idx) => {
      const ordinal = getArabicOrdinal(idx + 1);
      msg += `🔹 *الدفعة ${ordinal}*\n`;
      msg += `📅 *التاريخ:* ${p.date}\n`;
      msg += `💰 *المبلغ:* ${formatNum(p.amount)} جنيه مصري\n`;
      msg += `📝 *البيان:* ${p.notes && p.notes.trim() ? p.notes.trim() : "سداد نقدي معتمد"}\n\n`;
    });
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 4. ملخص حركة الحساب
  msg += `📈 *ملخص حركة الحساب*\n\n`;
  msg += `🔢 *عدد الحركات:* ${totals.movementsCount}\n`;
  msg += `💵 *إجمالي المدفوعات:* ${formatNum(totals.totalPaid)} جنيه مصري\n`;
  msg += `📥 *إجمالي المقبوضات:* ${formatNum(totals.totalCollected)} جنيه مصري\n`;
  msg += `📌 *صافي الرصيد:* ${formatNum(totals.remaining)} جنيه مصري\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 5. الخاتمة
  msg += `🤝 *شكرًا لثقتكم، ونتطلع دائمًا إلى استمرار التعاون المثمر.*\n\n`;
  msg += `🐔 *Mazareana Pro*\n`;
  msg += `_منظومة متكاملة لإدارة الحسابات والمعاملات المالية_`;

  return msg;
};

// Clean SVG vector icons for PDF generation without breaking Arabic ligatures in html2canvas
export const STATEMENT_ICONS = {
  receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:6px;"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v.5"/><path d="M12 6v.5"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:6px;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
  chart: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:6px;"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  trending: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:6px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><path d="m12 2 10 10-10 10H2V2z"/><circle cx="7" cy="7" r="1.5"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  hash: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`,
  cash: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`,
  inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>`,
  handshake: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:6px;"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4L16 11"/><path d="m14 14 2 2a1 1 0 0 0 1.4 0l3.3-3.3a1 1 0 0 0 0-1.4l-2.6-2.6a2 2 0 0 0-2.8 0L14 10"/><path d="M2 13a6 6 0 0 0 9 5.3"/><path d="M2 13a6 6 0 0 1 9-5.3"/><path d="M9 13a3 3 0 0 0 3-3"/><path d="M9 13a3 3 0 0 1 3 3"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`
};

// Generates printable / PDF HTML template conforming to standard A4 specifications
export const generateClientStatementHtml = (params: StatementParams): string => {
  const { client, paymentsList, totals, farmName = "مزرعة الأمل للدواجن والإنتاج الحيواني", isDemo = false } = params;

  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const formatNum = (num: number) => Math.round(num || 0).toLocaleString("en-US");
  const isSupplier = client.type === "مورد";

  const rowsHtml = paymentsList && paymentsList.length > 0
    ? paymentsList.map((p, idx) => `
      <tr style="border-bottom:1px solid #e2e8f0; ${idx % 2 === 1 ? 'background:#f8fafc;' : 'background:#ffffff;'}">
        <td style="padding:10px 12px; font-weight:bold; color:#1e293b; text-align:center;">${idx + 1}</td>
        <td style="padding:10px 12px; font-weight:bold; color:#0f766e;">الدفعة ${getArabicOrdinal(idx + 1)}</td>
        <td style="padding:10px 12px; color:#475569; font-family:monospace; direction:ltr; text-align:center;">${p.date}</td>
        <td style="padding:10px 12px; font-weight:800; color:#1e293b; text-align:left;">${formatNum(p.amount)} ج.م</td>
        <td style="padding:10px 12px; color:#334155;">${p.notes && p.notes.trim() ? p.notes.trim() : "سداد نقدي معتمد"}</td>
      </tr>
    `).join("")
    : `
      <tr>
        <td colspan="5" style="padding:24px; text-align:center; color:#94a3b8; font-size:13px;">
          لا توجد حركات سداد أو تحصيل مسجلة لهذا الحساب حتى الآن.
        </td>
      </tr>
    `;

  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
      .statement-root, .statement-root * {
        box-sizing: border-box;
        font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
        -webkit-font-smoothing: antialiased;
      }
    </style>
    <div class="statement-root" style="direction:rtl; padding:28px; background:#ffffff; color:#0f172a; width:794px; min-height:1120px; margin:0 auto; box-sizing:border-box;">
      
      ${isDemo ? `
        <div style="background:#fffbeb; border:1px solid #fde68a; color:#b45309; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:bold; text-align:center; margin-bottom:16px;">
          ${STATEMENT_ICONS.alert} كشف حساب تجريبي لأغراض المعاينة والاختبار فقط — غير مسجل ضمن الحسابات المالية الفعلية
        </div>
      ` : ''}

      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f766e; padding-bottom:16px; margin-bottom:20px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:32px; height:32px; border-radius:8px; background:#f0fdfa; border:1px solid #ccfbf1; display:flex; align-items:center; justify-content:center;">
              ${STATEMENT_ICONS.receipt}
            </div>
            <h1 style="font-size:20px; font-weight:900; color:#0f766e; margin:0; line-height:1.2;">كشف الدفعات والتحصيلات النقدية</h1>
          </div>
          <p style="font-size:13px; font-weight:bold; color:#475569; margin:4px 0 0 0;">${farmName}</p>
        </div>
        <div style="text-align:left;">
          <div style="font-size:16px; font-weight:900; color:#0f766e;">Mazareana Pro</div>
          <p style="font-size:11px; color:#64748b; margin:2px 0 0 0;">منظومة إدارة الحسابات المالية</p>
        </div>
      </div>

      <!-- Account Info Section -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 18px; margin-bottom:18px;">
        <h3 style="font-size:13px; font-weight:800; color:#0f766e; margin:0 0 10px 0; border-bottom:1px solid #e2e8f0; padding-bottom:6px; display:flex; align-items:center;">
          ${STATEMENT_ICONS.clipboard} <span>بيانات الحساب</span>
        </h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px;">
          <div style="display:flex; align-items:center;">
            <span style="color:#64748b; display:inline-flex; align-items:center;">${STATEMENT_ICONS.user}الجهة:</span>
            <strong style="color:#0f172a; margin-right:6px;">${client.name}</strong>
          </div>
          <div style="display:flex; align-items:center;">
            <span style="color:#64748b; display:inline-flex; align-items:center;">${STATEMENT_ICONS.phone}رقم الهاتف:</span>
            <strong style="color:#0f172a; margin-right:6px;" dir="ltr">${client.phone || "غير مسجل"}</strong>
          </div>
          <div style="display:flex; align-items:center;">
            <span style="color:#64748b; display:inline-flex; align-items:center;">${STATEMENT_ICONS.tag}صفة الحساب:</span>
            <strong style="color:#0f766e; margin-right:6px;">${isSupplier ? "مورد مستلزمات" : "عميل مبيعات"}</strong>
          </div>
          <div style="display:flex; align-items:center;">
            <span style="color:#64748b; display:inline-flex; align-items:center;">${STATEMENT_ICONS.calendar}تاريخ البيان:</span>
            <strong style="color:#0f172a; margin-right:6px;">${currentDate}</strong>
          </div>
        </div>
      </div>

      <!-- Overall Financial KPI Cards -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:13px; font-weight:800; color:#0f766e; margin:0 0 10px 0; display:flex; align-items:center;">
          ${STATEMENT_ICONS.chart} <span>الموقف المالي العام</span>
        </h3>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px;">
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#166534; font-weight:bold;">إجمالي التعاملات</div>
            <div style="font-size:15px; font-weight:900; color:#15803d; margin-top:4px;">${formatNum(totals.totalDeals)} ج.م</div>
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#1e40af; font-weight:bold;">إجمالي المسدد</div>
            <div style="font-size:15px; font-weight:900; color:#1d4ed8; margin-top:4px;">${formatNum(totals.totalPaid)} ج.م</div>
          </div>
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#9a3412; font-weight:bold;">الرصيد المتبقي</div>
            <div style="font-size:15px; font-weight:900; color:#c2410c; margin-top:4px;">${formatNum(totals.remaining)} ج.م</div>
          </div>
          <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; padding:10px; text-align:center;">
            <div style="font-size:11px; color:#6b21a8; font-weight:bold;">حالة الحساب</div>
            <div style="font-size:13px; font-weight:900; color:#7e22ce; margin-top:6px;">${totals.status}</div>
          </div>
        </div>
      </div>

      <!-- Itemized Payments Table -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:13px; font-weight:800; color:#0f766e; margin:0 0 10px 0; display:flex; align-items:center;">
          ${STATEMENT_ICONS.receipt} <span>سجل الدفعات والتحصيلات التفصيلي (${paymentsList.length} حركة مسجلة)</span>
        </h3>
        <table style="width:100%; border-collapse:collapse; font-size:11px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden;">
          <thead>
            <tr style="background:#0f766e; color:#ffffff;">
              <th style="padding:8px 10px; text-align:center; width:35px;">#</th>
              <th style="padding:8px 10px; text-align:right; width:110px;">الدفعة</th>
              <th style="padding:8px 10px; text-align:center; width:95px;">التاريخ</th>
              <th style="padding:8px 10px; text-align:left; width:110px;">المبلغ</th>
              <th style="padding:8px 10px; text-align:right;">البيان / ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Summary Section -->
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:12px 16px; margin-bottom:24px;">
        <h3 style="font-size:12px; font-weight:800; color:#334155; margin:0 0 8px 0; display:flex; align-items:center;">
          ${STATEMENT_ICONS.trending} <span>ملخص حركة الحساب</span>
        </h3>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#475569;">
          <span style="display:inline-flex; align-items:center;">${STATEMENT_ICONS.hash}<strong>عدد الحركات:</strong>&nbsp;${totals.movementsCount} حركة</span>
          <span style="display:inline-flex; align-items:center;">${STATEMENT_ICONS.cash}<strong>إجمالي المدفوعات:</strong>&nbsp;${formatNum(totals.totalPaid)} ج.م</span>
          <span style="display:inline-flex; align-items:center;">${STATEMENT_ICONS.inbox}<strong>إجمالي المقبوضات:</strong>&nbsp;${formatNum(totals.totalCollected)} ج.م</span>
          <span style="display:inline-flex; align-items:center;">${STATEMENT_ICONS.pin}<strong>صافي الرصيد:</strong>&nbsp;<strong style="color:${totals.remaining > 0 ? '#b91c1c' : '#15803d'};">${formatNum(totals.remaining)} ج.م</strong></span>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top:1px dashed #cbd5e1; padding-top:16px; text-align:center;">
        <p style="font-size:12px; font-weight:bold; color:#0f766e; margin:0 0 4px 0; display:flex; align-items:center; justify-content:center;">
          ${STATEMENT_ICONS.handshake}<span>شكرًا لثقتكم، ونتطلع دائمًا إلى استمرار التعاون المثمر.</span>
        </p>
        <p style="font-size:11px; color:#64748b; margin:0;">
          <strong>Mazareana Pro</strong> — منظومة متكاملة لإدارة الحسابات والمعاملات المالية
        </p>
      </div>

    </div>
  `;
};

// Generates fake/demo random data strictly for test and preview purposes
export const generateDemoStatement = (
  type: "مورد" | "عميل" = "عميل",
  farmName = "مزرعة الأمل للدواجن والإنتاج الحيواني"
): StatementParams => {
  const isSupplier = type === "مورد";

  const demoClient: Client = {
    id: "demo-client-preview",
    farmId: "demo-farm",
    name: isSupplier ? "شركة البركة للأعلاف والتوريدات (نموذج تجريبي)" : "مؤسسة الهدى لتجارة الدواجن (نموذج تجريبي)",
    type: isSupplier ? "مورد" : "مشتري",
    phone: "01098765432",
    email: "demo@mazareanapro.com",
    notes: "نموذج تجريبي لمعاينة شكل وتنسيق الكشف",
    invoices: 0,
    totalAmount: 110000
  };

  const demoPayments: StatementPaymentItem[] = [
    { date: "2026-10-01", amount: 25000, notes: "سداد دفعة أولى نقدية بالمزرعة" },
    { date: "2026-10-04", amount: 18500, notes: "تحويل بنكي فودافون كاش / إنستاباي" },
    { date: "2026-10-08", amount: 22000, notes: "سداد دفعة نقدية معتمدة" },
    { date: "2026-10-12", amount: 14500, notes: "سداد تصفية حمولة دواجن" },
    { date: "2026-10-15", amount: 10000, notes: "دفعة نقدية تحت الحساب" }
  ];

  const totalDeals = 110000;
  const totalPaid = 90000;
  const remaining = 20000;

  const totals: StatementTotals = {
    totalDeals,
    totalPaid,
    totalCollected: totalPaid,
    remaining,
    status: "سداد جزئي",
    movementsCount: demoPayments.length
  };

  return {
    client: demoClient,
    paymentsList: demoPayments,
    totals,
    farmName,
    isDemo: true
  };
};
