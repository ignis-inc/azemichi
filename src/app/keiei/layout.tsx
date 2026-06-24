import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /keiei は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "経営所得安定対策の交付申請書をPDFで作成",
  description:
    "経営所得安定対策（補助金）の「交付金交付申請書（様式第1号A）」を、入力するだけでPDFにできます。無料・登録不要の書類作成補助ツールです。",
  path: "/keiei",
});

export default function KeieiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
