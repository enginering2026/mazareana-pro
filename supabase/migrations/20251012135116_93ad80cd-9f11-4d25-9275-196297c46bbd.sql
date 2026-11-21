-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create farms table
create table public.farms (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null,
  location text not null,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.farms enable row level security;

create policy "Users can view their own farms"
  on public.farms for select
  using (auth.uid() = user_id);

create policy "Users can create their own farms"
  on public.farms for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own farms"
  on public.farms for update
  using (auth.uid() = user_id);

create policy "Users can delete their own farms"
  on public.farms for delete
  using (auth.uid() = user_id);

-- Create revenues table
create table public.revenues (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  farm_id uuid not null references public.farms on delete cascade,
  type text not null,
  amount numeric not null,
  date date not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

alter table public.revenues enable row level security;

create policy "Users can view their own revenues"
  on public.revenues for select
  using (auth.uid() = user_id);

create policy "Users can create their own revenues"
  on public.revenues for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own revenues"
  on public.revenues for update
  using (auth.uid() = user_id);

create policy "Users can delete their own revenues"
  on public.revenues for delete
  using (auth.uid() = user_id);

-- Create expenses table
create table public.expenses (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  farm_id uuid not null references public.farms on delete cascade,
  category text not null,
  amount numeric not null,
  date date not null,
  description text,
  created_at timestamp with time zone not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can create their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Create clients table
create table public.clients (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  farm_id uuid not null references public.farms on delete cascade,
  name text not null,
  type text not null,
  phone text,
  email text,
  notes text,
  invoices_count integer not null default 0,
  total_amount numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.clients enable row level security;

create policy "Users can view their own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can create their own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Create invoices table
create table public.invoices (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  farm_id uuid not null references public.farms on delete cascade,
  number text not null,
  client_name text not null,
  type text not null,
  date date not null,
  payment_method text not null,
  total_amount numeric not null,
  status text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.invoices enable row level security;

create policy "Users can view their own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can create their own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "Users can delete their own invoices"
  on public.invoices for delete
  using (auth.uid() = user_id);

-- Create partners table
create table public.partners (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  farm_id uuid not null references public.farms on delete cascade,
  name text not null,
  phone text,
  address text,
  partnership_percentage numeric not null,
  opening_balance numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.partners enable row level security;

create policy "Users can view their own partners"
  on public.partners for select
  using (auth.uid() = user_id);

create policy "Users can create their own partners"
  on public.partners for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own partners"
  on public.partners for update
  using (auth.uid() = user_id);

create policy "Users can delete their own partners"
  on public.partners for delete
  using (auth.uid() = user_id);

-- Create function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for automatic timestamp updates
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_farms_updated_at
  before update on public.farms
  for each row execute function public.update_updated_at_column();

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Create trigger for automatic profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();