create extension if not exists pgcrypto;

create table if not exists payees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank_name text not null default '',
  branch_name text not null default '',
  account_no text not null default '',
  account_name text not null default '',
  swift text not null default '',
  country text not null default '',
  address text not null default '',
  default_currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fx_reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_no text not null unique,
  currency text not null,
  bank text not null,
  booked_date date not null,
  original_amount numeric(16, 2) not null check (original_amount >= 0),
  used_amount numeric(16, 2) not null default 0 check (used_amount >= 0),
  rate numeric(16, 6) not null check (rate >= 0),
  period text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists foreign_deposit_accounts (
  id uuid primary key default gen_random_uuid(),
  bank text not null,
  currency text not null,
  balance numeric(16, 2) not null default 0,
  account_name text not null default '外貨預金口座',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists remittance_requests (
  id uuid primary key default gen_random_uuid(),
  remittance_date date not null,
  payee_id uuid references payees(id) on delete set null,
  payee_name text not null,
  amount numeric(16, 2) not null check (amount > 0),
  currency text not null,
  settlement_method text not null check (settlement_method in ('スポット', '為替予約', '外貨預金')),
  foreign_deposit_id uuid references foreign_deposit_accounts(id) on delete set null,
  memo text not null default '',
  beneficiary jsonb not null default '{}'::jsonb,
  status text not null default '申請中' check (status in ('下書き', '申請中', '支払済')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists remittance_fx_allocations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references remittance_requests(id) on delete cascade,
  reservation_id uuid not null references fx_reservations(id) on delete restrict,
  amount numeric(16, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists remittance_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references remittance_requests(id) on delete cascade,
  file_name text not null,
  storage_key text,
  created_at timestamptz not null default now()
);

create table if not exists fx_registration_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references fx_reservations(id) on delete set null,
  reservation_no text not null,
  bank text not null,
  currency text not null,
  amount numeric(16, 2) not null,
  rate numeric(16, 6) not null,
  created_at timestamptz not null default now()
);

create table if not exists foreign_deposit_transactions (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid references foreign_deposit_accounts(id) on delete set null,
  bank text not null,
  currency text not null,
  amount numeric(16, 2) not null check (amount > 0),
  memo text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists fx_reservations_bank_currency_idx on fx_reservations(bank, currency);
create index if not exists foreign_deposit_accounts_bank_currency_idx on foreign_deposit_accounts(bank, currency);
create index if not exists remittance_requests_date_idx on remittance_requests(remittance_date desc);
create index if not exists remittance_requests_status_idx on remittance_requests(status);
create index if not exists remittance_fx_allocations_request_idx on remittance_fx_allocations(request_id);
create index if not exists remittance_files_request_idx on remittance_files(request_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payees_set_updated_at on payees;
create trigger payees_set_updated_at before update on payees for each row execute function set_updated_at();

drop trigger if exists fx_reservations_set_updated_at on fx_reservations;
create trigger fx_reservations_set_updated_at before update on fx_reservations for each row execute function set_updated_at();

drop trigger if exists foreign_deposit_accounts_set_updated_at on foreign_deposit_accounts;
create trigger foreign_deposit_accounts_set_updated_at before update on foreign_deposit_accounts for each row execute function set_updated_at();

drop trigger if exists remittance_requests_set_updated_at on remittance_requests;
create trigger remittance_requests_set_updated_at before update on remittance_requests for each row execute function set_updated_at();

insert into payees (name, bank_name, branch_name, account_no, account_name, swift, country, address, default_currency)
values
  ('Nord Timber GmbH', 'Deutsche Bank AG', 'Hamburg', 'DE89 3704 0044 0532 0130 00', 'Nord Timber GmbH', 'DEUTDEHHXXX', 'Germany', 'Holzstrasse 18, Hamburg', 'EUR'),
  ('Pacific Lumber Inc.', 'Bank of America', 'Seattle', '478203912', 'Pacific Lumber Inc.', 'BOFAUS3N', 'United States', '1201 3rd Ave, Seattle', 'USD')
on conflict do nothing;

insert into fx_reservations (reservation_no, currency, bank, booked_date, original_amount, used_amount, rate, period)
values
  ('EUR-001', 'EUR', '道銀旭川', '2026-05-20', 50000, 12000, 166.42, '2026/6/1-2026/8/31'),
  ('EUR-016', 'EUR', '北洋旭川', '2026-06-03', 30000, 5000, 165.88, '2026/6/15-2026/9/30'),
  ('USD-026', 'USD', '北洋旭川', '2026-04-12', 40000, 15000, 157.25, '2026/5/1-2026/7/31')
on conflict (reservation_no) do nothing;

insert into foreign_deposit_accounts (bank, currency, balance, account_name)
select bank, currency, balance, account_name
from (values
  ('道銀旭川', 'EUR', 18500::numeric, '外貨預金口座'),
  ('北洋旭川', 'EUR', 12000::numeric, '外貨預金口座'),
  ('北洋旭川', 'USD', 22000::numeric, '外貨預金口座'),
  ('道銀旭川', 'USD', 9000::numeric, '外貨預金口座')
) as seed(bank, currency, balance, account_name)
where not exists (
  select 1
  from foreign_deposit_accounts existing
  where existing.bank = seed.bank
    and existing.currency = seed.currency
    and existing.account_name = seed.account_name
);
