import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kaigyo は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "個人事業の開業届をPDFで作成",
  description:
    "農業をはじめるときの「個人事業の開業・廃業等届出書（開業）」を、入力するだけでPDFにできます。無料・登録不要。提出の可否は提出先の窓口や専門家にご確認ください。",
  path: "/kaigyo",
});

export default function KaigyoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
