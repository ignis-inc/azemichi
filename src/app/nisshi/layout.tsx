import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /nisshi は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "農作業日誌（無料・ログイン不要）",
  description:
    "日々の作業内容や天候をスマホで記録し、圃場・作物・作業内容ごとに確認できる無料ツールです。データはこの端末だけに保存されます。CSVファイルへの書き出し・読み込みでバックアップや機種変更にも対応します。",
  path: "/nisshi",
});

export default function NisshiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
