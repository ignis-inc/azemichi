import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /nouchi は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "農地の取得届出をPDFで作成",
  description:
    "農地を相続・売買したときの「農地法第3条の3第1項の規定による届出書」を、入力するだけでPDFにできます。無料・登録不要の書類作成補助ツールです。",
  path: "/nouchi",
});

export default function NouchiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
