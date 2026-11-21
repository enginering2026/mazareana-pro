import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Users, ShoppingCart, Truck, Search, Receipt, Calendar, MessageCircle, AlertCircle, FileText, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/AppContext";
import { toast } from "sonner";
import { sortByDateDesc } from "@/lib/utils";
import { openWhatsApp, generateClientStatementMessage, generatePaymentsLogMessage } from "@/lib/whatsappSharing";
import { ClientStatementModal } from "@/components/ClientStatementModal";
import { calculateClientStatementTotals, type StatementParams, generatePaymentsStatementMessage } from "@/lib/clientStatementTemplate";
import { triggerHaptic } from "@/lib/haptics";

const PAGE_SIZE = 30;

export default function Clients() {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientTotals,
    payments,
    expensePayments,
    addPayment,
    updatePayment,
    deletePayment,
    addExpensePayment,
    updateExpensePayment,
    deleteExpensePayment,
    expenses,
    currentFarm
  } = useAppContext();

  // Payment log states
  const [paymentsLogClient, setPaymentsLogClient] = useState<any>(null);
  const [isPaymentsLogOpen, setIsPaymentsLogOpen] = useState(false);

  // New payment form states
  const [newPayAmount, setNewPayAmount] = useState("");
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPayNotes, setNewPayNotes] = useState("");
  const [selectedExpenseId, setSelectedExpenseId] = useState("");

  // Edit payment modal states
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentNotes, setEditPaymentNotes] = useState("");

  const handleStartEditPayment = (p: any) => {
    setEditingPayment(p);
    setEditPaymentAmount(String(p.amount));
    setEditPaymentDate(p.date || new Date().toISOString().split("T")[0]);
    setEditPaymentNotes(p.notes || "");
    setIsEditPaymentDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    const amt = parseFloat(editPaymentAmount);
    if (!amt || amt <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للدفعة");
      return;
    }

    if (editingPayment.paymentType === "expense") {
      await updateExpensePayment({
        id: editingPayment.id,
        farmId: editingPayment.farmId,
        expenseId: editingPayment.expenseId,
        clientId: editingPayment.clientId,
        amount: amt,
        date: editPaymentDate,
        notes: editPaymentNotes
      });
    } else {
      await updatePayment({
        id: editingPayment.id,
        farmId: editingPayment.farmId,
        clientId: editingPayment.clientId,
        amount: amt,
        date: editPaymentDate,
        notes: editPaymentNotes
      });
    }

    setIsEditPaymentDialogOpen(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = async (p: any) => {
    if (window.confirm(`هل أنت متأكد من حذف هذه الدفعة بقيمة ${p.amount.toLocaleString()} ج.م؟`)) {
      if (p.paymentType === "expense") {
        await deleteExpensePayment(p.id);
      } else {
        await deletePayment(p.id);
      }
    }
  };

  const handleOpenPaymentsLog = (client: any) => {
    setPaymentsLogClient(client);
    setNewPayAmount("");
    setNewPayNotes("");
    setNewPayDate(new Date().toISOString().split("T")[0]);
    setSelectedExpenseId("");
    setIsPaymentsLogOpen(true);
  };

  const handleSavePayment = async () => {
    const amt = parseFloat(newPayAmount);
    if (!paymentsLogClient || !amt || amt <= 0) return;

    const clientTotals = getClientTotals(paymentsLogClient.id);
    const hasRevenuesOrBuyer = paymentsLogClient.type === "مشتري" || clientTotals.sales > 0 || (pendingExpenses.length === 0 && clientTotals.balance > 0);

    if (hasRevenuesOrBuyer && (!selectedExpenseId || selectedExpenseId === "none")) {
      await addPayment({
        clientId: paymentsLogClient.id,
        amount: amt,
        date: newPayDate,
        notes: newPayNotes || `دفعة من العميل (${paymentsLogClient.name})`
      });
      toast.success("تم تسجيل الدفعة بنجاح");
      setNewPayAmount("");
      setNewPayNotes("");
      setSelectedExpenseId("");
    } else {
      if (!selectedExpenseId) {
        toast.error("يرجى اختيار المصروف لتسجيل السداد عليه");
        return;
      }
      await addExpensePayment({
        expenseId: selectedExpenseId,
        clientId: paymentsLogClient.id,
        amount: amt,
        date: newPayDate,
        notes: newPayNotes || "سداد دفعة للمورد"
      });
      toast.success("تم تسجيل سداد دفعة المصروف بنجاح");
      setNewPayAmount("");
      setNewPayNotes("");
      setSelectedExpenseId("");
    }
  };

  const clientPayments = paymentsLogClient
    ? [
        ...payments.filter(p => p.clientId === paymentsLogClient.id).map(p => ({ ...p, paymentType: 'revenue' })),
        ...expensePayments.filter(ep => ep.clientId === paymentsLogClient.id).map(ep => ({ ...ep, paymentType: 'expense' }))
      ].sort(sortByDateDesc)
    : [];

  const pendingExpenses = paymentsLogClient
    ? expenses.filter(e => e.clientId === paymentsLogClient.id && e.paymentMethod === "credit" && (e.amount - (e.paidAmount || 0)) > 0)
    : [];

  const [newClient, setNewClient] = useState({
    name: "",
    type: "",
    phone: "",
    email: "",
    notes: "",
    creditLimit: "",
    nextPaymentDate: ""
  });

  const [editingClient, setEditingClient] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination on search or filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterType]);

  // Listen to Quick Add FAB from global navigation
  useEffect(() => {
    const handleOpenAdd = () => {
      setNewClient({
        name: "",
        type: "",
        phone: "",
        email: "",
        notes: "",
        creditLimit: "",
        nextPaymentDate: ""
      });
      setIsDialogOpen(true);
    };
    window.addEventListener("open-add-client-dialog", handleOpenAdd);
    return () => window.removeEventListener("open-add-client-dialog", handleOpenAdd);
  }, []);

  // Official Statement Modal states
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [activeStatementData, setActiveStatementData] = useState<StatementParams | null>(null);

  const buildClientStatement = (client: any): StatementParams => {
    const { sales, paid } = getClientTotals(client.id);
    const clientPayList = [
      ...payments.filter(p => p.clientId === client.id).map(p => ({ date: p.date, amount: p.amount, notes: p.notes })),
      ...expensePayments.filter(ep => ep.clientId === client.id).map(ep => ({ date: ep.date, amount: ep.amount, notes: ep.notes }))
    ].sort(sortByDateDesc);

    const totals = calculateClientStatementTotals(client, sales, paid, clientPayList.length);

    return {
      client,
      paymentsList: clientPayList,
      totals,
      farmName: currentFarm?.name || "مزرعة الأمل للدواجن والإنتاج الحيواني",
      isDemo: false
    };
  };

  const handleOpenStatementModal = (client: any) => {
    const data = buildClientStatement(client);
    setActiveStatementData(data);
    setStatementModalOpen(true);
  };

  const handleShareWhatsAppPaymentsLog = (client: any) => {
    if (!client) return;
    const stmt = buildClientStatement(client);
    const text = generatePaymentsStatementMessage(stmt);
    openWhatsApp(client.phone, text);
  };

  const handleShareWhatsAppStatement = (client: any) => {
    if (!client) return;
    const { sales, paid, balance } = getClientTotals(client.id);
    const clientPayList = [
      ...payments.filter(p => p.clientId === client.id).map(p => ({ date: p.date, amount: p.amount, notes: p.notes })),
      ...expensePayments.filter(ep => ep.clientId === client.id).map(ep => ({ date: ep.date, amount: ep.amount, notes: ep.notes }))
    ].sort(sortByDateDesc);

    const text = generateClientStatementMessage(
      client,
      {
        totalInvoices: sales,
        totalPayments: paid,
        remaining: balance,
        recentPayments: clientPayList
      },
      currentFarm?.name || "مزارعنا برو"
    );
    openWhatsApp(client.phone, text);
  };

  const handleAddClient = () => {
    if (newClient.name && newClient.type && newClient.phone) {
      addClient({
        name: newClient.name,
        type: newClient.type,
        phone: newClient.phone,
        email: newClient.email,
        notes: newClient.notes,
        creditLimit: newClient.creditLimit ? parseFloat(newClient.creditLimit) : undefined,
        nextPaymentDate: newClient.nextPaymentDate || undefined
      });
      setNewClient({ name: "", type: "", phone: "", email: "", notes: "", creditLimit: "", nextPaymentDate: "" });
      setIsDialogOpen(false);
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = () => {
    if (editingClient) {
      updateClient(editingClient);
      setEditingClient(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesType = filterType === "all" || client.type === filterType;
    return matchesSearch && matchesType;
  });

  const buyersCount = clients.filter(c => c.type === "مشتري").length;
  const suppliersCount = clients.filter(c => c.type === "مورد").length;

  return (
    <div className="space-y-2.5">
      {/* Header Row */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">إدارة العملاء والموردين</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">قاعدة بيانات وحسابات التجار والموردين</p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="bg-[#2563EB] hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 transition active:scale-95">
                <span>+</span>
                <span>عميل جديد</span>
              </button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">إضافة عميل جديد</DialogTitle>
              <DialogDescription className="text-sm">
                أدخل معلومات العميل الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 p-1">
              <div>
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  placeholder="أدخل اسم العميل"
                />
              </div>
              
              <div>
                <Label htmlFor="type">النوع</Label>
                <Select value={newClient.type} onValueChange={(value) => setNewClient({...newClient, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مشتري">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        مشتري
                      </div>
                    </SelectItem>
                    <SelectItem value="مورد">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        مورد
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              
              <div>
                <Label htmlFor="creditLimit">الحد الائتماني الأقصى (ج.م) - اختياري</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={newClient.creditLimit}
                  onChange={(e) => setNewClient({...newClient, creditLimit: e.target.value})}
                  placeholder="مثال: 50000 (تنبيه عند التجاوز)"
                />
              </div>

              <div>
                <Label htmlFor="nextPaymentDate">موعد استحقاق السداد القادم - اختياري</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={newClient.nextPaymentDate}
                  onChange={(e) => setNewClient({...newClient, nextPaymentDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  placeholder="أدخل ملاحظات إضافية"
                />
              </div>
              
              <Button onClick={handleAddClient} className="w-full">
                إضافة العميل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">تعديل بيانات العميل</DialogTitle>
              <DialogDescription className="text-sm">
                تعديل معلومات العميل المحدد
              </DialogDescription>
            </DialogHeader>
            {editingClient && (
              <div className="space-y-3 sm:space-y-4 p-1">
                <div>
                  <Label htmlFor="editName">الاسم</Label>
                  <Input
                    id="editName"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editType">النوع</Label>
                  <Select value={editingClient.type} onValueChange={(value) => setEditingClient({...editingClient, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مشتري">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          مشتري
                        </div>
                      </SelectItem>
                      <SelectItem value="مورد">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          مورد
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editPhone">رقم الهاتف</Label>
                  <Input
                    id="editPhone"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editEmail">البريد الإلكتروني</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingClient.email || ""}
                    onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editCreditLimit">الحد الائتماني الأقصى (ج.م) - اختياري</Label>
                  <Input
                    id="editCreditLimit"
                    type="number"
                    value={editingClient.creditLimit ?? ""}
                    onChange={(e) => setEditingClient({...editingClient, creditLimit: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="مثال: 50000"
                  />
                </div>

                <div>
                  <Label htmlFor="editNextPaymentDate">موعد استحقاق السداد القادم - اختياري</Label>
                  <Input
                    id="editNextPaymentDate"
                    type="date"
                    value={editingClient.nextPaymentDate ?? ""}
                    onChange={(e) => setEditingClient({...editingClient, nextPaymentDate: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="editNotes">ملاحظات</Label>
                  <Textarea
                    id="editNotes"
                    value={editingClient.notes || ""}
                    onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                  />
                </div>
                
                <Button onClick={handleUpdateClient} className="w-full">
                  حفظ التعديلات
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="البحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100/80 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-xl py-2 pr-8 pl-3 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl px-2.5 py-2 focus:outline-none"
        >
          <option value="all">الكل</option>
          <option value="مشتري">عملاء</option>
          <option value="مورد">موردين</option>
        </select>
      </div>

      {/* 3 Compact Horizontal KPI Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500">إجمالي العملاء</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white num">{clients.length}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs">👥</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500">المشترين</p>
            <p className="text-base font-extrabold text-emerald-600 num">{buyersCount}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-xs">🛒</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500">الموردين</p>
            <p className="text-base font-extrabold text-blue-600 num">{suppliersCount}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-xs">🚚</div>
        </div>
      </div>

      {/* Clients Cards List (Modern Cairo Card System) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-extrabold text-slate-800 dark:text-white">بطاقات العملاء والموردين</h2>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full num">
            {filteredClients.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredClients.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-2xl">👥</p>
              <p className="text-slate-400 text-xs font-bold">لا يوجد عملاء أو موردين مطابقين للبحث</p>
            </div>
          ) : (
            filteredClients.slice(0, visibleCount).map((client) => {
              const { sales, paid, balance } = getClientTotals(client.id);
              return (
                <div 
                  key={client.id} 
                  onClick={() => {
                    triggerHaptic('medium');
                    handleOpenPaymentsLog(client);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs space-y-2.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">{client.name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          client.type === 'مشتري' 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        }`}>
                          {client.type === 'مشتري' ? 'عميل' : 'مورد'}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-400 num font-semibold mt-0.5">{client.phone}</p>
                      {client.creditLimit && balance > client.creditLimit && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60 mt-1 w-fit">
                          <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>تجاوز الحد الائتماني (الحد: {client.creditLimit.toLocaleString()} ج.م)</span>
                        </div>
                      )}
                      {client.nextPaymentDate && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5">
                          <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>استحقاق السداد: {client.nextPaymentDate}</span>
                        </div>
                      )}
                      {client.notes && <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 truncate">{client.notes}</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                          }}
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                          title="اتصال"
                        >
                          📞
                        </a>
                      )}
                      {client.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            handleShareWhatsAppPaymentsLog(client);
                          }}
                          className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900 transition border border-emerald-200/60 dark:border-emerald-800"
                          title="إرسال كشف الحساب عبر واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          handleOpenStatementModal(client);
                        }}
                        className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900 transition border border-purple-200/60 dark:border-purple-800"
                        title="استعراض وتصدير كشف الدفعات والتحصيلات (PDF وواتساب)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          handleOpenPaymentsLog(client);
                        }}
                        className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition border border-blue-200/60 dark:border-blue-800"
                        title="تسجيل وعرض الدفعات"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          handleEditClient(client);
                        }}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs hover:bg-amber-100 dark:hover:bg-amber-900 transition"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("هل أنت متأكد من حذف هذا العميل وجميع سجلاته؟")) {
                            handleDeleteClient(client.id);
                          }
                        }}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-rose-600 flex items-center justify-center text-xs hover:bg-rose-100 dark:hover:bg-rose-900 transition"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 3-Column Financial Row (المشتريات/المبيعات | المسدد | المتبقي له/المديونية) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-center">
                    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl py-1.5 px-1">
                      <p className="text-[9.5px] text-slate-400 font-bold">{client.type === 'مشتري' ? 'المبيعات' : 'المشتريات'}</p>
                      <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-white num">{sales.toLocaleString()} <span className="text-[9px]">ج.م</span></p>
                    </div>
                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl py-1.5 px-1">
                      <p className="text-[9.5px] text-slate-400 font-bold">{client.type === 'مشتري' ? 'المدفوع' : 'المسدد'}</p>
                      <p className="text-[12.5px] font-extrabold text-emerald-600 dark:text-emerald-400 num">{paid.toLocaleString()} <span className="text-[9px]">ج.م</span></p>
                    </div>
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl py-1.5 px-1">
                      <p className="text-[9.5px] text-slate-400 font-bold">{client.type === 'مشتري' ? 'المديونية' : 'المتبقي له'}</p>
                      <p className={`text-[12.5px] font-extrabold num ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{balance.toLocaleString()} <span className="text-[9px]">ج.م</span></p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination Load More Controls ────────────────────────────── */}
        {filteredClients.length > visibleCount && (
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setVisibleCount((prev) => prev + PAGE_SIZE);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-600 active:scale-98"
            >
              <span>عرض المزيد ({Math.max(0, filteredClients.length - visibleCount)} عميل متبقي)</span>
              <span>↓</span>
            </button>
            {filteredClients.length - visibleCount > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setVisibleCount(filteredClients.length);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition border border-slate-200/80 dark:border-slate-600 active:scale-98"
              >
                عرض الكل
              </button>
            )}
          </div>
        )}
      </div>


      {/* Payments Log & Record Payment Dialog */}
      <Dialog open={isPaymentsLogOpen} onOpenChange={setIsPaymentsLogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              سجل دفعات العميل: {paymentsLogClient?.name} ({paymentsLogClient?.type})
            </DialogTitle>
            <DialogDescription>
              عرض سجل المدفوعات السابقة وتسجيل دفعة جديدة للعميل.
            </DialogDescription>
          </DialogHeader>

          {paymentsLogClient && (
            <div className="space-y-6">
              {/* Client Info Summary */}
              {(() => {
                const { sales, paid, balance } = getClientTotals(paymentsLogClient.id);
                return (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-xl border text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">{paymentsLogClient.type === "مشتري" ? "إجمالي المبيعات" : "إجمالي المشتريات"}</p>
                      <p className="text-base font-bold text-foreground">{sales.toLocaleString()} ج.م</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{paymentsLogClient.type === "مشتري" ? "إجمالي المدفوع" : "إجمالي المسدد"}</p>
                      <p className="text-base font-bold text-success">{paid.toLocaleString()} ج.م</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{paymentsLogClient.type === "مشتري" ? "المديونية المتبقية" : "المستحق المتبقي له"}</p>
                      <p className={`text-base font-bold ${balance > 0 ? "text-warning" : "text-muted-foreground"}`}>{balance.toLocaleString()} ج.م</p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenStatementModal(paymentsLogClient)}
                  className="border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs gap-1.5 rounded-xl shadow-2xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>استعراض وتصدير كشف الحساب (PDF)</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleShareWhatsAppPaymentsLog(paymentsLogClient)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال الكشف عبر واتساب</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Right: Record Payment Form */}
                <div className="space-y-4 p-4 border rounded-xl bg-card">
                  <h4 className="font-semibold text-sm border-b pb-2 text-foreground">تسجيل دفعة جديدة</h4>
                  
                  {paymentsLogClient.type === "مورد" && pendingExpenses.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">اختر المصروف الآجل المستحق (اختياري)</Label>
                      <Select value={selectedExpenseId} onValueChange={setSelectedExpenseId}>
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue placeholder="اختر المصروف لتسديده أو اتركه لدفعة عامة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">سداد عام / بدون ربط بمصروف محدد</SelectItem>
                          {pendingExpenses.map(e => {
                            const rem = e.amount - (e.paidAmount || 0);
                            return (
                              <SelectItem key={e.id} value={e.id} className="text-xs">
                                {e.category} - {e.date} (المتبقي: {rem.toLocaleString()} ج.م)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor="payAmount">المبلغ (ج.م)</Label>
                    <Input
                      id="payAmount"
                      type="number"
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor="payDate">التاريخ</Label>
                    <Input
                      id="payDate"
                      type="date"
                      value={newPayDate}
                      onChange={(e) => setNewPayDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs" htmlFor="payNotes">البيان/ملاحظات</Label>
                    <Textarea
                      id="payNotes"
                      value={newPayNotes}
                      onChange={(e) => setNewPayNotes(e.target.value)}
                      placeholder="وصف إضافي للعملية"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleSavePayment}
                    className="w-full text-xs bg-gradient-primary hover:opacity-90 text-white"
                    disabled={
                      !newPayAmount || 
                      parseFloat(newPayAmount) <= 0
                    }
                  >
                    تسجيل العملية
                  </Button>
                </div>

                {/* Left: Payments List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-sm text-foreground">سجل العمليات السابقة</h4>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {clientPayments.length} حركة
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {clientPayments.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">لا توجد عمليات دفع مسجلة بعد.</p>
                    ) : (
                      clientPayments.map((p) => (
                        <div key={p.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5 transition hover:border-blue-300 dark:hover:border-blue-600">
                          <div className="flex items-center justify-between font-semibold">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 dark:text-white font-extrabold text-[13px] num">{p.amount.toLocaleString()} ج.م</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                p.paymentType === 'revenue' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              }`}>
                                {p.paymentType === 'revenue' ? 'تحصيل عميل' : 'سداد مورد'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[10.5px] num mr-1">{p.date}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditPayment(p)}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-amber-400 hover:text-amber-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition shadow-2xs cursor-pointer"
                                title="تعديل هذه الدفعة"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p)}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-rose-400 hover:text-rose-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition shadow-2xs cursor-pointer"
                                title="حذف هذه الدفعة"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          {p.notes && <p className="text-slate-500 dark:text-slate-300 text-[11px] font-medium leading-tight">{p.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditPaymentDialogOpen} onOpenChange={setIsEditPaymentDialogOpen}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <span>✏️</span>
              <span>تعديل بيانات الدفعة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              تعديل مبلغ الدفعة أو تاريخها أو الملاحظات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" htmlFor="editPayAmount">المبلغ (ج.م) *</Label>
              <Input
                id="editPayAmount"
                type="number"
                value={editPaymentAmount}
                onChange={(e) => setEditPaymentAmount(e.target.value)}
                placeholder="0"
                className="font-bold text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" htmlFor="editPayDate">تاريخ الدفعة</Label>
              <Input
                id="editPayDate"
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" htmlFor="editPayNotes">البيان / ملاحظات</Label>
              <Textarea
                id="editPayNotes"
                value={editPaymentNotes}
                onChange={(e) => setEditPaymentNotes(e.target.value)}
                placeholder="وصف العملية"
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleUpdatePayment}
                className="flex-1 bg-gradient-primary text-white text-xs font-bold py-2 rounded-xl"
              >
                حفظ التعديل
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditPaymentDialogOpen(false)}
                className="flex-1 text-xs py-2 rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Cash Payments & Collections Statement Modal */}
      <ClientStatementModal
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        realStatement={activeStatementData}
      />
    </div>
  );
}