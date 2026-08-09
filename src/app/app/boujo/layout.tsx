import type { Metadata } from "next";

// /app/boujo はログイン版（同じ農薬・肥料記録ツールをログインした状態で使う）。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "農薬・肥料記録（ログイン版）",
  robots: { index: false, follow: false },
};

export default function BoujoLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
