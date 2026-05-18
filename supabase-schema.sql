-- TenPhel Database Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com → SQL Editor

-- ─── Users ────────────────────────────────────────────────────────────────────
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  current_balance numeric(12, 2) not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ─── Categories ───────────────────────────────────────────────────────────────
create table public.categories (
  id text primary key,
  name text not null,
  icon text not null default '📦',
  is_default boolean not null default true,
  user_id uuid references public.users(id) on delete cascade
);

alter table public.categories enable row level security;

create policy "Users can read own categories"
  on public.categories for select
  using (user_id = auth.uid() or user_id is null);

create policy "Users can insert categories"
  on public.categories for insert
  with check (user_id = auth.uid());

-- ─── Expenses ─────────────────────────────────────────────────────────────────
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  category_id text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can manage own expenses"
  on public.expenses for all
  using (auth.uid() = user_id);

create index expenses_user_id_idx on public.expenses(user_id);
create index expenses_date_idx on public.expenses(date desc);

-- ─── Income Entries ───────────────────────────────────────────────────────────
create table public.income_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  source text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.income_entries enable row level security;

create policy "Users can manage own income"
  on public.income_entries for all
  using (auth.uid() = user_id);

create index income_user_id_idx on public.income_entries(user_id);

-- ─── Budgets ──────────────────────────────────────────────────────────────────
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category_id text not null,
  amount_limit numeric(12, 2) not null,
  period text not null check (period in ('monthly', 'weekly')),
  created_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

create policy "Users can manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id);

-- ─── Alerts ───────────────────────────────────────────────────────────────────
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  budget_id uuid references public.budgets(id) on delete cascade not null,
  threshold_pct integer not null default 80,
  triggered_at timestamptz not null default now(),
  is_read boolean not null default false
);

alter table public.alerts enable row level security;

create policy "Users can manage own alerts"
  on public.alerts for all
  using (auth.uid() = user_id);
