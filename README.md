# Overseas Remittance App

Neon Postgresを使った海外送金申請Webアプリです。

## Features

- 送金申請フォーム
- 受取人マスタからの自動入力
- 為替予約の一覧・登録
- 外貨預金残高の一覧・入金登録
- 申請、為替予約登録、外貨預金入金の履歴表示
- 支払済登録時の為替予約使用額・外貨預金残高更新

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Neon Postgres
- `@neondatabase/serverless`

## Setup

```bash
npm install
```

Create `.env.local`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require"
```

Apply database schema.

```bash
node scripts/apply-schema.mjs
```

Run locally.

```bash
npm run dev
```

Open:

```text
http://localhost:3000/transfer-request
```

## Pages

- `/transfer-request`
- `/fx-reservations`
- `/fx-reservations/new`
- `/foreign-deposits`
- `/foreign-deposits/deposit`
- `/history`

## Deployment Notes

This app requires a server runtime because it uses Next.js Server Actions and Neon Postgres. GitHub Pages is not suitable for this app as-is. Use Vercel, Render, Railway, or another Node.js-capable hosting service connected to the GitHub repository.

Set `DATABASE_URL` as a secret environment variable in the hosting service. Do not commit `.env.local`.

## File Uploads

PDF file body storage is intentionally not implemented yet. The current app stores file-name metadata only. Use S3, Cloudflare R2, Vercel Blob, or another object storage service for PDF bodies, and store the object key in `remittance_files.storage_key`.
