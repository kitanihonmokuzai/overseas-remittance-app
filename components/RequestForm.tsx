"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { createRemittanceRequest } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { ForeignDepositAccount, ForeignDepositLot, FxReservation, Payee, SettlementMethod } from "@/lib/db";
import { formatAmount, formatRate, remaining, toNumber } from "@/lib/db";

type Beneficiary = {
  bank_name: string;
  branch_name: string;
  account_no: string;
  account_name: string;
  swift: string;
  country: string;
  address: string;
};

type AllocationRow = {
  id: string;
  method: SettlementMethod;
  amount: string;
  reservationId: string;
  depositId: string;
  depositLotId: string;
  paymentRate: string;
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

function newAllocation(method: SettlementMethod = "為替予約"): AllocationRow {
  return {
    id: crypto.randomUUID(),
    method,
    amount: "",
    reservationId: "",
    depositId: "",
    depositLotId: "",
    paymentRate: ""
  };
}

export function RequestForm({
  deposits,
  lots,
  payees,
  reservations
}: {
  deposits: ForeignDepositAccount[];
  lots: ForeignDepositLot[];
  payees: Payee[];
  reservations: FxReservation[];
}) {
  const [payeeId, setPayeeId] = useState(payees[0]?.id ?? "");
  const [currency, setCurrency] = useState(payees[0]?.default_currency ?? "EUR");
  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState<AllocationRow[]>([newAllocation()]);
  const [formError, setFormError] = useState("");
  const payee = useMemo(() => payees.find((item) => item.id === payeeId) ?? payees[0], [payeeId, payees]);
  const [beneficiary, setBeneficiary] = useState<Beneficiary>(beneficiaryFromPayee(payee));

  const filteredReservations = reservations.filter((reservation) => reservation.currency === currency);
  const filteredDeposits = deposits.filter((deposit) => deposit.currency === currency);
  const filteredLots = lots.filter((lot) => lot.currency === currency && toNumber(lot.remaining_amount) > 0);
  const allocationTotal = allocations.reduce((sum, allocation) => sum + toNumber(allocation.amount), 0);
  const amountNumber = toNumber(amount);
  const totalMatches = amountNumber > 0 && Math.abs(allocationTotal - amountNumber) <= 0.01;

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

  function updateAllocation(id: string, patch: Partial<AllocationRow>) {
    setAllocations((current) => current.map((allocation) => (
      allocation.id === id ? { ...allocation, ...patch } : allocation
    )));
  }

  function removeAllocation(id: string) {
    setAllocations((current) => current.length === 1 ? current : current.filter((allocation) => allocation.id !== id));
  }

  function validateSubmit(event: FormEvent<HTMLFormElement>) {
    if (!totalMatches) {
      event.preventDefault();
      setFormError("決済明細の合計金額が支払金額と一致していません。");
      return;
    }
    setFormError("");
  }

  return (
    <form action={createRemittanceRequest} className="panel request-document" onSubmit={validateSubmit}>
      <div className="document-title">
        <h2>海外送金依頼書</h2>
        <span>システム申請</span>
      </div>

      <section className="document-section">
        <h3>1. 支払内容</h3>
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
          <label>支払金額<input min="1" name="amount" onChange={(event) => setAmount(event.target.value)} required type="number" value={amount} /></label>
          <div className={`total-check ${totalMatches ? "ok" : ""}`}>
            <span>決済明細合計</span>
            <strong>{amountNumber > 0 ? formatAmount(allocationTotal, currency) : "-"}</strong>
          </div>
        </div>
      </section>

      <section className="document-section">
        <div className="section-heading-row">
          <h3>2. 決済方法</h3>
          <button className="secondary small" onClick={() => setAllocations((current) => [...current, newAllocation("スポット")])} type="button">
            <Plus size={16} />行追加
          </button>
        </div>

        <div className="allocation-list">
          {allocations.map((allocation, index) => {
            const selectedReservation = filteredReservations.find((reservation) => reservation.id === allocation.reservationId);
            const selectedLot = filteredLots.find((lot) => lot.id === allocation.depositLotId);
            const selectedDeposit = selectedLot ? filteredDeposits.find((deposit) => deposit.id === selectedLot.deposit_id) : undefined;

            return (
              <div className="allocation-card" key={allocation.id}>
                <span className="row-number">{index + 1}</span>
                <label>
                  方法
                  <select
                    name="allocation_method"
                    onChange={(event) => updateAllocation(allocation.id, { method: event.target.value as SettlementMethod, reservationId: "", depositId: "", depositLotId: "", paymentRate: "" })}
                    value={allocation.method}
                  >
                    <option>スポット</option>
                    <option>為替予約</option>
                    <option>外貨預金</option>
                  </select>
                </label>
                <label>金額<input min="0" name="allocation_amount" onChange={(event) => updateAllocation(allocation.id, { amount: event.target.value })} required type="number" value={allocation.amount} /></label>

                {allocation.method === "為替予約" ? (
                  <label className="wide-field">
                    予約No
                    <select name="allocation_reservation_id" onChange={(event) => updateAllocation(allocation.id, { reservationId: event.target.value })} required value={allocation.reservationId}>
                      <option value="">選択してください</option>
                      {filteredReservations.map((reservation) => (
                        <option key={reservation.id} value={reservation.id}>
                          {reservation.reservation_no} / {reservation.bank} / 残 {formatAmount(remaining(reservation), reservation.currency)}
                        </option>
                      ))}
                    </select>
                    <input name="allocation_deposit_id" type="hidden" value="" />
                    <input name="allocation_deposit_lot_id" type="hidden" value="" />
                    <input name="allocation_payment_rate" type="hidden" value="" />
                    {selectedReservation ? <small>レート {selectedReservation.rate} / 期間 {selectedReservation.period || "-"}</small> : null}
                  </label>
                ) : allocation.method === "外貨預金" ? (
                  <label className="wide-field">
                    売上入金分
                    <select
                      name="allocation_deposit_lot_id"
                      onChange={(event) => {
                        const lot = filteredLots.find((item) => item.id === event.target.value);
                        updateAllocation(allocation.id, {
                          depositLotId: event.target.value,
                          depositId: lot?.deposit_id ?? ""
                        });
                      }}
                      required
                      value={allocation.depositLotId}
                    >
                      <option value="">選択してください</option>
                      {filteredLots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          {lot.received_date} / {lot.payer_name} / {lot.bank} / 残 {formatAmount(lot.remaining_amount, lot.currency)} / 入金R {formatRate(lot.receipt_rate)}
                        </option>
                      ))}
                    </select>
                    <input name="allocation_deposit_id" type="hidden" value={allocation.depositId} />
                    <input name="allocation_reservation_id" type="hidden" value="" />
                    <label className="nested-field">支払時レート<input min="0" name="allocation_payment_rate" onChange={(event) => updateAllocation(allocation.id, { paymentRate: event.target.value })} required step="0.0001" type="number" value={allocation.paymentRate} /></label>
                    {selectedLot ? (
                      <small>
                        入金時レート {formatRate(selectedLot.receipt_rate)}
                        {allocation.paymentRate ? ` / 見込差損益 ${Math.round((toNumber(allocation.paymentRate) - toNumber(selectedLot.receipt_rate)) * toNumber(allocation.amount)).toLocaleString("ja-JP")}円` : ""}
                        {selectedDeposit ? ` / 口座 ${selectedDeposit.account_name}` : ""}
                      </small>
                    ) : null}
                  </label>
                ) : (
                  <>
                    <input name="allocation_reservation_id" type="hidden" value="" />
                    <input name="allocation_deposit_id" type="hidden" value="" />
                    <input name="allocation_deposit_lot_id" type="hidden" value="" />
                    <input name="allocation_payment_rate" type="hidden" value="" />
                    <span className="spot-note">銀行レートで決済</span>
                  </>
                )}

                <button className="icon-button" onClick={() => removeAllocation(allocation.id)} type="button" aria-label="決済明細を削除">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {amountNumber > 0 && !totalMatches ? (
          <p className="form-alert">支払金額 {formatAmount(amountNumber, currency)} と決済明細合計 {formatAmount(allocationTotal, currency)} が一致していません。</p>
        ) : null}
      </section>

      <section className="document-section">
        <h3>3. 受取人情報</h3>
        <div className="form-grid compact">
          <label>銀行名<input name="bank_name" onChange={(event) => updateBeneficiary("bank_name", event.target.value)} value={beneficiary.bank_name} /></label>
          <label>支店名<input name="branch_name" onChange={(event) => updateBeneficiary("branch_name", event.target.value)} value={beneficiary.branch_name} /></label>
          <label>口座番号<input name="account_no" onChange={(event) => updateBeneficiary("account_no", event.target.value)} value={beneficiary.account_no} /></label>
          <label>口座名義<input name="account_name" onChange={(event) => updateBeneficiary("account_name", event.target.value)} value={beneficiary.account_name} /></label>
          <label>SWIFT<input name="swift" onChange={(event) => updateBeneficiary("swift", event.target.value)} value={beneficiary.swift} /></label>
          <label>国<input name="country" onChange={(event) => updateBeneficiary("country", event.target.value)} value={beneficiary.country} /></label>
          <label className="full">住所<input name="address" onChange={(event) => updateBeneficiary("address", event.target.value)} value={beneficiary.address} /></label>
        </div>
      </section>

      <section className="document-section">
        <h3>4. 添付・備考</h3>
        <label className="memo">添付PDF<input accept="application/pdf" multiple name="attachments" type="file" /></label>
        <label className="memo">備考<textarea name="memo" /></label>
      </section>

      {formError ? <p className="form-alert bottom-alert">{formError}</p> : null}

      <div className="actions document-actions">
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
