import { LoginForms } from "@/components/LoginForms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <main className="login-page">
      <aside className="login-brand">
        <span className="brand-mark large">FX</span>
        <h2>海外送金管理</h2>
        <p>Treasury Console</p>
        <ul className="login-points">
          <li>送金申請から承認・支払まで、一つの台帳で追跡する</li>
          <li>為替予約・外貨預金を明細単位で引き当てる</li>
          <li>支払時に為替差損益を自動で記録する</li>
        </ul>
      </aside>

      <section className="login-panel">
        <div>
          <span className="login-kicker">サインイン</span>
          <h1>ようこそ</h1>
          <p>登録済みのメールアドレスとパスワードでログインしてください。</p>
        </div>

        <LoginForms />
      </section>
    </main>
  );
}
