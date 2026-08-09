"use client";

import dynamic from "next/dynamic";
import AuthBar from "../components/AuthBar";

// localStorage を読むため、サーバー側では描画せずブラウザでのみ描画する
const NisshiApp = dynamic(() => import("./NisshiApp"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-green-50" />,
});

export default function NisshiPage() {
  return (
    <>
      <AuthBar />
      <NisshiApp />
    </>
  );
}
