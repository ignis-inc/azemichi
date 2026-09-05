"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "../lib/analytics";

// この端末のブラウザだけに保存する（サーバーには送信しない）
const STORAGE_KEY = "azemichi-higai-v1";

const DAMAGE_TYPES = ["倒伏", "冠水", "落果", "施設損壊", "その他"];

type Entry = {
  id: string;
  date: string; // 発生日
  target: string; // 対象の作物・ほ場
  damageType: string; // 被害の種類
  extent: string; // 被害の程度・面積
  memo: string;
  photoNote: string; // 写真のファイル名やメモ（実物の写真は保存しない）
};

function todayISO(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// このコンポーネントは next/dynamic({ ssr: false }) 経由でのみ描画される（常にブラウザ環境）
function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // 容量超過等は静かに無視する（記録の継続利用を優先し、以降の操作は妨げない）
  }
}

function escapeCSV(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function toCSV(entries: Entry[]): string {
  const header = ["発生日", "対象の作物・ほ場", "被害の種類", "被害の程度・面積", "メモ", "写真メモ"];
  const rows = entries.map((e) => [e.date, e.target, e.damageType, e.extent, e.memo, e.photoNote]);
  return [header, ...rows].map((cols) => cols.map(escapeCSV).join(",")).join("\r\n");
}

// ダブルクォートで囲まれたカンマ・引用符（""でエスケープ）を含むCSVの1行を分解する
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1;
      let value = "";
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { value += '"'; j += 2; continue; }
        if (line[j] === '"') { j++; break; }
        value += line[j]; j++;
      }
      result.push(value);
      i = j + 1;
    } else {
      let j = line.indexOf(",", i);
      if (j === -1) j = line.length;
      result.push(line.slice(i, j));
      i = j + 1;
    }
  }
  return result;
}

function parseCSV(text: string): Entry[] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = clean.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  const rows = lines.slice(1); // ヘッダー行を除く
  const result: Entry[] = [];
  for (const line of rows) {
    const [date, target, damageType, extent, memo, photoNote] = parseCSVLine(line);
    if (!date || !target) continue;
    result.push({
      id: crypto.randomUUID(),
      date,
      target: target ?? "",
      damageType: damageType ?? "",
      extent: extent ?? "",
      memo: memo ?? "",
      photoNote: photoNote ?? "",
    });
  }
  return result;
}

const ALL_FILTER = "";

export default function HigaiApp() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [date, setDate] = useState(todayISO());
  const [target, setTarget] = useState("");
  const [damageType, setDamageType] = useState("");
  const [extent, setExtent] = useState("");
  const [memo, setMemo] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [damageTypeFilter, setDamageTypeFilter] = useState(ALL_FILTER);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 期間指定PDF出力用
  const [pdfStartDate, setPdfStartDate] = useState("");
  const [pdfEndDate, setPdfEndDate] = useState("");
  const [pdfErrors, setPdfErrors] = useState<Record<string, string>>({});
  const [pdfGenerating, setPdfGenerating] = useState(false);

  function addEntry() {
    const e: Record<string, string> = {};
    if (!date) e.date = "発生日を入力してください";
    if (!target.trim()) e.target = "対象の作物・ほ場を入力してください";
    if (!damageType) e.damageType = "被害の種類を選択してください";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry: Entry = {
      id: crypto.randomUUID(),
      date,
      target: target.trim(),
      damageType,
      extent: extent.trim(),
      memo: memo.trim(),
      photoNote: photoNote.trim(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    trackEvent("record_save_free", "higai");
    setTarget("");
    setDamageType("");
    setExtent("");
    setMemo("");
    setPhotoNote("");
  }

  function deleteEntry(id: string) {
    if (!window.confirm("この記録を削除します。よろしいですか？")) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  function exportCSV() {
    const csv = String.fromCharCode(0xfeff) + toCSV(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `あぜみち被害記録_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const imported = parseCSV(text);
      if (imported.length === 0) {
        alert("読み込めるデータが見つかりませんでした。あぜみちで書き出したCSVファイルをお使いください。");
        return;
      }
      if (!window.confirm(`現在のデータを、読み込んだ ${imported.length} 件のデータで置き換えます。よろしいですか？`)) {
        return;
      }
      setEntries(imported);
      saveEntries(imported);
    };
    reader.readAsText(file, "utf-8");
  }

  // 被害の種類の絞り込み用の選択肢（記録されている値からユニークなものを抽出）
  const damageTypeOptions = [...new Set(entries.map((e) => e.damageType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));

  const filteredEntries = entries.filter(
    (e) => damageTypeFilter === ALL_FILTER || e.damageType === damageTypeFilter
  );
  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

  // 現在の絞り込み状態に、指定した期間をさらに重ねてPDFの対象を絞る
  const pdfEntries = [...filteredEntries]
    .filter((e) => (!pdfStartDate || e.date >= pdfStartDate) && (!pdfEndDate || e.date <= pdfEndDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  async function generateHigaiReportPDF() {
    const e: Record<string, string> = {};
    if (!pdfStartDate) e.pdfStartDate = "開始日を入力してください";
    if (!pdfEndDate) e.pdfEndDate = "終了日を入力してください";
    if (pdfStartDate && pdfEndDate && pdfStartDate > pdfEndDate) {
      e.pdfEndDate = "終了日は開始日より後の日付にしてください";
    }
    setPdfErrors(e);
    if (Object.keys(e).length > 0) return;

    setPdfGenerating(true);
    try {
      const res = await fetch("/api/higai-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: pdfEntries.map((entry) => ({
            date: entry.date,
            target: entry.target,
            damageType: entry.damageType,
            extent: entry.extent,
            memo: entry.memo,
            photoNote: entry.photoNote,
          })),
          startDate: pdfStartDate,
          endDate: pdfEndDate,
          damageTypeFilter: damageTypeFilter === ALL_FILTER ? "" : damageTypeFilter,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `サーバーエラー (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `被害記録一覧_${pdfStartDate}_${pdfEndDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("被害記録PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setPdfGenerating(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">被害を記録する</h1>
        <p className="mt-2 text-green-100 text-base">被害記録（無料・ログイン不要）</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4">
          <p className="text-base font-bold text-yellow-900 leading-relaxed">
            このデータはこの端末のこのブラウザだけに保存されます。
          </p>
          <p className="text-sm text-yellow-800 leading-relaxed mt-1">
            ブラウザのデータ削除や機種変更で消えてしまいます。定期的に「ファイルに保存する」からバックアップしてください。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/kiroku" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← 記録する一覧へ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 入力フォーム */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">記録する</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="higai-date">発生日<span className="req">必須</span></label>
              <input id="higai-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              {errors.date && <p className="text-red-600 text-base mt-2">{errors.date}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="higai-target">対象の作物・ほ場<span className="req">必須</span></label>
              <input id="higai-target" type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="例：南の畑のトマト" className={inputClass} />
              {errors.target && <p className="text-red-600 text-base mt-2">{errors.target}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="higai-damagetype">被害の種類<span className="req">必須</span></label>
              <select id="higai-damagetype" value={damageType} onChange={(e) => setDamageType(e.target.value)} className={inputClass}>
                <option value="">選択してください</option>
                {DAMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.damageType && <p className="text-red-600 text-base mt-2">{errors.damageType}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="higai-extent">被害の程度・面積</label>
              <input id="higai-extent" type="text" value={extent} onChange={(e) => setExtent(e.target.value)} placeholder="例：ほ場の半分ほどが冠水" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="higai-memo">メモ</label>
              <textarea
                id="higai-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="気づいたことを自由に記録してください"
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="higai-photo">写真のファイル名・メモ</label>
              <input
                id="higai-photo"
                type="text"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="例：IMG_0012.jpg（スマホのアルバムに保存済み）"
                className={inputClass}
              />
              <p className="text-sm text-gray-500 mt-1">
                写真そのものは保存できません。ファイル名や保存場所のメモだけを残せます。
              </p>
            </div>

            <button
              onClick={addEntry}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xl font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors"
            >
              記録する
            </button>
          </div>
        </section>

        {/* バックアップ */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">バックアップ</h2>
          <div className="space-y-4">
            <div>
              <button
                onClick={exportCSV}
                disabled={entries.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-md transition-colors"
              >
                ファイルに保存する（CSV）
              </button>
              <p className="text-sm text-gray-500 mt-2">
                入力したデータをファイルとして書き出します。機種変更のときや、もしものときのために保管してください。
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importCSV(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg font-bold py-4 px-6 rounded-2xl shadow-sm transition-colors"
              >
                ファイルから読み込む（CSV）
              </button>
              <p className="text-sm text-gray-500 mt-2">
                以前あぜみちで書き出したCSVファイルを選ぶと、そのときのデータに置き換わります（現在のデータは上書きされます）。
              </p>
            </div>
          </div>
        </section>

        {/* 一覧 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">記録一覧</h2>

          <div className="mb-5">
            <label className={labelClass} htmlFor="higai-filter-damagetype">被害の種類でしぼりこむ</label>
            <select id="higai-filter-damagetype" value={damageTypeFilter} onChange={(e) => setDamageTypeFilter(e.target.value)} className={inputClass}>
              <option value={ALL_FILTER}>すべて</option>
              {damageTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 期間指定PDF出力（上の絞り込みと組み合わせて使う） */}
          <div className="border-2 border-green-200 rounded-xl p-4 mb-5 bg-green-50/40">
            <p className="text-base font-bold text-green-800 mb-3">指定期間の記録を「被害記録一覧」としてPDFに出力する</p>
            <p className="text-sm text-gray-600 mb-4">
              上の「被害の種類でしぼりこむ」の設定と、ここで指定する期間の両方に合う記録だけがPDFになります。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass} htmlFor="higai-pdf-start">開始日<span className="req">必須</span></label>
                <input id="higai-pdf-start" type="date" value={pdfStartDate} onChange={(e) => setPdfStartDate(e.target.value)} className={inputClass} />
                {pdfErrors.pdfStartDate && <p className="text-red-600 text-base mt-2">{pdfErrors.pdfStartDate}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="higai-pdf-end">終了日<span className="req">必須</span></label>
                <input id="higai-pdf-end" type="date" value={pdfEndDate} onChange={(e) => setPdfEndDate(e.target.value)} className={inputClass} />
                {pdfErrors.pdfEndDate && <p className="text-red-600 text-base mt-2">{pdfErrors.pdfEndDate}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">対象件数：{pdfEntries.length}件</p>
            <button
              onClick={generateHigaiReportPDF}
              disabled={pdfGenerating}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-md transition-colors"
            >
              {pdfGenerating ? "PDF作成中…" : "PDFを作成する"}
            </button>
            <p className="text-xs text-gray-500 leading-relaxed mt-3">
              ※本書類は記録用です。正式なり災証明・共済金請求については、共済組合または市区町村にご確認ください。
            </p>
          </div>

          {sortedEntries.length === 0 ? (
            <p className="text-base text-gray-500">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">発生日</th>
                    <th className="p-2 border border-green-100 text-sm">対象の作物・ほ場</th>
                    <th className="p-2 border border-green-100 text-sm">被害の種類</th>
                    <th className="p-2 border border-green-100 text-sm">被害の程度・面積</th>
                    <th className="p-2 border border-green-100 text-sm">メモ</th>
                    <th className="p-2 border border-green-100 text-sm">写真メモ</th>
                    <th className="p-2 border border-green-100 text-sm"><span className="sr-only">操作</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.date}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.target}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.damageType}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.extent}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.memo}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.photoNote}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <button onClick={() => deleteEntry(e.id)} className="text-rose-600 underline text-sm" aria-label={`${e.date}の${e.damageType}の記録を削除`}>
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このツールは、台風・大雨・獣害などの被害を記録・振り返るための補助ツールです。本書類は記録用であり、正式なり災証明・共済金請求とは異なります。り災証明の申請や共済金の請求については、共済組合または市区町村にご確認ください。
        </p>
      </main>
    </div>
  );
}
