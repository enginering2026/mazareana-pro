import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Sun, Moon, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import { FarmSelector } from "./FarmSelector";
import { useAppContext, calculateFlockAgeDays } from "@/contexts/AppContext";
import { sortByDateDesc } from "@/lib/utils";

export const Header = () => {
  const { addFarm, currentFarm, revenues, expenses } = useAppContext();
  const { theme, setTheme } = useTheme();
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newFarm, setNewFarm] = useState({
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

  // Get last week's operations
  const lastWeekOperations = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const operations: any[] = [];
    
    revenues.forEach(revenue => {
      const operationDate = new Date(revenue.date);
      if (operationDate >= oneWeekAgo) {
        operations.push({
          id: revenue.id,
          type: 'revenue',
          title: `إيراد: ${revenue.type}`,
          amount: revenue.amount,
          date: revenue.date,
          createdAt: revenue.createdAt,
          icon: TrendingUp,
          color: 'text-emerald-600'
        });
      }
    });
    
    expenses.forEach(expense => {
      const operationDate = new Date(expense.date);
      if (operationDate >= oneWeekAgo) {
        operations.push({
          id: expense.id,
          type: 'expense',
          title: `مصروف: ${expense.category}`,
          amount: expense.amount,
          date: expense.date,
          createdAt: expense.createdAt,
          icon: TrendingUp,
          color: 'text-rose-600'
        });
      }
    });
    
    return operations.sort(sortByDateDesc);
  }, [revenues, expenses]);

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
        mortalityRate: "1.2%",
        currentCycle: "الدورة الأولى 2026",
        status: "نشطة"
      });
      setShowAddFarm(false);
    }
  };

  return (
    <header className="px-3.5 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-40 sticky top-0">
      {/* Right Side (in RTL): Avatar + Actions */}
      <div className="flex items-center gap-1.5">
        {/* App / Farm Official Logo */}
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="شعار المنظومة"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shadow-2xs border border-slate-200/90 dark:border-slate-700 select-none shrink-0"
        />

        {/* Notifications Popover */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger asChild>
            <button
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="الإشعارات"
            >
              <Bell className="w-3.5 h-3.5" />
              {lastWeekOperations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#162C56] text-white text-[9px] font-bold flex items-center justify-center">
                  {lastWeekOperations.length > 9 ? "9+" : lastWeekOperations.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 sm:w-80 p-0" align="start">
            <div className="p-3 sm:p-4 border-b">
              <h3 className="font-semibold text-sm">عمليات الأسبوع الماضي</h3>
              <p className="text-xs text-muted-foreground">
                {lastWeekOperations.length} عملية
              </p>
            </div>
            <div className="max-h-60 sm:max-h-64 overflow-y-auto">
              {lastWeekOperations.length > 0 ? (
                <div className="space-y-1 p-2">
                  {lastWeekOperations.map((operation) => {
                    const IconComponent = operation.icon;
                    return (
                      <div
                        key={operation.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-accent rounded-md"
                      >
                        <div className={`p-1 sm:p-1.5 rounded-full bg-accent ${operation.color} flex-shrink-0`}>
                          <IconComponent className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {operation.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(operation.date).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        <div className={`text-xs sm:text-sm font-semibold ${operation.color} flex-shrink-0`}>
                          {operation.amount.toLocaleString()} ج.م
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    لا توجد عمليات جديدة
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <button
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="تبديل المظهر"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Quick Add Farm (+) */}
        <button
          onClick={() => setShowAddFarm(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="إضافة مزرعة جديدة"
        >
          <span className="text-base font-bold leading-none">+</span>
        </button>
      </div>

      {/* Left Side (in RTL): Farm Selector Pill (hidden if swipe_only) */}
      <div className="flex items-center gap-2">
        {farmSwitchMode !== "swipe_only" ? (
          <FarmSelector />
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[130px]">{currentFarm?.name || "المزرعة"}</span>
          </div>
        )}
      </div>

      {/* Add Farm Dialog */}
      <Dialog open={showAddFarm} onOpenChange={setShowAddFarm}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center text-sm font-bold">+</span>
              <span>إضافة مزرعة جديدة بكافة التفاصيل</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-1 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="farmName" className="text-[11px] font-semibold">اسم المزرعة *</Label>
                <Input
                  id="farmName"
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                  placeholder="أدخل اسم المزرعة"
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="farmType" className="text-[11px] font-semibold">نوع المزرعة</Label>
                <Select value={newFarm.type} onValueChange={(value) => setNewFarm({ ...newFarm, type: value })}>
                  <SelectTrigger className="h-8 mt-1 text-xs">
                    <SelectValue placeholder="اختر نوع المزرعة" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="دواجن">دواجن (تسمين)</SelectItem>
                    <SelectItem value="بياض">دواجن (بياض)</SelectItem>
                    <SelectItem value="مواشي">مواشي وتسمين</SelectItem>
                    <SelectItem value="أرانب">أرانب</SelectItem>
                    <SelectItem value="أسماك">أسماك</SelectItem>
                    <SelectItem value="زراعة">زراعة</SelectItem>
                    <SelectItem value="مختلط">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="farmLocation" className="text-[11px] font-semibold">الموقع</Label>
                <Input
                  id="farmLocation"
                  value={newFarm.location}
                  onChange={(e) => setNewFarm({ ...newFarm, location: e.target.value })}
                  placeholder="موقع المزرعة"
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">السعة الاستيعابية</Label>
                <Input
                  value={newFarm.capacity}
                  onChange={(e) => setNewFarm({ ...newFarm, capacity: e.target.value })}
                  placeholder="مثال: 20,000 طائر"
                  className="h-8 mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">تاريخ بدء الدورة</Label>
                <Input
                  type="date"
                  value={newFarm.cycleStartDate}
                  onChange={(e) => setNewFarm({ ...newFarm, cycleStartDate: e.target.value })}
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">نسبة النفوق</Label>
                <Input
                  value={newFarm.mortalityRate}
                  onChange={(e) => setNewFarm({ ...newFarm, mortalityRate: e.target.value })}
                  placeholder="مثال: 1.2%"
                  className="h-8 mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] font-semibold">اسم الدورة</Label>
                <Input
                  value={newFarm.currentCycle}
                  onChange={(e) => setNewFarm({ ...newFarm, currentCycle: e.target.value })}
                  placeholder="مثال: الدورة الأولى 2026"
                  className="h-8 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold">الحالة</Label>
                <Select value={newFarm.status} onValueChange={(v) => setNewFarm({ ...newFarm, status: v })}>
                  <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
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
              <Label htmlFor="farmDescription" className="text-[11px] font-semibold">الوصف</Label>
              <Textarea
                id="farmDescription"
                value={newFarm.description}
                onChange={(e) => setNewFarm({ ...newFarm, description: e.target.value })}
                placeholder="وصف اختياري للمزرعة"
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddFarm} className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                إضافة المزرعة
              </Button>
              <Button variant="outline" onClick={() => setShowAddFarm(false)} className="h-8 text-xs">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};