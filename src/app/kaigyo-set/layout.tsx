import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kaigyo-set は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "開業時にまとめて書類を作成（無料・ログイン不要）",
  description:
    "農業を新しく始めるときによく一緒に提出される、開業届・青色申告承認申請書・専従者給与の届出書を、共通する情報の入力は1回だけでまとめてPDFにできる無料ツールです。",
  path: "/kaigyo-set",
});

export default function KaigyoSetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
