import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { approveRequest, markRequestPaid } from "@/lib/actions";
import { canOperate, formatAmount, formatDate, statusClass } from "@/lib/db";
import { getCurrentProfile, getRemittanceRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/history");
  }

  const requests = await getRemittanceRequests();
  const pendingApproval = requests.filter((request) => request.status === "承認待ち");
  const pendingPayment = requests.filter((request) => request.status === "支払処理待ち");
  const completed = requests.filter((request) => request.status === "完了").slice(0, 10);

  function allocationSummary(request: (typeof requests)[number]) {
    return request.remittance_settlement_allocations?.length
      ? request.remittance_settlement_allocations
          .map((allocation) => `${allocation.method} ${formatAmount(allocation.amount, request.currency)}`)
          .join(" / ")
      : request.settlement_method ?? "-";
  }

  return (
    <AppShell
      title="承認・支払管理"
      description="申請の承認と支払処理をこの画面で行います。承認待ち → 支払処理待ち → 完了の順に進みます。"
      role={profile.role}
    >
      <section className="panel history-section">
        <div className="panel-head">
          <h2>承認待ち</h2>
          <span>{pendingApproval.length}件</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>送金日</th><th>受取人</th><th>金額</th><th>決済方法</th><th>添付</th><th>承認</th></tr>
            </thead>
            <tbody>
              {pendingApproval.length === 0 ? (
                <tr><td colSpan={6}>承認待ちの申請はありません。</td></tr>
              ) : (
                pendingApproval.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.remittance_date)}</td>
                    <td>{request.payee_name}</td>
                    <td>{formatAmount(request.amount, request.currency)}</td>
                    <td>{allocationSummary(request)}</td>
                    <td>{request.file_count}件</td>
                    <td>
                      <div className="row-actions">
                        <Link className="secondary small" href={`/approvals/${request.id}`}>詳細</Link>
                        <form action={approveRequest}>
                          <input name="request_id" type="hidden" value={request.id} />
                          <SubmitButton className="primary small" icon={<CheckCircle2 size={16} />} notice="承認しています。" pendingLabel="承認中...">
                            承認する
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel history-section">
        <div className="panel-head">
          <h2>支払処理待ち</h2>
          <span>{pendingPayment.length}件</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>送金日</th><th>受取人</th><th>金額</th><th>決済方法</th><th>添付</th><th>支払処理</th></tr>
            </thead>
            <tbody>
              {pendingPayment.length === 0 ? (
                <tr><td colSpan={6}>支払処理待ちの申請はありません。</td></tr>
              ) : (
                pendingPayment.map((request) => (
                  <tr key={request.id}>
                    <td>{formatDate(request.remittance_date)}</td>
                    <td>{request.payee_name}</td>
                    <td>{formatAmount(request.amount, request.currency)}</td>
                    <td>{allocationSummary(request)}</td>
                    <td>{request.file_count}件</td>
                    <td>
                      <div className="row-actions">
                        <Link className="secondary small" href={`/approvals/${request.id}`}>詳細</Link>
                        <form action={markRequestPaid}>
                          <input name="request_id" type="hidden" value={request.id} />
                          <SubmitButton className="primary small" icon={<Wallet size={16} />} notice="残高と為替差損益を更新しています。" pendingLabel="支払処理中...">
                            支払処理
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel history-section">
        <div className="panel-head">
          <h2>完了（直近）</h2>
          <span>{completed.length}件</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ステータス</th><th>送金日</th><th>受取人</th><th>金額</th><th>決済方法</th><th>詳細</th></tr>
            </thead>
            <tbody>
              {completed.length === 0 ? (
                <tr><td colSpan={6}>完了した申請はまだありません。</td></tr>
              ) : (
                completed.map((request) => (
                  <tr key={request.id}>
                    <td><span className={`status ${statusClass(request.status)}`}>{request.status}</span></td>
                    <td>{formatDate(request.remittance_date)}</td>
                    <td>{request.payee_name}</td>
                    <td>{formatAmount(request.amount, request.currency)}</td>
                    <td>{allocationSummary(request)}</td>
                    <td><Link className="secondary small" href={`/approvals/${request.id}`}>詳細</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
