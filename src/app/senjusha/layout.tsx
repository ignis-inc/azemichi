import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /senjusha は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "青色事業専従者給与に関する届出書をPDFで作成",
  description:
    "家族を青色事業専従者として雇うときの「青色事業専従者給与に関する届出書」を、入力するだけでPDFにできます。無料・登録不要。記載内容の最終確認はご自身でお願いします。",
  path: "/senjusha",
});

export default function SenjushaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
