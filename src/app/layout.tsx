import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "つくる人が、ちゃんと報われる農業へ。｜あぜみち・ちょっくら / IGNIS",
  description:
    "手続きの壁をなくす「あぜみち」と、自分の値段で直接売る「ちょっくら」。農家の“つくる”と“売る”を、もっと身軽に。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
