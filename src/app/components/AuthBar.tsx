"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

// ログイン版の4ツールの上部に表示する細いバー。
// ログイン中のメールアドレスと、ログアウトボタンを出す。
// （ここに来られる時点でmiddlewareがログイン済みを保証しているが、
//   念のためメールが取れなくても表示は崩れないようにしている）
export default function AuthBar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getSupabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setEmail(data.user?.email ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setBusy(true);
    try {
      await getSupabaseBrowser().auth.signOut();
    } catch {
      // 失敗してもログイン画面へは進める
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="bg-green-800 text-green-50 text-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* ロゴを押すとダッシュボードに戻る */}
          <Link
            href="/app/dashboard"
            title="ダッシュボードに戻る"
            aria-label="あぜみちのダッシュボードに戻る"
            className="shrink-0 flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-green-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-50 transition-colors"
          >
            <Image src="/azemichi-logo.png" alt="あぜみち" width={668} height={618} className="h-7 w-auto" priority />
            <span className="hidden sm:inline font-bold">ホーム</span>
          </Link>
          <span className="truncate">
            {email ? (
              <>
                <span className="opacity-80">ログイン中：</span>
                {email}
              </>
            ) : (
              <span className="opacity-80">ログイン中</span>
            )}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/app/settings"
            className="rounded-lg border border-green-50/50 px-3 py-1.5 font-bold hover:bg-green-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-50 transition-colors"
          >
            共有設定
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="rounded-lg border border-green-50/50 px-3 py-1.5 font-bold hover:bg-green-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-50 disabled:opacity-60 transition-colors"
          >
            {busy ? "処理中…" : "ログアウト"}
          </button>
        </div>
      </div>
    </div>
  );
}
