import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /higai は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "被害記録シート（無料・ログイン不要）",
  description:
    "台風・大雨・獣害などの被害をスマホで記録できる無料ツールです。発生日・対象の作物やほ場・被害の種類などを記録し、期間を指定して「被害記録一覧」としてPDFに出力できます。データはこの端末だけに保存されます。正式なり災証明・共済金請求とは異なります。",
  path: "/higai",
});

export default function HigaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
