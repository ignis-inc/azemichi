import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kome は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "米穀の出荷又は販売の事業開始届出書をPDFで作成",
  description:
    "お米を売り始めるときの「米穀の出荷又は販売の事業開始届出書」を、入力するだけでPDFにできます。無料・登録不要。提出の可否は提出先の農政局にご確認ください。",
  path: "/kome",
});

export default function KomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
