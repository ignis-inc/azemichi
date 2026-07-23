import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kicho は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "農家の簡易記帳・経費集計（無料・ログイン不要）",
  description:
    "日々の収入・支出をスマホで記録し、月ごと・年ごとに自動で集計できる無料ツールです。データはこの端末だけに保存されます。CSVファイルへの書き出し・読み込みでバックアップや機種変更にも対応します。",
  path: "/kicho",
});

export default function KichoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
