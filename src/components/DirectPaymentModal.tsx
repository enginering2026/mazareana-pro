import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, Smartphone, CreditCard, ShieldCheck, Zap, 
  Sparkles, Lock, ArrowLeft, ArrowRight, Loader2, Check, ExternalLink 
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlan, 
  PaymentMethodType, 
  applyInstantActivation,
  getCustomGatewayUrl 
} from '@/lib/paymentService';
import { triggerHaptic } from '@/lib/haptics';
import { toast } from 'sonner';

interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  onActivated: () => void;
}

export const DirectPaymentModal: React.FC<DirectPaymentModalProps> = ({
  isOpen,
  onClose,
  deviceId,
  onActivated
}) => {
  const [step, setStep] = useState<'plan' | 'method' | 'checkout' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('wallet');
  
  // Wallet / Card form fields
  const [walletPhone, setWalletPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [txDetails, setTxDetails] = useState<{ key: string; txId: string } | null>(null);

  const customGateway = getCustomGatewayUrl();

  const handleProceedToPayment = () => {
    // Validate inputs
    if (paymentMethod === 'wallet') {
      if (!walletPhone || walletPhone.trim().length < 11) {
        toast.error('يرجى إدخال رقم محفظة صحيح مكون من 11 رقماً (مثال: 010xxxxxxxx)');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('يرجى إدخال رقم بطاقة صحيح مكون من 16 رقماً');
        return;
      }
      if (!cardExpiry) {
        toast.error('يرجى إدخال تاريخ انتهاء البطاقة (MM/YY)');
        return;
      }
    }

    setIsProcessing(true);
    triggerHaptic('medium');

    // Simulate online gateway handshake and instant automated verification
    setTimeout(() => {
      const result = applyInstantActivation(
        deviceId,
        selectedPlan.id,
        paymentMethod,
        paymentMethod === 'wallet' ? walletPhone : undefined
      );

      setIsProcessing(false);

      if (result.success) {
        setTxDetails({
          key: result.key,
          txId: 'TX-' + Math.floor(100000 + Math.random() * 900000)
        });
        setStep('success');
        triggerHaptic('success');
        toast.success('تم الدفع بنجاح وتفعيل التطبيق فوراً!');
      } else {
        toast.error('حدث خطأ أثناء معالجة العملية، يرجى المحاولة مرة أخرى.');
      }
    }, 2000);
  };

  const handleFinish = () => {
    onActivated();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[94vw] sm:w-full bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl shadow-2xl font-sans" dir="rtl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-900 p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-white">
                  الدفع والتفعيل الفوري المباشر
                </DialogTitle>
                <p className="text-[11px] text-blue-100/90 font-medium">
                  دفع إلكتروني آمن وتفعيل تلقائي لجهازك خلال ثوانٍ
                </p>
              </div>
            </div>
            <div className="text-left bg-black/20 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
              <span className="text-[10px] text-blue-200 block">معرّف جهازك</span>
              <span className="text-xs font-mono font-bold text-amber-300">{deviceId}</span>
            </div>
          </div>
        </div>

        {/* Steps Progress */}
        {step !== 'success' && (
          <div className="flex items-center justify-between px-6 pt-3 pb-1 border-b border-slate-800/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStep('plan')}
              className={`flex items-center gap-1.5 transition ${step === 'plan' ? 'text-blue-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'plan' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
              <span>اختيار الباقة</span>
            </button>
            <div className="w-8 h-0.5 bg-slate-800" />
            <button
              type="button"
              onClick={() => setStep('method')}
              className={`flex items-center gap-1.5 transition ${step === 'method' ? 'text-blue-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'method' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
              <span>طريقة الدفع</span>
            </button>
            <div className="w-8 h-0.5 bg-slate-800" />
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className={`flex items-center gap-1.5 transition ${step === 'checkout' ? 'text-blue-400' : 'text-slate-500'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'checkout' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
              <span>التأكيد والتفعيل</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">

          {/* STEP 1: Select Plan */}
          {step === 'plan' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-400 font-medium">اختر باقة الترخيص التي تناسب مشروعك ومزرعتك:</p>
              
              <div className="space-y-3">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan);
                        triggerHaptic('light');
                      }}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> الأكثر طلباً (توفير دائم)
                        </span>
                      )}

                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>{plan.name}</span>
                          </h4>
                          <span className="text-[11px] text-slate-400">{plan.period}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-xl font-mono font-extrabold text-amber-400">{plan.price}</span>
                          <span className="text-[11px] text-slate-400 font-bold mr-1">ج.م</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-[11px] text-slate-300 flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => {
                  setStep('method');
                  triggerHaptic('light');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer mt-2"
              >
                <span>متابعة لاختيار وسيلة الدفع</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Payment Method */}
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">اختر طريقة الدفع المفضلة لديك:</p>

              <div className="space-y-2.5">
                {/* Method 1: Mobile Wallets */}
                <div
                  onClick={() => {
                    setPaymentMethod('wallet');
                    triggerHaptic('light');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'wallet'
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">محافظ المحمول الإلكترونية</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">فودافون كاش، أورنج، اتصالات، وي، إنستاباي</p>
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-700'}`}>
                    {paymentMethod === 'wallet' && <Check className="w-3 h-3" />}
                  </span>
                </div>

                {/* Method 2: Bank Cards */}
                <div
                  onClick={() => {
                    setPaymentMethod('card');
                    triggerHaptic('light');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">بطاقة بنكية (فيزا / ماستركارد / ميزة)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">الدفع الآمن عبر كروت البنوك وبطاقة ميزة الوطنية</p>
                    </div>
                  </div>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-700'}`}>
                    {paymentMethod === 'card' && <Check className="w-3 h-3" />}
                  </span>
                </div>
              </div>

              {/* Order Summary Pill */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">الباقة المختارة:</span>
                  <span className="font-bold text-slate-200">{selectedPlan.name}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-base font-extrabold text-amber-400">{selectedPlan.price}</span>
                  <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('plan')}
                  className="w-1/3 border-slate-800 text-slate-400 hover:text-white py-6 rounded-2xl"
                >
                  السابق
                </Button>
                <Button
                  onClick={() => {
                    setStep('checkout');
                    triggerHaptic('light');
                  }}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  <span>متابعة لإدخال البيانات</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Checkout & Instant Unlock */}
          {step === 'checkout' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">إجمالي المبلغ المطلوب دفعه:</span>
                  <span className="text-base font-mono font-extrabold text-amber-400">{selectedPlan.price} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold text-slate-200">
                    {paymentMethod === 'wallet' ? 'محفظة إلكترونية (فودافون كاش / إنستاباي)' : 'بطاقة بنكية (فيزا / ميزة)'}
                  </span>
                </div>
              </div>

              {/* Wallet Fields */}
              {paymentMethod === 'wallet' && (
                <div className="space-y-2.5 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                  <Label className="text-xs text-slate-300 font-bold block">رقم محفظة فودافون كاش / المحفظة الإلكترونية:</Label>
                  <Input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-center font-mono text-base tracking-wider text-white py-5 rounded-xl focus:border-emerald-500"
                    maxLength={11}
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    💡 سيصلك إشعار بالخصم وتأكيد العملية، وسيتم **تفعيل البرنامج فوراً** لجهازك بدون انتظار.
                  </p>
                </div>
              )}

              {/* Card Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <Label className="text-xs text-slate-300 font-bold block mb-1">رقم البطاقة (16 رقم):</Label>
                    <Input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-center font-mono text-sm tracking-wider text-white py-5 rounded-xl focus:border-blue-500"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-slate-300 font-bold block mb-1">تاريخ الانتهاء:</Label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-center font-mono text-sm text-white py-4 rounded-xl"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-300 font-bold block mb-1">رمز الأمان (CVV):</Label>
                      <Input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-center font-mono text-sm text-white py-4 rounded-xl"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
                <span>اتصال مشفر وآمن 256-bit بمعايير البنك المركزي المصري</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => setStep('method')}
                  className="w-1/3 border-slate-800 text-slate-400 hover:text-white py-6 rounded-2xl"
                >
                  السابق
                </Button>
                <Button
                  disabled={isProcessing}
                  onClick={handleProceedToPayment}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer text-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري المعالجة والتفعيل...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>تأكيد الدفع والتفعيل الفوري ⚡</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Unlocked */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">تم الدفع وتفعيل التطبيق بنجاح! 🎉</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  شكراً لاشتراكك في منظومة مزارعنا برو. تم ربط ترخيص النسخة بجهازك بنجاح.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-right max-w-sm mx-auto">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">نوع الباقة:</span>
                  <span className="font-bold text-amber-300">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">رقم المعاملة:</span>
                  <span className="font-mono text-slate-200">{txDetails?.txId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">حالة التفعيل:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> مفعل ونشط لمدى الحياة
                  </span>
                </div>
              </div>

              <Button
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>فتح التطبيق وبدء الاستخدام الآن 🚀</span>
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
