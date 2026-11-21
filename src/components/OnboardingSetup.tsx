import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sprout, Building2, MapPin, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  ownerName: string;
  phone: string;
  farmName: string;
  farmType: string;
  farmLocation: string;
  capacity: string;
}

interface OnboardingSetupProps {
  onComplete: (data: OnboardingData) => void;
}

// ── Farm types ─────────────────────────────────────────────────────────────────
const FARM_TYPES = [
  { id: 'دواجن', label: 'دواجن', icon: '🐔', desc: 'عنابر التسمين والبياض' },
  { id: 'مواشي', label: 'مواشي', icon: '🐄', desc: 'أبقار وأغنام وماعز' },
  { id: 'أسماك', label: 'أسماك', icon: '🐟', desc: 'مزارع استزراع سمكي' },
  { id: 'محاصيل', label: 'محاصيل', icon: '🌾', desc: 'زراعة حقلية وبستانية' },
  { id: 'تجارة', label: 'تجارة', icon: '🏪', desc: 'نشاط تجاري عام' },
  { id: 'أخرى', label: 'أخرى', icon: '📦', desc: 'نشاط مختلف' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const generateId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Main Component ─────────────────────────────────────────────────────────────
export const OnboardingSetup: React.FC<OnboardingSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: welcome, 1: owner info, 2: farm info, 3: done
  const [data, setData] = useState<OnboardingData>({
    ownerName: '',
    phone: '',
    farmName: '',
    farmType: 'دواجن',
    farmLocation: '',
    capacity: '',
  });
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');

  const totalSteps = 3; // excluding welcome & done

  const goNext = () => {
    setAnimDir('forward');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setAnimDir('back');
    setStep(s => Math.max(0, s - 1));
  };

  const handleComplete = () => {
    // Build the farm object and save to localStorage
    const farm = {
      id: generateId('farm'),
      name: data.farmName || `${data.ownerName || 'مزرعة'} الرئيسية`,
      type: data.farmType,
      location: data.farmLocation,
      description: '',
      capacity: data.capacity,
      cycleStartDate: new Date().toISOString().split('T')[0],
      flockAge: '1 يوم',
      mortalityRate: '0%',
      currentCycle: `الدورة الأولى • ${new Date().getFullYear()}`,
      status: 'نشطة',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Save to localStorage — AppContext will pick this up
    try {
      localStorage.setItem('local_farms', JSON.stringify([farm]));
      localStorage.setItem('local_current_farm_id', farm.id);
      localStorage.setItem('local_revenues', JSON.stringify([]));
      localStorage.setItem('local_expenses', JSON.stringify([]));
      localStorage.setItem('local_clients', JSON.stringify([]));
      localStorage.setItem('local_invoices', JSON.stringify([]));
      localStorage.setItem('local_partners', JSON.stringify([]));
      localStorage.setItem('local_payments', JSON.stringify([]));
      localStorage.setItem('local_expense_payments', JSON.stringify([]));
      // Owner info
      if (data.ownerName) localStorage.setItem('app_owner_name', data.ownerName);
      if (data.phone) localStorage.setItem('app_owner_phone', data.phone);
      // Mark onboarding complete
      localStorage.setItem('app_onboarding_done', '1');
    } catch (e) {
      console.warn('Onboarding save error:', e);
    }

    onComplete(data);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return data.ownerName.trim().length >= 2;
    if (step === 2) return Boolean(data.farmType);
    if (step === 3) return data.farmName.trim().length >= 2;
    return true;
  };

  // ── Progress dots ────────────────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex justify-center gap-2 mt-4">
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === step
              ? 'w-6 h-2 bg-white'
              : s < step
              ? 'w-2 h-2 bg-white/60'
              : 'w-2 h-2 bg-white/30'
          }`}
        />
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 0: Welcome Screen
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <div
        dir="rtl"
        className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d1f5c 0%, #1b4298 50%, #1a6b3c 100%)',
          fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        }}
      >
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[220px] h-[220px] rounded-full opacity-10 bg-white" />

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center z-10">
          {/* Logo */}
          <div
            className="w-28 h-28 rounded-[32px] flex items-center justify-center mb-6 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Sprout className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            مزارعنا برو
          </h1>
          <p className="text-sm text-white/70 mb-1">Mazareana Pro</p>
          <p className="text-white/60 text-sm mt-4 leading-relaxed max-w-xs">
            نظام متكامل لإدارة مزارعك وأعمالك بذكاء وسهولة
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['📊 تقارير فورية', '💰 إيرادات ومصروفات', '👥 إدارة العملاء', '🗂️ فواتير احترافية'].map(f => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full text-white/80"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom card */}
        <div
          className="w-full px-6 pb-10 pt-8 z-10"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
          }}
        >
          <button
            onClick={goNext}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            ابدأ الإعداد
          </button>
          <p className="text-center text-white/40 text-xs mt-4">
            سيستغرق الإعداد أقل من دقيقة
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 4 (index 4): Done Screen
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 4) {
    return (
      <div
        dir="rtl"
        className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d1f5c 0%, #1b4298 50%, #064e3b 100%)',
          fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Success icon with ripple */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-green-400/20 scale-150 animate-ping" />
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">تم الإعداد بنجاح! 🎉</h2>
          <p className="text-white/70 text-sm leading-relaxed mb-2">
            أهلاً بك يا <span className="text-green-300 font-bold">{data.ownerName || 'صاحب المشروع'}</span>
          </p>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            تم إعداد <span className="text-white font-semibold">{data.farmName}</span> وأنت جاهز لتسجيل أول عملية الآن
          </p>

          {/* Summary card */}
          <div
            className="mt-8 w-full max-w-xs rounded-2xl p-5 text-right"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
          >
            <div className="text-white/50 text-xs mb-3 text-center">ملخص الإعداد</div>
            {[
              { label: 'المالك', value: data.ownerName },
              { label: 'النشاط', value: `${data.farmName} - ${data.farmType}` },
              { label: 'الموقع', value: data.farmLocation || 'غير محدد' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                <span className="text-white/50 text-xs">{r.label}</span>
                <span className="text-white text-sm font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full px-6 pb-10 z-10">
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            انطلق إلى البرنامج ←
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STEPS 1–3: Data entry screens
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0d1f5c 0%, #1b4298 60%, #1a2a6c 100%)',
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div className="relative px-5 pt-10 pb-6 flex-shrink-0">
        {step > 1 && (
          <button
            onClick={goBack}
            className="absolute top-10 left-5 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="text-center">
          <div className="text-white/50 text-xs mb-1">
            خطوة {step} من {totalSteps}
          </div>
          <StepDots />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-8">

          {/* ────────────────────── STEP 1: Owner Info ─────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div
                  className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                >
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">بياناتك الشخصية</h2>
                <p className="text-white/60 text-sm">عرّف بنفسك حتى يعرفك البرنامج</p>
              </div>

              <div className="space-y-4">
                {/* Owner Name */}
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-2">
                    اسمك الكامل <span className="text-red-400">*</span>
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  >
                    <User className="w-5 h-5 text-white/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={data.ownerName}
                      onChange={e => setData(d => ({ ...d, ownerName: e.target.value }))}
                      placeholder="مثال: أحمد محمد علي"
                      className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                      style={{ caretColor: '#22c55e' }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-2">
                    رقم الهاتف
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  >
                    <Phone className="w-5 h-5 text-white/50 flex-shrink-0" />
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
                      placeholder="01xxxxxxxxx"
                      className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                      style={{ caretColor: '#22c55e', direction: 'ltr' }}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* Tip card */}
              <div
                className="mt-6 rounded-2xl p-4 flex gap-3 items-start"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <span className="text-2xl">💡</span>
                <p className="text-green-200/80 text-xs leading-relaxed">
                  اسمك سيظهر في التقارير والفواتير الصادرة من البرنامج.
                </p>
              </div>
            </div>
          )}

          {/* ────────────────────── STEP 2: Farm Type ───────────────────────── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div
                  className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <Sprout className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">نوع النشاط</h2>
                <p className="text-white/60 text-sm">اختر نوع نشاطك الأساسي</p>
              </div>

              {/* Farm type grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {FARM_TYPES.map(ft => (
                  <button
                    key={ft.id}
                    onClick={() => setData(d => ({ ...d, farmType: ft.id }))}
                    className="relative rounded-2xl p-4 text-right transition-all active:scale-95"
                    style={{
                      background: data.farmType === ft.id
                        ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                        : 'rgba(255,255,255,0.08)',
                      border: data.farmType === ft.id
                        ? '2px solid rgba(99,179,237,0.6)'
                        : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {data.farmType === ft.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-blue-300 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-blue-800" />
                      </div>
                    )}
                    <div className="text-2xl mb-2">{ft.icon}</div>
                    <div className="text-white font-bold text-sm">{ft.label}</div>
                    <div className="text-white/50 text-xs mt-0.5">{ft.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ────────────────────── STEP 3: Farm Details ────────────────────── */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div
                  className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">تفاصيل النشاط</h2>
                <p className="text-white/60 text-sm">أدخل بيانات نشاطك الأساسية</p>
              </div>

              <div className="space-y-4">
                {/* Farm Name */}
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-2">
                    اسم النشاط / المزرعة <span className="text-red-400">*</span>
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  >
                    <Building2 className="w-5 h-5 text-white/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={data.farmName}
                      onChange={e => setData(d => ({ ...d, farmName: e.target.value }))}
                      placeholder={`مثال: مزرعة ${data.ownerName || 'الرزق'}`}
                      className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                      style={{ caretColor: '#22c55e' }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-2">
                    الموقع / المنطقة
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  >
                    <MapPin className="w-5 h-5 text-white/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={data.farmLocation}
                      onChange={e => setData(d => ({ ...d, farmLocation: e.target.value }))}
                      placeholder="مثال: المنصورة - الدقهلية"
                      className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                      style={{ caretColor: '#22c55e' }}
                    />
                  </div>
                </div>

                {/* Capacity (optional) */}
                <div>
                  <label className="text-white/70 text-sm font-medium block mb-2">
                    الطاقة الإنتاجية
                    <span className="text-white/30 text-xs mr-2">(اختياري)</span>
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}
                  >
                    <span className="text-white/50 text-lg flex-shrink-0">📦</span>
                    <input
                      type="text"
                      value={data.capacity}
                      onChange={e => setData(d => ({ ...d, capacity: e.target.value }))}
                      placeholder={
                        data.farmType === 'دواجن' ? 'مثال: 10,000 طائر' :
                        data.farmType === 'مواشي' ? 'مثال: 50 رأس' :
                        data.farmType === 'أسماك' ? 'مثال: 5 أحواض' :
                        'مثال: 5 فدان'
                      }
                      className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                      style={{ caretColor: '#22c55e' }}
                    />
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div
                className="mt-6 rounded-2xl p-4 flex gap-3 items-start"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <span className="text-2xl">ℹ️</span>
                <p className="text-yellow-200/80 text-xs leading-relaxed">
                  يمكنك إضافة مزارع ومشاريع أخرى لاحقاً من صفحة الإعدادات بعد الدخول.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom action button ── */}
      <div
        className="flex-shrink-0 px-5 pb-10 pt-4"
        style={{ background: 'linear-gradient(to top, rgba(13,31,92,0.95) 70%, transparent)' }}
      >
        <button
          onClick={() => {
            if (step === 3) {
              goNext(); // go to done screen (step 4)
            } else {
              goNext();
            }
          }}
          disabled={!canProceed()}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all active:scale-95 disabled:opacity-40 disabled:scale-100"
          style={{
            background: canProceed()
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'rgba(255,255,255,0.15)',
          }}
        >
          {step === 3 ? 'إنهاء الإعداد ✓' : 'التالي →'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingSetup;
