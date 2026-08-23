import type { Metadata } from "next";
import { pageMetadata } from "../site";

// /kiroku は client component のため metadata を export できない。
// この layout（server component）で固有のメタ情報を付与する。
export const metadata: Metadata = pageMetadata({
  title: "記帳・農薬肥料・作業日誌を記録",
  description:
    "日々の収支・農薬肥料の使用・作業内容を、スマホで手軽に記録できる無料ツール。書類作成とは別に、記録専用で使えます。無料・登録不要。ログインすればクラウド保存・家族との共有もできます。",
  path: "/kiroku",
});

export default function KirokuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
