import type { Metadata } from "next";

// /admin/stats は運営専用の内部ページ。検索エンジンに載せない。
export const metadata: Metadata = {
  title: "利用状況（運営専用）",
  robots: { index: false, follow: false },
};

export default function AdminStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
