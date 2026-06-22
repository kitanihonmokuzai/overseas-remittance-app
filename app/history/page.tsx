import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteRemittanceRequest } from "@/lib/actions";
import { canDeleteHistory, formatAmount, formatDate, formatRate, statusClass } from "@/lib/db";
import {
  getCurrentProfile,
  getDepositTransactions,
  getFxGainLossHistory,
  getFxRegistrationHistory,
  getRemittanceRequestsPage
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["承認待ち", "支払処理待ち", "完了", "差戻し"];

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; payee?: string; month?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const status = params.status ?? "";
  const payee = params.payee ?? "";
  const month = params.month ?? "";

  const [requestPage, fxHistory, depositHistory, gainLossHistory, profile] = await Promise.all([
    getRemittanceRequestsPage({ status, payee, month, page }),
    getFxRegistrationHistory(),
    getDepositTransactions(),
    getFxGainLossHistory(),
    getCurrentProfile()
  ]);

  const requests = requestPage.rows;
  const totalPages = Math.max(1, Math.ceil(requestPage.total / requestPage.pageSize));
  const visibleFxHistory = fxHistory.slice(0, 3);
  const hiddenFxHistory = fxHistory.slice(3);
  const visibleDepositHistory = depositHistory.slice(0, 3);
  const hiddenDepositHistory = depositHistory.slice(3);
  const visibleGainLossHistory = gainLossHistory.slice(0, 3);
  const hiddenGainLossHistory = gainLossHistory.slice(3);

  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (payee) query.set("payee", payee);
    if (month) query.set("month", month);
    query.set("page", String(targetPage));
    return `/history?${query.toString()}`;
  }

  return (
    <AppShell title="履歴" description="過去の申請、為替予約登録、外貨預金入金を一覧で確認します。" role={profile.role}>
      <section className="panel history-section">
        <div className="panel-head"><h2>送金申請履歴</h2><span>{requestPage.total}件</span></div>

        <form className="filter-bar" method="get">
          <label>
            ステータス
            <select name="status" defaultValue={status}>
              <option value="">すべて</option>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>受取人<input name="payee" defaultValue={payee} placeholder="名称の一部" /></label>
          <label>送金月<input name="month" type="month" defaultValue={month} /></label>
          <button className="secondary small" type="submit">絞り込み</button>
          <Link className="secondary small" href="/history">クリア</Link>
        </form>

        <div className="table-wrap">
          <table>
            <thead><tr><th>ステータス</th><th>送金日</th><th>受取人</th><th>金額</th><th>決済方法</th><th>添付</th><th>操作</th></tr></thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={7}>該当する申請はありません。</td></tr>
              ) : (
                requests.map((request) => {
                  const allocationSummary = request.remittance_settlement_allocations?.length
                    ? request.remittance_settlement_allocations.map((allocation) => `${allocation.method} ${formatAmount(allocation.amount, request.currency)}`).join(" / ")
                    : request.settlement_method ?? "-";
                  const canResubmit = request.status === "差戻し" && request.created_by === profile.id;

                  return (
                    <tr key={request.id}>
                      <td><span className={`status ${statusClass(request.status)}`}>{request.status}</span></td>
                      <td>{formatDate(request.remittance_date)}</td>
                      <td>{request.payee_name}</td>
                      <td>{formatAmount(request.amount, request.currency)}</td>
                      <td>{allocationSummary}{request.status === "差戻し" && request.reject_reason ? <div className="reject-note">差戻し理由：{request.reject_reason}</div> : null}</td>
                      <td>{request.file_count}件</td>
                      <td>
                        <div className="row-actions">
                          {canResubmit ? (
                            <Link className="secondary small" href={`/transfer-request/${request.id}/edit`}><Pencil size={15} />修正・再申請</Link>
                          ) : null}
                          {canDeleteHistory(profile.role) ? (
                            <form action={deleteRemittanceRequest}>
                              <input name="request_id" type="hidden" value={request.id} />
                              <SubmitButton className="secondary small danger" icon={<Trash2 size={16} />} notice="履歴を削除しています。" pendingLabel="削除中...">
                                削除
                              </SubmitButton>
                            </form>
                          ) : null}
                          {!canResubmit && !canDeleteHistory(profile.role) ? <span className="empty">-</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="pager">
            {page > 1 ? <Link className="secondary small" href={pageHref(page - 1)}>前へ</Link> : <span className="secondary small disabled">前へ</span>}
            <span className="pager-info">{page} / {totalPages}</span>
            {page < totalPages ? <Link className="secondary small" href={pageHref(page + 1)}>次へ</Link> : <span className="secondary small disabled">次へ</span>}
          </div>
        ) : null}
      </section>

      <section className="panel history-section">
        <div className="panel-head"><h2>為替予約登録履歴</h2><span>{fxHistory.length}件</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>登録日時</th><th>予約No</th><th>銀行</th><th>通貨</th><th>予約額</th><th>レート</th></tr></thead>
            <tbody>{fxHistory.length === 0 ? <tr><td colSpan={6}>登録履歴はまだありません。</td></tr> : visibleFxHistory.map((item) => (
              <tr key={item.id}><td>{new Date(item.created_at).toLocaleString("ja-JP")}</td><td>{item.reservation_no}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.rate}</td></tr>
            ))}</tbody>
          </table>
          {hiddenFxHistory.length > 0 ? (
            <details className="history-more">
              <summary>残り{hiddenFxHistory.length}件を表示</summary>
              <table><tbody>{hiddenFxHistory.map((item) => (
                <tr key={item.id}><td>{new Date(item.created_at).toLocaleString("ja-JP")}</td><td>{item.reservation_no}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.rate}</td></tr>
              ))}</tbody></table>
            </details>
          ) : null}
        </div>
      </section>

      <section className="panel history-section">
        <div className="panel-head"><h2>外貨預金入金履歴</h2><span>{depositHistory.length}件</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>入金日</th><th>入金元</th><th>銀行</th><th>通貨</th><th>入金額</th><th>入金時レート</th><th>備考</th></tr></thead>
            <tbody>{depositHistory.length === 0 ? <tr><td colSpan={7}>入金履歴はまだありません。</td></tr> : visibleDepositHistory.map((item) => (
              <tr key={item.id}><td>{item.received_date ? new Date(item.received_date).toLocaleDateString("ja-JP") : new Date(item.created_at).toLocaleDateString("ja-JP")}</td><td>{item.payer_name || "-"}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.receipt_rate ? formatRate(item.receipt_rate) : "-"}</td><td>{item.memo || "-"}</td></tr>
            ))}</tbody>
          </table>
          {hiddenDepositHistory.length > 0 ? (
            <details className="history-more">
              <summary>残り{hiddenDepositHistory.length}件を表示</summary>
              <table><tbody>{hiddenDepositHistory.map((item) => (
                <tr key={item.id}><td>{item.received_date ? new Date(item.received_date).toLocaleDateString("ja-JP") : new Date(item.created_at).toLocaleDateString("ja-JP")}</td><td>{item.payer_name || "-"}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.receipt_rate ? formatRate(item.receipt_rate) : "-"}</td><td>{item.memo || "-"}</td></tr>
              ))}</tbody></table>
            </details>
          ) : null}
        </div>
      </section>

      <section className="panel history-section">
        <div className="panel-head"><h2>為替差損益履歴</h2><span>{gainLossHistory.length}件</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>計上日時</th><th>支払先</th><th>通貨</th><th>使用額</th><th>入金時レート</th><th>支払時レート</th><th>為替差損益</th></tr></thead>
            <tbody>{gainLossHistory.length === 0 ? <tr><td colSpan={7}>為替差損益履歴はまだありません。</td></tr> : visibleGainLossHistory.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.created_at).toLocaleString("ja-JP")}</td>
                <td>{item.payee_name}</td>
                <td>{item.currency}</td>
                <td>{formatAmount(item.foreign_amount, item.currency)}</td>
                <td>{formatRate(item.receipt_rate)}</td>
                <td>{formatRate(item.payment_rate)}</td>
                <td className={Number(item.gain_loss_jpy) >= 0 ? "gain" : "loss"}>{Number(item.gain_loss_jpy).toLocaleString("ja-JP")}円</td>
              </tr>
            ))}</tbody>
          </table>
          {hiddenGainLossHistory.length > 0 ? (
            <details className="history-more">
              <summary>残り{hiddenGainLossHistory.length}件を表示</summary>
              <table><tbody>{hiddenGainLossHistory.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString("ja-JP")}</td>
                  <td>{item.payee_name}</td>
                  <td>{item.currency}</td>
                  <td>{formatAmount(item.foreign_amount, item.currency)}</td>
                  <td>{formatRate(item.receipt_rate)}</td>
                  <td>{formatRate(item.payment_rate)}</td>
                  <td className={Number(item.gain_loss_jpy) >= 0 ? "gain" : "loss"}>{Number(item.gain_loss_jpy).toLocaleString("ja-JP")}円</td>
                </tr>
              ))}</tbody></table>
            </details>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
