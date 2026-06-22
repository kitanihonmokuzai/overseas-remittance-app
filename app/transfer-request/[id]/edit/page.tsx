import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequestForm } from "@/components/RequestForm";
import type { SettlementMethod } from "@/lib/db";
import {
  getAvailableForeignDepositLots,
  getCurrentProfile,
  getForeignDeposits,
  getFxReservations,
  getPayees,
  getRemittanceRequestById
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const request = await getRemittanceRequestById(id);
  if (!request) {
    notFound();
  }
  // 差戻し状態の、自分が申請したものだけ編集できる
  if (request.created_by !== profile.id || request.status !== "差戻し") {
    redirect("/history");
  }

  const [payees, reservations, deposits, lots] = await Promise.all([
    getPayees(),
    getFxReservations(),
    getForeignDeposits(),
    getAvailableForeignDepositLots()
  ]);

  const b = request.beneficiary ?? {};
  const beneficiary = {
    bank_name: b.bankName ?? "",
    branch_name: b.branchName ?? "",
    account_no: b.accountNo ?? "",
    account_name: b.accountName ?? "",
    swift: b.swift ?? "",
    country: b.country ?? "",
    address: b.address ?? "",
    bank_country: b.bankCountry ?? "",
    bank_city: b.bankCity ?? "",
    bank_street: b.bankStreet ?? "",
    bank_postal: b.bankPostal ?? "",
    origin: b.origin ?? "",
    shipping_country: b.shippingCountry ?? "",
    shipping_city: b.shippingCity ?? "",
    charge_bearer: b.chargeBearer ?? ""
  };

  const savedAllocations = (request.remittance_settlement_allocations ?? []).map((allocation) => ({
    id: crypto.randomUUID(),
    method: (allocation.method ?? "スポット") as SettlementMethod,
    amount: allocation.amount != null ? String(allocation.amount) : "",
    reservationId: allocation.reservation_id ?? "",
    depositId: allocation.foreign_deposit_id ?? "",
    depositLotId: allocation.deposit_lot_id ?? "",
    paymentRate: allocation.payment_rate != null ? String(allocation.payment_rate) : ""
  }));

  const allocations = savedAllocations.length
    ? savedAllocations
    : [{ id: crypto.randomUUID(), method: "為替予約" as SettlementMethod, amount: "", reservationId: "", depositId: "", depositLotId: "", paymentRate: "" }];

  const initial = {
    requestId: request.id,
    remittanceDate: request.remittance_date,
    payeeId: request.payee_id ?? payees[0]?.id ?? "",
    amount: request.amount != null ? String(request.amount) : "",
    currency: request.currency,
    memo: request.memo ?? "",
    beneficiary,
    allocations
  };

  return (
    <AppShell title="差戻しの再申請" description="内容を修正して再申請すると、再度「承認待ち」になります。" role={profile.role}>
      {request.reject_reason ? <p className="form-alert">差戻し理由：{request.reject_reason}</p> : null}
      <RequestForm
        deposits={deposits}
        lots={lots}
        payees={payees}
        reservations={reservations}
        userId={profile.id}
        mode="edit"
        initial={initial}
      />
    </AppShell>
  );
}
