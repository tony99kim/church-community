import type { NextConfig } from "next";

const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://churchhub-backend.fly.dev")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  // API 를 프론트와 같은 도메인으로 프록시 (lib/config.ts 참고)
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_ORIGIN}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
