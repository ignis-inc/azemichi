"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { loadFieldOptions, loadCropOptions, registerFieldCrop } from "../fieldCropStore";

// この端末のブラウザだけに保存する（サーバーには送信しない）
const STORAGE_KEY = "azemichi-nisshi-v1";

type Entry = {
  id: string;
  date: string;
  field: string;
  crop: string;
  weather: string;
  temperature: string;
  workType: string;
  workTime: string;
  harvestAmount: string; // 旧形式（自由入力）。過去データの表示のためだけに残し、新規入力では使わない
  harvestQuantity: string; // 新形式：収穫量の数値
  harvestUnit: string; // 新形式：単位（kg・箱・個・俵・袋・その他）
  harvestUnitOther: string; // 単位が「その他」のときの単位名
  worker: string;
  memo: string;
};

const WEATHER_SUGGESTIONS = ["晴れ", "曇り", "雨", "雪", "晴れのち曇り", "曇りのち雨", "雨のち晴れ"];
const WORK_TYPE_SUGGESTIONS = ["種まき", "定植", "施肥", "防除", "除草", "潅水", "収穫", "片付け・その他"];

// 収穫量の単位（全品目共通）。
// 将来的な拡張候補：品目（crop）ごとに単位の選択肢を出し分ける（例：米→俵・kg、野菜→箱・kg）。
// 今回は品目との連携は見送り、全品目共通のリストで統一する。
const HARVEST_UNITS = ["kg", "箱", "個", "俵", "袋", "その他"];

// 年間サマリーの「収穫量の合計」機能を追加した日（注記の表示に使う）
const HARVEST_STRUCTURED_SINCE_LABEL = "2026年8月6日";

// 表示用の収穫量（新形式があればそちらを優先し、無ければ旧形式の自由入力をそのまま表示する）
function harvestDisplay(e: Entry): string {
  if (e.harvestQuantity.trim()) {
    const unit = e.harvestUnit === "その他" ? (e.harvestUnitOther || "その他") : e.harvestUnit;
    return `${e.harvestQuantity}${unit}`;
  }
  return e.harvestAmount;
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
  // 「収穫量」列は表示用（新形式なら数値+単位、旧形式なら自由入力）。
  // 末尾の3列は新形式データの構造化された値そのもの（再読み込み時の復元用）。
  const header = ["日付", "圃場", "作物", "天候", "気温", "作業内容", "作業時間", "収穫量", "作業者", "メモ", "収穫量(数値)", "収穫量(単位)", "収穫量(単位その他)"];
  const rows = entries.map((e) => [
    e.date,
    e.field,
    e.crop,
    e.weather,
    e.temperature,
    e.workType,
    e.workTime,
    harvestDisplay(e),
    e.worker,
    e.memo,
    e.harvestQuantity,
    e.harvestUnit,
    e.harvestUnitOther,
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
    const [date, field, crop, weather, temperature, workType, workTime, harvestAmount, worker, memo, harvestQuantity, harvestUnit, harvestUnitOther] = parseCSVLine(line);
    if (!date || !workType) continue;
    result.push({
      id: crypto.randomUUID(),
      date,
      field: field ?? "",
      crop: crop ?? "",
      weather: weather ?? "",
      temperature: temperature ?? "",
      workType: workType ?? "",
      workTime: workTime ?? "",
      harvestAmount: harvestAmount ?? "",
      harvestQuantity: harvestQuantity ?? "",
      harvestUnit: harvestUnit ?? "",
      harvestUnitOther: harvestUnitOther ?? "",
      worker: worker ?? "",
      memo: memo ?? "",
    });
  }
  return result;
}

const ALL_FILTER = "";

// 「防除」「施肥」を選んだときに /boujo への案内を出すための判定
function needsBoujoHint(workType: string): boolean {
  return workType.includes("防除") || workType.includes("施肥");
}

// 作業内容から /boujo の区分（農薬・肥料）を推測する。どちらでもなければ引き継がない
function boujoTypeFromWorkType(workType: string): "農薬" | "肥料" | undefined {
  if (workType.includes("防除")) return "農薬";
  if (workType.includes("施肥")) return "肥料";
  return undefined;
}

// 日付・圃場・作物・区分のうち、値が入っている項目だけをクエリパラメータとして引き継ぐ
function buildBoujoHref(date: string, field: string, crop: string, workType: string): string {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (field.trim()) params.set("field", field.trim());
  if (crop.trim()) params.set("crop", crop.trim());
  const type = boujoTypeFromWorkType(workType);
  if (type) params.set("type", type);
  const qs = params.toString();
  return qs ? `/boujo?${qs}` : "/boujo";
}

export default function NisshiApp() {
  // dynamic(ssr:false) 経由でのみ描画されるため、初回レンダーの時点で
  // 常にブラウザ環境。lazy initializer で読み込めば effect は不要
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [date, setDate] = useState(todayISO());
  const [field, setField] = useState("");
  const [crop, setCrop] = useState("");
  const [weather, setWeather] = useState("");
  const [temperature, setTemperature] = useState("");
  const [workType, setWorkType] = useState("");
  const [workTime, setWorkTime] = useState("");
  const [harvestQuantity, setHarvestQuantity] = useState("");
  const [harvestUnit, setHarvestUnit] = useState("");
  const [harvestUnitOther, setHarvestUnitOther] = useState("");
  const [worker, setWorker] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldFilter, setFieldFilter] = useState(ALL_FILTER);
  const [cropFilter, setCropFilter] = useState(ALL_FILTER);
  const [workTypeFilter, setWorkTypeFilter] = useState(ALL_FILTER);
  const [summaryYear, setSummaryYear] = useState(todayISO().slice(0, 4));
  // /boujo・/nisshi で共有する圃場名・作物名の候補（入力欄のdatalist用。フィルタ用の一覧とは別）
  const [fieldSuggestions, setFieldSuggestions] = useState<string[]>(() => loadFieldOptions());
  const [cropSuggestions, setCropSuggestions] = useState<string[]>(() => loadCropOptions());
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addEntry() {
    const e: Record<string, string> = {};
    if (!date) e.date = "日付を入力してください";
    if (!field.trim()) e.field = "圃場を入力してください";
    if (!crop.trim()) e.crop = "作物を入力してください";
    if (!workType.trim()) e.workType = "作業内容を入力してください";
    if (harvestQuantity.trim() && !harvestUnit) e.harvestUnit = "単位を選択してください";
    if (harvestUnit === "その他" && !harvestUnitOther.trim()) e.harvestUnitOther = "単位名を入力してください";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry: Entry = {
      id: crypto.randomUUID(),
      date,
      field: field.trim(),
      crop: crop.trim(),
      weather: weather.trim(),
      temperature: temperature.trim(),
      workType: workType.trim(),
      workTime: workTime.trim(),
      harvestAmount: "", // 新規入力は数値＋単位（下記3項目）に一本化する
      harvestQuantity: harvestQuantity.trim(),
      harvestUnit,
      harvestUnitOther: harvestUnitOther.trim(),
      worker: worker.trim(),
      memo: memo.trim(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    registerFieldCrop(entry.field, entry.crop);
    setFieldSuggestions(loadFieldOptions());
    setCropSuggestions(loadCropOptions());
    setField("");
    setCrop("");
    setWeather("");
    setTemperature("");
    setWorkType("");
    setWorkTime("");
    setHarvestQuantity("");
    setHarvestUnit("");
    setHarvestUnitOther("");
    setWorker("");
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
    a.download = `あぜみち農作業日誌_${todayISO()}.csv`;
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

  // 圃場・作物・作業内容の絞り込み用の選択肢、および入力欄の候補（記録されている値からユニークなものを抽出）
  const fieldOptions = [...new Set(entries.map((e) => e.field).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const cropOptions = [...new Set(entries.map((e) => e.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const workTypeOptions = [...new Set(entries.map((e) => e.workType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const workerOptions = [...new Set(entries.map((e) => e.worker).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));

  const filteredEntries = entries.filter(
    (e) =>
      (fieldFilter === ALL_FILTER || e.field === fieldFilter) &&
      (cropFilter === ALL_FILTER || e.crop === cropFilter) &&
      (workTypeFilter === ALL_FILTER || e.workType === workTypeFilter)
  );
  const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

  // 年間サマリー：対象の年の選択肢（記録がある年＋今年）
  const summaryYearOptions = [...new Set([...entries.map((e) => e.date.slice(0, 4)), todayISO().slice(0, 4)])]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  // 選んだ年の記録だけを対象にする
  const yearEntries = entries.filter((e) => e.date.slice(0, 4) === summaryYear);

  // 作業内容ごとの月別件数
  const workTypesInYear = [...new Set(yearEntries.map((e) => e.workType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
  const monthlyWorkTypeCounts = workTypesInYear.map((wt) => {
    const counts = Array.from({ length: 12 }, () => 0);
    for (const e of yearEntries) {
      if (e.workType !== wt) continue;
      const month = Number(e.date.slice(5, 7));
      if (month >= 1 && month <= 12) counts[month - 1] += 1;
    }
    const total = counts.reduce((sum, c) => sum + c, 0);
    return { workType: wt, counts, total };
  });

  // 圃場ごと・作物ごとの作業日数（延べ回数。同じ日に複数記録があれば複数として数える）
  const fieldWorkCounts = [...new Set(yearEntries.map((e) => e.field).filter(Boolean))]
    .map((f) => ({ name: f, count: yearEntries.filter((e) => e.field === f).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
  const cropWorkCounts = [...new Set(yearEntries.map((e) => e.crop).filter(Boolean))]
    .map((c) => ({ name: c, count: yearEntries.filter((e) => e.crop === c).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));

  // 収穫記録の一覧（時系列順。新形式・旧形式どちらの記録も表示するが、合計は新形式のみで別途計算する）
  const harvestEntries = yearEntries
    .filter((e) => e.harvestAmount.trim() !== "" || e.harvestQuantity.trim() !== "")
    .sort((a, b) => a.date.localeCompare(b.date));

  // 収穫量の合計（新形式＝数値＋単位で入力された記録のみが対象。作物・単位ごとに集計する。
  // 単位が異なるものは合算できないため、作物×単位の組み合わせごとに分けて合計する）
  const harvestTotals = (() => {
    const map = new Map<string, { crop: string; unit: string; total: number }>();
    for (const e of yearEntries) {
      const qty = Number(e.harvestQuantity);
      if (!e.harvestQuantity.trim() || !Number.isFinite(qty) || qty <= 0) continue;
      if (!e.harvestUnit) continue;
      const unitLabel = e.harvestUnit === "その他" ? (e.harvestUnitOther || "その他") : e.harvestUnit;
      const key = `${e.crop}__${unitLabel}`;
      const cur = map.get(key) ?? { crop: e.crop, unit: unitLabel, total: 0 };
      cur.total += qty;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => a.crop.localeCompare(b.crop, "ja") || a.unit.localeCompare(b.unit, "ja"));
  })();

  // 月ごとの記録日数（同じ日に複数記録があっても1日として数える）
  const monthlyRecordDays = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const dates = new Set(
      yearEntries.filter((e) => Number(e.date.slice(5, 7)) === month).map((e) => e.date)
    );
    return { month, days: dates.size };
  });

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">日々の作業を記録する</h1>
        <p className="mt-2 text-green-100 text-base">農作業日誌（無料・ログイン不要）</p>
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
              <label className={labelClass} htmlFor="nisshi-date">日付<span className="req">必須</span></label>
              <input id="nisshi-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              {errors.date && <p className="text-red-600 text-base mt-2">{errors.date}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-field">圃場<span className="req">必須</span></label>
              <input id="nisshi-field" type="text" list="nisshi-field-list" value={field} onChange={(e) => setField(e.target.value)} placeholder="例：南の畑" className={inputClass} />
              <datalist id="nisshi-field-list">
                {fieldSuggestions.map((f) => (<option key={f} value={f} />))}
              </datalist>
              {errors.field && <p className="text-red-600 text-base mt-2">{errors.field}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-crop">作物<span className="req">必須</span></label>
              <input id="nisshi-crop" type="text" list="nisshi-crop-list" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="例：トマト" className={inputClass} />
              <datalist id="nisshi-crop-list">
                {cropSuggestions.map((c) => (<option key={c} value={c} />))}
              </datalist>
              {errors.crop && <p className="text-red-600 text-base mt-2">{errors.crop}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-weather">天候</label>
              <input id="nisshi-weather" type="text" list="nisshi-weather-list" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="例：晴れ" className={inputClass} />
              <datalist id="nisshi-weather-list">
                {WEATHER_SUGGESTIONS.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-temperature">気温</label>
              <input id="nisshi-temperature" type="text" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="例：28℃" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-worktype">作業内容<span className="req">必須</span></label>
              <input id="nisshi-worktype" type="text" list="nisshi-worktype-list" value={workType} onChange={(e) => setWorkType(e.target.value)} placeholder="例：防除" className={inputClass} />
              <datalist id="nisshi-worktype-list">
                {WORK_TYPE_SUGGESTIONS.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
              {errors.workType && <p className="text-red-600 text-base mt-2">{errors.workType}</p>}
              {needsBoujoHint(workType) && (
                <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                  農薬・肥料の使用は、記録専用のツール（
                  <Link href={buildBoujoHref(date, field, crop, workType)} className="underline underline-offset-2 font-bold hover:text-green-900">
                    /boujo
                  </Link>
                  ）にも記録しておくと安心です。
                </p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-worktime">作業時間</label>
              <input id="nisshi-worktime" type="text" value={workTime} onChange={(e) => setWorkTime(e.target.value)} placeholder="例：9:00〜11:30" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-harvest-quantity">収穫量</label>
              <div className="flex gap-3">
                <input
                  id="nisshi-harvest-quantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={harvestQuantity}
                  onChange={(e) => setHarvestQuantity(e.target.value)}
                  placeholder="例：20"
                  className={`${inputClass} flex-1`}
                />
                <select
                  id="nisshi-harvest-unit"
                  aria-label="収穫量の単位"
                  value={harvestUnit}
                  onChange={(e) => setHarvestUnit(e.target.value)}
                  className={inputClass}
                  style={{ maxWidth: "9.5rem" }}
                >
                  <option value="">単位を選択</option>
                  {HARVEST_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              {errors.harvestUnit && <p className="text-red-600 text-base mt-2">{errors.harvestUnit}</p>}
              {harvestUnit === "その他" && (
                <div className="mt-3">
                  <label className={labelClass} htmlFor="nisshi-harvest-unit-other">単位名</label>
                  <input
                    id="nisshi-harvest-unit-other"
                    type="text"
                    value={harvestUnitOther}
                    onChange={(e) => setHarvestUnitOther(e.target.value)}
                    placeholder="例：束"
                    className={inputClass}
                  />
                  {errors.harvestUnitOther && <p className="text-red-600 text-base mt-2">{errors.harvestUnitOther}</p>}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">収穫作業のときに入力してください。他の作業では空欄で構いません。</p>
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-worker">作業者</label>
              <input id="nisshi-worker" type="text" list="nisshi-worker-list" value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="例：山田太郎" className={inputClass} />
              <datalist id="nisshi-worker-list">
                {workerOptions.map((w) => (<option key={w} value={w} />))}
              </datalist>
            </div>

            <div>
              <label className={labelClass} htmlFor="nisshi-memo">気づいたこと・メモ</label>
              <input id="nisshi-memo" type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例：来年は畝を広めに" className={inputClass} />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelClass} htmlFor="nisshi-filter-field">圃場でしぼりこむ</label>
              <select id="nisshi-filter-field" value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} className={inputClass}>
                <option value={ALL_FILTER}>すべて</option>
                {fieldOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="nisshi-filter-crop">作物でしぼりこむ</label>
              <select id="nisshi-filter-crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} className={inputClass}>
                <option value={ALL_FILTER}>すべて</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="nisshi-filter-worktype">作業内容でしぼりこむ</label>
              <select id="nisshi-filter-worktype" value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className={inputClass}>
                <option value={ALL_FILTER}>すべて</option>
                {workTypeOptions.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {sortedEntries.length === 0 ? (
            <p className="text-base text-gray-500">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">日付</th>
                    <th className="p-2 border border-green-100 text-sm">圃場</th>
                    <th className="p-2 border border-green-100 text-sm">作物</th>
                    <th className="p-2 border border-green-100 text-sm">天候</th>
                    <th className="p-2 border border-green-100 text-sm">気温</th>
                    <th className="p-2 border border-green-100 text-sm">作業内容</th>
                    <th className="p-2 border border-green-100 text-sm">作業時間</th>
                    <th className="p-2 border border-green-100 text-sm">収穫量</th>
                    <th className="p-2 border border-green-100 text-sm">作業者</th>
                    <th className="p-2 border border-green-100 text-sm">メモ</th>
                    <th className="p-2 border border-green-100 text-sm"><span className="sr-only">操作</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.date}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.field}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.crop}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.weather}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.temperature}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.workType}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.workTime}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{harvestDisplay(e)}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.worker}</td>
                      <td className="p-2 border border-green-100 text-sm">{e.memo}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <button onClick={() => deleteEntry(e.id)} className="text-rose-600 underline text-sm" aria-label={`${e.date}の${e.workType}の記録を削除`}>
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

        {/* 年間サマリー */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">年間サマリー</h2>

          <div className="mb-5">
            <label className={labelClass} htmlFor="nisshi-summary-year">対象の年</label>
            <select id="nisshi-summary-year" value={summaryYear} onChange={(e) => setSummaryYear(e.target.value)} className={inputClass}>
              {summaryYearOptions.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>

          {yearEntries.length === 0 ? (
            <p className="text-base text-gray-500">{summaryYear}年の記録がありません</p>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-700 mb-2">作業内容ごとの月別件数</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="p-2 border border-green-100 text-sm">作業内容</th>
                      {Array.from({ length: 12 }, (_, i) => (
                        <th key={i} className="p-2 border border-green-100 text-sm text-right">{i + 1}月</th>
                      ))}
                      <th className="p-2 border border-green-100 text-sm text-right">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyWorkTypeCounts.map((row) => (
                      <tr key={row.workType}>
                        <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.workType}</td>
                        {row.counts.map((c, i) => (
                          <td key={i} className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{c > 0 ? `${c}回` : "－"}</td>
                        ))}
                        <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{row.total}回</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-bold text-gray-700 mb-2">圃場ごとの作業日数（延べ回数）</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="p-2 border border-green-100 text-sm">圃場</th>
                      <th className="p-2 border border-green-100 text-sm text-right">作業日数（延べ）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldWorkCounts.map((row) => (
                      <tr key={row.name}>
                        <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.name}</td>
                        <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{row.count}回</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-bold text-gray-700 mb-2">作物ごとの作業日数（延べ回数）</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="p-2 border border-green-100 text-sm">作物</th>
                      <th className="p-2 border border-green-100 text-sm text-right">作業日数（延べ）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropWorkCounts.map((row) => (
                      <tr key={row.name}>
                        <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.name}</td>
                        <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{row.count}回</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-bold text-gray-700 mb-2">収穫量の合計</h3>
              <p className="text-sm text-gray-500 mb-2">
                {HARVEST_STRUCTURED_SINCE_LABEL}以降に、数値＋単位で入力した記録だけを、作物・単位ごとに合計しています。それより前の自由入力の記録は単位がまちまちなため、合計には含まれません。
              </p>
              {harvestTotals.length === 0 ? (
                <p className="text-base text-gray-500 mb-6">{summaryYear}年の新形式の収穫記録はまだありません</p>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="p-2 border border-green-100 text-sm">作物</th>
                        <th className="p-2 border border-green-100 text-sm">単位</th>
                        <th className="p-2 border border-green-100 text-sm text-right">合計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harvestTotals.map((row) => (
                        <tr key={`${row.crop}__${row.unit}`}>
                          <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.crop}</td>
                          <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{row.unit}</td>
                          <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{row.total}{row.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-700 mb-2">収穫記録の一覧</h3>
              {harvestEntries.length === 0 ? (
                <p className="text-base text-gray-500 mb-6">{summaryYear}年の収穫記録はまだありません</p>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="p-2 border border-green-100 text-sm">日付</th>
                        <th className="p-2 border border-green-100 text-sm">圃場</th>
                        <th className="p-2 border border-green-100 text-sm">作物</th>
                        <th className="p-2 border border-green-100 text-sm">収穫量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harvestEntries.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.date}</td>
                          <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.field}</td>
                          <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.crop}</td>
                          <td className="p-2 border border-green-100 text-sm">{harvestDisplay(e)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-700 mb-2">月ごとの記録日数</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      {monthlyRecordDays.map((m) => (
                        <th key={m.month} className="p-2 border border-green-100 text-sm text-right">{m.month}月</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {monthlyRecordDays.map((m) => (
                        <td key={m.month} className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{m.days > 0 ? `${m.days}日` : "－"}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このツールは、日々の農作業を記録・振り返るための補助ツールです。農薬・肥料の使用記録は/boujo、収支の記録は/kichoもあわせてご利用ください。
        </p>
      </main>
    </div>
  );
}
