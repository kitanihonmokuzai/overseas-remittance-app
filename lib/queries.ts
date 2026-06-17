import { sql, type DepositTransaction, type ForeignDepositAccount, type FxRegistrationHistory, type FxReservation, type Payee, type RemittanceRequest } from "@/lib/db";

export async function getPayees() {
  const rows = await sql`select * from payees order by name`;
  return rows as Payee[];
}

export async function getFxReservations() {
  const rows = await sql`select * from fx_reservations order by bank, currency, reservation_no`;
  return rows as FxReservation[];
}

export async function getForeignDeposits() {
  const rows = await sql`select * from foreign_deposit_accounts order by bank, currency`;
  return rows as ForeignDepositAccount[];
}

export async function getRemittanceRequests() {
  const rows = await sql`
    select
      r.id,
      r.remittance_date,
      r.payee_name,
      r.amount,
      r.currency,
      r.settlement_method,
      r.memo,
      r.status,
      r.created_at,
      count(f.id)::text as file_count
    from remittance_requests r
    left join remittance_files f on f.request_id = r.id
    group by r.id
    order by r.created_at desc
  `;
  return rows as RemittanceRequest[];
}

export async function getFxRegistrationHistory() {
  const rows = await sql`select * from fx_registration_history order by created_at desc`;
  return rows as FxRegistrationHistory[];
}

export async function getDepositTransactions() {
  const rows = await sql`select * from foreign_deposit_transactions order by created_at desc`;
  return rows as DepositTransaction[];
}
