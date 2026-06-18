import Link from "next/link";
import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { createDepositTransaction } from "@/lib/actions";
import { canOperate, formatAmount } from "@/lib/db";
import { getCurrentProfile, getForeignDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DepositTransactionPage() {
  const deposits = await getForeignDeposits();
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/foreign-deposits");
  }

  return (
    <AppShell title="外貨預金 売上入金登録" description="いつ、どこから、どのレートで入金されたかを記録します。" role={profile.role} action={<Link className="secondary" href="/foreign-deposits">一覧へ戻る</Link>}>
      <form action={createDepositTransaction} className="panel slim-panel">
        <div className="form-grid">
          <label>
            入金口座
            <select name="deposit_id">
              {deposits.map((deposit) => (
                <option key={deposit.id} value={deposit.id}>
                  {deposit.bank} / {deposit.currency} / 現残 {formatAmount(deposit.balance, deposit.currency)}
                </option>
              ))}
            </select>
          </label>
          <label>入金日<input name="received_date" required type="date" /></label>
          <label>入金元<input name="payer_name" placeholder="売上先会社名" required /></label>
          <label>入金額<input min="1" name="amount" required type="number" /></label>
          <label>入金時レート<input min="0" name="receipt_rate" required step="0.0001" type="number" /></label>
          <label className="full">備考<input name="memo" /></label>
        </div>
        <div className="actions">
          <SubmitButton
            className="primary"
            icon={<Save size={18} />}
            notice="売上入金ロットと外貨預金残高を更新しています。"
            pendingLabel="売上入金登録中..."
          >
            売上入金登録
          </SubmitButton>
        </div>
      </form>
    </AppShell>
  );
}
