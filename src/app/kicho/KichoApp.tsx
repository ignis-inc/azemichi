"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// この端末のブラウザだけに保存する（サーバーには送信しない）
const STORAGE_KEY = "azemichi-kicho-v1";

type EntryType = "income" | "expense";

type Entry = {
  id: string;
  date: string;
  type: EntryType;
  category: string;
  amount: number;
  memo: string;
};

// 青色申告決算書（農業所得用）の科目名に合わせた品目一覧
const INCOME_CATEGORIES = ["農産物売上（販売金額）", "家事消費・事業消費", "雑収入", "その他"];
const EXPENSE_CATEGORIES = [
  "種苗費", "肥料費", "農薬衛生費", "飼料費", "素畜費", "農具費", "諸材料費",
  "修繕費", "動力光熱費", "作業用衣料費", "農業共済掛金", "荷造運賃手数料",
  "土地改良費", "雇人費", "小作料・賃借料", "利子割引料", "租税公課", "委託費用", "雑費", "その他",
];

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
    // 容量超過等は静かに無視する（記帳の継続利用を優先し、以降の操作は妨げない）
  }
}

function escapeCSV(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function toCSV(entries: Entry[]): string {
  const header = ["日付", "区分", "品目", "金額", "メモ"];
  const rows = entries.map((e) => [
    e.date,
    e.type === "income" ? "収入" : "支出",
    e.category,
    String(e.amount),
    e.memo,
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
    const [date, typeLabel, category, amountStr, memo] = parseCSVLine(line);
    if (!date || !category) continue;
    result.push({
      id: crypto.randomUUID(),
      date,
      type: typeLabel === "収入" ? "income" : "expense",
      category,
      amount: Math.max(0, Math.round(Number(amountStr) || 0)),
      memo: memo ?? "",
    });
  }
  return result;
}

function formatYen(n: number): string {
  return n.toLocaleString("ja-JP");
}

export default function KichoApp() {
  // dynamic(ssr:false) 経由でのみ描画されるため、初回レンダーの時点で
  // 常にブラウザ環境。lazy initializer で読み込めば effect は不要
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<EntryType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(next: EntryType) {
    setType(next);
    setCategory("");
  }

  function addEntry() {
    const e: Record<string, string> = {};
    if (!date) e.date = "日付を入力してください";
    if (!category) e.category = "品目を選択してください";
    const amountNum = Number(amount);
    if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
      e.amount = "金額を正しく入力してください";
    } else if (!Number.isInteger(amountNum)) {
      e.amount = "金額は円単位の整数で入力してください";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry: Entry = {
      id: crypto.randomUUID(),
      date,
      type,
      category,
      amount: Math.round(amountNum),
      memo: memo.trim(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    setCategory("");
    setAmount("");
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
    a.download = `あぜみち記帳データ_${todayISO()}.csv`;
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

  // 月ごと・年ごとの集計（収入合計・支出合計・差引）
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const yearlyMap = new Map<string, { income: number; expense: number }>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const year = e.date.slice(0, 4);
    if (month) {
      const m = monthlyMap.get(month) ?? { income: 0, expense: 0 };
      if (e.type === "income") m.income += e.amount; else m.expense += e.amount;
      monthlyMap.set(month, m);
    }
    if (year) {
      const y = yearlyMap.get(year) ?? { income: 0, expense: 0 };
      if (e.type === "income") y.income += e.amount; else y.expense += e.amount;
      yearlyMap.set(year, y);
    }
  }
  const monthlyRows = [...monthlyMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const yearlyRows = [...yearlyMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

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
        <h1 className="text-2xl font-bold leading-tight">日々の収支を記録する</h1>
        <p className="mt-2 text-green-100 text-base">簡易記帳・経費集計（無料・ログイン不要）</p>
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
              <label className={labelClass} htmlFor="kicho-date">日付<span className="req">必須</span></label>
              <input id="kicho-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              {errors.date && <p className="text-red-600 text-base mt-2">{errors.date}</p>}
            </div>

            <div>
              <label className={labelClass}>区分<span className="req">必須</span></label>
              <div className="flex gap-4">
                <label className={`flex-1 ${radioClass(type === "income")}`}>
                  <input type="radio" name="kicho-type" checked={type === "income"} onChange={() => handleTypeChange("income")} className="w-5 h-5 accent-green-600" />
                  <span className="text-lg">収入</span>
                </label>
                <label className={`flex-1 ${radioClass(type === "expense")}`}>
                  <input type="radio" name="kicho-type" checked={type === "expense"} onChange={() => handleTypeChange("expense")} className="w-5 h-5 accent-green-600" />
                  <span className="text-lg">支出</span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="kicho-category">品目<span className="req">必須</span></label>
              <select id="kicho-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="">品目を選択</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-base mt-2">{errors.category}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="kicho-amount">金額<span className="req">必須</span></label>
              <div className="flex items-center gap-3">
                <input id="kicho-amount" type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${inputClass} flex-1`} />
                <span className="text-lg text-gray-600 whitespace-nowrap">円</span>
              </div>
              {errors.amount && <p className="text-red-600 text-base mt-2">{errors.amount}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="kicho-memo">メモ</label>
              <input id="kicho-memo" type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例：JAで肥料購入" className={inputClass} />
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
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">集計</h2>

          <h3 className="text-lg font-bold text-gray-700 mb-2">月ごと</h3>
          {monthlyRows.length === 0 ? (
            <p className="text-base text-gray-500 mb-5">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">年月</th>
                    <th className="p-2 border border-green-100 text-sm text-right">収入</th>
                    <th className="p-2 border border-green-100 text-sm text-right">支出</th>
                    <th className="p-2 border border-green-100 text-sm text-right">差引</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map(([month, v]) => (
                    <tr key={month}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{month}</td>
                      <td className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{formatYen(v.income)}円</td>
                      <td className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{formatYen(v.expense)}円</td>
                      <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{formatYen(v.income - v.expense)}円</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="text-lg font-bold text-gray-700 mb-2">年ごと</h3>
          {yearlyRows.length === 0 ? (
            <p className="text-base text-gray-500">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">年</th>
                    <th className="p-2 border border-green-100 text-sm text-right">収入</th>
                    <th className="p-2 border border-green-100 text-sm text-right">支出</th>
                    <th className="p-2 border border-green-100 text-sm text-right">差引</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyRows.map(([year, v]) => (
                    <tr key={year}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{year}</td>
                      <td className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{formatYen(v.income)}円</td>
                      <td className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{formatYen(v.expense)}円</td>
                      <td className="p-2 border border-green-100 text-sm text-right font-bold whitespace-nowrap">{formatYen(v.income - v.expense)}円</td>
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
          {sortedEntries.length === 0 ? (
            <p className="text-base text-gray-500">まだ記録がありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="p-2 border border-green-100 text-sm">日付</th>
                    <th className="p-2 border border-green-100 text-sm">区分</th>
                    <th className="p-2 border border-green-100 text-sm">品目</th>
                    <th className="p-2 border border-green-100 text-sm text-right">金額</th>
                    <th className="p-2 border border-green-100 text-sm">メモ</th>
                    <th className="p-2 border border-green-100 text-sm"><span className="sr-only">操作</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e) => (
                    <tr key={e.id}>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">{e.date}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <span className={e.type === "income" ? "text-green-700 font-bold" : "text-rose-700 font-bold"}>
                          {e.type === "income" ? "収入" : "支出"}
                        </span>
                      </td>
                      <td className="p-2 border border-green-100 text-sm">{e.category}</td>
                      <td className="p-2 border border-green-100 text-sm text-right whitespace-nowrap">{formatYen(e.amount)}円</td>
                      <td className="p-2 border border-green-100 text-sm">{e.memo}</td>
                      <td className="p-2 border border-green-100 text-sm whitespace-nowrap">
                        <button onClick={() => deleteEntry(e.id)} className="text-rose-600 underline text-sm" aria-label={`${e.date}の${e.category}の記録を削除`}>
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
          このツールは、日々の収支を記録・集計するための補助ツールです。確定申告等の正式な帳簿・書類としての要件充足はご自身でご確認ください。あぜみちは税理士業務を行うものではありません。
        </p>
      </main>
    </div>
  );
}
