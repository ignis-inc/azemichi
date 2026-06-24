import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

// robots.txt を生成。クロール不要な PDF生成API と Netlify検出用の静的フォームは除外し、
// sitemap の場所を明示する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/__forms.html"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
