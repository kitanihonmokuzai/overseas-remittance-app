-- Remove the initial sample bank data from an existing Supabase database.
-- This keeps records that are already linked to remittance requests or histories.

delete from public.fx_registration_history
where reservation_no in ('EUR-001', 'EUR-016', 'USD-026');

delete from public.fx_reservations r
where r.reservation_no in ('EUR-001', 'EUR-016', 'USD-026')
  and not exists (
    select 1
    from public.remittance_fx_allocations a
    where a.reservation_id = r.id
  )
  and not exists (
    select 1
    from public.remittance_settlement_allocations a
    where a.reservation_id = r.id
  );

delete from public.foreign_deposit_accounts a
where a.bank in ('三菱UFJ銀行', '三井住友銀行')
  and a.account_name = '外貨預金口座'
  and a.currency in ('EUR', 'USD')
  and not exists (
    select 1
    from public.foreign_deposit_transactions t
    where t.deposit_id = a.id
  )
  and not exists (
    select 1
    from public.foreign_deposit_lots l
    where l.deposit_id = a.id
  )
  and not exists (
    select 1
    from public.remittance_requests r
    where r.foreign_deposit_id = a.id
  )
  and not exists (
    select 1
    from public.remittance_settlement_allocations s
    where s.foreign_deposit_id = a.id
  );
