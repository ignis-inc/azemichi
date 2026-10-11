"use client";

import dynamic from "next/dynamic";

// localStorage を読むため、サーバー側では描画せずブラウザでのみ描画する
const TedoriApp = dynamic(() => import("./TedoriApp"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-green-50" />,
});

export default function TedoriPage() {
  return <TedoriApp />;
}
