"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadGeneratedDocs,
  saveGeneratedDocs,
  computeDeadline,
  formatDateJP,
  daysUntil,
  DOC_META,
  type GeneratedDoc,
} from "../dashboardStore";
import { createCloudStore } from "../lib/cloudStore";

function todayISO(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function formatYen(n: number): string {
  return n.toLocaleString("ja-JP");
}

// 今年の振り返り（ログイン版のみ）で使う最小限の型。
// /app/kicho・/app/boujo・/app/nisshi と同じクラウドのデータ（cloudStore.ts）を読み、
// 各ツールがそれぞれ内部で行っている集計（年ごとの収支合計・件数集計）と同じ考え方で計算する。
type KichoEntryMin = { id: string; date: string; type: "income" | "expense"; amount: number };
type BoujoEntryMin = { id: string; date: string; type: "農薬" | "肥料" };
type NisshiEntryMin = { id: string; date: string };

type YearlyReview = {
  kicho: { status: "ok" | "error"; income: number; expense: number };
  boujo: { status: "ok" | "error"; pesticide: number; fertilizer: number };
  nisshi: { status: "ok" | "error"; count: number };
};

// cloud=true はログイン版（/app/dashboard）。無料版（/dashboard）はこれまで通りfalse相当で、
// 期限が近い書類のバナー通知は表示しない（データの持ち方自体はどちらも同じlocalStorage）。
// このコンポーネントは next/dynamic({ ssr: false }) 経由でのみ描画される（常にブラウザ環境）
export default function DashboardApp({ cloud }: { cloud?: boolean } = {}) {
  const isCloud = !!cloud;
  const [docs, setDocs] = useState<GeneratedDoc[]>(() => loadGeneratedDocs());
  const [yearlyReview, setYearlyReview] = useState<YearlyReview | null>(null);
  const currentYear = todayISO().slice(0, 4); // 年が明けたら自動的にこの値も切り替わる

  // 今年の振り返り（ログイン版のみ）：/app/kicho・/app/boujo・/app/nisshiのクラウドデータを読み、
  // 今年（1月〜現在）分だけを集計する。1つのツールの読み込みに失敗しても、他は表示を続ける。
  useEffect(() => {
    if (!isCloud) return;
    let active = true;
    Promise.allSettled([
      createCloudStore<KichoEntryMin>("kicho").load(),
      createCloudStore<BoujoEntryMin>("boujo").load(),
      createCloudStore<NisshiEntryMin>("nisshi").load(),
    ]).then(([kichoRes, boujoRes, nisshiRes]) => {
      if (!active) return;

      const kichoYear = kichoRes.status === "fulfilled" ? kichoRes.value.filter((e) => e.date.slice(0, 4) === currentYear) : [];
      const boujoYear = boujoRes.status === "fulfilled" ? boujoRes.value.filter((e) => e.date.slice(0, 4) === currentYear) : [];
      const nisshiYear = nisshiRes.status === "fulfilled" ? nisshiRes.value.filter((e) => e.date.slice(0, 4) === currentYear) : [];

      if (kichoRes.status === "rejected") console.error(kichoRes.reason);
      if (boujoRes.status === "rejected") console.error(boujoRes.reason);
      if (nisshiRes.status === "rejected") console.error(nisshiRes.reason);

      setYearlyReview({
        kicho: {
          status: kichoRes.status === "fulfilled" ? "ok" : "error",
          income: kichoYear.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0),
          expense: kichoYear.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0),
        },
        boujo: {
          status: boujoRes.status === "fulfilled" ? "ok" : "error",
          pesticide: boujoYear.filter((e) => e.type === "農薬").length,
          fertilizer: boujoYear.filter((e) => e.type === "肥料").length,
        },
        nisshi: {
          status: nisshiRes.status === "fulfilled" ? "ok" : "error",
          count: nisshiYear.length,
        },
      });
    });
    return () => {
      active = false;
    };
  }, [isCloud, currentYear]);

  function deleteDoc(id: string) {
    if (!window.confirm("この記録を削除します。よろしいですか？")) return;
    const next = docs.filter((d) => d.id !== id);
    setDocs(next);
    saveGeneratedDocs(next);
  }

  // 新しい順（同じ日の記録は、あとから作った方を先に表示）
  const sortedDocs = [...docs].reverse().sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : a.generatedAt > b.generatedAt ? -1 : 0));

  const rows = sortedDocs.map((doc) => ({ doc, deadline: computeDeadline(doc) }));
  const urgentCount = rows.filter((r) => r.deadline.status === "soon" || r.deadline.status === "overdue").length;

  // ログイン版だけに出す「期限が近い書類」バナー。7日以内（超過分を含む）を対象に、期限が近い順に並べる。
  const DEADLINE_BANNER_THRESHOLD_DAYS = 7;
  const bannerRows = isCloud
    ? rows
        .filter((r) => r.deadline.kind === "date" && r.deadline.dueDate)
        .map((r) => ({ ...r, days: daysUntil(r.deadline.dueDate as string) }))
        .filter((r) => r.days <= DEADLINE_BANNER_THRESHOLD_DAYS)
        .sort((a, b) => a.days - b.days)
    : [];

  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  const cardBorderClass: Record<string, string> = {
    overdue: "border-rose-400 bg-rose-50",
    soon: "border-amber-400 bg-amber-50",
    ok: "border-green-100 bg-white",
    "n/a": "border-green-100 bg-white",
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">作った書類の一覧・期限を確認する</h1>
        <p className="mt-2 text-green-100 text-base">ダッシュボード（無料・ログイン不要）</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4">
          <p className="text-base font-bold text-yellow-900 leading-relaxed">
            この記録はこの端末のブラウザだけに保存されます。
          </p>
          <p className="text-sm text-yellow-800 leading-relaxed mt-1">
            ブラウザのデータ削除や機種変更で消えてしまいます。あぜみちの各書類作成ツールでPDFを作成すると、自動的にここへ記録されます。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/tool" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← あぜみちの書類作成ツールへ
          </Link>
        </div>
        {isCloud && (
          <div className="mt-3">
            <Link href="/app/documents" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
              作成したPDFの保存先（/app/documents）を見る →
            </Link>
          </div>
        )}
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isCloud && bannerRows.length > 0 && (
          <section className="border-2 border-rose-400 bg-rose-50 rounded-2xl p-5 mb-6 shadow-md">
            <p className="text-lg font-bold text-rose-900 mb-3">
              ⚠ 期限が近い書類が{bannerRows.length}件あります
            </p>
            <ul className="space-y-2">
              {bannerRows.map(({ doc, deadline, days }, i) => {
                const meta = DOC_META[doc.docType];
                const dueDate = deadline.dueDate as string;
                const daysText =
                  days < 0
                    ? `期限を${Math.abs(days)}日超過しています`
                    : days === 0
                    ? "本日が期限です"
                    : `期限まであと${days}日です`;
                return (
                  <li key={doc.id}>
                    <Link
                      href={meta.path}
                      className={`block rounded-lg px-3 py-2 transition-colors ${
                        i === 0
                          ? "bg-rose-100 border-2 border-rose-400 hover:bg-rose-200"
                          : "bg-white border border-rose-200 hover:bg-rose-50"
                      }`}
                    >
                      <span className={`font-bold ${i === 0 ? "text-rose-900 text-lg" : "text-rose-800 text-base"}`}>
                        {meta.title}
                      </span>
                      <span className="block text-sm text-rose-700 mt-0.5">
                        {daysText}（期限：{formatDateJP(dueDate)}
                        {deadline.approx ? "・目安" : ""}）
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {isCloud && (
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
              今年の振り返り（{currentYear}年）
            </h2>

            {yearlyReview === null ? (
              <p className="text-base text-gray-500">読み込み中…</p>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-green-100 rounded-xl p-4">
                  <p className="text-base font-bold text-gray-800 mb-3">記帳（収支）</p>
                  {yearlyReview.kicho.status === "error" ? (
                    <p className="text-sm text-gray-500">読み込みに失敗しました。画面を再読み込みしてお試しください。</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">収入</p>
                        <p className="text-lg font-bold text-green-700 whitespace-nowrap">{formatYen(yearlyReview.kicho.income)}円</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">支出</p>
                        <p className="text-lg font-bold text-rose-700 whitespace-nowrap">{formatYen(yearlyReview.kicho.expense)}円</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">差引</p>
                        <p
                          className={`text-lg font-bold whitespace-nowrap ${
                            yearlyReview.kicho.income - yearlyReview.kicho.expense >= 0 ? "text-green-700" : "text-rose-700"
                          }`}
                        >
                          {formatYen(yearlyReview.kicho.income - yearlyReview.kicho.expense)}円
                        </p>
                      </div>
                    </div>
                  )}
                  <Link href="/app/kicho" className="text-sm text-green-700 underline underline-offset-2 hover:text-green-800 mt-3 inline-block">
                    記帳ツールを開く →
                  </Link>
                </div>

                <div className="border-2 border-green-100 rounded-xl p-4">
                  <p className="text-base font-bold text-gray-800 mb-3">農薬・肥料の記録件数</p>
                  {yearlyReview.boujo.status === "error" ? (
                    <p className="text-sm text-gray-500">読み込みに失敗しました。画面を再読み込みしてお試しください。</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">農薬</p>
                        <p className="text-lg font-bold text-rose-700">{yearlyReview.boujo.pesticide}件</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">肥料</p>
                        <p className="text-lg font-bold text-green-700">{yearlyReview.boujo.fertilizer}件</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">合計</p>
                        <p className="text-lg font-bold text-gray-800">
                          {yearlyReview.boujo.pesticide + yearlyReview.boujo.fertilizer}件
                        </p>
                      </div>
                    </div>
                  )}
                  <Link href="/app/boujo" className="text-sm text-green-700 underline underline-offset-2 hover:text-green-800 mt-3 inline-block">
                    農薬・肥料記録ツールを開く →
                  </Link>
                </div>

                <div className="border-2 border-green-100 rounded-xl p-4">
                  <p className="text-base font-bold text-gray-800 mb-3">農作業日誌の記録件数</p>
                  {yearlyReview.nisshi.status === "error" ? (
                    <p className="text-sm text-gray-500">読み込みに失敗しました。画面を再読み込みしてお試しください。</p>
                  ) : (
                    <p className="text-lg font-bold text-gray-800 text-center">{yearlyReview.nisshi.count}件</p>
                  )}
                  <Link href="/app/nisshi" className="text-sm text-green-700 underline underline-offset-2 hover:text-green-800 mt-3 inline-block">
                    農作業日誌を開く →
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {urgentCount > 0 && (
          <section className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-6">
            <p className="text-lg font-bold text-amber-900">
              期限が近い、または過ぎている書類が{urgentCount}件あります
            </p>
            <p className="text-sm text-amber-800 mt-1">下の一覧で赤・黄色の書類をご確認ください。</p>
          </section>
        )}

        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-yellow-900 leading-relaxed">
            青色申告承認申請書・専従者給与の届出書の期限は、新規開業または新規に専従者を雇った場合のルール（開業日等から2か月以内、またはその年の3月15日まで）で計算しています。すでに事業を続けている方がこれらの届出を再提出する場合、この期限表示は当てはまりません。
          </p>
        </div>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">作成した書類</h2>

          {rows.length === 0 ? (
            <div>
              <p className="text-base text-gray-500 mb-4">まだ作成した書類がありません。</p>
              <Link href="/tool" className="text-green-700 underline underline-offset-2 hover:text-green-800">
                書類作成ツール一覧へ
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map(({ doc, deadline }) => {
                const meta = DOC_META[doc.docType];
                const border = cardBorderClass[deadline.status] ?? cardBorderClass["n/a"];
                return (
                  <div key={doc.id} className={`border-2 rounded-xl p-4 ${border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-gray-800">{meta.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">作成日：{formatDateJP(doc.generatedAt)}</p>
                      </div>
                      <button
                        onClick={() => deleteDoc(doc.id)}
                        className="text-rose-600 underline text-sm shrink-0"
                        aria-label={`${meta.title}（${formatDateJP(doc.generatedAt)}作成）の記録を削除`}
                      >
                        削除
                      </button>
                    </div>

                    <div className="mt-3 text-base leading-relaxed">
                      {deadline.kind === "date" && deadline.dueDate && (
                        <p
                          className={
                            deadline.status === "overdue"
                              ? "font-bold text-rose-700"
                              : deadline.status === "soon"
                              ? "font-bold text-amber-800"
                              : "text-gray-700"
                          }
                        >
                          期限：{formatDateJP(deadline.dueDate)}
                          {deadline.approx ? "（目安）" : ""}
                          {deadline.status === "overdue" && `　期限を${Math.abs(daysUntil(deadline.dueDate))}日超過しています`}
                          {deadline.status === "soon" && `　あと${daysUntil(deadline.dueDate)}日`}
                        </p>
                      )}
                      {deadline.kind === "date" && !deadline.dueDate && (
                        <p className="text-gray-500">{deadline.label}（起点日が記録されていないため計算できません）</p>
                      )}
                      {deadline.kind === "fixed-annual" && (
                        <div>
                          <p className="text-gray-700 font-bold">期限：{deadline.label}</p>
                          {deadline.note && <p className="text-sm text-gray-500 mt-1">{deadline.note}</p>}
                        </div>
                      )}
                      {deadline.kind === "none" && <p className="text-gray-500">{deadline.label}</p>}
                    </div>

                    <div className="mt-3">
                      <Link href={meta.path} className="text-green-700 underline underline-offset-2 hover:text-green-800 text-sm">
                        {meta.title}のツールを開く →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          期限の表示はあぜみちが自動計算した目安です。制度の詳細や正式な期限は、提出先の窓口・農政局・税理士等にご確認ください。
        </p>
      </main>
    </div>
  );
}
