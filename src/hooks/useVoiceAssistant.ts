// ============================================================
// useVoiceAssistant.ts — Voice AI Assistant Hook (Push-To-Talk)
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { extractEntities, ExtractedEntities } from '@/lib/arabicNLP';
import { generateResponse, speak, stopSpeaking } from '@/lib/arabicTTS';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssistantState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'confirming'
  | 'speaking'
  | 'error';

export interface VoiceResult {
  entities: ExtractedEntities;
  responseText: string;
  needsConfirmation: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AndroidSpeech?: {
      isAvailable: () => boolean;
      isOffline?: () => boolean;
      openVoiceSettings?: () => void;
      downloadVoicePackNow?: () => void;
      openGoogleSpeechStore?: () => void;
      startListening: () => void;
      startListeningWithDialog: () => void;
      stopListening: () => void;
      cancelListening: () => void;
    };
    onNativeSpeechEvent?: (event: string) => void;
    onNativeSpeechResult?: (text: string) => void;
    onNativeSpeechPartial?: (text: string) => void;
    onNativeSpeechError?: (code: number) => void;
    onNativePermissionResult?: (granted: boolean) => void;
    onOfflineVoiceProgress?: (progress: number) => void;
    onOfflineVoiceSuccess?: () => void;
    onOfflineVoiceScheduled?: () => void;
    onOfflineVoiceError?: (code: number) => void;
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceAssistant() {
  const app = useAppContext();

  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [pendingResult, setPendingResult] = useState<VoiceResult | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);

  const recognitionRef = useRef<any | null>(null);
  const isMounted = useRef(true);
  const finalTranscriptRef = useRef('');
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearListeningTimeout = useCallback(() => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearListeningTimeout();
    };
  }, [clearListeningTimeout]);

  // Safety timeout: stop after 15 seconds max continuous hold
  useEffect(() => {
    if (state === 'listening') {
      clearListeningTimeout();
      listeningTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        window.AndroidSpeech?.stopListening();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        setState('idle');
      }, 15000);
    } else {
      clearListeningTimeout();
    }
  }, [state, clearListeningTimeout]);

  // ─── Execute confirmed action ───────────────────────────────────────────────

  const executeAction = useCallback(async (entities: ExtractedEntities): Promise<string> => {
    const today = new Date().toISOString().split('T')[0];
    const txDate = entities.date || today;

    // Resolve or auto-register client if a client name was mentioned
    let targetClientId = entities.clientId;
    if (!targetClientId && entities.clientName && entities.clientName.trim().length > 1) {
      const cleanCandidate = entities.clientName.trim().toLowerCase();
      const existing = app.clients.find(c => {
        const cName = c.name.toLowerCase();
        return cName === cleanCandidate || cName.includes(cleanCandidate) || cleanCandidate.includes(cName);
      });
      if (existing) {
        targetClientId = existing.id;
      } else if (app.currentFarm) {
        // Register new client in farm database so their account & debts are preserved!
        const isSupplier = entities.intent === 'ADD_EXPENSE';
        const newClient = {
          name: entities.clientName.trim(),
          type: isSupplier ? ('مورد' as const) : ('مشتري' as const),
          phone: '',
          email: '',
          notes: 'تمت إضافته عبر المساعد الصوتي'
        };
        await app.addClient(newClient);
        const registered = app.clients.find(c => c.name === entities.clientName?.trim());
        if (registered) targetClientId = registered.id;
      }
    }

    switch (entities.intent) {
      case 'ADD_REVENUE': {
        const amount = entities.totalAmount ?? ((entities.quantity ?? 0) * (entities.unitPrice ?? 0));
        if (!amount) return 'يرجى تحديد المبلغ أو الكمية وسعر الطبق لحساب الإجمالي.';
        
        await app.addRevenue({
          type: entities.transactionType ?? 'إيرادات عامة',
          amount,
          date: txDate,
          notes: entities.operationName || entities.notes || '',
          quantity: entities.quantity ?? null,
          unitPrice: entities.unitPrice ?? null,
          clientId: targetClientId ?? null,
          paymentMethod: entities.isCredit ? 'credit' : 'cash',
        });

        // If client paid in cash (or partial), record payment so client balance is not falsely in debt
        const paidAmount = entities.paidAmount !== undefined 
          ? entities.paidAmount 
          : (entities.isCredit ? 0 : amount);

        if (targetClientId && paidAmount > 0) {
          await app.addPayment({
            clientId: targetClientId,
            amount: paidAmount,
            date: txDate,
            notes: entities.isCredit 
              ? `سداد جزئي عند البيع (${entities.operationName || 'إيراد'})`
              : `سداد نقدي كاش بالكامل (${entities.operationName || 'إيراد'})`
          });
        }

        return generateResponse({ entities, success: true });
      }

      case 'ADD_EXPENSE': {
        const amount = entities.totalAmount ?? ((entities.quantity ?? 0) * (entities.unitPrice ?? 0));
        if (!amount) return 'يرجى تحديد قيمة المصروف لحفظه.';
        const actualPaid = entities.paidAmount !== undefined 
          ? entities.paidAmount 
          : (entities.isCredit ? 0 : amount);

        await app.addExpense({
          category: entities.transactionType ?? 'مصروفات عامة',
          amount,
          date: txDate,
          description: entities.operationName || entities.notes || '',
          quantity: entities.quantity ?? null,
          unitPrice: entities.unitPrice ?? null,
          paymentMethod: entities.isCredit ? 'credit' : 'cash',
          paidAmount: actualPaid,
          supplierName: entities.clientName,
          clientId: targetClientId ?? null,
        });

        return generateResponse({ entities, success: true });
      }

      case 'ADD_PAYMENT': {
        const amount = entities.totalAmount ?? 0;
        if (!amount) return 'يرجى تحديد قيمة الدفعة لحفظها.';
        if (!targetClientId) {
          return `لم يتم العثور على العميل (${entities.clientName || ''}) في قاعدة البيانات.`;
        }
        await app.addPayment({
          clientId: targetClientId,
          amount,
          date: txDate,
          notes: entities.operationName || entities.notes || 'سداد دفعة نقدية',
        });
        return generateResponse({ entities, success: true });
      }

      case 'QUERY_PROFIT': {
        const netProfit = app.getNetProfit();
        return generateResponse({ entities, netProfit });
      }

      case 'QUERY_REVENUES': {
        const totalRevenues = app.getTotalRevenues();
        return generateResponse({ entities, totalRevenues });
      }

      case 'QUERY_EXPENSES': {
        const totalExpenses = app.getTotalExpenses();
        return generateResponse({ entities, totalExpenses });
      }

      case 'QUERY_CLIENT_BALANCE': {
        if (!entities.clientId) return 'لم يتم العثور على اسم العميل المطلوب.';
        const clientBalance = app.getClientTotals(entities.clientId);
        return generateResponse({ entities, clientBalance });
      }

      case 'QUERY_PARTNER_SHARE': {
        const partner = app.partners[0];
        if (!partner) return 'لا يوجد شركاء مسجلون في النظام حالياً.';
        const netProfit = app.getNetProfit();
        const partnerShare = (netProfit * partner.partnershipPercentage) / 100;
        return generateResponse({ entities, partnerName: partner.name, partnerPercentage: partner.partnershipPercentage, partnerShare });
      }

      default:
        return 'لم أتمكن من فهم الطلب بدقة. يمكنك قول أو كتابة: "سجل إيراد بيض 100 طبق بسعر 120"';
    }
  }, [app]);

  // ─── Process text ───────────────────────────────────────────────────────────

  const processTextRef = useRef<(text: string) => Promise<void>>(async () => {});

  const processText = useCallback(async (text: string) => {
    if (!text.trim()) { setState('idle'); return; }

    clearListeningTimeout();
    if (!isMounted.current) return;
    setState('processing');
    setTranscript(text);
    finalTranscriptRef.current = '';

    try {
      const entities = extractEntities(text, app.clients);
      const isDataMutation = ['ADD_REVENUE', 'ADD_EXPENSE', 'ADD_PAYMENT'].includes(entities.intent);

      if (isDataMutation) {
        const responseText = buildConfirmationText(entities);
        const result: VoiceResult = { entities, responseText, needsConfirmation: true };
        if (!isMounted.current) return;
        setPendingResult(result);
        setState('confirming');
        safeSpeak(`تأكيد: ${responseText}`);
      } else {
        const responseText = await executeAction(entities);
        if (!isMounted.current) return;
        setPendingResult({ entities, responseText, needsConfirmation: false });
        setState('speaking');
        await safeSpeak(responseText);
        if (!isMounted.current) return;
        setState('idle');
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      if (!isMounted.current) return;
      setState('error');
      toast.error('حدث خطأ أثناء المعالجة');
      setTimeout(() => { if (isMounted.current) setState('idle'); }, 2000);
    }
  }, [app.clients, executeAction, clearListeningTimeout]);

  useEffect(() => {
    processTextRef.current = processText;
  }, [processText]);

  const safeSpeak = async (text: string): Promise<void> => {
    try {
      await speak(text);
    } catch {}
  };

  // ─── Native Android Bridge Setup ───────────────────────────────────────────

  useEffect(() => {
    window.onNativeSpeechEvent = (event: string) => {
      if (!isMounted.current) return;
      if (event === 'ready') setState('listening');
      if (event === 'listening') setState('listening');
      if (event === 'processing') {
        clearListeningTimeout();
        setState('processing');
      }
      if (event === 'cancelled') {
        clearListeningTimeout();
        setState('idle');
      }
    };

    window.onNativeSpeechPartial = (text: string) => {
      if (!isMounted.current) return;
      setInterimTranscript(text);
    };

    window.onNativeSpeechResult = (text: string) => {
      if (!isMounted.current) return;
      clearListeningTimeout();
      setInterimTranscript('');
      processTextRef.current(text);
    };

    window.onNativeSpeechError = (code: number) => {
      console.warn('Native speech error code:', code);
      if (!isMounted.current) return;
      clearListeningTimeout();
      setState('idle');

      if (code === 7) {
        toast.info('لم يتم سماع صوت واضح. اضغط وتحدث ثانية.');
      } else if (code === 6) {
        toast.info('انتهى وقت الاستماع. اضغط وتحدث مجدداً.');
      } else if (code === 9) {
        toast.error('يرجى تفعيل صلاحية الميكروفون من إعدادات الهاتف.');
      } else {
        setShowTextModal(true);
        toast.info('يمكنك كتابة الأمر المالي مباشرة في لوحة الأوامر الذكية.');
      }
    };

    window.onOfflineVoiceProgress = () => {};
    window.onOfflineVoiceSuccess = () => {};
    window.onOfflineVoiceScheduled = () => {};
    window.onOfflineVoiceError = () => {};

    window.onOfflineVoiceScheduled = () => {
      toast.info('جاري بدء تنزيل وتثبيت الحزمة الصوتية تلقائياً في الخلفية...');
    };

    window.onOfflineVoiceError = () => {
      console.warn('Offline voice model is not available for background auto-download on this device.');
    };

    return () => {
      window.onNativeSpeechEvent = undefined;
      window.onNativeSpeechResult = undefined;
      window.onNativeSpeechPartial = undefined;
      window.onNativeSpeechError = undefined;
      window.onOfflineVoiceProgress = undefined;
      window.onOfflineVoiceSuccess = undefined;
      window.onOfflineVoiceScheduled = undefined;
      window.onOfflineVoiceError = undefined;
    };
  }, [clearListeningTimeout]);

  // ─── Start Listening ────────────────────────────────────────────────────────

  const startListening = useCallback(async (useDialog = false) => {
    if (state === 'listening' || state === 'processing') return;

    stopSpeaking();
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';

    // 1. Try Native Android Speech Recognizer Bridge
    if (typeof window !== 'undefined' && window.AndroidSpeech && window.AndroidSpeech.isAvailable()) {
      setState('listening');
      if (useDialog) {
        window.AndroidSpeech.startListeningWithDialog();
      } else {
        window.AndroidSpeech.startListening();
      }
      return;
    }

    // If on Capacitor native app, wait or fall back
    const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      toast.info('المساعد الصوتي قيد التهيئة. يمكنك استخدام زر الكتابة الآن.');
      return;
    }

    // 2. Browser Web Speech API
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.info('المتصفح لا يدعم الصوت. اضغط على أيقونة الكيبورد لكتابة الأمر.');
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch {
      toast.error('يرجى السماح بصلاحية الميكروفون');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ar-EG';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 3;

    let finalText = '';

    recognition.onstart = () => {
      if (isMounted.current) setState('listening');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim && isMounted.current) setInterimTranscript(interim);
    };

    recognition.onend = () => {
      if (!isMounted.current) return;
      clearListeningTimeout();
      recognitionRef.current = null;
      setInterimTranscript('');
      if (finalText.trim()) {
        processTextRef.current(finalText.trim());
      } else {
        setState('idle');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('STT error:', event.error);
      if (!isMounted.current) return;
      clearListeningTimeout();
      recognitionRef.current = null;
      setState('idle');
      if (event.error === 'not-allowed') {
        toast.error('تم رفض إذن الميكروفون.');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Error starting speech recognition:', e);
      setState('idle');
    }
  }, [state, clearListeningTimeout]);

  // ─── Stop Listening (Finished holding button) ────────────────────────────────

  const stopListening = useCallback(() => {
    clearListeningTimeout();
    if (typeof window !== 'undefined' && window.AndroidSpeech) {
      window.AndroidSpeech.stopListening();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    stopSpeaking();
  }, [clearListeningTimeout]);

  // ─── Cancel Action ──────────────────────────────────────────────────────────

  const cancelAction = useCallback(() => {
    clearListeningTimeout();
    if (typeof window !== 'undefined' && window.AndroidSpeech) {
      window.AndroidSpeech.cancelListening();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    stopSpeaking();
    setPendingResult(null);
    setState('idle');
  }, [clearListeningTimeout]);

  // ─── Confirm Action ─────────────────────────────────────────────────────────

  const confirmAction = useCallback(async () => {
    if (!pendingResult) return;
    setState('processing');

    try {
      const responseText = await executeAction(pendingResult.entities);
      if (!isMounted.current) return;
      toast.success(responseText);
      setState('speaking');
      await safeSpeak(responseText);
      if (!isMounted.current) return;
      setState('idle');
      setPendingResult(null);
    } catch (err) {
      console.error('confirmAction error:', err);
      toast.error('حدث خطأ أثناء الحفظ');
      if (isMounted.current) {
        setState('idle');
        setPendingResult(null);
      }
    }
  }, [pendingResult, executeAction]);

  const openVoiceSettings = useCallback(() => {
    window.AndroidSpeech?.openVoiceSettings?.();
  }, []);

  const downloadVoicePackNow = useCallback(() => {
    if (window.AndroidSpeech?.downloadVoicePackNow) {
      window.AndroidSpeech.downloadVoicePackNow();
    } else if (window.AndroidSpeech?.openVoiceSettings) {
      window.AndroidSpeech.openVoiceSettings();
    } else {
      toast.info('تنزيل الحزمة متاح عبر تطبيق أندرويد APK.');
    }
  }, []);

  const openGoogleSpeechStore = useCallback(() => {
    if (typeof window !== 'undefined' && window.AndroidSpeech?.openGoogleSpeechStore) {
      window.AndroidSpeech.openGoogleSpeechStore();
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox', '_blank');
    }
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    pendingResult,
    showTextModal,
    setShowTextModal,
    openVoiceSettings,
    downloadVoicePackNow,
    openGoogleSpeechStore,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    isConfirming: state === 'confirming',
    isSpeaking: state === 'speaking',
    startListening: () => startListening(false),
    startListeningWithDialog: () => startListening(true),
    stopListening,
    cancelAction,
    confirmAction,
    processText,
  };
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function buildConfirmationText(e: ExtractedEntities): string {
  const parts: string[] = [];
  if (e.intent === 'ADD_REVENUE') {
    parts.push(`تسجيل إيراد: ${e.transactionType ?? 'إيراد عام'}`);
  } else if (e.intent === 'ADD_EXPENSE') {
    parts.push(`تسجيل مصروف: ${e.transactionType ?? 'مصروف عام'}`);
  } else if (e.intent === 'ADD_PAYMENT') {
    parts.push('تسجيل دفعة نقدية');
  } else if (e.transactionType) {
    parts.push(e.transactionType);
  }

  if (e.operationName && e.operationName !== e.transactionType) {
    parts.push(`البيان: ${e.operationName}`);
  }
  if (e.quantity) parts.push(`الكمية: ${e.quantity}`);
  if (e.unitPrice) parts.push(`السعر: ${e.unitPrice} ج`);
  if (e.totalAmount) parts.push(`الإجمالي: ${e.totalAmount.toLocaleString('ar-EG')} جنيه`);
  if (e.paymentStatus) parts.push(`السداد: ${e.paymentStatus}`);
  if (e.clientName) parts.push(`الطرف: ${e.clientName}`);
  if (e.date) parts.push(`التاريخ: ${e.date}`);
  return parts.join(' | ');
}
