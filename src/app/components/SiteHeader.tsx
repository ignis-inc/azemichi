"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

// サイト全体の共通ヘッダー（layout.tsx から全ページの上部に表示）。
// ログイン版（/app 配下）や認証まわりのページは、それぞれ専用のバー・画面があるため非表示にする。
const HIDDEN_PREFIXES = ["/app", "/admin", "/login", "/invite", "/reset-password"];

export default function SiteHeader() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    getSupabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setLoggedIn(!!data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (pathname && HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <header className="bg-white border-b border-green-100">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-800 shrink-0" aria-label="あぜみち トップへ">
          <Image src="/azemichi-logo.png" alt="" width={668} height={618} className="h-7 w-auto" />
          <span className="text-base">あぜみち</span>
        </Link>
        <Link
          href={loggedIn ? "/app/dashboard" : "/login"}
          className="shrink-0 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-bold px-4 py-2 transition-colors"
        >
          {loggedIn ? "マイページ" : "ログイン"}
        </Link>
      </div>
    </header>
  );
}
