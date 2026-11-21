import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, TrendingUp, Egg, Package, ChefHat, Wallet, Users as UsersIcon, Clock, Receipt, Coins, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext, Revenue } from "@/contexts/AppContext";
import { sortByDateDesc } from "@/lib/utils";
import { SmartVoiceModal } from "@/components/SmartVoiceModal";
import { triggerHaptic } from "@/lib/haptics";

type FormState = {
  type: string;
  quantity: string;
  unitPrice: string;
  date: string;
  notes: string;
  clientId: string;
  paymentMethod: string;
  amountPaidNow: string;
  pricePending: boolean;
};

const emptyForm: FormState = {
  type: "",
  quantity: "",
  unitPrice: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  clientId: "none",
  paymentMethod: "cash",
  amountPaidNow: "",
  pricePending: false,
};

const PAGE_SIZE = 30;

const revenueTypes = [
  { value: "بيض", label: "بيض", icon: Egg, qtyLabel: "الكمية (طبق)", priceLabel: "سعر البيع (طبق)" },
  { value: "فراخ", label: "فراخ", icon: ChefHat, qtyLabel: "الوزن (كجم)", priceLabel: "سعر الكيلو" },
  { value: "سبلة", label: "سبلة", icon: Package, qtyLabel: "الكمية", priceLabel: "السعر للوحدة" },
  { value: "أخرى", label: "أخرى", icon: Plus, qtyLabel: "الكمية", priceLabel: "سعر الوحدة" },
];

export default function Revenues() {
  const { revenues, clients, payments, addRevenue, updateRevenue, deleteRevenue, addPayment, getClientTotals } = useAppContext();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Revenue | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSmartVoiceOpen, setIsSmartVoiceOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // إعادة ضبط التصفح عند كتابة بحث جديد
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  // Listen to Quick Add FAB from global navigation
  useEffect(() => {
    const handleOpenAdd = () => {
      setForm(emptyForm);
      setIsAddOpen(true);
    };
    window.addEventListener("open-add-revenue-dialog", handleOpenAdd);
    return () => window.removeEventListener("open-add-revenue-dialog", handleOpenAdd);
  }, []);

  // Installment payments for credit revenues
  const [payOpen, setPayOpen] = useState(false);
  const [payingRevenue, setPayingRevenue] = useState<Revenue | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");

  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);
  const qty = parseFloat(form.quantity) || 0;
  const price = parseFloat(form.unitPrice) || 0;
  const total = qty * price;

  const handleAdd = async () => {
    const isPending = form.pricePending;
    const canSubmit = form.type && form.date && (total > 0 || (isPending && qty > 0));
    if (!canSubmit) return;
    
    await addRevenue({
      type: form.type,
      amount: isPending ? 0 : total,
      date: form.date,
      notes: form.notes,
      quantity: qty || null,
      unitPrice: isPending ? null : (price || null),
      clientId: form.clientId && form.clientId !== "none" ? form.clientId : null,
      paymentMethod: form.paymentMethod,
      pricePending: isPending,
    });

    const selectedClientId = form.clientId && form.clientId !== "none" ? form.clientId : null;
    const paidAmt = form.paymentMethod === "cash" ? (isPending ? 0 : total) : (parseFloat(form.amountPaidNow) || 0);

    if (selectedClientId && paidAmt > 0) {
      await addPayment({
        clientId: selectedClientId,
        amount: paidAmt,
        date: form.date,
        notes: `دفعة مقدمة مع إيراد مبيعات ${form.type}`,
      });
    }

    setForm(emptyForm);
    setIsAddOpen(false);
  };

  const startEdit = (r: Revenue) => {
    triggerHaptic('medium');
    setEditing({ 
      ...r,
      pricePending: r.pricePending ?? (!r.amount && Boolean(r.quantity))
    });
    setIsEditOpen(true);
  };

  const editQty = editing?.quantity ?? 0;
  const editPrice = editing?.unitPrice ?? 0;
  const editTotal = (editQty || 0) * (editPrice || 0);

  const handleUpdate = async () => {
    if (!editing) return;
    const isPending = editing.pricePending;
    const calculatedAmount = (editing.quantity || 0) * (editing.unitPrice || 0);
    const finalAmount = isPending ? 0 : (calculatedAmount > 0 ? calculatedAmount : editing.amount);

    const updated: Revenue = {
      ...editing,
      amount: finalAmount,
      pricePending: isPending && finalAmount === 0,
      unitPrice: isPending && !editing.unitPrice ? null : editing.unitPrice
    };
    await updateRevenue(updated);
    setEditing(null);
    setIsEditOpen(false);
  };

  const clientSummaries = useMemo(() => {
    return clients
      .map(c => ({ client: c, ...getClientTotals(c.id) }))
      .filter(c => c.sales > 0 || c.paid > 0);
  }, [clients, revenues, payments]);

  const sortedRevenues = useMemo(() => {
    return [...revenues]
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const client = r.clientId ? clients.find(c => c.id === r.clientId)?.name?.toLowerCase() : "";
        return r.type.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q)) || (client && client.includes(q)) || r.date.includes(q);
      })
      .sort(sortByDateDesc);
  }, [revenues, searchQuery, clients]);

  const handleOpenPayDialog = (r: Revenue) => {
    triggerHaptic('medium');
    setPayingRevenue(r);
    setPayAmount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayNotes("");
    setPayOpen(true);
  };

  const handleAddPayment = async () => {
    const amt = parseFloat(payAmount);
    if (!payingRevenue || !payingRevenue.clientId || !amt || amt <= 0) return;

    await addPayment({
      clientId: payingRevenue.clientId,
      amount: amt,
      date: payDate,
      notes: payNotes || `سداد دفعة لإيراد مبيعات ${payingRevenue.type}`
    });

    setPayOpen(false);
    setPayingRevenue(null);
  };

  const clientName = (id?: string | null) =>
    id ? clients.find(c => c.id === id)?.name ?? "—" : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">الإيرادات</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">إدارة ومتابعة إيرادات المزرعة</p>
        </div>

        {/* Actions (Smart Voice Assistant + Add Revenue) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSmartVoiceOpen(true)}
            className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition active:scale-95"
            title="تسجيل إيراد صوتي ذكي بالذكاء الاصطناعي"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">مساعد صوتي ذكي</span>
          </button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <button className="bg-[#123962] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95">
                <span>+</span>
                <span>إيراد جديد</span>
              </button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة إيراد جديد</DialogTitle>
              <DialogDescription>أدخل تفاصيل الإيراد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نوع الإيراد</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    {revenueTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2"><t.icon className="h-4 w-4" />{t.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.type && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{revenueTypes.find(t => t.value === form.type)?.qtyLabel}</Label>
                      <Input type="number" inputMode="decimal" value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                      <Label>{revenueTypes.find(t => t.value === form.type)?.priceLabel} (ج.م)</Label>
                      <Input 
                        type="number" 
                        inputMode="decimal" 
                        value={form.unitPrice}
                        disabled={form.pricePending}
                        onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} 
                        placeholder={form.pricePending ? "السعر لاحقاً" : "0"} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <input
                      type="checkbox"
                      id="revPricePending"
                      checked={form.pricePending}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setForm({
                          ...form,
                          pricePending: isChecked,
                          unitPrice: isChecked ? "" : form.unitPrice
                        });
                      }}
                      className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="revPricePending" className="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                      تحديد السعر لاحقاً (تسجيل الكمية/الوزن فقط الآن)
                    </label>
                  </div>
                </>
              )}

              <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">إجمالي السعر</span>
                {form.pricePending ? (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    قيد التحديد لاحقاً
                  </span>
                ) : (
                  <span className="text-lg font-bold text-success">{total.toLocaleString()} ج.م</span>
                )}
              </div>

              <div>
                <Label>العميل</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون عميل</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>طريقة الدفع</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="credit">آجل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.clientId && form.clientId !== "none" && (
                <div>
                  <Label>المبلغ المدفوع حالياً (ج.م)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={form.paymentMethod === "cash" ? total : form.amountPaidNow}
                    onChange={(e) => setForm({ ...form, amountPaidNow: e.target.value })}
                    disabled={form.paymentMethod === "cash" || form.pricePending}
                    placeholder="0"
                  />
                  {form.paymentMethod === "credit" && !form.pricePending && (
                    <p className="text-xs text-muted-foreground mt-1">
                      المتبقي كمديونية على العميل: {Math.max(0, total - (parseFloat(form.amountPaidNow) || 0)).toLocaleString()} ج.م
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" />
              </div>

              <Button onClick={handleAdd} className="w-full" disabled={!form.type || (total <= 0 && (!form.pricePending || qty <= 0))}>
                إضافة الإيراد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل الإيراد</DialogTitle>
              <DialogDescription>تعديل تفاصيل الإيراد</DialogDescription>
            </DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div>
                  <Label>النوع</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {revenueTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>الكمية</Label>
                    <Input type="number" value={editing.quantity ?? ""}
                      onChange={(e) => setEditing({ ...editing, quantity: e.target.value ? parseFloat(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label>سعر الوحدة</Label>
                    <Input 
                      type="number" 
                      value={editing.unitPrice ?? ""}
                      disabled={editing.pricePending}
                      placeholder={editing.pricePending ? "السعر لاحقاً" : "0"}
                      onChange={(e) => setEditing({ ...editing, unitPrice: e.target.value ? parseFloat(e.target.value) : null })} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <input
                    type="checkbox"
                    id="editRevPricePending"
                    checked={editing.pricePending || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditing({
                        ...editing,
                        pricePending: isChecked,
                        unitPrice: isChecked ? null : editing.unitPrice
                      });
                    }}
                    className="h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="editRevPricePending" className="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                    السعر معلق / بانتظار التحديد لاحقاً
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الإجمالي</span>
                  {editing.pricePending ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                      قيد التحديد لاحقاً
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-success">
                      {(editTotal > 0 ? editTotal : editing.amount).toLocaleString()} ج.م
                    </span>
                  )}
                </div>
                <div>
                  <Label>العميل</Label>
                  <Select value={editing.clientId || "none"} onValueChange={(v) => setEditing({ ...editing, clientId: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون عميل</SelectItem>
                      {clients.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>طريقة الدفع</Label>
                  <Select value={editing.paymentMethod || "cash"} onValueChange={(v) => setEditing({ ...editing, paymentMethod: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="credit">آجل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>التاريخ</Label>
                  <Input type="date" value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea value={editing.notes || ""}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
                </div>
                <Button onClick={handleUpdate} className="w-full">حفظ التعديلات</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog for Revenue */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تسجيل دفعة من العميل</DialogTitle>
              <DialogDescription>
                تحصيل دفعة مالية لحساب المعاملة
              </DialogDescription>
            </DialogHeader>
            {payingRevenue && (
              <div className="space-y-4">
                {(() => {
                  const clientTotals = payingRevenue.clientId ? getClientTotals(payingRevenue.clientId) : { balance: 0 };
                  return (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>نوع المعاملة:</span>
                        <span className="font-semibold">{payingRevenue.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>العميل:</span>
                        <span className="font-semibold text-primary">{clientName(payingRevenue.clientId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>قيمة المعاملة:</span>
                        <span className="font-semibold">{payingRevenue.amount.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex justify-between text-warning font-bold border-t pt-1 mt-1">
                        <span>إجمالي مديونية العميل الحالية:</span>
                        <span>{clientTotals.balance.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <Label>مبلغ الدفعة المحصلة (ج.م)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="أدخل قيمة الدفعة"
                  />
                </div>
                <div>
                  <Label>تاريخ التحصيل</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>ملاحظات / بيان</Label>
                  <Textarea
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="ملاحظات اختيارية"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleAddPayment}
                  className="w-full bg-gradient-primary text-white"
                  disabled={!payAmount || parseFloat(payAmount) <= 0}
                >
                  حفظ دفعة التحصيل
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Top KPI Summary Cards (Mockup Style) ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Revenue */}
        <div className="bg-[#EFFAF5] dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 rounded-2xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">إجمالي الإيرادات</p>
            <p className="text-[17px] font-extrabold text-[#047857] dark:text-emerald-400 num mt-0.5">
              {totalRevenues.toLocaleString()} <span className="text-[11px]">ج.م</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Transactions Count */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">المعاملات</p>
            <p className="text-[17px] font-extrabold text-slate-900 dark:text-white num mt-0.5">
              {revenues.length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-sm">
            📦
          </div>
        </div>
      </div>

      {/* ── Full-width Total Due Card (Mockup Style) ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-amber-200/90 dark:border-amber-800/50 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
        <div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المستحق (مبيعات آجلة)</p>
          <p className="text-[18px] font-extrabold text-[#D97706] dark:text-amber-400 num mt-0.5">
            {clientSummaries.reduce((s, c) => s + c.balance, 0).toLocaleString()} <span className="text-xs">ج.م</span>
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      {/* ── Incomes List Container (Modern Cairo Card System) ────────────────────────────── */}
      <div className="bg-white dark:bg-[#151f32] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-extrabold text-slate-900 dark:text-white">سجل الإيرادات</h2>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full num">
              {sortedRevenues.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="ابحث بالمنتج أو العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 dark:bg-[#0b1120] text-[11px] font-semibold text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 w-44 focus:outline-none border border-slate-200/50 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2.5">
          {sortedRevenues.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-2xl">🌱</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">لا توجد إيرادات مسجلة</p>
            </div>
          ) : (
            sortedRevenues.slice(0, visibleCount).map((r) => {
              const isPendingPrice = r.pricePending || (!r.amount && Boolean(r.quantity));
              const isCredit = r.paymentMethod === "credit";
              const clientTotals = r.clientId ? getClientTotals(r.clientId) : { balance: 0 };
              const isFullyPaid = !isCredit || clientTotals.balance <= 0;

              return (
                <div
                  key={r.id}
                  className="bg-slate-50/90 dark:bg-[#0b1120]/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        r.type === 'بيض' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' 
                          : r.type === 'فراخ' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {r.type === 'بيض' ? <Egg className="w-5 h-5" /> : r.type === 'فراخ' ? <ChefHat className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate">
                            {r.type}
                          </p>
                          {isPendingPrice ? (
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 animate-pulse transition"
                            >
                              ⏳ بانتظار تحديد السعر
                            </button>
                          ) : isCredit ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPayDialog(r)}
                              className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-emerald-100 dark:bg-amber-950/80 dark:hover:bg-emerald-950/80 text-amber-800 dark:text-amber-300 hover:text-emerald-800 dark:hover:text-emerald-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 transition"
                            >
                              {isFullyPaid ? "آجل • مسدد" : `آجل • سداد (متبقي ${clientTotals.balance.toLocaleString('en-US')} ج)`}
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              نقدي
                            </span>
                          )}
                        </div>

                        <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                          {r.clientId ? clientName(r.clientId) : (r.notes || "بدون عميل")}
                        </p>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="text-[16px] font-black text-[#047857] dark:text-emerald-400 num">
                        {isPendingPrice ? (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">قيد التحديد</span>
                        ) : (
                          <span dir="ltr" className="inline-block font-mono font-bold">
                            +{r.amount.toLocaleString('en-US')} <span className="text-[11px] font-bold font-cairo">ج.م</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Metadata & Actions Bar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">
                      <span className="num font-semibold">{r.date}</span>
                      {r.quantity ? (
                        <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 num">
                          {r.quantity} {r.type === "بيض" ? "طبق" : r.type === "فراخ" ? "كجم" : "وحدة"}
                        </span>
                      ) : null}
                      {r.unitPrice ? (
                        <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-200 num">
                          @ {r.unitPrice.toLocaleString('en-US')} ج
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-center text-xs transition"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا الإيراد؟')) {
                            deleteRevenue(r.id);
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
        {sortedRevenues.length > visibleCount && (
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setVisibleCount((prev) => prev + PAGE_SIZE);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-600 active:scale-98"
            >
              <span>عرض المزيد ({Math.max(0, sortedRevenues.length - visibleCount)} معاملة متبقية)</span>
              <span>↓</span>
            </button>
            {sortedRevenues.length - visibleCount > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setVisibleCount(sortedRevenues.length);
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
        defaultType="revenue"
      />
    </div>
  );
}
