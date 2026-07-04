import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 対応ブラウザには軽いAVIF、それ以外はWebPを自動配信。
    // 画像を実写に差し替えても、この最適化は自動で効き続ける
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // 旧理念ページ /about はランディングの「想い」セクションに統合済み
      { source: "/about", destination: "/#omoi", permanent: false },
    ];
  },
};

export default nextConfig;
