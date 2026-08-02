import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /dashboard は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "作った書類の一覧・期限を確認（無料・ログイン不要）",
  description:
    "あぜみちで作成した書類の履歴と、それぞれの提出期限の目安を確認できる無料ツールです。データはこの端末だけに保存されます。",
  path: "/dashboard",
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
