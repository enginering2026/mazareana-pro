import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Smartphone,
  WifiOff,
  FileText,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Key,
  Download,
  ExternalLink,
  MessageCircle,
  Layers,
  ArrowLeft,
  Sparkles,
  DollarSign,
  BarChart3,
  Menu,
  X,
  LayoutGrid,
  Star,
  Zap,
  Lock,
  Play,
} from 'lucide-react';

export const APK_DOWNLOAD_URL = 'https://www.mediafire.com/file/vsl077zreym4guk/MazareanaPro.apk/file';

// ─── Hook: scroll-triggered reveal ───────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Hook: animated counter ──────────────────────────────────────────────────
function useCounter(target: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const prog = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setCount(Math.floor(ease * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ─── Animated Number Card ────────────────────────────────────────────────────
function StatCard({ value, suffix, label, color, started }: { value: number; suffix: string; label: string; color: string; started: boolean }) {
  const count = useCounter(value, 1800, started);
  return (
    <div className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-center hover:border-${color}-500/50 transition-all duration-500`}>
      <div className={`text-3xl font-black text-${color}-400`}>{count.toLocaleString()}{suffix}</div>
      <div className="text-xs text-slate-400 font-bold mt-1">{label}</div>
    </div>
  );
}

// ─── Particle Orbs background ────────────────────────────────────────────────
function GlowOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{animationDuration:'4s'}} />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-500/8 blur-[90px] animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
    </div>
  );
}

// ─── Floating phone mock ─────────────────────────────────────────────────────
function PhoneMockup({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div className={`relative select-none ${className}`}>
      <div className="relative w-[200px] sm:w-[220px] rounded-[32px] bg-slate-900 border-[3px] border-slate-700 shadow-2xl shadow-black/60 overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-full z-10" />
        <img src={src} alt="app screen" className="w-full object-cover" />
      </div>
      <div className="absolute inset-0 rounded-[32px] ring-1 ring-white/5 pointer-events-none" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface LandingPageProps {
  onOpenLogin?: () => void;
  hardwareId?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, hardwareId = 'MZ-DEMO-2026' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeScreen, setActiveScreen] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  const primaryPhone = '01015965832';
  const secondaryPhone = '01042811502';
  const BASE = import.meta.env.BASE_URL;

  const [isAppActivated] = useState(() => {
    try { return localStorage.getItem('app_activated') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotate screens
  useEffect(() => {
    const iv = setInterval(() => setActiveScreen(s => (s + 1) % screens.length), 3200);
    return () => clearInterval(iv);
  }, []);

  const openWhatsApp = (plan = 'العام') => {
    const text = encodeURIComponent(`السلام عليكم، أرغب في الاستفسار والاشتراك في برنامج مزارعنا برو (${plan}). معرّف جهازي: ${hardwareId}`);
    window.open(`https://wa.me/2${primaryPhone}?text=${text}`, '_blank');
  };

  const handleOpenApp = () => { window.location.hash = '#/app'; };

  const screens = [
    { src: `${BASE}screens/dashboard.jpg`,  label: 'لوحة التحكم الرئيسية',  color: 'blue' },
    { src: `${BASE}screens/expenses.jpg`,   label: 'تسجيل المصروفات',        color: 'rose' },
    { src: `${BASE}screens/revenues.jpg`,   label: 'إدارة الإيرادات',        color: 'emerald' },
    { src: `${BASE}screens/clients.jpg`,    label: 'كشف حساب العملاء',       color: 'purple' },
    { src: `${BASE}screens/charts.jpg`,     label: 'التقارير والرسوم البيانية', color: 'amber' },
    { src: `${BASE}screens/settings.jpg`,   label: 'الإعدادات والمزارع',      color: 'slate' },
  ];

  // Sections with reveal hooks
  const stats  = useInView(0.2);
  const feat   = useInView(0.1);
  const scrSec = useInView(0.1);
  const pricing = useInView(0.1);
  const faqSec = useInView(0.1);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060C18] text-slate-100" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Activated user banner ───────────────────────────────────────── */}
      {isAppActivated && (
        <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-3 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-50" />
          <span className="flex items-center gap-1.5 relative z-10">
            <Sparkles className="w-4 h-4 text-amber-300" />
            مرحباً! نسختك مفعلة وجاهزة
          </span>
          <button onClick={handleOpenApp} className="relative z-10 bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 py-1 rounded-xl text-xs font-black shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            الدخول إلى لوحة التحكم 🚀
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          NAVBAR
         ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-xl bg-[#060C18]/85 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4 py-3">

          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 cursor-pointer shrink-0">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-600/30">
              <div className="w-full h-full bg-[#0E1726] rounded-[13px] flex items-center justify-center">
                <img src={`${BASE}logo.png`} alt="مزارعنا برو" className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-lg font-black text-emerald-400 leading-none">M</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">مزارعنا برو</span>
                <span className="text-[9px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-full">v2026</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-none">إدارة مزارع الدواجن الذكية</p>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-400">
            {[['#features','المميزات'],['#screens','الشاشات'],['#download','التحميل'],['#pricing','الأسعار'],['#faq','الأسئلة']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors duration-200">{label}</a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-black transition no-underline">
              <Download className="w-4 h-4" /> تحميل APK
            </a>
            <button onClick={handleOpenApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition cursor-pointer">
              <LayoutGrid className="w-4 h-4 text-emerald-300" /> فتح البرنامج
            </button>
            <button onClick={() => openWhatsApp('استفسار')}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition cursor-pointer">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(o => !o)} className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/60 bg-[#0A1222] px-5 py-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {[['#features','🔥 المميزات'],['#screens','📱 شاشات البرنامج'],['#download','⬇️ تحميل APK'],['#pricing','💰 الأسعار والباقات'],['#faq','❓ الأسئلة الشائعة']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200 py-1">{label}</a>
            ))}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}
                 className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 no-underline">
                <Download className="w-4 h-4" /> تحميل تطبيق أندرويد (APK)
              </a>
              <button onClick={() => { setMobileMenuOpen(false); handleOpenApp(); }}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer">
                <LayoutGrid className="w-4 h-4" /> فتح البرنامج
              </button>
              <button onClick={() => { setMobileMenuOpen(false); openWhatsApp('استفسار'); }}
                className="w-full py-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer">
                <MessageCircle className="w-4 h-4" /> واتساب
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <GlowOrbs />

        {/* Animated grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">

          {/* Left: Text */}
          <div className={`text-right transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-bold mb-6 shadow-inner">
              <Sparkles className="w-4 h-4" />
              <span>النظام المحاسبي الأول لمزارع الدواجن في مصر</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              وداعاً للدفاتر<br />
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-teal-300 to-blue-400">
                  الورقية!
                </span>
                <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-gradient-to-l from-emerald-400 to-blue-400 rounded-full" />
              </span>
              <br />
              <span className="text-3xl sm:text-4xl text-slate-300 font-bold">أدِر مزرعتك بذكاء</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg">
              احسب <strong className="text-white">تكلفة الكيلو</strong>، <strong className="text-white">معامل FCR</strong>، <strong className="text-white">نسبة النافق</strong>، والأرباح الصافية بضغطة زر.
              يعمل <span className="text-emerald-400 font-black">100% بدون إنترنت</span> على الموبايل والكمبيوتر.
            </p>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-2.5 mt-6">
              {[
                { icon: WifiOff, label: 'يعمل أوفلاين', color: 'emerald' },
                { icon: Smartphone, label: 'أندرويد + كمبيوتر', color: 'blue' },
                { icon: FileText, label: 'فواتير PDF', color: 'purple' },
                { icon: ShieldCheck, label: 'بيانات آمنة', color: 'amber' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-${color}-500/10 border border-${color}-500/20 text-${color}-300 text-xs font-bold`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={handleOpenApp}
                className="group flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer">
                <LayoutGrid className="w-5 h-5 text-emerald-300 group-hover:rotate-12 transition-transform" />
                <span>فتح البرنامج الآن</span>
                <ArrowLeft className="w-4 h-4 opacity-70" />
              </button>

              <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer no-underline">
                <Download className="w-5 h-5" />
                <span>تحميل APK أندرويد</span>
              </a>
            </div>

            <button onClick={() => openWhatsApp('استفسار من Hero')}
              className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer group">
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>اشتراك أو استفسار عبر واتساب</span>
            </button>
          </div>

          {/* Right: Floating phone stack */}
          <div className={`relative flex items-center justify-center transition-all duration-1200 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            {/* Glow behind phones */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-blue-500/15 rounded-full blur-[80px]" />
            </div>

            {/* Back phone */}
            <div className="absolute right-0 top-4 opacity-70 scale-90 rotate-6 blur-[1px]">
              <PhoneMockup src={screens[(activeScreen + 2) % screens.length].src} />
            </div>

            {/* Front phone with auto-rotate */}
            <div className="relative z-10 drop-shadow-2xl transition-all duration-700" style={{ filter: 'drop-shadow(0 25px 50px rgba(59,130,246,0.25))' }}>
              <PhoneMockup src={screens[activeScreen].src} className="" />

              {/* Screen label badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur border border-slate-700/80 text-slate-200 text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg">
                📱 {screens[activeScreen].label}
              </div>
            </div>

            {/* Screen dots */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
              {screens.map((_, i) => (
                <button key={i} onClick={() => setActiveScreen(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${i === activeScreen ? 'bg-blue-400 scale-125' : 'bg-slate-700 hover:bg-slate-500'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 text-xs font-bold animate-bounce">
          <span>اكتشف المزيد</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS COUNTER SECTION
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 border-y border-slate-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-900/8 to-transparent" />
        <div ref={stats.ref} className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 ${stats.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { value: 500, suffix: '+', label: 'مربي وتاجر نشط', color: 'blue' },
              { value: 20000, suffix: '+', label: 'دورة تسمين مسجلة', color: 'emerald' },
              { value: 100, suffix: '%', label: 'يعمل بدون إنترنت', color: 'purple' },
              { value: 30, suffix: ' ج.م', label: 'سعر الاشتراك الشهري', color: 'amber' },
            ].map(item => (
              <StatCard key={item.label} {...item} started={stats.inView} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROBLEM vs SOLUTION
         ══════════════════════════════════════════════════════════════════ */}
      <section id="solutions" className="py-24 relative overflow-hidden">
        <GlowOrbs />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">الحل الجذري</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
              ليه كل المربين بيسيبوا الدفاتر؟
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Old way */}
            <div className="bg-rose-950/20 border-2 border-rose-900/40 rounded-3xl p-7 relative overflow-hidden group hover:border-rose-700/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-xs font-black mb-5">
                ❌ الطرق التقليدية
              </div>
              <h3 className="text-lg font-black text-rose-200 mb-5">معاناة يومية بدون حساب:</h3>
              <ul className="space-y-4">
                {['ضياع فواتير العلف والأدوية آخر الدورة.','تبيع بالخسارة وأنت مش عارف لأنك مش حاسب تكلفة الكيلو بدقة.','لخبطة ديون التجار وضياع فلوسك في السوق.','تلف الدفاتر في العنبر يمسح كل تاريخك المالي.'].map(text => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-rose-400 text-lg leading-5 shrink-0">✕</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* New way */}
            <div className="bg-emerald-950/25 border-2 border-emerald-500/50 rounded-3xl p-7 relative overflow-hidden group hover:border-emerald-400/70 transition-all duration-500 shadow-2xl shadow-emerald-950/40">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-3.5 left-6 bg-emerald-500 text-slate-950 px-3.5 py-1 rounded-full text-[11px] font-black shadow-lg">
                ✨ الحل الأذكى والأسهل
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-5 mt-3">
                ✅ مع مزارعنا برو
              </div>
              <h3 className="text-lg font-black text-emerald-200 mb-5">تحكم كامل بضغطة واحدة:</h3>
              <ul className="space-y-4">
                {['تسجيل المصروفات يومياً وحساب الأرباح الصافية بدقة.','حساب FCR وتكلفة الكيلو لحظياً لضبط خطة التغذية.','كشوف حسابات دقيقة لكل تاجر ومشاركتها عبر واتساب.','يعمل بدون نت ونسخ احتياطي فوري يحمي بياناتك للأبد.'].map(text => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES GRID
         ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-[#070D1A] border-t border-slate-800/50">
        <div ref={feat.ref} className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-blue-400 tracking-widest uppercase">المميزات الأساسية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">كل ما تحتاجه في مكان واحد</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Layers,       label: 'إدارة دورات التسمين',         desc: 'متابعة يومية للأعمار والعلف والتحصينات والتكاليف لكل دورة.',                    color: 'blue',    delay: 0 },
              { icon: BarChart3,    label: 'FCR والنافق تلقائياً',         desc: 'حساب فوري لمعامل التحويل الغذائي وتكلفة الكيلو ومتوسط الوزن.',                 color: 'emerald', delay: 100 },
              { icon: Users,        label: 'كشوف العملاء والموردين',       desc: 'سجل متكامل لكل تاجر: مسحوبات وتوريدات ومدفوعات والمتبقي.',                     color: 'purple',  delay: 200 },
              { icon: FileText,     label: 'فواتير PDF واتساب',            desc: 'إصدار فواتير بيع مع نسبة التصفية وإرسالها للتاجر مباشرة.',                     color: 'amber',   delay: 300 },
              { icon: WifiOff,      label: 'يعمل 100% بدون نت',           desc: 'مصمم للعنابر ذات الشبكة الضعيفة، يعمل بكفاءة كاملة أوفلاين.',                  color: 'teal',    delay: 400 },
              { icon: ShieldCheck,  label: 'نسخ احتياطي غير محدود',       desc: 'تصدير واستيراد البيانات بنقرة ونقلها لأي جهاز في ثوانٍ.',                      color: 'indigo',  delay: 500 },
            ].map(({ icon: Icon, label, desc, color, delay }) => (
              <div key={label}
                className={`bg-slate-900/60 border border-slate-800 hover:border-${color}-500/50 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-1.5 group cursor-default
                  ${feat.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${delay}ms` }}>
                <div className={`w-13 h-13 w-14 h-14 rounded-2xl bg-${color}-600/15 text-${color}-400 border border-${color}-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white mb-2">{label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SCREENS SHOWCASE (Real screenshots)
         ══════════════════════════════════════════════════════════════════ */}
      <section id="screens" className="py-24 relative overflow-hidden">
        <GlowOrbs />
        <div ref={scrSec.ref} className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">معاينة حقيقية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">شاشات البرنامج الفعلية</h2>
            <p className="text-sm text-slate-400 mt-2">صور حقيقية من داخل مزارعنا برو – لا تصميمات وهمية</p>
          </div>

          {/* Large active screen */}
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Phone preview */}
            <div className={`flex-1 flex items-center justify-center transition-all duration-700 ${scrSec.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 bg-blue-500/20 rounded-full blur-[70px]" />
                </div>
                {/* Phone frame */}
                <div className="relative w-[260px] rounded-[40px] bg-slate-900 border-[4px] border-slate-700 shadow-2xl shadow-black/70 overflow-hidden"
                  style={{ filter: 'drop-shadow(0 30px 60px rgba(59,130,246,0.2))' }}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-full z-10" />
                  <img key={activeScreen} src={screens[activeScreen].src} alt={screens[activeScreen].label} className="w-full object-cover transition-all duration-500" />
                </div>
                {/* Badge */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/30">
                  {screens[activeScreen].label}
                </div>
              </div>
            </div>

            {/* Thumbnails grid */}
            <div className={`flex-1 grid grid-cols-3 gap-3 transition-all duration-700 delay-200 ${scrSec.inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {screens.map((screen, i) => (
                <button key={i} onClick={() => setActiveScreen(i)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group
                    ${i === activeScreen ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30' : 'border-slate-700/60 hover:border-slate-500 opacity-70 hover:opacity-100'}`}>
                  <div className="relative w-full" style={{ paddingTop: '177%' }}>
                    <img src={screen.src} alt={screen.label} className="absolute inset-0 w-full h-full object-cover object-top" />
                    {i === activeScreen && (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[9px] font-black text-white text-center leading-tight">{screen.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          DOWNLOAD SECTION
         ══════════════════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 bg-gradient-to-b from-[#060C18] via-[#0A1527] to-[#060C18] border-t border-blue-900/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-emerald-500/8 blur-[140px] rounded-full pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border-2 border-emerald-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black mb-6">
              <Smartphone className="w-4 h-4" />
              متاح الآن – تحميل مباشر
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              حمّل <span className="text-emerald-400">مزارعنا برو APK</span> مجاناً
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              ملف APK خفيف وآمن لجميع هواتف الأندرويد. لا حاجة للبلاي ستور.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"
                className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer no-underline">
                <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
                تحميل MazareanaPro.apk
              </a>
              <button onClick={handleOpenApp}
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 font-black text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer">
                <ExternalLink className="w-5 h-5 text-blue-400" />
                تشغيل في المتصفح
              </button>
            </div>

            {/* Install steps */}
            <div className="mt-10 pt-8 border-t border-slate-700/60">
              <p className="text-xs font-black text-slate-400 mb-5">خطوات التثبيت في دقيقة واحدة:</p>
              <div className="grid sm:grid-cols-3 gap-4 text-right">
                {[
                  { n: '١', title: 'اضغط تحميل', desc: 'سيتم تنزيل ملف APK الصغير من MediaFire خلال ثوانٍ.' },
                  { n: '٢', title: 'السماح بالتثبيت', desc: 'افتح الملف من التنزيلات واختر "السماح" للتثبيت.' },
                  { n: '٣', title: 'ابدأ الإدارة', desc: 'افتح التطبيق وابدأ حسابات دورتك الجديدة فوراً!' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 font-black flex items-center justify-center shrink-0 text-sm border border-blue-500/20">{n}</div>
                    <div>
                      <h5 className="text-xs font-black text-white mb-1">{title}</h5>
                      <p className="text-[11px] text-slate-400 leading-normal">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING
         ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-[#070D1A] border-t border-slate-800/50 relative overflow-hidden">
        <GlowOrbs />
        <div ref={pricing.ref} className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">أسعار رمزية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">اختر الباقة المناسبة</h2>
            <p className="text-sm text-slate-400 mt-2">الدفع عبر فودافون كاش · إنستاباي · أي محفظة إلكترونية</p>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 items-stretch transition-all duration-700 ${pricing.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            {/* Monthly */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col hover:border-slate-600 transition-all duration-300 hover:-translate-y-1">
              <div className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full mb-4">مرونة كاملة</div>
              <h3 className="text-xl font-black text-white">الباقة الشهرية</h3>
              <div className="mt-4 mb-6 flex items-end gap-2">
                <span className="text-5xl font-black text-white">٣٠</span>
                <span className="text-sm text-slate-400 font-bold mb-1">جنيه / شهر</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 font-semibold mb-8 flex-1">
                {['جميع المميزات مفتوحة','يعمل أوفلاين','دعم فني واتساب','تتجدد يدوياً كل ٣٠ يوم'].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => openWhatsApp('الباقة الشهرية')}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm transition cursor-pointer">
                اشترك في الشهرية (٣٠ ج.م)
              </button>
            </div>

            {/* Yearly – most popular */}
            <div className="relative bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-500 rounded-3xl p-7 flex flex-col shadow-2xl shadow-blue-950/60 hover:-translate-y-2 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-lg whitespace-nowrap">
                👑 الأكثر طلباً • وفّر ١١٠ ج.م
              </div>
              <div className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4 mt-2">سنة كاملة • راحة بال</div>
              <h3 className="text-2xl font-black text-white">الباقة السنوية</h3>
              <div className="mt-4 mb-6 flex items-end gap-2">
                <span className="text-5xl font-black text-white">٢٥٠</span>
                <span className="text-sm text-slate-300 font-bold mb-1">جنيه / سنة</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-200 font-semibold mb-8 flex-1">
                {['٣٦٥ يوم تفعيل مستمر','توفير ٣٠% عن الشهرية','تحديثات مجانية','دعم فني أولوية'].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => openWhatsApp('الباقة السنوية')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer">
                اشترك في السنوية (٢٥٠ ج.م)
              </button>
            </div>

            {/* Lifetime */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex items-center gap-1.5 bg-purple-500/15 text-purple-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                <Zap className="w-3 h-3" /> دفعة واحدة للأبد
              </div>
              <h3 className="text-xl font-black text-white">مدى الحياة</h3>
              <div className="mt-4 mb-1 flex items-end gap-2">
                <span className="text-4xl font-black text-white">١,٣٥٠</span>
                <span className="text-sm text-slate-400 font-bold mb-1">جنيه</span>
              </div>
              <div className="text-xs text-slate-500 line-through mb-5">الأصلي: ٤,٥٠٠ ج.م • خصم ٧٠٪</div>
              <ul className="space-y-3 text-sm text-slate-300 font-semibold mb-8 flex-1">
                {['امتلاك دائم للبرنامج','بدون أي اشتراك مستقبلي','أولوية الدعم الفني','تحديثات مدى الحياة'].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => openWhatsApp('باقة مدى الحياة')}
                className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-sm transition cursor-pointer">
                امتلكه مدى الحياة (١,٣٥٠ ج.م)
              </button>
            </div>

          </div>

          {/* Payment methods */}
          <div className="mt-10 text-center text-xs font-bold text-slate-400 flex flex-wrap items-center justify-center gap-4">
            <span>طرق الدفع:</span>
            {['📱 فودافون كاش: 01015965832','💳 إنستاباي','🏦 أي محفظة إلكترونية'].map(m => (
              <span key={m} className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 border-t border-slate-800/50 relative overflow-hidden">
        <GlowOrbs />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-blue-400 tracking-widest uppercase">ثقة المربين</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">تجارب حقيقية من أرض الواقع</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { stars: 5, text: '"البرنامج ده ريحني من كابوس الدفاتر. بضغطة زر عارف كسبت كام بالمليم."', name: 'الحاج فريد عبد العزيز', role: 'صاحب مزرعة تسمين • بلبيس، الشرقية' },
              { stars: 5, text: '"أهم ميزة إنه شغال معايا في المزرعة أوفلاين. بسجل العلف وأطبع فاتورة التاجر وتمام."', name: 'م/ محمد الشناوي', role: 'مربي دواجن • كفر الدوار، البحيرة' },
              { stars: 5, text: '"أنا تاجر وكشوف حسابات العملاء خلتني مسيطر على الديون. كل تاجر ليه حسابه واضح في واتساب."', name: 'م/ إبراهيم القاضي', role: 'تاجر وموزع دواجن • بنها، القليوبية' },
            ].map(({ stars, text, name, role }) => (
              <div key={name} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 text-right transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-300 font-semibold leading-relaxed mb-4 group-hover:text-slate-200 transition-colors">{text}</p>
                <div className="border-t border-slate-800/60 pt-3">
                  <h5 className="text-sm font-black text-white">{name}</h5>
                  <span className="text-[11px] text-slate-500 font-bold">{role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FAQ
         ══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 bg-[#070D1A] border-t border-slate-800/50">
        <div ref={faqSec.ref} className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-emerald-400 tracking-widest uppercase">لديك سؤال؟</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">الأسئلة الشائعة</h2>
          </div>

          <div className={`space-y-3 transition-all duration-700 ${faqSec.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { q: 'هل يعمل البرنامج بدون إنترنت؟', a: 'نعم، 100%! مزارعنا برو يعمل بشكل كامل دون الحاجة لأي اتصال بالإنترنت. صُمّم خصيصاً للعنابر والمزارع التي تكون فيها الشبكة ضعيفة أو منعدمة.' },
              { q: 'هل يمكن تشغيله على أكثر من جهاز؟', a: 'نعم، متاح كـ APK للأندرويد وكتطبيق ويب متقدم (PWA) يعمل على الآيفون والكمبيوتر والتابلت بكفاءة كاملة.' },
              { q: 'كيف أستلم كود التفعيل بعد الدفع؟', a: 'بمجرد تحويل قيمة الباقة عبر فودافون كاش أو إنستاباي، ترسل لنا رمز جهازك (Hardware ID) عبر واتساب ونرسل لك كود التفعيل في دقيقة واحدة.' },
              { q: 'ماذا يحدث لبياناتي إذا غيرت هاتفي؟', a: 'بياناتك بأمان تام! تأخذ نسخة احتياطية بضغطة زر وتستعيدها على الجهاز الجديد في ثوانٍ.' },
              { q: 'هل البرنامج مناسب لمزارع البط والمواشي؟', a: 'بالطبع! نظام المصروفات والإيرادات والفواتير والديون يعمل بكفاءة مع مزارع البط والأرانب وتجارة المواشي.' },
            ].map(({ q, a }, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-200">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-right font-black text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition">
                  <span>{q}</span>
                  {openFaq === idx
                    ? <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-300 font-medium leading-relaxed border-t border-slate-800/60 pt-4 bg-slate-950/40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM CTA
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-emerald-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDMiLz48L3N2Zz4=')] opacity-100" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-6">
            <Sparkles className="w-4 h-4 text-amber-300" />
            جاهز لضبط مزرعتك ومضاعفة أرباحك؟
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4">
            انضم لمئات المربين والتجار<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-blue-400">الذين وثقوا في مزارعنا برو</span>
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto mb-10 font-medium">
            ابدأ بالتحميل أو التواصل معنا الآن. اشتراك بـ ٣٠ ج.م فقط ولا مخاطرة!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => openWhatsApp('اشتراك من Bottom CTA')}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer">
              <MessageCircle className="w-5 h-5" />
              اشترك عبر واتساب الآن
            </button>
            <a href={APK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-base flex items-center justify-center gap-2 transition cursor-pointer no-underline">
              <Download className="w-5 h-5" />
              تحميل APK مجاناً
            </a>
            <button onClick={handleOpenApp}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-blue-600/50 hover:bg-blue-600 border border-blue-500/40 text-white font-extrabold text-base flex items-center justify-center gap-2 transition cursor-pointer">
              <LayoutGrid className="w-5 h-5" />
              تجربة البرنامج الآن
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#040810] border-t border-slate-900 py-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
              <span className="text-sm font-black text-white">مزارعنا برو – Mazareana Pro</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">2026</span>
            </div>
            <p className="text-slate-500 font-medium">نظام الإدارة الشامل لمزارع الدواجن والإنتاج الحيواني في مصر والوطن العربي.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 font-bold text-slate-300">
            <button onClick={() => openWhatsApp('التواصل')} className="hover:text-emerald-400 transition cursor-pointer flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              {primaryPhone}
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => openWhatsApp('الدعم')} className="hover:text-emerald-400 transition cursor-pointer">
              📞 {secondaryPhone}
            </button>
          </div>
        </div>
        <div className="text-center text-slate-700 text-[11px] font-bold mt-6">
          جميع الحقوق محفوظة © ٢٠٢٦ مزارعنا برو • صُمّم لخدمة مربي الدواجن
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          FLOATING WHATSAPP BUTTON
         ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-5 left-5 z-40">
        <button onClick={() => openWhatsApp('الزر العائم')}
          className="relative group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl shadow-emerald-600/50 font-black text-xs cursor-pointer transition-all active:scale-95 hover:-translate-y-0.5">
          <MessageCircle className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline">اشترك عبر واتساب</span>
          {/* Ping animation */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#060C18]">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          </span>
        </button>
      </div>

    </div>
  );
};

export default LandingPage;
