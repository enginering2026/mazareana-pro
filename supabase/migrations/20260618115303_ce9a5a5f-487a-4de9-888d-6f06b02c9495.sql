
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

-- 2. user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Policies on user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Auto-assign first user as admin, others as worker
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'worker');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 6. Backfill: existing users get worker role, first existing user becomes admin
DO $$
DECLARE
  first_user UUID;
BEGIN
  SELECT id INTO first_user FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF first_user IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'worker'
  FROM auth.users u
  WHERE u.id <> first_user
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 7. Update RLS on farms — admin sees all, worker sees own
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can insert their own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can update their own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can delete their own farms" ON public.farms;

CREATE POLICY "View farms (own or admin)"
  ON public.farms FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Insert own farms"
  ON public.farms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update farms (own or admin)"
  ON public.farms FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Delete farms (own or admin)"
  ON public.farms FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 8. Helper: check farm access (owner or admin)
CREATE OR REPLACE FUNCTION public.can_access_farm(_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = _farm_id
      AND (f.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
$$;

-- 9. Refresh policies on dependent tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['revenues','expenses','clients','invoices','partners']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view their own %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update their own %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete their own %1$s" ON public.%1$s', t);

    EXECUTE format('CREATE POLICY "View %1$s" ON public.%1$s FOR SELECT TO authenticated USING (public.can_access_farm(farm_id))', t);
    EXECUTE format('CREATE POLICY "Insert %1$s" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (public.can_access_farm(farm_id))', t);
    EXECUTE format('CREATE POLICY "Update %1$s" ON public.%1$s FOR UPDATE TO authenticated USING (public.can_access_farm(farm_id))', t);
    EXECUTE format('CREATE POLICY "Delete %1$s" ON public.%1$s FOR DELETE TO authenticated USING (public.can_access_farm(farm_id))', t);
  END LOOP;
END $$;
