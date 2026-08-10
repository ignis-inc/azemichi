import type { Metadata } from "next";

// /app/settings はログイン版専用の内部ページ。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "家族・世帯の共有設定（ログイン版）",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
