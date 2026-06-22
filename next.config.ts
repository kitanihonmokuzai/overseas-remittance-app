import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      // 添付PDFはサーバーアクション経由でアップロードするため上限を引き上げる。
      // Vercel のリクエスト上限（約4.5MB）未満に収める。
      bodySizeLimit: "4mb"
    }
  }
};

export default nextConfig;
