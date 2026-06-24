import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /aoiro は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "青色申告承認申請書をPDFで作成",
  description:
    "青色申告をはじめるときの「所得税の青色申告承認申請書」を、入力するだけでPDFにできます。無料・登録不要。提出の可否は提出先の窓口や専門家にご確認ください。",
  path: "/aoiro",
});

export default function AoiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
