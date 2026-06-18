# Overseas Remittance App

グループ会社からの海外送金申請、為替予約、外貨預金残高、履歴を管理するNext.js + Supabaseアプリです。

## Features

- メールアドレスとパスワードでログイン
- 送金申請フォーム
- 受取人マスタからの自動入力と手動修正
- PDF添付ファイルの複数アップロード
- 為替予約の銀行別、通貨別一覧
- 外貨預金口座の残高一覧
- 申請、為替予約登録、外貨預金入金の履歴一覧
- 支払済登録時の為替予約使用額、外貨預金残高更新

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase Database
- Supabase Storage

## Local Setup

```bash
npm install
```

`.env.local` を作成します。

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-or-anon-key"
```

Supabase DashboardのSQL Editorで `supabase/schema.sql` を実行します。

既存環境を更新する場合は、続けて以下もSQL Editorで実行します。

```text
supabase/20260618_roles_allocations.sql
supabase/20260618_fx_gain_loss.sql
```

その後、開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで開きます。

```text
http://localhost:3000/login
```

## Supabase Setup

1. Supabase Dashboardでプロジェクトを開きます。
2. SQL Editorを開きます。
3. `supabase/schema.sql` の内容を貼り付けて実行します。
4. Authentication > Providers > Email を確認し、Emailログインを有効にします。
5. Authentication > URL Configuration で、本番URLを使う場合はSite URLとRedirect URLsを設定します。
6. Storageに `remittance-files` バケットが作られていることを確認します。

## Pages

- `/login`
- `/transfer-request`
- `/fx-reservations`
- `/fx-reservations/new`
- `/foreign-deposits`
- `/foreign-deposits/deposit`
- `/history`

## Deployment Notes

このアプリはNext.js Server Actionsを使うため、GitHub PagesではなくVercelなどのNode.js対応ホスティングにデプロイしてください。

Vercelには以下の環境変数を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`.env.local` はGitHubへコミットしないでください。
