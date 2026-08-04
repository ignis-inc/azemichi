import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kyuyo-jimusho は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "給与支払事務所等の開設届出書をPDFで作成",
  description:
    "給与を払い始めるときの「給与支払事務所等の開設・移転・廃止届出書」を、入力するだけでPDFにできます。無料・登録不要。提出の可否は提出先の窓口や専門家にご確認ください。",
  path: "/kyuyo-jimusho",
});

export default function KyuyoJimushoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
