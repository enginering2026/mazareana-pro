import React, { useState } from 'react';
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
  Share2,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  DollarSign,
  BarChart3,
  Calendar,
  PhoneCall,
  Menu,
  X,
  LayoutGrid
} from 'lucide-react';

export const APK_DOWNLOAD_URL = 'https://www.mediafire.com/file/vsl077zreym4guk/MazareanaPro.apk/file';

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenPlans?: () => void;
  hardwareId?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenPlans,
  hardwareId = 'MZ-DEMO-2026'
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cycles' | 'invoices' | 'reports'>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [isAppActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_activated') === 'true';
    } catch {
      return false;
    }
  });

  const primaryPhone = '01015965832';
  const secondaryPhone = '01042811502';

  const openWhatsApp = (planName = 'العام') => {
    const text = encodeURIComponent(
      `السلام عليكم، أرغب في الاستفسار والاشتراك في برنامج مزارعنا برو (${planName}). معرّف جهازي هو: ${hardwareId}`
    );
    window.open(`https://wa.me/2${primaryPhone}?text=${text}`, '_blank');
  };

  const handleOpenApp = () => {
    window.location.hash = '#/app';
  };

  const handleDownloadApk = () => {
    window.open(APK_DOWNLOAD_URL, '_blank');
  };

  const handleDemoStart = () => {
    handleOpenApp();
  };

  return (
    <div className="min-h-screen bg-[#0A101D] text-slate-100 selection:bg-emerald-500 selection:text-white" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      
      {/* شريط ترحيب بالعملاء أصحاب النسخ المفعلة */}
      {isAppActivated && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-700 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-4 shadow-lg border-b border-emerald-500/30">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>مرحباً بك! نسختك من مزارعنا برو مفعلة وجاهزة للعمل</span>
          </span>
          <button
            onClick={handleOpenApp}
            className="bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 py-1 rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>الدخول إلى لوحة التحكم 🚀</span>
          </button>
        </div>
      )}

      {/* =========================================================
          1. الشريط العلوي الثابت (Navigation Bar)
         ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#0A101D]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* الشعار واسم البرنامج */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-600/30">
              <div className="w-full h-full bg-[#0E1726] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="مزارعنا برو" className="w-9 h-9 object-contain" onError={(e)=>{ (e.target as any).style.display = 'none'; }} />
                <span className="text-xl font-black text-emerald-400">M</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">مزارعنا برو</span>
                <span className="text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">v2026</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold">إدارة المزارع وحسابات الدواجن الذكية</p>
            </div>
          </div>

          {/* روابط القائمة للشاشات الكبيرة */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition">المميزات</a>
            <a href="#solutions" className="hover:text-emerald-400 transition">لماذا مزارعنا؟</a>
            <a href="#screens" className="hover:text-emerald-400 transition">شاشات البرنامج</a>
            <a href="#download" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
              <Smartphone className="w-4 h-4" />
              <span>تحميل APK</span>
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition">الأسعار والباقات</a>
            <a href="#faq" className="hover:text-emerald-400 transition">الأسئلة الشائعة</a>
          </nav>

          {/* أزرار الإجراء السريعة */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* زر تحميل APK */}
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-black transition cursor-pointer no-underline"
              title="تحميل تطبيق أندرويد APK برابط مباشر من ميديا فاير"
            >
              <Download className="w-4 h-4" />
              <span>تحميل APK</span>
            </a>

            {/* زر دخول البرنامج */}
            <button
              onClick={handleOpenApp}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-emerald-300" />
              <span>دخول البرنامج</span>
            </button>

            {/* زر واتساب */}
            <button
              onClick={() => openWhatsApp('استفسار مباشر')}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* زر القائمة للشاشات الصغيرة */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* القائمة المنسدلة للموبايل */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0F172A] border-b border-slate-800 px-6 py-5 space-y-4 text-right animate-in fade-in duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200">المميزات</a>
            <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200">لماذا مزارعنا برو؟</a>
            <a href="#screens" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200">معاينة الشاشات</a>
            <a href="#download" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-emerald-400">📱 تحميل تطبيق أندرويد (APK)</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200">الأسعار والباقات</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-slate-200">الأسئلة الشائعة</a>
            
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 no-underline"
              >
                <Download className="w-4 h-4" />
                <span>تحميل تطبيق أندرويد (APK)</span>
              </a>

              <button
                onClick={() => { setMobileMenuOpen(false); handleOpenApp(); }}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>فتح البرنامج / لوحة التحكم</span>
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); openWhatsApp('استفسار مباشر'); }}
                className="w-full py-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل معنا عبر واتساب</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          2. الواجهة الرئيسية (Hero Section)
         ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* تأثيرات الإضاءة في الخلفية */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-blue-600/20 to-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-700/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* شارة التميز العلوية */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs sm:text-sm font-bold mb-8 shadow-inner animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>النظام المحاسبي والإداري الأول لمزارع وتجارة الدواجن</span>
          </div>

          {/* العنوان الرئيسي الكبير */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-tight lg:leading-tight max-w-4xl mx-auto tracking-tight">
            وداعاً للدفاتر الورقية وخسائر الدورات!
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              أدِر مزرعتك وحساباتك بدقة من موبايلك
            </span>
          </h1>

          {/* الوصف التعريفي */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            احسب تكلفة العلف والأدوية والكتكوت، معامل التحويل الغذائي (FCR)، نسبة النافق، تكلفة الكيلو والربح الصافي في لحظة. يعمل بالكامل <span className="text-emerald-400 font-extrabold underline decoration-emerald-500/50">بدون إنترنت</span> على الموبايل والكمبيوتر.
          </p>

          {/* أزرار الإجراء الرئيسية */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-2xl mx-auto">
            {/* زر دخول البرنامج المباشر */}
            <button
              onClick={handleOpenApp}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-95 transition cursor-pointer"
            >
              <LayoutGrid className="w-5 h-5 text-emerald-300" />
              <span>دخول البرنامج / لوحة التحكم</span>
            </button>

            {/* زر تحميل APK المباشر من ميديا فاير */}
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 active:scale-95 transition cursor-pointer no-underline"
            >
              <Download className="w-5 h-5" />
              <span>تحميل تطبيق أندرويد (APK)</span>
            </a>

            {/* زر الاشتراك والتواصل عبر واتساب */}
            <button
              onClick={() => openWhatsApp('استفسار واشتراك')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>اشتراك عبر واتساب</span>
            </button>
          </div>

          {/* شريط الميزات السريعة */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-400">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
              <WifiOff className="w-4 h-4 text-emerald-400" />
              <span>يعمل 100% بدون نت</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>متاح أندرويد وآيفون وكمبيوتر</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>فواتير PDF تطبع وتشارك فوراً</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>بياناتك آمنة ومشفرة</span>
            </div>
          </div>

          {/* =========================================================
              معاينة حية مجسمة للوحة التحكم (Dashboard Live Mockup)
             ========================================================= */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 p-3 sm:p-4 shadow-2xl border border-slate-700/80">
              
              {/* شريط الإحصائيات الحية داخل المعاينة */}
              <div className="bg-[#0B132B] rounded-2xl p-4 sm:p-6 border border-slate-800 text-right">
                
                {/* الهيدر العلوي للمعاينة */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs sm:text-sm font-black text-white">دورة تسمين عنبر رقم (١) • جارية الآن</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-3">
                    <span>العدد: ٥,٠٠٠ كتكوت</span>
                    <span>•</span>
                    <span className="text-emerald-400">اليوم: ٣٢</span>
                  </div>
                </div>

                {/* 4 بطاقات إحصائيات سريعة */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  
                  {/* البطاقة 1: الأرباح المتوقعة */}
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 text-right">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-bold">صافي الربح المتوقع</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-emerald-400">+٦٨,٥٠٠ <span className="text-xs font-bold">ج.م</span></p>
                    <span className="text-[10px] text-emerald-500/90 font-bold block mt-1">↑ نسبة أرباح ممتازة</span>
                  </div>

                  {/* البطاقة 2: معامل التحويل الغذائي FCR */}
                  <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4 text-right">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-bold">معامل التحويل (FCR)</span>
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-blue-400">١.٤٨</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">متوسط وزن: ٢.١٥ كجم</span>
                  </div>

                  {/* البطاقة 3: تكلفة الكيلو */}
                  <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 text-right">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-bold">تكلفة الكيلو الحي</span>
                      <DollarSign className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-purple-400">٦٩.٥٠ <span className="text-xs font-bold">ج.م</span></p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">شامل العلف والأدوية والتدفئة</span>
                  </div>

                  {/* البطاقة 4: نسبة النافق */}
                  <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 text-right">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[11px] font-bold">نسبة النافق الإجمالية</span>
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-lg sm:text-2xl font-black text-amber-400">١.٨%</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">٩٠ طائر من أصل ٥,٠٠٠</span>
                  </div>
                </div>

                {/* شريط الإجراءات في المعاينة */}
                <div className="bg-slate-950/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-emerald-400">●</span>
                    <span>آخر تحديث للحسابات: اليوم الساعة ٥:٣٠ م</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={onOpenLogin || handleDemoStart} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] transition">
                      تجربة كل الشاشات بالتفصيل ←
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          3. قسم مقارنة: الدفاتر الورقية مقابل مزارعنا برو (Why Mazareana?)
         ========================================================= */}
      <section id="solutions" className="py-20 bg-[#070D18] border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider uppercase">حل جذري لمشاكل الحسابات</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              ليه كل مربين وتجار الدواجن بيسيبوا الدفاتر ويشتركوا في مزارعنا برو؟
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            
            {/* بطاقة الدفاتر الورقية */}
            <div className="bg-rose-950/20 border-2 border-rose-900/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-xs font-black mb-4">
                  ❌ الطرق التقليدية والدفاتر الورقية
                </div>
                <h3 className="text-lg font-black text-rose-200 mb-4">معاناة يومية وخسائر غير محسوبة:</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm font-bold text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 text-base leading-none">✕</span>
                    <span>ضياع فواتير العلف والأدوية وصعوبة تجميع المصروفات آخر الدورة.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 text-base leading-none">✕</span>
                    <span>عدم معرفة تكلفة الكيلو الحقيقية بدقة، مما يجعلك تبيع بالخسارة دون أن تدري!</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 text-base leading-none">✕</span>
                    <span>لخبطة ديون التجار والمجازر وضياع فلوسك لعدم وجود كشف حساب منظم.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-400 text-base leading-none">✕</span>
                    <span>تلف أو ضياع الدفاتر في قلب العنبر يمسح تاريخ تعاملاتك بالكامل.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* بطاقة نظام مزارعنا برو */}
            <div className="bg-emerald-950/25 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-emerald-950/40">
              <div className="absolute -top-3 left-6 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black tracking-wide shadow-md">
                الحل الأذكى والأسلس 🚀
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-4">
                  ✅ مع تطبيق مزارعنا برو الذكي
                </div>
                <h3 className="text-lg font-black text-emerald-200 mb-4">أمان كامل وتحكم فوري في مزرعتك:</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm font-bold text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>تسجيل المصروفات يوماً بيوم وحساب الأرباح الصافية بدقة في ثانية.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>حساب معامل التحويل (FCR) وتكلفة الكيلو الحي لحظياً لضبط خطة التغذية.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>كشوف حسابات دقيقة لكل تاجر ومورد ومشاركتها فواتير ومطالبات عبر واتساب.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>يعمل بالكامل بدون نت (Offline)، ونسخ احتياطي فوري يحمي بياناتك للأبد.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          4. المميزات الست الأساسية (Core Features Grid)
         ========================================================= */}
      <section id="features" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-extrabold text-blue-400 tracking-wider uppercase">إمكانيات صنعت خصيصاً لمجال الدواجن</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              كل ما تحتاجه لإدارة مزرعتك وتجارتك في مكان واحد
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ميزة 1: إدارة الدورات */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/15 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">إدارة دورات التسمين والبياض</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                متابعة دورية يومية للأعمار، استهلاك العلف اليومي، برامج التحصين والأدوية، وحساب تكاليف النشارة والتدفئة والعمالة.
              </p>
            </div>

            {/* ميزة 2: معامل التحويل وحساب الكيلو */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">معامل التحويل FCR والنافق</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                حساب فوري لمعامل تحويل العلف إلى لحم، متوسط وزن الطائر، ونسبة النفوق لمقارنتها بالمعايير القياسية بدقة.
              </p>
            </div>

            {/* ميزة 3: كشوف حسابات العملاء والموردين */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">كشوف حسابات التجار والديون</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                سجل متكامل لكل تاجر ومجزرة: المسحوبات، التوريدات، المدفوعات، والمتبقي. اعرف فلوسك اللي برة بضغطة زر.
              </p>
            </div>

            {/* ميزة 4: فواتير PDF ومشاركتها عبر واتساب */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-600/15 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">فواتير بيع سريعة ومطالبات واتساب</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                إصدار فواتير بيع مع احتساب الأقفاص ونسبة التصفية، وطباعتها أو إرسالها للتاجر كفاتورة PDF أنيقة عبر واتساب.
              </p>
            </div>

            {/* ميزة 5: شغال بدون إنترنت */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <WifiOff className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">يعمل بدون إنترنت تماماً (Offline)</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                عنابر الدواجن غالباً شبكتها ضعيفة، لذلك صممنا البرنامج ليعمل بكفاءة 100% بدون نت بدون أن يتوقف أي شيء.
              </p>
            </div>

            {/* ميزة 6: نسخ احتياطي وأمان للبيانات */}
            <div className="bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">نسخ احتياطي وأمان غير محدود</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                تصدير واستيراد بياناتك بنقرة واحدة، ونقلها لأي موبايل أو كمبيوتر جديد في ثوانٍ دون قلق من فقدان أي رقم.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          5. تبويبات استعراض الشاشات (Interactive Screens Showcase)
         ========================================================= */}
      <section id="screens" className="py-20 bg-[#070D18] border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider uppercase">تصميم بسيط وسهل لكل المربين</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              شاهد بنفسك كيف تبدو واجهات مزارعنا برو
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">لا يحتاج أي خبرة محاسبية سابقة، بسيط ومصمم باللغة العربية الواضحة</p>
          </div>

          {/* أزرار التبويبات */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📊 لوحة التحكم والإحصائيات
            </button>

            <button
              onClick={() => setActiveTab('cycles')}
              className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'cycles'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🐔 تكاليف ودورات التسمين
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🧾 الفواتير والمبيعات
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              👥 حسابات العملاء والتجار
            </button>
          </div>

          {/* محتوى الشاشة المعروضة حسب التبويب */}
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-right animate-in fade-in duration-300">
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-base font-black text-white">نظرة عامة على مزرعتك وعنابرك</h4>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">تحديث لحظي</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  تعطيك لوحة التحكم نبذة كاملة عن إجمالي إيرادات المزرعة، المصروفات الجارية، صافي الأرباح، ورصيد ديون العملاء والموردين بدون الحاجة للبحث في أوراق متناثرة.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 grid sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي المبيعات</span>
                    <span className="text-lg font-black text-emerald-400">٣٤٥,٢٠٠ ج.م</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي المصروفات</span>
                    <span className="text-lg font-black text-rose-400">٢٤٢,١٠٠ ج.م</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-[11px] text-slate-400 font-bold block">صافي الربح الفعلي</span>
                    <span className="text-lg font-black text-blue-400">+١٠٣,١٠٠ ج.م</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cycles' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-base font-black text-white">شاشة حسابات دورة الدواجن</h4>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">متابعة دقيقة</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  سجل تكاليف العلف يومياً بجميع مراحله (بادي، نامي، ناهي)، الأدوية البيطرية والتحصينات، النشارة والغاز والكهرباء، ليحسب لك البرنامج تكلفة الكيلو والفرخة تلقائياً.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 space-y-2 text-xs font-bold">
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">استهلاك العلف الإجمالي:</span>
                    <span className="text-white">١٦.٢ طن (متوسط ٣.٢٤ كجم / طائر)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">معامل التحويل (FCR):</span>
                    <span className="text-emerald-400 font-mono text-sm">١.٤٧ (ممتاز)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">سعر بيع البورصة المتوقع:</span>
                    <span className="text-blue-400">٧٨ ج.م / كجم (الربح المتوقع: ٨.٥ ج/كجم)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-base font-black text-white">إصدار ومشاركة فواتير البيع</h4>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full font-bold">طباعة فورية</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  أنشئ فاتورة بيع للتاجر في ثانية: حدد الوزن القائم، وزن الأقفاص فارغة، نسبة التصفية، والسعر. يطبع الفاتورة أو يرسلها مباشرة للتاجر عبر واتساب PDF.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="text-slate-400 block text-[10px]">فاتورة بيع رقم #١٠٤</span>
                    <span className="text-white text-sm font-black">تاجر: مجزر الأمانة (الشرقية)</span>
                  </div>
                  <div className="text-left">
                    <span className="text-emerald-400 font-mono text-base font-black block">٥٤,٣٢٠ ج.م</span>
                    <span className="text-slate-400 text-[10px]">تم السداد: ٢٠,٠٠٠ • المتبقي: ٣٤,٣٢٠</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-base font-black text-white">كشف حساب العميل والمورد</h4>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">حماية ديونك</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  كشف حساب تفصيلي لكل تاجر يوضح حركات الشراء والسداد وتواريخ الدفعات، مع إمكانية إرسال رسالة مطالبة ودية بضغطة زر واحدة.
                </p>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="text-slate-400 block text-[10px]">إجمالي ديون التجار لك في السوق:</span>
                    <span className="text-rose-400 text-lg font-black">٨٧,٤٠٠ ج.م</span>
                  </div>
                  <button onClick={() => openWhatsApp('استفسار عن إدارة الديون')} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>إرسال مطالبة واتساب</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800/80 text-center">
              <button
                onClick={handleOpenApp}
                className="inline-flex items-center gap-2 text-xs font-black text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                <span>افتح البرنامج الآن وجرّب بنفسك ←</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          6. قسم تحميل تطبيق الأندرويد المباشر (APK Download Section)
         ========================================================= */}
      <section id="download" className="py-20 bg-gradient-to-b from-[#080E1C] via-[#0E1B33] to-[#080E1C] relative border-t border-b border-blue-900/30 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/70 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-12 shadow-2xl text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black mb-6">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>تطبيق أندرويد الأصلي متاح الآن للتحميل المباشر</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight max-w-2xl mx-auto">
              حمّل تطبيق <span className="text-emerald-400">مزارعنا برو</span> بصيغة APK مباشرة على هاتفك
            </h2>

            <p className="mt-4 text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              استمتع بأقوى تجربة لإدارة مزرعتك وحساباتك بسرعة فائقة وبدون الحاجة لإنترنت. ملف APK خفيف وآمن 100% وجاهز للتثبيت على جميع هواتف الأندرويد.
            </p>

            {/* زر التحميل الكبير من MediaFire */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-lg shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition active:scale-95 cursor-pointer no-underline"
              >
                <Download className="w-6 h-6 stroke-[2.5]" />
                <span>تحميل MazareanaPro.apk (رابط ميديا فاير السريع)</span>
              </a>

              <button
                onClick={handleOpenApp}
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 font-black text-base flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-5 h-5 text-blue-400" />
                <span>أو تشغيل البرنامج في المتصفح</span>
              </button>
            </div>

            {/* خطوات التثبيت السريعة */}
            <div className="mt-12 pt-8 border-t border-slate-800/80">
              <h4 className="text-sm font-black text-slate-300 mb-6">خطوات التثبيت السريعة في دقيقة واحدة:</h4>
              <div className="grid sm:grid-cols-3 gap-4 text-right">
                
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 font-black flex items-center justify-center shrink-0 text-sm">
                    ١
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white mb-1">اضغط تحميل</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      اضغط على زر التحميل وسيتم تنزيل ملف APK الصغير على هاتفك من MediaFire خلال ثوانٍ.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-sm">
                    ٢
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white mb-1">السماح بالتثبيت</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      افتح الملف من الإشعارات أو التنزيلات، وإذا طلب هاتفك السماح بالتثبيت اختر "السماح".
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 font-black flex items-center justify-center shrink-0 text-sm">
                    ٣
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white mb-1">افتح وابدأ الإدارة</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      ستجد أيقونة التطبيق على شاشة موبايلك، افتحه وابدأ حسابات دورتك فوراً!
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          7. خطط الأسعار والباقات (Pricing Plans)
         ========================================================= */}
      <section id="pricing" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider uppercase">أسعار رمزية ومناسبة للجميع</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              اختر الباقة المناسبة لمزرعتك وابدأ التفعيل فوراً
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              الدفع بكل سهولة عبر فودافون كاش، إنستاباي، أو أي محفظة إلكترونية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* الباقة الشهرية */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  مرونة كاملة • جرّب براحتك
                </div>
                <h3 className="text-xl font-black text-white">الباقة الشهرية</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">٣٠</span>
                  <span className="text-xs text-slate-400 mr-2 font-bold">جنيه / شهر</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تفعيل كامل لجميع مميزات البرنامج</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>يعمل بدون إنترنت على الموبايل</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>دعم فني كامل عبر واتساب</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span>تتجدد يدوياً كل ٣٠ يوماً</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openWhatsApp('الباقة الشهرية')}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition cursor-pointer"
              >
                اشترك في الشهرية (٣٠ ج.م)
              </button>
            </div>

            {/* الباقة السنوية (الأكثر طلباً وتوفيراً) */}
            <div className="bg-gradient-to-b from-blue-950/60 to-slate-900 border-2 border-blue-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl shadow-blue-950/60 hover:scale-[1.02] transition-transform">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-md tracking-wider">
                👑 الأكثر طلباً وتوفيراً (خصم ٣٠%)
              </div>
              <div>
                <div className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  سنة كاملة • راحة بال واستقرار
                </div>
                <h3 className="text-2xl font-black text-white">الباقة السنوية</h3>
                <div className="mt-4 mb-6">
                  <span className="text-5xl font-black text-white">٢٥٠</span>
                  <span className="text-xs text-slate-300 mr-2 font-bold">جنيه / سنة</span>
                </div>
                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تفعيل مستمر لمدة ٣٦٥ يوماً كاملة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>توفير أكثر من ٣٠% مقارنة بالاشتراك الشهري</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تحديثات مجانية دورية للبرنامج</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>دعم فني وتدريب سريع على الاستخدام</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openWhatsApp('الباقة السنوية')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                اشترك في السنوية (٢٥٠ ج.م)
              </button>
            </div>

            {/* باقة مدى الحياة */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="inline-block bg-purple-500/15 text-purple-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  دفعة واحدة للأبد • استثمار دائم
                </div>
                <h3 className="text-xl font-black text-white">مدى الحياة</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">١,٣٥٠</span>
                  <span className="text-xs text-slate-400 mr-2 font-bold">جنيه (مرة واحدة)</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>امتلاك البرنامج مدى الحياة لجهازك</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>بدون أي اشتراكات أو تجديد شهري أو سنوي</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>أولوية الدعم الفني وتحديثات مدى الحياة</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => openWhatsApp('باقة مدى الحياة')}
                className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs transition cursor-pointer"
              >
                امتلكه مدى الحياة (١,٣٥٠ ج.م)
              </button>
            </div>

          </div>

          {/* وسائل الدفع المعتمدة */}
          <div className="mt-12 text-center text-xs font-bold text-slate-400 flex flex-wrap items-center justify-center gap-4">
            <span>طرق الدفع السريعة:</span>
            <span className="bg-slate-800 text-rose-300 px-3 py-1 rounded-lg">فودافون كاش ({primaryPhone})</span>
            <span className="bg-slate-800 text-indigo-300 px-3 py-1 rounded-lg">إنستاباي (InstaPay)</span>
            <span className="bg-slate-800 text-emerald-300 px-3 py-1 rounded-lg">أي محفظة إلكترونية في مصر</span>
          </div>

        </div>
      </section>

      {/* =========================================================
          7. آراء وتجارب العملاء (Testimonials)
         ========================================================= */}
      <section className="py-20 bg-[#070D18] border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-extrabold text-blue-400 tracking-wider uppercase">ثقة المربين في مختلف المحافظات</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              تجارب حقيقية من أرض الواقع
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-right">
              <div className="flex items-center gap-1 text-amber-400 mb-3 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed mb-4">
                "البرنامج ده ريحني من كابوس الدفاتر. في آخر كل دورة كنت بقعد يومين أجمع فواتير العلف والنافق وأطلع غلطان. دلوقتي بضغطة زر عارف كسبت كام بالمليم."
              </p>
              <div className="border-t border-slate-800 pt-3">
                <h5 className="text-sm font-black text-white">الحاج فريد عبد العزيز</h5>
                <span className="text-[11px] text-slate-500 font-bold">صاحب مزرعة تسمين • مركز بلبيس، الشرقية</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-right">
              <div className="flex items-center gap-1 text-amber-400 mb-3 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed mb-4">
                "أهم ميزة إنه شغال معايا في المزرعة أوفلاين لأن الشبكة عندنا في العنبر معدومة. بسجل العلف وأوزن الفراخ وأطبع فاتورة التاجر وتمام التمام."
              </p>
              <div className="border-t border-slate-800 pt-3">
                <h5 className="text-sm font-black text-white">أ/ محمد الشناوي</h5>
                <span className="text-[11px] text-slate-500 font-bold">مشرف ومربي دواجن • كفر الدوار، البحيرة</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-right sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1 text-amber-400 mb-3 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed mb-4">
                "أنا تاجر دواجن وبسحب من أكتر من عنبر وبوزع للمحلات، ميزة كشوف حسابات العملاء خلتني مسيطر على الديون وكل تاجر ليه حسابه واضح في واتساب."
              </p>
              <div className="border-t border-slate-800 pt-3">
                <h5 className="text-sm font-black text-white">م/ إبراهيم القاضي</h5>
                <span className="text-[11px] text-slate-500 font-bold">تاجر وموزع دواجن • بنها، القليوبية</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
          8. قسم الأسئلة الشائعة (FAQ Accordion)
         ========================================================= */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-14">
            <h2 className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider uppercase">كل ما ترغب بمعرفته</h2>
            <p className="text-2xl sm:text-4xl font-black text-white mt-2 leading-tight">
              الأسئلة الشائعة وإجاباتها
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: "هل يعمل البرنامج بدون إنترنت (أوفلاين)؟",
                a: "نعم، 100%! تطبيق مزارعنا برو يعمل بشكل كامل دون الحاجة لأي اتصال بالإنترنت في العنابر والمزارع. تسجل بياناتك ومصروفاتك وفواتيرك بحرية تامة."
              },
              {
                q: "هل يمكنني تشغيل البرنامج على أكثر من جهاز؟",
                a: "نعم، البرنامج متاح كتطبيق لهواتف الأندرويد (APK)، وكذلك تطبيق ويب متطور (PWA) يعمل على الآيفون والكمبيوتر والتابلت."
              },
              {
                q: "كيف أستلم كود التفعيل بعد الدفع؟",
                a: "بمجرد تحويل قيمة الباقة المختارة عبر فودافون كاش أو إنستاباي، ترسل لنا رمز جهازك (Hardware ID) الظاهر في التطبيق عبر واتساب، ونرسل لك كود التفعيل الفوري في أقل من دقيقة واحدة."
              },
              {
                q: "ماذا يحدث لبياناتي إذا قمت بتغيير هاتفي المحمول؟",
                a: "بياناتك بأمان تام! يمكنك أخذ نسخة احتياطية من بيانات المزرعة وحفظها على هاتفك أو إرسالها لواتسابك، واستعادتها على أي جهاز جديد بضغطة زر واحدة."
              },
              {
                q: "هل البرنامج مناسب لمزارع البط والمواشي أيضاً؟",
                a: "نعم، بجانب تخصص البرنامج الأساسي في مزارع التسمين والبياض، يمكنك استخدام نظام المصروفات والإيرادات والفواتير والديون لمزارع البط، الأرانب، وتجارة المواشي بكل كفاءة."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-right font-black text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
          9. بانر الختام والدعوة للإجراء (Bottom CTA)
         ========================================================= */}
      <section className="py-16 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">
            جاهز لضبط حسابات مزرعتك ومضاعفة أرباحك؟
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto mb-8 font-medium">
            انضم الآن لمئات المربين والتجار الذين وفروا أوقاتهم وحموا أموالهم مع مزارعنا برو.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openWhatsApp('اشتراك مباشر من البانر')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تواصل واشترك الآن عبر واتساب</span>
            </button>
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer transition shadow-lg no-underline"
            >
              <Download className="w-5 h-5" />
              <span>تحميل تطبيق أندرويد (APK)</span>
            </a>
            <button
              onClick={handleOpenApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>فتح لوحة التحكم</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          10. التذييل السفلي (Footer)
         ========================================================= */}
      <footer className="bg-[#050A12] border-t border-slate-900 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-base font-black text-white">مزارعنا برو - Mazareana Pro</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">2026</span>
            </div>
            <p className="text-slate-500 font-medium">نظام الإدارة المالية الشامل لمزارع الدواجن والإنتاج الحيواني في مصر والوطن العربي.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-slate-300">
            <button onClick={() => openWhatsApp('فودافون كاش')} className="hover:text-emerald-400 transition cursor-pointer">
              📞 واتساب: {primaryPhone}
            </button>
            <span>•</span>
            <button onClick={() => openWhatsApp('دعم فني')} className="hover:text-emerald-400 transition cursor-pointer">
              📞 هاتف الدعم: {secondaryPhone}
            </button>
          </div>
        </div>
        <div className="text-center text-slate-600 text-[11px] font-bold mt-8">
          جميع الحقوق محفوظة © ٢٠٢٦ مزارعنا برو • صمم خصيصاً لخدمة الإنتاج الداجني
        </div>
      </footer>

      {/* =========================================================
          11. زر واتساب العائم السريع (Floating Quick Action)
         ========================================================= */}
      <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
        <button
          onClick={() => openWhatsApp('الزر العائم')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-600/40 font-black text-xs cursor-pointer transition active:scale-95 group"
          title="تواصل معنا عبر واتساب"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline">اشترك الآن عبر واتساب</span>
        </button>
      </div>

    </div>
  );
};

export default LandingPage;
