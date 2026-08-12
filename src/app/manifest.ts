import type { MetadataRoute } from "next";
import { SITE_NAME } from "./site";

// Web App Manifest（/manifest.webmanifest として自動配信される）。
// 検索結果のサイト名や、ホーム画面追加時の名前・アイコン・色に使われる。
// 色はサイトのデザイントークン（globals.css）に合わせる：
//   theme_color = --field #3e6b2a（あぜみちの緑）／ background_color = --paper #fbfbf7
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME, // あぜみち
    short_name: SITE_NAME, // あぜみち
    description:
      "農業の手続き書類を、スマホでかんたんにPDF化できる無料ツール「あぜみち」。登録不要で使えます。",
    lang: "ja",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbf7",
    theme_color: "#3e6b2a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
