import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "./components/SiteFooter";
import PageViewTracker from "./components/PageViewTracker";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "./site";

const DEFAULT_TITLE =
  "つくる人が、ちゃんと報われる農業へ。｜あぜみち・ちょっくら / IGNIS";
const DEFAULT_DESCRIPTION =
  "手続きの壁をなくす「あぜみち」と、自分の値段で直接売る「ちょっくら」。農家の“つくる”と“売る”を、もっと身軽に。";

export const metadata: Metadata = {
  // 相対URL（canonical / OGP url / 画像）の基準。site.ts のベースURLを使う
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    // 各ページの固有タイトルは末尾に「｜あぜみち」が付く
    template: "%s｜あぜみち",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // Google Search Console の所有権確認用メタタグ（全ページの <head> に出力される）。
  // ※削除しないこと：Search Console が「確認済み」状態の維持にこのタグを使うため。
  verification: { google: "tx-irimQoxccMWGomvfsMkFKvj60jH-YZK09ZZjWO70" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    url: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// サイト全体の構造化データ（WebSite・Organization）。
// FAQPage（src/app/page.tsx）と同じ書き方で、全ページ共通のこのレイアウトに1つだけ置く。
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "株式会社IGNIS",
  url: SITE_URL,
  logo: `${SITE_URL}${OG_IMAGE}`,
  address: {
    "@type": "PostalAddress",
    addressRegion: "大分県",
    addressLocality: "豊後大野市",
    addressCountry: "JP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <PageViewTracker />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
