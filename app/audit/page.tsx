import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { formatAmount, statusClass } from "@/lib/db";
import { getAuditLog, getCurrentProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

function actionStatus(action: string) {
  if (action === "支払処理") return "完了";
  if (action === "承認") return "支払処理待ち";
  if (action === "差戻し") return "差戻し";
  return "承認待ち";
}

export default async function AuditPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    redirect("/history");
  }

  const log = await getAuditLog(150);

  return (
    <AppShell title="監査ログ" description="申請・承認・差戻し・支払処理の操作履歴です（新しい順）。" role={profile.role}>
      <section className="panel">
        <div className="panel-head">
          <h2>操作履歴</h2>
          <span>{log.length}件</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>日時</th><th>操作</th><th>担当者</th><th>受取人</th><th>金額</th><th>メモ</th><th>詳細</th></tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr><td colSpan={7}>記録はまだありません。</td></tr>
              ) : (
                log.map((entry) => {
                  const req = Array.isArray(entry.remittance_requests)
                    ? entry.remittance_requests[0]
                    : entry.remittance_requests;
                  return (
                    <tr key={entry.id}>
                      <td>{new Date(entry.created_at).toLocaleString("ja-JP")}</td>
                      <td><span className={`status ${statusClass(actionStatus(entry.action))}`}>{entry.action}</span></td>
                      <td>{entry.actor_email || "-"}</td>
                      <td>{req?.payee_name ?? "-"}</td>
                      <td>{req ? formatAmount(req.amount, req.currency) : "-"}</td>
                      <td>{entry.note || "-"}</td>
                      <td><Link className="secondary small" href={`/approvals/${entry.request_id}`}>詳細</Link></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
