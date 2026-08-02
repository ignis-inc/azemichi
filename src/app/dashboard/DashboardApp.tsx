"use client";

import { useState } from "react";
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

// このコンポーネントは next/dynamic({ ssr: false }) 経由でのみ描画される（常にブラウザ環境）
export default function DashboardApp() {
  const [docs, setDocs] = useState<GeneratedDoc[]>(() => loadGeneratedDocs());

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
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
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
