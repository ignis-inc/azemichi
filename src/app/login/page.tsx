"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

type Mode = "login" | "signup" | "forgot";

const inputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 focus:outline-none transition-colors";
const labelClass = "block text-base font-bold text-gray-700 mb-1";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ログイン後に戻る先。指定がなければログイン版ダッシュボードへ。
  const redirectTo = searchParams.get("redirect") || "/app/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // すでにログインしている状態でこのページを開いたら、戻る先へ送る
  useEffect(() => {
    let active = true;
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (active && data.session) router.replace(redirectTo);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router, redirectTo]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const supabase = getSupabaseBrowser();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError("メールアドレスかパスワードが正しくないようです。ご確認ください。");
          return;
        }
        router.replace(redirectTo);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError("登録できませんでした。パスワードは6文字以上でお試しください。");
          return;
        }
        if (data.session) {
          // メール確認が不要な設定のときは、その場でログイン状態になる
          router.replace(redirectTo);
          router.refresh();
        } else {
          setNotice(
            "確認メールを送信しました。メール内のリンクを開くと登録が完了します。",
          );
        }
      } else {
        // パスワード再設定メールの送信
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          setError("メールを送信できませんでした。メールアドレスをご確認ください。");
          return;
        }
        setNotice(
          "パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。",
        );
      }
    } catch {
      setError("通信に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "login" ? "ログイン" : mode === "signup" ? "新規登録" : "パスワードの再設定";
  const submitLabel =
    mode === "login" ? "ログイン" : mode === "signup" ? "登録する" : "再設定メールを送る";

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">{title}</h1>
          <p className="mt-2 text-base text-gray-600">
            記帳・農薬肥料記録・農作業日誌・ダッシュボードのログイン版でお使いいただけます（無料）。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 space-y-5"
        >
          <div>
            <label className={labelClass} htmlFor="login-email">
              メールアドレス
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例：you@example.com"
              className={inputClass}
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className={labelClass} htmlFor="login-password">
                パスワード
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-green-800 text-base bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white text-lg font-bold py-4 rounded-2xl shadow-md transition-colors"
          >
            {busy ? "処理中…" : submitLabel}
          </button>
        </form>

        {/* モード切り替えのリンク */}
        <div className="mt-5 text-center space-y-2 text-base">
          {mode === "login" && (
            <>
              <p>
                はじめての方は{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-green-700 font-bold underline underline-offset-4 hover:text-green-800"
                >
                  新規登録
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-green-700 underline underline-offset-4 hover:text-green-800"
                >
                  パスワードを忘れた方はこちら
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              すでに登録済みの方は{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-green-700 font-bold underline underline-offset-4 hover:text-green-800"
              >
                ログイン
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-green-700 underline underline-offset-4 hover:text-green-800"
              >
                ← ログインに戻る
              </button>
            </p>
          )}
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/tool"
            className="text-base text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            ← あぜみちのツール一覧へ
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-50" />}>
      <LoginInner />
    </Suspense>
  );
}
