import Link from "next/link";
import { Banknote, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { canOperate, formatAmount } from "@/lib/db";
import { getCurrentProfile, getForeignDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ForeignDepositsPage() {
  const deposits = await getForeignDeposits();
  const profile = await getCurrentProfile();

  return (
    <AppShell
      title="外貨預金"
      description="外貨預金口座の残高をシンプルに表示します。"
      role={profile.role}
      action={canOperate(profile.role) ? <Link className="primary" href="/foreign-deposits/deposit"><Plus size={18} />入金登録</Link> : null}
    >
      <section className="deposit-grid">
        {deposits.length === 0 ? <p className="empty">外貨預金口座はまだ登録されていません。</p> : deposits.map((deposit) => (
          <div className="deposit-card" key={deposit.id}>
            <Banknote size={20} />
            <strong>{deposit.bank} / {deposit.currency}</strong>
            <span>{deposit.account_name}</span>
            <b>{formatAmount(deposit.balance, deposit.currency)}</b>
            <small>
              最終使用: {deposit.last_used_at ? new Date(deposit.last_used_at).toLocaleDateString("ja-JP") : "-"}
              {deposit.last_used_amount ? ` / ${formatAmount(deposit.last_used_amount, deposit.currency)}` : ""}
            </small>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
