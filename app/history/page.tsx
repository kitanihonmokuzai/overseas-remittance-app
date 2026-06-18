import { CheckCircle2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteRemittanceRequest, markRequestPaid } from "@/lib/actions";
import { canDeleteHistory, canOperate, formatAmount, formatDate } from "@/lib/db";
import { getCurrentProfile, getDepositTransactions, getFxRegistrationHistory, getRemittanceRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [requests, fxHistory, depositHistory] = await Promise.all([
    getRemittanceRequests(),
    getFxRegistrationHistory(),
    getDepositTransactions()
  ]);
  const profile = await getCurrentProfile();
  const visibleRequests = requests.slice(0, 3);
  const hiddenRequests = requests.slice(3);
  const visibleFxHistory = fxHistory.slice(0, 3);
  const hiddenFxHistory = fxHistory.slice(3);
  const visibleDepositHistory = depositHistory.slice(0, 3);
  const hiddenDepositHistory = depositHistory.slice(3);

  function requestRows(items: typeof requests) {
    return items.map((request) => {
      const allocationSummary = request.remittance_settlement_allocations?.length
        ? request.remittance_settlement_allocations.map((allocation) => `${allocation.method} ${formatAmount(allocation.amount, request.currency)}`).join(" / ")
        : request.settlement_method ?? "-";

      return (
        <tr key={request.id}>
          <td><span className={`status ${request.status === "支払済" ? "paid" : ""}`}>{request.status}</span></td>
          <td>{formatDate(request.remittance_date)}</td>
          <td>{request.payee_name}</td>
          <td>{formatAmount(request.amount, request.currency)}</td>
          <td>{allocationSummary}</td>
          <td>{request.file_count}件</td>
          <td>
            <div className="row-actions">
              {canOperate(profile.role) ? (
                <form action={markRequestPaid}>
                  <input name="request_id" type="hidden" value={request.id} />
                  {request.status === "支払済" ? (
                    <button className="secondary small" disabled type="button"><CheckCircle2 size={16} />支払済</button>
                  ) : (
                    <SubmitButton className="secondary small" icon={<CheckCircle2 size={16} />} notice="残高とステータスを更新しています。" pendingLabel="更新中...">
                      支払済
                    </SubmitButton>
                  )}
                </form>
              ) : null}
              {canDeleteHistory(profile.role) ? (
                <form action={deleteRemittanceRequest}>
                  <input name="request_id" type="hidden" value={request.id} />
                  <SubmitButton className="secondary small danger" icon={<Trash2 size={16} />} notice="履歴を削除しています。" pendingLabel="削除中...">
                    削除
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <AppShell title="履歴" description="過去の申請、為替予約登録、外貨預金入金を一覧で確認します。" role={profile.role}>
      <section className="panel history-section">
        <div className="panel-head"><h2>送金申請履歴</h2><span>{requests.length}件</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ステータス</th><th>送金日</th><th>受取人</th><th>金額</th><th>決済方法</th><th>添付</th><th>操作</th></tr></thead>
            <tbody>
              {requests.length === 0 ? <tr><td colSpan={7}>申請履歴はまだありません。</td></tr> : requestRows(visibleRequests)}
            </tbody>
          </table>
          {hiddenRequests.length > 0 ? (
            <details className="history-more">
              <summary>残り{hiddenRequests.length}件を表示</summary>
              <table><tbody>{requestRows(hiddenRequests)}</tbody></table>
            </details>
          ) : null}
        </div>
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
            <thead><tr><th>登録日時</th><th>銀行</th><th>通貨</th><th>入金額</th><th>備考</th></tr></thead>
            <tbody>{depositHistory.length === 0 ? <tr><td colSpan={5}>入金履歴はまだありません。</td></tr> : visibleDepositHistory.map((item) => (
              <tr key={item.id}><td>{new Date(item.created_at).toLocaleString("ja-JP")}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.memo || "-"}</td></tr>
            ))}</tbody>
          </table>
          {hiddenDepositHistory.length > 0 ? (
            <details className="history-more">
              <summary>残り{hiddenDepositHistory.length}件を表示</summary>
              <table><tbody>{hiddenDepositHistory.map((item) => (
                <tr key={item.id}><td>{new Date(item.created_at).toLocaleString("ja-JP")}</td><td>{item.bank}</td><td>{item.currency}</td><td>{formatAmount(item.amount, item.currency)}</td><td>{item.memo || "-"}</td></tr>
              ))}</tbody></table>
            </details>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
