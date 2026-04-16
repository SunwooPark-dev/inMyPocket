-- InMyPocket Core Financial Schema

-- Profiles: Extend Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  currency text default 'USD',
  risk_tolerance text check (risk_tolerance in ('low', 'medium', 'high')) default 'medium',
  created_at timestamptz default now()
);

-- Accounts: Banking/Exchange/Wallet sources
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text check (type in ('bank', 'crypto', 'investment')) not null,
  institution_name text,
  balance decimal(20, 2) default 0,
  created_at timestamptz default now()
);

-- Assets: Individual holding (Stocks, Coins, Real Estate)
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,
  ticker text not null,
  quantity decimal(20, 8) not null,
  entry_price decimal(20, 8),
  current_price decimal(20, 8),
  last_updated timestamptz default now()
);

-- Transactions: Every single movement
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  amount decimal(20, 2) not null,
  type text check (type in ('income', 'expense', 'transfer', 'buy', 'sell')) not null,
  category text,
  description text,
  executed_at timestamptz default now()
);

-- VA Logs: Tracking agent decisions and history
create table if not exists public.va_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  insight_type text not null, -- 'warning', 'recommendation', 'digest'
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- RLS: Security Policies
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.assets enable row level security;
alter table public.transactions enable row level security;
alter table public.va_logs enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id);
create policy "Users can manage own assets" on public.assets for all using (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);
create policy "Users can view own va_logs" on public.va_logs for select using (auth.uid() = user_id);
