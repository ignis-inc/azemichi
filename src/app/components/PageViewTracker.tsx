"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, setNoTrack } from "../lib/analytics";

// 全ページ共通で、ページが表示されるたびに閲覧数を記録する。
// 管理画面（/admin以下）は運営側の確認アクセスなので、集計を歪めないよう対象外にする。
// また ?notrack=1 / ?notrack=0 で、この端末を集計から除外／解除できる（自分のアクセスを数えないため）。
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // URLの ?notrack= を見て、この端末の「数えない」設定を切り替える
    const nt = new URLSearchParams(window.location.search).get("notrack");
    if (nt === "1") setNoTrack(true);
    else if (nt === "0") setNoTrack(false);

    if (pathname.startsWith("/admin")) return;
    trackEvent("page_view", pathname);
  }, [pathname]);

  return null;
}
