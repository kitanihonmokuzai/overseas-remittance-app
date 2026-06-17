import Link from "next/link";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createFxReservation } from "@/lib/actions";

export default function NewFxReservationPage() {
  return (
    <AppShell title="為替予約登録" description="新しい予約Noを登録します。" action={<Link className="secondary" href="/fx-reservations">一覧へ戻る</Link>}>
      <form action={createFxReservation} className="panel slim-panel">
        <div className="form-grid">
          <label>予約No<input name="reservation_no" required /></label>
          <label>予約日<input name="booked_date" required type="date" /></label>
          <label>銀行<select name="bank"><option>道銀旭川</option><option>北洋旭川</option><option>秋田銀行</option></select></label>
          <label>通貨<select name="currency"><option>EUR</option><option>USD</option><option>GBP</option></select></label>
          <label>予約額<input min="1" name="original_amount" required type="number" /></label>
          <label>レート<input min="0" name="rate" required step="0.01" type="number" /></label>
          <label className="full">期間<input name="period" placeholder="2026/6/1-2026/8/31" /></label>
        </div>
        <div className="actions"><button className="primary" type="submit"><Save size={18} />登録</button></div>
      </form>
    </AppShell>
  );
}
