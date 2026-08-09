"use client";

import { useState } from "react";
import { migrateLocalToCloud, type ToolName } from "../lib/cloudStore";

// このコンポーネントは dynamic({ ssr:false }) 経由でのみ描画されるため、
// 初回レンダーの時点で常にブラウザ環境（localStorageを直接読める）。
function readLocal(key: string): { id: string }[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // idが文字列の記録だけを対象にする（重複防止のキーに使うため）
    return parsed.filter((e) => e && typeof e.id === "string");
  } catch {
    return [];
  }
}

// ログイン版の画面の上部に出す「無料版のデータを取り込む」案内バー。
// 無料版（localStorage）に記録があるときだけ表示する。
// 取り込みは上書きではなく追加で、同じ記録（id）は重複しない。無料版のデータは消さない。
export default function MigrationBanner({
  tool,
  localKey,
  onImported,
}: {
  tool: ToolName;
  localKey: string;
  onImported: () => void;
}) {
  const [local] = useState(() => readLocal(localKey));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (local.length === 0 || dismissed) return null;

  async function handleImport() {
    setBusy(true);
    setError(null);
    try {
      const r = await migrateLocalToCloud(tool, local);
      setResult(r);
      onImported(); // 親に知らせて、クラウドの最新データを読み直してもらう
    } catch (e) {
      console.error(e);
      setError("取り込みに失敗しました。時間をおいて、もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-2xl mx-auto px-4 py-3">
        {result ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-900 leading-relaxed">
              {result.imported}件をクラウドに取り込みました。
              {result.skipped > 0 && `（すでに取り込み済みの${result.skipped}件はそのままです）`}
            </p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="shrink-0 text-sm text-amber-800 underline underline-offset-2"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-amber-900 leading-relaxed">
              この端末の無料版に <b>{local.length}件</b> の記録があります。ログイン版（クラウド）に取り込めます。
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleImport}
                disabled={busy}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 transition-colors"
              >
                {busy ? "取り込み中…" : "無料版のデータを取り込む"}
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-sm text-amber-800 underline underline-offset-2"
              >
                あとで
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </div>
    </div>
  );
}
