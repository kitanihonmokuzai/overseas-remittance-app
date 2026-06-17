import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  DepositTransaction,
  ForeignDepositAccount,
  FxRegistrationHistory,
  FxReservation,
  Payee,
  RemittanceRequest
} from "@/lib/db";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function getPayees() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.from("payees").select("*").order("name");
  throwIfError(error);
  return (data ?? []) as Payee[];
}

export async function getFxReservations() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("fx_reservations")
    .select("*")
    .order("bank")
    .order("currency")
    .order("reservation_no");
  throwIfError(error);
  return (data ?? []) as FxReservation[];
}

export async function getForeignDeposits() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("foreign_deposit_accounts")
    .select("*")
    .order("bank")
    .order("currency");
  throwIfError(error);
  return (data ?? []) as ForeignDepositAccount[];
}

export async function getRemittanceRequests() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("remittance_requests")
    .select("id, remittance_date, payee_name, amount, currency, settlement_method, memo, status, created_at, remittance_files(id)")
    .order("created_at", { ascending: false });
  throwIfError(error);

  return (data ?? []).map((request) => ({
    ...request,
    file_count: Array.isArray(request.remittance_files) ? request.remittance_files.length : 0
  })) as RemittanceRequest[];
}

export async function getFxRegistrationHistory() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("fx_registration_history")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as FxRegistrationHistory[];
}

export async function getDepositTransactions() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("foreign_deposit_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as DepositTransaction[];
}
