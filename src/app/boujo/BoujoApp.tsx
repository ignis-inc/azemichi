"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadFieldOptions, loadCropOptions, registerFieldCrop } from "../fieldCropStore";
import { trackEvent } from "../lib/analytics";

// この端末のブラウザだけに保存する（サーバーには送信しない）
const STORAGE_KEY = "azemichi-boujo-v1";

type EntryType = "農薬" | "肥料";

type Entry = {
  id: string;
  date: string;
  type: EntryType;
  field: string;
  crop: string;
  name: string;
  targetPest: string;
  amount: string; // 旧形式（自由入力）。過去データの表示のためだけに残し、新規入力では使わない
  amountQuantity: string; // 新形式：使用量の数値
  amountUnit: string; // 新形式：単位（L・kg・a・その他）
  amountUnitOther: string; // 単位が「その他」のときの単位名
  dilution: string; // 旧形式（自由入力）
  dilutionQuantity: string; // 新形式：希釈倍率の数値（単位は「倍」固定）
  applicator: string;
  memo: string;
};

// 使用量の単位（全品目共通）
const AMOUNT_UNITS = ["L", "kg", "a", "その他"];

// 表示用の使用量（新形式があればそちらを優先し、無ければ旧形式の自由入力をそのまま表示する）
function amountDisplay(e: Entry): string {
  if (e.amountQuantity.trim()) {
    const unit = e.amountUnit === "その他" ? (e.amountUnitOther || "その他") : e.amountUnit;
    return `${e.amountQuantity}${unit}`;
  }
  return e.amount;
}

// 表示用の希釈倍率（新形式があれば「◯◯倍」、無ければ旧形式の自由入力をそのまま表示する）
function dilutionDisplay(e: Entry): string {
  if (e.dilutionQuantity.trim()) {
    return `${e.dilutionQuantity}倍`;
  }
  return e.dilution;
}

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
  // 「使用量」「希釈倍率」列は表示用（新形式なら数値+単位/倍、旧形式なら自由入力）。
  // 末尾の4列は新形式データの構造化された値そのもの（再読み込み時の復元用）。
  const header = [
    "日付", "区分", "圃場", "作物", "名称", "対象病害虫", "使用量", "希釈倍率", "使用者", "メモ",
    "使用量(数値)", "使用量(単位)", "使用量(単位その他)", "希釈倍率(数値)",
  ];
  const rows = entries.map((e) => [
    e.date,
    e.type,
    e.field,
    e.crop,
    e.name,
    e.targetPest,
    amountDisplay(e),
    dilutionDisplay(e),
    e.applicator,
    e.memo,
    e.amountQuantity,
    e.amountUnit,
    e.amountUnitOther,
    e.dilutionQuantity,
  ]);
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
    const [date, typeLabel, field, crop, name, targetPest, amount, dilution, applicator, memo, amountQuantity, amountUnit, amountUnitOther, dilutionQuantity] = parseCSVLine(line);
    if (!date || !name) continue;
    result.push({
      id: crypto.randomUUID(),
      date,
      type: typeLabel === "肥料" ? "肥料" : "農薬",
      field: field ?? "",
      crop: crop ?? "",
      name: name ?? "",
      targetPest: targetPest ?? "",
      amount: amount ?? "",
      amountQuantity: amountQuantity ?? "",
      amountUnit: amountUnit ?? "",
      amountUnitOther: amountUnitOther ?? "",
      dilution: dilution ?? "",
      dilutionQuantity: dilutionQuantity ?? "",
      applicator: applicator ?? "",
      memo: memo ?? "",
    });
  }
  return result;
}

const ALL_FILTER = "";

export default function BoujoApp() {
  // /nisshi から「日付・圃場・作物・区分」を引き継いで開いた場合に読み取る
  // （例：/boujo?date=2026-07-28&field=南の畑&crop=きゅうり&type=農薬）
  const searchParams = useSearchParams();

  // dynamic(ssr:false) 経由でのみ描画されるため、初回レンダーの時点で
  // 常にブラウザ環境。lazy initializer で読み込めば effect は不要
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [date, setDate] = useState(() => searchParams.get("date") || todayISO());
  const [type, setType] = useState<EntryType>(() => {
    const t = searchParams.get("type");
    return t === "農薬" || t === "肥料" ? t : "農薬";
  });
  const [field, setField] = useState(() => searchParams.get("field") || "");
  const [crop, setCrop] = useState(() => searchParams.get("crop") || "");
  const [name, setName] = useState("");
  const [targetPest, setTargetPest] = useState("");
  const [amountQuantity, setAmountQuantity] = useState("");
  const [amountUnit, setAmountUnit] = useState("");
  const [amountUnitOther, setAmountUnitOther] = useState("");
  const [dilutionQuantity, setDilutionQuantity] = useState("");
  const [applicator, setApplicator] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldFilter, setFieldFilter] = useState(ALL_FILTER);
  const [cropFilter, setCropFilter] = useState(ALL_FILTER);
  // /boujo・/nisshi で共有する圃場名・作物名の候補（入力欄のdatalist用。フィルタ用の一覧とは別）
  const [fieldSuggestions, setFieldSuggestions] = useState<string[]>(() => loadFieldOptions());
  const [cropSuggestions, setCropSuggestions] = useState<string[]>(() => loadCropOptions());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 期間指定PDF出力用
  const [pdfStartDate, setPdfStartDate] = useState("");
  const [pdfEndDate, setPdfEndDate] = useState("");
  const [pdfErrors, setPdfErrors] = useState<Record<string, string>>({});
  const [pdfGenerating, setPdfGenerating] = useState(false);

  function handleTypeChange(next: EntryType) {
    setType(next);
    if (next === "肥料") setTargetPest("");
  }

  function addEntry() {
    const e: Record<string, string> = {};
    if (!date) e.date = "日付を入力してください";
    if (!field.trim()) e.field = "圃場を入力してください";
    if (!crop.trim()) e.crop = "作物を入力してください";
    if (!name.trim()) e.name = `${type}の名称を入力してください`;
    if (amountQuantity.trim() && !amountUnit) e.amountUnit = "単位を選択してください";
    if (amountUnit === "その他" && !amountUnitOther.trim()) e.amountUnitOther = "単位名を入力してください";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry: Entry = {
      id: crypto.randomUUID(),
      date,
      type,
      field: field.trim(),
      crop: crop.trim(),
      name: name.trim(),
      targetPest: type === "農薬" ? targetPest.trim() : "",
      amount: "", // 新規入力は数値＋単位（下記3項目）に一本化する
      amountQuantity: amountQuantity.trim(),
      amountUnit,
      amountUnitOther: amountUnitOther.trim(),
      dilution: "", // 新規入力は数値（下記1項目・単位は「倍」固定）に一本化する
      dilutionQuantity: dilutionQuantity.trim(),
      applicator: applicator.trim(),
      memo: memo.trim(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    trackEvent("record_save", "boujo");
    registerFieldCrop(entry.field, entry.crop);
    setFieldSuggestions(loadFieldOptions());
    setCropSuggestions(loadCropOptions());
    setField("");
    setCrop("");
    setName("");
    setTargetPest("");
    setAmountQuantity("");
    setAmountUnit("");
    setAmountUnitOther("");
    setDilutionQuantity("");
    setApplicator("");
    setMemo("");
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
    a.download = `あぜみち農薬肥料記録_${todayISO()}.csv`;
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
      for (const entry of imported) registerFieldCrop(entry.field, entry.crop);
      setFieldSuggestions(loadFieldOptions());
      setCropSuggestions(loadCropOptions());
    };
    reader.readAsText(file, "utf-8");
  }

  // 圃場・作物の絞り込み用の選択肢、および各入力欄の候補（記録されている値からユニークなものを抽出）
  const fieldOptions = [...new Set(entries.map((e) => e.field).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const cropOptions = [...new Set(entries.map((e) => e.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const nameOptions = [...new Set(entries.map((e) => e.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const applicatorOptions = [...new Set(entries.map((e) => e.applicator).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));

  const filteredEntries = entries.filter(
    (e) => (fieldFilter === ALL_FILTER || e.field === fieldFilter) && (cropFilter === ALL_FILTER || e.crop === cropFilter)
  );
  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

  // 現在の圃場・作物のしぼりこみ状態に、指定した期間をさらに重ねてPDFの対象を絞る
  const pdfEntries = [...filteredEntries]
    .filter((e) => (!pdfStartDate || e.date >= pdfStartDate) && (!pdfEndDate || e.date <= pdfEndDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  async function generateBoujoReportPDF() {
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
      const res = await fetch("/api/boujo-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: pdfEntries.map((entry) => ({
            date: entry.date,
            type: entry.type,
            field: entry.field,
            crop: entry.crop,
            name: entry.name,
            targetPest: entry.targetPest,
            amount: amountDisplay(entry),
            dilution: dilutionDisplay(entry),
            applicator: entry.applicator,
            memo: entry.memo,
          })),
          startDate: pdfStartDate,
          endDate: pdfEndDate,
          fieldFilter: fieldFilter === ALL_FILTER ? "" : fieldFilter,
          cropFilter: cropFilter === ALL_FILTER ? "" : cropFilter,
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
      a.download = `農薬肥料使用記録_${pdfStartDate}_${pdfEndDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("使用記録PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setPdfGenerating(false);
    }
  }

  // 今年、同じ圃場・同じ農薬を何回使ったか（基準を満たしているかの判定はしない。回数を見せるだけ）
  const nowYear = todayISO().slice(0, 4);
  const pesticideYearMap = new Map<string, { field: string; name: string; count: number }>();
  for (const e of entries) {
    if (e.type !== "農薬") continue;
    if (e.date.slice(0, 4) !== nowYear) continue;
    const key = `${e.field}__${e.name}`;
    const cur = pesticideYearMap.get(key) ?? { field: e.field, name: e.name, count: 0 };
    cur.count += 1;
    pesticideYearMap.set(key, cur);
  }
  const pesticideYearRows = [...pesticideYearMap.values()].sort(
    (a, b) => b.count - a.count || a.field.localeCompare(b.field, "ja")
  );

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";
  const radioClass = (active: boolean) =>
    `flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors ${
      active ? "border-green-500 bg-green-50" : "border-green-200 bg-white hover:border-green-400"
    }`;

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">農薬・肥料の使用を記録する</h1>
        <p className="mt-2 text-green-100 text-base">使用記録シート（無料・ログイン不要）</p>
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
          <Link href="/tool" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← あぜみちの書類作成ツールへ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 入力フォーム */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">記録する</h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="boujo-date">日付<span className="req">必須</span></label>
              <input id="boujo-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              {errors.date && <p className="text-red-600 text-base mt-2">{errors.date}</p>}
            </div>

            <div>
              <label className={labelClass}>区分<span className="req">必須</span></label>
              <div className="flex gap-4">
                <label className={`flex-1 ${radioClass(type === "農薬")}`}>
                  <input type="radio" name="boujo-type" checked={type === "農薬"} onChange={() => handleTypeChange("農薬")} className="w-5 h-5 accent-green-600" />
                  <span className="text-lg">農薬</span>
                </label>
                <label className={`flex-1 ${radioClass(type === "肥料")}`}>
                  <input type="radio" name="boujo-type" checked={type === "肥料"} onChange={() => handleTypeChange("肥料")} className="w-5 h-5 accent-green-600" />
                  <span className="text-lg">肥料</span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-field">圃場<span className="req">必須</span></label>
              <input id="boujo-field" type="text" list="boujo-field-list" value={field} onChange={(e) => setField(e.target.value)} placeholder="例：南の畑" className={inputClass} />
              <datalist id="boujo-field-list">
                {fieldSuggestions.map((f) => (<option key={f} value={f} />))}
              </datalist>
              {errors.field && <p className="text-red-600 text-base mt-2">{errors.field}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-crop">作物<span className="req">必須</span></label>
              <input id="boujo-crop" type="text" list="boujo-crop-list" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="例：トマト" className={inputClass} />
              <datalist id="boujo-crop-list">
                {cropSuggestions.map((c) => (<option key={c} value={c} />))}
              </datalist>
              {errors.crop && <p className="text-red-600 text-base mt-2">{errors.crop}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-name">{type}の名称<span className="req">必須</span></label>
              <input id="boujo-name" type="text" list="boujo-name-list" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "農薬" ? "例：〇〇water水和剤" : "例：化成肥料〇〇号"} className={inputClass} />
              <datalist id="boujo-name-list">
                {nameOptions.map((n) => (<option key={n} value={n} />))}
              </datalist>
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>

            {type === "農薬" && (
              <div>
                <label className={labelClass} htmlFor="boujo-target">対象病害虫</label>
                <input id="boujo-target" type="text" value={targetPest} onChange={(e) => setTargetPest(e.target.value)} placeholder="例：アブラムシ" className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="boujo-amount-quantity">使用量</label>
              <div className="flex gap-3">
                <input
                  id="boujo-amount-quantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={amountQuantity}
                  onChange={(e) => setAmountQuantity(e.target.value)}
                  placeholder="例：100"
                  className={`${inputClass} flex-1`}
                />
                <select
                  id="boujo-amount-unit"
                  aria-label="使用量の単位"
                  value={amountUnit}
                  onChange={(e) => setAmountUnit(e.target.value)}
                  className={inputClass}
                  style={{ maxWidth: "9.5rem" }}
                >
                  <option value="">単位を選択</option>
                  {AMOUNT_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              {errors.amountUnit && <p className="text-red-600 text-base mt-2">{errors.amountUnit}</p>}
              {amountUnit === "その他" && (
                <div className="mt-3">
                  <label className={labelClass} htmlFor="boujo-amount-unit-other">単位名</label>
                  <input
                    id="boujo-amount-unit-other"
                    type="text"
                    value={amountUnitOther}
                    onChange={(e) => setAmountUnitOther(e.target.value)}
                    placeholder="例：袋"
                    className={inputClass}
                  />
                  {errors.amountUnitOther && <p className="text-red-600 text-base mt-2">{errors.amountUnitOther}</p>}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">単位面積あたりの使用量、または施肥量を入力してください。</p>
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-dilution-quantity">希釈倍率</label>
              <div className="flex items-center gap-3">
                <input
                  id="boujo-dilution-quantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={dilutionQuantity}
                  onChange={(e) => setDilutionQuantity(e.target.value)}
                  placeholder="例：1000"
                  className={`${inputClass} flex-1`}
                />
                <span className="text-lg text-gray-600 whitespace-nowrap">倍</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">薄めて使う農薬・液肥のときに入力してください。</p>
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-applicator">使用者</label>
              <input id="boujo-applicator" type="text" list="boujo-applicator-list" value={applicator} onChange={(e) => setApplicator(e.target.value)} placeholder="例：山田太郎" className={inputClass} />
              <datalist id="boujo-applicator-list">
                {applicatorOptions.map((a) => (<option key={a} value={a} />))}
              </datalist>
            </div>

            <div>
              <label className={labelClass} htmlFor="boujo-memo">メモ</label>
              <input id="boujo-memo" type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例：JAで購入" className={inputClass} />
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

        {/* 集計 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-2 pb-2 border-b-2 border-green-200">今年の農薬 使用回数</h2>
          <p className="text-sm text-gray-500 mb-4">
            同じ圃場・同じ農薬を今年（{nowYear}年）これまで何回使ったかを数えています。回数の基準を満たしているかはご自身でご確認ください。
          </p>
          {pesticideYearRows.length === 0 ? (
            <p className="text-base text-gray-500">まだ今年の農薬の記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">圃場</th>
                    <th className="p-2 border border-green-100 text-sm">農薬名</th>
                    <th className="p-2 border border-green-100 text-sm text-right">今年の回数</th>
                  </tr>
                </thead>
                <tbody>
                  {pesticideYearRows.map((row) => (
                    <tr key={`${row.field}__${row.name}`}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.field}</td>
                      <td className="p-2 border border-green-100 text-sm">{row.name}</td>
                      <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{row.count}回</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 一覧 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">記録一覧</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClass} htmlFor="boujo-filter-field">圃場でしぼりこむ</label>
              <select id="boujo-filter-field" value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} className={inputClass}>
                <option value={ALL_FILTER}>すべて</option>
                {fieldOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="boujo-filter-crop">作物でしぼりこむ</label>
              <select id="boujo-filter-crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className={inputClass}>
                <option value={ALL_FILTER}>すべて</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 期間指定PDF出力（上の圃場・作物のしぼりこみと組み合わせて使う） */}
          <div className="border-2 border-green-200 rounded-xl p-4 mb-5 bg-green-50/40">
            <p className="text-base font-bold text-green-800 mb-3">指定期間の記録をPDFに出力する</p>
            <p className="text-sm text-gray-600 mb-4">
              上の「圃場・作物でしぼりこむ」の設定と、ここで指定する期間の両方に合う記録だけがPDFになります。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass} htmlFor="boujo-pdf-start">開始日<span className="req">必須</span></label>
                <input id="boujo-pdf-start" type="date" value={pdfStartDate} onChange={(e) => setPdfStartDate(e.target.value)} className={inputClass} />
                {pdfErrors.pdfStartDate && <p className="text-red-600 text-base mt-2">{pdfErrors.pdfStartDate}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="boujo-pdf-end">終了日<span className="req">必須</span></label>
                <input id="boujo-pdf-end" type="date" value={pdfEndDate} onChange={(e) => setPdfEndDate(e.target.value)} className={inputClass} />
                {pdfErrors.pdfEndDate && <p className="text-red-600 text-base mt-2">{pdfErrors.pdfEndDate}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">対象件数：{pdfEntries.length}件</p>
            <button
              onClick={generateBoujoReportPDF}
              disabled={pdfGenerating}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-md transition-colors"
            >
              {pdfGenerating ? "PDF作成中…" : "PDFを作成する"}
            </button>
          </div>

          {sortedEntries.length === 0 ? (
            <p className="text-base text-gray-500">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">日付</th>
                    <th className="p-2 border border-green-100 text-sm">区分</th>
                    <th className="p-2 border border-green-100 text-sm">圃場</th>
                    <th className="p-2 border border-green-100 text-sm">作物</th>
                    <th className="p-2 border border-green-100 text-sm">名称</th>
                    <th className="p-2 border border-green-100 text-sm">対象病害虫</th>
                    <th className="p-2 border border-green-100 text-sm">使用量</th>
                    <th className="p-2 border border-green-100 text-sm">希釈倍率</th>
                    <th className="p-2 border border-green-100 text-sm">使用者</th>
                    <th className="p-2 border border-green-100 text-sm">メモ</th>
                    <th className="p-2 border border-green-100 text-sm"><span className="sr-only">操作</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.date}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <span className={e.type === "農薬" ? "text-rose-700 font-bold" : "text-green-700 font-bold"}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.field}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.crop}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.name}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.targetPest}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{amountDisplay(e)}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{dilutionDisplay(e)}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.applicator}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.memo}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <button onClick={() => deleteEntry(e.id)} className="text-rose-600 underline text-sm" aria-label={`${e.date}の${e.name}の記録を削除`}>
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
          このツールは、農薬・肥料の使用を記録するための補助ツールです。収穫前日数や年間使用回数などの基準を満たしているかどうかの判断はご自身で行ってください。あぜみちは基準への適合を保証するものではありません。
        </p>
      </main>
    </div>
  );
}
