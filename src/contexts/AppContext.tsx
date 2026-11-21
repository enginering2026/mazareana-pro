import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { sortByDateDesc } from '@/lib/utils';
import { persistAppData, migrateLocalStorageToIndexedDB, idbGet } from '@/lib/indexedDbStorage';
import { triggerHaptic } from '@/lib/haptics';

// Types
export interface Farm {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  createdAt: string;
  capacity?: string;
  cycleStartDate?: string;
  flockAge?: string;
  mortalityRate?: string;
  currentCycle?: string;
  status?: string;
}

export const calculateFlockAgeDays = (cycleStartDate?: string, fallbackDays = 24): number => {
  if (!cycleStartDate) return fallbackDays;
  const start = new Date(cycleStartDate);
  if (isNaN(start.getTime())) return fallbackDays;
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export interface Revenue {
  id: string;
  farmId: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
  quantity?: number | null;
  unitPrice?: number | null;
  clientId?: string | null;
  paymentMethod?: string;
  createdAt?: string;
  pricePending?: boolean;
}

export interface Expense {
  id: string;
  farmId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  quantity?: number | null;
  unitPrice?: number | null;
  paymentMethod?: string;
  paidAmount?: number;
  supplierName?: string;
  clientId?: string | null;
  createdAt?: string;
  pricePending?: boolean;
}

export interface ExpensePayment {
  id: string;
  farmId: string;
  expenseId: string;
  clientId?: string | null;
  amount: number;
  date: string;
  notes: string;
  createdAt?: string;
}

export interface Payment {
  id: string;
  farmId: string;
  clientId: string;
  amount: number;
  date: string;
  notes: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  farmId: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  notes: string;
  invoices: number;
  totalAmount: number;
  creditLimit?: number;
  nextPaymentDate?: string;
}

export interface InvoiceItem {
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  farmId: string;
  number: string;
  clientName: string;
  type: string;
  date: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  items: InvoiceItem[];
  createdAt?: string;
}

export interface Partner {
  id: string;
  farmId: string;
  name: string;
  phone: string;
  address: string;
  partnershipPercentage: number;
  openingBalance: number;
  createdAt: string;
}

interface AppContextType {
  // Current farm
  currentFarm: Farm | null;
  
  // Data
  farms: Farm[];
  revenues: Revenue[];
  expenses: Expense[];
  clients: Client[];
  invoices: Invoice[];
  partners: Partner[];
  payments: Payment[];
  expensePayments: ExpensePayment[];
  
  // Calculations
  getTotalRevenues: () => number;
  getTotalExpenses: () => number;
  getNetProfit: () => number;
  getClientTotals: (clientId: string) => { sales: number; paid: number; balance: number };
  
  // Farm actions
  addFarm: (farm: Omit<Farm, 'id' | 'createdAt'>) => Promise<void>;
  updateFarm: (farm: Farm) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  setCurrentFarm: (farm: Farm) => void;
  
  // Revenue actions
  addRevenue: (revenue: Omit<Revenue, 'id' | 'farmId'>) => Promise<void>;
  updateRevenue: (revenue: Revenue) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'farmId'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'farmId' | 'invoices' | 'totalAmount'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'farmId' | 'number'>) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Partner actions
  addPartner: (partner: Omit<Partner, 'id' | 'farmId' | 'createdAt'>) => Promise<void>;
  updatePartner: (partner: Partner) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;

  // Payment actions
  addPayment: (payment: Omit<Payment, 'id' | 'farmId'>) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpensePayment: (payment: Omit<ExpensePayment, 'id' | 'farmId'>) => Promise<void>;
  updateExpensePayment: (payment: ExpensePayment) => Promise<void>;
  deleteExpensePayment: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Helper for generating unique local IDs
const generateId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
};

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const safeParseArray = <T,>(key: string): T[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getInitialFarms = (): Farm[] => {
  // Load saved farms only — no demo data injected.
  // First-launch setup is handled by OnboardingSetup.tsx
  const farmData: Farm[] = safeParseArray<Farm>('local_farms');

  if (!Array.isArray(farmData) || farmData.length === 0) {
    // Return empty; OnboardingSetup will populate localStorage before App renders
    return [];
  }

  return farmData.map((f, idx) => {
    const fallbackDays = 1;
    const cycleStartDate = f.cycleStartDate || getPastDateStr(fallbackDays);
    const computedAge = `${calculateFlockAgeDays(cycleStartDate, fallbackDays)} يوم`;
    return {
      ...f,
      cycleStartDate,
      flockAge: computedAge,
      status: f.status || "نشطة",
    };
  });
};

const getInitialActiveFarm = (farmList: Farm[]): Farm | null => {
  try {
    const savedFarmId = localStorage.getItem('local_current_farm_id');
    const activeFarm = farmList.find(f => f.id === savedFarmId) || farmList[0] || null;
    return activeFarm;
  } catch {
    return farmList[0] || null;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // Instant synchronous state initialization: 0ms wait on startup!
  const [farms, setFarms] = useState<Farm[]>(() => getInitialFarms());
  const [currentFarm, setCurrentFarmState] = useState<Farm | null>(() => getInitialActiveFarm(farms));
  const [revenues, setRevenues] = useState<Revenue[]>(() => safeParseArray<Revenue>('local_revenues').sort(sortByDateDesc));
  const [expenses, setExpenses] = useState<Expense[]>(() => safeParseArray<Expense>('local_expenses').sort(sortByDateDesc));
  const [clients, setClients] = useState<Client[]>(() => safeParseArray<Client>('local_clients'));
  const [invoices, setInvoices] = useState<Invoice[]>(() => safeParseArray<Invoice>('local_invoices').sort(sortByDateDesc));
  const [partners, setPartners] = useState<Partner[]>(() => safeParseArray<Partner>('local_partners'));
  const [payments, setPayments] = useState<Payment[]>(() => safeParseArray<Payment>('local_payments').sort(sortByDateDesc));
  const [expensePayments, setExpensePayments] = useState<ExpensePayment[]>(() => safeParseArray<ExpensePayment>('local_expense_payments').sort(sortByDateDesc));
  const [isLoadingData, setIsLoadingData] = useState(false);

  // مزامنة وترحيل قاعدة بيانات IndexedDB في الخلفية مع استرجاع ذاتي عند مسح الكاش
  useEffect(() => {
    const initDbData = async () => {
      try {
        await migrateLocalStorageToIndexedDB();

        // فحص الاسترداد الذاتي في حال قام نظام أندرويد بمسح LocalStorage
        const localFarms = safeParseArray<Farm>('local_farms');
        if (localFarms.length === 0) {
          const idbFarms = await idbGet<Farm[]>('local_farms');
          if (idbFarms && idbFarms.length > 0) {
            setFarms(idbFarms);
            persistAppData('local_farms', idbFarms);
          }
          const idbRevs = await idbGet<Revenue[]>('local_revenues');
          if (idbRevs && idbRevs.length > 0) {
            setRevenues(idbRevs.sort(sortByDateDesc));
            persistAppData('local_revenues', idbRevs);
          }
          const idbExps = await idbGet<Expense[]>('local_expenses');
          if (idbExps && idbExps.length > 0) {
            setExpenses(idbExps.sort(sortByDateDesc));
            persistAppData('local_expenses', idbExps);
          }
          const idbClients = await idbGet<Client[]>('local_clients');
          if (idbClients && idbClients.length > 0) {
            setClients(idbClients);
            persistAppData('local_clients', idbClients);
          }
          const idbInvoices = await idbGet<Invoice[]>('local_invoices');
          if (idbInvoices && idbInvoices.length > 0) {
            setInvoices(idbInvoices.sort(sortByDateDesc));
            persistAppData('local_invoices', idbInvoices);
          }
          const idbPayments = await idbGet<Payment[]>('local_payments');
          if (idbPayments && idbPayments.length > 0) {
            setPayments(idbPayments.sort(sortByDateDesc));
            persistAppData('local_payments', idbPayments);
          }
          const idbExpPayments = await idbGet<ExpensePayment[]>('local_expense_payments');
          if (idbExpPayments && idbExpPayments.length > 0) {
            setExpensePayments(idbExpPayments.sort(sortByDateDesc));
            persistAppData('local_expense_payments', idbExpPayments);
          }
        }
      } catch (err) {
        console.warn('Background IndexedDB initialization error:', err);
      }
    };
    initDbData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Load farms — no demo data, only user-created farms
      let farmData: Farm[] = safeParseArray<Farm>('local_farms');

      if (!Array.isArray(farmData) || farmData.length === 0) {
        // No farms yet — OnboardingSetup should have created one, so just leave empty
        setFarms([]);
        setCurrentFarmState(null);
      } else {
        farmData = farmData.map((f) => {
          const cycleStartDate = f.cycleStartDate || new Date().toISOString().split('T')[0];
          const computedAge = `${calculateFlockAgeDays(cycleStartDate, 1)} يوم`;
          return {
            ...f,
            cycleStartDate,
            flockAge: computedAge,
            status: f.status || "نشطة",
          };
        });
        try { localStorage.setItem('local_farms', JSON.stringify(farmData)); } catch {}
        setFarms(farmData);
      }

      // Determine active farm from saved preference
      const savedFarmId = localStorage.getItem('local_current_farm_id');
      const activeFarm = farmData.find(f => f.id === savedFarmId) || farmData[0] || null;
      setCurrentFarmState(activeFarm);
      if (activeFarm) {
        try { localStorage.setItem('local_current_farm_id', activeFarm.id); } catch {}
      }

      const primaryFarmId = activeFarm ? activeFarm.id : '';

      // 2. Load other modules from localStorage (sorted newest-first) and ensure farmId is attached
      let loadedRevenues: Revenue[] = safeParseArray<Revenue>('local_revenues');
      let revChanged = false;
      loadedRevenues = loadedRevenues.map(r => {
        if (!r.farmId) {
          revChanged = true;
          return { ...r, farmId: primaryFarmId };
        }
        return r;
      });
      if (revChanged) try { localStorage.setItem('local_revenues', JSON.stringify(loadedRevenues)); } catch {}
      setRevenues([...loadedRevenues].sort(sortByDateDesc));

      let loadedExpenses: Expense[] = safeParseArray<Expense>('local_expenses');
      let expChanged = false;
      loadedExpenses = loadedExpenses.map(e => {
        if (!e.farmId) {
          expChanged = true;
          return { ...e, farmId: primaryFarmId };
        }
        return e;
      });
      if (expChanged) try { localStorage.setItem('local_expenses', JSON.stringify(loadedExpenses)); } catch {}
      setExpenses([...loadedExpenses].sort(sortByDateDesc));

      let loadedClients: Client[] = safeParseArray<Client>('local_clients');
      let cliChanged = false;
      loadedClients = loadedClients.map(c => {
        if (!c.farmId) {
          cliChanged = true;
          return { ...c, farmId: primaryFarmId };
        }
        return c;
      });
      if (cliChanged) try { localStorage.setItem('local_clients', JSON.stringify(loadedClients)); } catch {}
      setClients(loadedClients);

      let loadedInvoices: Invoice[] = safeParseArray<Invoice>('local_invoices');
      let invChanged = false;
      loadedInvoices = loadedInvoices.map(i => {
        if (!i.farmId) {
          invChanged = true;
          return { ...i, farmId: primaryFarmId };
        }
        return i;
      });
      if (invChanged) try { localStorage.setItem('local_invoices', JSON.stringify(loadedInvoices)); } catch {}
      setInvoices([...loadedInvoices].sort(sortByDateDesc));

      let loadedPartners: Partner[] = safeParseArray<Partner>('local_partners');
      let partChanged = false;
      loadedPartners = loadedPartners.map(p => {
        if (!p.farmId) {
          partChanged = true;
          return { ...p, farmId: primaryFarmId };
        }
        return p;
      });
      if (partChanged) try { localStorage.setItem('local_partners', JSON.stringify(loadedPartners)); } catch {}
      setPartners(loadedPartners);

      let loadedPayments: Payment[] = safeParseArray<Payment>('local_payments');
      let payChanged = false;
      loadedPayments = loadedPayments.map(p => {
        if (!p.farmId) {
          payChanged = true;
          return { ...p, farmId: primaryFarmId };
        }
        return p;
      });
      if (payChanged) try { localStorage.setItem('local_payments', JSON.stringify(loadedPayments)); } catch {}
      setPayments([...loadedPayments].sort(sortByDateDesc));

      let loadedExpPayments: ExpensePayment[] = safeParseArray<ExpensePayment>('local_expense_payments');
      let expPayChanged = false;
      loadedExpPayments = loadedExpPayments.map(ep => {
        if (!ep.farmId) {
          expPayChanged = true;
          return { ...ep, farmId: primaryFarmId };
        }
        return ep;
      });
      if (expPayChanged) try { localStorage.setItem('local_expense_payments', JSON.stringify(loadedExpPayments)); } catch {}
      setExpensePayments([...loadedExpPayments].sort(sortByDateDesc));

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoadingData(false);
    }
  };

  const getCurrentFarmData = () => {
    const farm = currentFarm || farms[0];
    if (!farm) {
      return {
        revenues,
        expenses,
        clients,
        invoices,
        partners,
        payments,
        expensePayments
      };
    }
    
    return {
      revenues: revenues.filter(r => !r.farmId || r.farmId === farm.id).sort(sortByDateDesc),
      expenses: expenses.filter(e => !e.farmId || e.farmId === farm.id).sort(sortByDateDesc),
      clients: clients.filter(c => !c.farmId || c.farmId === farm.id),
      invoices: invoices.filter(i => !i.farmId || i.farmId === farm.id).sort(sortByDateDesc),
      partners: partners.filter(p => !p.farmId || p.farmId === farm.id),
      payments: payments.filter(p => !p.farmId || p.farmId === farm.id).sort(sortByDateDesc),
      expensePayments: expensePayments.filter(ep => !ep.farmId || ep.farmId === farm.id).sort(sortByDateDesc)
    };
  };

  // Farm actions
  const addFarm = async (farm: Omit<Farm, 'id' | 'createdAt'>) => {
    const newFarm: Farm = {
      ...farm,
      id: generateId('farm'),
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...farms, newFarm];
    persistAppData('local_farms', updated);
    setFarms(updated);
    if (!currentFarm) {
      setCurrentFarmState(newFarm);
    }
    triggerHaptic('success');
    toast.success('تم إضافة المزرعة بنجاح');
  };

  const updateFarm = async (farm: Farm) => {
    const updated = farms.map(f => f.id === farm.id ? farm : f);
    persistAppData('local_farms', updated);
    setFarms(updated);
    if (currentFarm?.id === farm.id) {
      setCurrentFarmState(farm);
    }
    triggerHaptic('success');
    toast.success('تم تحديث المزرعة بنجاح');
  };

  const deleteFarm = async (id: string) => {
    const updated = farms.filter(f => f.id !== id);
    persistAppData('local_farms', updated);
    setFarms(updated);
    
    // Clean up related data for this farm
    const filterRelated = (list: any[]) => list.filter(item => item.farmId !== id);
    
    const updatedRevenues = filterRelated(revenues);
    persistAppData('local_revenues', updatedRevenues);
    setRevenues(updatedRevenues);

    const updatedExpenses = filterRelated(expenses);
    persistAppData('local_expenses', updatedExpenses);
    setExpenses(updatedExpenses);

    const updatedClients = filterRelated(clients);
    persistAppData('local_clients', updatedClients);
    setClients(updatedClients);

    const updatedInvoices = filterRelated(invoices);
    persistAppData('local_invoices', updatedInvoices);
    setInvoices(updatedInvoices);

    const updatedPartners = filterRelated(partners);
    persistAppData('local_partners', updatedPartners);
    setPartners(updatedPartners);

    const updatedPayments = filterRelated(payments);
    persistAppData('local_payments', updatedPayments);
    setPayments(updatedPayments);

    const updatedExpensePayments = filterRelated(expensePayments);
    persistAppData('local_expense_payments', updatedExpensePayments);
    setExpensePayments(updatedExpensePayments);

    if (currentFarm?.id === id) {
      setCurrentFarmState(updated[0] || null);
    }
    triggerHaptic('error');
    toast.success('تم حذف المزرعة بنجاح');
  };

  const setCurrentFarm = (farm: Farm) => {
    setCurrentFarmState(farm);
    if (farm?.id) {
      persistAppData('local_current_farm_id', farm.id);
      triggerHaptic('selection');
    }
  };

  // Revenue actions
  const addRevenue = async (revenue: Omit<Revenue, 'id' | 'farmId'>) => {
    if (!currentFarm) return;
    
    const newRevenue: Revenue = {
      ...revenue,
      id: generateId('rev'),
      farmId: currentFarm.id,
      notes: revenue.notes || '',
      quantity: revenue.quantity != null ? Number(revenue.quantity) : null,
      unitPrice: revenue.unitPrice != null ? Number(revenue.unitPrice) : null,
      clientId: revenue.clientId || null,
      paymentMethod: revenue.paymentMethod || 'cash',
      pricePending: revenue.pricePending ?? (Boolean(revenue.quantity) && !revenue.amount),
      createdAt: new Date().toISOString()
    };
    
    const updated = [newRevenue, ...revenues].sort(sortByDateDesc);
    persistAppData('local_revenues', updated);
    setRevenues(updated);
    triggerHaptic('success');
    toast.success('تم إضافة الإيراد بنجاح');
  };

  const updateRevenue = async (revenue: Revenue) => {
    const updated = revenues.map(r => r.id === revenue.id ? revenue : r).sort(sortByDateDesc);
    persistAppData('local_revenues', updated);
    setRevenues(updated);
    triggerHaptic('success');
    toast.success('تم تحديث الإيراد بنجاح');
  };

  const deleteRevenue = async (id: string) => {
    const updated = revenues.filter(r => r.id !== id);
    persistAppData('local_revenues', updated);
    setRevenues(updated);
    triggerHaptic('error');
    toast.success('تم حذف الإيراد بنجاح');
  };

  // Expense actions
  const addExpense = async (expense: Omit<Expense, 'id' | 'farmId'>) => {
    if (!currentFarm) return;
    
    const newExpense: Expense = {
      ...expense,
      id: generateId('exp'),
      farmId: currentFarm.id,
      description: expense.description || '',
      quantity: expense.quantity != null ? Number(expense.quantity) : null,
      unitPrice: expense.unitPrice != null ? Number(expense.unitPrice) : null,
      paymentMethod: expense.paymentMethod || 'cash',
      paidAmount: expense.paidAmount != null ? Number(expense.paidAmount) : expense.amount,
      supplierName: expense.supplierName || '',
      pricePending: expense.pricePending ?? (Boolean(expense.quantity) && !expense.amount),
      createdAt: new Date().toISOString()
    };
    
    const updated = [newExpense, ...expenses].sort(sortByDateDesc);
    persistAppData('local_expenses', updated);
    setExpenses(updated);

    // If there is a payment amount, log it in expensePayments
    const pAmt = newExpense.paidAmount ?? 0;
    if (pAmt > 0) {
      const newPay: ExpensePayment = {
        id: generateId('exppay'),
        farmId: currentFarm.id,
        expenseId: newExpense.id,
        clientId: newExpense.clientId || null,
        amount: pAmt,
        date: newExpense.date,
        notes: 'دفعة مقدمة عند تسجيل المصروف',
        createdAt: new Date().toISOString()
      };
      const updatedPayments = [newPay, ...expensePayments].sort(sortByDateDesc);
      persistAppData('local_expense_payments', updatedPayments);
      setExpensePayments(updatedPayments);
    }

    triggerHaptic('success');
    toast.success('تم إضافة المصروف بنجاح');
  };

  const updateExpense = async (expense: Expense) => {
    const updated = expenses.map(e => e.id === expense.id ? expense : e).sort(sortByDateDesc);
    persistAppData('local_expenses', updated);
    setExpenses(updated);
    triggerHaptic('success');
    toast.success('تم تحديث المصروف بنجاح');
  };

  const deleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    persistAppData('local_expenses', updated);
    setExpenses(updated);
    triggerHaptic('error');
    toast.success('تم حذف المصروف بنجاح');
  };

  // Client actions
  const addClient = async (client: Omit<Client, 'id' | 'farmId' | 'invoices' | 'totalAmount'>) => {
    if (!currentFarm) return;
    
    const newClient: Client = {
      ...client,
      id: generateId('cli'),
      farmId: currentFarm.id,
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
      invoices: 0,
      totalAmount: 0,
      creditLimit: client.creditLimit,
      nextPaymentDate: client.nextPaymentDate
    };
    
    const updated = [...clients, newClient];
    persistAppData('local_clients', updated);
    setClients(updated);
    triggerHaptic('success');
    toast.success('تم إضافة العميل بنجاح');
  };

  const updateClient = async (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? client : c);
    persistAppData('local_clients', updated);
    setClients(updated);
    triggerHaptic('success');
  };

  const deleteClient = async (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    persistAppData('local_clients', updated);
    setClients(updated);
    
    // Also clean up invoices/payments related to this client
    const updatedInvoices = invoices.filter(inv => inv.clientName !== clients.find(c => c.id === id)?.name);
    persistAppData('local_invoices', updatedInvoices);
    setInvoices(updatedInvoices);

    const updatedPayments = payments.filter(p => p.clientId !== id);
    persistAppData('local_payments', updatedPayments);
    setPayments(updatedPayments);

    triggerHaptic('error');
    toast.success('تم حذف العميل بنجاح');
  };

  // Invoice actions
  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'farmId' | 'number'>) => {
    if (!currentFarm) return;
    
    const currentFarmInvoices = invoices.filter(i => i.farmId === currentFarm.id);
    const invoiceNumber = `INV-${String(currentFarmInvoices.length + 1).padStart(3, '0')}`;
    
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId('inv'),
      farmId: currentFarm.id,
      number: invoiceNumber,
      items: Array.isArray(invoice.items) ? invoice.items : [],
      createdAt: new Date().toISOString()
    };
    
    const updated = [newInvoice, ...invoices].sort(sortByDateDesc);
    persistAppData('local_invoices', updated);
    setInvoices(updated);
    
    // Update client's invoice count and total amount
    const client = clients.find(c => c.name === invoice.clientName && c.farmId === currentFarm.id);
    if (client) {
      await updateClient({
        ...client,
        invoices: client.invoices + 1,
        totalAmount: client.totalAmount + invoice.totalAmount
      });
    }
    triggerHaptic('success');
    toast.success('تم إضافة الفاتورة بنجاح');
  };

  const updateInvoice = async (invoice: Invoice) => {
    const oldInvoice = invoices.find(i => i.id === invoice.id);
    const updated = invoices.map(i => i.id === invoice.id ? invoice : i).sort(sortByDateDesc);
    persistAppData('local_invoices', updated);
    setInvoices(updated);

    // If invoice amount changed, adjust client's total amount
    if (oldInvoice && oldInvoice.totalAmount !== invoice.totalAmount) {
      const client = clients.find(c => c.name === invoice.clientName && c.farmId === invoice.farmId);
      if (client) {
        await updateClient({
          ...client,
          totalAmount: client.totalAmount - oldInvoice.totalAmount + invoice.totalAmount
        });
      }
    }
    triggerHaptic('success');
    toast.success('تم تحديث الفاتورة بنجاح');
  };

  const deleteInvoice = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    const updated = invoices.filter(i => i.id !== id);
    persistAppData('local_invoices', updated);
    setInvoices(updated);
    
    if (invoice && currentFarm) {
      const client = clients.find(c => c.name === invoice.clientName && c.farmId === currentFarm.id);
      if (client) {
        await updateClient({
          ...client,
          invoices: Math.max(0, client.invoices - 1),
          totalAmount: Math.max(0, client.totalAmount - invoice.totalAmount)
        });
      }
    }
    triggerHaptic('error');
    toast.success('تم حذف الفاتورة بنجاح');
  };

  // Partner actions
  const addPartner = async (partner: Omit<Partner, 'id' | 'farmId' | 'createdAt'>) => {
    if (!currentFarm) return;
    
    const newPartner: Partner = {
      ...partner,
      id: generateId('part'),
      farmId: currentFarm.id,
      phone: partner.phone || '',
      address: partner.address || '',
      partnershipPercentage: Number(partner.partnershipPercentage),
      openingBalance: Number(partner.openingBalance),
      createdAt: new Date().toISOString()
    };
    
    const updated = [...partners, newPartner];
    persistAppData('local_partners', updated);
    setPartners(updated);
    triggerHaptic('success');
    toast.success('تم إضافة الشريك بنجاح');
  };

  const updatePartner = async (partner: Partner) => {
    const updated = partners.map(p => p.id === partner.id ? partner : p);
    persistAppData('local_partners', updated);
    setPartners(updated);
    triggerHaptic('success');
    toast.success('تم تحديث الشريك بنجاح');
  };

  const deletePartner = async (id: string) => {
    const updated = partners.filter(p => p.id !== id);
    persistAppData('local_partners', updated);
    setPartners(updated);
    triggerHaptic('error');
    toast.success('تم حذف الشريك بنجاح');
  };

  // Payment actions
  const addPayment = async (payment: Omit<Payment, 'id' | 'farmId'>) => {
    if (!currentFarm) return;
    
    const newPayment: Payment = {
      ...payment,
      id: generateId('pay'),
      farmId: currentFarm.id,
      notes: payment.notes || '',
      createdAt: new Date().toISOString()
    };
    
    const updated = [newPayment, ...payments].sort(sortByDateDesc);
    persistAppData('local_payments', updated);
    setPayments(updated);
    triggerHaptic('success');
    toast.success('تم تسجيل الدفعة بنجاح');
  };

  const deletePayment = async (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    persistAppData('local_payments', updated);
    setPayments(updated);
    triggerHaptic('error');
    toast.success('تم حذف الدفعة بنجاح');
  };

  const addExpensePayment = async (payment: Omit<ExpensePayment, 'id' | 'farmId'>) => {
    if (!currentFarm) return;
    
    const newPay: ExpensePayment = {
      ...payment,
      id: generateId('exppay'),
      farmId: currentFarm.id,
      createdAt: new Date().toISOString()
    };

    // Update expense paidAmount
    const updatedExpenses = expenses.map(e => {
      if (e.id === payment.expenseId) {
        const newPaidAmount = Math.min(e.amount, (e.paidAmount || 0) + payment.amount);
        return { ...e, paidAmount: newPaidAmount };
      }
      return e;
    });

    persistAppData('local_expenses', updatedExpenses);
    setExpenses(updatedExpenses);

    const updatedPayments = [newPay, ...expensePayments].sort(sortByDateDesc);
    persistAppData('local_expense_payments', updatedPayments);
    setExpensePayments(updatedPayments);
    triggerHaptic('success');
    toast.success('تم تسجيل دفعة سداد المصروف بنجاح');
  };

  const updatePayment = async (payment: Payment) => {
    const updated = payments.map(p => p.id === payment.id ? payment : p).sort(sortByDateDesc);
    persistAppData('local_payments', updated);
    setPayments(updated);
    triggerHaptic('success');
    toast.success('تم تحديث الدفعة بنجاح');
  };

  const updateExpensePayment = async (payment: ExpensePayment) => {
    const oldPay = expensePayments.find(p => p.id === payment.id);
    if (oldPay && payment.expenseId) {
      const diff = payment.amount - oldPay.amount;
      if (diff !== 0) {
        const updatedExpenses = expenses.map(e => {
          if (e.id === payment.expenseId) {
            const newPaidAmount = Math.max(0, Math.min(e.amount, (e.paidAmount || 0) + diff));
            return { ...e, paidAmount: newPaidAmount };
          }
          return e;
        });
        persistAppData('local_expenses', updatedExpenses);
        setExpenses(updatedExpenses);
      }
    }
    const updated = expensePayments.map(p => p.id === payment.id ? payment : p).sort(sortByDateDesc);
    persistAppData('local_expense_payments', updated);
    setExpensePayments(updated);
    triggerHaptic('success');
    toast.success('تم تحديث دفعة السداد بنجاح');
  };

  const deleteExpensePayment = async (id: string) => {
    const payToDelete = expensePayments.find(p => p.id === id);
    if (payToDelete && payToDelete.expenseId) {
      const updatedExpenses = expenses.map(e => {
        if (e.id === payToDelete.expenseId) {
          const newPaidAmount = Math.max(0, (e.paidAmount || 0) - payToDelete.amount);
          return { ...e, paidAmount: newPaidAmount };
        }
        return e;
      });
      persistAppData('local_expenses', updatedExpenses);
      setExpenses(updatedExpenses);
    }
    const updated = expensePayments.filter(p => p.id !== id);
    persistAppData('local_expense_payments', updated);
    setExpensePayments(updated);
    triggerHaptic('error');
    toast.success('تم حذف دفعة السداد بنجاح');
  };


  const currentFarmData = getCurrentFarmData();

  // Calculations
  const getTotalRevenues = () => {
    return currentFarmData.revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  };

  const getTotalExpenses = () => {
    return currentFarmData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getNetProfit = () => {
    return getTotalRevenues() - getTotalExpenses();
  };

  const getClientTotals = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return { sales: 0, paid: 0, balance: 0 };

    if (client.type === "مورد") {
      const supplierExpenses = currentFarmData.expenses.filter(e => e.clientId === clientId);
      const sales = supplierExpenses.reduce((s, e) => s + e.amount, 0);
      const paid = supplierExpenses.reduce((s, e) => s + (e.paidAmount ?? 0), 0);
      return { sales, paid, balance: sales - paid };
    } else {
      const sales = currentFarmData.revenues
        .filter(r => r.clientId === clientId)
        .reduce((s, r) => s + r.amount, 0);
      const paid = currentFarmData.payments
        .filter(p => p.clientId === clientId)
        .reduce((s, p) => s + p.amount, 0);
      return { sales, paid, balance: sales - paid };
    }
  };

  const value = {
    currentFarm,
    farms,
    revenues: currentFarmData.revenues,
    expenses: currentFarmData.expenses,
    clients: currentFarmData.clients,
    invoices: currentFarmData.invoices,
    partners: currentFarmData.partners,
    payments: currentFarmData.payments,
    expensePayments: currentFarmData.expensePayments,
    getTotalRevenues,
    getTotalExpenses,
    getNetProfit,
    getClientTotals,
    addFarm,
    updateFarm,
    deleteFarm,
    setCurrentFarm,
    addRevenue,
    updateRevenue,
    deleteRevenue,
    addExpense,
    updateExpense,
    deleteExpense,
    addClient,
    updateClient,
    deleteClient,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addPartner,
    updatePartner,
    deletePartner,
    addPayment,
    updatePayment,
    deletePayment,
    addExpensePayment,
    updateExpensePayment,
    deleteExpensePayment,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};