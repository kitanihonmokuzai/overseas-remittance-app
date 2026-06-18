"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <section className="error-panel">
        <span className="login-kicker">Application Error</span>
        <h1>画面の読み込みに失敗しました</h1>
        <p>サーバー側の処理でエラーが発生しました。SupabaseのSQL実行、Vercelの環境変数、再デプロイ状況を確認してください。</p>
        {error.digest ? <code>Digest: {error.digest}</code> : null}
        <button className="primary" onClick={reset} type="button">再読み込み</button>
      </section>
    </main>
  );
}
