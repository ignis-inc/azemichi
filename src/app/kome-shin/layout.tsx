import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kome-shin は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "お米の新しい届出（電子申請）の下書き（無料・ログイン不要）",
  description:
    "2026年10月から始まった「米穀等取扱事業の届出」で、eMAFF（電子申請）に入力する内容を事前に整理できる下書きツールです。あぜみちから国へ送信することはありません。入力内容はこの端末だけに保存されます。",
  path: "/kome-shin",
});

export default function KomeShinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
