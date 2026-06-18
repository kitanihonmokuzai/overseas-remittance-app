create table if not exists public.foreign_deposit_lots (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.foreign_deposit_accounts(id) on delete cascade,
  received_date date not null,
  payer_name text not null default '',
  bank text not null,
  currency text not null,
  original_amount numeric(16, 2) not null check (original_amount > 0),
  remaining_amount numeric(16, 2) not null check (remaining_amount >= 0),
  receipt_rate numeric(16, 6) not null check (receipt_rate > 0),
  memo text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.remittance_deposit_lot_usages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.remittance_requests(id) on delete cascade,
  settlement_allocation_id uuid references public.remittance_settlement_allocations(id) on delete cascade,
  deposit_lot_id uuid not null references public.foreign_deposit_lots(id) on delete restrict,
  amount numeric(16, 2) not null check (amount > 0),
  payment_rate numeric(16, 6) not null check (payment_rate > 0),
  receipt_rate numeric(16, 6) not null check (receipt_rate > 0),
  gain_loss_jpy numeric(18, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fx_gain_loss_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.remittance_requests(id) on delete cascade,
  deposit_lot_id uuid not null references public.foreign_deposit_lots(id) on delete restrict,
  payee_name text not null,
  currency text not null,
  foreign_amount numeric(16, 2) not null,
  receipt_rate numeric(16, 6) not null,
  payment_rate numeric(16, 6) not null,
  gain_loss_jpy numeric(18, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.remittance_settlement_allocations
  add column if not exists deposit_lot_id uuid references public.foreign_deposit_lots(id) on delete restrict;

alter table public.remittance_settlement_allocations
  add column if not exists payment_rate numeric(16, 6);

alter table public.foreign_deposit_transactions
  add column if not exists received_date date;

alter table public.foreign_deposit_transactions
  add column if not exists payer_name text not null default '';

alter table public.foreign_deposit_transactions
  add column if not exists receipt_rate numeric(16, 6);

create index if not exists foreign_deposit_lots_deposit_idx
  on public.foreign_deposit_lots(deposit_id, currency, remaining_amount);

create index if not exists remittance_deposit_lot_usages_request_idx
  on public.remittance_deposit_lot_usages(request_id);

create index if not exists fx_gain_loss_history_request_idx
  on public.fx_gain_loss_history(request_id);

alter table public.foreign_deposit_lots enable row level security;
alter table public.remittance_deposit_lot_usages enable row level security;
alter table public.fx_gain_loss_history enable row level security;

drop policy if exists "authenticated users can read foreign deposit lots" on public.foreign_deposit_lots;
create policy "authenticated users can read foreign deposit lots" on public.foreign_deposit_lots for select to authenticated using (true);

drop policy if exists "operators can manage foreign deposit lots" on public.foreign_deposit_lots;
create policy "operators can manage foreign deposit lots" on public.foreign_deposit_lots for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read deposit lot usages" on public.remittance_deposit_lot_usages;
create policy "authenticated users can read deposit lot usages" on public.remittance_deposit_lot_usages for select to authenticated using (true);

drop policy if exists "operators can manage deposit lot usages" on public.remittance_deposit_lot_usages;
create policy "operators can manage deposit lot usages" on public.remittance_deposit_lot_usages for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read fx gain loss" on public.fx_gain_loss_history;
create policy "authenticated users can read fx gain loss" on public.fx_gain_loss_history for select to authenticated using (true);

drop policy if exists "operators can create fx gain loss" on public.fx_gain_loss_history;
create policy "operators can create fx gain loss" on public.fx_gain_loss_history for insert to authenticated with check (public.is_operator());

drop policy if exists "admins can delete fx gain loss" on public.fx_gain_loss_history;
create policy "admins can delete fx gain loss" on public.fx_gain_loss_history for delete to authenticated using (public.is_admin());
