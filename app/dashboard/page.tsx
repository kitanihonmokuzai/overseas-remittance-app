import Link from "next/link";
import { Banknote, CalendarClock, Layers, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExportPanel } from "@/components/ExportPanel";
import { canOperate, formatAmount, formatDate, remaining, toNumber } from "@/lib/db";
import {
  getCurrentProfile,
  getForeignDeposits,
  getFxGainLossHistory,
  getFxReservations,
  getRemittanceRequests
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const [requests, deposits, reservations, gainLoss] = await Promise.all([
    getRemittanceRequests(),
    getForeignDeposits(),
    getFxReservations(),
    getFxGainLossHistory()
  ]);

  const pendingApproval = requests.filter((request) => request.status === "承認待ち").length;
  const pendingPayment = requests.filter((request) => request.status === "支払処理待ち").length;

  const now = new Date();
  const inCurrentMonth = (value: string) => {
    const date = new Date(value);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };
  const monthEntries = gainLoss.filter((entry) => inCurrentMonth(entry.created_at));
  const monthGainLoss = monthEntries.reduce((sum, entry) => sum + toNumber(entry.gain_loss_jpy), 0);

  const balanceByCurrency = new Map<string, number>();
  deposits.forEach((deposit) => {
    balanceByCurrency.set(deposit.currency, (balanceByCurrency.get(deposit.currency) ?? 0) + toNumber(deposit.balance));
  });

  const reservationRemainingByCurrency = new Map<string, number>();
  reservations.forEach((reservation) => {
    reservationRemainingByCurrency.set(
      reservation.currency,
      (reservationRemainingByCurrency.get(reservation.currency) ?? 0) + remaining(reservation)
    );
  });

  return (
    <AppShell title="ダッシュボード" description="承認状況・外貨残高・為替予約・当月の為替差損益を一画面で確認できます。" role={profile.role}>
      <section className="stat-grid">
        <div className="stat-card">
          <span><CalendarClock size={15} />承認待ち</span>
          <b>{pendingApproval}<small>件</small></b>
        </div>
        <div className="stat-card">
          <span><Layers size={15} />支払処理待ち</span>
          <b>{pendingPayment}<small>件</small></b>
        </div>
        <div className="stat-card">
          <span><TrendingUp size={15} />当月の為替差損益</span>
          <b className={monthGainLoss >= 0 ? "gain" : "loss"}>{formatAmount(monthGainLoss, "JPY")}</b>
        </div>
        <div className="stat-card">
          <span><Banknote size={15} />外貨預金口座</span>
          <b>{deposits.length}<small>口座</small></b>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>外貨預金残高</h2><span>通貨別合計あり</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>銀行</th><th>通貨</th><th>残高</th></tr></thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr><td colSpan={3}>口座が登録されていません。</td></tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>{deposit.bank}</td>
                    <td>{deposit.currency}</td>
                    <td>{formatAmount(deposit.balance, deposit.currency)}</td>
                  </tr>
                ))
              )}
              {[...balanceByCurrency.entries()].map(([currency, total]) => (
                <tr key={`total-${currency}`}>
                  <td><strong>合計</strong></td>
                  <td><strong>{currency}</strong></td>
                  <td><strong>{formatAmount(total, currency)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>為替予約 残額</h2><span>予約 − 使用済</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>予約番号</th><th>銀行</th><th>通貨</th><th>予約額</th><th>使用済</th><th>残額</th></tr></thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={6}>予約が登録されていません。</td></tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.reservation_no}</td>
                    <td>{reservation.bank}</td>
                    <td>{reservation.currency}</td>
                    <td>{formatAmount(reservation.original_amount, reservation.currency)}</td>
                    <td>{formatAmount(reservation.used_amount, reservation.currency)}</td>
                    <td>{formatAmount(remaining(reservation), reservation.currency)}</td>
                  </tr>
                ))
              )}
              {[...reservationRemainingByCurrency.entries()].map(([currency, total]) => (
                <tr key={`res-${currency}`}>
                  <td colSpan={2}><strong>残額合計</strong></td>
                  <td><strong>{currency}</strong></td>
                  <td colSpan={2} />
                  <td><strong>{formatAmount(total, currency)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>当月の為替差損益</h2>
          <span>合計 {formatAmount(monthGainLoss, "JPY")}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>処理日</th><th>受取人</th><th>通貨</th><th>外貨金額</th><th>差損益</th></tr></thead>
            <tbody>
              {monthEntries.length === 0 ? (
                <tr><td colSpan={5}>当月の実現差損益はまだありません。</td></tr>
              ) : (
                monthEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.created_at)}</td>
                    <td>{entry.payee_name}</td>
                    <td>{entry.currency}</td>
                    <td>{formatAmount(entry.foreign_amount, entry.currency)}</td>
                    <td><span className={toNumber(entry.gain_loss_jpy) >= 0 ? "gain" : "loss"}>{formatAmount(entry.gain_loss_jpy, "JPY")}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canOperate(profile.role) ? (
        <section className="panel">
          <div className="panel-head"><h2>月次CSVエクスポート</h2><span>会計用</span></div>
          <div className="export-body">
            <ExportPanel />
            <p className="save-note">対象月を選んで、為替差損益・送金実績のCSVをダウンロードできます（UTF-8 / Excel対応）。</p>
          </div>
        </section>
      ) : null}

      <p className="empty">各明細は <Link href="/history">履歴</Link> ・ <Link href="/foreign-deposits">外貨預金</Link> ・ <Link href="/fx-reservations">為替予約</Link> から確認できます。</p>
    </AppShell>
  );
}
