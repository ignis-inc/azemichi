import type { Metadata } from "next";

/**
 * サイト共通のSEO設定。ベースURLはここ1箇所で定義し、各ページ・sitemap・robots
 * から参照する。将来ドメインを変えるときは、Netlify の環境変数 NEXT_PUBLIC_SITE_URL
 * を設定すれば全体が切り替わる（未設定時は本番の azemichi.netlify.app を使う）。
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://azemichi.netlify.app"
).replace(/\/$/, "");

export const SITE_NAME = "あぜみち";

/**
 * OGP / Twitter カード用の画像（1200×630）。
 * 暫定でロゴ＋サイト名の静的画像を使用。将来 豊後大野の実写ベースに差し替える場合は、
 * 同じパス・同じサイズ(1200×630)で public/ogp.png を置き換えればよい。
 */
export const OG_IMAGE = "/ogp.png";

type PageMetaInput = {
  /** ページ固有タイトル（末尾に「｜あぜみち」が自動で付く。absolute 指定時は付かない） */
  title: string;
  description: string;
  /** ルートからの絶対パス（例 "/tool"）。トップは "/" */
  path: string;
  /** タイトルにテンプレート（｜あぜみち）を付けたくない場合は true */
  absoluteTitle?: boolean;
};

/**
 * 各ページの metadata を生成するヘルパー。canonical・OGP・Twitter を漏れなく揃える。
 * 相対パスは metadataBase（layout.tsx で設定）を基準に絶対URLへ解決される。
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
}: PageMetaInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ja_JP",
      url: path,
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
