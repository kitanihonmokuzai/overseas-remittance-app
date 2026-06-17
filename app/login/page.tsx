import { redirect } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { signIn, signUp } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/transfer-request");
  }

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
          <button className="primary" type="submit"><LogIn size={18} />ログイン</button>
        </form>

        <form action={signUp} className="login-form signup-form">
          <p>初回利用者は同じ入力欄でアカウント登録できます。</p>
          <label>メールアドレス<input autoComplete="email" name="email" required type="email" /></label>
          <label>パスワード<input autoComplete="new-password" minLength={6} name="password" required type="password" /></label>
          <button className="secondary" type="submit"><UserPlus size={18} />新規登録</button>
        </form>
      </section>
    </main>
  );
}
