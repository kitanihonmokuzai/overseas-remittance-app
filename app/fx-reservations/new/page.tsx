import Link from "next/link";
import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { createFxReservation } from "@/lib/actions";
import { canOperate } from "@/lib/db";
import { getCurrentProfile } from "@/lib/queries";

export default async function NewFxReservationPage() {
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/fx-reservations");
  }

  return (
    <AppShell title="為替予約登録" description="新しい予約Noを登録します。" role={profile.role} action={<Link className="secondary" href="/fx-reservations">一覧へ戻る</Link>}>
      <form action={createFxReservation} className="panel slim-panel">
        <div className="form-grid">
          <label>予約No<input name="reservation_no" required /></label>
          <label>予約日<input name="booked_date" required type="date" /></label>
          <label>銀行<select name="bank"><option>三菱UFJ銀行</option><option>三井住友銀行</option><option>みずほ銀行</option></select></label>
          <label>通貨<select name="currency"><option>EUR</option><option>USD</option><option>GBP</option></select></label>
          <label>予約額<input min="1" name="original_amount" required type="number" /></label>
          <label>レート<input min="0" name="rate" required step="0.01" type="number" /></label>
          <label className="full">期間<input name="period" placeholder="2026/6/1-2026/8/31" /></label>
        </div>
        <div className="actions">
          <SubmitButton
            className="primary"
            icon={<Save size={18} />}
            notice="為替予約を登録し、履歴に反映しています。"
            pendingLabel="登録中..."
          >
            登録
          </SubmitButton>
        </div>
      </form>
    </AppShell>
  );
}
