-- Create farms table
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for farms
CREATE POLICY "Users can view their own farms" ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own farms" ON public.farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own farms" ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- Create revenues table
CREATE TABLE public.revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for revenues
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for revenues
CREATE POLICY "Users can view their own revenues" ON public.revenues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own revenues" ON public.revenues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own revenues" ON public.revenues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own revenues" ON public.revenues FOR DELETE USING (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  invoices_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'غير مدفوعة',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  partnership_percentage NUMERIC NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partners
CREATE POLICY "Users can view their own partners" ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own partners" ON public.partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own partners" ON public.partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own partners" ON public.partners FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();