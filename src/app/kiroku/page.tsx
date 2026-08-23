"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

// /tool の「記録する」セクション（3つの記録ツールカード＋ログイン版案内）を
// そのまま切り出したページ。書類作成（/tool）とは別の入り口として案内する。
export default function KirokuPage() {
  // ログイン状態に応じて、ログイン版カードの遷移先を切り替える（ログイン中→マイページ／未ログイン→ログイン）
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

  return (
    <div className="min-h-screen bg-green-50">
      {/* 見出し＋戻り導線 */}
      <div className="bg-white border-b-2 border-green-100 px-4 py-6 text-center">
        <Link
          href="/tool"
          className="text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
        >
          ← 書類を作りたい方はこちら
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-green-800 mt-3 mb-1">記録する</h1>
        <p className="text-sm sm:text-base text-gray-600">
          日々の収支・農薬肥料の使用・作業内容を、スマホで手軽に記録できます。
        </p>
      </div>

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 記帳ツール案内 */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">日々の収支を記録する</h3>
            <p className="text-sm font-bold text-green-700 mb-3">無料・ログイン不要</p>
            <p className="text-base text-gray-600 leading-relaxed mb-5">
              毎日の収入・支出をスマホで記録して、月ごと・年ごとに自動で集計できます。書類作成とは別の、日々の記帳専用のツールです。
            </p>
            <Link
              href="/kicho"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            >
              記帳ツールを開く →
            </Link>
          </div>

          {/* 農薬・肥料の使用記録ツール案内 */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">農薬・肥料の使用を記録する</h3>
            <p className="text-sm font-bold text-green-700 mb-3">無料・ログイン不要</p>
            <p className="text-base text-gray-600 leading-relaxed mb-5">
              使用した農薬・肥料をスマホで記録して、圃場・作物ごとに確認できます。同じ農薬を今年何回使ったかも一覧できる、農薬・肥料専用の記録ツールです。
            </p>
            <Link
              href="/boujo"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            >
              使用記録ツールを開く →
            </Link>
          </div>

          {/* 農作業日誌ツール案内 */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">日々の作業を記録する</h3>
            <p className="text-sm font-bold text-green-700 mb-3">無料・ログイン不要</p>
            <p className="text-base text-gray-600 leading-relaxed mb-5">
              毎日の作業内容や天候をスマホで記録して、圃場・作物・作業内容ごとに確認できます。書類作成や収支・農薬肥料の記録とは別の、作業日誌専用のツールです。
            </p>
            <Link
              href="/nisshi"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            >
              作業日誌を開く →
            </Link>
          </div>
        </div>
      </section>

      {/* ログイン版の案内カード */}
      <section className="max-w-5xl mx-auto px-4 pt-2 pb-10">
        <Link
          href={loggedIn ? "/app/dashboard" : "/login"}
          className="block bg-white rounded-2xl shadow-sm border-2 border-green-300 p-6 text-center hover:border-green-500 transition-colors"
        >
          <p className="text-sm font-bold text-green-700 mb-1">ログイン版（無料）</p>
          <h2 className="text-xl font-bold text-green-800 mb-2">記録をクラウドに保存・家族と共有</h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-lg mx-auto mb-5">
            ログインすると、記帳・農薬肥料・農作業日誌の記録をクラウドに保存でき、機種変更しても引き継げます。家族と同じ記録を共有することもできます。
          </p>
          <span className="inline-block bg-green-600 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md">
            {loggedIn ? "マイページを開く →" : "ログイン・新規登録へ →"}
          </span>
        </Link>
      </section>
    </div>
  );
}
