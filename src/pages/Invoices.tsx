import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit, Trash2, FileText, Download, Search, Printer, Eye,
  Share2, CheckCircle2, Clock, AlertCircle, Building2, User, Calendar, CreditCard, ChevronDown, Receipt
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/AppContext";
import NumericField from "@/components/NumericField";
import { shareFileNatively } from "@/lib/nativeSharing";
import { sortByDateDesc } from "@/lib/utils";
import { toast } from "sonner";
import { ThermalReceiptModal } from "@/components/ThermalReceiptModal";
import { openWhatsApp, generateInvoiceMessage } from "@/lib/whatsappSharing";

// Arabic Tafqeet Helper (Convert Number to Arabic Words)
function tafqeet(n: number): string {
  n = Math.round(Number(n) || 0);
  if (n === 0) return "صفر جنيه مصري";
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة",
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  function convertChunk(num: number): string {
    let str = "";
    const h = Math.floor(num / 100);
    const rem = num % 100;
    if (h > 0) {
      str += hundreds[h];
      if (rem > 0) str += " و ";
    }
    if (rem > 0) {
      if (rem < 20) {
        str += ones[rem];
      } else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o > 0) str += ones[o] + " و ";
        str += tens[t];
      }
    }
    return str;
  }

  if (n < 1000) return `فقط ${convertChunk(n)} جنيه مصري لا غير`;
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    let thStr = "";
    if (thousands === 1) thStr = "ألف";
    else if (thousands === 2) thStr = "ألفان";
    else if (thousands >= 3 && thousands <= 10) thStr = `${convertChunk(thousands)} آلاف`;
    else thStr = `${convertChunk(thousands)} ألف`;
    
    let result = `فقط ${thStr}`;
    if (remainder > 0) {
      result += ` و ${convertChunk(remainder)}`;
    }
    return `${result} جنيه مصري لا غير`;
  }
  return `فقط ${n.toLocaleString()} جنيه مصري لا غير`;
}

// Generate the official high-resolution Arabic Invoice HTML template
function generateInvoiceHtml(invoice: any, farm: any, forPrint: boolean = false): string {
  const farmName = farm?.name || "مزارعنا برو للإنتاج الداجني والحيواني";
  const farmLocation = farm?.location || "جمهورية مصر العربية";
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const words = tafqeet(invoice.totalAmount || 0);

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة رقم #${invoice.number || invoice.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: ${forPrint ? '15mm 12mm' : '20px'};
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      background: #ffffff;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      background: #ffffff;
      box-shadow: ${forPrint ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)'};
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #162C56;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #162C56;
      margin: 0 0 4px 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .invoice-badge-box {
      text-align: left;
      direction: ltr;
    }
    .invoice-title {
      display: inline-block;
      font-size: 14px;
      font-weight: 800;
      background: #162C56;
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .meta-text {
      font-size: 11px;
      color: #475569;
      margin: 2px 0;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .info-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .panel-header {
      font-size: 12px;
      font-weight: 700;
      color: #162C56;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-val {
      color: #0f172a;
      font-weight: 700;
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    table.invoice-table th {
      background: #162C56;
      color: #ffffff;
      padding: 9px 10px;
      text-align: right;
      font-weight: 700;
      border: 1px solid #162C56;
    }
    table.invoice-table th.center, table.invoice-table td.center {
      text-align: center;
    }
    table.invoice-table th.left, table.invoice-table td.left {
      text-align: left;
    }
    table.invoice-table td {
      padding: 9px 10px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    table.invoice-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }
    .tafqeet-box {
      flex: 1;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 11px;
      line-height: 1.6;
    }
    .tafqeet-title {
      font-weight: 700;
      color: #162C56;
      margin-bottom: 4px;
    }
    .totals-box {
      width: 280px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-row.grand {
      background: #162C56;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      border-bottom: none;
    }
    .signatures-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 18px;
      border-top: 1px dashed #cbd5e1;
      margin-top: 10px;
    }
    .signature-item {
      text-align: center;
      width: 190px;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 35px;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      width: 140px;
      margin: 0 auto;
    }
    .stamp-seal {
      width: 90px;
      height: 90px;
      border: 2px dashed #162C56;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #162C56;
      font-size: 10px;
      font-weight: 800;
      transform: rotate(-10deg);
      opacity: 0.85;
      margin: 0 auto;
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 20px;
      border-top: 1px solid #f1f5f9;
      padding-top: 10px;
    }
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header-bar">
      <div class="brand-box">
        <img src="${import.meta.env.BASE_URL}logo.png" alt="الشعار" class="brand-logo" onerror="this.style.display='none'" />
        <div>
          <h1 class="brand-title">${farmName}</h1>
          <p class="brand-subtitle">سجل تجاري وبطاقة ضريبية معتمدة • ${farmLocation}</p>
          <p class="brand-subtitle">المنظومة المالية وإدارة الإنتاج الحيواني المتكاملة</p>
        </div>
      </div>
      <div class="invoice-badge-box">
        <div class="invoice-title">فاتورة ${invoice.type === 'شراء' ? 'مشتريات' : 'مبيعات'} رسمية</div>
        <div class="meta-text"><strong>رقم الفاتورة:</strong> #${invoice.number || 'INV-001'}</div>
        <div class="meta-text"><strong>التاريخ:</strong> ${invoice.date || new Date().toISOString().split('T')[0]}</div>
        <div class="meta-text"><strong>الحالة:</strong> ${invoice.status || 'مدفوعة'}</div>
      </div>
    </div>

    <!-- Client & Order Info -->
    <div class="info-grid">
      <div class="info-panel">
        <div class="panel-header">بيانات ${invoice.type === 'شراء' ? 'المورد' : 'العميل'}</div>
        <div class="info-row">
          <span class="info-label">الاسم:</span>
          <span class="info-val">${invoice.clientName || 'عميل نقدي'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">طريقة السداد:</span>
          <span class="info-val">${invoice.paymentMethod || 'نقدي'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">حالة الدفع:</span>
          <span class="info-val" style="color: ${invoice.status === 'مدفوعة' ? '#15803d' : '#b91c1c'}">
            ${invoice.status === 'مدفوعة' ? '✅ مسددة بالكامل' : '⏳ آجل غير مسدد'}
          </span>
        </div>
      </div>

      <div class="info-panel">
        <div class="panel-header">تفاصيل العملية</div>
        <div class="info-row">
          <span class="info-label">نوع المعاملة:</span>
          <span class="info-val">${invoice.type === 'شراء' ? 'توريد مستلزمات / مشتريات' : 'بيع وتسليم منتجات'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المزرعة:</span>
          <span class="info-val">${farmName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">تاريخ الاستخراج:</span>
          <span class="info-val">${new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th class="center" style="width: 38px;">م</th>
          <th>البيان / الصنف</th>
          <th class="center" style="width: 80px;">الكمية</th>
          <th class="center" style="width: 120px;">سعر الوحدة</th>
          <th class="left" style="width: 130px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any, idx: number) => `
          <tr>
            <td class="center" style="font-weight:bold;">${idx + 1}</td>
            <td style="font-weight:700;">${item.type || 'بند مالي'}</td>
            <td class="center" style="font-weight:bold;">${Number(item.quantity || 1).toLocaleString()}</td>
            <td class="center">${Number(item.unitPrice || 0).toLocaleString()} ج.م</td>
            <td class="left" style="font-weight:800; color:#162C56;">${Number(item.total || (item.quantity * item.unitPrice)).toLocaleString()} ج.م</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals & Tafqeet -->
    <div class="summary-section">
      <div class="tafqeet-box">
        <div class="tafqeet-title">المبلغ بالحروف العربية:</div>
        <div style="font-weight:800; color:#162C56; font-size:12px; margin-bottom: 6px;">${words}</div>
        <div style="color: #64748b; font-size: 10px;">
          * استلمت أنا الموقع أدناه البضاعة المبينة أعلاه بحالة جيدة وسليمة مطابقة للمواصفات المتفق عليها.
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span style="color:#64748b;">إجمالي البنود:</span>
          <span style="font-weight:bold;">${Number(invoice.totalAmount || 0).toLocaleString()} ج.م</span>
        </div>
        <div class="total-row">
          <span style="color:#64748b;">الخصم:</span>
          <span style="font-weight:bold;">0 ج.م</span>
        </div>
        <div class="total-row grand">
          <span>الصافي النهائي:</span>
          <span>${Number(invoice.totalAmount || 0).toLocaleString()} ج.م</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-block">
      <div class="signature-item">
        <div class="sig-title">توقيع المستلم / العميل</div>
        <div class="sig-line"></div>
      </div>

      <div class="stamp-seal">
        <div>مزارعنا برو</div>
        <div style="font-size:8px; margin: 2px 0;">★ معتمد رسمياً ★</div>
        <div>الإدارة المالية</div>
      </div>

      <div class="signature-item">
        <div class="sig-title">توقيع المحاسب / الإدارة</div>
        <div class="sig-line"></div>
      </div>
    </div>

    <div class="footer-note">
      شكراً لتعاملكم معنا • تم إصدار هذه الفاتورة إلكترونياً عبر منظومة Mazareana Pro لإدارة المزارع والإنتاج الحيواني
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default function Invoices() {
  const { invoices, clients, addInvoice, updateInvoice, deleteInvoice, currentFarm } = useAppContext();

  const [newInvoice, setNewInvoice] = useState({
    clientName: "",
    type: "بيع",
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "نقدي",
    items: [{ type: "بيض", quantity: 1, unitPrice: 0 }]
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Invoice Preview Modal State
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Thermal Receipt Modal State
  const [thermalInvoice, setThermalInvoice] = useState<any>(null);
  const [isThermalOpen, setIsThermalOpen] = useState(false);

  const handleAddInvoice = () => {
    if (newInvoice.clientName && newInvoice.type && newInvoice.date) {
      const totalAmount = newInvoice.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0);
      
      const invCount = invoices.length + 1;
      const invNumber = `INV-${String(invCount).padStart(4, '0')}`;

      addInvoice({
        ...newInvoice,
        totalAmount,
        status: newInvoice.paymentMethod === "نقدي" ? "مدفوعة" : "غير مدفوعة",
        items: newInvoice.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice
        }))
      });

      setNewInvoice({
        clientName: "",
        type: "بيع",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "نقدي",
        items: [{ type: "بيض", quantity: 1, unitPrice: 0 }]
      });
      setIsDialogOpen(false);
      toast.success("تم إنشاء الفاتورة بنجاح!");
    } else {
      toast.error("يرجى ملء جميع الحقول المطلوبة (اسم العميل، النوع، والتاريخ)");
    }
  };

  // Direct Browser & System Print Handler
  const handlePrintInvoice = (invoice: any) => {
    try {
      const htmlContent = generateInvoiceHtml(invoice, currentFarm, true);

      // Try iframe method first (smooth, doesn't open new blank tab)
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          } catch {
            // Fallback to window.open
            const printWin = window.open("", "_blank");
            if (printWin) {
              printWin.document.write(htmlContent);
              printWin.document.close();
              printWin.focus();
              printWin.print();
            }
          }
        }, 400);
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء إعداد الفاتورة للطباعة");
    }
  };

  // High-Resolution PDF Download & Share
  const handleDownloadPDF = async (invoice: any) => {
    setIsExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      if (document.fonts) {
        await document.fonts.ready;
      }

      const container = document.createElement('div');
      container.setAttribute('dir', 'rtl');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.zIndex = '99999';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
      container.style.width = '794px'; /* A4 width at 96dpi */
      container.style.background = '#ffffff';

      container.innerHTML = generateInvoiceHtml(invoice, currentFarm, false);
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `فاتورة_${invoice.number || invoice.id}_${invoice.clientName || 'عميل'}.pdf`;
      const dataUri = pdf.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      const triggerDownload = () => {
        pdf.save(fileName);
        toast.success("تم تصدير الفاتورة بنجاح!");
      };

      await shareFileNatively(fileName, base64Data, triggerDownload);
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء تصدير ملف PDF للفاتورة');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = (invoice: any) => {
    const client = clients.find(c => c.name === invoice.clientName);
    const text = generateInvoiceMessage(invoice, currentFarm?.name || 'مزارعنا برو');
    openWhatsApp(client?.phone, text);
  };

  const handleOpenPreview = (invoice: any) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      deleteInvoice(id);
      toast.success("تم حذف الفاتورة بنجاح");
      if (previewInvoice?.id === id) {
        setIsPreviewOpen(false);
      }
    }
  };

  const clientSuggestions = clients.map(client => client.name);
  const itemTypes = ["بيض", "فراخ", "سبلة", "علف", "دواء", "أخرى"];
  const paymentMethods = ["نقدي", "آجل", "شيك", "تحويل بنكي"];

  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { type: "بيض", quantity: 1, unitPrice: 0 }]
    });
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updatedItems = newInvoice.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const removeInvoiceItem = (index: number) => {
    if (newInvoice.items.length <= 1) {
      toast.error("يجب أن تحتوي الفاتورة على بند واحد على الأقل");
      return;
    }
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index)
    });
  };

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = (invoice.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (invoice.number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || invoice.type === filterType;
      const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort(sortByDateDesc);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === "مدفوعة").length;
  const unpaidInvoices = invoices.filter(inv => inv.status === "غير مدفوعة").length;
  const monthlyTotal = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🧾</span>
            <span>الفواتير وسندات القبض</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إصدار وطباعة فواتير البيع والشراء الرسمية ومزامنتها مع العملاء
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#162C56] hover:bg-[#1f3c73] text-white rounded-xl shadow-xs text-xs font-bold w-full sm:w-auto h-9">
              <Plus className="h-4 w-4 ml-1.5" />
              <span>إنشاء فاتورة جديدة</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <span>🧾</span>
                <span>إنشاء فاتورة رسمية جديدة</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="clientName" className="text-xs font-bold">اسم العميل / المورد</Label>
                  <Input
                    id="clientName"
                    list="clients"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                    placeholder="اختر أو اكتب الاسم"
                    className="mt-1 rounded-xl text-xs"
                  />
                  <datalist id="clients">
                    {clientSuggestions.map((client) => (
                      <option key={client} value={client} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <Label htmlFor="type" className="text-xs font-bold">نوع الفاتورة</Label>
                  <Select value={newInvoice.type} onValueChange={(value) => setNewInvoice({...newInvoice, type: value})}>
                    <SelectTrigger className="mt-1 rounded-xl text-xs">
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="بيع">فاتورة بيع (تسليم مبيعات)</SelectItem>
                      <SelectItem value="شراء">فاتورة شراء (توريد مشتريات)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date" className="text-xs font-bold">تاريخ الفاتورة</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newInvoice.date}
                    onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                    className="mt-1 rounded-xl text-xs"
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod" className="text-xs font-bold">طريقة السداد</Label>
                  <Select value={newInvoice.paymentMethod} onValueChange={(value) => setNewInvoice({...newInvoice, paymentMethod: value})}>
                    <SelectTrigger className="mt-1 rounded-xl text-xs">
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">بنود الفاتورة</Label>
                  <Button type="button" onClick={addInvoiceItem} variant="outline" size="sm" className="h-7 text-xs rounded-lg">
                    <Plus className="h-3 w-3 ml-1" />
                    إضافة بند
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center">
                      <div className="sm:col-span-4">
                        <Label className="text-[10px] text-slate-400 sm:hidden">الصنف</Label>
                        <Select 
                          value={item.type} 
                          onValueChange={(value) => updateInvoiceItem(index, 'type', value)}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-lg">
                            <SelectValue placeholder="الصنف" />
                          </SelectTrigger>
                          <SelectContent>
                            {itemTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] text-slate-400 sm:hidden">الكمية</Label>
                        <NumericField
                          placeholder="الكمية"
                          value={item.quantity}
                          onChangeNumber={(num) => updateInvoiceItem(index, 'quantity', num)}
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                      
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] text-slate-400 sm:hidden">السعر</Label>
                        <NumericField
                          placeholder="السعر"
                          value={item.unitPrice}
                          onChangeNumber={(num) => updateInvoiceItem(index, 'unitPrice', num)}
                          className="h-8 text-xs rounded-lg"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:col-span-2">
                        <span className="text-xs font-bold text-[#162C56] dark:text-blue-400">
                          {(item.quantity * item.unitPrice).toLocaleString()} ج.م
                        </span>
                        {newInvoice.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">الإجمالي النهائي:</span>
                  <span className="text-sm font-extrabold text-[#162C56] dark:text-blue-400">
                    {newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()} جنيه مصري
                  </span>
                </div>
              </div>
              
              <Button onClick={handleAddInvoice} className="w-full bg-[#162C56] hover:bg-[#1f3c73] text-white rounded-xl text-xs font-bold h-10 mt-2">
                حفظ وإصدار الفاتورة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">إجمالي الفواتير</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{totalInvoices}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">مجموع المبالغ</p>
              <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{monthlyTotal.toLocaleString()} ج.م</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Download className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">فواتير مسددة</p>
              <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{paidInvoices}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">فواتير غير مسددة</p>
              <p className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{unpaidInvoices}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث برقم الفاتورة أو اسم العميل..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">كل الأنواع</option>
              <option value="بيع">فواتير بيع</option>
              <option value="شراء">فواتير شراء</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="مدفوعة">مسددة</option>
              <option value="غير مدفوعة">غير مسددة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Cards */}
      <div className="space-y-2.5">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="text-3xl block mb-2">🧾</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد فواتير مطابقة للبحث</p>
            <p className="text-[11px] text-slate-400 mt-0.5">يمكنك إنشاء فاتورة جديدة بسهولة باستخدام الزر بالأعلى</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:border-blue-300 dark:hover:border-slate-600 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Header info */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    invoice.type === 'بيع'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        #{invoice.number || 'INV'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        invoice.type === 'بيع'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                      }`}>
                        {invoice.type === 'بيع' ? 'مبيعات' : 'مشتريات'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        invoice.status === 'مدفوعة'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {invoice.status === 'مدفوعة' ? 'مسددة' : 'آجل'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{invoice.clientName || 'عميل نقدي'}</span>
                      <span className="text-slate-400 text-[10px] font-normal">({invoice.paymentMethod || 'نقدي'})</span>
                    </p>

                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{invoice.date}</span>
                      <span className="mx-1">•</span>
                      <span>{Array.isArray(invoice.items) ? invoice.items.length : 1} بنود</span>
                    </p>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                  <div className="text-right sm:text-left">
                    <span className="text-[10px] text-slate-400 block font-medium">المبلغ الإجمالي</span>
                    <span className="text-sm font-extrabold text-[#162C56] dark:text-blue-400">
                      {Number(invoice.totalAmount || 0).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenPreview(invoice)}
                      className="bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 p-2 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition"
                      title="معاينة الفاتورة الرسمية"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">معاينة</span>
                    </button>

                    <button
                      onClick={() => handlePrintInvoice(invoice)}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs font-bold transition"
                      title="طباعة الفاتورة"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setThermalInvoice(invoice);
                        setIsThermalOpen(true);
                      }}
                      className="bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 p-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 transition"
                      title="طباعة إيصال حراري (بلوتوث/POS)"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 p-2 rounded-xl text-xs font-bold transition"
                      title="تصدير PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(invoice)}
                      className="bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
                      title="مشاركة عبر واتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-xl transition"
                      title="حذف الفاتورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official Invoice Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          {previewInvoice && (
            <div className="space-y-4">
              {/* Preview Action Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧾</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      معاينة الفاتورة الرسمية (#{previewInvoice.number || 'INV'})
                    </h3>
                    <p className="text-[11px] text-slate-400">جاهزة للطباعة والتصدير والمشاركة</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePrintInvoice(previewInvoice)}
                    className="bg-[#162C56] hover:bg-[#1f3c73] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>

                  <button
                    onClick={() => {
                      setThermalInvoice(previewInvoice);
                      setIsThermalOpen(true);
                    }}
                    className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>إيصال حراري</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(previewInvoice)}
                    disabled={isExportingPdf}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? "جاري التصدير..." : "تحميل PDF"}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(previewInvoice)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </button>
                </div>
              </div>

              {/* Rendered Invoice Card */}
              <div
                className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm text-slate-900"
                dangerouslySetInnerHTML={{
                  __html: generateInvoiceHtml(previewInvoice, currentFarm, false)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Thermal POS Receipt Modal */}
      <ThermalReceiptModal
        open={isThermalOpen}
        onOpenChange={setIsThermalOpen}
        invoice={thermalInvoice}
        farmName={currentFarm?.name}
        clientPhone={clients.find(c => c.name === thermalInvoice?.clientName)?.phone}
      />
    </div>
  );
}