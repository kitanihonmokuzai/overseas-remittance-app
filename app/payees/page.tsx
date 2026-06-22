import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { canOperate } from "@/lib/db";
import { getCurrentProfile, getPayees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PayeesPage() {
  const profile = await getCurrentProfile();
  if (!canOperate(profile.role)) {
    redirect("/dashboard");
  }
  const payees = await getPayees();

  return (
    <AppShell title="受取人マスタ" description="送金先の登録・編集を行います。" role={profile.role}>
      <section className="panel">
        <div className="panel-head">
          <h2>受取人一覧</h2>
          <Link className="primary small" href="/payees/new"><Plus size={15} />新規追加</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>登録名称</th><th>通貨</th><th>銀行</th><th>SWIFT</th><th>国</th><th>編集</th></tr></thead>
            <tbody>
              {payees.length === 0 ? (
                <tr><td colSpan={6}>受取人が登録されていません。</td></tr>
              ) : (
                payees.map((payee) => (
                  <tr key={payee.id}>
                    <td>{payee.name}</td>
                    <td>{payee.default_currency}</td>
                    <td>{payee.bank_name || "-"}</td>
                    <td>{payee.swift || "-"}</td>
                    <td>{payee.country || "-"}</td>
                    <td><Link className="secondary small" href={`/payees/${payee.id}/edit`}><Pencil size={15} />編集</Link></td>
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
