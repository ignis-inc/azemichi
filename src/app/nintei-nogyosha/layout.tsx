import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /nintei-nogyosha は client component のため、この layout で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "認定農業者の申請書づくり（下書き・無料・ログイン不要）",
  description:
    "国の様式に沿って、農業経営改善計画認定申請書（認定農業者の申請書）の下書きをPDFにします。所得や面積の合計は自動で計算します。入力した内容はこの端末の中だけで扱い、送信しません。",
  path: "/nintei-nogyosha",
});

export default function NinteiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
