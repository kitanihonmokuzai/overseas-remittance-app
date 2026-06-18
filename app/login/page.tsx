import { LoginForms } from "@/components/LoginForms";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div>
          <span className="login-kicker">Supabase Auth</span>
          <h1>海外送金申請</h1>
          <p>登録済みのメールアドレスとパスワードでログインしてください。</p>
        </div>

        <LoginForms />
      </section>
    </main>
  );
}
