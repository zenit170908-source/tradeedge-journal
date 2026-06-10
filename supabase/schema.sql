
-- =============================================
-- TradeEdge Journal — Supabase SQL Setup Script
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── TRADES TABLE ─────────────────────────────────────────────────────────────
create table if not exists public.trades (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  asset          text not null,
  direction      text not null check (direction in ('Long', 'Short')),
  session        text not null,
  setup          text not null,
  entry_price    numeric,
  exit_price     numeric,
  capital_used   numeric,
  leverage       text default '1x',
  position_size  numeric,
  pnl            numeric,
  pnl_pct        numeric,
  quality_score  integer check (quality_score between 1 and 10),
  followed_plan  text check (followed_plan in ('Yes', 'No')),
  screenshot_url text,
  comment        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── CUSTOM OPTIONS TABLES ────────────────────────────────────────────────────
create table if not exists public.custom_assets (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_sessions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_setups (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.trades enable row level security;
alter table public.custom_assets enable row level security;
alter table public.custom_sessions enable row level security;
alter table public.custom_setups enable row level security;

-- Trades
create policy "Users see own trades"    on public.trades for select using (auth.uid() = user_id);
create policy "Users insert own trades" on public.trades for insert with check (auth.uid() = user_id);
create policy "Users update own trades" on public.trades for update using (auth.uid() = user_id);
create policy "Users delete own trades" on public.trades for delete using (auth.uid() = user_id);

-- Custom options (all operations in one policy per table)
create policy "Users manage own custom_assets"   on public.custom_assets   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own custom_sessions" on public.custom_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own custom_setups"   on public.custom_setups   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trades_updated_at
  before update on public.trades
  for each row execute procedure public.handle_updated_at();

-- ─── STORAGE BUCKET ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

create policy "Users upload own screenshots" on storage.objects
  for insert with check (
    bucket_id = 'trade-screenshots' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public read screenshots" on storage.objects
  for select using (bucket_id = 'trade-screenshots');

create policy "Users delete own screenshots" on storage.objects
  for delete using (
    bucket_id = 'trade-screenshots' and
    auth.uid()::text = (storage.foldername(name))[1]
  );


