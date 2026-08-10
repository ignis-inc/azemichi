import type { Metadata } from "next";

// /app/documents はログイン版専用の内部ページ。検索エンジンには載せない。
export const metadata: Metadata = {
  title: "保存した書類（ログイン版）",
  robots: { index: false, follow: false },
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
