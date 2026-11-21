import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Check, RefreshCw, AlertCircle, Sparkles, Calendar, CreditCard, User, Tag, Clock } from "lucide-react";
import { parseArabicSpeechToTransaction, type ParsedTransaction } from "@/lib/smartVoiceParser";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";

interface SmartVoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "expense" | "revenue" | "payment";
  onSuccess?: () => void;
}

export const SmartVoiceModal: React.FC<SmartVoiceModalProps> = ({
  open,
  onOpenChange,
  defaultType = "expense",
  onSuccess
}) => {
  const { clients, addExpense, addRevenue, addPayment, currentFarm } = useAppContext();
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);

  // Initialize listeners
  useEffect(() => {
    if (open) {
      setSpokenText("");
      setParsed(null);
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [open]);

  const startListening = () => {
    setIsListening(true);
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;

    // 1. Android Bridge Native Speech Listener
    if (androidBridge && typeof androidBridge.startListening === "function") {
      (window as any).onNativeSpeechResult = (text: string) => {
        setIsListening(false);
        setSpokenText(text);
        const result = parseArabicSpeechToTransaction(text, clients);
        setParsed(result);
      };

      (window as any).onNativeSpeechError = () => {
        setIsListening(false);
      };

      androidBridge.startListening();
      return;
    }

    // 2. Web Speech API Fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "ar-EG";
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setIsListening(false);
          setSpokenText(text);
          const result = parseArabicSpeechToTransaction(text, clients);
          setParsed(result);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.start();
        (window as any).__webRecognition = recognition;
        return;
      } catch (e) {
        setIsListening(false);
      }
    }

    setIsListening(false);
  };

  const stopListening = () => {
    setIsListening(false);
    const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
    if (androidBridge && typeof androidBridge.stopListening === "function") {
      androidBridge.stopListening();
    }
    if ((window as any).__webRecognition) {
      try {
        (window as any).__webRecognition.stop();
      } catch {}
    }
  };

  const handleConfirmAdd = () => {
    if (!parsed || parsed.amount <= 0) {
      toast.error("يرجى التأكد من تحديد المبلغ أو إعادة المحاولة");
      return;
    }

    const transactionDate = parsed.date || new Date().toISOString().split("T")[0];
    const operationTitle = parsed.operationName || parsed.notes || parsed.rawText;

    if (parsed.type === "expense") {
      addExpense({
        category: parsed.category,
        amount: parsed.amount,
        date: transactionDate,
        description: operationTitle,
        quantity: parsed.quantity || null,
        unitPrice: parsed.unitPrice || null,
        paymentMethod: parsed.paymentMethod || 'cash',
        paidAmount: parsed.paidAmount !== undefined ? parsed.paidAmount : parsed.amount,
        clientId: parsed.clientId || null,
        supplierName: parsed.clientName || undefined
      });
      toast.success(`✅ تم تسجيل مصروف (${parsed.category}) بمبلغ ${parsed.amount.toLocaleString()} ج.م بتاريخ ${transactionDate}`);
    } else if (parsed.type === "revenue") {
      addRevenue({
        type: parsed.category,
        amount: parsed.amount,
        date: transactionDate,
        notes: operationTitle,
        quantity: parsed.quantity || null,
        unitPrice: parsed.unitPrice || null,
        clientId: parsed.clientId || null,
        paymentMethod: parsed.paymentMethod || 'cash'
      });
      toast.success(`✅ تم تسجيل إيراد (${parsed.category}) بمبلغ ${parsed.amount.toLocaleString()} ج.م بتاريخ ${transactionDate}`);
    } else {
      if (parsed.clientId) {
        addPayment({
          clientId: parsed.clientId,
          amount: parsed.amount,
          date: transactionDate,
          notes: operationTitle
        });
        toast.success(`✅ تم تسجيل دفعة بمبلغ ${parsed.amount.toLocaleString()} ج.م للعميل ${parsed.clientName || ''}`);
      } else {
        toast.error("يرجى تحديد العميل لتسجيل الدفعة");
        return;
      }
    }

    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 rounded-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>المساعد الصوتي الذكي (تسجيل القيود بالكلام)</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-4 text-center">
          {/* Big Microphone animation */}
          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110 animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
              }`}
            >
              <Mic className="w-9 h-9" />
            </button>
            <p className="text-xs font-bold mt-3 text-slate-700 dark:text-slate-300">
              {isListening ? "جاري الاستماع... تحدث الآن بجملة واحدة" : "اضغط على المايك للتحدث"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
              مثال: "سجل بيع فراخ تسمين 50 ألف للتاجر أحمد بتاريخ 5 أكتوبر كاش" أو "شراء 2 طن علف من شركة النور يوم 10 اللي فات آجل"
            </p>
          </div>

          {/* Spoken Text Display */}
          {spokenText && (
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-right">
              <span className="text-[10px] text-slate-400 block font-bold mb-1">النص المسموع:</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{spokenText}</p>
            </div>
          )}

          {/* Parsed Result Box */}
          {parsed && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-right space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم استخراج تفاصيل القيد المالي:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {parsed.type === "expense" ? "مصروف" : parsed.type === "revenue" ? "إيراد" : "دفعة"}
                </span>
              </div>

              {/* Operation Title (اسم العمل / البيان) */}
              {parsed.operationName && (
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] text-slate-400 block font-semibold">اسم العمل / البيان:</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {parsed.operationName}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">البند:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{parsed.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">المبلغ الإجمالي:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                    {parsed.amount > 0 ? `${parsed.amount.toLocaleString()} ج.م` : "غير محدد"}
                  </span>
                </div>

                {/* Date Display */}
                <div>
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600 inline" />
                    <span>التاريخ المستخرج:</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                    {parsed.date}
                  </span>
                </div>

                {/* Payment Terms (كاش / آجل) */}
                <div>
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-600 inline" />
                    <span>طريقة السداد:</span>
                  </span>
                  {parsed.paymentStatus === 'سداد جزئي' ? (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      جزئي (مدفوع {parsed.paidAmount?.toLocaleString()} والباقي آجل)
                    </span>
                  ) : parsed.isCredit ? (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      آجل (على الحساب)
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      كاش (مدفوع بالكامل)
                    </span>
                  )}
                </div>

                {parsed.quantity && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">الكمية:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parsed.quantity} {parsed.unit || ""}
                    </span>
                  </div>
                )}
                {parsed.unitPrice && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">سعر الوحدة:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parsed.unitPrice.toLocaleString()} ج.م
                    </span>
                  </div>
                )}
                {parsed.clientName && (
                  <div className="col-span-2 bg-blue-50/60 dark:bg-blue-950/40 p-1.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block flex items-center gap-1 font-semibold">
                      <User className="w-3 h-3 text-blue-600 inline" />
                      <span>الطرف / العميل / المورد:</span>
                    </span>
                    <span className="font-extrabold text-blue-700 dark:text-blue-300 text-xs">
                      {parsed.clientName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {parsed && parsed.amount > 0 ? (
              <Button
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد وحفظ القيد المالي الآن</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startListening}
                disabled={isListening}
                className="flex-1 bg-primary text-white font-bold text-xs h-10 rounded-xl gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${isListening ? "animate-spin" : ""}`} />
                <span>{isListening ? "جاري الاستماع..." : "إعادة المحاولة والتحدث"}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 text-xs font-bold rounded-xl h-10"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
