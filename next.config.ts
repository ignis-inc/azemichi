import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 旧理念ページ /about はランディングの「想い」セクションに統合済み
      { source: "/about", destination: "/#omoi", permanent: false },
    ];
  },
};

export default nextConfig;
