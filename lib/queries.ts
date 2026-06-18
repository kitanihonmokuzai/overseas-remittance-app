import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  DepositTransaction,
  ForeignDepositAccount,
  FxRegistrationHistory,
  FxReservation,
  Payee,
  RemittanceRequest,
  UserProfile,
  UserRole
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

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return {
      id: authData.user.id,
      email: authData.user.email ?? "",
      display_name: "",
      role: "user" as UserRole
    } satisfies UserProfile;
  }

  if (!data) {
    return {
      id: authData.user.id,
      email: authData.user.email ?? "",
      display_name: "",
      role: "user" as UserRole
    } satisfies UserProfile;
  }

  return data as UserProfile;
}

export async function getProfiles() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .order("email");
  throwIfError(error);
  return (data ?? []) as UserProfile[];
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

  const deposits = (data ?? []) as ForeignDepositAccount[];
  const { data: paidRequests } = await supabase
    .from("remittance_requests")
    .select("id, created_at")
    .eq("status", "支払済");
  const requestDates = new Map((paidRequests ?? []).map((request) => [request.id, request.created_at]));

  const { data: allocations } = await supabase
    .from("remittance_settlement_allocations")
    .select("request_id, foreign_deposit_id, amount, created_at")
    .eq("method", "外貨預金")
    .not("foreign_deposit_id", "is", null);

  return deposits.map((deposit) => {
    const latest = (allocations ?? [])
      .filter((allocation) => allocation.foreign_deposit_id === deposit.id && requestDates.has(allocation.request_id))
      .sort((a, b) => new Date(requestDates.get(b.request_id) ?? b.created_at).getTime() - new Date(requestDates.get(a.request_id) ?? a.created_at).getTime())[0];
    return {
      ...deposit,
      last_used_at: latest ? requestDates.get(latest.request_id) ?? latest.created_at : null,
      last_used_amount: latest?.amount ?? null
    };
  });
}

export async function getRemittanceRequests() {
  const supabase = await authenticatedClient();
  const { data, error } = await supabase
    .from("remittance_requests")
    .select("id, remittance_date, payee_name, amount, currency, settlement_method, memo, status, created_at, remittance_files(id), remittance_settlement_allocations(id, request_id, method, reservation_id, foreign_deposit_id, amount)")
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
