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

-- ─── Savings Goals ────────────────────────────────────────────────────────────
create table public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  deadline date,
  created_at timestamptz not null default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings goals"
  on public.savings_goals for all
  using (auth.uid() = user_id);

create index savings_goals_user_id_idx on public.savings_goals(user_id);

-- ─── Bill Splits ──────────────────────────────────────────────────────────────
create table public.bill_splits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  created_at timestamptz not null default now()
);

alter table public.bill_splits enable row level security;

create policy "Users can manage own bill splits"
  on public.bill_splits for all
  using (auth.uid() = user_id);

create index bill_splits_user_id_idx on public.bill_splits(user_id);

create table public.bill_split_participants (
  id uuid default gen_random_uuid() primary key,
  split_id uuid references public.bill_splits(id) on delete cascade not null,
  name text not null,
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.bill_split_participants enable row level security;

create policy "Users can manage own split participants"
  on public.bill_split_participants for all
  using (
    split_id in (
      select id from public.bill_splits where user_id = auth.uid()
    )
  );
