import { AppShell } from "@/components/AppShell";
import { RequestForm } from "@/components/RequestForm";
import { getForeignDeposits, getFxReservations, getPayees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TransferRequestPage() {
  const [payees, reservations, deposits] = await Promise.all([getPayees(), getFxReservations(), getForeignDeposits()]);

  return (
    <AppShell title="送金申請" description="申請フォームのみを表示します。登録後は履歴ページで確認できます。">
      <RequestForm deposits={deposits} payees={payees} reservations={reservations} />
    </AppShell>
  );
}
