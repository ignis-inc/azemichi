"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CHOKKURA_NOTIFY_URL } from "../site";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";

export default function Home() {
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
      {/* あぜみち サービス紹介 */}
      <div className="bg-white border-b-2 border-green-100 px-4 py-8 text-center">
        <Image
          src="/azemichi-logo.png"
          alt="あぜみち"
          width={668}
          height={618}
          className="mx-auto mb-2 h-24 w-auto sm:h-28"
          priority
        />
        <h2 className="text-4xl font-bold text-green-800 mb-2">あぜみち</h2>
        <p className="text-lg font-bold text-green-700 mb-3">農家の手続きを、もっと簡単に。</p>
        <p className="text-xl font-medium text-gray-700 mb-4">農業の手続き書類を、スマホで簡単に作れます</p>
        <p className="text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
          必要な情報を入力すると、農林水産省や税務署に提出する書類の様式をPDFにできます。内容をご確認のうえ、印刷して窓口に持参するか、オンラインで申請してください。
        </p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto mt-3">
          つくったものを売る準備ができたら、その先は直販のしくみ『ちょっくら』へ（近日公開）。
        </p>
        <div className="mt-5 flex items-center justify-center gap-5">
          <Link
            href="/"
            className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            ← あぜみちトップへ
          </Link>
          <Link
            href="/#omoi"
            className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            私たちの想い
          </Link>
        </div>
      </div>

      {/* 書類を作る：やりたいことから書類を選ぶカード一覧 */}
      <section className="doc-picker">
        <div className="doc-picker-inner">
          <h2 className="doc-picker-title">書類を作る</h2>
          <p className="doc-picker-lead">あてはまるものをお選びください。</p>
          <ul className="doc-picker-list">
            <li>
              <Link href="/kome" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">お米を売りはじめる方へ</span>
                  <span className="doc-card-name">米の販売届出（米穀の出荷又は販売の事業開始届出書）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/aoiro" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">青色申告をはじめる方へ</span>
                  <span className="doc-card-name">所得税の青色申告承認申請書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/kaigyo" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">農業をはじめる方へ</span>
                  <span className="doc-card-name">個人事業の開業・廃業等届出書（開業）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/senjusha" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">家族に給与を払う方へ</span>
                  <span className="doc-card-name">青色事業専従者給与に関する届出書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/kyuyo-jimusho" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">給与を払い始める方へ</span>
                  <span className="doc-card-name">給与支払事務所等の開設・移転・廃止届出書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/gennsen-tokurei" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">源泉所得税の納付をまとめたい方へ</span>
                  <span className="doc-card-name">源泉所得税の納期の特例の承認に関する申請書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/nouchi" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">農地を相続・売買した方へ</span>
                  <span className="doc-card-name">農地法第3条の3第1項の規定による届出書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/nenkin" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">農業者年金に加入する方へ</span>
                  <span className="doc-card-name">農業者年金通常加入申込書（様式第1号）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/keiei" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">
                    経営所得安定対策（補助金）を申請する方へ
                  </span>
                  <span className="doc-card-name">経営所得安定対策等交付金交付申請書（様式第1号A）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* 開業3点セット案内（「書類を作る」カテゴリに属するが、複数書類をまとめる特殊なツールのため別カード） */}
      <section className="max-w-2xl mx-auto px-4 pt-2 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">開業時にまとめて書類を作る</h2>
          <p className="text-sm font-bold text-green-700 mb-3">無料・ログイン不要</p>
          <p className="text-base text-gray-600 leading-relaxed mb-5">
            開業届・青色申告承認申請書・専従者給与の届出書・給与支払事務所等の開設届出書を、共通する情報の入力は1回だけでまとめてPDFにできます。農業を新しく始める方向けのツールです。
          </p>
          <Link
            href="/kaigyo-set"
            className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
          >
            まとめて作成ツールを開く →
          </Link>
        </div>
      </section>

      {/* 記録する */}
      <section className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <h2 className="text-2xl font-bold text-green-800 text-center">記録する</h2>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-8">
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

      {/* 確認する */}
      <section className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <h2 className="text-2xl font-bold text-green-800 text-center">確認する</h2>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ダッシュボード案内 */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">作った書類の一覧・期限を確認する</h3>
            <p className="text-sm font-bold text-green-700 mb-3">無料・ログイン不要</p>
            <p className="text-base text-gray-600 leading-relaxed mb-5">
              あぜみちで作成した書類の履歴と、それぞれの提出期限の目安を一覧で確認できます。期限が近い書類は色を変えてお知らせします。
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            >
              ダッシュボードを開く →
            </Link>
          </div>
        </div>
      </section>

      {/* ログイン版の案内カード（3カテゴリに加えて、ログイン版の価値を軽く紹介） */}
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

      {/* 別サービス「ちょっくら」紹介（琥珀・茶系アクセントで別サービスと区別） */}
      <section className="border-t-4 px-4 py-10" style={{ background: "#FFFBEB", borderColor: "#B45309" }}>
        <div className="max-w-2xl mx-auto text-center">
          <span
            className="inline-block text-sm font-bold rounded-full px-4 py-1 mb-4"
            style={{ background: "#B45309", color: "#FFFFFF" }}
          >
            ちょっくら（近日公開）
          </span>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#92400E" }}>
            つくったものを、自分の値段で直接売る。
          </h2>
          <p className="text-base leading-relaxed max-w-lg mx-auto mb-6" style={{ color: "#78350F" }}>
            ちょっくらは、農家さんが育てた農産物を、自分でつけた価格でお客さまに直接販売できる直販サービスです。あぜみちで手続きを整えたら、次は売る場所へ。
          </p>
          <a
            href={CHOKKURA_NOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            style={{ background: "#B45309", color: "#FFFFFF" }}
          >
            興味がある方はこちら（お知らせ登録）
          </a>
          <p className="text-xs mt-4" style={{ color: "#B45309" }}>
            ※ ちょっくらはあぜみちとは別のサービスです
          </p>
        </div>
      </section>
    </div>
  );
}
