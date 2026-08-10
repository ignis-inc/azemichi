import type { Metadata } from "next";

// /invite は招待リンク専用ページ。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "家族の共有への招待",
  robots: { index: false, follow: false },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
