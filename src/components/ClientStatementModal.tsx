import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Printer,
  MessageCircle,
  Share2,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  type StatementParams,
  generatePaymentsStatementMessage,
  generateClientStatementHtml,
  generateDemoStatement,
  getArabicOrdinal
} from "@/lib/clientStatementTemplate";
import { openWhatsApp } from "@/lib/whatsappSharing";
import { shareFileNatively } from "@/lib/nativeSharing";

interface ClientStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  realStatement: StatementParams | null;
}

export const ClientStatementModal: React.FC<ClientStatementModalProps> = ({
  isOpen,
  onClose,
  realStatement
}) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  // Active statement: either real or demo
  const activeStatement: StatementParams | null = isDemoMode
    ? generateDemoStatement(
        realStatement?.client?.type === "مورد" ? "مورد" : "عميل",
        realStatement?.farmName || "مزرعة الأمل للدواجن والإنتاج الحيواني"
      )
    : realStatement;

  if (!activeStatement) return null;

  const { client, paymentsList, totals, farmName, isDemo } = activeStatement;
  const isSupplier = client.type === "مورد";
  const formatNum = (n: number) => Math.round(n || 0).toLocaleString("en-US");

  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = generatePaymentsStatementMessage(activeStatement);
    openWhatsApp(client.phone, text);
    toast.success("تم فتح WhatsApp بنص كشف الحساب المنسق");
  };

  // Handle PDF Generation & Native Share
  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);

      const container = document.createElement("div");
      container.setAttribute("dir", "rtl");
      container.style.position = "fixed";
      container.style.left = "0";
      container.style.top = "0";
      container.style.zIndex = "99999";
      container.style.opacity = "1";
      container.style.visibility = "visible";
      container.style.width = "794px"; /* A4 standard width */
      container.style.background = "#ffffff";

      container.innerHTML = generateClientStatementHtml(activeStatement);
      document.body.appendChild(container);

      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 200));

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
        scrollY: 0
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      const fileName = `كشف_دفعات_${client.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      const dataUri = pdf.output("datauristring");
      const base64Data = dataUri.split(",")[1];

      const triggerDownload = () => {
        pdf.save(fileName);
        toast.success("تم تصدير وحفظ ملف PDF لكشف الحساب بنجاح");
      };

      await shareFileNatively(fileName, base64Data, triggerDownload);
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("حدث خطأ أثناء تصدير ملف PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle direct print
  const handlePrint = () => {
    try {
      const html = generateClientStatementHtml(activeStatement);
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8" />
              <title>كشف الدفعات والتحصيلات - ${client.name}</title>
              <style>
                @page { size: A4; margin: 10mm; }
                body { margin: 0; padding: 0; background: #ffffff; }
              </style>
            </head>
            <body>
              ${html}
              <script>
                window.onload = function() {
                  window.focus();
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      }
    } catch {
      toast.error("تعذر فتح نافذة الطباعة");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border bg-background">
        {/* Sticky Header with Action Buttons */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              <DialogTitle className="text-sm sm:text-base font-extrabold text-foreground">
                كشف الدفعات والتحصيلات النقدية
              </DialogTitle>
              {isDemo && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  كشف تجريبي
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {farmName || "مزرعة الأمل للدواجن والإنتاج الحيواني"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant={isDemoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="text-xs h-8 gap-1.5 font-bold"
              title="معاينة نموذج تجريبي ببيانات وهمية"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDemoMode ? "الكشف الحقيقي" : "معاينة تجريبية"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="text-xs h-8 font-bold gap-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>PDF</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handlePrint}
              className="text-xs h-8 px-2"
              title="طباعة"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Statement Body */}
        <div className="p-4 sm:p-6 space-y-4 text-right" dir="rtl">
          {/* Demo Notice Banner */}
          {isDemo && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>⚠️ هذا كشف تجريبي للمعاينة والاختبار فقط — غير مسجل ضمن الحسابات المالية الفعلية</span>
            </div>
          )}

          {/* 1. بيانات الحساب Card */}
          <div className="bg-card border rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <h3 className="text-xs font-extrabold text-foreground flex items-center gap-2 border-b pb-2">
              <span className="text-primary font-bold">📋</span>
              <span>بيانات الحساب</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> الجهة:
                </span>
                <span className="font-extrabold text-foreground">{client.name}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> رقم الهاتف:
                </span>
                <span className="font-bold text-foreground font-mono" dir="ltr">{client.phone || "غير مسجل"}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">🏷️ صفة الحساب:</span>
                <Badge variant="secondary" className="font-bold text-xs">
                  {isSupplier ? "مورد مستلزمات" : "عميل مبيعات"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> تاريخ البيان:
                </span>
                <span className="font-bold text-foreground">{currentDate}</span>
              </div>
            </div>
          </div>

          {/* 2. الموقف المالي العام KPI Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-foreground flex items-center gap-2">
              <span className="text-primary font-bold">📊</span>
              <span>الموقف المالي العام</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">إجمالي التعاملات</p>
                <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {formatNum(totals.totalDeals)} <span className="text-[10px]">ج.م</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">إجمالي المسدد</p>
                <p className="text-base sm:text-lg font-extrabold text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                  {formatNum(totals.totalPaid)} <span className="text-[10px]">ج.م</span>
                </p>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                totals.remaining > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
              }`}>
                <p className={`text-[11px] font-bold ${totals.remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  الرصيد المتبقي
                </p>
                <p className={`text-base sm:text-lg font-extrabold font-mono mt-0.5 ${
                  totals.remaining > 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
                }`}>
                  {formatNum(totals.remaining)} <span className="text-[10px]">ج.م</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center flex flex-col justify-center">
                <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400">حالة الحساب</p>
                <p className="text-xs sm:text-sm font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                  {totals.status}
                </p>
              </div>
            </div>
          </div>

          {/* 3. سجل الدفعات والتحصيلات التفصيلي */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h3 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                <span className="text-primary font-bold">🧾</span>
                <span>سجل الدفعات والتحصيلات التفصيلي</span>
              </h3>
              <Badge variant="outline" className="text-[11px] font-bold">
                {paymentsList.length} حركة مسجلة
              </Badge>
            </div>

            {paymentsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                لا توجد حركات سداد أو تحصيل نقدية مسجلة حتى الآن.
              </div>
            ) : (
              <div className="space-y-2">
                {paymentsList.map((p, idx) => {
                  const ordinal = getArabicOrdinal(idx + 1);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border bg-card hover:border-primary/30 transition shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          الدفعة {ordinal}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          +{formatNum(p.amount)} ج.م
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground pt-1 border-t border-muted/50">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>التاريخ:</span>
                          <span className="font-mono font-bold text-foreground">{p.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>البيان:</span>
                          <span className="text-foreground font-medium">
                            {p.notes && p.notes.trim() ? p.notes.trim() : "سداد نقدي معتمد"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. ملخص حركة الحساب */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border space-y-2">
            <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <span>📈</span>
              <span>ملخص حركة الحساب</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-background rounded-xl border text-center">
                <span className="text-[10px] text-muted-foreground block">عدد الحركات</span>
                <strong className="text-foreground font-bold">{totals.movementsCount}</strong>
              </div>
              <div className="p-2 bg-background rounded-xl border text-center">
                <span className="text-[10px] text-muted-foreground block">إجمالي المدفوعات</span>
                <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatNum(totals.totalPaid)} ج.م</strong>
              </div>
              <div className="p-2 bg-background rounded-xl border text-center">
                <span className="text-[10px] text-muted-foreground block">إجمالي المقبوضات</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatNum(totals.totalCollected)} ج.م</strong>
              </div>
              <div className="p-2 bg-background rounded-xl border text-center">
                <span className="text-[10px] text-muted-foreground block">صافي الرصيد</span>
                <strong className={`font-bold ${totals.remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {formatNum(totals.remaining)} ج.م
                </strong>
              </div>
            </div>
          </div>

          {/* 5. خاتمة التقرير */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-1">
            <p className="text-xs font-extrabold text-primary">
              🤝 شكرًا لثقتكم، ونتطلع دائمًا إلى استمرار التعاون المثمر.
            </p>
            <p className="text-[11px] text-muted-foreground">
              🐔 <strong>Mazareana Pro</strong> — منظومة متكاملة لإدارة الحسابات والمعاملات المالية
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
