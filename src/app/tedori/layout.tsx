import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /tedori は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "出荷と直販の手取り比較（無料・ログイン不要）",
  description:
    "同じ作物をJA・市場に出荷した場合と、自分で直販した場合で、手元に残るお金（手取り）がいくら違うかを計算できる無料ツールです。手数料率・送料・梱包資材費などはご自身の条件を入力します。入力内容はこの端末だけに保存されます。計算結果は概算です。",
  path: "/tedori",
});

export default function TedoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
