import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /boujo は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "農薬・肥料の使用記録シート（無料・ログイン不要）",
  description:
    "使用した農薬・肥料をスマホで記録し、圃場・作物ごとに確認できる無料ツールです。同じ農薬を今年何回使ったかも一覧できます。データはこの端末だけに保存されます。CSVファイルへの書き出し・読み込みでバックアップや機種変更にも対応します。",
  path: "/boujo",
});

export default function BoujoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
