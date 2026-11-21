import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Moon, Sun, Shield, Download, Database, Bell, Plus, Trash2, Upload,
  Building2, Edit, MapPin, LogOut, FileText, Calendar, Users as UsersIcon, UserCheck,
  Receipt, UserCog, Palette, SlidersHorizontal, ArrowLeft, ShieldCheck, HardHat, Loader2,
  Filter, TrendingUp, TrendingDown, Layers, PieChart, Coins, Eye, EyeOff, ScanFace, CheckCircle2, ArrowUpDown,
  Mic, WifiOff, ExternalLink, Cloud, RefreshCw, Folder, Key, Link2, Unlink, AlertTriangle, FileCheck, Check, MessageSquare, Copy,
  ChevronDown, Search, CreditCard, BarChart3, ArrowDownLeft, ArrowUpRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { type Farm, calculateFlockAgeDays } from "@/contexts/AppContext";
import { FarmSelector } from "@/components/FarmSelector";
import { shareFileNatively } from "@/lib/nativeSharing";
import { sendPhoneNotification, testPhoneNotification } from "@/lib/notifications";
import PartnersView from "./Partners";
import { sortByDateDesc, cn } from "@/lib/utils";
import {
  getGoogleDriveState,
  saveGoogleDriveState,
  saveDirectlyToGoogleDriveNative,
  restoreBackupFromFile,
  type GoogleDriveState
} from "@/lib/googleDriveSync";
import {
  generateFinancialReportMessage,
  openWhatsApp
} from "@/lib/whatsappSharing";
import { persistAppData } from "@/lib/indexedDbStorage";
import { triggerHaptic, isHapticsEnabled, setHapticsEnabled } from "@/lib/haptics";
import { getStoredLicenseInfo, calculateDeviceKey } from "@/lib/paymentService";

const ToggleSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => {
      onChange();
      triggerHaptic("light");
    }}
    className={cn(
      "w-[46px] h-[28px] rounded-[14px] transition-colors relative cursor-pointer shrink-0 border-0 p-0 active:scale-95",
      checked ? "bg-[#2F5FE3]" : "bg-[#CBD2DC] dark:bg-slate-700"
    )}
  >
    <span
      style={{ left: checked ? "3px" : "21px" }}
      className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-xs transition-all pointer-events-none"
    />
  </button>
);

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";
  const { signOut, isAdmin, user: currentUser } = useAuth();
  const { farms, addFarm, updateFarm, deleteFarm, currentFarm, setCurrentFarm, clients, invoices, getClientTotals, payments, expensePayments, expenses, revenues, partners } = useAppContext();

  const [showFarmListDropdown, setShowFarmListDropdown] = useState(false);
  const [farmSearchQuery, setFarmSearchQuery] = useState("");

  // Invoices & Payments tab states
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [paySearchTerm, setPaySearchTerm] = useState("");

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("app_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.haptics === undefined) {
          parsed.haptics = isHapticsEnabled();
        }
        return parsed;
      }
    } catch {}
    return {
      darkMode: false,
      language: "ar",
      monthlyExpenseLimit: 50000,
      pdfExport: true,
      autoBackup: true,
      notifications: true,
      currency: "EGP",
      haptics: true,
    };
  });

  // Farm Switch Mode State
  const [farmSwitchMode, setFarmSwitchMode] = useState<string>(() => {
    try {
      return localStorage.getItem("farm_switch_mode") || "both";
    } catch {
      return "both";
    }
  });

  const handleSetFarmSwitchMode = (mode: string) => {
    setFarmSwitchMode(mode);
    localStorage.setItem("farm_switch_mode", mode);
    window.dispatchEvent(new Event("farm_switch_mode_changed"));
    toast.success("تم تحديث طريقة التبديل بين المزارع بنجاح");
  };

  // Google Drive Native State (Method 2 Only)
  const [driveState, setDriveState] = useState<GoogleDriveState>(() => getGoogleDriveState());
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const googleDriveFileInputRef = useRef<HTMLInputElement>(null);

  // License State
  const licenseInfo = getStoredLicenseInfo();
  const currentDeviceId = typeof window !== 'undefined'
    ? ((window as any).AndroidBridge?.getDeviceId?.() || (window as any).AndroidSpeech?.getDeviceId?.() || localStorage.getItem('app_device_id') || '000000')
    : '000000';
  const currentActivationKey = typeof window !== 'undefined'
    ? localStorage.getItem('app_activation_key') || calculateDeviceKey(currentDeviceId)
    : '';




  // Payments log filters
  const [payMonth, setPayMonth] = useState("all");
  const [payType, setPayType] = useState("all");
  const [payClient, setPayClient] = useState("all");

  // Farms
  const [showEditFarm, setShowEditFarm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [newFarm, setNewFarm] = useState({
    name: "",
    type: "دواجن",
    location: "",
    description: "",
    capacity: "15,000 طائر",
    cycleStartDate: new Date().toISOString().split('T')[0],
    flockAge: "24 يوم",
    mortalityRate: "1.2%",
    currentCycle: "الدورة الأولى 2026",
    status: "نشطة"
  });

  // Reports
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Advanced Report Filters
  const [reportPeriod, setReportPeriod] = useState<string>("monthly");
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reportClientFilter, setReportClientFilter] = useState<string>("all");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportIncludePayments, setReportIncludePayments] = useState<boolean>(true);
  const [reportDialogTab, setReportDialogTab] = useState<"summary" | "revenues" | "expenses" | "payments">("summary");

  const toggleSetting = (key: string) => {
    setSettings((p) => {
      const next = { ...p, [key]: !p[key as keyof typeof p] };
      localStorage.setItem("app_settings", JSON.stringify(next));
      return next;
    });
    if (key === "darkMode") document.documentElement.classList.toggle("dark");
  };
  const updateSetting = (key: string, value: any) => {
    setSettings((p) => {
      const next = { ...p, [key]: value };
      localStorage.setItem("app_settings", JSON.stringify(next));
      return next;
    });
  };

  const handleExportBackup = async () => {
    try {
      const keys = [
        'local_farms',
        'local_revenues',
        'local_expenses',
        'local_clients',
        'local_invoices',
        'local_partners',
        'local_payments',
        'local_expense_payments',
        'current_farm_id',
        'app_settings',
        'financial_settings'
      ];
      const backupData: Record<string, any> = {};
      keys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            backupData[key] = JSON.parse(val);
          } catch {
            backupData[key] = val;
          }
        } else {
          backupData[key] = [];
        }
      });
      
      backupData['backup_meta'] = {
        version: '1.0.0',
        appName: 'المشروع المالي',
        date: new Date().toISOString(),
        farmCount: Array.isArray(backupData['local_farms']) ? backupData['local_farms'].length : 0,
        revenueCount: Array.isArray(backupData['local_revenues']) ? backupData['local_revenues'].length : 0,
        expenseCount: Array.isArray(backupData['local_expenses']) ? backupData['local_expenses'].length : 0,
        clientCount: Array.isArray(backupData['local_clients']) ? backupData['local_clients'].length : 0
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const datePart = new Date().toISOString().split('T')[0];
      const fileName = `mashroua_malia_backup_${datePart}_${Date.now()}.json`;

      // 1. AndroidBridge Direct Native Handler (Fastest & guarantees saving in Android Downloads + Share)
      const androidBridge = (window as any).AndroidBridge || (window as any).AndroidSpeech;
      if (androidBridge && typeof androidBridge.saveBackupFile === "function") {
        const saved = androidBridge.saveBackupFile(fileName, dataStr);
        if (saved) {
          triggerHaptic('success');
          toast.success("تم تصدير النسخة الاحتياطية بنجاح إلى مجلد التنزيلات وتجهيزها للمشاركة!");
          return;
        }
      }

      // 2. Capacitor Filesystem / Share or Browser Fallback
      const base64Data = btoa(unescape(encodeURIComponent(dataStr)));
      let downloaded = false;
      const triggerDownload = () => {
        if (downloaded) return;
        downloaded = true;
        const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.download = fileName;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        triggerHaptic('success');
        toast.success("تم تصدير النسخة الاحتياطية بنجاح إلى التنزيلات");
      };

      await shareFileNatively(fileName, base64Data, triggerDownload);
    } catch (error: any) {
      console.error("Export backup error:", error);
      triggerHaptic('error');
      toast.error("فشل تصدير النسخة الاحتياطية");
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content || !content.trim()) {
          toast.error("الملف المختار فارغ!");
          return;
        }

        const parsedData = JSON.parse(content);
        const source = (parsedData && typeof parsedData.data === 'object' && !Array.isArray(parsedData.data))
          ? parsedData.data
          : parsedData;

        const keys = [
          'local_farms',
          'local_revenues',
          'local_expenses',
          'local_clients',
          'local_invoices',
          'local_partners',
          'local_payments',
          'local_expense_payments',
          'current_farm_id',
          'app_settings',
          'financial_settings'
        ];

        // Check if ANY recognized financial key is present
        const hasValidKey = keys.some(key => source[key] !== undefined);
        if (!hasValidKey) {
          toast.error("ملف النسخة الاحتياطية غير صالح أو لا يحتوي على سجلات للمشروع المالي");
          return;
        }

        let restoredCount = 0;
        keys.forEach(key => {
          if (source[key] !== undefined && source[key] !== null) {
            const val = source[key];
            let parsedVal = val;
            if (typeof val === 'string') {
              try { parsedVal = JSON.parse(val); } catch { parsedVal = val; }
            }
            persistAppData(key, parsedVal);
            restoredCount++;
          }
        });

        // Reset file input value so user can re-import the same file if needed
        event.target.value = '';

        triggerHaptic('success');
        sendPhoneNotification("المنظومة المالية", `تم استعادة النسخة الاحتياطية بنجاح (${restoredCount} أقسام).`);
        toast.success(`تم استيراد البيانات بنجاح (${restoredCount} أقسام)! جاري تحديث التطبيق...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error("Import backup error:", err);
        triggerHaptic('error');
        toast.error("فشل قراءة أو تحليل ملف النسخة الاحتياطية. يرجى التأكد من اختيار ملف JSON صالح.");
        event.target.value = '';
      }
    };

    fileReader.onerror = () => {
      toast.error("تعذر قراءة الملف المختار من جهازك");
      event.target.value = '';
    };

    fileReader.readAsText(file);
  };


  const handleFactoryReset = () => {
    const isConfirmed = window.confirm("⚠️ هل أنت متأكد من رغبتك في إعادة ضبط المصنع؟ سيؤدي هذا إلى مسح جميع البيانات (المزارع، المصروفات، الإيرادات، الفواتير، الشركاء، والعملاء) نهائياً ولا يمكن التراجع عن هذه الخطوة!");
    if (isConfirmed) {
      const keys = [
        'local_farms',
        'local_revenues',
        'local_expenses',
        'local_clients',
        'local_invoices',
        'local_partners',
        'local_payments',
        'local_expense_payments',
        'current_farm_id'
      ];
      keys.forEach(key => localStorage.removeItem(key));
      toast.success("تم مسح جميع البيانات وإعادة ضبط المصنع بنجاح. سيتم إعادة تشغيل التطبيق...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  // Google Drive Native Phone Integration (Method 2 Only)
  const handleSaveToGoogleDriveApp = () => {
    setIsSavingToDrive(true);
    try {
      const success = saveDirectlyToGoogleDriveNative(() => {
        handleExportBackup();
      });
      setDriveState(getGoogleDriveState());
      if (success) {
        toast.success("تم فتح تطبيق Google Drive بالهاتف لحفظ نسختك السحابية ☁️");
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء فتح Google Drive");
    } finally {
      setTimeout(() => setIsSavingToDrive(false), 1000);
    }
  };

  const handleRestoreFromGoogleDriveFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const res = await restoreBackupFromFile(file);
      event.target.value = '';
      if (res.success) {
        toast.success(res.message);
        sendPhoneNotification("المنظومة المالية", `تم استعادة النسخة الاحتياطية بنجاح (${res.count} أقسام).`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      event.target.value = '';
      toast.error(err?.message || "تعذر استعادة النسخة المحددة");
    }
  };


  // Global combined payments list
  const allPayments = [
    ...payments.map(p => ({
      id: p.id,
      date: p.date,
      createdAt: p.createdAt,
      amount: p.amount,
      notes: p.notes,
      type: "revenue",
      clientId: p.clientId,
      clientName: clients.find(c => c.id === p.clientId)?.name || "عميل غير معروف",
      clientType: "مشتري"
    })),
    ...expensePayments.map(ep => {
      const expense = expenses.find(e => e.id === ep.expenseId);
      const clientName = ep.clientId ? clients.find(c => c.id === ep.clientId)?.name : (expense?.supplierName || "مورد غير معروف");
      return {
        id: ep.id,
        date: ep.date,
        createdAt: ep.createdAt,
        amount: ep.amount,
        notes: ep.notes,
        type: "expense",
        clientId: ep.clientId || (expense?.clientId) || null,
        clientName: clientName || "مورد غير معروف",
        clientType: "مورد"
      };
    })
  ].sort(sortByDateDesc);

  // ===== Reports =====
  const getReportTypeArabic = (type: string) =>
    ({
      daily: "اليومي",
      weekly: "الأسبوعي (آخر 7 أيام)",
      monthly: "الشهري",
      yearly: "السنوي",
      all: "الشامل (كل الفترات)",
      custom: "فترة مخصصة"
    } as any)[type] || type;

  const setPeriodAndDates = (p: string) => {
    setReportPeriod(p);
    const now = new Date();
    const getLocalDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (p === "daily") {
      const str = getLocalDateString(now);
      setReportStartDate(str);
      setReportEndDate(str);
    } else if (p === "weekly") {
      const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setReportStartDate(getLocalDateString(start));
      setReportEndDate(getLocalDateString(now));
    } else if (p === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setReportStartDate(getLocalDateString(start));
      setReportEndDate(getLocalDateString(end));
    } else if (p === "yearly") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setReportStartDate(getLocalDateString(start));
      setReportEndDate(getLocalDateString(end));
    } else if (p === "all") {
      setReportStartDate("2020-01-01");
      setReportEndDate(getLocalDateString(now));
    }
  };

  const generateReport = async (overridePeriod?: string) => {
    setIsGeneratingReport(true);
    const targetPeriod = overridePeriod || reportPeriod;
    setReportType(targetPeriod);
    setReportDialogTab("summary");
    try {
      if (!currentFarm) {
        toast.error("لا توجد مزرعة نشطة حالياً");
        return;
      }
      const now = new Date();
      let startStr = reportStartDate || "2000-01-01";
      let endStr = reportEndDate || "2099-12-31";

      const getLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      if (targetPeriod === "daily") {
        startStr = getLocalDateString(now);
        endStr = getLocalDateString(now);
      } else if (targetPeriod === "weekly") {
        const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startStr = getLocalDateString(start);
        endStr = getLocalDateString(now);
      } else if (targetPeriod === "monthly") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startStr = getLocalDateString(start);
        endStr = getLocalDateString(end);
      } else if (targetPeriod === "yearly") {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        startStr = getLocalDateString(start);
        endStr = getLocalDateString(end);
      } else if (targetPeriod === "all") {
        startStr = "2020-01-01";
        endStr = "2099-12-31";
      } else if (targetPeriod === "custom") {
        startStr = reportStartDate || "2000-01-01";
        endStr = reportEndDate || "2099-12-31";
      }

      // Filter revenues
      const filteredRevenues = revenues.filter(r => {
        const d = r.date ? r.date.split("T")[0] : "";
        if (d < startStr || d > endStr) return false;
        if (reportClientFilter !== "all" && r.clientId !== reportClientFilter) return false;
        if (reportTypeFilter === "expenses" || reportTypeFilter === "payments") return false;
        return true;
      });

      // Filter expenses
      const filteredExpenses = expenses.filter(e => {
        const d = e.date ? e.date.split("T")[0] : "";
        if (d < startStr || d > endStr) return false;
        if (reportClientFilter !== "all" && e.clientId !== reportClientFilter) return false;
        if (reportTypeFilter === "revenues" || reportTypeFilter === "payments") return false;
        return true;
      });

      // Filter invoices
      const filteredInvoices = invoices.filter(i => {
        const d = i.date ? i.date.split("T")[0] : "";
        if (d < startStr || d > endStr) return false;
        if (reportClientFilter !== "all") {
          const clientObj = clients.find(c => c.id === reportClientFilter);
          if (clientObj && i.clientName !== clientObj.name) return false;
        }
        if (reportTypeFilter === "expenses" || reportTypeFilter === "payments") return false;
        return true;
      });

      // Filter payments (both collections and supplier payments)
      const reportPaymentsList = allPayments.filter(p => {
        const d = p.date ? p.date.split("T")[0] : "";
        if (d < startStr || d > endStr) return false;
        if (reportClientFilter !== "all" && p.clientId !== reportClientFilter) return false;
        if (reportTypeFilter === "revenues" && p.type !== "revenue") return false;
        if (reportTypeFilter === "expenses" && p.type !== "expense") return false;
        return true;
      });

      // 1. Calculate Revenue Metrics
      const totalRevenues = filteredRevenues.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const cashRevenues = filteredRevenues
        .filter(r => r.paymentMethod !== "credit")
        .reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const creditRevenues = totalRevenues - cashRevenues;

      // 2. Calculate Expense Metrics
      const totalExpenses = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const paidExpenses = filteredExpenses.reduce((s, e) => {
        if (e.paymentMethod === "cash") return s + (Number(e.amount) || 0);
        return s + (Number(e.paidAmount) || 0);
      }, 0);
      const remainingExpenses = Math.max(0, totalExpenses - paidExpenses);

      // 3. True Net Profit (Revenues - Expenses)
      const netProfit = totalRevenues - totalExpenses;
      const profitMargin = totalRevenues > 0 ? ((netProfit / totalRevenues) * 100).toFixed(1) : "0";

      // 4. Payments from clients and to suppliers
      const totalCollectedPayments = reportPaymentsList
        .filter(p => p.type === "revenue")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const totalDisbursedPayments = reportPaymentsList
        .filter(p => p.type === "expense")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

      // 5. Cash Flow: Actual money coming in vs money going out
      const totalCashIn = cashRevenues + totalCollectedPayments;
      const totalCashOut = paidExpenses + totalDisbursedPayments;
      const netCashFlow = totalCashIn - totalCashOut;
      const totalInvoices = filteredInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

      // Revenue breakdown by category / type
      const revenuesByCategory: Record<string, { total: number; count: number; quantity: number }> = {};
      filteredRevenues.forEach(r => {
        const cat = r.type || "أخرى";
        if (!revenuesByCategory[cat]) revenuesByCategory[cat] = { total: 0, count: 0, quantity: 0 };
        revenuesByCategory[cat].total += Number(r.amount) || 0;
        revenuesByCategory[cat].count += 1;
        revenuesByCategory[cat].quantity += Number(r.quantity) || 0;
      });

      // Expense breakdown by category
      const expensesByCategory: Record<string, { total: number; count: number; quantity: number }> = {};
      filteredExpenses.forEach(e => {
        const cat = e.category || "أخرى";
        if (!expensesByCategory[cat]) expensesByCategory[cat] = { total: 0, count: 0, quantity: 0 };
        expensesByCategory[cat].total += Number(e.amount) || 0;
        expensesByCategory[cat].count += 1;
        expensesByCategory[cat].quantity += Number(e.quantity) || 0;
      });

      const selectedClientObj = reportClientFilter !== "all" ? clients.find(c => c.id === reportClientFilter) : null;
      const clientTotals = selectedClientObj ? getClientTotals(selectedClientObj.id) : null;

      setReportData({
        period: targetPeriod,
        startDate: startStr,
        endDate: endStr,
        totalRevenues,
        cashRevenues,
        creditRevenues,
        totalExpenses,
        paidExpenses,
        remainingExpenses,
        totalInvoices,
        netProfit,
        profitMargin,
        totalCashIn,
        totalCashOut,
        netCashFlow,
        totalCollectedPayments,
        totalDisbursedPayments,
        revenuesCount: filteredRevenues.length,
        expensesCount: filteredExpenses.length,
        invoicesCount: filteredInvoices.length,
        paymentsCount: reportPaymentsList.length,
        revenuesList: filteredRevenues,
        expensesList: filteredExpenses,
        invoicesList: filteredInvoices,
        paymentsList: reportPaymentsList,
        revenuesByCategory,
        expensesByCategory,
        selectedClient: selectedClientObj,
        clientTotals,
        clientsCount: clients.length,
        partnersCount: partners.length,
        includePayments: reportIncludePayments,
      });

      setShowReportDialog(true);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePDFReport = async () => {
    if (!reportData) return;
    setIsGeneratingReport(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      if (document.fonts) {
        await document.fonts.ready;
      }

      const container = document.createElement("div");
      container.setAttribute("dir", "rtl");
      container.style.position = "fixed";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "794px"; /* A4 width at standard 96dpi */
      container.style.zIndex = "99999";
      container.style.opacity = "1";
      container.style.visibility = "visible";
      container.style.padding = "24px";
      container.style.background = "#ffffff";
      container.style.color = "#0f172a";
      container.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
      container.style.direction = "rtl";
      container.style.textAlign = "right";

      const formatVal = (num: number) => Math.round(num || 0).toLocaleString('en-US');
      const nowFormatted = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`;

      // Build Revenue Category rows
      const revCats = Object.entries(reportData.revenuesByCategory || {}) as [string, { total: number; count: number; quantity: number }][];
      const revRowsHtml = revCats.length > 0 ? revCats.map(([cat, val]) => {
        const pct = reportData.totalRevenues > 0 ? ((val.total / reportData.totalRevenues) * 100).toFixed(1) : "0";
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 8px; font-weight:bold; color:#1e293b; text-align:right;">${cat}</td>
            <td style="padding:7px 8px; text-align:center; color:#64748b;">${val.count}</td>
            <td style="padding:7px 8px; text-align:center; color:#64748b;">${val.quantity > 0 ? val.quantity.toLocaleString() : "—"}</td>
            <td style="padding:7px 8px; text-align:left; direction:ltr; font-weight:bold; color:#15803d;">${formatVal(val.total)} ج.م</td>
            <td style="padding:7px 8px; text-align:center; color:#475569; font-weight:bold;">${pct}%</td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94a3b8;">لا توجد إيرادات مسجلة للفترة</td></tr>`;

      // Build Expense Category rows
      const expCats = Object.entries(reportData.expensesByCategory || {}) as [string, { total: number; count: number; quantity: number }][];
      const expRowsHtml = expCats.length > 0 ? expCats.map(([cat, val]) => {
        const pct = reportData.totalExpenses > 0 ? ((val.total / reportData.totalExpenses) * 100).toFixed(1) : "0";
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 8px; font-weight:bold; color:#1e293b; text-align:right;">${cat}</td>
            <td style="padding:7px 8px; text-align:center; color:#64748b;">${val.count}</td>
            <td style="padding:7px 8px; text-align:center; color:#64748b;">${val.quantity > 0 ? val.quantity.toLocaleString() : "—"}</td>
            <td style="padding:7px 8px; text-align:left; direction:ltr; font-weight:bold; color:#b91c1c;">${formatVal(val.total)} ج.م</td>
            <td style="padding:7px 8px; text-align:center; color:#475569; font-weight:bold;">${pct}%</td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94a3b8;">لا توجد مصروفات مسجلة للفترة</td></tr>`;

      // Build Payments rows
      const paymentsList = reportData.paymentsList || [];
      const paymentRowsHtml = paymentsList.length > 0 ? paymentsList.map((p: any) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:7px 8px; font-size:11px; color:#475569; font-weight:500; text-align:right;">${p.date}</td>
          <td style="padding:7px 8px; text-align:center;">
            <span style="font-size:10px; padding:2px 8px; border-radius:10px; font-weight:bold; background:${p.type === 'revenue' ? '#dcfce7' : '#fee2e2'}; color:${p.type === 'revenue' ? '#166534' : '#991b1b'};">
              ${p.type === 'revenue' ? 'قبض (إيراد)' : 'دفع (مصروف)'}
            </span>
          </td>
          <td style="padding:7px 8px; font-weight:bold; font-size:12px; color:#1e293b; text-align:right;">${p.clientName}</td>
          <td style="padding:7px 8px; text-align:left; direction:ltr; font-weight:bold; font-size:12px; color:${p.type === 'revenue' ? '#15803d' : '#b91c1c'};">
            ${p.type === 'revenue' ? '+' : '-'}${formatVal(p.amount)} ج.م
          </td>
          <td style="padding:7px 8px; font-size:11px; color:#64748b; max-width:180px; text-align:right;">${p.notes || "—"}</td>
        </tr>
      `).join("") : `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94a3b8;">لا توجد حركات دفع أو تحصيل للفترة</td></tr>`;

      container.innerHTML = `
        <div style="border:2px solid #3b82f6; border-radius:14px; padding:22px; background:#ffffff; color:#0f172a; direction:rtl; text-align:right; font-family:'Segoe UI', Tahoma, Arial, sans-serif; letter-spacing:normal;">
          
          <!-- Top Brand & Header Table -->
          <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #e2e8f0; margin-bottom:14px; padding-bottom:12px;">
            <tr>
              <td style="text-align:right; vertical-align:middle;">
                <div style="display:inline-block; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; font-size:11px; font-weight:bold; padding:2px 10px; border-radius:12px; margin-bottom:6px;">
                  Mazareana Pro | مزارعنا برو
                </div>
                <div style="font-size:20px; color:#1e3a8a; font-weight:bold; margin-bottom:3px;">تقرير الأداء المالي والتحصيلات</div>
                <div style="font-size:13px; font-weight:bold; color:#475569;">مزرعة: ${currentFarm?.name || 'إدارة المزرعة'}</div>
                ${reportData.selectedClient ? `<div style="font-size:12px; color:#2563eb; font-weight:bold; margin-top:3px;">الجهة المحددة: ${reportData.selectedClient.name} (${reportData.selectedClient.type})</div>` : ''}
              </td>
              <td style="text-align:left; vertical-align:middle; direction:ltr;">
                <div style="font-size:11px; color:#64748b;">تاريخ إصدار التقرير: <b style="color:#0f172a;">${nowFormatted}</b></div>
                <div style="font-size:10px; color:#94a3b8; margin-top:2px;">نظام Mazareana Pro المحاسبي</div>
              </td>
            </tr>
          </table>
          
          <!-- Period Banner Table -->
          <table style="width:100%; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:14px; text-align:center; border-collapse:collapse;">
            <tr>
              <td style="padding:9px; font-size:12px; color:#1e40af; font-weight:bold;">نطاق التقرير: ${getReportTypeArabic(reportData.period)}</td>
              <td style="padding:9px; font-size:12px; color:#334155;">الفترة: من <b style="color:#0f172a;">${reportData.startDate}</b> إلى <b style="color:#0f172a;">${reportData.endDate}</b></td>
              <td style="padding:9px; font-size:11px; color:#64748b;">إجمالي الحركات: <b style="color:#0f172a;">${reportData.revenuesCount + reportData.expensesCount + reportData.invoicesCount + reportData.paymentsCount}</b></td>
            </tr>
          </table>
          
          <!-- Key Metric Cards Table (Pure Table, No Flex) -->
          <table style="width:100%; border-collapse:separate; border-spacing:8px; margin-bottom:12px;">
            <tr>
              <td style="width:25%; border:1px solid #bbf7d0; border-radius:8px; padding:10px; text-align:center; background:#f0fdf4;">
                <div style="font-size:11px; color:#166534; font-weight:bold; margin-bottom:3px;">إجمالي الإيرادات</div>
                <div style="font-size:15px; font-weight:bold; color:#15803d; direction:ltr;">${formatVal(reportData.totalRevenues)} ج.م</div>
                <div style="font-size:10px; color:#166534; margin-top:3px;">${reportData.revenuesCount} حركة مسجلة</div>
              </td>
              <td style="width:25%; border:1px solid #fecaca; border-radius:8px; padding:10px; text-align:center; background:#fef2f2;">
                <div style="font-size:11px; color:#991b1b; font-weight:bold; margin-bottom:3px;">إجمالي المصروفات</div>
                <div style="font-size:15px; font-weight:bold; color:#b91c1c; direction:ltr;">${formatVal(reportData.totalExpenses)} ج.م</div>
                <div style="font-size:10px; color:#991b1b; margin-top:3px;">${reportData.expensesCount} حركة مسجلة</div>
              </td>
              <td style="width:25%; border:1px solid ${reportData.netProfit >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius:8px; padding:10px; text-align:center; background:${reportData.netProfit >= 0 ? '#f0fdf4' : '#fef2f2'};">
                <div style="font-size:11px; color:${reportData.netProfit >= 0 ? '#166534' : '#991b1b'}; font-weight:bold; margin-bottom:3px;">صافي الربح الفعلي</div>
                <div style="font-size:15px; font-weight:bold; color:${reportData.netProfit >= 0 ? '#15803d' : '#b91c1c'}; direction:ltr;">${formatVal(reportData.netProfit)} ج.م</div>
                <div style="font-size:10px; color:${reportData.netProfit >= 0 ? '#166534' : '#991b1b'}; margin-top:3px;">هامش ربح: ${reportData.profitMargin}%</div>
              </td>
              <td style="width:25%; border:1px solid #bfdbfe; border-radius:8px; padding:10px; text-align:center; background:#eff6ff;">
                <div style="font-size:11px; color:#1e40af; font-weight:bold; margin-bottom:3px;">صافي حركة الخزينة</div>
                <div style="font-size:15px; font-weight:bold; color:${reportData.netCashFlow >= 0 ? '#1d4ed8' : '#b91c1c'}; direction:ltr;">${formatVal(reportData.netCashFlow)} ج.م</div>
                <div style="font-size:10px; color:#1e40af; margin-top:3px;">حركة السيولة النقدية</div>
              </td>
            </tr>
          </table>

          <!-- Cash Flow & Credit Summary Table -->
          <table style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:16px; text-align:center; border-collapse:collapse;">
            <tr>
              <td style="padding:8px 10px; font-size:11px; color:#334155;">
                المقبوضات النقدية: <b style="color:#15803d; direction:ltr; margin-right:4px;">+${formatVal(reportData.totalCashIn)} ج.م</b>
              </td>
              <td style="padding:8px 10px; font-size:11px; color:#334155; border-right:1px solid #cbd5e1; border-left:1px solid #cbd5e1;">
                المدفوعات النقدية: <b style="color:#b91c1c; direction:ltr; margin-right:4px;">-${formatVal(reportData.totalCashOut)} ج.م</b>
              </td>
              <td style="padding:8px 10px; font-size:11px; color:#334155; border-left:1px solid #cbd5e1;">
                مبيعات آجلة طرف العملاء: <b style="color:#d97706; direction:ltr; margin-right:4px;">${formatVal(reportData.creditRevenues)} ج.م</b>
              </td>
              <td style="padding:8px 10px; font-size:11px; color:#334155;">
                متبقي مستحق للموردين: <b style="color:#dc2626; direction:ltr; margin-right:4px;">${formatVal(reportData.remainingExpenses)} ج.م</b>
              </td>
            </tr>
          </table>

          <!-- Section 1 & 2: Revenue & Expense Breakdown Tables -->
          <table style="width:100%; border-collapse:separate; border-spacing:10px; margin-bottom:14px;">
            <tr>
              <!-- Revenues Table -->
              <td style="width:50%; vertical-align:top; border:1px solid #e2e8f0; border-radius:8px; padding:10px; background:#ffffff;">
                <table style="width:100%; border-collapse:collapse; margin-bottom:6px; border-bottom:1px solid #dcfce7; padding-bottom:4px;">
                  <tr>
                    <td style="font-size:12px; color:#166534; font-weight:bold; text-align:right;">تفصيل الإيرادات حسب البند</td>
                    <td style="font-size:11px; color:#166534; font-weight:bold; text-align:left; direction:ltr;">${formatVal(reportData.totalRevenues)} ج.م</td>
                  </tr>
                </table>
                <table style="width:100%; border-collapse:collapse; font-size:10px;">
                  <thead>
                    <tr style="background:#f0fdf4; border-bottom:1px solid #bbf7d0;">
                      <th style="padding:5px 6px; text-align:right; color:#166534;">البند</th>
                      <th style="padding:5px 6px; text-align:center; color:#166534;">العدد</th>
                      <th style="padding:5px 6px; text-align:center; color:#166534;">الكمية</th>
                      <th style="padding:5px 6px; text-align:left; color:#166534;">المبلغ</th>
                      <th style="padding:5px 6px; text-align:center; color:#166534;">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${revRowsHtml}
                  </tbody>
                </table>
              </td>

              <!-- Expenses Table -->
              <td style="width:50%; vertical-align:top; border:1px solid #e2e8f0; border-radius:8px; padding:10px; background:#ffffff;">
                <table style="width:100%; border-collapse:collapse; margin-bottom:6px; border-bottom:1px solid #fee2e2; padding-bottom:4px;">
                  <tr>
                    <td style="font-size:12px; color:#991b1b; font-weight:bold; text-align:right;">تفصيل المصروفات حسب البند</td>
                    <td style="font-size:11px; color:#991b1b; font-weight:bold; text-align:left; direction:ltr;">${formatVal(reportData.totalExpenses)} ج.م</td>
                  </tr>
                </table>
                <table style="width:100%; border-collapse:collapse; font-size:10px;">
                  <thead>
                    <tr style="background:#fef2f2; border-bottom:1px solid #fecaca;">
                      <th style="padding:5px 6px; text-align:right; color:#991b1b;">البند</th>
                      <th style="padding:5px 6px; text-align:center; color:#991b1b;">العدد</th>
                      <th style="padding:5px 6px; text-align:center; color:#991b1b;">الكمية</th>
                      <th style="padding:5px 6px; text-align:left; color:#991b1b;">المبلغ</th>
                      <th style="padding:5px 6px; text-align:center; color:#991b1b;">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${expRowsHtml}
                  </tbody>
                </table>
              </td>
            </tr>
          </table>

          <!-- Section 3: Payments Log Table -->
          ${(reportData.includePayments && paymentsList.length > 0) ? `
            <div style="border:1px solid #cbd5e1; border-radius:8px; padding:10px; margin-bottom:14px; background:#ffffff;">
              <table style="width:100%; border-collapse:collapse; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
                <tr>
                  <td style="font-size:12px; color:#1e293b; font-weight:bold; text-align:right;">
                    سجل الدفعات والتحصيلات النقدية للفترة (${paymentsList.length} حركة)
                  </td>
                  <td style="font-size:10px; color:#64748b; text-align:left;">
                    (مقبوضات + مدفوعات نقدية)
                  </td>
                </tr>
              </table>
              <table style="width:100%; border-collapse:collapse; font-size:10px;">
                <thead>
                  <tr style="background:#f8fafc; border-bottom:2px solid #cbd5e1;">
                    <th style="padding:5px 6px; text-align:right; color:#334155;">التاريخ</th>
                    <th style="padding:5px 6px; text-align:center; color:#334155;">نوع المعاملة</th>
                    <th style="padding:5px 6px; text-align:right; color:#334155;">الجهة (العميل / المورد)</th>
                    <th style="padding:5px 6px; text-align:left; color:#334155;">المبلغ</th>
                    <th style="padding:5px 6px; text-align:right; color:#334155;">البيان والملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRowsHtml}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Metadata & Quality Verification Table -->
          <table style="width:100%; border-collapse:collapse; border-top:1px solid #e2e8f0; margin-top:10px; padding-top:8px;">
            <tr>
              <td style="font-size:10px; color:#64748b; text-align:right;">
                إجمالي العملاء المسجلين: <b style="color:#0f172a;">${reportData.clientsCount}</b>
                <span style="margin:0 8px;">|</span>
                إجمالي الشركاء: <b style="color:#0f172a;">${reportData.partnersCount}</b>
              </td>
              <td style="font-size:10px; color:#15803d; font-weight:bold; text-align:left;">
                معتمد رسمياً من إدارة المزرعة
              </td>
            </tr>
          </table>
          
          <div style="margin-top:10px; text-align:center; font-size:9px; color:#94a3b8; border-top:1px dashed #e2e8f0; padding-top:6px;">
            تم استخراج هذا التقرير تلقائياً بواسطة تطبيق Mazareana Pro لإدارة المزارع والإنتاج الحيواني
          </div>
        </div>
      `;

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

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
      
      const fileName = `تقرير_${getReportTypeArabic(reportData.period)}_${currentFarm?.name || 'مزرعة'}_${new Date().toISOString().split("T")[0]}.pdf`;
      const dataUri = pdf.output("datauristring");
      const base64Data = dataUri.split(",")[1];

      const triggerDownload = () => {
        pdf.save(fileName);
        toast.success("تم تصدير تقرير PDF بنجاح");
      };

      await shareFileNatively(fileName, base64Data, triggerDownload);

      document.body.removeChild(container);
    } catch (err) {
      console.error(err);
      toast.error("فشل إنشاء PDF");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ===== Farms =====
  const handleAddFarm = () => {
    if (newFarm.name && newFarm.type) {
      const computedDays = calculateFlockAgeDays(newFarm.cycleStartDate);
      addFarm({
        ...newFarm,
        flockAge: `${computedDays} يوم`
      });
      setNewFarm({
        name: "",
        type: "دواجن",
        location: "",
        description: "",
        capacity: "15,000 طائر",
        cycleStartDate: new Date().toISOString().split('T')[0],
        flockAge: "24 يوم",
        mortalityRate: "1.2%",
        currentCycle: "الدورة الأولى 2026",
        status: "نشطة"
      });
      setShowEditFarm(false);
      toast.success("تمت إضافة المزرعة بنجاح");
    } else {
      toast.error("يرجى إدخال اسم المزرعة");
    }
  };

  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setNewFarm({
      name: farm.name || "",
      type: farm.type || "دواجن",
      location: farm.location || "",
      description: farm.description || "",
      capacity: farm.capacity || "15,000 طائر",
      cycleStartDate: farm.cycleStartDate || new Date().toISOString().split('T')[0],
      flockAge: farm.flockAge || `${calculateFlockAgeDays(farm.cycleStartDate)} يوم`,
      mortalityRate: farm.mortalityRate || "1.2%",
      currentCycle: farm.currentCycle || "الدورة الأولى 2026",
      status: farm.status || "نشطة"
    });
    setShowEditFarm(true);
  };

  const handleUpdateFarm = () => {
    if (editingFarm && newFarm.name && newFarm.type) {
      const computedDays = calculateFlockAgeDays(newFarm.cycleStartDate);
      updateFarm({
        ...editingFarm,
        ...newFarm,
        flockAge: `${computedDays} يوم`
      });
      setEditingFarm(null);
      setNewFarm({
        name: "",
        type: "دواجن",
        location: "",
        description: "",
        capacity: "15,000 طائر",
        cycleStartDate: new Date().toISOString().split('T')[0],
        flockAge: "24 يوم",
        mortalityRate: "1.2%",
        currentCycle: "الدورة الأولى 2026",
        status: "نشطة"
      });
      setShowEditFarm(false);
      toast.success("تم تحديث كافة بيانات المزرعة بنجاح");
    }
  };
  const handleDeleteFarm = (id: string) => { if (farms.length > 1) deleteFarm(id); };



  // Filtered payments list
  const filteredPayments = allPayments.filter(p => {
    if (payMonth !== "all") {
      const pMonth = p.date.substring(0, 7); // "YYYY-MM"
      if (pMonth !== payMonth) return false;
    }
    if (payType !== "all" && p.type !== payType) return false;
    if (payClient !== "all" && p.clientId !== payClient) return false;
    if (paySearchTerm.trim()) {
      const term = paySearchTerm.toLowerCase();
      const matchClient = (p.clientName || "").toLowerCase().includes(term);
      const matchNotes = (p.notes || "").toLowerCase().includes(term);
      const matchAmount = String(p.amount).includes(term);
      if (!matchClient && !matchNotes && !matchAmount) return false;
    }
    return true;
  });

  // Filtered invoices list for Invoices tab
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceStatusFilter !== "all" && inv.status !== invoiceStatusFilter) return false;
    if (invoiceSearchQuery.trim()) {
      const q = invoiceSearchQuery.toLowerCase();
      const matchClient = (inv.clientName || "").toLowerCase().includes(q);
      const matchNum = (inv.number || "").toLowerCase().includes(q);
      if (!matchClient && !matchNum) return false;
    }
    return true;
  }).sort(sortByDateDesc);

  // Extract list of months with payments
  const availableMonths = Array.from(
    new Set(allPayments.map(p => p.date.substring(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-3.5">
      {/* Header Row with Logout Button matching Main.dc.html */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div>
          <h1 className="text-xl font-bold text-[#1B2437] dark:text-white leading-tight">إعدادات النظام والبيانات</h1>
          <p className="text-[12px] text-[#6B7686] dark:text-slate-400 leading-relaxed">إدارة شاملة للنظام والمزارع</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="h-[36px] px-3.5 rounded-[12px] border border-[#E11D48] text-[#E11D48] bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-[13px] flex items-center justify-center shrink-0 cursor-pointer transition active:scale-95"
        >
          تسجيل الخروج
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="space-y-3.5">
        {/* Styled Tabs Bar with 4 main tabs and distinctive icons */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#E3E8EF] dark:bg-slate-800/90 rounded-[16px]">
          {[
            { id: "general", label: "العامة", icon: SlidersHorizontal },
            { id: "invoices", label: "الفواتير", icon: Receipt },
            { id: "payments", label: "المدفوعات", icon: CreditCard },
            { id: "reports", label: "التقارير", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchParams({ tab: tab.id })}
                className={cn(
                  "flex-1 h-[42px] px-2 rounded-[12px] border-0 text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                  isActive
                    ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-[0_1px_3px_rgba(27,36,55,0.15)] scale-[1.02]"
                    : "bg-transparent text-[#4B5565] dark:text-slate-400 hover:text-[#1B2437] dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-[#2F5FE3] dark:text-blue-300" : "text-[#6B7686] dark:text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* === General (العامة) Content matching Main.dc.html === */}
        <TabsContent value="general" className="flex flex-col gap-3.5 pt-1">
          {/* 1. كارت المزارع */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-[34px] h-[34px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[15px] font-bold text-[#1B2437] dark:text-white flex-1">المزارع</span>
              <button
                type="button"
                onClick={() => {
                  setEditingFarm(null);
                  setNewFarm({
                    name: "",
                    type: "دواجن",
                    location: "",
                    description: "",
                    capacity: "15,000 طائر",
                    cycleStartDate: new Date().toISOString().split('T')[0],
                    flockAge: "24 يوم",
                    mortalityRate: "1.2%",
                    currentCycle: "الدورة الأولى 2026",
                    status: "نشطة"
                  });
                  setShowEditFarm(true);
                }}
                className="h-[36px] px-3.5 rounded-[12px] bg-[#2F5FE3] hover:bg-blue-700 text-white font-semibold text-[13px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
              >
                + إضافة مزرعة
              </button>
            </div>

            {/* Current Farm Selector */}
            <div className="text-[12px] text-[#6B7686] dark:text-slate-400 mb-1.5 font-medium">المزرعة الحالية</div>
            <button
              type="button"
              onClick={() => setShowFarmListDropdown(!showFarmListDropdown)}
              className="w-full h-[48px] rounded-[14px] border-2 border-[#2F5FE3] bg-white dark:bg-slate-800 text-[14px] font-bold text-[#1B2437] dark:text-white flex items-center justify-between px-3.5 transition active:scale-99 cursor-pointer"
            >
              <span>{currentFarm?.name || "اختر مزرعة"}</span>
              <ChevronDown className={cn("w-[18px] h-[18px] text-[#2F5FE3] transition-transform duration-200", showFarmListDropdown && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {showFarmListDropdown && (
              <div className="mt-2 border border-[#D9E0EA] dark:border-slate-700 rounded-[14px] bg-white dark:bg-slate-800 shadow-[0_8px_20px_rgba(27,36,55,0.12)] overflow-hidden">
                <div className="p-2 border-b border-[#EDF0F5] dark:border-slate-700">
                  <label className="flex items-center gap-2 h-[40px] rounded-[10px] bg-[#F3F5F8] dark:bg-slate-900 px-3 text-[#6B7686] dark:text-slate-400">
                    <Search className="w-4 h-4 shrink-0" />
                    <input
                      value={farmSearchQuery}
                      onChange={(e) => setFarmSearchQuery(e.target.value)}
                      placeholder="ابحث عن مزرعة"
                      className="flex-1 min-w-0 border-0 bg-transparent text-[14px] text-[#1B2437] dark:text-slate-100 outline-none"
                    />
                  </label>
                </div>

                <div className="max-h-[170px] overflow-y-auto p-1.5 flex flex-col gap-1">
                  {farms
                    .filter((f) => !farmSearchQuery.trim() || f.name.toLowerCase().includes(farmSearchQuery.toLowerCase()))
                    .map((farm) => {
                      const isSelected = currentFarm?.id === farm.id;
                      return (
                        <div
                          key={farm.id}
                          onClick={() => {
                            setCurrentFarm(farm);
                            setShowFarmListDropdown(false);
                            triggerHaptic('light');
                            toast.success(`تم التبديل إلى مزرعة: ${farm.name}`);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 min-h-[52px] p-2 px-2.5 rounded-[10px] cursor-pointer transition select-none",
                            isSelected ? "bg-[#EEF4FF] dark:bg-blue-950/50" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          )}
                        >
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "bg-[#2F5FE3] text-white"
                                : "border-2 border-[#A3ACBA] dark:border-slate-500"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100 truncate">{farm.name}</div>
                            <div className="text-[12px] text-[#6B7686] dark:text-slate-400">
                              {isSelected ? "الحالية" : (farm.type || "مزرعة")}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFarm(farm);
                            }}
                            className="w-9 h-9 rounded-[12px] border border-[#D9E0EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#3F4A5C] dark:text-slate-300 flex items-center justify-center shrink-0 hover:text-[#2F5FE3] hover:border-[#2F5FE3] transition"
                            title="إدارة المزرعة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowFarmListDropdown(false);
                    setSearchParams({ tab: "farms" });
                  }}
                  className="w-full h-[44px] border-0 border-t border-[#EDF0F5] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900/60 text-[13px] font-semibold text-[#2F5FE3] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900 transition flex items-center justify-center cursor-pointer"
                >
                  إدارة كل المزارع (ترتيب وحذف)
                </button>
              </div>
            )}

            {/* Farm Switch Mode */}
            <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-200 mt-4 mb-2">طريقة التبديل بين المزارع</div>
            <div className="flex gap-1 bg-[#EDF0F5] dark:bg-slate-900 rounded-[14px] p-1">
              <button
                type="button"
                onClick={() => handleSetFarmSwitchMode("both")}
                className={cn(
                  "flex-1 h-[40px] rounded-[11px] border-0 text-[13px] font-semibold transition cursor-pointer",
                  farmSwitchMode === "both"
                    ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-[0_1px_3px_rgba(20,35,27,0.15)] font-bold"
                    : "bg-transparent text-[#3F4A5C] dark:text-slate-400 hover:text-[#1B2437]"
                )}
              >
                كلاهما
              </button>
              <button
                type="button"
                onClick={() => handleSetFarmSwitchMode("swipe_only")}
                className={cn(
                  "flex-1 h-[40px] rounded-[11px] border-0 text-[13px] font-semibold transition cursor-pointer",
                  farmSwitchMode === "swipe_only"
                    ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-[0_1px_3px_rgba(20,35,27,0.15)] font-bold"
                    : "bg-transparent text-[#3F4A5C] dark:text-slate-400 hover:text-[#1B2437]"
                )}
              >
                سحب الكارت
              </button>
              <button
                type="button"
                onClick={() => handleSetFarmSwitchMode("header_only")}
                className={cn(
                  "flex-1 h-[40px] rounded-[11px] border-0 text-[13px] font-semibold transition cursor-pointer",
                  farmSwitchMode === "header_only"
                    ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-[0_1px_3px_rgba(20,35,27,0.15)] font-bold"
                    : "bg-transparent text-[#3F4A5C] dark:text-slate-400 hover:text-[#1B2437]"
                )}
              >
                القائمة العلوية
              </button>
            </div>
            <div className="text-[12px] text-[#6B7686] dark:text-slate-400 leading-relaxed mt-2">
              {farmSwitchMode === "both" && "التبديل من القائمة العلوية وأيضاً بسحب كارت المزرعة يميناً أو يساراً من لوحة التحكم (موصى به)."}
              {farmSwitchMode === "swipe_only" && "التبديل فقط بسحب كارت المزرعة يميناً ويساراً مع إخفاء القائمة العلوية."}
              {farmSwitchMode === "header_only" && "التبديل عبر القائمة المنسدلة في أعلى الشاشة فقط وإيقاف السحب."}
            </div>
          </div>

          {/* 2. كارت المظهر */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 pb-1 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700">
            <div className="flex items-center gap-2.5 mb-2.5 font-bold text-[15px] text-[#1B2437] dark:text-white">
              <span className="w-[34px] h-[34px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Moon className="w-[18px] h-[18px]" />
              </span>
              <span>المظهر</span>
            </div>
            <div className="flex items-center justify-between gap-3 min-h-[52px]">
              <div>
                <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100">الوضع الليلي</div>
                <div className="text-[12px] text-[#6B7686] dark:text-slate-400">خلفية داكنة مريحة للعين</div>
              </div>
              <ToggleSwitch
                checked={settings.darkMode}
                onChange={() => toggleSetting("darkMode")}
                label="الوضع الليلي"
              />
            </div>
          </div>

          {/* 3. كارت التفضيلات */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 pb-1 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700">
            <div className="flex items-center gap-2.5 mb-2.5 font-bold text-[15px] text-[#1B2437] dark:text-white">
              <span className="w-[34px] h-[34px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Bell className="w-[18px] h-[18px]" />
              </span>
              <span>التفضيلات</span>
            </div>

            {/* Row 1: التنبيهات المالية */}
            <div className="flex items-center justify-between gap-3 min-h-[52px]">
              <div>
                <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100">التنبيهات المالية</div>
                <div className="text-[12px] text-[#6B7686] dark:text-slate-400">إشعارات الهاتف الفورية</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={testPhoneNotification}
                  className="h-[36px] px-3.5 rounded-[12px] border border-[#D9E0EA] dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-semibold text-[#1B2437] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer"
                >
                  تجربة إشعار
                </button>
                <ToggleSwitch
                  checked={settings.notifications}
                  onChange={() => {
                    toggleSetting("notifications");
                    if (!settings.notifications) {
                      sendPhoneNotification("المنظومة المالية", "تم تفعيل التنبيهات وإشعارات الهاتف بنجاح!");
                    }
                  }}
                  label="التنبيهات المالية"
                />
              </div>
            </div>

            {/* Row 2: الاهتزاز عند الحفظ */}
            <div className="flex items-center justify-between gap-3 min-h-[52px] border-t border-[#EDF0F5] dark:border-slate-700/60">
              <div>
                <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100">الاهتزاز عند الحفظ</div>
                <div className="text-[12px] text-[#6B7686] dark:text-slate-400">عند حفظ العمليات وتسجيل السداد</div>
              </div>
              <ToggleSwitch
                checked={settings.haptics !== false}
                onChange={() => {
                  const nextState = !(settings.haptics !== false);
                  updateSetting("haptics", nextState);
                  setHapticsEnabled(nextState);
                  if (nextState) {
                    triggerHaptic('success');
                    toast.success('تم تشغيل الاهتزاز بنجاح');
                  } else {
                    toast.info('تم إيقاف الاهتزاز');
                  }
                }}
                label="الاهتزاز"
              />
            </div>

            {/* Row 3: العملة */}
            <div className="flex items-center justify-between gap-3 min-h-[52px] border-t border-[#EDF0F5] dark:border-slate-700/60">
              <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100">العملة</div>
              <select
                value={settings.currency}
                onChange={(e) => updateSetting("currency", e.target.value)}
                className="bg-transparent border-0 text-[#2F5FE3] dark:text-blue-400 font-semibold text-[14px] cursor-pointer outline-none text-left"
                dir="ltr"
              >
                <option value="EGP">جنيه مصري (ج.م)</option>
                <option value="SAR">ريال سعودي (ر.س)</option>
                <option value="USD">دولار أمريكي ($)</option>
              </select>
            </div>
          </div>

          {/* 4. كارت النسخ الاحتياطي والتصدير */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-[15px] text-[#1B2437] dark:text-white">
              <span className="w-[34px] h-[34px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Cloud className="w-[18px] h-[18px]" />
              </span>
              <span>النسخ الاحتياطي والتصدير</span>
            </div>
            <div className="text-[12px] text-[#6B7686] dark:text-slate-400 leading-relaxed -mt-1">
              Google Drive — حفظ واسترجاع يدوي عبر تطبيق Drive بالهاتف.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToGoogleDriveApp}
                disabled={isSavingToDrive}
                className="h-[44px] rounded-[12px] bg-[#2F5FE3] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[14px] flex items-center justify-center gap-1.5 flex-1 cursor-pointer transition active:scale-98 shadow-xs"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSavingToDrive ? "جاري الفتح..." : "حفظ في Drive"}</span>
              </button>
              <button
                type="button"
                onClick={() => googleDriveFileInputRef.current?.click()}
                className="h-[44px] rounded-[12px] border border-[#D9E0EA] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B2437] dark:text-slate-100 font-semibold text-[14px] flex items-center justify-center gap-1.5 flex-1 cursor-pointer transition active:scale-98"
              >
                <Folder className="w-4 h-4 text-[#2F5FE3]" />
                <span>استرجاع من Drive</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="h-[44px] rounded-[12px] border border-[#D9E0EA] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B2437] dark:text-slate-100 font-semibold text-[14px] flex items-center justify-center gap-1.5 flex-1 cursor-pointer transition active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>تصدير ملف</span>
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("import-backup-file")?.click()}
                className="h-[44px] rounded-[12px] border border-[#D9E0EA] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B2437] dark:text-slate-100 font-semibold text-[14px] flex items-center justify-center gap-1.5 flex-1 cursor-pointer transition active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>استيراد ملف</span>
              </button>
            </div>

            <input
              ref={googleDriveFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleRestoreFromGoogleDriveFile}
            />
            <input
              type="file"
              accept=".json,application/json,text/plain,*/*"
              onChange={handleImportBackup}
              className="hidden"
              id="import-backup-file"
            />

            <div className="flex items-center justify-between gap-3 min-h-[52px] border-t border-[#EDF0F5] dark:border-slate-700/60 pt-1">
              <div className="text-[14px] font-semibold text-[#1B2437] dark:text-slate-100">تصدير الفواتير بصيغة PDF</div>
              <ToggleSwitch
                checked={settings.pdfExport}
                onChange={() => toggleSetting("pdfExport")}
                label="تصدير الفواتير بصيغة PDF"
              />
            </div>
          </div>

          {/* 5. كارت الترخيص ومعلومات الجهاز */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-[34px] h-[34px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-[18px] h-[18px]" />
                </span>
                <span className="text-[15px] font-bold text-[#1B2437] dark:text-white">الترخيص ومعلومات الجهاز</span>
              </div>
              <span className="text-[12px] font-semibold px-2.5 py-1 rounded-[12px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-300 border border-[#B9D1FB] dark:border-blue-800/60">
                مفعّل بنجاح
              </span>
            </div>

            <div className="bg-[#F3F5F8] dark:bg-slate-900/60 rounded-[14px] p-1 px-3.5 space-y-0 text-sm">
              <div className="flex items-center justify-between min-h-[44px]">
                <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">معرّف الجهاز</span>
                <span className="flex items-center gap-2 font-bold font-mono text-[#B45309] dark:text-amber-400">
                  <span>{currentDeviceId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentDeviceId);
                      triggerHaptic('light');
                      toast.success("تم نسخ معرّف الجهاز");
                    }}
                    className="text-[#6B7686] hover:text-[#2F5FE3] p-1 rounded transition cursor-pointer"
                    title="نسخ معرّف الجهاز"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between min-h-[44px] border-t border-[#EDF0F5] dark:border-slate-800">
                <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">كود تفعيل الجهاز</span>
                <span className="flex items-center gap-2 font-bold font-mono text-[#2F4FB8] dark:text-blue-400">
                  <span>{currentActivationKey}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentActivationKey);
                      triggerHaptic('light');
                      toast.success("تم نسخ كود التفعيل");
                    }}
                    className="text-[#6B7686] hover:text-[#2F5FE3] p-1 rounded transition cursor-pointer"
                    title="نسخ كود التفعيل"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between min-h-[44px] border-t border-[#EDF0F5] dark:border-slate-800">
                <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">نوع الترخيص والباقة</span>
                <span className="font-bold text-[#2F5FE3] dark:text-blue-400">
                  {licenseInfo?.plan === 'monthly'
                    ? 'الباقة الشهرية (٣٠ يوماً)'
                    : licenseInfo?.plan === 'yearly'
                    ? 'الباقة السنوية (٣٦٥ يوماً)'
                    : 'ترخيص دائم (مدى الحياة)'}
                </span>
              </div>

              {/* تاريخ التفعيل */}
              {licenseInfo?.activatedAt && (
                <div className="flex items-center justify-between min-h-[44px] border-t border-[#EDF0F5] dark:border-slate-800">
                  <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">تاريخ التفعيل</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {new Date(licenseInfo.activatedAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}

              {/* تاريخ الانتهاء */}
              <div className="flex items-center justify-between min-h-[44px] border-t border-[#EDF0F5] dark:border-slate-800">
                <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">صلاحية الاشتراك</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {licenseInfo?.plan === 'lifetime'
                    ? 'صلاحية مفتوحة (مدى الحياة)'
                    : licenseInfo?.expiryDate
                    ? new Date(licenseInfo.expiryDate).toLocaleDateString('ar-EG')
                    : 'سارٍ'}
                </span>
              </div>

              {/* عداد الأيام المتبقية للباقات المحددة */}
              {licenseInfo?.daysRemaining !== null && licenseInfo?.daysRemaining !== undefined && (
                <div className="flex items-center justify-between min-h-[44px] border-t border-[#EDF0F5] dark:border-slate-800">
                  <span className="text-[12px] text-[#6B7686] dark:text-slate-400 font-medium">المدة المتبقية</span>
                  <span
                    className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                      licenseInfo.daysRemaining <= 3
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : licenseInfo.daysRemaining <= 7
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {licenseInfo.daysRemaining === 0 ? 'ينتهي اليوم' : `متبقي ${licenseInfo.daysRemaining} يوماً`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 6. كارت إعادة ضبط المصنع */}
          <div className="bg-[#FFF5F7] dark:bg-rose-950/20 rounded-[18px] p-4 flex items-center justify-between gap-3 shadow-[0_0_0_1px_#F6C7D0] dark:shadow-none dark:border dark:border-rose-900/50">
            <div>
              <div className="text-[14px] font-semibold text-[#E11D48]">إعادة ضبط المصنع</div>
              <div className="text-[12px] text-[#6B7686] dark:text-slate-400">مسح كافة البيانات والعودة للوضع الافتراضي.</div>
            </div>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="h-[36px] px-3.5 rounded-[12px] border border-[#E11D48] bg-white dark:bg-slate-800 text-[#E11D48] font-semibold text-[13px] flex items-center justify-center shrink-0 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95 cursor-pointer"
            >
              إعادة ضبط
            </button>
          </div>
        </TabsContent>
        {/* === Appearance === */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-soft">
            <div className="p-6 border-b">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> إعدادات المظهر
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-base font-medium">الوضع الليلي / النهاري</Label>
                  <p className="text-sm text-muted-foreground">تبديل سمة الواجهة</p>
                </div>
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch checked={settings.darkMode} onCheckedChange={() => toggleSetting("darkMode")} />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-base font-medium">اللغة</Label>
                  <p className="text-sm text-muted-foreground">لغة واجهة النظام</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => updateSetting("language", v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* === Farms === */}
        <TabsContent value="farms" className="space-y-6">
          <Card className="shadow-soft">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> إدارة المزارع
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <FarmSelector />
                  <Button onClick={() => { 
                    setEditingFarm(null); 
                    setNewFarm({ 
                      name: "", 
                      type: "دواجن", 
                      location: "", 
                      description: "",
                      capacity: "15,000 طائر",
                      cycleStartDate: new Date().toISOString().split('T')[0],
                      flockAge: "24 يوم",
                      mortalityRate: "1.2%",
                      currentCycle: "الدورة الأولى 2026",
                      status: "نشطة"
                    }); 
                    setShowEditFarm(true); 
                  }} size="icon" title="إضافة مزرعة">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {farms.map((farm) => (
                <div key={farm.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 mt-0.5">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-bold flex flex-wrap items-center gap-2">
                        {farm.name}
                        {currentFarm?.id === farm.id && <Badge variant="default">الحالية</Badge>}
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                          {farm.type}
                        </span>
                      </h5>
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{farm.location || "الموقع غير محدد"}</span>
                      </p>
                      {/* Farm details pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          🏠 السعة: {farm.capacity || "15,000 طائر"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          📉 النفوق: {farm.mortalityRate || "1.2%"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          🐥 عمر القطيع: {calculateFlockAgeDays(farm.cycleStartDate)} يوم
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          📅 {farm.currentCycle || "الدورة الأولى 2026"}
                        </span>
                      </div>
                      {farm.description && <p className="text-xs text-muted-foreground mt-1.5">{farm.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center self-end sm:self-center shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditFarm(farm)} className="gap-1 text-xs">
                      <Edit className="h-4 w-4" /> تعديل
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteFarm(farm.id)} disabled={farms.length <= 1} className="gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                      <Trash2 className="h-4 w-4" /> حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* === Partners === */}
        <TabsContent value="partners" className="space-y-6">
          <PartnersView />
        </TabsContent>

        {/* === Clients === */}
        <TabsContent value="clients" className="space-y-6">
          <Card className="shadow-soft">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" /> العملاء ({clients.length})
              </h3>
              <Button asChild size="sm">
                <Link to="/clients"><Plus className="h-4 w-4 ml-1" /> إدارة العملاء</Link>
              </Button>
            </div>
            <div className="p-6">
              {clients.length === 0 ? (
                <div className="text-center py-10">
                  <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">لا يوجد عملاء بعد</p>
                  <Button asChild><Link to="/clients">إضافة أول عميل</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {clients.slice(0, 5).map((c: any) => {
                    const { balance } = getClientTotals(c.id);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center text-primary font-bold">
                            {c.name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone || c.email || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left font-semibold text-xs">
                            {c.type === "مورد" ? (
                              <span className="text-warning">متبقي له: {balance.toLocaleString()} ج.م</span>
                            ) : (
                              <span className={balance > 0 ? "text-destructive" : "text-success"}>
                                {balance > 0 ? `مديونية: ${balance.toLocaleString()} ج.م` : "خالي من الديون"}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline">{c.type || "عميل"}</Badge>
                        </div>
                      </div>
                    );
                  })}
                  {clients.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/clients">عرض كل العملاء ({clients.length}) <ArrowLeft className="h-4 w-4 mr-1" /></Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* === Invoices (الفواتير) === */}
        <TabsContent value="invoices" className="space-y-4 pt-1">
          {/* Header & Quick Action */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-[36px] h-[36px] rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-[#1B2437] dark:text-white">الفواتير وسندات القبض</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F5FE3] dark:bg-blue-950/60 dark:text-blue-300">
                      {invoices.length} فاتورة
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7686] dark:text-slate-400">إدارة ومتابعة فواتير البيع والشراء المسجلة بالنظام</p>
                </div>
              </div>
              <Button asChild className="h-[40px] px-4 rounded-[12px] bg-[#2F5FE3] hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs transition active:scale-95">
                <Link to="/invoices">
                  <Plus className="w-4 h-4" />
                  <span>إنشاء وإدارة الفواتير</span>
                </Link>
              </Button>
            </div>

            {/* 4 Invoices Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-[#EDF0F5] dark:border-slate-700/60">
              <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-[#6B7686] dark:text-slate-400">إجمالي الفواتير</div>
                <div className="text-lg font-bold text-[#1B2437] dark:text-white mt-0.5">{invoices.length}</div>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-[#6B7686] dark:text-slate-400">القيمة الإجمالية</div>
                <div className="text-base sm:text-lg font-bold text-[#2F5FE3] dark:text-blue-400 mt-0.5">
                  {invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()} <span className="text-[10px] font-normal">ج.م</span>
                </div>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">مسددة بالكامل</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {invoices.filter(i => i.status === "مدفوعة").length}
                </div>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">آجلة / غير مسددة</div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {invoices.filter(i => i.status !== "مدفوعة").length}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-3 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7686] pointer-events-none" />
              <input
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                className="w-full h-[40px] pr-9 pl-3 rounded-[12px] bg-[#F3F5F8] dark:bg-slate-900 text-xs text-[#1B2437] dark:text-white border-0 outline-none"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#EDF0F5] dark:bg-slate-900 rounded-[12px] p-1 w-full sm:w-auto shrink-0">
              {[
                { id: "all", label: "الكل" },
                { id: "مدفوعة", label: "المسددة" },
                { id: "غير مدفوعة", label: "الآجلة" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInvoiceStatusFilter(f.id)}
                  className={cn(
                    "flex-1 sm:flex-none px-3 h-[32px] rounded-[9px] text-xs font-bold transition cursor-pointer",
                    invoiceStatusFilter === f.id
                      ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-2xs"
                      : "text-[#6B7686] dark:text-slate-400 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Cards List */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-8 text-center border border-dashed border-[#D9E0EA] dark:border-slate-700 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-[#1B2437] dark:text-slate-200">لا توجد فواتير مطابقة للبحث</p>
              <p className="text-xs text-[#6B7686] dark:text-slate-400">يمكنك إنشاء فاتورة جديدة أو تغيير شروط الفلترة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#EDF0F5] dark:border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[8px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {inv.number || `#${inv.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[11px] text-[#6B7686] dark:text-slate-400">{inv.date}</span>
                    </div>
                    <span className={cn(
                      "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                      inv.status === "مدفوعة"
                        ? "bg-[#EAF0FF] text-[#2F5FE3] border-[#B9D1FB] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                        : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    )}>
                      {inv.status || "مدفوعة"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#1B2437] dark:text-white">{inv.clientName || "عميل عام"}</div>
                      <div className="text-[11px] text-[#6B7686] dark:text-slate-400 mt-0.5">
                        {inv.type || "بيع"} • {inv.paymentMethod || "نقدي"}
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <div className="text-base font-extrabold text-[#2F5FE3] dark:text-blue-400">
                        {Number(inv.totalAmount || 0).toLocaleString()} <span className="text-[11px] font-sans">ج.م</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {Array.isArray(inv.items) ? `${inv.items.length} بنود` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#EDF0F5] dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-[#2F5FE3] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 px-2.5">
                      <Link to="/invoices">
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض وطباعة</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === Payments (المدفوعات) === */}
        <TabsContent value="payments" className="space-y-4 pt-1">
          {/* 4 Financial Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-3.5 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B7686] dark:text-slate-400">المقبوضات النقدية</span>
                <span className="w-7 h-7 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
              <div className="text-[10px] text-slate-400">{payments.length} حركة تحصيل</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-3.5 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B7686] dark:text-slate-400">المدفوعات النقدية</span>
                <span className="w-7 h-7 rounded-[8px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                -{expensePayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
              </div>
              <div className="text-[10px] text-slate-400">{expensePayments.length} حركة سداد</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-3.5 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B7686] dark:text-slate-400">صافي الخزينة</span>
                <span className="w-7 h-7 rounded-[8px] bg-blue-50 dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              {(() => {
                const net = payments.reduce((s, p) => s + (p.amount || 0), 0) - expensePayments.reduce((s, p) => s + (p.amount || 0), 0);
                return (
                  <div className={cn("text-base sm:text-lg font-extrabold font-mono", net >= 0 ? "text-[#2F5FE3] dark:text-blue-400" : "text-rose-600")}>
                    {net >= 0 ? "+" : ""}{net.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
                  </div>
                );
              })()}
              <div className="text-[10px] text-slate-400">الفارق النقدي</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-3.5 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B7686] dark:text-slate-400">إجمالي الحركات</span>
                <span className="w-7 h-7 rounded-[8px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-[#1B2437] dark:text-white font-mono">
                {allPayments.length}
              </div>
              <div className="text-[10px] text-slate-400">معاملة مسجلة</div>
            </div>
          </div>

          {/* Unified Filter Card */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1B2437] dark:text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#2F5FE3]" />
                <span>تصفية وبحث سجل المدفوعات</span>
              </span>
              {(payMonth !== "all" || payType !== "all" || payClient !== "all" || paySearchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setPayMonth("all");
                    setPayType("all");
                    setPayClient("all");
                    setPaySearchTerm("");
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7686] pointer-events-none" />
              <input
                value={paySearchTerm}
                onChange={(e) => setPaySearchTerm(e.target.value)}
                placeholder="ابحث باسم العميل أو المورد أو الملاحظات..."
                className="w-full h-[40px] pr-9 pl-3 rounded-[12px] bg-[#F3F5F8] dark:bg-slate-900 text-xs text-[#1B2437] dark:text-white border-0 outline-none"
              />
            </div>

            {/* Selects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Month */}
              <div>
                <label className="text-[10.5px] font-semibold text-[#6B7686] block mb-1">الشهر</label>
                <Select value={payMonth} onValueChange={setPayMonth}>
                  <SelectTrigger className="h-[38px] rounded-[10px] bg-[#F3F5F8] dark:bg-slate-900 border-0 text-xs font-semibold">
                    <SelectValue placeholder="اختر الشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الشهور</SelectItem>
                    {availableMonths.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <label className="text-[10.5px] font-semibold text-[#6B7686] block mb-1">نوع المعاملة</label>
                <Select value={payType} onValueChange={setPayType}>
                  <SelectTrigger className="h-[38px] rounded-[10px] bg-[#F3F5F8] dark:bg-slate-900 border-0 text-xs font-semibold">
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الدفعات (قبض ودفع)</SelectItem>
                    <SelectItem value="revenue">المقبوضات (إيرادات) فقط</SelectItem>
                    <SelectItem value="expense">المدفوعات (مصروفات) فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client */}
              <div>
                <label className="text-[10.5px] font-semibold text-[#6B7686] block mb-1">الجهة (عميل / مورد)</label>
                <Select value={payClient} onValueChange={setPayClient}>
                  <SelectTrigger className="h-[38px] rounded-[10px] bg-[#F3F5F8] dark:bg-slate-900 border-0 text-xs font-semibold">
                    <SelectValue placeholder="اختر العميل/المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل العملاء والموردين</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client Debt Widget */}
            {payClient !== "all" && (() => {
              const selectedClient = clients.find(c => c.id === payClient);
              if (!selectedClient) return null;
              const clientTotals = getClientTotals(payClient);
              const debtLabel = selectedClient.type === "مورد" 
                ? (clientTotals.balance >= 0 ? "مستحقات المورد علينا" : "رصيدنا الدائن لدى المورد")
                : (clientTotals.balance >= 0 ? "مديونية العميل لنا" : "رصيد العميل الدائن لدينا");
              return (
                <div className="bg-[#EAF0FF] dark:bg-blue-950/40 border border-[#B9D1FB] dark:border-blue-900/60 rounded-[14px] p-3 flex items-center justify-between mt-2">
                  <div>
                    <div className="text-xs font-bold text-[#1B2437] dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2F5FE3]" />
                      <span>{selectedClient.name}</span>
                    </div>
                    <div className="text-[10px] text-[#6B7686] dark:text-slate-400 mt-0.5">تصنيف الحساب: {selectedClient.type}</div>
                  </div>
                  <div className="text-left font-mono">
                    <div className="text-[10px] text-[#6B7686] font-sans">{debtLabel}</div>
                    <div className={cn("text-base font-extrabold", clientTotals.balance === 0 ? "text-slate-500" : (clientTotals.balance > 0 ? "text-rose-600" : "text-emerald-600"))}>
                      {Math.abs(clientTotals.balance).toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Transactions List */}
          {filteredPayments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[18px] p-8 text-center border border-dashed border-[#D9E0EA] dark:border-slate-700 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-[#1B2437] dark:text-slate-200">لا توجد حركات مطابقة للفلاتر المحددة</p>
              <p className="text-xs text-[#6B7686] dark:text-slate-400">جرب اختيار شهر آخر أو مسح حقل البحث</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#6B7686] dark:text-slate-400 px-1">
                سجل الحركات ({filteredPayments.length} حركة)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredPayments.map((p) => {
                  const isRevenue = p.type === "revenue";
                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-800 rounded-[16px] p-3.5 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-2 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0",
                            isRevenue ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          )}>
                            {isRevenue ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </span>
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-[6px] border",
                            isRevenue ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                          )}>
                            {isRevenue ? "قبض (إيراد)" : "دفع (مصروف)"}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B7686] dark:text-slate-400 font-mono">{p.date}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-[13px] font-bold text-[#1B2437] dark:text-white">{p.clientName}</div>
                          <div className="text-[10px] text-[#6B7686]">{p.clientType || "جهة"}</div>
                        </div>
                        <div className={cn("text-base font-extrabold font-mono", isRevenue ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {isRevenue ? "+" : "-"}{p.amount.toLocaleString()} <span className="text-[10px] font-sans">ج.م</span>
                        </div>
                      </div>

                      {p.notes && (
                        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2 rounded-[10px] text-[11px] text-[#6B7686] dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                          {p.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* === Reports (التقارير) === */}
        <TabsContent value="reports" className="space-y-4 pt-1">
          {/* 1. Quick Instant Reports Grid on Top */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#1B2437] dark:text-white">تقارير سريعة بنقرة واحدة</h3>
                  <p className="text-[11px] text-[#6B7686] dark:text-slate-400">استخراج واستعراض التقرير المالي للفترة بضغطة زر</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[8px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {currentFarm?.name || "المزرعة الحالية"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { k: "daily", t: "تقرير اليوم", icon: "📅", desc: "حركة اليوم الحالي" },
                { k: "weekly", t: "تقرير هذا الأسبوع", icon: "📊", desc: "ملخص آخر 7 أيام" },
                { k: "monthly", t: "تقرير هذا الشهر", icon: "📈", desc: "إيرادات ومصروفات الشهر" },
                { k: "yearly", t: "تقرير هذه السنة", icon: "🏢", desc: "المركز السنوي الشامل" },
              ].map((r) => (
                <button
                  key={r.k}
                  type="button"
                  onClick={() => {
                    setPeriodAndDates(r.k);
                    generateReport(r.k);
                  }}
                  disabled={isGeneratingReport}
                  className="bg-[#F8FAFC] dark:bg-slate-900/60 hover:bg-[#EEF4FF] dark:hover:bg-blue-950/40 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700 text-right transition active:scale-95 cursor-pointer flex flex-col justify-between min-h-[90px] group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">{r.icon}</span>
                    <span className="text-[11px] font-bold text-[#2F5FE3] group-hover:underline">استعراض ←</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1B2437] dark:text-white">{r.t}</div>
                    <div className="text-[10px] text-[#6B7686] dark:text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Custom Detailed Financial Report Generator */}
          <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 shadow-[0_0_0_1px_#E4E9F0] dark:shadow-none dark:border dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#EDF0F5] dark:border-slate-700/60">
              <span className="w-8 h-8 rounded-[10px] bg-[#EAF0FF] dark:bg-blue-950/60 text-[#2F5FE3] dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1B2437] dark:text-white">إنشاء تقرير مالي مخصص ومفصل</h3>
                <p className="text-[11px] text-[#6B7686] dark:text-slate-400">حدد نطاق التاريخ والجهة لاستخراج تقرير PDF رسمي معتمد</p>
              </div>
            </div>

            {/* Period Segmented Buttons */}
            <div>
              <label className="text-xs font-bold text-[#1B2437] dark:text-white block mb-1.5">الفترة الزمنية</label>
              <div className="flex flex-wrap gap-1 bg-[#EDF0F5] dark:bg-slate-900 rounded-[12px] p-1">
                {[
                  { k: "daily", t: "اليوم" },
                  { k: "weekly", t: "هذا الأسبوع" },
                  { k: "monthly", t: "هذا الشهر" },
                  { k: "yearly", t: "هذه السنة" },
                  { k: "all", t: "كل الفترات" },
                  { k: "custom", t: "فترة مخصصة" },
                ].map((p) => (
                  <button
                    key={p.k}
                    type="button"
                    onClick={() => setPeriodAndDates(p.k)}
                    className={cn(
                      "flex-1 min-w-[50px] h-[34px] rounded-[9px] text-xs font-bold transition cursor-pointer",
                      reportPeriod === p.k
                        ? "bg-white dark:bg-slate-700 text-[#2F5FE3] dark:text-blue-300 shadow-2xs"
                        : "text-[#6B7686] dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {p.t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F8FAFC] dark:bg-slate-900/60 p-3 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700">
              <div>
                <label className="text-[11px] font-semibold text-[#6B7686] block mb-1">من تاريخ</label>
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => {
                    setReportStartDate(e.target.value);
                    if (reportPeriod !== "custom") setReportPeriod("custom");
                  }}
                  className="h-[38px] rounded-[10px] bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#6B7686] block mb-1">إلى تاريخ</label>
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => {
                    setReportEndDate(e.target.value);
                    if (reportPeriod !== "custom") setReportPeriod("custom");
                  }}
                  className="h-[38px] rounded-[10px] bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Filter Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#1B2437] dark:text-white block mb-1.5">الجهة (عميل / مورد)</label>
                <Select value={reportClientFilter} onValueChange={setReportClientFilter}>
                  <SelectTrigger className="h-[40px] rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900 border-[#E4E9F0] dark:border-slate-700 text-xs font-semibold">
                    <SelectValue placeholder="اختر العميل/المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع العملاء والموردين (تقرير شامل)</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1B2437] dark:text-white block mb-1.5">نوع العمليات</label>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="h-[40px] rounded-[12px] bg-[#F8FAFC] dark:bg-slate-900 border-[#E4E9F0] dark:border-slate-700 text-xs font-semibold">
                    <SelectValue placeholder="اختر نوع العمليات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">شامل كل المعاملات</SelectItem>
                    <SelectItem value="revenues">إيرادات ومبيعات فقط</SelectItem>
                    <SelectItem value="expenses">مصروفات وتشغيل فقط</SelectItem>
                    <SelectItem value="payments">سجل الدفعات والتحصيلات فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Include Payments Switch */}
            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-slate-900/60 rounded-[14px] border border-[#E4E9F0] dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-[#1B2437] dark:text-white">تضمين سجل الدفعات والتحصيلات التفصيلي</div>
                <div className="text-[11px] text-[#6B7686] dark:text-slate-400">إدراج جدول حركات القبض والسداد النقدية داخل التقرير وPDF</div>
              </div>
              <ToggleSwitch
                checked={reportIncludePayments}
                onChange={() => setReportIncludePayments(!reportIncludePayments)}
                label="تضمين سجل الدفعات"
              />
            </div>

            {/* Generate Report Button */}
            <button
              type="button"
              onClick={() => generateReport()}
              disabled={isGeneratingReport}
              className="w-full h-[46px] rounded-[14px] bg-[#2F5FE3] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تحليل وتجميع التقرير...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>إنشاء واستعراض التقرير المالي الشامل</span>
                </>
              )}
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Farm Edit Dialog */}
      <Dialog open={showEditFarm} onOpenChange={setShowEditFarm}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>{editingFarm ? "تعديل تفاصيل المزرعة" : "إضافة مزرعة جديدة بكافة التفاصيل"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">اسم المزرعة *</Label>
                <Input 
                  value={newFarm.name} 
                  onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })} 
                  placeholder="أدخل اسم المزرعة"
                  className="h-9 mt-1 text-xs" 
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">نوع المزرعة</Label>
                <Select value={newFarm.type} onValueChange={(v) => setNewFarm({ ...newFarm, type: v })}>
                  <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="اختر نوع المزرعة" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="دواجن">دواجن (تسمين)</SelectItem>
                    <SelectItem value="بياض">دواجن (بياض)</SelectItem>
                    <SelectItem value="مواشي">مواشي وتسمين</SelectItem>
                    <SelectItem value="أرانب">أرانب</SelectItem>
                    <SelectItem value="أسماك">أسماك</SelectItem>
                    <SelectItem value="زراعة">زراعة عامة</SelectItem>
                    <SelectItem value="مختلط">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">الموقع الجغرافي</Label>
                <Input 
                  value={newFarm.location} 
                  onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })} 
                  placeholder="مثال: الشرقية - مركز بلبيس"
                  className="h-9 mt-1 text-xs" 
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">السعة الاستيعابية</Label>
                <Input 
                  value={newFarm.capacity} 
                  onChange={(e) => setNewFarm({ ...newFarm, capacity: e.target.value })} 
                  placeholder="مثال: 20,000 طائر"
                  className="h-9 mt-1 text-xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">تاريخ بدء الدورة الحالية</Label>
                <Input 
                  type="date"
                  value={newFarm.cycleStartDate} 
                  onChange={(e) => setNewFarm({ ...newFarm, cycleStartDate: e.target.value })} 
                  className="h-9 mt-1 text-xs" 
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">نسبة النفوق المتوقعة</Label>
                <Input 
                  value={newFarm.mortalityRate} 
                  onChange={(e) => setNewFarm({ ...newFarm, mortalityRate: e.target.value })} 
                  placeholder="مثال: 1.2%"
                  className="h-9 mt-1 text-xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">اسم / رقم الدورة</Label>
                <Input 
                  value={newFarm.currentCycle} 
                  onChange={(e) => setNewFarm({ ...newFarm, currentCycle: e.target.value })} 
                  placeholder="مثال: الدورة الخامسة 2026"
                  className="h-9 mt-1 text-xs" 
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">حالة المزرعة</Label>
                <Select value={newFarm.status} onValueChange={(v) => setNewFarm({ ...newFarm, status: v })}>
                  <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="نشطة">نشطة ومستمرة</SelectItem>
                    <SelectItem value="فترة تحضين">فترة تحضين</SelectItem>
                    <SelectItem value="فترة تطهير وصيانة">فترة تطهير وصيانة</SelectItem>
                    <SelectItem value="مغلقة مؤقتاً">مغلقة مؤقتاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">الوصف / ملاحظات إضافية</Label>
              <Textarea 
                value={newFarm.description} 
                onChange={(e) => setNewFarm({ ...newFarm, description: e.target.value })} 
                placeholder="وصف تفصيلي للمزرعة، السلالات، المشرفين أو العنابر (اختياري)" 
                rows={2}
                className="mt-1 text-xs" 
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={editingFarm ? handleUpdateFarm : handleAddFarm} className="flex-1 h-9 text-xs font-bold">
                {editingFarm ? "حفظ التعديلات" : "إضافة المزرعة"}
              </Button>
              <Button variant="outline" onClick={() => { setShowEditFarm(false); setEditingFarm(null); }} className="h-9 text-xs">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>تقرير الأداء المالي {reportData ? getReportTypeArabic(reportData.period) : ""}</span>
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                مزرعة: <b className="text-slate-800 dark:text-slate-200">{currentFarm?.name || "عام"}</b> | الفترة: من <b className="text-slate-800 dark:text-slate-200">{reportData?.startDate}</b> إلى <b className="text-slate-800 dark:text-slate-200">{reportData?.endDate}</b>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!reportData) return;
                  const msg = generateFinancialReportMessage(reportData, currentFarm?.name);
                  openWhatsApp(reportData.selectedClient?.phone || null, msg);
                }}
                className="gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                مشاركة واتساب
              </Button>
              <Button
                onClick={generatePDFReport}
                disabled={isGeneratingReport}
                className="gap-2 text-xs font-bold bg-[#162C56] hover:bg-[#1f3c73] text-white cursor-pointer"
              >
                {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                تحميل / مشاركة PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportDialog(false)}
                className="text-xs cursor-pointer"
              >
                إغلاق
              </Button>
            </div>
          </div>

          {/* Tab Navigation Bar inside Dialog */}
          {reportData && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setReportDialogTab("summary")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  reportDialogTab === "summary"
                    ? "bg-[#162C56] text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                📊 ملخص الأداء والمؤشرات
              </button>
              <button
                type="button"
                onClick={() => setReportDialogTab("revenues")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  reportDialogTab === "revenues"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                📈 حركات الإيرادات ({reportData.revenuesCount})
              </button>
              <button
                type="button"
                onClick={() => setReportDialogTab("expenses")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  reportDialogTab === "expenses"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                📉 حركات المصروفات ({reportData.expensesCount})
              </button>
              {reportData.includePayments && (
                <button
                  type="button"
                  onClick={() => setReportDialogTab("payments")}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    reportDialogTab === "payments"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  💳 التحصيلات والدفعات ({reportData.paymentsCount})
                </button>
              )}
            </div>
          )}

          {reportData && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* === TAB 1: SUMMARY === */}
              {reportDialogTab === "summary" && (
                <>
                  {/* Selected Client Card if filtered */}
                  {reportData.selectedClient && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          الجهة المحددة: {reportData.selectedClient.name} ({reportData.selectedClient.type})
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">الهاتف: {reportData.selectedClient.phone || "غير مسجل"}</p>
                      </div>
                      {reportData.clientTotals && (
                        <div className="text-left">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {reportData.selectedClient.type === "مورد"
                              ? (reportData.clientTotals.balance >= 0 ? "مستحقات المورد علينا" : "رصيدنا الدائن لديه")
                              : (reportData.clientTotals.balance >= 0 ? "مديونية العميل لنا" : "رصيد العميل الدائن لدينا")}
                          </p>
                          <p className={`text-lg font-bold font-mono ${reportData.clientTotals.balance === 0 ? "text-slate-500" : (reportData.clientTotals.balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}`}>
                            {Math.abs(reportData.clientTotals.balance).toLocaleString()} ج.م
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Financial KPI Grid (4 Pillars) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Revenue KPI */}
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">إجمالي الإيرادات</p>
                      <p className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                        {reportData.totalRevenues.toLocaleString()} ج.م
                      </p>
                      <p className="text-[10.5px] text-emerald-600/80 dark:text-emerald-400/80">
                        {reportData.revenuesCount} حركة مسجلة
                      </p>
                      <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-emerald-200/60 dark:border-emerald-900/60 flex justify-center gap-1.5 font-medium">
                        <span>نقدي: {reportData.cashRevenues.toLocaleString()}</span>
                        <span>•</span>
                        <span>آجل: {reportData.creditRevenues.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Expense KPI */}
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center space-y-1">
                      <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">إجمالي المصروفات</p>
                      <p className="text-lg sm:text-xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                        {reportData.totalExpenses.toLocaleString()} ج.م
                      </p>
                      <p className="text-[10.5px] text-rose-600/80 dark:text-rose-400/80">
                        {reportData.expensesCount} حركة مسجلة
                      </p>
                      <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-rose-200/60 dark:border-rose-900/60 flex justify-center gap-1.5 font-medium">
                        <span>مسدد: {reportData.paidExpenses.toLocaleString()}</span>
                        <span>•</span>
                        <span>متبقي: {reportData.remainingExpenses.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Net Profit KPI */}
                    <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                      reportData.netProfit >= 0
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    }`}>
                      <p className={`text-xs font-bold ${reportData.netProfit >= 0 ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400"}`}>
                        صافي الربح الفعلي
                      </p>
                      <p className={`text-lg sm:text-xl font-extrabold font-mono ${reportData.netProfit >= 0 ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300"}`}>
                        {reportData.netProfit.toLocaleString()} ج.م
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        {reportData.netProfit >= 0 ? "فائض ربحي للنشاط" : "عجز مالي مؤقت"}
                      </p>
                      <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-blue-200/60 dark:border-blue-900/60 flex justify-center gap-1.5 font-medium">
                        <span>هامش الربح: {reportData.profitMargin}%</span>
                      </div>
                    </div>

                    {/* Net Cash Flow KPI */}
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 font-bold">صافي حركة الخزينة</p>
                      <p className={`text-lg sm:text-xl font-extrabold font-mono ${reportData.netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {reportData.netCashFlow > 0 ? "+" : ""}{reportData.netCashFlow.toLocaleString()} ج.م
                      </p>
                      <p className="text-[10.5px] text-indigo-600/80 dark:text-indigo-400/80">
                        حركة السيولة النقدية الفعلية
                      </p>
                      <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-indigo-200/60 dark:border-indigo-900/60 flex justify-center gap-1.5 font-medium">
                        <span>وارد: +{reportData.totalCashIn.toLocaleString()}</span>
                        <span>•</span>
                        <span>صادر: -{reportData.totalCashOut.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Receivables & Payables Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        مبيعات آجلة طرف العملاء:
                      </span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm">
                        {reportData.creditRevenues.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-2 sm:border-r border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        متبقي مستحق للموردين:
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm">
                        {reportData.remainingExpenses.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdowns (Revenues vs Expenses) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Revenue Breakdown */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> تفصيل الإيرادات حسب البند
                        </h4>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {reportData.totalRevenues.toLocaleString()} ج.م
                        </span>
                      </div>
                      {Object.keys(reportData.revenuesByCategory || {}).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">لا توجد إيرادات في هذه الفترة</p>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          {Object.entries(reportData.revenuesByCategory).map(([cat, val]: [string, any]) => {
                            const pct = reportData.totalRevenues > 0 ? Math.round((val.total / reportData.totalRevenues) * 100) : 0;
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                  <span>{cat} <span className="text-slate-400 font-normal">({val.count} حركة{val.quantity > 0 ? ` • ${val.quantity.toLocaleString()} وحدة` : ""})</span></span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">{val.total.toLocaleString()} ج.م ({pct}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Expense Breakdown */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" /> تفصيل المصروفات حسب البند
                        </h4>
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                          {reportData.totalExpenses.toLocaleString()} ج.م
                        </span>
                      </div>
                      {Object.keys(reportData.expensesByCategory || {}).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">لا توجد مصروفات في هذه الفترة</p>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          {Object.entries(reportData.expensesByCategory).map(([cat, val]: [string, any]) => {
                            const pct = reportData.totalExpenses > 0 ? Math.round((val.total / reportData.totalExpenses) * 100) : 0;
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                  <span>{cat} <span className="text-slate-400 font-normal">({val.count} حركة{val.quantity > 0 ? ` • ${val.quantity.toLocaleString()} وحدة` : ""})</span></span>
                                  <span className="text-rose-600 dark:text-rose-400 font-mono font-extrabold">{val.total.toLocaleString()} ج.م ({pct}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* === TAB 2: REVENUES LIST === */}
              {reportDialogTab === "revenues" && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" /> قائمة حركات الإيرادات والمبيعات ({reportData.revenuesCount})
                    </h4>
                    <span className="text-xs font-extrabold text-emerald-600 font-mono">{reportData.totalRevenues.toLocaleString()} ج.م</span>
                  </div>

                  {reportData.revenuesList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">لا توجد حركات إيرادات في هذا النطاق</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                            <th className="pb-2.5 text-right">التاريخ</th>
                            <th className="pb-2.5 text-right">البند / الصنف</th>
                            <th className="pb-2.5 text-right">العميل</th>
                            <th className="pb-2.5 text-center">الكمية</th>
                            <th className="pb-2.5 text-center">السعر</th>
                            <th className="pb-2.5 text-center">السداد</th>
                            <th className="pb-2.5 text-left">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportData.revenuesList.map((r: any) => {
                            const clientName = clients.find(c => c.id === r.clientId)?.name || "عميل نقدي";
                            return (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">{r.date}</td>
                                <td className="py-2.5 font-bold text-slate-900 dark:text-white">{r.type}</td>
                                <td className="py-2.5 text-slate-700 dark:text-slate-300">{clientName}</td>
                                <td className="py-2.5 text-center font-mono">{r.quantity ? r.quantity.toLocaleString() : "—"}</td>
                                <td className="py-2.5 text-center font-mono">{r.unitPrice ? `${r.unitPrice.toLocaleString()} ج.م` : "—"}</td>
                                <td className="py-2.5 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${r.paymentMethod === 'credit' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                                    {r.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                                  </span>
                                </td>
                                <td className="py-2.5 font-bold text-left text-emerald-600 dark:text-emerald-400 font-mono">
                                  {r.amount.toLocaleString()} ج.م
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* === TAB 3: EXPENSES LIST === */}
              {reportDialogTab === "expenses" && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose-600" /> قائمة حركات المصروفات والتشغيل ({reportData.expensesCount})
                    </h4>
                    <span className="text-xs font-extrabold text-rose-600 font-mono">{reportData.totalExpenses.toLocaleString()} ج.م</span>
                  </div>

                  {reportData.expensesList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">لا توجد حركات مصروفات في هذا النطاق</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                            <th className="pb-2.5 text-right">التاريخ</th>
                            <th className="pb-2.5 text-right">البند</th>
                            <th className="pb-2.5 text-right">المورد / الجهة</th>
                            <th className="pb-2.5 text-center">الكمية</th>
                            <th className="pb-2.5 text-center">سعر الوحدة</th>
                            <th className="pb-2.5 text-center">المسدد</th>
                            <th className="pb-2.5 text-center">المتبقي</th>
                            <th className="pb-2.5 text-left">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportData.expensesList.map((e: any) => {
                            const supplier = e.supplierName || clients.find(c => c.id === e.clientId)?.name || "مصروف عام";
                            const paid = e.paymentMethod === 'cash' ? e.amount : (e.paidAmount || 0);
                            const rem = Math.max(0, e.amount - paid);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">{e.date}</td>
                                <td className="py-2.5 font-bold text-slate-900 dark:text-white">{e.category}</td>
                                <td className="py-2.5 text-slate-700 dark:text-slate-300">{supplier}</td>
                                <td className="py-2.5 text-center font-mono">{e.quantity ? e.quantity.toLocaleString() : "—"}</td>
                                <td className="py-2.5 text-center font-mono">{e.unitPrice ? `${e.unitPrice.toLocaleString()} ج.م` : "—"}</td>
                                <td className="py-2.5 text-center font-mono text-emerald-600">{paid.toLocaleString()}</td>
                                <td className="py-2.5 text-center font-mono text-rose-600">{rem > 0 ? rem.toLocaleString() : "—"}</td>
                                <td className="py-2.5 font-bold text-left text-rose-600 dark:text-rose-400 font-mono">
                                  {e.amount.toLocaleString()} ج.م
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* === TAB 4: PAYMENTS LIST === */}
              {reportDialogTab === "payments" && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-blue-600" /> سجل الدفعات والتحصيلات النقدية ({reportData.paymentsCount} حركة)
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-bold font-mono">
                      <span className="text-emerald-600">مقبوض: +{reportData.totalCollectedPayments.toLocaleString()} ج.م</span>
                      <span>|</span>
                      <span className="text-rose-600">مدفوع: -{reportData.totalDisbursedPayments.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  {reportData.paymentsList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      لا توجد دفعات أو تحصيلات مسجلة في نطاق الفلترة المحدد
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                            <th className="pb-2.5 text-right">التاريخ</th>
                            <th className="pb-2.5 text-center">نوع الحركة</th>
                            <th className="pb-2.5 text-right">الجهة (العميل / المورد)</th>
                            <th className="pb-2.5 text-left">المبلغ</th>
                            <th className="pb-2.5 text-right">البيان والملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {reportData.paymentsList.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                              <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">{p.date}</td>
                              <td className="py-2.5 text-center">
                                {p.type === "revenue" ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none text-[10px]" variant="outline">
                                    قبض (إيراد)
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-none text-[10px]" variant="outline">
                                    دفع (مصروف)
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 font-bold text-slate-900 dark:text-white">{p.clientName}</td>
                              <td className={`py-2.5 font-bold text-left font-mono ${p.type === "revenue" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {p.type === "revenue" ? "+" : "-"}{p.amount.toLocaleString()} ج.م
                              </td>
                              <td className="py-2.5 text-slate-500 max-w-[200px] truncate" title={p.notes}>
                                {p.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
