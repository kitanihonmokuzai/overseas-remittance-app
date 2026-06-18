import { LogIn, UserPlus } from "lucide-react";
import { signIn, signUp } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";

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

        <form action={signIn} className="login-form">
          <label>メールアドレス<input autoComplete="email" name="email" required type="email" /></label>
          <label>パスワード<input autoComplete="current-password" name="password" required type="password" /></label>
          <SubmitButton
            className="primary"
            icon={<LogIn size={18} />}
            notice="認証しています。画面が切り替わるまでお待ちください。"
            pendingLabel="ログイン中..."
          >
            ログイン
          </SubmitButton>
        </form>

        <form action={signUp} className="login-form signup-form">
          <p>初回利用者は同じ入力欄でアカウント登録できます。</p>
          <label>メールアドレス<input autoComplete="email" name="email" required type="email" /></label>
          <label>パスワード<input autoComplete="new-password" minLength={6} name="password" required type="password" /></label>
          <SubmitButton
            className="secondary"
            icon={<UserPlus size={18} />}
            notice="アカウントを作成しています。確認メールが必要な設定の場合はメールをご確認ください。"
            pendingLabel="登録中..."
          >
            新規登録
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
