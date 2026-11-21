import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Plus,
  Sun,
  Moon,
  Bell
} from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext, Farm, calculateFlockAgeDays } from "@/contexts/AppContext";
import { sortByDateDesc, cn } from "@/lib/utils";
import { sendPhoneNotification } from "@/lib/notifications";
import { toast } from "sonner";
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const { 
    revenues, 
    expenses, 
    clients, 
    invoices, 
    partners, 
    farms,
    currentFarm,
    setCurrentFarm,
    updateFarm,
    addFarm,
    getTotalRevenues, 
    getTotalExpenses, 
    getNetProfit 
  } = useAppContext();

  const totalRevenues = getTotalRevenues();
  const totalExpenses = getTotalExpenses();
  const netProfit = getNetProfit();
  const unpaidInvoices = invoices.filter(inv => inv.status === "غير مدفوعة");

  const { theme, setTheme } = useTheme();
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : true);

  // Farm switch mode from Settings (both | swipe_only | header_only)
  const [farmSwitchMode, setFarmSwitchMode] = useState<string>(() => {
    try {
      return localStorage.getItem("farm_switch_mode") || "both";
    } catch {
      return "both";
    }
  });

  useEffect(() => {
    const handleModeChange = () => {
      setFarmSwitchMode(localStorage.getItem("farm_switch_mode") || "both");
    };
    window.addEventListener("farm_switch_mode_changed", handleModeChange);
    window.addEventListener("storage", handleModeChange);
    return () => {
      window.removeEventListener("farm_switch_mode_changed", handleModeChange);
      window.removeEventListener("storage", handleModeChange);
    };
  }, []);

  // Dynamic Flock Age calculated from cycle start date
  const dynamicFlockAgeDays = useMemo(() => {
    return calculateFlockAgeDays(currentFarm?.cycleStartDate, 24);
  }, [currentFarm?.cycleStartDate]);

  // Dynamic Profit Margin Percentage for the SVG Gauge
  const profitMarginPct = useMemo(() => {
    if (totalRevenues <= 0) return netProfit > 0 ? 100 : 0;
    return Math.round((netProfit / totalRevenues) * 100);
  }, [netProfit, totalRevenues]);

  // Real Dynamic Percentages for the 4 KPI boxes
  const financialPercentages = useMemo(() => {
    try {
      const now = new Date();
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();

      const prevMonthDate = new Date(thisYear, thisMonth - 1, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();

      const revList = revenues || [];
      const expList = expenses || [];
      const clientList = clients || [];
      const totRev = totalRevenues || 0;
      const nProf = netProfit || 0;

      // Current month revenues
      const currentMonthRev = revList
        .filter(r => {
          if (!r?.date) return false;
          const d = new Date(r.date);
          return !isNaN(d.getTime()) && d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        })
        .reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);

      // Previous month revenues
      const prevMonthRev = revList
        .filter(r => {
          if (!r?.date) return false;
          const d = new Date(r.date);
          return !isNaN(d.getTime()) && d.getFullYear() === prevYear && d.getMonth() === prevMonth;
        })
        .reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);

      // Revenues % Change
      let revChangePct = 0;
      if (prevMonthRev > 0) {
        revChangePct = Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100);
      } else if (currentMonthRev > 0) {
        revChangePct = 100;
      }

      // Current month expenses
      const currentMonthExp = expList
        .filter(e => {
          if (!e?.date) return false;
          const d = new Date(e.date);
          return !isNaN(d.getTime()) && d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        })
        .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

      // Previous month expenses
      const prevMonthExp = expList
        .filter(e => {
          if (!e?.date) return false;
          const d = new Date(e.date);
          return !isNaN(d.getTime()) && d.getFullYear() === prevYear && d.getMonth() === prevMonth;
        })
        .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

      // Expenses % Change
      let expChangePct = 0;
      if (prevMonthExp > 0) {
        expChangePct = Math.round(((currentMonthExp - prevMonthExp) / prevMonthExp) * 100);
      } else if (currentMonthExp > 0) {
        expChangePct = 100;
      }

      // Net Profit Margin % = (Net Profit / Revenues) * 100
      let profitMarginPct = 0;
      if (totRev > 0) {
        profitMarginPct = Math.round((nProf / totRev) * 100);
      } else if (nProf < 0) {
        profitMarginPct = -100;
      }

      // Active Clients % = clients with transactions / total clients
      const clientsWithTransactions = new Set([
        ...revList.filter(r => r?.clientId).map(r => r.clientId),
        ...expList.filter(e => e?.clientId).map(e => e.clientId)
      ]);
      const activeClientsPct = clientList.length > 0 
        ? Math.round((clientsWithTransactions.size / clientList.length) * 100)
        : 100;

      return {
        revenue: {
          text: `${revChangePct >= 0 ? '+' : ''}${revChangePct}%`,
          isPositive: revChangePct >= 0,
        },
        expense: {
          text: `${expChangePct >= 0 ? '+' : ''}${expChangePct}%`,
          isPositive: expChangePct <= 0,
        },
        profit: {
          text: `${profitMarginPct >= 0 ? '+' : ''}${profitMarginPct}%`,
          isPositive: nProf >= 0,
        },
        clients: {
          text: `${activeClientsPct}% نشط`,
          isPositive: true,
        }
      };
    } catch (err) {
      console.error("Error computing financial percentages:", err);
      return {
        revenue: { text: "+0%", isPositive: true },
        expense: { text: "0%", isPositive: true },
        profit: { text: "+0%", isPositive: true },
        clients: { text: "100% نشط", isPositive: true }
      };
    }
  }, [revenues, expenses, clients, totalRevenues, netProfit]);

  // Active farm index for swipe navigation
  const activeFarmIndex = useMemo(() => {
    if (!farms.length || !currentFarm) return 0;
    const idx = farms.findIndex(f => f.id === currentFarm.id);
    return idx >= 0 ? idx : 0;
  }, [farms, currentFarm]);

  // Interactive Drag & Fluid Swipe Animation State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [slideAnimation, setSlideAnimation] = useState<'idle' | 'slide-left' | 'slide-right'>('idle');

  const switchFarm = (newIndex: number, direction: 'left' | 'right') => {
    if (!farms.length) return;
    const clampedIndex = (newIndex + farms.length) % farms.length;
    const nextFarm = farms[clampedIndex];
    if (nextFarm && nextFarm.id !== currentFarm?.id) {
      setSlideAnimation(direction === 'left' ? 'slide-left' : 'slide-right');
      setCurrentFarm(nextFarm);
      setTimeout(() => setSlideAnimation('idle'), 350);
    }
  };

  const handlePrevFarm = () => {
    switchFarm(activeFarmIndex - 1, 'right');
  };

  const handleNextFarm = () => {
    switchFarm(activeFarmIndex + 1, 'left');
  };

  // Touch gesture handlers for interactive real-time dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (farmSwitchMode === "header_only") return;
    setIsDragging(true);
    setDragStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX === null || farmSwitchMode === "header_only") return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - dragStartX;
    // Damped elastic movement
    setDragX(diff * 0.7);
  };

  const handleTouchEnd = () => {
    if (!isDragging || farmSwitchMode === "header_only") return;
    setIsDragging(false);
    const threshold = 45;
    if (dragX < -threshold) {
      // Swiped left (in RTL: next farm)
      handleNextFarm();
    } else if (dragX > threshold) {
      // Swiped right (in RTL: prev farm)
      handlePrevFarm();
    }
    setDragX(0);
    setDragStartX(null);
  };

  // Mouse drag handlers for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (farmSwitchMode === "header_only") return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null || farmSwitchMode === "header_only") return;
    const diff = e.clientX - dragStartX;
    setDragX(diff * 0.7);
  };

  const handleMouseUp = () => {
    if (!isDragging || farmSwitchMode === "header_only") return;
    setIsDragging(false);
    const threshold = 45;
    if (dragX < -threshold) {
      handleNextFarm();
    } else if (dragX > threshold) {
      handlePrevFarm();
    }
    setDragX(0);
    setDragStartX(null);
  };

  // Farm Details Edit Dialog State
  const [editFarmModalOpen, setEditFarmModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    capacity: "",
    cycleStartDate: "",
    flockAge: "",
    mortalityRate: "",
    currentCycle: "",
    status: "نشطة",
    location: ""
  });

  const handleOpenEditFarm = () => {
    if (!currentFarm) return;
    const fallbackDays = 24;
    const d = new Date();
    d.setDate(d.getDate() - fallbackDays);
    const startDate = currentFarm.cycleStartDate || d.toISOString().split('T')[0];

    setEditForm({
      name: currentFarm.name || "",
      capacity: currentFarm.capacity || "15,000 طائر",
      cycleStartDate: startDate,
      flockAge: `${calculateFlockAgeDays(startDate, fallbackDays)} يوم`,
      mortalityRate: currentFarm.mortalityRate || "1.2%",
      currentCycle: currentFarm.currentCycle || `الدورة الحالية • ${new Date().getFullYear()}`,
      status: currentFarm.status || "نشطة",
      location: currentFarm.location || "الدورة الحالية"
    });
    setEditFarmModalOpen(true);
  };

  const handleSaveFarmDetails = async () => {
    if (!currentFarm) return;
    if (!editForm.name.trim()) {
      toast.error("يرجى إدخال اسم المزرعة");
      return;
    }
    const computedDays = calculateFlockAgeDays(editForm.cycleStartDate);
    await updateFarm({
      ...currentFarm,
      name: editForm.name.trim(),
      capacity: editForm.capacity.trim(),
      cycleStartDate: editForm.cycleStartDate,
      flockAge: `${computedDays} يوم`,
      mortalityRate: editForm.mortalityRate.trim(),
      currentCycle: editForm.currentCycle.trim(),
      status: editForm.status.trim(),
      location: editForm.location.trim()
    });
    toast.success("تم تحديث بيانات المزرعة وعمر القطيع بنجاح");
    setEditFarmModalOpen(false);
  };

  // Add New Farm Modal State & Handler
  const [showAddNewFarmModal, setShowAddNewFarmModal] = useState(false);
  const [newFarmForm, setNewFarmForm] = useState({
    name: "",
    type: "دواجن",
    location: "",
    description: "",
    capacity: "15,000 طائر",
    cycleStartDate: new Date().toISOString().split('T')[0],
    mortalityRate: "1.2%",
    currentCycle: "الدورة الأولى 2026",
    status: "نشطة"
  });

  const handleCreateNewFarm = async () => {
    if (!newFarmForm.name.trim()) {
      toast.error("يرجى إدخال اسم المزرعة");
      return;
    }
    try {
      const computedDays = calculateFlockAgeDays(newFarmForm.cycleStartDate);
      await addFarm({
        name: newFarmForm.name.trim(),
        type: newFarmForm.type || "دواجن",
        location: newFarmForm.location.trim(),
        description: newFarmForm.description.trim(),
        capacity: newFarmForm.capacity.trim(),
        cycleStartDate: newFarmForm.cycleStartDate,
        flockAge: `${computedDays} يوم`,
        mortalityRate: newFarmForm.mortalityRate.trim(),
        currentCycle: newFarmForm.currentCycle.trim(),
        status: newFarmForm.status.trim()
      });
      toast.success("تمت إضافة المزرعة بنجاح");
      setShowAddNewFarmModal(false);
      setNewFarmForm({
        name: "",
        type: "دواجن",
        location: "",
        description: "",
        capacity: "15,000 طائر",
        cycleStartDate: new Date().toISOString().split('T')[0],
        mortalityRate: "1.2%",
        currentCycle: "الدورة الأولى 2026",
        status: "نشطة"
      });
    } catch (err) {
      toast.error("حدث خطأ أثناء إضافة المزرعة");
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // KPI Stats Cards matching original v8 design
  const stats = useMemo(() => [
    {
      title: "إجمالي الإيرادات",
      value: (Number(totalRevenues) || 0).toLocaleString(),
      currency: "ج.م",
      change: "+15%",
      icon: TrendingUp,
      positive: true,
      gradient: "from-emerald-500/15 to-emerald-500/0",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "إجمالي المصروفات",
      value: (Number(totalExpenses) || 0).toLocaleString(),
      currency: "ج.م",
      change: "-8%",
      icon: TrendingDown,
      positive: false,
      gradient: "from-rose-500/15 to-rose-500/0",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    },
    {
      title: "صافي الربح",
      value: (Number(netProfit) || 0).toLocaleString(),
      currency: "ج.م",
      change: "+25%",
      icon: Wallet,
      positive: (Number(netProfit) || 0) >= 0,
      gradient: "from-primary/15 to-primary/0",
      iconBg: "bg-primary/10 text-primary"
    },
    {
      title: "عدد العملاء",
      value: (clients?.length || 0).toString(),
      currency: "عميل",
      change: `+${clients?.length || 0}`,
      icon: Users,
      positive: true,
      gradient: "from-accent/15 to-accent/0",
      iconBg: "bg-accent/10 text-accent"
    }
  ], [totalRevenues, totalExpenses, netProfit, clients]);

  // Recent 4 transactions
  const recentTransactions = useMemo(() => {
    const revList = revenues || [];
    const expList = expenses || [];
    const all = [
      ...revList.map(r => ({
        id: r.id,
        type: `بيع ${r.type || 'إنتاج'}`,
        amount: (Number(r.amount) || 0).toLocaleString(),
        date: r.date || '',
        createdAt: r.createdAt || '',
        category: "إيراد",
        rawDate: r.date || ''
      })),
      ...expList.map(e => ({
        id: e.id,
        type: e.category || 'مصروف',
        amount: (Number(e.amount) || 0).toLocaleString(),
        date: e.date || '',
        createdAt: e.createdAt || '',
        category: "مصروف",
        rawDate: e.date || ''
      }))
    ];
    return all.sort(sortByDateDesc).slice(0, 4);
  }, [revenues, expenses]);

  // Alerts (Unpaid invoices)
  const alerts = useMemo(() => {
    const list: { message: string; type: "warning" | "error" }[] = [];
    unpaidInvoices.forEach(inv => {
      list.push({ message: `فاتورة العميل ${inv.clientName} غير مدفوعة`, type: "error" });
    });
    return list;
  }, [unpaidInvoices]);

  // Phone notification trigger when critical financial alerts are present
  useEffect(() => {
    if (alerts.length > 0) {
      try {
        const saved = localStorage.getItem("app_settings");
        const settings = saved ? JSON.parse(saved) : null;
        if (settings?.notifications !== false) {
          const notifiedKey = `notified_alert_${alerts[0].message}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            sendPhoneNotification("تنبيه المنظومة المالية", alerts[0].message);
            sessionStorage.setItem(notifiedKey, "true");
          }
        }
      } catch {}
    }
  }, [alerts]);

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const availableYears = useMemo(() => {
    const rawYears = [
      ...revenues.filter(r => r?.date).map(r => new Date(r.date).getFullYear()),
      ...expenses.filter(e => e?.date).map(e => new Date(e.date).getFullYear())
    ].filter(y => !isNaN(y) && y > 2000);
    return Array.from(new Set(rawYears)).sort();
  }, [revenues, expenses]);
  const currentYear = availableYears.length ? availableYears[availableYears.length - 1] : new Date().getFullYear();

  // Monthly breakdown for selected year
  const monthlyData = useMemo(() => {
    return monthNames.map((monthName, monthIndex) => {
      const revSum = revenues
        .filter(r => {
          if (!r?.date) return false;
          const d = new Date(r.date);
          return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === monthIndex;
        })
        .reduce((sum, r) => sum + (Number(r?.amount) || 0), 0);

      const expSum = expenses
        .filter(e => {
          if (!e?.date) return false;
          const d = new Date(e.date);
          return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === monthIndex;
        })
        .reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

      return {
        month: monthName,
        revenues: revSum,
        expenses: expSum,
        profit: revSum - expSum
      };
    });
  }, [revenues, expenses, currentYear]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = expenses
      .filter(e => {
        if (!e?.date) return false;
        const d = new Date(e.date);
        return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
      })
      .reduce<Record<string, number>>((acc, e) => {
        const cat = e.category || "أخرى";
        acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
        return acc;
      }, {});

    const chartColors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))"
    ];

    return Object.entries(categoryTotals).map(([name, value], idx) => ({
      name,
      value,
      color: chartColors[idx % chartColors.length]
    }));
  }, [expenses, currentYear]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "12px",
    boxShadow: "var(--shadow-medium)",
    fontSize: "13px"
  };

  const CustomXAxisTick = (props: any) => {
    const { x = 0, y = 0, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={14}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          {payload?.value}
        </text>
      </g>
    );
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rev = payload.find((p: any) => p.dataKey === "revenues")?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === "expenses")?.value || 0;
      const diff = rev - exp;
      return (
        <div className="rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[150px]">
          <div className="font-semibold text-foreground text-center border-b border-border/60 pb-1">
            شهر {label}
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> الإيرادات
            </span>
            <span className="font-bold font-mono">
              <span dir="ltr" className="inline-block">{rev > 0 ? `+${rev.toLocaleString('en-US')}` : rev.toLocaleString('en-US')}</span> ج.م
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> المصروفات
            </span>
            <span className="font-bold font-mono">
              <span dir="ltr" className="inline-block">{exp > 0 ? `-${exp.toLocaleString('en-US')}` : exp.toLocaleString('en-US')}</span> ج.م
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 font-medium">
            <span className="text-muted-foreground">الصافي:</span>
            <span className={`font-bold font-mono ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              <span dir="ltr" className="inline-block">{diff > 0 ? `+${diff.toLocaleString('en-US')}` : diff < 0 ? `-${Math.abs(diff).toLocaleString('en-US')}` : "0"}</span> ج.م
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-6 min-h-screen bg-[#F3F6FA] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 transition-colors duration-200" dir="rtl">
      {/* TOP FARM HERO BANNER - PROPOSAL 3 (GLASS STAT RIBBON) */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "url('/assets/dashboard-banner.jpg') center / cover no-repeat",
          borderRadius: "0 0 36px 36px",
          padding: "36px 18px 78px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "260px",
          gap: "16px",
          transform: `translateX(${dragX}px) rotate(${dragX * 0.015}deg)`,
          transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 260ms',
          touchAction: 'pan-y'
        }}
        className={cn(
          "w-full select-none cursor-grab active:cursor-grabbing",
          slideAnimation === 'slide-left' && "animate-in slide-in-from-right-3 duration-300",
          slideAnimation === 'slide-right' && "animate-in slide-in-from-left-3 duration-300"
        )}
      >
        {/* Soft Vignette & Sun-protection Gradient Overlay for 100% text readability */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(11,21,56,0.38) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.5) 100%), linear-gradient(270deg, rgba(0,0,0,0.3) 0%, transparent 60%)"
          }}
        />

        {/* Drag hints */}
        {dragX > 25 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-in fade-in-50">
            ‹ المزرعة السابقة
          </div>
        )}
        {dragX < -25 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-in fade-in-50">
            المزرعة التالية ›
          </div>
        )}

        {/* Top Header Row: Farm Name & Location (Right) | Action Buttons (Theme), (+), (Bell) (Left) */}
        <div className="relative flex items-start justify-between w-full z-10 gap-3">
          {/* Right: Farm Name & Location */}
          <div className="flex-1 min-w-0 flex flex-col text-right">
            <div className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] truncate">
              {currentFarm?.name || "مزرعة الأمل للدواجن"}
            </div>
            <div className="text-xs sm:text-sm text-white/95 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] truncate">
              {currentFarm?.location || currentFarm?.description || "الكيلو 58 · طريق مصر الإسكندرية الصحراوي"}
            </div>
          </div>

          {/* Left: Action Buttons (Theme Toggle), (+), and (Bell) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-none pt-0.5">
            {/* Theme Toggle Button (Dark / Light) */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTheme(theme === "dark" ? "light" : "dark");
              }}
              className="cursor-pointer w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md border border-white/35 flex items-center justify-center text-white transition-all shadow-xs"
              title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
              aria-label="تبديل المظهر"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 stroke-[2.2]" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-100 stroke-[2.2]" />
              )}
            </button>

            {/* Add New Farm Button (+) */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddNewFarmModal(true);
              }}
              className="cursor-pointer w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-600/85 hover:bg-emerald-600 active:scale-95 backdrop-blur-md border border-emerald-400/50 text-white flex items-center justify-center transition-all shadow-xs"
              title="إضافة مزرعة جديدة"
              aria-label="إضافة مزرعة جديدة"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </button>

            {/* Notifications Bell Button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationsModal(true);
              }}
              className="relative cursor-pointer w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md border border-white/35 flex items-center justify-center text-white transition-all shadow-xs"
              title="التنبيهات والإشعارات"
              aria-label="التنبيهات"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Unified Glass Stat Ribbon: Positioned Down At Yellow Box Position */}
        <div 
          className="relative z-10 w-full bg-white/20 hover:bg-white/25 backdrop-blur-md border border-white/30 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between shadow-xs text-white transition-all mt-auto"
        >
          {/* 1. عمر القطيع */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditFarm();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            title="انقر لتعديل بيانات الدورة والقطيع"
          >
            <span className="font-black text-lg sm:text-xl text-emerald-300 font-mono leading-none drop-shadow-xs">
              {dynamicFlockAgeDays}
            </span>
            <span className="text-[11px] sm:text-xs text-white font-bold drop-shadow-xs whitespace-nowrap">
              يوم عمر القطيع
            </span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-white/25 flex-none" />

          {/* 2. الدورة والحالة */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditFarm();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform px-1"
            title="انقر لتعديل الدورة والحالة"
          >
            <span className="text-[11px] sm:text-xs font-bold text-white drop-shadow-xs truncate max-w-[110px]">
              {currentFarm?.currentCycle || "الدورة الخامسة 2026"}
            </span>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/25 border border-emerald-400/40 px-1.5 py-0.5 rounded-full font-extrabold flex-none">
              {currentFarm?.status || "نشطة"}
            </span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-white/25 flex-none" />

          {/* 3. السعة */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditFarm();
            }}
            className="flex-1 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title="انقر لتعديل السعة"
          >
            <span className="text-[10.5px] sm:text-xs text-white/85 font-medium whitespace-nowrap">السعة:</span>
            <span className="font-black text-xs sm:text-sm text-amber-200 drop-shadow-xs whitespace-nowrap">
              {currentFarm?.capacity || "15,000 طائر"}
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING CARDS CONTAINER OVERLAPPING BANNER - UNIFIED NUMERALS & DIR="LTR" */}
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 -mt-8 relative z-20 flex flex-col gap-2.5">
        {/* Card 1: Net Profit (صافي الربح) - Compact & Real Live Data */}
        <div 
          className="card bg-white dark:bg-[#151f32] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors rounded-2xl sm:rounded-3xl py-2.5 px-3.5 sm:py-3 sm:px-4.5 flex items-center justify-between gap-3"
        >
          {/* Right Side: Net Profit Info (Real live data) */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Top row: Real dynamic percentage badge + Title */}
            <div className="flex items-center gap-2 mb-1">
              <span 
                dir="ltr" 
                className={cn(
                  "font-bold text-[10.5px] px-2 py-0.5 rounded-full border",
                  netProfit >= 0
                    ? "bg-[#E6F4EA] text-[#137333] border-emerald-200/60 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-[#FCE8E6] text-[#C5221F] border-rose-200/60 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800"
                )}
              >
                {financialPercentages.profit.text}
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm">
                صافي الربح
              </span>
            </div>

            {/* Main Value & Currency (Real live calculated netProfit) */}
            <div className="flex items-baseline gap-1">
              <span 
                dir="ltr" 
                className={cn(
                  "font-black text-xl sm:text-2xl font-mono tracking-tight",
                  netProfit >= 0 
                    ? "text-[#064E3B] dark:text-emerald-400" 
                    : "text-[#9F1239] dark:text-rose-400"
                )}
              >
                {netProfit >= 0 
                  ? (Number(netProfit) || 0).toLocaleString('en-US') 
                  : `-${Math.abs(Number(netProfit) || 0).toLocaleString('en-US')}`}
              </span>
              <span className={cn(
                "font-bold text-[11px] sm:text-xs",
                netProfit >= 0 ? "text-[#064E3B] dark:text-emerald-400" : "text-[#9F1239] dark:text-rose-400"
              )}>
                ج.م
              </span>
            </div>
          </div>

          {/* Left Side: Compact Donut Ring Chart with Real Live Profit Margin % */}
          <div className="relative flex items-center justify-center flex-none w-[66px] h-[66px] sm:w-[72px] sm:h-[72px]">
            <svg 
              className="w-full h-full -rotate-90 transform" 
              viewBox="0 0 80 80"
              role="img" 
              aria-label={`الربح يمثل ${profitMarginPct}% من الإيرادات`}
            >
              {/* Background Track */}
              <circle
                cx="40"
                cy="40"
                r="31"
                fill="none"
                stroke="currentColor"
                strokeWidth="6.5"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Dynamic Progress Arc (Real live margin) */}
              <circle
                cx="40"
                cy="40"
                r="31"
                fill="none"
                stroke={netProfit >= 0 ? "#10B981" : "#E11D48"}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray="194.78"
                strokeDashoffset={194.78 - (194.78 * Math.min(100, Math.max(0, Math.abs(profitMarginPct)))) / 100}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="font-extrabold text-sm sm:text-base font-mono text-slate-800 dark:text-white leading-none">
                {profitMarginPct}%
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 leading-none">
                من الإيرادات
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Side-by-Side Compact Cards (Revenues & Expenses) */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Card: Revenues (الإيرادات) */}
          <Link 
            to="/revenues" 
            className="card bg-gradient-to-br from-[#EAF8F1] via-[#F4FBF7] to-white dark:from-emerald-950/30 dark:via-[#151f32] dark:to-[#151f32] border border-[#BFE6CF] dark:border-emerald-800/50 shadow-xs transition-colors" 
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 12px",
              borderRadius: "20px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700 }} className="text-slate-800 dark:text-slate-100">
                الإيرادات
              </span>
              <span dir="ltr" className={cn(
                "font-bold text-[10.5px] px-2 py-0.5 rounded-full border whitespace-nowrap inline-block",
                financialPercentages.revenue.isPositive
                  ? "bg-[#E7F7EE] dark:bg-emerald-950/70 text-[#12794E] dark:text-emerald-300 border-[#BFE6CF] dark:border-emerald-800"
                  : "bg-[#FFE3E8] dark:bg-rose-950/70 text-[#BE123C] dark:text-rose-300 border-[#F6C7D0] dark:border-rose-800"
              )}>
                {financialPercentages.revenue.text}
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }} className="text-[#12794E] dark:text-emerald-400 font-mono">
              <span dir="ltr" className="inline-block">
                {totalRevenues.toLocaleString('en-US')}
              </span>
            </div>
            <div style={{ fontSize: "11px" }} className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              ج.م
            </div>
          </Link>

          {/* Card: Expenses (المصروفات) */}
          <Link 
            to="/expenses" 
            className="card bg-gradient-to-br from-[#FFF1F3] via-[#FFF8F9] to-white dark:from-rose-950/30 dark:via-[#151f32] dark:to-[#151f32] border border-[#F6C7D0] dark:border-rose-800/50 shadow-xs transition-colors" 
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 12px",
              borderRadius: "20px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700 }} className="text-slate-800 dark:text-slate-100">
                المصروفات
              </span>
              <span dir="ltr" className={cn(
                "font-bold text-[10.5px] px-2 py-0.5 rounded-full border whitespace-nowrap inline-block",
                financialPercentages.expense.isPositive
                  ? "bg-[#E7F7EE] dark:bg-emerald-950/70 text-[#12794E] dark:text-emerald-300 border-[#BFE6CF] dark:border-emerald-800"
                  : "bg-[#FFE3E8] dark:bg-rose-950/70 text-[#BE123C] dark:text-rose-300 border-[#F6C7D0] dark:border-rose-800"
              )}>
                {financialPercentages.expense.text}
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }} className="text-[#BE123C] dark:text-rose-400 font-mono">
              <span dir="ltr" className="inline-block">
                {totalExpenses.toLocaleString('en-US')}
              </span>
            </div>
            <div style={{ fontSize: "11px" }} className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              ج.م
            </div>
          </Link>
        </div>
      </div>

      {/* CHARTS AND REST OF DASHBOARD */}
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 flex flex-col gap-3">

      {/* Stacked Charts Vertical Flow (فوق بعض في التابلت زي الهاتف) */}
      <div className="flex flex-col gap-3">
        {/* Monthly Performance Area Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[12px] font-extrabold text-slate-800 dark:text-white">الأداء المالي الشهري</h2>
              <p className="text-[9.5px] text-slate-400">الإيرادات مقابل المصروفات</p>
            </div>
            {/* Legend placed right at top */}
            <div className="flex items-center gap-2.5 text-[9.5px] font-bold">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>إيرادات
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>مصروفات
              </span>
            </div>
          </div>

          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 8, right: 4, left: -14, bottom: 2 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                <XAxis 
                  dataKey="month" 
                  interval={1}
                  tick={<CustomXAxisTick />}
                  height={24}
                  axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} 
                  tickLine={false} 
                />
                <YAxis 
                  width={34}
                  tick={{ fontSize: 9.5, fill: "hsl(var(--muted-foreground))" }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${Math.round(val / 1000)}k`;
                    return val;
                  }}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground)/0.3)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                <Area 
                  type="monotone" 
                  dataKey="revenues" 
                  name="الإيرادات" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  fill="url(#revGrad)" 
                  dot={{ r: 2.5, strokeWidth: 1.5, fill: "hsl(var(--background))", stroke: "#10B981" }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#10B981", stroke: "hsl(var(--background))" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="المصروفات" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  fill="url(#expGrad)" 
                  dot={{ r: 2.5, strokeWidth: 1.5, fill: "hsl(var(--background))", stroke: "#EF4444" }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#EF4444", stroke: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-[12px] font-extrabold text-slate-800 dark:text-white">توزيع المصروفات</h2>
            <p className="text-[9.5px] text-slate-400 mb-1">حسب الفئات</p>
          </div>

          {categoryData.length > 0 ? (
            <>
              <div className="h-32 w-32 mx-auto relative my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={categoryData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={36} 
                      outerRadius={56} 
                      paddingAngle={2} 
                      dataKey="value" 
                      strokeWidth={1.5} 
                      stroke="hsl(var(--card))"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`${val.toLocaleString()} ج.م`, "المبلغ"]} 
                      contentStyle={tooltipStyle} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-1.5 mt-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {categoryData.slice(0, 8).map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate bg-slate-50 dark:bg-slate-700/40 px-2 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              لا توجد بيانات مصروفات بعد
            </div>
          )}
        </div>
      </div>

      {/* Alerts Box Matching Mockup */}
      {alerts.length > 0 && (
        <div className="bg-[#FBF9F5] dark:bg-amber-950/20 rounded-2xl p-3 border border-amber-200/70 dark:border-amber-800/50 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-5 h-5 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center text-xs">⚠️</span>
            <h3 className="text-[12px] font-extrabold text-slate-800 dark:text-amber-200">التنبيهات</h3>
          </div>
          {alerts.map((item, idx) => (
            <div
              key={idx}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                item.type === "warning"
                  ? "bg-[#F6EBD8] dark:bg-amber-900/40 text-amber-950 dark:text-amber-100"
                  : "bg-[#F9E2E2] dark:bg-rose-900/40 text-rose-950 dark:text-rose-100"
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      )}

      {/* Latest Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-white">آخر المعاملات</h3>
          <Link to="/revenues" className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-0.5">
            <span>عرض الكل</span>
            <span>‹</span>
          </Link>
        </div>
        <div className="space-y-1.5">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">لا توجد معاملات مسجلة بعد</p>
          ) : (
            recentTransactions.map((item, idx) => {
              const isIncome = item.category === "إيراد";
              return (
                <div key={idx} className="bg-slate-50/90 dark:bg-slate-700/40 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${isIncome ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'} flex items-center justify-center text-xs font-bold`}>
                      {isIncome ? '↗' : '↘'}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">{item.type}</p>
                      <p className="text-[10px] text-slate-400 num">{item.date}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-extrabold num ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    <span dir="ltr" className="inline-block font-mono">
                      {isIncome ? `+${item.amount}` : `-${item.amount}`} <span className="font-cairo">ج.م</span>
                    </span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Capital Profit Distribution (توزيع أرباح رأس المال) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-white">توزيع أرباح رأس المال</h3>
          <Link to="/settings?tab=partners" className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-0.5">
            <span>إدارة الشركاء</span>
            <span>‹</span>
          </Link>
        </div>
        <div className="space-y-2">
          {partners.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا يوجد شركاء مسجلين لهذه المزرعة حالياً</p>
              <p className="text-[10px] text-slate-400 mt-1">يمكنك إضافة الشركاء الحقيقيين ونسب أرباحهم بكل سهولة</p>
              <Link
                to="/settings?tab=partners"
                className="inline-flex items-center gap-1 mt-2.5 px-3 py-1.5 rounded-xl bg-[#162C56] text-white text-[11px] font-bold hover:bg-slate-800 transition"
              >
                <span>+ إضافة شريك جديد</span>
              </Link>
            </div>
          ) : (
            partners.map((partner) => {
              const share = partner.partnershipPercentage || 0;
              const profitShare = Math.round((netProfit * share) / 100);
              return (
                <div 
                  key={partner.id} 
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#162C56] text-white font-bold text-xs flex items-center justify-center">
                      {partner.name?.charAt(0) || "ش"}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800 dark:text-white leading-tight">
                        {partner.name}
                      </p>
                      <p className="text-[10px] text-slate-400 num">
                        {share}% حصة رأس المال
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-[12px] font-extrabold num ${profitShare >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {profitShare.toLocaleString()} ج.م
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-slate-200/70 dark:bg-slate-600 rounded text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                      حصة الأرباح
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

      {/* Quick Edit Farm Details Dialog */}
      <Dialog open={editFarmModalOpen} onOpenChange={setEditFarmModalOpen}>
        <DialogContent className="w-[95vw] max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>تعديل بيانات العنبر / المزرعة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-1 text-xs">
            <div>
              <Label className="text-[11px] font-semibold">اسم العنبر / المزرعة</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="مثال: مزرعة البركة (عنبر 1)"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold">السعة المقدرة</Label>
              <Input
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="مثال: 15,000 طائر"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold">تاريخ بداية الدورة (تسكين الكتاكيت)</Label>
              <Input
                type="date"
                value={editForm.cycleStartDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const computedDays = calculateFlockAgeDays(newDate);
                  setEditForm({
                    ...editForm,
                    cycleStartDate: newDate,
                    flockAge: `${computedDays} يوم`
                  });
                }}
                className="h-8 text-xs mt-1"
              />
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px] text-slate-500">العمر المحسوب:</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                  {calculateFlockAgeDays(editForm.cycleStartDate)} يوم
                </span>
              </div>
              {/* Quick Age Adjust Buttons */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const currentDays = calculateFlockAgeDays(editForm.cycleStartDate);
                    const newDays = Math.max(1, currentDays - 1);
                    const d = new Date();
                    d.setDate(d.getDate() - newDays);
                    setEditForm({
                      ...editForm,
                      cycleStartDate: d.toISOString().split('T')[0],
                      flockAge: `${newDays} يوم`
                    });
                  }}
                  className="flex-1 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition"
                >
                  - يوم (إنقاص)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentDays = calculateFlockAgeDays(editForm.cycleStartDate);
                    const newDays = currentDays + 1;
                    const d = new Date();
                    d.setDate(d.getDate() - newDays);
                    setEditForm({
                      ...editForm,
                      cycleStartDate: d.toISOString().split('T')[0],
                      flockAge: `${newDays} يوم`
                    });
                  }}
                  className="flex-1 h-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition"
                >
                  + يوم (زيادة)
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-semibold">نسبة النفوق</Label>
              <Input
                value={editForm.mortalityRate}
                onChange={(e) => setEditForm({ ...editForm, mortalityRate: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="مثال: 1.2%"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">اسم الدورة</Label>
                <Input
                  value={editForm.currentCycle}
                  onChange={(e) => setEditForm({ ...editForm, currentCycle: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: الدورة الحالية • 2026"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">الحالة</Label>
                <Input
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: نشطة"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button size="sm" onClick={handleSaveFarmDetails} className="w-full h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700">
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal Center */}
      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>مركز الإشعارات والتنبيهات</span>
              </span>
              {unpaidInvoices.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  {unpaidInvoices.length} فواتير معلقة
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* 1. Unpaid Invoices Alerts */}
            {unpaidInvoices.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>فواتير مستحقة الدفع وغير مسددة:</span>
                </div>
                <div className="space-y-1.5">
                  {unpaidInvoices.slice(0, 5).map((inv) => (
                    <div 
                      key={inv.id}
                      className="p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{inv.clientName || "عميل غير مسمى"}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">فاتورة #{inv.number || (inv as any).invoiceNumber || inv.id} • تاريخ: {inv.date}</div>
                      </div>
                      <div className="text-left font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        <span dir="ltr" className="inline-block">
                          {inv.totalAmount?.toLocaleString('en-US')} <span className="font-cairo">ج.م</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Farm Flock Status Alert */}
            <div className="p-2.5 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>حالة الدورة وعمر القطيع</span>
                </div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5">
                  العمر الحالي للقطيع: <strong className="text-emerald-600 dark:text-emerald-400">{dynamicFlockAgeDays} يوم</strong> • نسبة النفوق: {currentFarm?.mortalityRate || "1.2%"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsModal(false);
                  handleOpenEditFarm();
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition"
              >
                تعديل
              </button>
            </div>

            {/* 3. Recent Operations */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>آخر المعاملات المسجلة:</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {recentTransactions.slice(0, 6).map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                        item.category === "إيراد" ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600" : "bg-rose-100 dark:bg-rose-950/80 text-rose-600"
                      )}>
                        {item.category === "إيراد" ? "↗" : "↘"}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                      <span dir="ltr" className={cn(
                        "font-mono font-bold inline-block",
                        item.category === "إيراد" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {item.category === "إيراد" ? `+${item.amount}` : `-${item.amount}`} <span className="font-cairo">ج.م</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Farm Modal (إضافة مزرعة جديدة) */}
      <Dialog open={showAddNewFarmModal} onOpenChange={setShowAddNewFarmModal}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center text-sm font-bold">+</span>
              <span>إضافة مزرعة جديدة بكافة التفاصيل</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">اسم المزرعة *</Label>
                <Input
                  value={newFarmForm.name}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, name: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: مزرعة النور للدواجن"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">نوع المزرعة</Label>
                <Select value={newFarmForm.type} onValueChange={(v) => setNewFarmForm({ ...newFarmForm, type: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="دواجن">دواجن (تسمين)</SelectItem>
                    <SelectItem value="بياض">دواجن (بياض)</SelectItem>
                    <SelectItem value="مواشي">مواشي وتسمين</SelectItem>
                    <SelectItem value="أرانب">أرانب</SelectItem>
                    <SelectItem value="أسماك">أسماك</SelectItem>
                    <SelectItem value="زراعة">زراعة عامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">الموقع الجغرافي</Label>
                <Input
                  value={newFarmForm.location}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, location: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: الشرقية - مركز بلبيس"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">السعة الاستيعابية</Label>
                <Input
                  value={newFarmForm.capacity}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, capacity: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: 20,000 طائر"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">تاريخ بدء الدورة الحالية</Label>
                <Input
                  type="date"
                  value={newFarmForm.cycleStartDate}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, cycleStartDate: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">نسبة النفوق المتوقعة</Label>
                <Input
                  value={newFarmForm.mortalityRate}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, mortalityRate: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: 1.2%"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">اسم / رقم الدورة</Label>
                <Input
                  value={newFarmForm.currentCycle}
                  onChange={(e) => setNewFarmForm({ ...newFarmForm, currentCycle: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="مثال: الدورة الأولى 2026"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">حالة المزرعة</Label>
                <Select value={newFarmForm.status} onValueChange={(v) => setNewFarmForm({ ...newFarmForm, status: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
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
              <Label className="text-[11px] font-semibold">الوصف / ملاحظات إضافية</Label>
              <Textarea
                value={newFarmForm.description}
                onChange={(e) => setNewFarmForm({ ...newFarmForm, description: e.target.value })}
                className="text-xs mt-1"
                placeholder="ملاحظات حول المزرعة أو السلالة أو المشرفين (اختياري)"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button size="sm" onClick={handleCreateNewFarm} className="w-full h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              حفظ وإضافة المزرعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}