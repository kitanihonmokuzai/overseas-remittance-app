import Link from "next/link";
import { Banknote, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatAmount } from "@/lib/db";
import { getForeignDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ForeignDepositsPage() {
  const deposits = await getForeignDeposits();

  return (
    <AppShell
      title="外貨預金"
      description="外貨預金口座の残高をシンプルに表示します。"
      action={<Link className="primary" href="/foreign-deposits/deposit"><Plus size={18} />入金登録</Link>}
    >
      <section className="deposit-grid">
        {deposits.length === 0 ? <p className="empty">外貨預金口座はまだ登録されていません。</p> : deposits.map((deposit) => (
          <div className="deposit-card" key={deposit.id}>
            <Banknote size={20} />
            <strong>{deposit.bank} / {deposit.currency}</strong>
            <span>{deposit.account_name}</span>
            <b>{formatAmount(deposit.balance, deposit.currency)}</b>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
