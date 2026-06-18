import Link from "next/link";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { createDepositTransaction } from "@/lib/actions";
import { formatAmount } from "@/lib/db";
import { getForeignDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DepositTransactionPage() {
  const deposits = await getForeignDeposits();

  return (
    <AppShell title="外貨預金 入金登録" description="外貨預金口座への入金を登録します。" action={<Link className="secondary" href="/foreign-deposits">一覧へ戻る</Link>}>
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
          <label>入金額<input min="1" name="amount" required type="number" /></label>
          <label className="full">備考<input name="memo" /></label>
        </div>
        <div className="actions">
          <SubmitButton
            className="primary"
            icon={<Save size={18} />}
            notice="外貨預金口座の残高を更新しています。"
            pendingLabel="入金登録中..."
          >
            入金登録
          </SubmitButton>
        </div>
      </form>
    </AppShell>
  );
}
