import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kome-label は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "お米のラベルづくり（無料・ログイン不要）",
  description:
    "袋詰めしたお米（玄米・精米）の、表のデザイン面と裏の一括表示のラベルを無料で作れます。A4シール用紙向けのPDFと、コンビニのシール紙向けの画像に対応。入力内容やロゴ・写真は、この端末の中だけで扱います。",
  path: "/kome-label",
});

export default function KomeLabelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
