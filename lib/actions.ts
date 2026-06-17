"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, toNumber } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key) || 0);
}

export async function createRemittanceRequest(formData: FormData) {
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
  const fileNames = value(formData, "file_names")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

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

  const rows = await sql`
    insert into remittance_requests (
      remittance_date,
      payee_id,
      payee_name,
      amount,
      currency,
      settlement_method,
      foreign_deposit_id,
      memo,
      beneficiary,
      status
    )
    values (
      ${remittanceDate},
      ${payeeId || null},
      ${payeeName},
      ${amount},
      ${currency},
      ${settlementMethod},
      ${foreignDepositId || null},
      ${memo},
      ${JSON.stringify(beneficiary)}::jsonb,
      '申請中'
    )
    returning id
  `;

  const requestId = rows[0].id as string;

  if (settlementMethod === "為替予約" && fxReservationId && fxAmount > 0) {
    await sql`
      insert into remittance_fx_allocations (request_id, reservation_id, amount)
      values (${requestId}, ${fxReservationId}, ${fxAmount})
    `;
  }

  for (const fileName of fileNames) {
    await sql`
      insert into remittance_files (request_id, file_name)
      values (${requestId}, ${fileName})
    `;
  }

  revalidatePath("/history");
  redirect("/history");
}

export async function createFxReservation(formData: FormData) {
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

  const rows = await sql`
    insert into fx_reservations (reservation_no, bank, currency, booked_date, original_amount, used_amount, rate, period)
    values (${reservationNo}, ${bank}, ${currency}, ${bookedDate}, ${originalAmount}, 0, ${rate}, ${period})
    returning id
  `;

  await sql`
    insert into fx_registration_history (reservation_id, reservation_no, bank, currency, amount, rate)
    values (${rows[0].id}, ${reservationNo}, ${bank}, ${currency}, ${originalAmount}, ${rate})
  `;

  revalidatePath("/fx-reservations");
  revalidatePath("/history");
  redirect("/fx-reservations");
}

export async function createDepositTransaction(formData: FormData) {
  const depositId = value(formData, "deposit_id");
  const amount = numberValue(formData, "amount");
  const memo = value(formData, "memo");

  if (!depositId || amount <= 0) {
    throw new Error("入金先口座と入金額を入力してください。");
  }

  const deposits = await sql`
    select * from foreign_deposit_accounts where id = ${depositId} limit 1
  `;
  const deposit = deposits[0];

  if (!deposit) {
    throw new Error("入金先口座が見つかりません。");
  }

  await sql`
    update foreign_deposit_accounts
    set balance = balance + ${amount}
    where id = ${depositId}
  `;

  await sql`
    insert into foreign_deposit_transactions (deposit_id, bank, currency, amount, memo)
    values (${depositId}, ${deposit.bank}, ${deposit.currency}, ${amount}, ${memo})
  `;

  revalidatePath("/foreign-deposits");
  revalidatePath("/history");
  redirect("/foreign-deposits");
}

export async function markRequestPaid(formData: FormData) {
  const requestId = value(formData, "request_id");
  if (!requestId) {
    throw new Error("申請IDがありません。");
  }

  const requests = await sql`
    select * from remittance_requests where id = ${requestId} limit 1
  `;
  const request = requests[0];

  if (!request || request.status === "支払済") {
    revalidatePath("/history");
    return;
  }

  if (request.settlement_method === "為替予約") {
    const allocations = await sql`
      select * from remittance_fx_allocations where request_id = ${requestId}
    `;
    for (const allocation of allocations) {
      await sql`
        update fx_reservations
        set used_amount = used_amount + ${toNumber(allocation.amount)}
        where id = ${allocation.reservation_id}
      `;
    }
  }

  if (request.settlement_method === "外貨預金" && request.foreign_deposit_id) {
    await sql`
      update foreign_deposit_accounts
      set balance = balance - ${toNumber(request.amount)}
      where id = ${request.foreign_deposit_id}
    `;
  }

  await sql`
    update remittance_requests
    set status = '支払済'
    where id = ${requestId}
  `;

  revalidatePath("/history");
  revalidatePath("/fx-reservations");
  revalidatePath("/foreign-deposits");
}
