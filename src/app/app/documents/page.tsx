"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthBar from "../../components/AuthBar";
import {
  listMyDocuments,
  downloadDocument,
  deleteDocument,
  type SavedDocument,
} from "../../lib/documentCloud";

function formatDateTimeJP(iso: string): string {
  // DBのcreated_atはUTC。日本時間に直して表示する。
  const jst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<SavedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listMyDocuments()
      .then((rows) => {
        if (!active) return;
        setDocs(rows);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("読み込みに失敗しました。画面を再読み込みしてお試しください。");
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleDownload(doc: SavedDocument) {
    setBusyId(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      console.error(err);
      alert("ダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(doc: SavedDocument) {
    if (!window.confirm(`「${doc.title}」（${formatDateTimeJP(doc.created_at)}作成）を削除します。よろしいですか？`)) return;
    setBusyId(doc.id);
    try {
      await deleteDocument(doc);
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== doc.id) : prev));
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました。もう一度お試しください。");
    } finally {
      setBusyId(null);
    }
  }

  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  return (
    <div className="min-h-screen bg-green-50">
      <AuthBar />

      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">保存した書類</h1>
        <p className="mt-2 text-green-100 text-base">書類作成ツールで作ったPDFのクラウド保管（ログイン版）</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="border-2 border-green-300 bg-green-50 rounded-xl px-5 py-4">
          <p className="text-base font-bold text-green-900 leading-relaxed">
            ログイン中に書類作成ツールでPDFを作ると、自動でここに保存されます。
          </p>
          <p className="text-sm text-green-800 leading-relaxed mt-1">
            別の端末でも、同じアカウントでログインすればここから再ダウンロードできます。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/app/dashboard" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← ダッシュボードへ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">保存済みのPDF</h2>

          {error && <p className="text-red-600 text-base mb-4">{error}</p>}

          {docs === null && !error ? (
            <p className="text-base text-gray-500">読み込み中…</p>
          ) : docs && docs.length === 0 ? (
            <div>
              <p className="text-base text-gray-500 mb-4">まだ保存された書類がありません。</p>
              <Link href="/tool" className="text-green-700 underline underline-offset-2 hover:text-green-800">
                書類作成ツール一覧へ
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {docs?.map((doc) => (
                <div key={doc.id} className="border-2 border-green-100 rounded-xl p-4">
                  <p className="text-lg font-bold text-gray-800">{doc.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">作成日時：{formatDateTimeJP(doc.created_at)}</p>
                  <div className="mt-3 flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={busyId === doc.id}
                      className="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {busyId === doc.id ? "処理中…" : "ダウンロード"}
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={busyId === doc.id}
                      className="text-rose-600 underline text-sm disabled:opacity-60"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          保存されるのは、あなたがログイン中に作成したPDFだけです。他のユーザーの書類は見えません。
        </p>
      </main>
    </div>
  );
}
