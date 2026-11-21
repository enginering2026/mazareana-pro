
ALTER TABLE public.revenues 
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_price numeric,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash';

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_price numeric;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_access_farm(farm_id));
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
