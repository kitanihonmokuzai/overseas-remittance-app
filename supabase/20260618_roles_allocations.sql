create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'approver', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remittance_settlement_allocations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.remittance_requests(id) on delete cascade,
  method text not null check (method in ('スポット', '為替予約', '外貨預金')),
  reservation_id uuid references public.fx_reservations(id) on delete restrict,
  foreign_deposit_id uuid references public.foreign_deposit_accounts(id) on delete restrict,
  amount numeric(16, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  check (
    (method = 'スポット' and reservation_id is null and foreign_deposit_id is null) or
    (method = '為替予約' and reservation_id is not null and foreign_deposit_id is null) or
    (method = '外貨預金' and reservation_id is null and foreign_deposit_id is not null)
  )
);

alter table public.remittance_requests
  alter column settlement_method drop not null;

alter table public.remittance_requests
  alter column settlement_method drop default;

alter table public.remittance_requests
  drop constraint if exists remittance_requests_settlement_method_check;

alter table public.remittance_requests
  add constraint remittance_requests_settlement_method_check
  check (settlement_method in ('スポット', '為替予約', '外貨預金', '複合') or settlement_method is null);

create index if not exists remittance_settlement_allocations_request_idx
  on public.remittance_settlement_allocations(request_id);

create index if not exists remittance_settlement_allocations_method_idx
  on public.remittance_settlement_allocations(method);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'approver')
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

insert into public.profiles (id, email, role)
select
  users.id,
  coalesce(users.email, ''),
  case when not exists (select 1 from public.profiles) then 'admin' else 'user' end
from auth.users users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.remittance_settlement_allocations enable row level security;

drop policy if exists "authenticated users can manage payees" on public.payees;
drop policy if exists "authenticated users can manage fx reservations" on public.fx_reservations;
drop policy if exists "authenticated users can manage foreign deposits" on public.foreign_deposit_accounts;
drop policy if exists "authenticated users can manage remittance requests" on public.remittance_requests;
drop policy if exists "authenticated users can manage remittance allocations" on public.remittance_fx_allocations;
drop policy if exists "authenticated users can manage remittance files" on public.remittance_files;
drop policy if exists "authenticated users can manage fx history" on public.fx_registration_history;
drop policy if exists "authenticated users can manage deposit history" on public.foreign_deposit_transactions;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "admins can update profiles" on public.profiles;
create policy "admins can update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated users can read payees" on public.payees;
create policy "authenticated users can read payees" on public.payees for select to authenticated using (true);

drop policy if exists "operators can manage payees" on public.payees;
create policy "operators can manage payees" on public.payees for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read fx reservations" on public.fx_reservations;
create policy "authenticated users can read fx reservations" on public.fx_reservations for select to authenticated using (true);

drop policy if exists "operators can manage fx reservations" on public.fx_reservations;
create policy "operators can manage fx reservations" on public.fx_reservations for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read foreign deposits" on public.foreign_deposit_accounts;
create policy "authenticated users can read foreign deposits" on public.foreign_deposit_accounts for select to authenticated using (true);

drop policy if exists "operators can manage foreign deposits" on public.foreign_deposit_accounts;
create policy "operators can manage foreign deposits" on public.foreign_deposit_accounts for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read remittance requests" on public.remittance_requests;
create policy "authenticated users can read remittance requests" on public.remittance_requests for select to authenticated using (true);

drop policy if exists "authenticated users can create remittance requests" on public.remittance_requests;
create policy "authenticated users can create remittance requests" on public.remittance_requests for insert to authenticated with check (true);

drop policy if exists "operators can update remittance requests" on public.remittance_requests;
create policy "operators can update remittance requests" on public.remittance_requests for update to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "admins can delete remittance requests" on public.remittance_requests;
create policy "admins can delete remittance requests" on public.remittance_requests for delete to authenticated using (public.is_admin());

drop policy if exists "authenticated users can read settlement allocations" on public.remittance_settlement_allocations;
create policy "authenticated users can read settlement allocations" on public.remittance_settlement_allocations for select to authenticated using (true);

drop policy if exists "authenticated users can create settlement allocations" on public.remittance_settlement_allocations;
create policy "authenticated users can create settlement allocations" on public.remittance_settlement_allocations for insert to authenticated with check (true);

drop policy if exists "operators can update settlement allocations" on public.remittance_settlement_allocations;
create policy "operators can update settlement allocations" on public.remittance_settlement_allocations for update to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "admins can delete settlement allocations" on public.remittance_settlement_allocations;
create policy "admins can delete settlement allocations" on public.remittance_settlement_allocations for delete to authenticated using (public.is_admin());

drop policy if exists "authenticated users can read legacy fx allocations" on public.remittance_fx_allocations;
create policy "authenticated users can read legacy fx allocations" on public.remittance_fx_allocations for select to authenticated using (true);

drop policy if exists "operators can manage legacy fx allocations" on public.remittance_fx_allocations;
create policy "operators can manage legacy fx allocations" on public.remittance_fx_allocations for all to authenticated using (public.is_operator()) with check (public.is_operator());

drop policy if exists "authenticated users can read remittance files" on public.remittance_files;
create policy "authenticated users can read remittance files" on public.remittance_files for select to authenticated using (true);

drop policy if exists "authenticated users can create remittance files" on public.remittance_files;
create policy "authenticated users can create remittance files" on public.remittance_files for insert to authenticated with check (true);

drop policy if exists "admins can delete remittance files" on public.remittance_files;
create policy "admins can delete remittance files" on public.remittance_files for delete to authenticated using (public.is_admin());

drop policy if exists "authenticated users can read fx history" on public.fx_registration_history;
create policy "authenticated users can read fx history" on public.fx_registration_history for select to authenticated using (true);

drop policy if exists "operators can create fx history" on public.fx_registration_history;
create policy "operators can create fx history" on public.fx_registration_history for insert to authenticated with check (public.is_operator());

drop policy if exists "admins can delete fx history" on public.fx_registration_history;
create policy "admins can delete fx history" on public.fx_registration_history for delete to authenticated using (public.is_admin());

drop policy if exists "authenticated users can read deposit history" on public.foreign_deposit_transactions;
create policy "authenticated users can read deposit history" on public.foreign_deposit_transactions for select to authenticated using (true);

drop policy if exists "operators can create deposit history" on public.foreign_deposit_transactions;
create policy "operators can create deposit history" on public.foreign_deposit_transactions for insert to authenticated with check (public.is_operator());

drop policy if exists "admins can delete deposit history" on public.foreign_deposit_transactions;
create policy "admins can delete deposit history" on public.foreign_deposit_transactions for delete to authenticated using (public.is_admin());
