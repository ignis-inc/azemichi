import type { Metadata } from "next";

// /app/kicho はログイン版（同じ記帳ツールをログインした状態で使う）。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "記帳（ログイン版）",
  robots: { index: false, follow: false },
};

export default function KichoLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
