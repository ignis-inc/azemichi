import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /tool は client component のため metadata を export できない。
// この layout（server component）で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "米の販売届出をPDFで作成",
  description:
    "お米を売り始めるときの「米穀の出荷又は販売の事業開始届出書」を、入力するだけでPDFにできます。無料・登録不要。あぜみちは書類作成を補助するツールです。",
  path: "/tool",
});

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
