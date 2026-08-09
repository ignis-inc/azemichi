"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

const inputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 focus:outline-none transition-colors";
const labelClass = "block text-base font-bold text-gray-700 mb-1";

export default function ResetPasswordPage() {
  const router = useRouter();
  // 再設定メールのリンクから来ると、Supabaseが一時的なログイン状態を用意してくれる。
  // その状態（session）があるときだけ、新しいパスワードを設定できるようにする。
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // メールのリンク経由でパスワード再設定の状態になったら受け取る
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("ok");
    });

    // すでにセッションが用意されている場合の確認（少し待ってから判定）
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        setReady((prev) => (prev === "ok" ? prev : data.session ? "ok" : "invalid"));
      });
    }, 800);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("2つのパスワードが一致しません。同じものを入力してください。");
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabaseBrowser().auth.updateUser({ password });
      if (error) {
        setError("パスワードを変更できませんでした。6文字以上でお試しください。");
        return;
      }
      setDone(true);
    } catch {
      setError("通信に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-800 text-center mb-6">
          新しいパスワードの設定
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          {ready === "checking" && (
            <p className="text-base text-gray-600">確認しています…</p>
          )}

          {ready === "invalid" && (
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                このページは、パスワード再設定メールのリンクから開いてください。リンクの有効期限が切れている場合は、お手数ですがもう一度お送りください。
              </p>
              <Link
                href="/login"
                className="inline-block text-green-700 font-bold underline underline-offset-4 hover:text-green-800"
              >
                ログインページで再送する →
              </Link>
            </div>
          )}

          {ready === "ok" && !done && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="rp-password">
                  新しいパスワード
                </label>
                <input
                  id="rp-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rp-password2">
                  もう一度入力
                </label>
                <input
                  id="rp-password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="確認のためもう一度"
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white text-lg font-bold py-4 rounded-2xl shadow-md transition-colors"
              >
                {busy ? "変更中…" : "パスワードを変更する"}
              </button>
            </form>
          )}

          {done && (
            <div className="space-y-4 text-center">
              <p className="text-base text-green-800 font-bold">
                パスワードを変更しました。
              </p>
              <button
                type="button"
                onClick={() => {
                  router.replace("/dashboard");
                  router.refresh();
                }}
                className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-3 px-6 rounded-2xl shadow-md transition-colors"
              >
                ダッシュボードへ進む →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
