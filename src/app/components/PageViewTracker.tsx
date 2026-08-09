"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "../lib/analytics";

// 全ページ共通で、ページが表示されるたびに閲覧数を記録する。
// 管理画面（/admin以下）は運営側の確認アクセスなので、集計を歪めないよう対象外にする。
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackEvent("page_view", pathname);
  }, [pathname]);

  return null;
}
