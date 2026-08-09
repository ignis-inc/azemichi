"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import AuthBar from "../../components/AuthBar";

// localStorage を読むため、サーバー側では描画せずブラウザでのみ描画する
const NisshiApp = dynamic(() => import("../../nisshi/NisshiApp"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-green-50" />,
});
// 無料版のlocalStorageを読むため、こちらもブラウザでのみ描画する
const MigrationBanner = dynamic(() => import("../../components/MigrationBanner"), {
  ssr: false,
});

export default function NisshiLoginPage() {
  // 無料版データの取り込み後に、クラウドの最新データを読み直させるためのカウンター
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <>
      <AuthBar />
      <MigrationBanner
        tool="nisshi"
        localKey="azemichi-nisshi-v1"
        onImported={() => setReloadKey((k) => k + 1)}
      />
      <NisshiApp cloud={{ reloadKey }} />
    </>
  );
}
