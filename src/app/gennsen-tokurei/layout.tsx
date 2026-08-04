import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /gennsen-tokurei は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "源泉所得税の納期の特例の承認に関する申請書をPDFで作成",
  description:
    "常時10人未満の使用人を雇用する事業者向けの「源泉所得税の納期の特例の承認に関する申請書」を、入力するだけでPDFにできます。無料・登録不要。提出の可否は提出先の窓口や専門家にご確認ください。",
  path: "/gennsen-tokurei",
});

export default function GennsenTokureiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
