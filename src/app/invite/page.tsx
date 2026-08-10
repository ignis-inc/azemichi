"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";
import {
  getInvitationInfo,
  acceptInvitation,
  shareErrorMessage,
  type InvitationInfo,
} from "../lib/householdShare";

type LoadState = "loading" | "ready" | "invalid";

function InviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<LoadState>("loading");
  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null); // null = 未ログイン
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        if (active) setState("invalid");
        return;
      }
      try {
        const supabase = getSupabaseBrowser();
        const [{ data: userData }, invInfo] = await Promise.all([
          supabase.auth.getUser(),
          getInvitationInfo(token),
        ]);
        if (!active) return;
        setLoggedIn(!!userData.user);
        setMyEmail(userData.user?.email ?? null);
        if (!invInfo) {
          setState("invalid");
          return;
        }
        setInfo(invInfo);
        setState("ready");
      } catch (err) {
        console.error(err);
        if (active) setState("invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept() {
    setBusy(true);
    setError(null);
    try {
      await acceptInvitation(token);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(shareErrorMessage(err, "承認に失敗しました。もう一度お試しください。"));
    } finally {
      setBusy(false);
    }
  }

  const cardClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6";
  const loginHref = `/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-800 text-center mb-6">家族の共有への招待</h1>
        <div className={cardClass}>
          {state === "loading" && <p className="text-base text-gray-600">確認しています…</p>}

          {state === "invalid" && (
            <div className="space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                この招待リンクは正しくないか、すでに使われた・取り消された可能性があります。招待した方にご確認ください。
              </p>
              <Link href="/tool" className="text-green-700 font-bold underline underline-offset-4 hover:text-green-800">
                ← あぜみちのツール一覧へ
              </Link>
            </div>
          )}

          {state === "ready" && info && !done && (
            <div className="space-y-4">
              {info.status !== "pending" ? (
                <p className="text-base text-gray-700 leading-relaxed">
                  この招待はすでに使用済みか、取り消されています。
                </p>
              ) : (
                <>
                  <p className="text-base text-gray-700 leading-relaxed">
                    <span className="font-bold">{info.host_email}</span> さんから、家族の共有に招待されています。
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    宛先：{info.invited_email}
                    <br />
                    承認すると、記帳・農薬肥料記録・農作業日誌のデータを一緒に見られるようになります。
                  </p>

                  {!loggedIn ? (
                    <div className="border-2 border-amber-300 bg-amber-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-900 leading-relaxed mb-3">
                        承認するには、まず <b>{info.invited_email}</b> でログイン（はじめての方は新規登録）してください。
                      </p>
                      <Link
                        href={loginHref}
                        className="inline-block bg-green-600 hover:bg-green-700 text-white text-base font-bold py-3 px-6 rounded-2xl shadow-md transition-colors"
                      >
                        ログイン・新規登録へ →
                      </Link>
                    </div>
                  ) : myEmail && myEmail.toLowerCase() !== info.invited_email.toLowerCase() ? (
                    <div className="border-2 border-amber-300 bg-amber-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-900 leading-relaxed">
                        いまログイン中のメールアドレス（{myEmail}）は、この招待の宛先（{info.invited_email}）と違います。宛先のアドレスでログインし直してください。
                      </p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <p className="text-red-600 text-base bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                      )}
                      <button
                        onClick={handleAccept}
                        disabled={busy}
                        className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white text-lg font-bold py-4 rounded-2xl shadow-md transition-colors"
                      >
                        {busy ? "承認中…" : "招待を承認して共有を始める"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {done && (
            <div className="space-y-4 text-center">
              <p className="text-base text-green-800 font-bold">共有を開始しました。</p>
              <p className="text-sm text-gray-600">これから、記帳・農薬肥料記録・農作業日誌のデータを家族で一緒に使えます。</p>
              <Link
                href="/app/dashboard"
                className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-3 px-6 rounded-2xl shadow-md transition-colors"
              >
                ダッシュボードへ進む →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-50" />}>
      <InviteInner />
    </Suspense>
  );
}
