import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingDown, 
  Zap, 
  Droplets, 
  Flame, 
  Users, 
  Scale, 
  Package, 
  Clock, 
  Search, 
  Filter, 
  AlertCircle, 
  DollarSign, 
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
  Receipt,
  Egg,
  Layers,
  Wifi,
  Camera
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext, Expense } from "@/contexts/AppContext";
import { sortByDateDesc, cn } from "@/lib/utils";
import { toast } from "sonner";
import { SmartVoiceModal } from "@/components/SmartVoiceModal";
import { triggerHaptic } from "@/lib/haptics";

const PAGE_SIZE = 30;

export default function Expenses() {
  const { expenses, clients, addExpense, updateExpense, deleteExpense, addExpensePayment, getClientTotals } = useAppContext();

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    quantity: "",
    unitPrice: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    paymentMethod: "cash",
    paidAmount: "",
    supplierName: "",
    clientId: "none",
    pricePending: false
  });

  // Edit Expense Form State
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Smart Voice Assistant State
  const [isSmartVoiceOpen, setIsSmartVoiceOpen] = useState(false);

  // Reset pagination on search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  // Listen to Quick Add FAB from global navigation
  useEffect(() => {
    const handleOpenAdd = () => {
      setNewExpense({
        category: "",
        amount: "",
        quantity: "",
        unitPrice: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "cash",
        paidAmount: "",
        supplierName: "",
        clientId: "none",
        pricePending: false
      });
      setIsDialogOpen(true);
    };
    window.addEventListener("open-add-expense-dialog", handleOpenAdd);
    return () => window.removeEventListener("open-add-expense-dialog", handleOpenAdd);
  }, []);

  // Installment payments for credit expenses
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [payInstallmentAmount, setPayInstallmentAmount] = useState("");
  const [payInstallmentDate, setPayInstallmentDate] = useState(new Date().toISOString().split("T")[0]);

  const expenseCategories = [
    { value: "علف", label: "علف", icon: Package, qtyLabel: "عدد الأطنان", priceLabel: "سعر الطن", unit: "طن" },
    { value: "كتاكيت", label: "كتاكيت", icon: Egg, qtyLabel: "عدد الكتاكيت", priceLabel: "سعر الكتكوت", unit: "كتكوت" },
    { value: "دواء", label: "أدوية وبيطرة", icon: Plus, qtyLabel: "الكمية", priceLabel: "سعر الوحدة", unit: "عبوة/وحدة" },
    { value: "نشارة", label: "نشارة", icon: Layers, qtyLabel: "الكمية / شكاير", priceLabel: "سعر الوحدة", unit: "شيكارة" },
    { value: "كهرباء", label: "كهرباء", icon: Zap },
    { value: "مياه", label: "مياه", icon: Droplets },
    { value: "غاز", label: "غاز وطاقة", icon: Flame },
    { value: "إنترنت", label: "إنترنت", icon: Wifi },
    { value: "كاميرات", label: "كاميرات ومراقبة", icon: Camera },
    { value: "عمالة", label: "عمالة ومرتبات", icon: Users },
    { value: "أخرى", label: "مصروفات أخرى", icon: Plus }
  ];

  // Calculations for Add Form
  const selectedCat = expenseCategories.find(c => c.value === newExpense.category);
  const hasQtyMode = !!selectedCat?.qtyLabel;
  const qty = parseFloat(newExpense.quantity) || 0;
  const unitP = parseFloat(newExpense.unitPrice) || 0;
  const computedTotal = hasQtyMode ? qty * unitP : (parseFloat(newExpense.amount) || 0);

  // Calculations for Edit Form
  const editCat = editingExpense ? expenseCategories.find(c => c.value === editingExpense.category) : null;
  const editHasQty = !!editCat?.qtyLabel || Boolean(editingExpense?.quantity);
  const editQ = parseFloat(editingExpense?.quantity) || 0;
  const editP = parseFloat(editingExpense?.unitPrice) || 0;
  const editComputedTotal = editHasQty && editQ > 0 && editP > 0 ? editQ * editP : (parseFloat(editingExpense?.amount) || 0);

  // Add Expense Handler
  const handleAddExpense = () => {
    const isPending = newExpense.pricePending;
    const canSubmit = newExpense.category && newExpense.date && (computedTotal > 0 || (isPending && qty > 0));
    if (!canSubmit) return;

    const pAmt = newExpense.paymentMethod === "cash" 
      ? (isPending ? 0 : computedTotal) 
      : (parseFloat(newExpense.paidAmount) || 0);
    const selectedClient = newExpense.clientId !== "none" ? clients.find(c => c.id === newExpense.clientId) : null;
    const supplierName = selectedClient ? selectedClient.name : newExpense.supplierName;

    addExpense({
      category: newExpense.category,
      amount: isPending ? 0 : computedTotal,
      date: newExpense.date,
      description: newExpense.description,
      quantity: qty > 0 ? qty : null,
      unitPrice: isPending ? null : (unitP > 0 ? unitP : null),
      paymentMethod: newExpense.paymentMethod,
      paidAmount: pAmt,
      supplierName: supplierName || '',
      clientId: newExpense.clientId !== "none" ? newExpense.clientId : null,
      pricePending: isPending
    });

    setNewExpense({
      category: "",
      amount: "",
      quantity: "",
      unitPrice: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      paymentMethod: "cash",
      paidAmount: "",
      supplierName: "",
      clientId: "none",
      pricePending: false
    });
    setIsDialogOpen(false);
  };

  // Open Edit Dialog
  const handleEditExpense = (expense: Expense) => {
    triggerHaptic('medium');
    setEditingExpense({
      ...expense,
      quantity: expense.quantity != null ? String(expense.quantity) : "",
      unitPrice: expense.unitPrice != null ? String(expense.unitPrice) : "",
      amount: String(expense.amount),
      paidAmount: expense.paidAmount != null ? String(expense.paidAmount) : "",
      pricePending: expense.pricePending ?? (!expense.amount && Boolean(expense.quantity))
    });
    setIsEditDialogOpen(true);
  };

  // Update Expense Handler
  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    const isPending = editingExpense.pricePending;
    const eq = parseFloat(editingExpense.quantity) || 0;
    const ep = parseFloat(editingExpense.unitPrice) || 0;
    const calcAmt = (eq > 0 && ep > 0) ? (eq * ep) : (parseFloat(editingExpense.amount) || 0);
    const finalAmount = isPending ? 0 : calcAmt;

    updateExpense({
      ...editingExpense,
      amount: finalAmount,
      quantity: eq > 0 ? eq : null,
      unitPrice: isPending ? null : (ep > 0 ? ep : null),
      pricePending: isPending && finalAmount === 0,
      paidAmount: editingExpense.paymentMethod === "cash" 
        ? finalAmount 
        : (parseFloat(editingExpense.paidAmount) || 0)
    });

    setEditingExpense(null);
    setIsEditDialogOpen(false);
  };

  // Record Installment Payment
  const handleOpenPayDialog = (expense: Expense) => {
    const isCredit = expense.paymentMethod === "credit";
    const remaining = Math.max(0, expense.amount - (expense.paidAmount || 0));

    if (isCredit && remaining <= 0) {
      toast.info("هذا المصروف مسدد بالكامل ولا توجد عليه مبالغ متبقية");
      return;
    }

    triggerHaptic('medium');
    setPayingExpense(expense);
    if (isCredit && remaining > 0) {
      setPayInstallmentAmount(String(remaining));
    } else {
      setPayInstallmentAmount("");
    }
    setPayInstallmentDate(new Date().toISOString().split("T")[0]);
    setPayDialogOpen(true);
  };

  const handleRecordExpensePayment = () => {
    const pAmt = parseFloat(payInstallmentAmount);
    if (payingExpense && pAmt && pAmt > 0) {
      const supplier = payingExpense.supplierName || clients.find(c => c.id === payingExpense.clientId)?.name || 'مورد';
      addExpensePayment({
        expenseId: payingExpense.id,
        clientId: payingExpense.clientId || null,
        amount: pAmt,
        date: payInstallmentDate,
        notes: `سداد دفعة للتاجر / المورد (${supplier})`
      });
      toast.success(`تم تسجيل دفعة سداد بقيمة ${pAmt.toLocaleString()} ج.م للمورد (${supplier}) بنجاح`);
      setPayDialogOpen(false);
      setPayingExpense(null);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteExpense(id);
    }
  };

  // Statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const pendingPriceCount = useMemo(() => {
    return expenses.filter(e => e.pricePending || (!e.amount && Boolean(e.quantity))).length;
  }, [expenses]);

  const creditStats = useMemo(() => {
    const creditList = expenses.filter(e => e.paymentMethod === "credit");
    const totalRemaining = creditList.reduce((sum, e) => {
      const paid = e.paidAmount ?? 0;
      return sum + Math.max(0, e.amount - paid);
    }, 0);
    const unpaidCount = creditList.filter(e => (e.amount - (e.paidAmount ?? 0)) > 0).length;
    return { totalRemaining, unpaidCount };
  }, [expenses]);

  const categoryStats = useMemo(() => {
    return expenseCategories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category === category.value);
      const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
      return { ...category, total, count: categoryExpenses.length, percentage };
    }).filter(cat => cat.count > 0 || cat.total > 0);
  }, [expenses, totalExpenses]);

  // Calculations for Tons and Quantities
  const quantityStats = useMemo(() => {
    let feedTons = 0;
    let feedTotalCost = 0;
    let otherTotalQty = 0;
    let otherTotalCost = 0;
    let totalItemsWithQty = 0;

    expenses.forEach((e) => {
      const q = e.quantity || 0;
      if (q > 0) {
        totalItemsWithQty++;
        const isFeed = e.category === "علف" || e.category.toLowerCase().includes("علف");
        if (isFeed) {
          feedTons += q;
          feedTotalCost += e.amount;
        } else {
          otherTotalQty += q;
          otherTotalCost += e.amount;
        }
      }
    });

    const avgPricePerTon = feedTons > 0 && feedTotalCost > 0 ? Math.round(feedTotalCost / feedTons) : 0;

    return {
      feedTons,
      feedTotalCost,
      avgPricePerTon,
      otherTotalQty,
      otherTotalCost,
      totalItemsWithQty
    };
  }, [expenses]);

  // Floating Scroll-Up Tons & Quantities Summary Bar
  const [showScrollSummary, setShowScrollSummary] = useState(false);
  const lastScrollY = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = (currentY: number) => {
      const diff = currentY - lastScrollY.current;

      if (currentY > 50) {
        if (diff < -3) {
          setShowScrollSummary(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setShowScrollSummary(false);
          }, 4500);
        } else if (diff > 8) {
          setShowScrollSummary(false);
        }
      } else {
        setShowScrollSummary(false);
      }

      lastScrollY.current = currentY;
    };

    const onWinScroll = () => handleScroll(window.scrollY);
    const mainEl = document.querySelector("main");
    const onMainScroll = () => {
      if (mainEl) handleScroll(mainEl.scrollTop);
    };

    window.addEventListener("scroll", onWinScroll, { passive: true });
    if (mainEl) mainEl.addEventListener("scroll", onMainScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onWinScroll);
      if (mainEl) mainEl.removeEventListener("scroll", onMainScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Filtered and Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const sName = e.supplierName || (e.clientId ? clients.find((c) => c.id === e.clientId)?.name || "" : "");
          const matchCat = e.category.toLowerCase().includes(q);
          const matchDesc = (e.description || "").toLowerCase().includes(q);
          const matchSup = sName.toLowerCase().includes(q);
          const matchDate = e.date.includes(q);
          return matchCat || matchDesc || matchSup || matchDate;
        }
        return true;
      })
      .sort(sortByDateDesc);
  }, [expenses, searchQuery, clients]);

  return (
    <div className="space-y-6 relative" dir="rtl">
      {/* ── Floating Scroll-Up Tons & Quantities Summary Bar ────────────────────── */}
      <div
        className={cn(
          "fixed top-14 sm:top-16 left-3 right-3 max-w-4xl mx-auto z-40 transition-all duration-300 ease-out",
          showScrollSummary
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-8 pointer-events-none"
        )}
        aria-live="polite"
      >
        <div className="bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-4 shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-foreground leading-tight">حساب الأطنان والكميات</p>
              <p className="text-[10px] text-muted-foreground hidden xs:block">ملخص فوري لجميع كميات المصروفات</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold border border-amber-500/25">
              <span>🌾 العلف:</span>
              <span className="num-display">{quantityStats.feedTons.toLocaleString()} طن</span>
              {quantityStats.avgPricePerTon > 0 && (
                <span className="text-[10px] font-normal text-muted-foreground mr-1 hidden sm:inline">
                  (متوسط {quantityStats.avgPricePerTon.toLocaleString()} ج)
                </span>
              )}
            </div>

            {quantityStats.otherTotalQty > 0 && (
              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold border border-blue-500/25">
                <span>📦 كميات:</span>
                <span className="num-display">{quantityStats.otherTotalQty.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold border border-destructive/25">
              <span>💰 الإجمالي:</span>
              <span className="num-display">{totalExpenses.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Header & Quick Actions (Mockup Style) ───────────────────────── */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">المصروفات</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">إدارة ومتابعة مصروفات المزرعة</p>
        </div>

        {/* Actions (Smart Voice + Add Expense) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSmartVoiceOpen(true)}
            className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95"
            title="تسجيل صوتي ذكي بالذكاء الاصطناعي"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">مساعد صوتي ذكي</span>
          </button>

          {/* Add Expense Button & Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="bg-[#C82E2E] hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95">
                <span>+</span>
                <span>إضافة مصروف</span>
              </button>
            </DialogTrigger>
          <DialogContent className="max-h-[92vh] overflow-y-auto max-w-lg rounded-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-destructive/10 text-destructive">
                  <Plus className="h-5 w-5" />
                </div>
                إضافة مصروف جديد
              </DialogTitle>
              <DialogDescription className="text-xs">
                سجل بيانات المصروف بدقة مع إمكانية حفظ الكمية وتحديد السعر لاحقاً
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Category Selection */}
              <div>
                <Label htmlFor="category" className="text-xs font-bold text-foreground mb-1 block">فئة المصروف</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="اختر فئة المصروف" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Unit Price Inputs */}
              {hasQtyMode ? (
                <div className="space-y-3 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1 block">
                        {selectedCat?.qtyLabel}
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={newExpense.quantity}
                        onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                        placeholder="0"
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1 block">
                        {selectedCat?.priceLabel} (ج.م)
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={newExpense.unitPrice}
                        disabled={newExpense.pricePending}
                        onChange={(e) => setNewExpense({ ...newExpense, unitPrice: e.target.value })}
                        placeholder={newExpense.pricePending ? "السعر لاحقاً" : "0"}
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  {/* Price Pending Option (تحديد السعر لاحقاً) */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <input
                      type="checkbox"
                      id="pricePendingCheckbox"
                      checked={newExpense.pricePending}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setNewExpense({
                          ...newExpense,
                          pricePending: isChecked,
                          unitPrice: isChecked ? "" : newExpense.unitPrice
                        });
                      }}
                      className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="pricePendingCheckbox" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                      تحديد السعر لاحقاً (تسجيل الكمية/الأطنان فقط الآن)
                    </label>
                  </div>

                  {/* Total Display */}
                  <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">إجمالي المبلغ المحسوب</span>
                    {newExpense.pricePending ? (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold gap-1">
                        <Clock className="h-3.5 w-3.5" /> بانتظار تحديد السعر
                      </Badge>
                    ) : (
                      <span className="text-base font-extrabold text-destructive">
                        {computedTotal.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="amount" className="text-xs font-bold text-foreground mb-1 block">المبلغ الإجمالي (ج.م)</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="أدخل المبلغ الإجمالي"
                    className="rounded-xl h-11"
                  />
                </div>
              )}

              {/* Supplier Selection */}
              <div>
                <Label className="text-xs font-bold text-foreground mb-1 block">المورد / الجهة</Label>
                <Select
                  value={newExpense.clientId}
                  onValueChange={(v) => setNewExpense({ ...newExpense, clientId: v })}
                >
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر العميل/المورد" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="none">بدون عميل (اسم مورد مخصص)</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newExpense.clientId === "none" && (
                <div>
                  <Label htmlFor="supplierName" className="text-xs font-bold text-foreground mb-1 block">اسم المورد المخصص (اختياري)</Label>
                  <Input
                    id="supplierName"
                    type="text"
                    value={newExpense.supplierName}
                    onChange={(e) => setNewExpense({ ...newExpense, supplierName: e.target.value })}
                    placeholder="مثال: شركة النيل للأعلاف، الصيدلية البيطرية"
                    className="rounded-xl h-11"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">طريقة الدفع</Label>
                  <Select
                    value={newExpense.paymentMethod}
                    onValueChange={(v) => setNewExpense({ ...newExpense, paymentMethod: v })}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="cash">نقدي (كاش)</SelectItem>
                      <SelectItem value="credit">آجل (على الحساب)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">المبلغ المدفوع حالياً (ج.م)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={newExpense.paymentMethod === "cash" ? computedTotal : newExpense.paidAmount}
                    onChange={(e) => setNewExpense({ ...newExpense, paidAmount: e.target.value })}
                    disabled={newExpense.paymentMethod === "cash" || newExpense.pricePending}
                    placeholder="0"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              {newExpense.paymentMethod === "credit" && !newExpense.pricePending && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between font-medium">
                  <span className="text-amber-900 dark:text-amber-200">المتبقي المستحق للمورد:</span>
                  <span className="font-bold text-destructive">
                    {Math.max(0, computedTotal - (parseFloat(newExpense.paidAmount) || 0)).toLocaleString()} ج.م
                  </span>
                </div>
              )}

              {/* Date */}
              <div>
                <Label htmlFor="date" className="text-xs font-bold text-foreground mb-1 block">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-xs font-bold text-foreground mb-1 block">ملاحظات وبيان المصروف</Label>
                <Textarea
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="أي تفاصيل أو ملاحظات إضافية..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleAddExpense}
                className="w-full h-12 rounded-2xl font-bold text-base shadow-md"
                variant="destructive"
                disabled={!newExpense.category || (computedTotal <= 0 && (!newExpense.pricePending || qty <= 0))}
              >
                {newExpense.pricePending ? "حفظ الكمية (السعر يحدد لاحقاً)" : "إضافة المصروف"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[92vh] overflow-y-auto max-w-lg rounded-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <Edit className="h-5 w-5" />
                </div>
                تعديل بيانات المصروف
              </DialogTitle>
              <DialogDescription className="text-xs">
                يمكنك تحديث الكميات، تحديد سعر الوحدة، أو تغيير تفاصيل المعاملة
              </DialogDescription>
            </DialogHeader>

            {editingExpense && (
              <div className="space-y-4 pt-2">
                {/* Category Selection */}
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">الفئة</Label>
                  <Select
                    value={editingExpense.category}
                    onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4 text-muted-foreground" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity and Price */}
                <div className="space-y-3 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1 block">
                        {editCat?.qtyLabel || "الكمية"}
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={editingExpense.quantity ?? ""}
                        onChange={(e) => setEditingExpense({ ...editingExpense, quantity: e.target.value })}
                        placeholder="0"
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-foreground mb-1 block">
                        {editCat?.priceLabel || "سعر الوحدة"} (ج.م)
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={editingExpense.unitPrice ?? ""}
                        disabled={editingExpense.pricePending}
                        placeholder={editingExpense.pricePending ? "السعر لاحقاً" : "0"}
                        onChange={(e) => setEditingExpense({ ...editingExpense, unitPrice: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  {/* Price Pending Toggle in Edit */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <input
                      type="checkbox"
                      id="editPricePendingCheckbox"
                      checked={editingExpense.pricePending || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setEditingExpense({
                          ...editingExpense,
                          pricePending: isChecked,
                          unitPrice: isChecked ? "" : editingExpense.unitPrice,
                          amount: isChecked ? "0" : (editComputedTotal > 0 ? String(editComputedTotal) : editingExpense.amount)
                        });
                      }}
                      className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="editPricePendingCheckbox" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                      السعر معلق / بانتظار التحديد لاحقاً
                    </label>
                  </div>

                  {/* Total in Edit */}
                  <div className="p-3 rounded-xl bg-background border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">المبلغ الإجمالي</span>
                    {editingExpense.pricePending ? (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold gap-1">
                        <Clock className="h-3.5 w-3.5" /> بانتظار تحديد السعر
                      </Badge>
                    ) : (
                      <span className="text-base font-extrabold text-destructive">
                        {(editComputedTotal > 0 ? editComputedTotal : (parseFloat(editingExpense.amount) || 0)).toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">المورد / العميل</Label>
                  <Select
                    value={editingExpense.clientId || "none"}
                    onValueChange={(v) => {
                      const selClient = v !== "none" ? clients.find(c => c.id === v) : null;
                      setEditingExpense({
                        ...editingExpense,
                        clientId: v === "none" ? null : v,
                        supplierName: selClient ? selClient.name : editingExpense.supplierName
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="none">بدون عميل (اسم مخصص)</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(!editingExpense.clientId || editingExpense.clientId === "none") && (
                  <div>
                    <Label htmlFor="editSupplierName" className="text-xs font-bold text-foreground mb-1 block">اسم المورد المخصص</Label>
                    <Input
                      id="editSupplierName"
                      type="text"
                      value={editingExpense.supplierName || ""}
                      onChange={(e) => setEditingExpense({ ...editingExpense, supplierName: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-foreground mb-1 block">طريقة الدفع</Label>
                    <Select
                      value={editingExpense.paymentMethod || "cash"}
                      onValueChange={(v) => setEditingExpense({ ...editingExpense, paymentMethod: v })}
                    >
                      <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-foreground mb-1 block">المبلغ المدفوع (ج.م)</Label>
                    <Input
                      type="number"
                      value={editingExpense.paymentMethod === "cash" 
                        ? (editingExpense.pricePending ? "0" : (editComputedTotal > 0 ? editComputedTotal : editingExpense.amount)) 
                        : (editingExpense.paidAmount ?? 0)}
                      onChange={(e) => setEditingExpense({ ...editingExpense, paidAmount: e.target.value })}
                      disabled={editingExpense.paymentMethod === "cash" || editingExpense.pricePending}
                      className="rounded-xl h-11"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="editDate" className="text-xs font-bold text-foreground mb-1 block">التاريخ</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="editDescription" className="text-xs font-bold text-foreground mb-1 block">الوصف والملاحظات</Label>
                  <Textarea
                    id="editDescription"
                    value={editingExpense.description || ""}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                    className="rounded-xl resize-none"
                    rows={2}
                  />
                </div>

                <Button onClick={handleUpdateExpense} className="w-full h-12 rounded-2xl font-bold text-base shadow-md" variant="destructive">
                  حفظ التعديلات
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="max-w-md rounded-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                تسجيل سداد دفعة للمورد
              </DialogTitle>
              <DialogDescription className="text-xs">
                سداد جزء من المبلغ المتبقي للمورد وتحديث الرصيد فوراً
              </DialogDescription>
            </DialogHeader>
            {payingExpense && (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-muted/50 text-xs space-y-1.5 border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">فئة المصروف:</span>
                    <span className="font-bold">{payingExpense.category}</span>
                  </div>
                  {payingExpense.supplierName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">اسم المورد:</span>
                      <span className="font-bold text-primary">{payingExpense.supplierName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">إجمالي الفاتورة:</span>
                    <span className="font-bold">{payingExpense.amount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المدفوع سابقاً:</span>
                    <span className="font-bold text-emerald-600">{(payingExpense.paidAmount || 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-destructive font-black border-t pt-1.5 mt-1 text-sm">
                    <span>المتبقي المطلوب سداده:</span>
                    <span>{(payingExpense.amount - (payingExpense.paidAmount || 0)).toLocaleString()} ج.م</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">مبلغ السداد الحالي (ج.م)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={payInstallmentAmount}
                    onChange={(e) => setPayInstallmentAmount(e.target.value)}
                    placeholder="أدخل قيمة الدفعة"
                    className="rounded-xl h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground mb-1 block">تاريخ السداد</Label>
                  <Input
                    type="date"
                    value={payInstallmentDate}
                    onChange={(e) => setPayInstallmentDate(e.target.value)}
                    className="rounded-xl h-11"
                  />
                </div>
                <Button
                  onClick={handleRecordExpensePayment}
                  className="w-full h-11 rounded-xl bg-gradient-primary text-white font-bold"
                  disabled={!payInstallmentAmount || parseFloat(payInstallmentAmount) <= 0}
                >
                  تأكيد وحفظ دفعة السداد
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {/* ── 2x2 KPI Cards (Mockup Style) ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Total Expenses */}
        <div className="bg-[#FFF5F5] dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/70 rounded-xl p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">إجمالي المصروفات</p>
            <p className="text-[15px] font-black text-[#B91C1C] dark:text-rose-400 num mt-0.5 tracking-tight truncate">
              {totalExpenses.toLocaleString()} <span className="text-[10px] font-bold">ج.م</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-rose-200/70 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Feed Tons */}
        <div className="bg-[#F9F4EB] dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-xl p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">أطنان العلف</p>
            <p className="text-[15px] font-black text-[#92400E] dark:text-amber-400 num mt-0.5 tracking-tight truncate">
              {quantityStats.feedTons.toLocaleString()} <span className="text-[10px] font-bold">طن</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 text-xs">
            ⚖️
          </div>
        </div>

        {/* Card 3: Transactions Count */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">عدد المعاملات</p>
            <p className="text-[15px] font-black text-slate-900 dark:text-white num mt-0.5 tracking-tight truncate">
              {expenses.length}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs">
            📦
          </div>
        </div>

        {/* Card 4: Total Remaining to Suppliers */}
        <div className="bg-[#FFFBEB] dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-xl p-2.5 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 truncate">المتبقي للموردين</p>
            <p className="text-[15px] font-black text-[#D97706] dark:text-amber-400 num mt-0.5 tracking-tight truncate">
              {creditStats.totalRemaining.toLocaleString()} <span className="text-[10px] font-bold">ج.م</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Receipt className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── Expenses List Container (Modern Cairo Card System) ────────────────────────────── */}
      <div className="bg-white dark:bg-[#151f32] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-extrabold text-slate-900 dark:text-white">سجل المصروفات</h2>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full num">
              {filteredExpenses.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="ابحث بالفئة أو المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 dark:bg-[#0b1120] text-[11px] font-semibold text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 w-44 focus:outline-none border border-slate-200/50 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2.5">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-2xl">📋</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">لا توجد مصروفات مسجلة</p>
            </div>
          ) : (
            filteredExpenses.slice(0, visibleCount).map((item) => {
              const isPendingPrice = item.pricePending || (!item.amount && Boolean(item.quantity));
              const isCredit = item.paymentMethod === "credit";
              const paid = item.paidAmount ?? 0;
              const remaining = Math.max(0, item.amount - paid);
              const isFullyPaid = !isCredit || remaining <= 0;
              const supName = item.supplierName || (item.clientId ? clients.find((c) => c.id === item.clientId)?.name : null);
              const detailsText = [supName, item.description && item.description !== item.category ? item.description : ""].filter(Boolean).join(" • ") || "بدون مورد";

              // Icon & Accent styling based on category
              const getIconInfo = (cat: string) => {
                switch (cat) {
                  case "كتاكيت":
                    return { Icon: Egg, bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" };
                  case "نشارة":
                    return { Icon: Layers, bg: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300" };
                  case "إنترنت":
                    return { Icon: Wifi, bg: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" };
                  case "كاميرات":
                    return { Icon: Camera, bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" };
                  case "علف":
                    return { Icon: Package, bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
                  case "غاز":
                    return { Icon: Flame, bg: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" };
                  case "كهرباء":
                    return { Icon: Zap, bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300" };
                  case "مياه":
                    return { Icon: Droplets, bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" };
                  case "عمالة":
                  case "مرتبات":
                    return { Icon: Users, bg: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" };
                  default:
                    return { Icon: TrendingDown, bg: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" };
                }
              };

              const { Icon, bg } = getIconInfo(item.category);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50/90 dark:bg-[#0b1120]/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate">
                            {item.category}
                          </p>
                          {isPendingPrice ? (
                            <button
                              type="button"
                              onClick={() => handleEditExpense(item)}
                              className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 animate-pulse transition"
                            >
                              ⏳ بانتظار تحديد السعر
                            </button>
                          ) : isCredit ? (
                            isFullyPaid ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                آجل • مسدد
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPayDialog(item)}
                                className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-emerald-100 dark:bg-amber-950/80 dark:hover:bg-emerald-950/80 text-amber-800 dark:text-amber-300 hover:text-emerald-800 dark:hover:text-emerald-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 transition"
                              >
                                {`آجل • سداد (متبقي ${remaining.toLocaleString('en-US')} ج)`}
                              </button>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              نقدي
                            </span>
                          )}
                        </div>

                        <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {detailsText}
                        </p>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="text-[16px] font-black text-[#B91C1C] dark:text-rose-400 num">
                        {isPendingPrice ? (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">قيد التحديد</span>
                        ) : (
                          <span dir="ltr" className="inline-block font-mono font-bold">
                            -{item.amount.toLocaleString('en-US')} <span className="text-[11px] font-bold font-cairo">ج.م</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Metadata & Actions Bar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">
                      <span className="num font-semibold">{item.date}</span>
                      {item.quantity ? (
                        <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 num">
                          {item.quantity} {item.category === "علف" ? "طن" : item.category === "كتاكيت" ? "كتكوت" : "وحدة"}
                        </span>
                      ) : null}
                      {item.unitPrice ? (
                        <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 num">
                          @ {item.unitPrice.toLocaleString('en-US')} ج
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditExpense(item)}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                            deleteExpense(item.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination Load More Controls ────────────────────────────── */}
        {filteredExpenses.length > visibleCount && (
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setVisibleCount((prev) => prev + PAGE_SIZE);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-600 active:scale-98"
            >
              <span>عرض المزيد ({Math.max(0, filteredExpenses.length - visibleCount)} معاملة متبقية)</span>
              <span>↓</span>
            </button>
            {filteredExpenses.length - visibleCount > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setVisibleCount(filteredExpenses.length);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition border border-slate-200/80 dark:border-slate-600 active:scale-98"
              >
                عرض الكل
              </button>
            )}
          </div>
        )}
      </div>


      {/* Smart Voice AI Assistant Modal */}
      <SmartVoiceModal
        open={isSmartVoiceOpen}
        onOpenChange={setIsSmartVoiceOpen}
        defaultType="expense"
      />
    </div>
  );
}