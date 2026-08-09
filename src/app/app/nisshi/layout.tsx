import type { Metadata } from "next";

// /app/nisshi はログイン版（同じ農作業日誌ツールをログインした状態で使う）。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "農作業日誌（ログイン版）",
  robots: { index: false, follow: false },
};

export default function NisshiLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
