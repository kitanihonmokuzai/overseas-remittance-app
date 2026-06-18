import Link from "next/link";
import { Banknote, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { canOperate, formatAmount, formatRate } from "@/lib/db";
import { getCurrentProfile, getForeignDepositLots, getForeignDeposits } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ForeignDepositsPage() {
  const deposits = await getForeignDeposits();
  const lots = await getForeignDepositLots();
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
      <section className="panel history-section">
        <div className="panel-head"><h2>売上入金内訳</h2><span>{lots.length}件</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>入金日</th><th>入金元</th><th>銀行</th><th>通貨</th><th>入金額</th><th>残高</th><th>入金時レート</th><th>備考</th></tr></thead>
            <tbody>
              {lots.length === 0 ? <tr><td colSpan={8}>売上入金の内訳はまだありません。</td></tr> : lots.map((lot) => (
                <tr key={lot.id}>
                  <td>{new Date(lot.received_date).toLocaleDateString("ja-JP")}</td>
                  <td>{lot.payer_name}</td>
                  <td>{lot.bank}</td>
                  <td>{lot.currency}</td>
                  <td>{formatAmount(lot.original_amount, lot.currency)}</td>
                  <td>{formatAmount(lot.remaining_amount, lot.currency)}</td>
                  <td>{formatRate(lot.receipt_rate)}</td>
                  <td>{lot.memo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
