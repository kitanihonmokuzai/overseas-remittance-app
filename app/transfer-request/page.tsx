import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequestForm } from "@/components/RequestForm";
import { getForeignDeposits, getFxReservations, getPayees } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TransferRequestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const [payeesResult, reservationsResult, depositsResult] = await Promise.allSettled([
    getPayees(),
    getFxReservations(),
    getForeignDeposits()
  ]);

  const errors = [
    payeesResult.status === "rejected" ? `受取人マスタ: ${payeesResult.reason instanceof Error ? payeesResult.reason.message : String(payeesResult.reason)}` : null,
    reservationsResult.status === "rejected" ? `為替予約: ${reservationsResult.reason instanceof Error ? reservationsResult.reason.message : String(reservationsResult.reason)}` : null,
    depositsResult.status === "rejected" ? `外貨預金: ${depositsResult.reason instanceof Error ? depositsResult.reason.message : String(depositsResult.reason)}` : null
  ].filter(Boolean);

  if (errors.length > 0) {
    return (
      <AppShell title="送金申請" description="Supabaseから初期データを読み込めませんでした。">
        <section className="panel setup-panel">
          <div className="panel-head">
            <h2>接続設定を確認してください</h2>
            <span>ログインはできていますが、データ取得で止まっています。</span>
          </div>
          <div className="setup-body">
            <p>次のエラーが発生しています。</p>
            <ul>
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
            <p>SupabaseのSQL実行、Vercelの環境変数、再デプロイを確認してください。</p>
          </div>
        </section>
      </AppShell>
    );
  }

  if (
    payeesResult.status !== "fulfilled" ||
    reservationsResult.status !== "fulfilled" ||
    depositsResult.status !== "fulfilled"
  ) {
    throw new Error("Supabaseデータの読み込みに失敗しました。");
  }

  const payees = payeesResult.value;
  const reservations = reservationsResult.value;
  const deposits = depositsResult.value;

  if (payees.length === 0) {
    return (
      <AppShell title="送金申請" description="受取人マスタがまだ登録されていません。">
        <section className="panel setup-panel">
          <div className="panel-head">
            <h2>初期データがありません</h2>
            <span>Supabase SQL Editorで初期SQLを実行してください。</span>
          </div>
          <div className="setup-body">
            <p><code>public.payees</code> に受取人データがないため、申請フォームを表示できません。</p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="送金申請" description="申請フォームのみを表示します。登録後は履歴ページで確認できます。">
      <RequestForm deposits={deposits} payees={payees} reservations={reservations} />
    </AppShell>
  );
}
