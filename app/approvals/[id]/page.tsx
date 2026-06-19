import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, RotateCcw, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SubmitButton } from "@/components/SubmitButton";
import { approveRequest, markRequestPaid, rejectRequest } from "@/lib/actions";
import { canOperate, formatAmount, formatDate, formatRate, statusClass } from "@/lib/db";
import { getCurrentProfile, getRemittanceRequestById } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value && value.length > 0 ? value : "-"}</strong>
    </div>
  );
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/history");
  }

  const request = await getRemittanceRequestById(id);
  if (!request) {
    notFound();
  }

  const b = request.beneficiary ?? {};
  const allocations = request.remittance_settlement_allocations ?? [];

  return (
    <AppShell
      title="申請詳細"
      description="申請内容を確認し、承認・差戻し・支払処理を行います。"
      role={profile.role}
      action={<Link className="secondary" href="/approvals">承認・支払へ戻る</Link>}
    >
      <section className="panel request-document">
        <div className="document-title">
          <h2>{request.payee_name}</h2>
          <span className={`status ${statusClass(request.status)}`}>{request.status}</span>
        </div>

        {request.status === "差戻し" && request.reject_reason ? (
          <div className="form-alert" style={{ margin: "16px 22px 0" }}>
            差戻し理由：{request.reject_reason}
          </div>
        ) : null}

        <section className="document-section">
          <h3>基本情報</h3>
          <div className="detail-grid">
            <Field label="送金日" value={formatDate(request.remittance_date)} />
            <Field label="受取人" value={request.payee_name} />
            <Field label="金額" value={formatAmount(request.amount, request.currency)} />
            <Field label="通貨" value={request.currency} />
            <Field label="申請日時" value={new Date(request.created_at).toLocaleString("ja-JP")} />
            <Field label="備考" value={request.memo} />
          </div>
        </section>

        <section className="document-section">
          <h3>決済明細</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>決済方法</th><th>金額</th><th>支払時レート</th></tr></thead>
              <tbody>
                {allocations.length === 0 ? (
                  <tr><td colSpan={3}>決済明細がありません。</td></tr>
                ) : (
                  allocations.map((allocation) => (
                    <tr key={allocation.id}>
                      <td>{allocation.method}</td>
                      <td>{formatAmount(allocation.amount, request.currency)}</td>
                      <td>{allocation.payment_rate ? formatRate(allocation.payment_rate) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="document-section">
          <h3>受取人情報</h3>
          <div className="detail-grid">
            <Field label="銀行名" value={b.bankName} />
            <Field label="支店名" value={b.branchName} />
            <Field label="口座番号 / IBAN" value={b.accountNo} />
            <Field label="口座名義" value={b.accountName} />
            <Field label="SWIFT" value={b.swift} />
            <Field label="国" value={b.country} />
            <Field label="住所" value={b.address} />
          </div>
        </section>

        <section className="document-section">
          <h3>受取銀行・船積情報</h3>
          <div className="detail-grid">
            <Field label="受取銀行 国" value={b.bankCountry} />
            <Field label="受取銀行 都市" value={b.bankCity} />
            <Field label="受取銀行 通り・番地" value={b.bankStreet} />
            <Field label="受取銀行 郵便番号" value={b.bankPostal} />
            <Field label="原産地" value={b.origin} />
            <Field label="船積地 国" value={b.shippingCountry} />
            <Field label="船積地 都市" value={b.shippingCity} />
            <Field label="手数料負担区分" value={b.chargeBearer} />
          </div>
        </section>

        <section className="document-section">
          <h3>添付ファイル</h3>
          {request.remittance_files && request.remittance_files.length > 0 ? (
            <ul className="file-list">
              {request.remittance_files.map((file) => (
                <li key={file.id}>{file.file_name}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">添付はありません。</p>
          )}
        </section>

        {request.status === "承認待ち" ? (
          <section className="document-section">
            <h3>承認 / 差戻し</h3>
            <div className="actions" style={{ justifyContent: "flex-start" }}>
              <form action={approveRequest}>
                <input name="request_id" type="hidden" value={request.id} />
                <SubmitButton className="primary" icon={<CheckCircle2 size={18} />} notice="承認しています。" pendingLabel="承認中...">
                  承認する
                </SubmitButton>
              </form>
            </div>
            <form action={rejectRequest} className="reject-form">
              <input name="request_id" type="hidden" value={request.id} />
              <label className="memo">
                差戻し理由
                <textarea name="reason" placeholder="修正してほしい点を記入してください" required />
              </label>
              <div className="actions" style={{ justifyContent: "flex-start" }}>
                <SubmitButton className="secondary danger" icon={<RotateCcw size={18} />} notice="差し戻しています。" pendingLabel="差戻し中...">
                  差し戻す
                </SubmitButton>
              </div>
            </form>
          </section>
        ) : null}

        {request.status === "支払処理待ち" ? (
          <section className="document-section">
            <h3>支払処理</h3>
            <form action={markRequestPaid}>
              <input name="request_id" type="hidden" value={request.id} />
              <div className="actions" style={{ justifyContent: "flex-start" }}>
                <SubmitButton className="primary" icon={<Wallet size={18} />} notice="残高と為替差損益を更新しています。" pendingLabel="支払処理中...">
                  支払処理
                </SubmitButton>
              </div>
            </form>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
