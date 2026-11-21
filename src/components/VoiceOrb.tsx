// ============================================================
// VoiceOrb.tsx — Intelligent Voice & Smart Command Assistant
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Volume2, Sparkles, Send, Keyboard, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Waveform bars ────────────────────────────────────────────────────────────

function WaveformBars() {
  return (
    <div className="flex items-end justify-center gap-0.5 h-5 pointer-events-none">
      {[3, 6, 9, 7, 4, 8, 5, 9, 6, 3].map((h, i) => (
        <span
          key={i}
          className="w-0.5 bg-white rounded-full opacity-90"
          style={{
            height: `${h * 2}px`,
            animation: `voiceWave 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Orb Component ───────────────────────────────────────────────────────

export function VoiceOrb() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHome = currentPath === "/";
  const isRevenues = currentPath.startsWith("/revenues");
  const isExpenses = currentPath.startsWith("/expenses");
  const isClients = currentPath.startsWith("/clients");

  const va = useVoiceAssistant();
  const { showTextModal, setShowTextModal } = va;
  const [inputText, setInputText] = useState('');
  const [responseVisible, setResponseVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Automatically cancel listening / speaking if navigating away from home
  useEffect(() => {
    if (!isHome && (va.isListening || va.isSpeaking)) {
      if (va.isListening) va.stopListening();
    }
  }, [isHome, va.isListening, va.isSpeaking]);

  // Show response bubble whenever pendingResult changes
  useEffect(() => {
    if (va.pendingResult) {
      setResponseVisible(true);
      if (!va.pendingResult.needsConfirmation) {
        if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
        responseTimerRef.current = setTimeout(() => {
          setResponseVisible(false);
        }, 8000);
      }
    } else {
      setResponseVisible(false);
    }
    return () => {
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    };
  }, [va.pendingResult]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef(false);

  const startPress = () => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      // Long press triggers microphone listening
      if (!va.isListening && !va.isProcessing && !va.isSpeaking) {
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 30, 40]);
          }
        } catch {}
        va.startListening();
      }
    }, 450);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleFabClick = () => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }

    if (va.isConfirming) {
      va.cancelAction();
      return;
    }

    if (va.isListening) {
      va.stopListening();
      return;
    }

    if (va.isProcessing || va.isSpeaking) return;

    // Regular click opens the writing dialog
    setShowTextModal(true);
  };

  const handleMicClick = () => {
    if (va.isConfirming) {
      va.cancelAction();
      return;
    }
    if (va.isProcessing || va.isSpeaking) return;

    if (va.isListening) {
      va.stopListening();
    } else {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(35);
        }
      } catch {}
      va.startListening();
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    va.processText(inputText.trim());
    setInputText('');
    setShowTextModal(false);
  };

  const handleChipClick = (query: string) => {
    va.processText(query);
    setShowTextModal(false);
  };

  const orbLabel = va.isListening
    ? 'تحدث الآن...'
    : va.isProcessing
    ? 'معالجة...'
    : va.isSpeaking
    ? 'يتكلم...'
    : '';

  // 1. If on Settings or any unknown page, hide completely
  if (!isHome && !isRevenues && !isExpenses && !isClients) {
    return null;
  }

  // 2. If on Revenues, Expenses, or Clients, render the dynamic Quick Add (+) FAB
  if (isRevenues || isExpenses || isClients) {
    let actionTitle = "";
    let actionBg = "";
    let eventName = "";

    if (isRevenues) {
      actionTitle = "تسجيل إيراد جديد";
      actionBg = "bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/35 ring-emerald-400/30";
      eventName = "open-add-revenue-dialog";
    } else if (isExpenses) {
      actionTitle = "تسجيل مصروف جديد";
      actionBg = "bg-gradient-to-tr from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/35 ring-rose-400/30";
      eventName = "open-add-expense-dialog";
    } else {
      actionTitle = "تسجيل عميل جديد";
      actionBg = "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/35 ring-blue-400/30";
      eventName = "open-add-client-dialog";
    }

    const handleQuickAdd = () => {
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(30);
        }
      } catch {}
      window.dispatchEvent(new CustomEvent(eventName));
    };

    return (
      <div className="fixed bottom-24 left-4 z-50 flex items-center pointer-events-auto select-none">
        <button
          type="button"
          onClick={handleQuickAdd}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 select-none cursor-pointer",
            "active:scale-90 hover:scale-105 border-2 border-white dark:border-slate-800 ring-2",
            actionBg
          )}
          title={actionTitle}
          aria-label={actionTitle}
        >
          <Plus className="h-7 w-7 text-white stroke-[2.5]" />
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes voiceWave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.7); }
          50%       { box-shadow: 0 0 0 16px rgba(225, 29, 72, 0); }
        }
      `}</style>

      {/* ── Transcript Bubble ──────────────────────────────────────────────────── */}
      {(va.transcript || va.interimTranscript) && !va.isConfirming && (
        <div
          className="fixed bottom-44 left-4 z-50 max-w-[280px] pointer-events-none"
          dir="rtl"
        >
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-2xl p-3 shadow-2xl text-xs text-right animate-in fade-in-0 duration-200">
            <span className="text-muted-foreground text-[10px] block mb-0.5">🎤 سمعت:</span>
            <span className="font-semibold text-foreground">
              {va.transcript || va.interimTranscript}
              {va.isListening && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse mr-1 rounded-xs" />}
            </span>
          </div>
        </div>
      )}

      {/* ── Response Bubble — Always shows AI reply text ───────────────────────── */}
      {responseVisible && va.pendingResult && !va.pendingResult.needsConfirmation && (
        <div
          className="fixed bottom-44 left-4 z-50 max-w-[300px]"
          dir="rtl"
        >
          <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-2xl text-sm text-right animate-in slide-in-from-bottom-2 duration-300">
            <p className="leading-relaxed font-medium">{va.pendingResult.responseText}</p>
            <button
              onClick={() => setResponseVisible(false)}
              className="mt-1.5 text-primary-foreground/60 hover:text-primary-foreground text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3 w-3" /> إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmation Card ──────────────────────────────────────────────────── */}
      {va.isConfirming && va.pendingResult && (
        <div
          className="fixed bottom-44 left-4 z-50 max-w-[320px] w-full"
          dir="rtl"
        >
          <div className="bg-card border-2 border-primary/40 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-300 space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-bold text-foreground">تأكيد القيد المالي</p>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {va.pendingResult.entities.intent === 'ADD_REVENUE' ? 'إيراد' : va.pendingResult.entities.intent === 'ADD_EXPENSE' ? 'مصروف' : 'دفعة'}
              </span>
            </div>

            {/* Structured details display */}
            <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-right">
              {va.pendingResult.entities.operationName && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">البيان:</span>
                  <span className="font-extrabold text-foreground">{va.pendingResult.entities.operationName}</span>
                </div>
              )}
              {va.pendingResult.entities.totalAmount ? (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">المبلغ:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {va.pendingResult.entities.totalAmount.toLocaleString()} ج.م
                  </span>
                </div>
              ) : null}
              {va.pendingResult.entities.date && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">التاريخ:</span>
                  <span className="font-bold text-foreground" dir="ltr">{va.pendingResult.entities.date}</span>
                </div>
              )}
              {va.pendingResult.entities.paymentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold">السداد:</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    va.pendingResult.entities.isCredit 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  }`}>
                    {va.pendingResult.entities.paymentStatus}
                  </span>
                </div>
              )}
              {va.pendingResult.entities.clientName && (
                <div className="flex justify-between items-center border-t border-slate-200/60 dark:border-slate-800 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">الطرف / التاجر:</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{va.pendingResult.entities.clientName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 h-9 gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={va.confirmAction}
              >
                <CheckCircle2 className="h-4 w-4" />
                تأكيد وحفظ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 gap-1 text-xs font-bold"
                onClick={va.cancelAction}
              >
                <XCircle className="h-4 w-4" />
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Command Text Dialog ──────────────────────────────────────────── */}
      {showTextModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTextModal(false); }}
        >
          <div
            className="w-full max-w-md bg-card border rounded-2xl p-4 shadow-2xl space-y-3 mb-24 sm:mb-0 animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">المساعد المالي الذكي</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowTextModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: '💰 صافي الأرباح', query: 'صافي الارباح كام' },
                { label: '📈 إجمالي الإيرادات', query: 'اجمالي الايرادات كام' },
                { label: '📉 المصروفات', query: 'المصاريف كام' },
                { label: '🤝 حصة الشريك', query: 'نسبة الشريك كام' },
              ].map(({ label, query }) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => handleChipClick(query)}
                  className="text-xs bg-muted/80 hover:bg-primary/10 hover:text-primary transition-colors px-2.5 py-1 rounded-full border border-border cursor-pointer font-medium"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendText(); }}
              className="flex gap-2 items-center pt-1"
            >
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب أمرك هنا... (مثال: سجل إيراد بيض 100 طبق بسعر 120)"
                className="text-sm h-10 bg-background"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowTextModal(false);
                  va.startListening();
                }}
                className="h-10 w-10 shrink-0 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                title="تحدث بالصوت"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0 cursor-pointer">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Single Unified Assistant FAB ────────────────────────────────────────── */}
      <div className="fixed bottom-24 left-4 z-50 flex items-center pointer-events-auto select-none">
        <div className="relative flex flex-col items-center">
          {orbLabel && (
            <span
              className={cn(
                'absolute -top-8 text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full transition-all duration-200 select-none shadow-md whitespace-nowrap',
                va.isListening
                  ? 'bg-rose-600 opacity-100 animate-pulse'
                  : 'bg-black/75 opacity-90'
              )}
            >
              {orbLabel}
            </span>
          )}

          <button
            type="button"
            onClick={handleFabClick}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onTouchCancel={cancelPress}
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
            disabled={va.isProcessing || va.isSpeaking}
            className={cn(
              'relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 select-none cursor-pointer',
              va.isListening
                ? 'bg-rose-600 scale-105 ring-4 ring-rose-400/50 text-white shadow-rose-500/40'
                : va.isProcessing
                ? 'bg-primary/70 cursor-not-allowed text-white'
                : va.isSpeaking
                ? 'bg-sky-600 cursor-not-allowed text-white'
                : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-primary/40',
            )}
            style={{
              animation: va.isListening ? 'orbPulse 1.5s ease-in-out infinite' : undefined,
            }}
            title="انقر للكتابة • اضغط مطولاً للتحدث بالصوت"
            aria-label="المساعد الذكي (نقر للكتابة، ضغط مطول للصوت)"
          >
            {va.isListening ? (
              <WaveformBars />
            ) : va.isProcessing ? (
              <Loader2 className="h-6 w-6 text-white animate-spin pointer-events-none" />
            ) : va.isSpeaking ? (
              <Volume2 className="h-6 w-6 text-white animate-pulse pointer-events-none" />
            ) : (
              <Mic className="h-6 w-6 text-white pointer-events-none" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
