"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { createRemittanceRequest } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { ForeignDepositAccount, FxReservation, Payee } from "@/lib/db";
import { formatAmount, remaining } from "@/lib/db";

type Beneficiary = {
  bank_name: string;
  branch_name: string;
  account_no: string;
  account_name: string;
  swift: string;
  country: string;
  address: string;
};

function beneficiaryFromPayee(payee?: Payee): Beneficiary {
  return {
    bank_name: payee?.bank_name ?? "",
    branch_name: payee?.branch_name ?? "",
    account_no: payee?.account_no ?? "",
    account_name: payee?.account_name ?? "",
    swift: payee?.swift ?? "",
    country: payee?.country ?? "",
    address: payee?.address ?? ""
  };
}

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
  const [beneficiary, setBeneficiary] = useState<Beneficiary>(beneficiaryFromPayee(payee));

  const filteredReservations = reservations.filter((reservation) => reservation.currency === currency);
  const filteredDeposits = deposits.filter((deposit) => deposit.currency === currency);

  function changePayee(nextId: string) {
    const nextPayee = payees.find((item) => item.id === nextId);
    setPayeeId(nextId);
    setBeneficiary(beneficiaryFromPayee(nextPayee));
    if (nextPayee) {
      setCurrency(nextPayee.default_currency);
    }
  }

  function updateBeneficiary(key: keyof Beneficiary, value: string) {
    setBeneficiary((current) => ({ ...current, [key]: value }));
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
          <label>銀行名<input name="bank_name" onChange={(event) => updateBeneficiary("bank_name", event.target.value)} value={beneficiary.bank_name} /></label>
          <label>支店名<input name="branch_name" onChange={(event) => updateBeneficiary("branch_name", event.target.value)} value={beneficiary.branch_name} /></label>
          <label>口座番号<input name="account_no" onChange={(event) => updateBeneficiary("account_no", event.target.value)} value={beneficiary.account_no} /></label>
          <label>口座名義<input name="account_name" onChange={(event) => updateBeneficiary("account_name", event.target.value)} value={beneficiary.account_name} /></label>
          <label>SWIFT<input name="swift" onChange={(event) => updateBeneficiary("swift", event.target.value)} value={beneficiary.swift} /></label>
          <label>国<input name="country" onChange={(event) => updateBeneficiary("country", event.target.value)} value={beneficiary.country} /></label>
          <label className="full">住所<input name="address" onChange={(event) => updateBeneficiary("address", event.target.value)} value={beneficiary.address} /></label>
        </div>
      </div>

      <label className="memo">添付PDF<input accept="application/pdf" multiple name="attachments" type="file" /></label>
      <label className="memo">備考<textarea name="memo" /></label>

      <div className="actions">
        <SubmitButton
          className="primary"
          icon={<Send size={18} />}
          notice="申請と添付PDFを保存しています。完了後に履歴へ移動します。"
          pendingLabel="申請登録中..."
        >
          申請登録
        </SubmitButton>
      </div>
    </form>
  );
}
