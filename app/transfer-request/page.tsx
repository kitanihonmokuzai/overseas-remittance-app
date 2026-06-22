import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequestForm } from "@/components/RequestForm";
import { getAvailableForeignDepositLots, getCurrentProfile, getForeignDeposits, getFxReservations, getPayees } from "@/lib/queries";
import { createClient, getSupabaseConfigIssue } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TransferRequestPage() {
  const configIssue = getSupabaseConfigIssue();
  if (configIssue) {
    return (
      <main className="login-page">
        <section className="error-panel">
          <span className="login-kicker">Setup Required</span>
          <h1>Vercelの環境変数を確認してください</h1>
          <p>{configIssue}</p>
          <p>VercelのProject SettingsでProduction環境に設定し、Redeployしてください。</p>
        </section>
      </main>
    );
  }

  let data;
  let error;

  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    data = result.data;
    error = result.error;
  } catch (caught) {
    return (
      <main className="login-page">
        <section className="error-panel">
          <span className="login-kicker">Setup Required</span>
          <h1>Supabase接続を確認してください</h1>
          <p>{caught instanceof Error ? caught.message : "Supabaseクライアントの作成に失敗しました。"}</p>
          <p>Vercelの環境変数と再デプロイ状況を確認してください。</p>
        </section>
      </main>
    );
  }

  if (error || !data.user) {
    redirect("/login");
  }

  const [payeesResult, reservationsResult, depositsResult, lotsResult] = await Promise.allSettled([
    getPayees(),
    getFxReservations(),
    getForeignDeposits(),
    getAvailableForeignDepositLots()
  ]);
  const profile = await getCurrentProfile();

  const errors = [
    payeesResult.status === "rejected" ? `受取人マスタ: ${payeesResult.reason instanceof Error ? payeesResult.reason.message : String(payeesResult.reason)}` : null,
    reservationsResult.status === "rejected" ? `為替予約: ${reservationsResult.reason instanceof Error ? reservationsResult.reason.message : String(reservationsResult.reason)}` : null,
    depositsResult.status === "rejected" ? `外貨預金: ${depositsResult.reason instanceof Error ? depositsResult.reason.message : String(depositsResult.reason)}` : null,
    lotsResult.status === "rejected" ? `売上入金内訳: ${lotsResult.reason instanceof Error ? lotsResult.reason.message : String(lotsResult.reason)}` : null
  ].filter(Boolean);

  if (errors.length > 0) {
    return (
      <AppShell title="送金申請" description="Supabaseから初期データを読み込めませんでした。" role={profile.role}>
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
    depositsResult.status !== "fulfilled" ||
    lotsResult.status !== "fulfilled"
  ) {
    throw new Error("Supabaseデータの読み込みに失敗しました。");
  }

  const payees = payeesResult.value;
  const reservations = reservationsResult.value;
  const deposits = depositsResult.value;
  const lots = lotsResult.value;

  if (payees.length === 0) {
    return (
      <AppShell title="送金申請" description="受取人マスタがまだ登録されていません。" role={profile.role}>
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
    <AppShell title="送金申請" description="申請フォームのみを表示します。登録後は履歴ページで確認できます。" role={profile.role}>
      <RequestForm deposits={deposits} lots={lots} payees={payees} reservations={reservations} userId={data.user.id} />
    </AppShell>
  );
}
