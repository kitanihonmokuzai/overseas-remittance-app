"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/db";

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
  const settlementMethod = value(formData, "settlement_method");
  const memo = value(formData, "memo");
  const foreignDepositId = value(formData, "foreign_deposit_id");
  const fxReservationId = value(formData, "fx_reservation_id");
  const fxAmount = numberValue(formData, "fx_amount");

  if (!remittanceDate || !payeeName || amount <= 0 || !currency || !settlementMethod) {
    throw new Error("必須項目が不足しています。");
  }

  const beneficiary = {
    bankName: value(formData, "bank_name"),
    branchName: value(formData, "branch_name"),
    accountNo: value(formData, "account_no"),
    accountName: value(formData, "account_name"),
    swift: value(formData, "swift"),
    country: value(formData, "country"),
    address: value(formData, "address")
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
      foreign_deposit_id: foreignDepositId || null,
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

  if (settlementMethod === "為替予約" && fxReservationId && fxAmount > 0) {
    const { error } = await supabase.from("remittance_fx_allocations").insert({
      request_id: requestId,
      reservation_id: fxReservationId,
      amount: fxAmount
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
  const { supabase } = await authenticatedClient();
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
  const { supabase } = await authenticatedClient();
  const depositId = value(formData, "deposit_id");
  const amount = numberValue(formData, "amount");
  const memo = value(formData, "memo");

  if (!depositId || amount <= 0) {
    throw new Error("入金口座と入金額を入力してください。");
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
    memo
  });
  throwIfError(insertError);

  revalidatePath("/foreign-deposits");
  revalidatePath("/history");
  redirect("/foreign-deposits");
}

export async function markRequestPaid(formData: FormData) {
  const { supabase } = await authenticatedClient();
  const requestId = value(formData, "request_id");
  if (!requestId) {
    throw new Error("申請IDがありません。");
  }

  const { data: request, error: requestError } = await supabase
    .from("remittance_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  throwIfError(requestError);

  if (!request || request.status === "支払済") {
    revalidatePath("/history");
    return;
  }

  if (request.settlement_method === "為替予約") {
    const { data: allocations, error } = await supabase
      .from("remittance_fx_allocations")
      .select("amount, reservation_id, fx_reservations(used_amount)")
      .eq("request_id", requestId);
    throwIfError(error);

    for (const allocation of allocations ?? []) {
      const reservation = Array.isArray(allocation.fx_reservations)
        ? allocation.fx_reservations[0]
        : allocation.fx_reservations;
      const nextUsedAmount = toNumber(reservation?.used_amount) + toNumber(allocation.amount);
      const { error: updateError } = await supabase
        .from("fx_reservations")
        .update({ used_amount: nextUsedAmount })
        .eq("id", allocation.reservation_id);
      throwIfError(updateError);
    }
  }

  if (request.settlement_method === "外貨預金" && request.foreign_deposit_id) {
    const { data: deposit, error } = await supabase
      .from("foreign_deposit_accounts")
      .select("balance")
      .eq("id", request.foreign_deposit_id)
      .single();
    throwIfError(error);
    if (!deposit) {
      throw new Error("外貨預金口座が見つかりません。");
    }

    const { error: updateError } = await supabase
      .from("foreign_deposit_accounts")
      .update({ balance: toNumber(deposit.balance) - toNumber(request.amount) })
      .eq("id", request.foreign_deposit_id);
    throwIfError(updateError);
  }

  const { error: paidError } = await supabase
    .from("remittance_requests")
    .update({ status: "支払済" })
    .eq("id", requestId);
  throwIfError(paidError);

  revalidatePath("/history");
  revalidatePath("/fx-reservations");
  revalidatePath("/foreign-deposits");
}
