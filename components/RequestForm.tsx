"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { createRemittanceRequest } from "@/lib/actions";
import type { ForeignDepositAccount, FxReservation, Payee } from "@/lib/db";
import { formatAmount, remaining } from "@/lib/db";

export function RequestForm({
  deposits,
  payees,
  reservations
}: {
  deposits: ForeignDepositAccount[];
  payees: Payee[];
  reservations: FxReservation[];
}) {
  const [payeeId, setPayeeId] = useState(payees[0]?.id ?? "");
  const [currency, setCurrency] = useState(payees[0]?.default_currency ?? "EUR");
  const [settlementMethod, setSettlementMethod] = useState("為替予約");

  const payee = useMemo(() => payees.find((item) => item.id === payeeId) ?? payees[0], [payeeId, payees]);
  const filteredReservations = reservations.filter((reservation) => reservation.currency === currency);
  const filteredDeposits = deposits.filter((deposit) => deposit.currency === currency);

  function changePayee(nextId: string) {
    const nextPayee = payees.find((item) => item.id === nextId);
    setPayeeId(nextId);
    if (nextPayee) {
      setCurrency(nextPayee.default_currency);
    }
  }

  return (
    <form action={createRemittanceRequest} className="panel slim-panel">
      <div className="panel-head">
        <h2>申請フォーム</h2>
        <span>送金日、支払金額、決済方法、受取人名が必須です。</span>
      </div>

      <div className="form-grid">
        <label>送金日<input name="remittance_date" required type="date" /></label>
        <label>
          受取人
          <select name="payee_id" onChange={(event) => changePayee(event.target.value)} value={payeeId}>
            {payees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>受取人名<input name="payee_name" required value={payee?.name ?? ""} readOnly /></label>
        <label>
          通貨
          <select name="currency" onChange={(event) => setCurrency(event.target.value)} value={currency}>
            <option>EUR</option>
            <option>USD</option>
            <option>GBP</option>
          </select>
        </label>
        <label>支払金額<input min="1" name="amount" required type="number" /></label>
        <label>
          決済方法
          <select name="settlement_method" onChange={(event) => setSettlementMethod(event.target.value)} value={settlementMethod}>
            <option>スポット</option>
            <option>為替予約</option>
            <option>外貨預金</option>
          </select>
        </label>
      </div>

      {settlementMethod === "為替予約" ? (
        <div className="subpanel">
          <strong>使用する為替予約</strong>
          <div className="allocation-row">
            <select name="fx_reservation_id">
              {filteredReservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.reservation_no} / {reservation.bank} / 残 {formatAmount(remaining(reservation), reservation.currency)}
                </option>
              ))}
            </select>
            <input min="0" name="fx_amount" placeholder="使用額" type="number" />
          </div>
        </div>
      ) : null}

      {settlementMethod === "外貨預金" ? (
        <div className="subpanel">
          <strong>使用する外貨預金口座</strong>
          <select name="foreign_deposit_id">
            {filteredDeposits.map((deposit) => (
              <option key={deposit.id} value={deposit.id}>
                {deposit.bank} / {deposit.account_name} / 残 {formatAmount(deposit.balance, deposit.currency)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="subpanel">
        <strong>受取人情報</strong>
        <div className="form-grid compact">
          <label>銀行名<input name="bank_name" value={payee?.bank_name ?? ""} readOnly /></label>
          <label>支店名<input name="branch_name" defaultValue={payee?.branch_name ?? ""} /></label>
          <label>口座番号<input name="account_no" defaultValue={payee?.account_no ?? ""} /></label>
          <label>口座名義<input name="account_name" defaultValue={payee?.account_name ?? ""} /></label>
          <label>SWIFT<input name="swift" defaultValue={payee?.swift ?? ""} /></label>
          <label>国<input name="country" defaultValue={payee?.country ?? ""} /></label>
          <label className="full">住所<input name="address" defaultValue={payee?.address ?? ""} /></label>
        </div>
      </div>

      <label className="memo">添付PDF名<textarea name="file_names" placeholder="PDFファイル名を1行ずつ入力。ファイル本体の保存先は次段階でS3/R2等に接続します。" /></label>
      <label className="memo">備考<textarea name="memo" /></label>

      <div className="actions">
        <button className="primary" type="submit"><Send size={18} />申請登録</button>
      </div>
    </form>
  );
}
