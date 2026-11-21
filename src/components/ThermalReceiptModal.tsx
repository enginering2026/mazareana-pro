import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, MessageCircle, X } from "lucide-react";
import { openWhatsApp, generateInvoiceMessage } from "@/lib/whatsappSharing";
import type { Invoice } from "@/contexts/AppContext";

interface ThermalReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  farmName?: string;
  clientPhone?: string;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  open,
  onOpenChange,
  invoice,
  farmName = "مزارعنا برو",
  clientPhone = ""
}) => {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");

  if (!invoice) return null;

  const formatNum = (num: number) => Math.round(num || 0).toLocaleString("en-US");

  const handlePrint = () => {
    // Inject thermal print style if not already present
    const styleId = "thermal-print-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      @media print {
        @page {
          size: ${paperWidth} auto;
          margin: 0mm;
        }
        body * {
          visibility: hidden !important;
        }
        #thermal-receipt-content, #thermal-receipt-content * {
          visibility: visible !important;
        }
        #thermal-receipt-content {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${paperWidth} !important;
          margin: 0 !important;
          padding: 6px !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Courier New', Courier, monospace !important;
          box-shadow: none !important;
        }
      }
    `;

    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = generateInvoiceMessage(invoice, farmName);
    openWhatsApp(clientPhone, text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-sm font-extrabold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-primary" />
              <span>معاينة إيصال الطابعة الحرارية (Bluetooth POS)</span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Paper Size Selector */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl text-xs font-bold mt-2">
          <span className="text-slate-500 mr-2">عرض ورق الطابعة:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPaperWidth("58mm")}
              className={`px-3 py-1 rounded-lg transition ${
                paperWidth === "58mm"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              58 مم (محمولة)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth("80mm")}
              className={`px-3 py-1 rounded-lg transition ${
                paperWidth === "80mm"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              80 مم (كبيرة)
            </button>
          </div>
        </div>

        {/* Thermal Receipt Preview Paper */}
        <div className="flex justify-center my-3">
          <div
            id="thermal-receipt-content"
            style={{ width: paperWidth === "58mm" ? "250px" : "320px" }}
            className="bg-[#fffdf7] text-black border-2 border-dashed border-slate-300 p-3 rounded-lg shadow-inner text-[11px] font-mono leading-tight select-none"
            dir="rtl"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <p className="text-xs font-black tracking-wider">{farmName}</p>
              <p className="text-[10px] text-slate-700 mt-0.5">إيصال مبيعات</p>
              <p className="text-[9px] text-slate-600 mt-0.5">
                رقم: #{invoice.number} • {invoice.date}
              </p>
            </div>

            {/* Client Info */}
            <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>العميل:</span>
                <span className="font-bold">{invoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>طريقة الدفع:</span>
                <span>{invoice.paymentMethod === "cash" ? "نقدي" : "آجل"}</span>
              </div>
            </div>

            {/* Table Items */}
            <div className="py-1.5 border-b border-dashed border-black">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-black/40">
                <span>الصنف</span>
                <span>الكمية × السعر</span>
                <span>الإجمالي</span>
              </div>
              <div className="space-y-1 pt-1">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="font-bold">{item.type}</span>
                      <span className="text-[9px]">
                        {item.quantity} × {formatNum(item.unitPrice)}
                      </span>
                      <span className="font-bold">{formatNum(item.total)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[9px] py-1">لا توجد بنود</p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 space-y-1 text-xs font-black border-b border-dashed border-black">
              <div className="flex justify-between text-sm">
                <span>المجموع النهائي:</span>
                <span>{formatNum(invoice.totalAmount)} ج.م</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[9px] text-slate-700 space-y-0.5">
              <p>شكراً لتعاملكم معنا</p>
              <p className="text-[8px] text-slate-500">مزارعنا برو - المنظومة المحاسبية</p>
              <p className="text-[8px] font-mono tracking-widest text-slate-400 mt-1">*** نهاية الإيصال ***</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-bold gap-1.5 rounded-xl h-10"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال الحراري</span>
          </Button>

          <Button
            type="button"
            onClick={handleShareWhatsApp}
            variant="outline"
            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold gap-1.5 rounded-xl h-10"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>واتساب</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
