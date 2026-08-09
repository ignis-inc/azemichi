import type { Metadata } from "next";

// /app/dashboard はログイン版（同じダッシュボードをログインした状態で使う）。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "ダッシュボード（ログイン版）",
  robots: { index: false, follow: false },
};

export default function DashboardLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
