"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toKatakana } from "wanakana";
import DocNav from "../components/DocNav";
import { recordGeneratedDoc } from "../dashboardStore";
import { loadCropOptions } from "../fieldCropStore";
import { createFuriganaTracker } from "../furiganaAutofill";
import { trackEvent } from "../lib/analytics";
import {
  ADDRESSEE_OPTIONS,
  CHECK_ITEMS,
  CHIMOKU_OPTIONS,
  COMPLEX_TYPE,
  CROP_TYPES,
  ENTITY_OPTIONS,
  KISAI_URL,
  LAND_KUBUN,
  LAST_CHECKED,
  LIVESTOCK_TYPES,
  MACHINE_ROWS,
  MAFF_URL,
  MAX_APPLICANTS,
  OTHER_CROP,
  OTHER_LIVESTOCK,
  PLAN_GUIDES,
  PREFECTURES,
  SHOTOKU_URL,
  STORAGE_KEY,
  YOUKOU_URL,
  blankApplicant,
  computeTotals,
  countMainMembers,
  findMissing,
  formatArea,
  formatCountText,
  formatMan,
  formatYen,
  incomeFromHelper,
  loadInputs,
  makeEmpty,
  parseArea,
  parseCount,
  parseYen,
  perPersonYen,
  saveInputs,
  yenToMan,
  type Inputs,
  type PlanGuide,
} from "./ninteiData";

const inputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
const smallInputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-3 py-2 text-base focus:border-green-500 transition-colors";
const labelClass = "block text-base font-bold text-gray-700 mb-1";
const smallLabelClass = "block text-sm text-gray-600 mb-1";
const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-5 sm:p-6 mb-6";
const noteClass = "text-sm text-gray-600 leading-relaxed mt-2";
const linkClass = "text-green-700 underline underline-offset-2 hover:text-green-800 break-words";
const cardClass = "rounded-xl border-2 border-green-100 px-4 py-4";
const detailsClass = "rounded-xl border-2 border-green-100 px-4 py-3";
const summaryClass = "cursor-pointer text-base font-bold text-gray-700";
const subButtonClass =
  "border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white text-base font-bold py-2 px-4 rounded-lg transition-colors";

type RowKey = "applicants" | "crops" | "livestock" | "related" | "lands" | "facilities" | "members" | "machines";
type StringKey = { [K in keyof Inputs]: Inputs[K] extends string ? K : never }[keyof Inputs];

// ---- 小さな部品 ----

function Section({ step, title, formal, children }: { step: string; title: string; formal: string; children: React.ReactNode }) {
  return (
    <section className={sectionClass} aria-labelledby={`nt-step-${step}`} id={`step-${step}`}>
      <p className="text-sm font-bold text-green-700">段階{step}</p>
      <h2 id={`nt-step-${step}`} className="text-xl font-bold text-green-800">{title}</h2>
      <p className="text-xs text-gray-500 mt-1 mb-5 pb-2 border-b-2 border-green-200">国の様式：{formal}</p>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Formal({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs font-normal text-gray-500 mt-0.5">国の様式：{children}</span>;
}

function Req() {
  return <span className="req">必須</span>;
}

function ErrorText({ text }: { text?: string }) {
  return text ? <p className="text-red-600 text-base mt-2">{text}</p> : null;
}

// 国の資料からはわからない点・窓口で確かめてほしい点の案内
function AskNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 mt-2 leading-relaxed">
      {children}
    </p>
  );
}

// 自動で計算した値の表示
function AutoValue({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white border-2 border-green-300 px-4 py-3" aria-live="polite">
      <p className="text-sm text-gray-600">{label}（自動計算）</p>
      <p className="text-xl font-bold text-green-800 break-words">{value || "—"}</p>
      {sub && <p className="text-sm text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function UnitInput({
  id,
  label,
  unit,
  value,
  onChange,
  error,
  small,
  placeholder,
  inputMode = "numeric",
  formatOnBlur,
}: {
  id: string;
  label: React.ReactNode;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  small?: boolean;
  placeholder?: string;
  inputMode?: "numeric" | "decimal" | "text";
  formatOnBlur?: boolean; // 入力欄から離れたら、カンマ区切り（例：3,600）に整える
}) {
  return (
    <div className="min-w-0">
      <label className={small ? smallLabelClass : labelClass} htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={formatOnBlur ? () => {
            const formatted = formatCountText(value);
            if (formatted !== value) onChange(formatted);
          } : undefined}
          placeholder={placeholder}
          className={`${small ? smallInputClass : inputClass} flex-1 min-w-0`}
        />
        {unit && <span className="text-base text-gray-600 whitespace-nowrap">{unit}</span>}
      </div>
      <ErrorText text={error} />
    </div>
  );
}

function SmallText({
  id,
  label,
  value,
  onChange,
  placeholder,
  list,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  list?: string;
}) {
  return (
    <div className="min-w-0">
      <label className={smallLabelClass} htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        list={list}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={smallInputClass}
      />
    </div>
  );
}

function PrefSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0">
      <label className={smallLabelClass} htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={smallInputClass}>
        <option value="">選択</option>
        {PREFECTURES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}

// 円の入力欄。下に「＝○万円」を出す（万円未満は切り捨て）
function YenInput({
  id,
  label,
  value,
  onChange,
  allowNegative,
  small,
  placeholder,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  allowNegative?: boolean;
  small?: boolean;
  placeholder?: string;
}) {
  const p = parseYen(value, allowNegative);
  return (
    <div className="min-w-0">
      <UnitInput id={id} label={label} unit="円" value={value} onChange={onChange} error={p.error} small={small} placeholder={placeholder} />
      {p.value !== null && (
        <p className="text-sm text-gray-700 mt-1">
          ＝ {formatYen(p.value)}円（申請書には <strong>{yenToMan(p.value).toLocaleString("ja-JP")}万円</strong>）
        </p>
      )}
    </div>
  );
}

function FarmTypeSelect({
  id,
  legend,
  value,
  other,
  onChange,
  onOtherChange,
}: {
  id: string;
  legend: React.ReactNode;
  value: string;
  other: string;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
}) {
  const needsOther = value === OTHER_CROP || value === OTHER_LIVESTOCK;
  return (
    <div>
      <label className={labelClass} htmlFor={id}>{legend}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">選択してください</option>
        <optgroup label="作物（単一経営）">
          {CROP_TYPES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </optgroup>
        <optgroup label="畜産（単一経営）">
          {LIVESTOCK_TYPES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </optgroup>
        <optgroup label="複合経営">
          <option value={COMPLEX_TYPE}>{COMPLEX_TYPE}</option>
        </optgroup>
      </select>
      {needsOther && (
        <div className="mt-2">
          <label className={smallLabelClass} htmlFor={`${id}-other`}>（　）の中に書く内容</label>
          <input
            id={`${id}-other`}
            type="text"
            value={other}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder={value === OTHER_CROP ? "例：きのこ" : "例：ミツバチ"}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}

// ---- 本体 ----

export default function NinteiApp() {
  const [inputs, setInputs] = useState<Inputs>(loadInputs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [machineCount, setMachineCount] = useState(() => {
    const last = inputs.machines.reduce((n, m, k) => (m.name.trim() || m.qty.trim() ? k + 1 : n), 0);
    return Math.max(5, last);
  });
  const [cropOptions] = useState<string[]>(() => loadCropOptions());

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  function set(key: StringKey, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function setRow<K extends RowKey>(key: K, idx: number, field: keyof Inputs[K][number] & string, value: string) {
    setInputs((prev) => {
      const list = prev[key] as unknown as Record<string, string>[];
      const next = list.map((r, k) => (k === idx ? { ...r, [field]: value } : r));
      return { ...prev, [key]: next } as Inputs;
    });
  }

  // フリガナの自動入力（入力した読みをカタカナにして下書きとして入れる）。共同申請の人数分＋代表者の分
  const [applicantTrackers] = useState(() =>
    Array.from({ length: MAX_APPLICANTS }, (_, k) =>
      createFuriganaTracker((kana) =>
        setInputs((prev) => ({
          ...prev,
          applicants: prev.applicants.map((a, n) => (n === k ? { ...a, kana: toKatakana(kana) } : a)),
        })),
      ),
    ),
  );
  const [repTracker] = useState(() =>
    createFuriganaTracker((kana) => setInputs((prev) => ({ ...prev, repKana: toKatakana(kana) }))),
  );

  function resetInputs() {
    if (!window.confirm("入力した内容をすべて消して、最初の状態に戻します。よろしいですか？")) return;
    setInputs(makeEmpty());
    setMachineCount(5);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 消せなくても画面の入力は空になる
    }
  }

  const i = inputs;
  const isCorp = i.entityType === "corp";
  const tot = computeTotals(i);
  const missing = useMemo(() => findMissing(inputs), [inputs]);
  const mainCount = countMainMembers(i.members);
  const addressee = ADDRESSEE_OPTIONS.find((o) => o.value === i.addresseeType);
  const baseYear = /^\d{4}/.test(i.applyDate) ? Number(i.applyDate.slice(0, 4)) : new Date().getFullYear();
  const goalLabel = `目標（${i.targetYear.trim() || "　"}年）`;
  const helperCur = incomeFromHelper(i.revCur, i.expCur);
  const helperGoal = incomeFromHelper(i.revGoal, i.expGoal);
  const showLivestock = i.livestock.some((r) => Object.values(r).some((v) => v.trim()));
  const showRelated = i.related.some((r) => Object.values(r).some((v) => v.trim()));
  const showOtherLand = i.lands.slice(4).some((r) => Object.values(r).some((v) => v.trim()));
  const showFacility = i.facilities.some((r) => Object.values(r).some((v) => v.trim()));

  function addApplicant() {
    setInputs((prev) =>
      prev.applicants.length >= MAX_APPLICANTS ? prev : { ...prev, applicants: [...prev.applicants, blankApplicant()] },
    );
  }

  function removeLastApplicant() {
    setInputs((prev) => (prev.applicants.length <= 1 ? prev : { ...prev, applicants: prev.applicants.slice(0, -1) }));
  }

  function chooseAddressee(value: string) {
    setInputs((prev) => ({
      ...prev,
      addresseeType: value,
      // 農林水産大臣は名前を入れる必要がないので、空なら自動で入れる
      addresseeName: value === "minister" && !prev.addresseeName.trim() ? "農林水産大臣" : prev.addresseeName,
    }));
  }

  function insertIntoPlan(key: PlanGuide["key"], text: string) {
    setInputs((prev) => {
      const cur = prev[key];
      return { ...prev, [key]: cur.trim() ? `${cur.replace(/\s+$/, "")}\n\n${text}` : text };
    });
  }

  function toggleCheck(id: string) {
    setInputs((prev) => ({
      ...prev,
      checks: prev.checks.includes(id) ? prev.checks.filter((c) => c !== id) : [...prev.checks, id],
    }));
  }

  async function handlePdf() {
    setIsGenerating(true);
    try {
      const { downloadApplicationPdf } = await import("./ninteiPdf");
      await downloadApplicationPdf(inputs);
      recordGeneratedDoc("nintei");
      trackEvent("pdf_create", "nintei");
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの作成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">認定農業者の申請書づくり</h1>
        <p className="mt-2 text-green-100 text-base">正式名称：農業経営改善計画認定申請書</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* 窓口確認の案内（いちばん目立つ位置） */}
        <div role="note" className="border-4 border-red-300 bg-red-50 rounded-xl px-5 py-4">
          <p className="text-lg font-bold text-red-800 leading-relaxed">
            認定は市町村の審査です。目標の所得の基準や、追加で必要な資料は市町村ごとに違うため、提出前に窓口でご確認ください。
          </p>
        </div>

        <div className="bg-white border border-green-100 rounded-xl px-5 py-4 mt-4">
          <p className="text-base text-gray-600 leading-relaxed">
            国の様式に合わせて、農業経営改善計画認定申請書をPDFにします。入力した内容はあぜみちのサーバーに送らず、この端末のブラウザだけに保存されます（ログインしていても、クラウドには保存しません）。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a href={MAFF_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              農林水産省「認定農業者制度について」
            </a>
            （様式・
            <a href={KISAI_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              記載方法
            </a>
            ・
            <a href={YOUKOU_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              基本要綱
            </a>
            ）
            <br />
            最終確認：{LAST_CHECKED}
          </p>
        </div>

        {/* はじめに */}
        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4 mt-4">
          <h2 className="text-base font-bold text-yellow-900 mb-2">はじめに</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-900 leading-relaxed">
            <li>農業者が、5年後の目標とその達成のための取組を書いた「農業経営改善計画」を作り、市町村などの認定を受ける申請書です。</li>
            <li>作れるのは、国の様式（告示第1419号の様式）の本体と別紙１です。市町村ごとの独自の資料には対応していません。</li>
            <li>施設を整備する場合に使う別紙２・別紙３は、このツールでは作れません。段階6でご案内します。</li>
            <li>
              これから新たに農業を始める方には「青年等就農計画」という別の計画もあります（このツールでは作れません）。どちらが合うかは窓口でご確認ください。開業の届出などは
              <Link href="/kaigyo-set" className="underline underline-offset-2 font-bold hover:text-yellow-950">開業時にまとめて書類を作る</Link>
              で作れます。
            </li>
          </ul>
        </div>
      </div>

      <DocNav current="/nintei-nogyosha" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          <span className="req">必須</span> は、あぜみちが「申請書に書いておきたい」と考えた項目です（国の資料には、どの項目が必須かは書かれていません）。途中まででも、この端末に自動で保存されます。
        </p>

        {/* 段階1 */}
        <Section step="1" title="申請する人" formal="申請書の宛先・申請者の欄">
          <fieldset>
            <legend className={labelClass}>
              提出先<Req />
              <Formal>○○市町村長　殿／○○都道府県知事　殿／○○農政局長　殿／農林水産大臣　殿</Formal>
            </legend>
            <div className="space-y-2 mt-2">
              {ADDRESSEE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex items-start gap-3 cursor-pointer bg-green-50 rounded-lg px-4 py-3 border-2 border-green-100 hover:border-green-400 transition-colors"
                >
                  <input
                    type="radio"
                    name="addresseeType"
                    value={o.value}
                    checked={i.addresseeType === o.value}
                    onChange={() => chooseAddressee(o.value)}
                    className="w-5 h-5 mt-0.5 accent-green-600 shrink-0"
                  />
                  <span>
                    <span className="block text-base text-gray-800 font-bold">{o.label}</span>
                    <span className="block text-sm text-gray-600">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className={noteClass}>
              提出先は、住所ではなく、農用地や農業生産施設（畜舎、温室など）がある場所で決まります。
            </p>
          </fieldset>

          {addressee && (
            <div>
              <label className={labelClass} htmlFor="nt-addresseeName">
                提出先の名前<Req />
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="nt-addresseeName"
                  type="text"
                  value={i.addresseeName}
                  onChange={(e) => set("addresseeName", e.target.value)}
                  placeholder={addressee.placeholder}
                  className={`${inputClass} flex-1 min-w-0`}
                />
                <span className="text-base text-gray-600 whitespace-nowrap">殿</span>
              </div>
              <p className={noteClass}>市長・町長・村長など、提出先の名前をそのまま書いてください（例：○○町長）。</p>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="nt-applyDate">
              申請する日（空欄なら、印刷してから手書きできます）
            </label>
            <input
              id="nt-applyDate"
              type="date"
              value={i.applyDate}
              onChange={(e) => set("applyDate", e.target.value)}
              className={inputClass}
            />
          </div>

          <fieldset>
            <legend className={labelClass}>
              個人ですか、法人ですか<Req />
            </legend>
            <div className="space-y-2 mt-2">
              {ENTITY_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex items-start gap-3 cursor-pointer bg-green-50 rounded-lg px-4 py-3 border-2 border-green-100 hover:border-green-400 transition-colors"
                >
                  <input
                    type="radio"
                    name="entityType"
                    value={o.value}
                    checked={i.entityType === o.value}
                    onChange={() => set("entityType", o.value)}
                    className="w-5 h-5 mt-0.5 accent-green-600 shrink-0"
                  />
                  <span className="text-base text-gray-800">{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {(isCorp ? i.applicants.slice(0, 1) : i.applicants).map((a, k) => (
            <fieldset key={k} className={cardClass}>
              <legend className="text-base font-bold text-gray-800 px-1">
                {isCorp ? "法人" : i.applicants.length > 1 ? `申請する人（${k + 1}人目）` : "申請する人"}
              </legend>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor={`nt-name-${k}`}>
                    {isCorp ? "法人名" : "氏名"}<Req />
                    <Formal>個人・法人名</Formal>
                  </label>
                  <input
                    id={`nt-name-${k}`}
                    type="text"
                    autoComplete={isCorp ? "organization" : k === 0 ? "name" : "off"}
                    value={a.name}
                    onChange={(e) => setRow("applicants", k, "name", e.target.value)}
                    onCompositionUpdate={applicantTrackers[k].handleCompositionUpdate}
                    onCompositionEnd={applicantTrackers[k].handleCompositionEnd}
                    onInput={applicantTrackers[k].handleInput}
                    placeholder={isCorp ? "例：株式会社あぜみち農園" : "例：田中　太郎"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`nt-kana-${k}`}>
                    フリガナ<Req />
                    <Formal>フリガナ</Formal>
                  </label>
                  <input
                    id={`nt-kana-${k}`}
                    type="text"
                    value={a.kana}
                    onChange={(e) => {
                      setRow("applicants", k, "kana", e.target.value);
                      applicantTrackers[k].notifyManualKanaEdit();
                    }}
                    placeholder={isCorp ? "例：カブシキガイシャアゼミチノウエン" : "例：タナカ　タロウ"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`nt-birth-${k}`}>
                    {isCorp ? "法人を設立した日" : "生年月日"}<Req />
                    <Formal>生年月日・法人設立年月日</Formal>
                  </label>
                  <input
                    id={`nt-birth-${k}`}
                    type="date"
                    value={a.birth}
                    onChange={(e) => setRow("applicants", k, "birth", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </fieldset>
          ))}

          {i.entityType === "individual" && (
            <div>
              <div className="flex flex-wrap gap-3">
                {i.applicants.length < MAX_APPLICANTS && (
                  <button type="button" onClick={addApplicant} className={subButtonClass}>
                    ＋ 共同で申請する人を追加
                  </button>
                )}
                {i.applicants.length > 1 && (
                  <button
                    type="button"
                    onClick={removeLastApplicant}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    最後の人を消す
                  </button>
                )}
              </div>
              <p className={noteClass}>
                夫婦、親子等が共同で農業経営改善計画の認定を申請する場合には、申請者欄の「個人・法人名」欄に全員の氏名、フリガナ、生年月日を連記してください。
              </p>
              <AskNote>
                共同申請が認められる条件（同じ世帯であること、家族経営協定などの取決めがあることなど）は、国の要綱に決められています。共同申請にしてよいかどうかは、窓口でご確認ください。
              </AskNote>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="nt-address">
              住所<Req />
              <Formal>住所</Formal>
            </label>
            <input
              id="nt-address"
              type="text"
              autoComplete="street-address"
              value={i.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="例：大分県豊後大野市三重町1-2-3"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="nt-phone">
              連絡先（電話番号）<Req />
              <Formal>連絡先</Formal>
            </label>
            <input
              id="nt-phone"
              type="tel"
              autoComplete="tel"
              value={i.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="例：090-1234-5678"
              className={inputClass}
            />
          </div>

          {isCorp && (
            <>
              <div>
                <label className={labelClass} htmlFor="nt-corpNumber">
                  法人番号（13けた）<Req />
                  <Formal>法人番号</Formal>
                </label>
                <input
                  id="nt-corpNumber"
                  type="text"
                  inputMode="numeric"
                  value={i.corpNumber}
                  onChange={(e) => set("corpNumber", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="nt-repName">
                  代表者の氏名<Req />
                  <Formal>代表者氏名（法人のみ）</Formal>
                </label>
                <input
                  id="nt-repName"
                  type="text"
                  value={i.repName}
                  onChange={(e) => set("repName", e.target.value)}
                  onCompositionUpdate={repTracker.handleCompositionUpdate}
                  onCompositionEnd={repTracker.handleCompositionEnd}
                  onInput={repTracker.handleInput}
                  placeholder="例：田中　太郎"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="nt-repKana">
                  代表者の氏名のフリガナ
                  <Formal>フリガナ</Formal>
                </label>
                <input
                  id="nt-repKana"
                  type="text"
                  value={i.repKana}
                  onChange={(e) => {
                    set("repKana", e.target.value);
                    repTracker.notifyManualKanaEdit();
                  }}
                  placeholder="例：タナカ　タロウ"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </Section>

        {/* 段階2 */}
        <Section step="2" title="今の経営と5年後の目標" formal="①農業経営体の営農活動の現状及び目標">
          <div>
            <label className={labelClass} htmlFor="nt-targetYear">
              目標の年（5年後）<Req />
              <Formal>目標（　年）</Formal>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="nt-targetYear"
                type="text"
                inputMode="numeric"
                value={i.targetYear}
                onChange={(e) => set("targetYear", e.target.value)}
                placeholder={String(baseYear + 5)}
                className={`${inputClass} w-36`}
              />
              <span className="text-base text-gray-600">年</span>
              {i.targetYear.trim() !== String(baseYear + 5) && (
                <button type="button" onClick={() => set("targetYear", String(baseYear + 5))} className={subButtonClass}>
                  {baseYear + 5}年にする
                </button>
              )}
            </div>
            <p className={noteClass}>
              計画には、現状と5年後の目標を書きます。ここで入れた年が、申請書の「目標（　年）」の欄すべてに入ります。
            </p>
          </div>

          <fieldset className={cardClass}>
            <legend className="text-base font-bold text-gray-800 px-1">
              何を主につくっていますか（営農類型）<Req />
              <Formal>（１）営農類型</Formal>
            </legend>
            <div className="space-y-4">
              <FarmTypeSelect
                id="nt-typeCur"
                legend="現状"
                value={i.typeCur}
                other={i.typeCurOther}
                onChange={(v) => set("typeCur", v)}
                onOtherChange={(v) => set("typeCurOther", v)}
              />
              <FarmTypeSelect
                id="nt-typeGoal"
                legend={goalLabel}
                value={i.typeGoal}
                other={i.typeGoalOther}
                onChange={(v) => set("typeGoal", v)}
                onOtherChange={(v) => set("typeGoalOther", v)}
              />
              {i.typeCur && i.typeGoal !== i.typeCur && (
                <button
                  type="button"
                  onClick={() =>
                    setInputs((prev) => ({ ...prev, typeGoal: prev.typeCur, typeGoalOther: prev.typeCurOther }))
                  }
                  className={subButtonClass}
                >
                  目標も現状と同じにする
                </button>
              )}
            </div>
            <ul className="text-sm text-gray-600 leading-relaxed mt-3 list-disc pl-5 space-y-1">
              <li>該当する営農類型１つにチェックをしてください。</li>
              <li>「単一経営」とは、経営体毎の農産物販売金額１位の部門（作目）の販売金額が、農産物総販売金額の80％以上を占める経営をいいます。</li>
              <li>「複合経営」とは、経営体毎の農産物販売金額１位の部門（作目）の販売金額が、農産物総販売金額の80％に満たない経営をいいます。</li>
            </ul>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-bold text-gray-700">工芸農作物・その他の作物・その他の畜産とは</summary>
              <ul className="text-sm text-gray-600 leading-relaxed mt-2 list-disc pl-5 space-y-1">
                <li>「工芸農作物」とは、さとうきび、たばこ、茶、てんさい、こんにゃくいも、なたね、いぐさ、ホップ、ごま、はっか、じょちゅうぎく、ラベンダー、薬用作物などの作物をいいます。</li>
                <li>「その他の作物」には、芝、種苗、栽培きのこ類（施設栽培を含む）、桑葉、牧草等の販売を含みます。</li>
                <li>「その他の畜産」には、養蚕、馬を肥育しての販売、めん羊、やぎ、うさぎ、うずら、その他の毛皮獣及びミツバチの飼養等の販売を含みます。</li>
              </ul>
            </details>
          </fieldset>

          {/* 所得の補助計算 */}
          <div className="rounded-xl border-2 border-green-300 bg-green-50 px-4 py-4" id="income-helper">
            <h3 className="text-lg font-bold text-green-800">所得の計算を手伝う（個人の方）</h3>
            <p className="text-sm text-gray-700 leading-relaxed mt-1">
              国の「所得水準の算出方法（例）」では、青色申告決算書（損益計算書）の<strong>収入金額</strong>から<strong>経費</strong>を引いた金額を、主たる従事者の人数で割っています。青色申告をしていない場合は、帳簿や伝票等を用いて、青色申告決算書に該当する科目の金額を求め、算出します。
            </p>
            <div className="space-y-5 mt-4">
              {([
                { key: "cur", title: "現状", rev: "revCur", exp: "expCur", result: helperCur, target: "incomeCur" },
                { key: "goal", title: goalLabel, rev: "revGoal", exp: "expGoal", result: helperGoal, target: "incomeGoal" },
              ] as const).map((row) => {
                const per = perPersonYen(row.result, tot.people);
                return (
                  <fieldset key={row.key} className="rounded-lg bg-white border-2 border-green-100 px-4 py-4 space-y-3">
                    <legend className="text-base font-bold text-gray-800 px-1">{row.title}</legend>
                    <YenInput id={`nt-${row.rev}`} label="収入金額" value={i[row.rev]} onChange={(v) => set(row.rev, v)} small />
                    <YenInput id={`nt-${row.exp}`} label="経費" value={i[row.exp]} onChange={(v) => set(row.exp, v)} small />
                    {row.result !== null && (
                      <div className="rounded-lg bg-green-50 border-2 border-green-300 px-4 py-3" aria-live="polite">
                        <p className="text-sm text-gray-600">所得（収入金額 − 経費）</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatYen(row.result)}円（{yenToMan(row.result).toLocaleString("ja-JP")}万円）
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          主たる従事者１人当たり：
                          {per === null ? (
                            "下の「主たる従事者の人数」を入れると計算します"
                          ) : (
                            <strong>
                              {formatYen(per)}円（申請書には{yenToMan(per).toLocaleString("ja-JP")}万円）
                            </strong>
                          )}
                        </p>
                        {i[row.target] !== String(row.result) && (
                          <button type="button" onClick={() => set(row.target, String(row.result))} className={`${subButtonClass} mt-3`}>
                            この所得を「年間所得（{row.title}）」に入れる
                          </button>
                        )}
                      </div>
                    )}
                  </fieldset>
                );
              })}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-base font-bold text-gray-700">法人の場合</summary>
              <div className="text-sm text-gray-700 leading-relaxed mt-2 space-y-2">
                <p>国の「所得水準の算出方法（法人の場合）」では、次のように計算する例が示されています。</p>
                <p className="bg-white rounded-lg border border-green-200 px-3 py-2">
                  主たる従事者の１人当たりの年間所得 ＝｛税引前当期純利益（準備金繰入額 − 準備金戻入額を加える）＋ 法人の役員報酬｝× 農業・関連事業等の売上高 ÷ 総売上高 ÷ 農業・関連事業等に従事する役員の人数
                </p>
                <p>※準備金とは、農業経営基盤強化準備金をいいます。</p>
                <p className="font-bold">このツールでは、法人の所得は計算しません。計算のしかたは窓口でご確認ください。</p>
              </div>
            </details>
            <p className="text-sm text-gray-600 mt-3">
              出典：
              <a href={SHOTOKU_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                農林水産省「農業経営改善計画の所得水準の算出方法（例）」
              </a>
            </p>
          </div>

          <fieldset className={cardClass}>
            <legend className="text-base font-bold text-gray-800 px-1">
              1年間の農業の所得<Req />
              <Formal>年間所得</Formal>
            </legend>
            <div className="space-y-4">
              <YenInput id="nt-incomeCur" label="現状" placeholder="例：9979000" value={i.incomeCur} onChange={(v) => set("incomeCur", v)} allowNegative />
              <YenInput id="nt-incomeGoal" label={goalLabel} placeholder="例：11000000" value={i.incomeGoal} onChange={(v) => set("incomeGoal", v)} allowNegative />
            </div>
            <p className={noteClass}>
              農畜産物の生産及び農畜産物の加工・販売その他の関連・附帯事業に係る所得について、現状及び５年後の目標を記載してください。円で入れると、申請書には万円で書きます（万円未満は切り捨て）。
            </p>
          </fieldset>

          <div>
            <UnitInput
              id="nt-people"
              label={
                <>
                  農業の中心になって働く人の人数<Req />
                  <Formal>主たる従事者の人数</Formal>
                </>
              }
              unit="人"
              value={i.people}
              onChange={(v) => set("people", v)}
              error={parseCount(i.people).error}
              placeholder="例：2"
            />
            {mainCount > 0 && i.people.trim() !== String(mainCount) && (
              <button type="button" onClick={() => set("people", String(mainCount))} className={`${subButtonClass} mt-2`}>
                段階4で「主たる従事者」にした{mainCount}人を入れる
              </button>
            )}
            <p className={noteClass}>
              「主たる従事者」とは、農業経営で主体的な役割を担う者をいいます。例えば、法人経営の経営者・役員等、家族経営の世帯主等が一般的ですが、個々の経営の実態に応じて判断し記載ください。
            </p>
          </div>

          <fieldset className={cardClass}>
            <legend className="text-base font-bold text-gray-800 px-1">
              1年間の農業の働く時間<Req />
              <Formal>年間労働時間</Formal>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UnitInput formatOnBlur id="nt-hoursCur" label="現状" unit="時間" placeholder="例：3,600" value={i.hoursCur} onChange={(v) => set("hoursCur", v)} error={parseCount(i.hoursCur).error} />
              <UnitInput formatOnBlur id="nt-hoursGoal" label={goalLabel} unit="時間" placeholder="例：3,800" value={i.hoursGoal} onChange={(v) => set("hoursGoal", v)} error={parseCount(i.hoursGoal).error} />
            </div>
            <p className={noteClass}>
              年間労働時間については、農畜産物の生産及び農畜産物の加工・販売その他の関連・附帯事業に係る労働時間について、現状及び５年後の目標を記載してください。
            </p>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AutoValue
              label="主たる従事者１人当たりの年間所得（現状）"
              value={tot.perIncomeCur === null ? "" : `${formatMan(tot.perIncomeCur)}万円`}
              sub={tot.perIncomeCur === null ? "年間所得と人数を入れると計算します" : `${formatYen(tot.perIncomeCur)}円（万円未満は切り捨て）`}
            />
            <AutoValue
              label={`主たる従事者１人当たりの年間所得（${goalLabel}）`}
              value={tot.perIncomeGoal === null ? "" : `${formatMan(tot.perIncomeGoal)}万円`}
              sub={tot.perIncomeGoal === null ? "年間所得と人数を入れると計算します" : `${formatYen(tot.perIncomeGoal)}円（万円未満は切り捨て）`}
            />
            <AutoValue
              label="主たる従事者１人当たりの年間労働時間（現状）"
              value={tot.perHoursCur === null ? "" : `${tot.perHoursCur.toLocaleString("ja-JP")}時間`}
              sub="1時間未満は切り捨て"
            />
            <AutoValue
              label={`主たる従事者１人当たりの年間労働時間（${goalLabel}）`}
              value={tot.perHoursGoal === null ? "" : `${tot.perHoursGoal.toLocaleString("ja-JP")}時間`}
              sub="1時間未満は切り捨て"
            />
          </div>
          <AskNote>
            このツールでは、目標の所得が認定の基準に届いているかどうかは判定しません。基準（目標とする所得の水準）は市町村ごとに違うため、窓口でご確認ください。
          </AskNote>
        </Section>

        {/* 段階3 */}
        <Section step="3" title="作物・家畜・農地・施設" formal="②農業経営の規模拡大に関する現状及び目標">
          <datalist id="nt-crop-options">
            {cropOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg px-4 py-3 space-y-1">
            <p>作付面積の単位はａ（アール）となっていますので注意してください。</p>
            <p>１a＝100㎡（約１畝）、10a＝1,000㎡（約１反）、100a＝10,000㎡（約１町）、約3.3a＝約330㎡（100坪）</p>
            <p>生産量の単位は作目・部門に応じて単位を記載してください（例：3,000kg）。</p>
          </div>

          <fieldset>
            <legend className={labelClass}>
              つくっている作物<Req />
              <Formal>（１）生産　作目・部門名（耕種）</Formal>
            </legend>
            <div className="space-y-4 mt-2">
              {i.crops.map((c, k) => (
                <div key={k} className={cardClass}>
                  <p className="text-sm font-bold text-gray-700 mb-2">作物{k + 1}</p>
                  <SmallText id={`nt-crop-${k}`} label="作目の名前" value={c.name} list="nt-crop-options" onChange={(v) => setRow("crops", k, "name", v)} placeholder="例：水稲" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <UnitInput small id={`nt-crop-${k}-areaCur`} label="現状の作付面積" unit="a" inputMode="decimal" value={c.areaCur} onChange={(v) => setRow("crops", k, "areaCur", v)} error={parseArea(c.areaCur).error} />
                    <SmallText id={`nt-crop-${k}-qtyCur`} label="現状の生産量" value={c.qtyCur} onChange={(v) => setRow("crops", k, "qtyCur", v)} placeholder="例：3,000kg" />
                    <UnitInput small id={`nt-crop-${k}-areaGoal`} label="目標の作付面積" unit="a" inputMode="decimal" value={c.areaGoal} onChange={(v) => setRow("crops", k, "areaGoal", v)} error={parseArea(c.areaGoal).error} />
                    <SmallText id={`nt-crop-${k}-qtyGoal`} label="目標の生産量" value={c.qtyGoal} onChange={(v) => setRow("crops", k, "qtyGoal", v)} placeholder="例：4,000kg" />
                  </div>
                </div>
              ))}
            </div>
            <p className={noteClass}>国の様式の欄は3行です。4つ以上の作物がある場合の書き方は、窓口でご確認ください。</p>
          </fieldset>

          <details className={detailsClass} open={showLivestock || undefined}>
            <summary className={summaryClass}>
              家畜を飼っている場合
              <Formal>（１）生産　作目・部門名（畜産）</Formal>
            </summary>
            <div className="space-y-4 mt-3">
              {i.livestock.map((l, k) => (
                <div key={k} className={cardClass}>
                  <p className="text-sm font-bold text-gray-700 mb-2">家畜{k + 1}</p>
                  <SmallText id={`nt-ls-${k}`} label="部門の名前" value={l.name} onChange={(v) => setRow("livestock", k, "name", v)} placeholder="例：肉用牛（繁殖）" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <UnitInput small id={`nt-ls-${k}-headsCur`} label="現状の飼養頭数" unit="頭・羽" value={l.headsCur} onChange={(v) => setRow("livestock", k, "headsCur", v)} error={parseCount(l.headsCur).error} />
                    <SmallText id={`nt-ls-${k}-qtyCur`} label="現状の生産量" value={l.qtyCur} onChange={(v) => setRow("livestock", k, "qtyCur", v)} placeholder="例：子牛15頭" />
                    <UnitInput small id={`nt-ls-${k}-headsGoal`} label="目標の飼養頭数" unit="頭・羽" value={l.headsGoal} onChange={(v) => setRow("livestock", k, "headsGoal", v)} error={parseCount(l.headsGoal).error} />
                    <SmallText id={`nt-ls-${k}-qtyGoal`} label="目標の生産量" value={l.qtyGoal} onChange={(v) => setRow("livestock", k, "qtyGoal", v)} placeholder="例：子牛20頭" />
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details className={detailsClass} open={showRelated || undefined}>
            <summary className={summaryClass}>
              加工・直売・体験などをしている場合
              <Formal>（２）農畜産物の加工・販売その他の関連・附帯事業（売上げ）</Formal>
            </summary>
            <p className={noteClass}>
              申請者の行う農業経営と一次的な関連を持ち農業生産の安定発展に役立つ、農畜産物の製造又は加工、農畜産物の貯蔵・運搬・販売、農業生産に必要な資材の製造、作業受託（特定作業受託は含みません）、農泊・農業体験事業等の関連・附帯事業について記載してください。
            </p>
            <div className="space-y-4 mt-3">
              {i.related.map((r, k) => (
                <div key={k} className={cardClass}>
                  <p className="text-sm font-bold text-gray-700 mb-2">事業{k + 1}</p>
                  <SmallText id={`nt-rel-${k}`} label="事業内容" value={r.content} onChange={(v) => setRow("related", k, "content", v)} placeholder="例：小売業（直売所）" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <YenInput small id={`nt-rel-${k}-cur`} label="現状の売上" value={r.salesCur} onChange={(v) => setRow("related", k, "salesCur", v)} />
                    <YenInput small id={`nt-rel-${k}-goal`} label="目標の売上" value={r.salesGoal} onChange={(v) => setRow("related", k, "salesGoal", v)} />
                  </div>
                </div>
              ))}
            </div>
            <p className={noteClass}>
              出荷と直売で手取りがどう変わるかは、
              <Link href="/tedori" className={linkClass}>出荷と直販の手取り比較</Link>
              で試算できます。
            </p>
          </details>

          <fieldset>
            <legend className={labelClass}>
              農地<Req />
              <Formal>（３）農用地及び農業生産施設　ア　農用地</Formal>
            </legend>
            <p className={noteClass}>
              申請者の農業経営上重要と考えられる農用地を記載してください。所有地、借入地の区分ごとに、所在する都道府県名・市町村名を記載します。地目は現況の地目（田、畑、樹園地、採草放牧地から選択）を記載してください。
            </p>
            <div className="space-y-4 mt-3">
              {i.lands.slice(0, 4).map((r, k) => (
                <LandCard key={k} k={k} row={r} setRow={setRow} />
              ))}
            </div>
            <details className={`${detailsClass} mt-4`} open={showOtherLand || undefined}>
              <summary className={summaryClass}>
                特定作業受託の農地がある場合（その他）
              </summary>
              <p className={noteClass}>
                「その他」欄には、特定作業受託を受託する農地の面積のみを記載してください。特定作業受託とは、作目別に、主な基幹作業（水稲にあっては耕起・代かき、田植え及び収穫・脱穀、麦及び大豆にあっては耕起・整地、播種及び収穫、その他の作目にあってはこれらに準ずる農作業）を受託することをいい、申請者が当該農地に係る収穫物についての販売委託を引き受けることにより販売名義を有し、かつ、当該販売委託を引き受けた農産物に係る販売収入の処分権を有するものに限ります。
              </p>
              <div className="space-y-4 mt-3">
                {i.lands.slice(4).map((r, n) => (
                  <LandCard key={n + 4} k={n + 4} row={r} setRow={setRow} />
                ))}
              </div>
            </details>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <AutoValue label="経営面積合計（現状）" value={tot.landCur === null ? "" : `${formatArea(tot.landCur)} a`} />
              <AutoValue label={`経営面積合計（${goalLabel}）`} value={tot.landGoal === null ? "" : `${formatArea(tot.landGoal)} a`} />
            </div>
          </fieldset>

          <details className={detailsClass} open={showFacility || undefined}>
            <summary className={summaryClass}>
              ハウス・畜舎などがある場合
              <Formal>（３）農用地及び農業生産施設　イ　農業生産施設</Formal>
            </summary>
            <p className={noteClass}>
              「農業生産施設」欄には、畜舎、蚕室、温室その他これらに類する農畜産物の生産の用に供する施設を記載してください。面積の単位は㎡となっていますので注意してください。
            </p>
            <div className="space-y-4 mt-3">
              {i.facilities.map((r, k) => (
                <div key={k} className={cardClass}>
                  <p className="text-sm font-bold text-gray-700 mb-2">施設{k + 1}</p>
                  <SmallText id={`nt-fac-${k}`} label="種別" value={r.kind} onChange={(v) => setRow("facilities", k, "kind", v)} placeholder="例：ビニールハウス" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <PrefSelect id={`nt-fac-${k}-pref`} label="都道府県名" value={r.pref} onChange={(v) => setRow("facilities", k, "pref", v)} />
                    <SmallText id={`nt-fac-${k}-city`} label="市町村名" value={r.city} onChange={(v) => setRow("facilities", k, "city", v)} />
                    <UnitInput small id={`nt-fac-${k}-bldCur`} label="現状の棟数" unit="棟" value={r.bldCur} onChange={(v) => setRow("facilities", k, "bldCur", v)} error={parseCount(r.bldCur).error} />
                    <UnitInput small id={`nt-fac-${k}-sqmCur`} label="現状の面積" unit="㎡" inputMode="decimal" value={r.sqmCur} onChange={(v) => setRow("facilities", k, "sqmCur", v)} error={parseArea(r.sqmCur).error} />
                    <UnitInput small id={`nt-fac-${k}-bldGoal`} label="目標の棟数" unit="棟" value={r.bldGoal} onChange={(v) => setRow("facilities", k, "bldGoal", v)} error={parseCount(r.bldGoal).error} />
                    <UnitInput small id={`nt-fac-${k}-sqmGoal`} label="目標の面積" unit="㎡" inputMode="decimal" value={r.sqmGoal} onChange={(v) => setRow("facilities", k, "sqmGoal", v)} error={parseArea(r.sqmGoal).error} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <AutoValue
                label="施設の経営面積合計（現状）"
                value={tot.bldCur === null && tot.sqmCur === null ? "" : `${tot.bldCur ?? 0}棟　${formatArea(tot.sqmCur ?? 0)}㎡`}
              />
              <AutoValue
                label={`施設の経営面積合計（${goalLabel}）`}
                value={tot.bldGoal === null && tot.sqmGoal === null ? "" : `${tot.bldGoal ?? 0}棟　${formatArea(tot.sqmGoal ?? 0)}㎡`}
              />
            </div>
          </details>
          <p className={`${noteClass} -mt-2`}>
            「経営面積合計」欄には、ア 農用地の「所有地」欄、「借入地」欄、「その他」欄の面積の合計と、イ 農業生産施設の「規模」の合計を、それぞれ記載します（自動で計算します）。
          </p>
        </Section>

        {/* 段階4 */}
        <Section step="4" title="一緒に働く人" formal="（参考）経営の構成">
          <p className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg px-4 py-3">
            農業経営に携わる者の担当業務等について、その現状及び現在想定し得る範囲での見通しを記載してください。この場合、現在は農業経営に携わっているが５年以内に離農する見込みの者及び現在は就農していないが５年以内に経営に参画する見込みの者についても記載してください。
          </p>
          {i.members.map((m, k) => (
            <fieldset key={k} className={cardClass}>
              <legend className="text-base font-bold text-gray-800 px-1">
                {k === 0 ? "1人目（代表者）" : `${k + 1}人目`}
                {k === 0 && <Req />}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <SmallText id={`nt-mem-${k}-name`} label={k === 0 ? "氏名（法人は代表の役員の氏名）" : "氏名（法人は役員の氏名）"} value={m.name} onChange={(v) => setRow("members", k, "name", v)} />
                </div>
                <UnitInput small id={`nt-mem-${k}-age`} label="年齢" unit="歳" value={m.age} onChange={(v) => setRow("members", k, "age", v)} error={parseCount(m.age).error} />
                <SmallText id={`nt-mem-${k}-sex`} label="性別" value={m.sex} onChange={(v) => setRow("members", k, "sex", v)} />
                {k > 0 && (
                  <div className="col-span-2">
                    <SmallText id={`nt-mem-${k}-rel`} label="代表者との続柄（法人は役職）" value={m.relation} onChange={(v) => setRow("members", k, "relation", v)} placeholder="例：妻、長男、取締役" />
                  </div>
                )}
              </div>
              {([
                { key: "cur", title: "現状", duty: "dutyCur", main: "mainCur", hours: "hoursCur" },
                { key: "goal", title: `見通し（${i.targetYear.trim() || "　"}年）`, duty: "dutyGoal", main: "mainGoal", hours: "hoursGoal" },
              ] as const).map((col) => (
                <div key={col.key} className="mt-4 rounded-lg bg-green-50 px-3 py-3">
                  <p className="text-sm font-bold text-gray-700 mb-2">{col.title}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <SmallText id={`nt-mem-${k}-${col.duty}`} label="担当業務" value={m[col.duty]} onChange={(v) => setRow("members", k, col.duty, v)} placeholder="例：栽培管理、経理" />
                    </div>
                    <UnitInput small formatOnBlur id={`nt-mem-${k}-${col.hours}`} label="年間農業従事時間" unit="時間" value={m[col.hours]} onChange={(v) => setRow("members", k, col.hours, v)} error={parseCount(m[col.hours]).error} />
                    <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
                      <input
                        type="checkbox"
                        checked={m[col.main] === "1"}
                        onChange={(e) => setRow("members", k, col.main, e.target.checked ? "1" : "")}
                        className="w-5 h-5 accent-green-600"
                      />
                      <span className="text-sm text-gray-700">主たる従事者（○）</span>
                    </label>
                  </div>
                </div>
              ))}
            </fieldset>
          ))}
          <p className={noteClass}>
            国の様式の欄は4行です（1行目が代表者）。「代表者との続柄」欄は、家族経営の場合には代表者を基準とした続柄を、法人経営の場合には役職を記載します。
          </p>
          <AskNote>
            国の記入のしかたの説明には「日数」と書かれている箇所があります。わからない場合は窓口でご確認ください（このツールでは、様式の表の列どおり「年間農業従事時間」にしています）。
          </AskNote>

          <fieldset className={cardClass}>
            <legend className="text-base font-bold text-gray-800 px-1">
              雇っている人
              <Formal>（２）雇用者</Formal>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <UnitInput small id="nt-empRegularCur" label="常時雇（年間）実人数・現状" unit="人" value={i.empRegularCur} onChange={(v) => set("empRegularCur", v)} error={parseCount(i.empRegularCur).error} />
              <UnitInput small id="nt-empRegularGoal" label="常時雇（年間）実人数・見通し" unit="人" value={i.empRegularGoal} onChange={(v) => set("empRegularGoal", v)} error={parseCount(i.empRegularGoal).error} />
              <UnitInput small id="nt-empTempCur" label="臨時雇（年間）実人数・現状" unit="人" value={i.empTempCur} onChange={(v) => set("empTempCur", v)} error={parseCount(i.empTempCur).error} />
              <UnitInput small id="nt-empTempGoal" label="臨時雇（年間）実人数・見通し" unit="人" value={i.empTempGoal} onChange={(v) => set("empTempGoal", v)} error={parseCount(i.empTempGoal).error} />
              <UnitInput small id="nt-empTempDaysCur" label="臨時雇（年間）延べ人数・現状" unit="人" value={i.empTempDaysCur} onChange={(v) => set("empTempDaysCur", v)} error={parseCount(i.empTempDaysCur).error} />
              <UnitInput small id="nt-empTempDaysGoal" label="臨時雇（年間）延べ人数・見通し" unit="人" value={i.empTempDaysGoal} onChange={(v) => set("empTempDaysGoal", v)} error={parseCount(i.empTempDaysGoal).error} />
            </div>
            <p className={noteClass}>雇っている人がいない場合は、空欄のままでかまいません。</p>
          </fieldset>
        </Section>

        {/* 段階5 */}
        <Section step="5" title="改善の取り組み" formal="③〜⑥ 現状と目標・措置、（別紙１）農業用機械等の取得計画">
          <div className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg px-4 py-3 space-y-1">
            <p>どの欄も、例示を参考に、①現状、②目標、③その掲げた目標を達成するための具体的な方策を記載してください。</p>
            <p>「例示から書き出す」のボタンを押すと、見出しと「現状・目標・方策」の書き出しが入ります。</p>
          </div>

          {PLAN_GUIDES.map((g) => (
            <div key={g.key} className={cardClass}>
              <label className="block text-lg font-bold text-gray-800" htmlFor={`nt-${g.key}`}>
                {g.no} {g.title}
                {g.required && <Req />}
                <Formal>{g.formal}</Formal>
              </label>
              <ul className="text-sm text-gray-700 leading-relaxed mt-2 list-disc pl-5 space-y-1">
                {g.hint.map((s) => (
                  <li key={s}>{s}</li>
                ))}
                {g.key === "plan4" && (
                  <li>
                    記帳は
                    <Link href="/kicho" className={linkClass}>記帳ツール</Link>
                    で、青色申告承認申請書は
                    <Link href="/aoiro" className={linkClass}>青色申告承認申請書</Link>
                    のページで作れます。
                  </li>
                )}
              </ul>
              {g.examples.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-bold text-gray-700">例示から書き出す（国の記載方法の例示）</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {g.examples.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => insertIntoPlan(g.key, `【${ex}】\n現状：\n目標：\n方策：`)}
                        className="text-sm bg-white border-2 border-green-300 hover:border-green-500 hover:bg-green-50 text-green-800 rounded-full px-3 py-1 transition-colors text-left"
                      >
                        ＋ {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <details className="mt-3 rounded-lg border-2 border-amber-200 bg-amber-50 px-3 py-2">
                <summary className="cursor-pointer text-sm font-bold text-amber-900">書き方の見本を見る</summary>
                <p className="text-sm font-bold text-amber-900 mt-2">あぜみち作成の書き方の見本です（国の例文ではありません）</p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 bg-white rounded-lg border border-amber-200 px-3 py-2 mt-2 leading-relaxed">
                  {g.sample}
                </pre>
                <p className="text-sm text-gray-700 mt-2">○○の部分は、ご自身の経営に合わせて書きかえてください。</p>
                <button type="button" onClick={() => insertIntoPlan(g.key, g.sample)} className={`${subButtonClass} mt-2`}>
                  この見本を入力欄に入れる
                </button>
              </details>
              <textarea
                id={`nt-${g.key}`}
                value={i[g.key]}
                onChange={(e) => set(g.key, e.target.value)}
                rows={8}
                className={`${inputClass} mt-3 leading-relaxed`}
              />
            </div>
          ))}

          <fieldset className={cardClass}>
            <legend className="text-base font-bold text-gray-800 px-1">
              買う予定の機械など
              <Formal>（別紙１）生産方式の合理化に係る農業用機械等の取得計画</Formal>
            </legend>
            <p className="text-sm text-gray-700 leading-relaxed">
              「農業用機械等の名称」欄には、生産方式の合理化のために、取得する予定の農業用の機械及び装置、器具及び備品、建物及びその附属設備、構築物並びにソフトウェア等を記載してください。（複数記載可）②の「（３）農用地及び農業生産施設」欄に記載しているものは記載不要です。
            </p>
            <div className="space-y-3 mt-3">
              {i.machines.slice(0, machineCount).map((m, k) => (
                <div key={k} className="grid grid-cols-[1fr_7rem] gap-3">
                  <SmallText id={`nt-mac-${k}`} label={`${k + 1}．農業用機械等の名称`} value={m.name} onChange={(v) => setRow("machines", k, "name", v)} placeholder={k === 0 ? "例：田植機（8条）" : undefined} />
                  <SmallText id={`nt-mac-${k}-qty`} label="数量" value={m.qty} onChange={(v) => setRow("machines", k, "qty", v)} placeholder={k === 0 ? "例：1台" : undefined} />
                </div>
              ))}
            </div>
            {machineCount < MACHINE_ROWS && (
              <button type="button" onClick={() => setMachineCount((n) => Math.min(MACHINE_ROWS, n + 5))} className={`${subButtonClass} mt-3`}>
                ＋ 行を増やす（最大{MACHINE_ROWS}行）
              </button>
            )}
            <p className={noteClass}>買う予定がない場合は、空欄のままでかまいません（別紙１は空欄のまま印刷されます）。</p>
          </fieldset>
        </Section>

        {/* 段階6 */}
        <Section step="6" title="確認してPDFにする" formal="農業経営改善計画認定申請書（本体・別紙１）">
          <div>
            <h3 className="text-lg font-bold text-gray-800">入力されていない項目</h3>
            {missing.length > 0 ? (
              <div className="mt-2 rounded-lg bg-red-50 border-2 border-red-200 px-4 py-3">
                <p className="text-base font-bold text-red-700">まだ入力されていない項目が {missing.length} 件あります</p>
                <ul className="mt-2 space-y-1 text-base text-red-800">
                  {missing.map((m) => (
                    <li key={`${m.step}-${m.label}`}>
                      <a href={`#step-${m.step}`} className="underline underline-offset-2 hover:text-red-900">
                        段階{m.step}：{m.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-red-800 mt-2">入力されていなくてもPDFは作れます（空欄は印刷してから手書きできます）。</p>
              </div>
            ) : (
              <p className="mt-2 text-base font-bold text-green-800 bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3">
                必須の項目はすべて入力されています
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800">提出前のチェック</h3>
            <p className="text-sm text-gray-600 mt-1">窓口で確かめたら、チェックをつけておけます（この端末に保存されます）。</p>
            <ul className="space-y-3 mt-3">
              {CHECK_ITEMS.map((c) => (
                <li key={c.id} className={cardClass}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={i.checks.includes(c.id)}
                      onChange={() => toggleCheck(c.id)}
                      className="w-5 h-5 mt-1 accent-green-600 shrink-0"
                    />
                    <span>
                      <span className="block text-base font-bold text-gray-800">{c.title}</span>
                      <span className="block text-sm text-gray-700 leading-relaxed mt-1">{c.note}</span>
                    </span>
                  </label>
                  {c.link && (
                    <p className="text-sm mt-2 pl-8">
                      <a href={c.link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {c.link.label}
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button
              type="button"
              onClick={handlePdf}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
            >
              {isGenerating ? "PDF作成中…少々お待ちください" : "申請書をPDFで保存する"}
            </button>
            <p className="text-center text-sm text-gray-500 mt-3 leading-relaxed">
              A4横・3ページ（本体2ページ・別紙１）です。文章が長いと、ページが増えることがあります。PDFはこの端末の中で作られ、入力内容が外に送られることはありません。
              {isGenerating && "（フォントを読み込んでいます…）"}
            </p>
          </div>
        </Section>

        {/* リセット */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={resetInputs}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-bold py-3 px-6 rounded-xl transition-colors"
          >
            入力をリセット
          </button>
          <p className="text-sm text-gray-500 mt-2">共用のパソコンでは、最後にリセットしてください。</p>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、申請書の作成を補助するツールです。あぜみちから市町村などへ送信することはありません。記載内容の正確性や認定の要件はご自身で窓口にご確認ください。あぜみちは行政書士業務を行うものではありません。
        </p>
      </main>
    </div>
  );
}

// 農用地の1行
function LandCard({
  k,
  row,
  setRow,
}: {
  k: number;
  row: Inputs["lands"][number];
  setRow: (key: "lands", idx: number, field: keyof Inputs["lands"][number] & string, value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <p className="text-sm font-bold text-gray-700 mb-2">
        {LAND_KUBUN[k]}（{k % 2 === 0 ? "1行目" : "2行目"}）
      </p>
      <div className="grid grid-cols-2 gap-3">
        <PrefSelect id={`nt-land-${k}-pref`} label="都道府県名" value={row.pref} onChange={(v) => setRow("lands", k, "pref", v)} />
        <SmallText id={`nt-land-${k}-city`} label="市町村名" value={row.city} onChange={(v) => setRow("lands", k, "city", v)} />
        <div className="col-span-2 min-w-0">
          <label className={smallLabelClass} htmlFor={`nt-land-${k}-chimoku`}>地目（現況）</label>
          <select id={`nt-land-${k}-chimoku`} value={row.chimoku} onChange={(e) => setRow("lands", k, "chimoku", e.target.value)} className={smallInputClass}>
            <option value="">選択</option>
            {CHIMOKU_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <UnitInput small id={`nt-land-${k}-areaCur`} label="現状の面積" unit="a" inputMode="decimal" value={row.areaCur} onChange={(v) => setRow("lands", k, "areaCur", v)} error={parseArea(row.areaCur).error} />
        <UnitInput small id={`nt-land-${k}-areaGoal`} label="目標の面積" unit="a" inputMode="decimal" value={row.areaGoal} onChange={(v) => setRow("lands", k, "areaGoal", v)} error={parseArea(row.areaGoal).error} />
      </div>
    </div>
  );
}
