"use client";

import dynamic from "next/dynamic";

// localStorage を読むため、サーバー側では描画せずブラウザでのみ描画する
const DashboardApp = dynamic(() => import("./DashboardApp"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-green-50" />,
});

export default function DashboardPage() {
  return <DashboardApp />;
}
