import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

// 公開ページを列挙して sitemap.xml を生成する。
// /api/*（PDF生成）や /__forms.html（Netlify検出用）はクロール不要なので含めない。
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = [
    "/",
    "/chokkura",
    "/tool",
    "/nenkin",
    "/nouchi",
    "/aoiro",
    "/keiei",
    "/privacy",
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
