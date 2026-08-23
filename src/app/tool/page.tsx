"use client";

import Image from "next/image";
import Link from "next/link";

// 目的別メニュー（ページ冒頭・スクロールせず見える範囲に配置）。
// 「新規就農者はまず何が分からないか」「現役農家は毎年何を作るか」の両方から、
// 迷わず最初の一歩を選べるよう、書類の正式名称ではなく「やりたいこと」で表現する。
const PURPOSE_MENU = [
  {
    href: "/kaigyo-set",
    label: "新しく農業を始める",
    desc: "開業に必要な書類をまとめて作成",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  {
    href: "/kome",
    label: "お米の販売を始める",
    desc: "米穀の出荷・販売の届出",
    icon: (
      <>
        <path d="M7 8h10l1 12H6L7 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
  },
  {
    href: "/aoiro",
    label: "税金・確定申告の準備",
    desc: "青色申告承認申請書",
    icon: (
      <>
        <path d="M7 3h8l4 4v14H7V3Z" />
        <path d="M15 3v4h4" />
        <path d="M9.5 12h6M9.5 15h6M9.5 18h4" />
      </>
    ),
  },
  {
    href: "/nouchi",
    label: "農地の手続き",
    desc: "農地法の届出",
    icon: (
      <>
        <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
  },
  {
    href: "/keiei",
    label: "補助金・交付金の申請",
    desc: "経営所得安定対策の申請",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 9.5h5M9.5 14.5h4" />
      </>
    ),
  },
  {
    href: "/kiroku",
    label: "日々の記録をつける",
    desc: "記帳・防除・作業日誌",
    icon: (
      <>
        <path d="M6 4h10l2 2v14H6z" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </>
    ),
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-green-50">
      {/* あぜみち サービス紹介＋目的別メニュー（スクロールせず見える範囲に配置） */}
      <div className="bg-white border-b-2 border-green-100 px-4 py-6 text-center">
        <Image
          src="/azemichi-logo.png"
          alt="あぜみち"
          width={668}
          height={618}
          className="mx-auto mb-1 h-12 w-auto sm:h-14"
          priority
        />
        <h1 className="text-xl sm:text-2xl font-bold text-green-800 mb-1">あぜみち</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5">
          入力するだけで、農業の手続き書類を無料でPDF化できます。
        </p>

        {/* 目的別メニュー：正式な書類名が分からなくても、やりたいことから選べる入り口 */}
        <h2 className="text-base sm:text-lg font-bold text-green-800 mb-3">何を作りたいですか？</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {PURPOSE_MENU.map((item, index) => {
            // 1枚目「新しく農業を始める」だけ、対象者が最も多いため少し大きく・色を変えて目立たせる
            const isPrimary = index === 0;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  isPrimary
                    ? "flex flex-col items-center gap-1 bg-green-50 rounded-2xl border-4 border-green-500 hover:border-green-600 hover:shadow-md transition-colors px-2 py-4 sm:px-3 sm:py-5"
                    : "flex flex-col items-center gap-1 bg-white rounded-2xl border-2 border-green-200 hover:border-green-500 hover:shadow-md transition-colors px-2 py-3 sm:px-3 sm:py-4"
                }
              >
                <span
                  className={
                    isPrimary
                      ? "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-600 text-white"
                      : "flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-100 text-green-700"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isPrimary ? "w-6 h-6 sm:w-7 sm:h-7" : "w-5 h-5 sm:w-6 sm:h-6"}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </svg>
                </span>
                <span
                  className={
                    isPrimary
                      ? "text-sm sm:text-base font-bold text-green-800 leading-snug"
                      : "text-xs sm:text-sm font-bold text-green-800 leading-snug"
                  }
                >
                  {item.label}
                </span>
                <span className="text-[11px] sm:text-xs text-gray-500 leading-snug">{item.desc}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-5">
          <Link
            href="/"
            className="text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            ← あぜみちトップへ
          </Link>
          <Link
            href="/#omoi"
            className="text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            私たちの想い
          </Link>
        </div>
      </div>

      {/* すべての書類から探す：初期状態は閉じておき、開くと従来の「書類を作る」9枚グリッドと
          「開業時にまとめて書類を作る」CTAを表示する（目的別メニューで迷ったときの逃げ道） */}
      <details className="doc-toggle">
        <summary>すべての書類から探す</summary>

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
      </details>

      {/* 記録する：/kiroku への導線は目的別メニュー内の「日々の記録をつける」カードで
          足りるため、ここでの重複案内ブロックは置かない */}

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
      {/* 「ちょっくら」の紹介は トップページ（/）にすでに同内容のセクションがあるため、
          ここでは重複させず省略する */}
    </div>
  );
}
