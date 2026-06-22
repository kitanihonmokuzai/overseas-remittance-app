"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForms() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSigningIn, startSignIn] = useTransition();
  const [isSigningUp, startSignUp] = useTransition();
  const busy = isSigningIn || isSigningUp;

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startSignIn(async () => {
      setMessage("ログイン中です...");
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(`ログインできませんでした: ${error.message}`);
          return;
        }
        setMessage("ログインしました。画面を移動しています...");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "ログイン処理でエラーが発生しました。");
      }
    });
  }

  function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startSignUp(async () => {
      setMessage("アカウントを作成しています...");
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage(`登録できませんでした: ${error.message}`);
          return;
        }
        setMessage("登録しました。確認メールが届く設定の場合はメールをご確認ください。");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "新規登録処理でエラーが発生しました。");
      }
    });
  }

  return (
    <>
      {message ? (
        <div className="login-message" role="status">
          <span className={busy ? "spinner" : "pulse-dot"} aria-hidden="true" />
          {message}
        </div>
      ) : null}

      <form onSubmit={signIn} className="login-form">
        <label>メールアドレス<input autoComplete="email" name="email" required type="email" /></label>
        <label>パスワード<input autoComplete="current-password" name="password" required type="password" /></label>
        <button aria-busy={isSigningIn} className={`primary ${isSigningIn ? "is-pending" : ""}`} disabled={busy} type="submit">
          {isSigningIn ? <span className="spinner" aria-hidden="true" /> : <LogIn size={18} />}
          {isSigningIn ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <form onSubmit={signUp} className="login-form signup-form">
        <p>初回利用者は同じ入力欄でアカウント登録できます。</p>
        <label>メールアドレス<input autoComplete="email" name="email" required type="email" /></label>
        <label>パスワード<input autoComplete="new-password" minLength={6} name="password" required type="password" /></label>
        <button aria-busy={isSigningUp} className={`secondary ${isSigningUp ? "is-pending" : ""}`} disabled={busy} type="submit">
          {isSigningUp ? <span className="spinner" aria-hidden="true" /> : <UserPlus size={18} />}
          {isSigningUp ? "登録中..." : "新規登録"}
        </button>
      </form>
    </>
  );
}
