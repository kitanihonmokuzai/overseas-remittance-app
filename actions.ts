"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/db";
import type { SettlementMethod, UserRole } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key) || 0);
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return { supabase, user: data.user };
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

async function currentRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.role) {
    return "user";
  }

  return data.role as UserRole;
}

async function requireOperator(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const role = await currentRole(supabase, userId);
  if (role !== "admin" && role !== "approver") {
    throw new Error("この操作を行う権限がありません。");
  }
  return role;
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const role = await currentRole(supabase, userId);
  if (role !== "admin") {
    throw new Error("この操作は管理者のみ実行できます。");
  }
  return role;
}

function collectSettlementAllocations(formData: FormData) {
  const methods = formData.getAll("allocation_method").map((item) => String(item));
  const amounts = formData.getAll("allocation_amount").map((item) => Number(String(item) || 0));
  const reservationIds = formData.getAll("allocation_reservation_id").map((item) => String(item || ""));
  const depositIds = formData.getAll("allocation_deposit_id").map((item) => String(item || ""));
  const lotIds = formData.getAll("allocation_deposit_lot_id").map((item) => String(item || ""));
  const paymentRates = formData.getAll("allocation_payment_rate").map((item) => Number(String(item) || 0));

  return methods.map((method, index) => ({
    method: method as SettlementMethod,
    amount: amounts[index] ?? 0,
    reservation_id: reservationIds[index] || null,
    foreign_deposit_id: depositIds[index] || null,
    deposit_lot_id: lotIds[index] || null,
    payment_rate: paymentRates[index] || null
  })).filter((allocation) => allocation.amount > 0);
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/transfer-request");
}

export async function signUp(formData: FormData) {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/transfer-request");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createRemittanceRequest(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  const remittanceDate = value(formData, "remittance_date");
  const payeeId = value(formData, "payee_id");
  const payeeName = value(formData, "payee_name");
  const amount = numberValue(formData, "amount");
  const currency = value(formData, "currency");
  const allocations = collectSettlementAllocations(formData);
  const memo = value(formData, "memo");

  if (!remittanceDate || !payeeName || amount <= 0 || !currency) {
    throw new Error("必須項目が不足しています。");
  }

  if (allocations.length === 0) {
    throw new Error("決済方法を1件以上入力してください。");
  }

  const allocationTotal = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  if (Math.abs(allocationTotal - amount) > 0.01) {
    throw new Error(`決済方法の合計 ${allocationTotal.toLocaleString("ja-JP")} が支払金額と一致していません。`);
  }

  for (const allocation of allocations) {
    if (allocation.method === "為替予約" && !allocation.reservation_id) {
      throw new Error("為替予約を使う明細では予約Noを選択してください。");
    }
    if (allocation.method === "外貨預金" && !allocation.foreign_deposit_id) {
      throw new Error("外貨預金を使う明細では口座を選択してください。");
    }
    if (allocation.method === "外貨預金" && !allocation.deposit_lot_id) {
      throw new Error("外貨預金を使う明細では売上入金分を選択してください。");
    }
    if (allocation.method === "外貨預金" && !allocation.payment_rate) {
      throw new Error("外貨預金を使う明細では支払時レートを入力してください。");
    }
  }

  const uniqueMethods = Array.from(new Set(allocations.map((allocation) => allocation.method)));
  const settlementMethod = uniqueMethods.length === 1 ? uniqueMethods[0] : "複合";

  const beneficiary = {
    bankName: value(formData, "bank_name"),
    branchName: value(formData, "branch_name"),
    accountNo: value(formData, "account_no"),
    accountName: value(formData, "account_name"),
    swift: value(formData, "swift"),
    country: value(formData, "country"),
    address: value(formData, "address"),
    bankCountry: value(formData, "bank_country"),
    bankCity: value(formData, "bank_city"),
    bankStreet: value(formData, "bank_street"),
    bankPostal: value(formData, "bank_postal"),
    origin: value(formData, "origin"),
    shippingCountry: value(formData, "shipping_country"),
    shippingCity: value(formData, "shipping_city"),
    chargeBearer: value(formData, "charge_bearer")
  };

  const { data: request, error: requestError } = await supabase
    .from("remittance_requests")
    .insert({
      remittance_date: remittanceDate,
      payee_id: payeeId || null,
      payee_name: payeeName,
      amount,
      currency,
      settlement_method: settlementMethod,
      foreign_deposit_id: allocations.find((allocation) => allocation.method === "外貨預金")?.foreign_deposit_id ?? null,
      memo,
      beneficiary,
      status: "申請中",
      created_by: user.id
    })
    .select("id")
    .single();
  throwIfError(requestError);
  if (!request) {
    throw new Error("申請の登録に失敗しました。");
  }

  const requestId = request.id as string;

  const { error: allocationError } = await supabase.from("remittance_settlement_allocations").insert(
    allocations.map((allocation) => ({
      request_id: requestId,
      method: allocation.method,
      reservation_id: allocation.method === "為替予約" ? allocation.reservation_id : null,
      foreign_deposit_id: allocation.method === "外貨預金" ? allocation.foreign_deposit_id : null,
      deposit_lot_id: allocation.method === "外貨預金" ? allocation.deposit_lot_id : null,
      payment_rate: allocation.method === "外貨預金" ? allocation.payment_rate : null,
      amount: allocation.amount
    }))
  );
  throwIfError(allocationError);

  for (const allocation of allocations.filter((item) => item.method === "為替予約" && item.reservation_id)) {
    const { error } = await supabase.from("remittance_fx_allocations").insert({
      request_id: requestId,
      reservation_id: allocation.reservation_id,
      amount: allocation.amount
    });
    throwIfError(error);
  }

  const files = formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);

  for (const file of files) {
    const storagePath = `${user.id}/${requestId}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("remittance-files").upload(storagePath, file, {
      contentType: file.type || "application/pdf",
      upsert: false
    });
    throwIfError(uploadError);

    const { error: fileError } = await supabase.from("remittance_files").insert({
      request_id: requestId,
      file_name: file.name,
      storage_path: storagePath
    });
    throwIfError(fileError);
  }

  revalidatePath("/history");
  redirect("/history");
}

export async function createFxReservation(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  await requireOperator(supabase, user.id);
  const reservationNo = value(formData, "reservation_no");
  const bank = value(formData, "bank");
  const currency = value(formData, "currency");
  const bookedDate = value(formData, "booked_date");
  const originalAmount = numberValue(formData, "original_amount");
  const rate = numberValue(formData, "rate");
  const period = value(formData, "period");

  if (!reservationNo || !bank || !currency || !bookedDate || originalAmount <= 0 || rate <= 0) {
    throw new Error("必須項目が不足しています。");
  }

  const { data: reservation, error } = await supabase
    .from("fx_reservations")
    .insert({
      reservation_no: reservationNo,
      bank,
      currency,
      booked_date: bookedDate,
      original_amount: originalAmount,
      used_amount: 0,
      rate,
      period
    })
    .select("id")
    .single();
  throwIfError(error);
  if (!reservation) {
    throw new Error("為替予約の登録に失敗しました。");
  }

  const { error: historyError } = await supabase.from("fx_registration_history").insert({
    reservation_id: reservation.id,
    reservation_no: reservationNo,
    bank,
    currency,
    amount: originalAmount,
    rate
  });
  throwIfError(historyError);

  revalidatePath("/fx-reservations");
  revalidatePath("/history");
  redirect("/fx-reservations");
}

export async function createDepositTransaction(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  await requireOperator(supabase, user.id);
  const depositId = value(formData, "deposit_id");
  const receivedDate = value(formData, "received_date");
  const payerName = value(formData, "payer_name");
  const amount = numberValue(formData, "amount");
  const receiptRate = numberValue(formData, "receipt_rate");
  const memo = value(formData, "memo");

  if (!depositId || !receivedDate || !payerName || amount <= 0 || receiptRate <= 0) {
    throw new Error("入金口座、入金日、入金元、入金額、入金時レートを入力してください。");
  }

  const { data: deposit, error: selectError } = await supabase
    .from("foreign_deposit_accounts")
    .select("*")
    .eq("id", depositId)
    .single();
  throwIfError(selectError);
  if (!deposit) {
    throw new Error("入金口座が見つかりません。");
  }

  const { error: updateError } = await supabase
    .from("foreign_deposit_accounts")
    .update({ balance: toNumber(deposit.balance) + amount })
    .eq("id", depositId);
  throwIfError(updateError);

  const { error: insertError } = await supabase.from("foreign_deposit_transactions").insert({
    deposit_id: depositId,
    bank: deposit.bank,
    currency: deposit.currency,
    amount,
    received_date: receivedDate,
    payer_name: payerName,
    receipt_rate: receiptRate,
    memo
  });
  throwIfError(insertError);

  const { error: lotError } = await supabase.from("foreign_deposit_lots").insert({
    deposit_id: depositId,
    received_date: receivedDate,
    payer_name: payerName,
    bank: deposit.bank,
    currency: deposit.currency,
    original_amount: amount,
    remaining_amount: amount,
    receipt_rate: receiptRate,
    memo
  });
  throwIfError(lotError);

  revalidatePath("/foreign-deposits");
  revalidatePath("/history");
  redirect("/foreign-deposits");
}

export async function markRequestPaid(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  await requireOperator(supabase, user.id);
  const requestId = value(formData, "request_id");
  if (!requestId) {
    throw new Error("申請IDがありません。");
  }

  // 残高更新・差損益計算・履歴登録・ステータス変更を
  // Postgres 側の RPC で原子的に実行する（競合・二重控除・超過引当を防止）。
  const { error } = await supabase.rpc("mark_request_paid", { p_request_id: requestId });
  throwIfError(error);

  revalidatePath("/history");
  revalidatePath("/fx-reservations");
  revalidatePath("/foreign-deposits");
}

export async function deleteRemittanceRequest(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  await requireAdmin(supabase, user.id);

  const requestId = value(formData, "request_id");
  if (!requestId) {
    throw new Error("削除する申請IDがありません。");
  }

  const { error } = await supabase.from("remittance_requests").delete().eq("id", requestId);
  throwIfError(error);
  revalidatePath("/history");
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  await requireAdmin(supabase, user.id);

  const userId = value(formData, "user_id");
  const role = value(formData, "role") as UserRole;
  if (!userId || !["admin", "approver", "user"].includes(role)) {
    throw new Error("ユーザーまたは権限が不正です。");
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  throwIfError(error);
  revalidatePath("/admin/users");
}
