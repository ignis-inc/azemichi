import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /nenkin は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "農業者年金の加入申込書をPDFで作成",
  description:
    "農業者年金に加入するときの「通常加入申込書（様式第1号）」を、入力するだけでPDFにできます。無料・登録不要。記載内容の最終確認はご自身でお願いします。",
  path: "/nenkin",
});

export default function NenkinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
