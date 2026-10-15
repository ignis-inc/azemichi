"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import {
  CATEGORY_OPTIONS,
  CHAIN_OPTIONS,
  EMAFF_URL,
  EMPTY,
  ENTITY_OPTIONS,
  GBIZ_URL,
  LAST_CHECKED,
  LIQUOR_OPTIONS,
  MAFF_URL,
  MAIN_BIZ_OPTIONS,
  PREFECTURES,
  PUBLISH_OPTIONS,
  SALES_KEYS,
  STAFF_NUMBERS,
  STORAGE_KEY,
  SUPPLY_KEYS,
  baseDate,
  buildSummary,
  formatTon,
  loadInputs,
  parseCount,
  parsePercent,
  parseTon,
  periodLabels,
  saveInputs,
  suggestCategory,
  sumPercents,
  toGenmai,
  type FieldKey,
  type Inputs,
} from "./komeShinData";

const inputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
const labelClass = "block text-base font-bold text-gray-700 mb-1";
const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";
const noteClass = "text-sm text-gray-600 leading-relaxed mt-2";
const linkClass = "text-green-700 underline underline-offset-2 hover:text-green-800 break-words";

// ---- 小さな部品 ----

function Section({ step, title, formal, children }: { step: string; title: string; formal: string; children: React.ReactNode }) {
  return (
    <section className={sectionClass} aria-labelledby={`ks-step-${step}`}>
      <p className="text-sm font-bold text-green-700">段階{step}</p>
      <h2 id={`ks-step-${step}`} className="text-xl font-bold text-green-800">{title}</h2>
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

// 国の資料からはわからない点の案内（地方農政局への確認を促す）
function AskNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 mt-2 leading-relaxed">
      {children}
    </p>
  );
}

function Choice({
  name,
  legend,
  formal,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  legend: string;
  formal: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {legend}
        {required && <Req />}
        <Formal>{formal}</Formal>
      </legend>
      <div className="space-y-2 mt-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-start gap-3 cursor-pointer bg-green-50 rounded-lg px-4 py-3 border-2 border-green-100 hover:border-green-400 transition-colors"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="w-5 h-5 mt-0.5 accent-green-600 shrink-0"
            />
            <span className="text-base text-gray-800">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NumberField({
  id,
  label,
  formal,
  unit,
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  formal?: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required && <Req />}
        {formal && <Formal>{formal}</Formal>}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className={`${inputClass} flex-1 min-w-0`}
        />
        <span className="text-base text-gray-600 whitespace-nowrap">{unit}</span>
      </div>
      <ErrorText text={error} />
    </div>
  );
}

function AddressFields({
  idPrefix,
  legend,
  values,
  onChange,
}: {
  idPrefix: string;
  legend: string;
  values: { zip: string; pref: string; city: string; rest: string };
  onChange: (part: "zip" | "pref" | "city" | "rest", v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-600" htmlFor={`${idPrefix}-zip`}>郵便番号（ハイフンなし）</label>
      <input
        id={`${idPrefix}-zip`}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        aria-label={`${legend}（郵便番号）`}
        value={values.zip}
        onChange={(e) => onChange("zip", e.target.value)}
        placeholder="例：8790000"
        className={inputClass}
      />
      <select
        aria-label={`${legend}（都道府県名）`}
        value={values.pref}
        onChange={(e) => onChange("pref", e.target.value)}
        className={inputClass}
      >
        <option value="">都道府県を選択</option>
        {PREFECTURES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        type="text"
        aria-label={`${legend}（市区町村名）`}
        value={values.city}
        onChange={(e) => onChange("city", e.target.value)}
        placeholder="市区町村名（例：豊後大野市）"
        className={inputClass}
      />
      <input
        type="text"
        aria-label={`${legend}（町域以降）`}
        value={values.rest}
        onChange={(e) => onChange("rest", e.target.value)}
        placeholder="町域以降（例：三重町1-2-3）"
        className={inputClass}
      />
    </div>
  );
}

// 割合の合計表示。eMAFFでは合計が100%でないと先へ進めないため、画面でも知らせる。
function PercentTotal({ total, hasError }: { total: number; hasError: boolean }) {
  const ok = total === 100 && !hasError;
  let message: string;
  if (hasError) message = "正しくない入力があります";
  else if (total === 100) message = "合計 100%（OK）";
  else if (total < 100) message = `合計 ${total}%　あと ${100 - total}%`;
  else message = `合計 ${total}%　100%を超えています`;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`mt-4 rounded-lg px-4 py-3 text-lg font-bold border-2 ${
        ok ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-300 text-red-700"
      }`}
    >
      {message}
      {!ok && <span className="block text-sm font-normal mt-1">合計が100%になるように入力してください。</span>}
    </p>
  );
}

// ---- 本体 ----

export default function KomeShinApp() {
  const [inputs, setInputs] = useState<Inputs>(loadInputs);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  function set(key: FieldKey, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function resetInputs() {
    if (!window.confirm("入力した内容をすべて消して、最初の状態に戻します。よろしいですか？")) return;
    setInputs(EMPTY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 消せなくても画面の入力は空になる
    }
  }

  const i = inputs;
  const isCorp = i.entityType === "1";
  const same = i.contactSame === "1";
  const periods = periodLabels(baseDate(i.todokedeDate));
  const prevTotal = toGenmai(i.prevSeimai, i.prevGenmai);
  const curTotal = toGenmai(i.curSeimai, i.curGenmai);
  const { suggestion, salesMax } = suggestCategory(i);
  const suggestionValue = suggestion === "9" || suggestion === "47" ? suggestion : null;
  const supplySum = sumPercents(i, SUPPLY_KEYS);
  const salesSum = sumPercents(i, SALES_KEYS);
  const tohseiCount = parseCount(i.tohseiCount).value;
  const soukoCount = parseCount(i.soukoCount).value;
  const mainBiz = MAIN_BIZ_OPTIONS.find((o) => o.value === i.mainBiz);
  const summary = useMemo(() => buildSummary(inputs), [inputs]);
  const missingCount = summary.reduce((n, s) => n + s.rows.filter((r) => r.missing).length, 0);
  const thisYear = new Date().getFullYear();

  function setOwnOnly() {
    setInputs((prev) => {
      const next = { ...prev };
      for (const { key } of SUPPLY_KEYS) next[key] = "0";
      next.supplyOwn = "100";
      return next;
    });
  }

  async function handlePdf() {
    setIsGenerating(true);
    try {
      const { downloadDraftPdf } = await import("./komeShinPdf");
      await downloadDraftPdf(summary);
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
        <h1 className="text-2xl font-bold leading-tight">お米の新しい届出（電子申請）の下書き</h1>
        <p className="mt-2 text-green-100 text-base">正式名称：米穀等取扱事業の開始届出（eMAFF入力の下書き）</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            eMAFFに入力する内容を、先にここで準備できます。あぜみちから国へ送ることはありません。入力内容は、この端末のブラウザだけに保存されます。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a href={MAFF_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              農林水産省「米穀等取扱事業の届出について」
            </a>
            <br />
            最終確認：{LAST_CHECKED}
          </p>
        </div>

        {/* はじめに */}
        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4 mt-4">
          <h2 className="text-base font-bold text-yellow-900 mb-2">はじめに</h2>
          <div className="space-y-2 text-sm text-yellow-900 leading-relaxed">
            <p className="font-bold">
              このツールは、新しく始める届出（開始の届出）の下書き用です。変更や廃止の届出には対応していません。
            </p>
            <p>
              食糧法の改正により、特定規模以上の米穀等取扱事業（出荷又は販売の事業、加工等事業）を行おうとする者は、新たに届出（食糧法第9条）が必要となります。また、これまでの米穀の出荷又は販売の事業の届出（食糧法第47条）についても、届出事項が追加となるため、改めて届出が必要となります。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>届出期間：2026年10月1日（木）～2027年4月1日（木）</li>
              <li>一般届出（食糧法第47条）：年間20精米トン（22玄米トン）以上300玄米トン未満の出荷又は販売事業を行おうとする者</li>
              <li>特定規模届出（食糧法第9条）：年間300玄米トン以上の米穀等取扱事業を行おうとする者</li>
              <li>届出方法：原則、電子申請（eMAFF）</li>
            </ul>
            <p>このツールは、一般届出（食糧法第47条）を中心にしています。</p>
            <p>
              2027年3月31日までの間に米穀の出荷又は販売の事業を開始・変更・廃止する場合は、現行の「米穀の出荷又は販売の事業の届出」が必要となります。
              <br />
              <Link href="/kome" className="underline underline-offset-2 font-bold hover:text-yellow-950">
                これまでの届出書（米穀の出荷又は販売の事業開始届出書）をつくる →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <DocNav current="/kome-shin" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          <span className="req">必須</span> は、eMAFFで入力が必要な項目です。下書きは途中まででも、この端末に自動で保存されます。
        </p>

        {/* 段階1 */}
        <Section step="1" title="事業者の情報" formal="１．事業者の情報">
          <AskNote>
            eMAFFでは、この段階の項目に、GビズIDに登録した内容が自動で入ります（本店所在地の郵便番号のみ手動で入力）。GビズIDを作るときや、自動で入った内容を確かめるときに使ってください。
          </AskNote>

          <Choice
            name="entityType"
            legend="法人ですか、個人ですか"
            formal="法人・個人の区別"
            options={ENTITY_OPTIONS}
            value={i.entityType}
            onChange={(v) => set("entityType", v)}
            required
          />

          {isCorp && (
            <div>
              <label className={labelClass} htmlFor="ks-corpNumber">
                法人番号（13桁）<Req />
                <Formal>法人番号 (法人の場合のみ記載)</Formal>
              </label>
              <input
                id="ks-corpNumber"
                type="text"
                inputMode="numeric"
                value={i.corpNumber}
                onChange={(e) => set("corpNumber", e.target.value)}
                className={inputClass}
              />
              <p className={noteClass}>国税庁から指定された13桁の法人番号について、法人の場合に限り記載するものとする。</p>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="ks-tradeName">
              屋号（なければお名前）<Req />
              <Formal>商号、名称又は屋号</Formal>
            </label>
            <input
              id="ks-tradeName"
              type="text"
              value={i.tradeName}
              onChange={(e) => set("tradeName", e.target.value)}
              className={inputClass}
            />
            <p className={noteClass}>
              法人の場合は登記上の商号・名称。個人事業主の場合は個人事業の開業届で届け出た屋号又は氏名。任意団体の場合はその団体名。「㈱」等の略称は使用せず、記号やスペース等を含め、登記等で届け出た名称と完全に一致させること。
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="ks-repName">
              お名前（法人は代表者のお名前）<Req />
              <Formal>代表者氏名又は氏名</Formal>
            </label>
            <input
              id="ks-repName"
              type="text"
              autoComplete="name"
              value={i.repName}
              onChange={(e) => set("repName", e.target.value)}
              placeholder="例：田中　太郎"
              className={inputClass}
            />
            <p className={noteClass}>法人の場合は登記上の代表者の氏名。個人事業主の場合は本人の氏名。任意団体の場合は代表者の氏名。</p>
          </div>

          <div>
            <p className={labelClass}>
              住所（住民票の住所）<Req />
              <Formal>主たる事務所の所在地</Formal>
            </p>
            <AddressFields
              idPrefix="ks-office"
              legend="主たる事務所の所在地"
              values={{ zip: i.officeZip, pref: i.officePref, city: i.officeCity, rest: i.officeRest }}
              onChange={(part, v) =>
                set(({ zip: "officeZip", pref: "officePref", city: "officeCity", rest: "officeRest" } as const)[part], v)
              }
            />
            <p className={noteClass}>
              法人の場合は登記上の本店又は主たる事務所の所在地。個人事業主の場合は住民票上の本人の住所。任意団体の場合は当該団体の代表者の住民票上の住所。「郵便番号」はハイフンなしの半角数字で記載。「市区町村」は、政令指定都市は区名を含めて記載、町村は郡名を省略せずに記載。
            </p>
          </div>

          <div>
            <p className={labelClass}>
              お米の仕事をしている場所と連絡先<Req />
              <Formal>住所・連絡先</Formal>
            </p>
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={same}
                onChange={(e) => set("contactSame", e.target.checked ? "1" : "")}
                className="w-5 h-5 accent-green-600"
              />
              <span className="text-base text-gray-700">上の住所と同じ</span>
            </label>
            {!same && (
              <AddressFields
                idPrefix="ks-contact"
                legend="住所・連絡先"
                values={{ zip: i.contactZip, pref: i.contactPref, city: i.contactCity, rest: i.contactRest }}
                onChange={(part, v) =>
                  set(({ zip: "contactZip", pref: "contactPref", city: "contactCity", rest: "contactRest" } as const)[part], v)
                }
              />
            )}
            <div className="space-y-2 mt-3">
              <label className="block text-sm text-gray-600" htmlFor="ks-contactPhone">連絡先電話番号</label>
              <input
                id="ks-contactPhone"
                type="tel"
                autoComplete="tel"
                value={i.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className={inputClass}
              />
              <label className="block text-sm text-gray-600" htmlFor="ks-contactEmail">メールアドレス</label>
              <input
                id="ks-contactEmail"
                type="email"
                autoComplete="email"
                value={i.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                className={inputClass}
              />
            </div>
            <p className={noteClass}>
              米穀等取扱事業（米穀の出荷又は販売又は米穀を原材料とする飲食料品の加工、製造若しくは調製の事業）を行っている事務所の住所、電話番号及びメールアドレスを記載するものとする。GビズIDの申請者連絡先・電話番号は、米穀等取扱事業を取り扱う担当者が所在する事務所等の情報を設定してください。
            </p>
          </div>

          <details className="rounded-lg border-2 border-green-100 px-4 py-3">
            <summary className="cursor-pointer text-base font-bold text-gray-700">
              ほかに担当の方がいれば（任意・最大3名）
              <Formal>担当者連絡先（任意）</Formal>
            </summary>
            <p className={noteClass}>
              上記以外の担当者連絡先がある場合は担当者氏名、担当者部署名、担当者電話番号及び担当者メールアドレスを記載するものとする。「氏名」は、姓と名の間に全角スペースを挿入すること。「部署名」は、部署名がない場合は「なし」と記載すること。「電話番号」は、ハイフンなしの半角数字11桁以内で記載すること。
            </p>
            {STAFF_NUMBERS.map((n) => (
              <fieldset key={n} className="mt-4 space-y-2">
                <legend className="text-base font-bold text-gray-700">担当者連絡先{n}</legend>
                {([
                  ["Name", "担当者氏名", "text"],
                  ["Dept", "担当者部署名", "text"],
                  ["Phone", "担当者電話番号", "tel"],
                  ["Email", "担当者メールアドレス", "email"],
                ] as const).map(([suffix, label, type]) => {
                  const key = `staff${n}${suffix}` as FieldKey;
                  return (
                    <div key={suffix}>
                      <label className="block text-sm text-gray-600" htmlFor={`ks-${key}`}>{label}</label>
                      <input
                        id={`ks-${key}`}
                        type={type}
                        value={i[key]}
                        onChange={(e) => set(key, e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </details>
        </Section>

        {/* 段階2 */}
        <Section step="2" title="開始の届出" formal="２．開始の届出">
          <div>
            <label className={labelClass} htmlFor="ks-todokedeDate">
              届出する日（空欄でもかまいません）
              <Formal>届出年月日（西暦）</Formal>
            </label>
            <input
              id="ks-todokedeDate"
              type="date"
              value={i.todokedeDate}
              onChange={(e) => set("todokedeDate", e.target.value)}
              className={inputClass}
            />
            <p className={noteClass}>
              開始届出書を提出する日を西暦で記載する。eMAFFでは、届出を申請する日を選択してください。
            </p>
          </div>

          <div>
            <p className={labelClass}>
              お米を売り始めた（売り始める）年と月<Req />
              <Formal>事業の開始時期</Formal>
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                aria-label="事業の開始時期（西暦年）"
                value={i.startYear}
                onChange={(e) => set("startYear", e.target.value)}
                placeholder={String(thisYear)}
                className={`${inputClass} w-32`}
              />
              <span className="text-base text-gray-600">年</span>
              <select
                aria-label="事業の開始時期（月）"
                value={i.startMonth}
                onChange={(e) => set("startMonth", e.target.value)}
                className={`${inputClass} w-28`}
              >
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, k) => String(k + 1)).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-base text-gray-600">月</span>
            </div>
            <ErrorText
              text={i.startYear && !/^\d{4}$/.test(i.startYear) ? "西暦の4けたで入力してください（例：2010）" : undefined}
            />
            <p className={noteClass}>
              米穀等取扱事業を開始する（予定を含む。）、又は開始した年及び月を西暦で記載。
            </p>
            <AskNote>始めた年と月がわからない場合は、地方農政局にご確認ください。</AskNote>
          </div>

          <div>
            <Choice
              name="category"
              legend="届出の種類"
              formal="届出の区分"
              options={CATEGORY_OPTIONS}
              value={i.category}
              onChange={(v) => set("category", v)}
              required
            />
            {suggestionValue && (
              <div className="mt-3 rounded-lg bg-green-50 border-2 border-green-200 px-4 py-3">
                <p className="text-base text-green-900">
                  段階3の数量からの目安：
                  <strong>{suggestionValue === "47" ? "一般届出（食糧法第47条）" : "特定規模届出（食糧法第9条）"}になりそうです</strong>
                </p>
                {i.category !== suggestionValue && (
                  <button
                    type="button"
                    onClick={() => set("category", suggestionValue)}
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white text-base font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    目安のとおりに選ぶ
                  </button>
                )}
              </div>
            )}
            <p className={noteClass}>
              食糧法第９条に基づく届出又は食糧法第47条に基づく届出を選択。「届出時点における出荷、販売又は買入の数量」の情報に基づいて届出区分を判定する。届出区分の判定においては、前年実績又は当年予定のいずれか大きい方の数量を用いる。
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="ks-mainBiz">
              いちばん多いお米の仕事<Req />
              <Formal>主たる事業として位置付ける米穀等取扱事業の種類</Formal>
            </label>
            <select
              id="ks-mainBiz"
              value={i.mainBiz}
              onChange={(e) => set("mainBiz", e.target.value)}
              className={inputClass}
            >
              <option value="">選択してください</option>
              {MAIN_BIZ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {mainBiz && <p className="text-base text-gray-700 mt-2 bg-green-50 rounded-lg px-4 py-2">{mainBiz.desc}</p>}
            <p className={noteClass}>
              米穀の取扱いに係る複数の事業を行っている場合は、原則、米穀の取扱数量が最も大きい事業の種類を選択してください。
            </p>
          </div>

          <div>
            <Choice
              name="chain"
              legend="フランチャイズの本部として届け出ますか"
              formal="連鎖化事業者としての届出"
              options={CHAIN_OPTIONS}
              value={i.chain}
              onChange={(v) => set("chain", v)}
              required
            />
            <p className={noteClass}>
              該当の有無を選択。フランチャイズチェーンの場合には、フランチャイズの本部事業者（連鎖化事業者）がフランチャイズ契約をしている加盟店の数量等もまとめて届け出ることが可能。
            </p>
            {i.chain === "1" && (
              <AskNote>
                連鎖化事業者として届出を行う者は、加盟者の名称等（商号、名称又は氏名）及び住所（本社、事業所の住所等）を記載した書類（様式自由）を添付すること。このツールでは、この書類は作成できません。
              </AskNote>
            )}
          </div>

          <div>
            <Choice
              name="liquor"
              legend="お酒を造る免許"
              formal="酒類製造免許の有無"
              options={LIQUOR_OPTIONS}
              value={i.liquor}
              onChange={(v) => set("liquor", v)}
              required
            />
            <p className={noteClass}>酒類製造免許の有無を選択。</p>
          </div>
        </Section>

        {/* 段階3 */}
        <Section step="3" title="出荷・販売・買入の数量" formal="３．届出時点における出荷、販売又は買入の数量">
          <div className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg px-4 py-3 space-y-1">
            <p>「年」の期間は、毎年７月1日から翌年６月30日までの一年間とし、届出の属する期間を当年、その前の期間を前年とします。</p>
            <p>数量は「玄米トン」で記載。精米での取扱いは、「精米÷0.91」で玄米換算し、玄米での取扱いの数量と合算して記載。ただし、この換算方法で算出した場合に実態と乖離する場合には、事業者ごとの精米歩合により玄米重量へ換算すること。</p>
            <p>取扱いがない項目は空欄にせず、必ず「0」と記載。</p>
          </div>

          {([
            { key: "prev", title: `去年（前年：${periods.prev}）に売った量`, formal: "前年の数量", seimai: "prevSeimai", genmai: "prevGenmai", to: "prevToTodokede", total: prevTotal, seimaiLabel: "精米で売った量", genmaiLabel: "玄米で売った量" },
            { key: "cur", title: `今年（当年：${periods.cur}）に売る予定の量`, formal: "当年の予定数量", seimai: "curSeimai", genmai: "curGenmai", to: "curToTodokede", total: curTotal, seimaiLabel: "精米で売る予定の量", genmaiLabel: "玄米で売る予定の量" },
          ] as const).map((row) => (
            <fieldset key={row.key} className="rounded-xl border-2 border-green-100 px-4 py-4 space-y-4">
              <legend className="text-base font-bold text-gray-800 px-1">
                {row.title}<Req />
                <Formal>米穀の出荷又は販売の事業における出荷数量及び販売数量の合計　{row.formal}</Formal>
              </legend>
              <NumberField
                id={`ks-${row.seimai}`}
                label={row.seimaiLabel}
                unit="精米トン"
                value={i[row.seimai]}
                onChange={(v) => set(row.seimai, v)}
                error={parseTon(i[row.seimai]).error}
              />
              <NumberField
                id={`ks-${row.genmai}`}
                label={row.genmaiLabel}
                unit="玄米トン"
                value={i[row.genmai]}
                onChange={(v) => set(row.genmai, v)}
                error={parseTon(i[row.genmai]).error}
              />
              <div className="rounded-lg bg-white border-2 border-green-300 px-4 py-3" aria-live="polite">
                <p className="text-sm text-gray-600">玄米トンに換算した合計（eMAFFに入れる数）</p>
                <p className="text-2xl font-bold text-green-800">
                  {row.total === null ? "—" : `${formatTon(row.total)} 玄米トン`}
                </p>
                {row.total !== null && parseTon(i[row.seimai]).value !== null && (
                  <p className="text-sm text-gray-600 mt-1">
                    計算：{i[row.seimai]} 精米トン ÷ 0.91
                    {!!parseTon(i[row.genmai]).value && ` ＋ ${i[row.genmai]} 玄米トン`}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  小数点以下2けたまで表示しています。eMAFFでの入力のしかたは、eMAFFの画面の案内に従ってください。
                </p>
              </div>
              <NumberField
                id={`ks-${row.to}`}
                label="届出事業者に販売・販売委託した量（参考。合計には入れません）"
                unit="玄米トン"
                value={i[row.to]}
                onChange={(v) => set(row.to, v)}
                error={parseTon(i[row.to]).error}
              />
            </fieldset>
          ))}

          <div className="text-sm text-gray-700 leading-relaxed space-y-1">
            <p>
              自ら生産した米穀を出荷又は販売する者であって、その者が一般届出事業者の届出（食糧法第47条に基づく届出）を行う場合、他の届出事業者に当該米穀を販売又は販売委託したものを除いて数量を算定する。
            </p>
            <p>自ら生産した米穀を、自家消費や無償譲渡した場合（いわゆる縁故米）は、届出の取扱数量に含まれません。</p>
            {i.category === "9" && (
              <AskNote>
                上の合計は、一般届出（食糧法第47条）の数え方です。特定規模届出（食糧法第9条）の場合の数え方は、農林水産省のページでご確認ください。
              </AskNote>
            )}
          </div>

          {/* 届出の区分の目安 */}
          {suggestion && (
            <div role="status" aria-live="polite" className={`rounded-xl px-5 py-4 border-2 ${
              suggestion === "under" ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-400"
            }`}>
              {salesMax !== null && (
                <p className="text-sm text-gray-700">
                  前年と当年の大きい方：<strong>{formatTon(salesMax)} 玄米トン</strong>
                </p>
              )}
              {suggestion === "47" && (
                <p className="text-lg font-bold text-green-800 mt-1">一般届出（食糧法第47条）になりそうです</p>
              )}
              {suggestion === "9" && (
                <>
                  <p className="text-lg font-bold text-green-800 mt-1">特定規模届出（食糧法第9条）になりそうです</p>
                  <p className="text-sm text-gray-700 mt-1">
                    特定規模届出事業者は、定期報告により、在庫量等を報告いただきます。詳しくは農林水産省のページでご確認ください。
                  </p>
                </>
              )}
              {suggestion === "under" && (
                <>
                  <p className="text-lg font-bold text-yellow-900 mt-1">年間20精米トン（22玄米トン）未満のため、届出の対象外かもしれません</p>
                  <p className="text-sm text-yellow-900 mt-1">規模要件に満たない場合は、届出をする必要はありません。届出が必要かどうかは、地方農政局にご確認ください。</p>
                </>
              )}
              <p className="text-sm text-gray-600 mt-2">この表示は目安です。段階2の「届出の種類」で選んでください。</p>
            </div>
          )}

          <details className="rounded-lg border-2 border-green-100 px-4 py-3">
            <summary className="cursor-pointer text-base font-bold text-gray-700">
              お米を買って加工・調理に使った量（最初は0）
              <Formal>加工等事業における買入数量</Formal>
            </summary>
            <p className={noteClass}>
              加工等事業（加工、中食、外食）において、当該事業のために買い入れた米穀の数量を記載。丸粒の米を仕入れた数量。米穀粉や米飯等、加工済みの状態での仕入については除外して算定すること。取扱いがない項目は空欄にせず、必ず「0」と記載。
            </p>
            <div className="space-y-4 mt-3">
              <NumberField
                id="ks-buyPrev"
                label={`前年（${periods.prev}）`}
                formal="前年の数量"
                unit="玄米トン"
                value={i.buyPrev}
                onChange={(v) => set("buyPrev", v)}
                error={parseTon(i.buyPrev).error}
              />
              <NumberField
                id="ks-buyCur"
                label={`当年（${periods.cur}）`}
                formal="当年の予定数量"
                unit="玄米トン"
                value={i.buyCur}
                onChange={(v) => set("buyCur", v)}
                error={parseTon(i.buyCur).error}
              />
            </div>
          </details>
        </Section>

        {/* 段階4 */}
        <Section step="4" title="お米の仕入先と販売先の割合" formal="４．届出時点における米穀の生産又は仕入先の割合及び販売先又は使用の割合">
          <div className="text-sm text-gray-700 leading-relaxed bg-green-50 rounded-lg px-4 py-3 space-y-1">
            <p>割合（％）を整数で記載。すでに事業を行っている場合は前年実績の割合を、これから事業を行う場合は予定する割合を記載。[合計] が必ず100%になるよう記載すること。</p>
            <p>本項目では、出荷・販売事業と加工等事業を区別せず、米穀の取扱い全体を母数として、それぞれの割合を算出すること。</p>
          </div>

          <fieldset>
            <legend className={labelClass}>
              お米をどこから手に入れたか（%）<Req />
              <Formal>事業の用に供する米穀の生産又は仕入先の割合（％）</Formal>
            </legend>
            <button
              type="button"
              onClick={setOwnOnly}
              className="mt-2 mb-3 border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white text-base font-bold py-2 px-4 rounded-lg transition-colors"
            >
              「自ら生産したもの」を100%にする
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUPPLY_KEYS.map(({ key, label }) => (
                <NumberField
                  key={key}
                  id={`ks-${key}`}
                  label={label}
                  unit="%"
                  value={i[key]}
                  onChange={(v) => set(key, v)}
                  error={parsePercent(i[key]).error}
                />
              ))}
            </div>
            <PercentTotal total={supplySum.total} hasError={supplySum.hasError} />
            <p className={noteClass}>[その他] には、他のいずれにも該当しないものを含めること（政府や海外の事業者から仕入れたもの等）。</p>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>
              お米をどこへ売ったか（%）<Req />
              <Formal>事業の用に供する米穀の販売先又は使用の割合（％）</Formal>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {SALES_KEYS.map(({ key, label }) => (
                <NumberField
                  key={key}
                  id={`ks-${key}`}
                  label={label}
                  unit="%"
                  value={i[key]}
                  onChange={(v) => set(key, v)}
                  error={parsePercent(i[key]).error}
                />
              ))}
            </div>
            <PercentTotal total={salesSum.total} hasError={salesSum.hasError} />
            <p className={noteClass}>[その他] には、他のいずれにも該当しないものを含めること（海外の事業者への売り渡しや廃棄、無償譲渡等）。</p>
            <AskNote>無料であげた分をどう数えるかがわからない場合は、地方農政局にご確認ください。</AskNote>
          </fieldset>
        </Section>

        {/* 段階5 */}
        <Section step="5" title="お米の仕事に使う施設" formal="５．届出時点における事業の用に供する施設の内容">
          <NumberField
            id="ks-prefCount"
            label="お米の仕事の場所がある都道府県の数"
            formal="事業拠点がある都道府県の数"
            unit="(都道府県の数)"
            value={i.prefCount}
            onChange={(v) => set("prefCount", v)}
            error={parseCount(i.prefCount).error}
            required
            placeholder="1"
          />
          <p className={`${noteClass} -mt-4`}>
            事業拠点（事務所や店舗、工場等）が所在している都道府県の数を記載。主たる事務所に加え、事業者自らが所有又は管理する、米穀の取引や保管に関わる事務所、店舗、工場、倉庫等を対象とすること。（借り上げている営業倉庫は対象外）
          </p>

          <div className="space-y-4">
            <NumberField
              id="ks-tohseiCount"
              label="精米する設備の数"
              formal="とう精施設の数"
              unit="か所"
              value={i.tohseiCount}
              onChange={(v) => set("tohseiCount", v)}
              error={parseCount(i.tohseiCount).error}
              required
            />
            {tohseiCount !== null && tohseiCount >= 1 && (
              <NumberField
                id="ks-tohseiCapacity"
                label="精米する能力（1時間に処理できる玄米の量）"
                formal="合計とう精能力"
                unit="kg／時間"
                value={i.tohseiCapacity}
                onChange={(v) => set("tohseiCapacity", v)}
                error={parseTon(i.tohseiCapacity).error}
                required
              />
            )}
            <p className={noteClass}>
              届出事業者自らが保有又は管理するとう精施設の数を記載する。この際、同一敷地内に精米機が複数ある場合は、それら設備群を１つの施設として取り扱う。該当する施設がない場合は「0」。
            </p>
          </div>

          <div className="space-y-4">
            <NumberField
              id="ks-soukoCount"
              label="温度と湿度を管理できる倉庫の数"
              formal="定温倉庫の数"
              unit="か所"
              value={i.soukoCount}
              onChange={(v) => set("soukoCount", v)}
              error={parseCount(i.soukoCount).error}
              required
            />
            {soukoCount !== null && soukoCount >= 1 && (
              <NumberField
                id="ks-soukoCapacity"
                label="倉庫に入る量（お米の保管に使う分）"
                formal="合計収容能力"
                unit="トン"
                value={i.soukoCapacity}
                onChange={(v) => set("soukoCapacity", v)}
                error={parseTon(i.soukoCapacity).error}
                required
              />
            )}
            <p className={noteClass}>
              定温倉庫とは、いわゆる低温倉庫等、温度及び湿度を管理できる倉庫をいう。届出事業者自らが保有又は管理し、かつ米穀の保管に供する定温倉庫の数を記載する。当該施設を米穀の保管以外の用途にも使用している場合は、米穀の保管に供する（予定を含む。）収容能力についてのみ算入する。該当する施設がない場合は「0」。
            </p>
          </div>

          <AskNote>
            農家の小型精米機や保冷庫が入るかどうかは、国の資料に書かれていません。わからない場合は地方農政局にご確認ください。
          </AskNote>
        </Section>

        {/* 段階6 */}
        <Section step="6" title="届出をしたことの公表" formal="６．届出事項の一部情報の公表について">
          <Choice
            name="publish"
            legend="届出をしたことを国の一覧に載せてよいですか"
            formal="届出情報の一部情報の公表への同意"
            options={PUBLISH_OPTIONS}
            value={i.publish}
            onChange={(v) => set("publish", v)}
            required
          />
          <p className={noteClass}>
            届出事項の一部（法人番号、商号・名称又は屋号、主たる事務所の都道府県名及び市区町村名、届出年月日、届出の区分、連鎖化事業者としての届出、主たる事業の種類）に限り、米穀等取扱事業の届出事業者の一覧として取りまとめ、公表することとしています。「２．同意しない」とした場合は、当該公表の対象外とします。公表する情報は一部に限り、取扱数量等の営業に係る情報や個人情報は対象外。
          </p>
          <AskNote>
            屋号がない場合、屋号の欄に入れたお名前が載る可能性があります。気になる場合は地方農政局にご確認ください。
          </AskNote>
        </Section>

        {/* 一覧 */}
        <section className={sectionClass} aria-labelledby="ks-summary">
          <h2 id="ks-summary" className="text-xl font-bold text-green-800 mb-1">入力内容の一覧</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            eMAFFの画面を開いて、この一覧を見ながら入力してください。左側は国の様式の項目名です。
          </p>
          {missingCount > 0 ? (
            <p className="text-base font-bold text-red-700 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-3 mb-4">
              まだ入力されていない（または合計が100%でない）項目が {missingCount} 件あります
            </p>
          ) : (
            <p className="text-base font-bold text-green-800 bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3 mb-4">
              必須の項目はすべて入力されています
            </p>
          )}
          <div className="space-y-6">
            {summary.map((section) => (
              <div key={section.title}>
                <h3 className="text-base font-bold text-green-800 mb-2">{section.title}</h3>
                <dl className="border border-gray-300 rounded-lg divide-y divide-gray-300 overflow-hidden">
                  {section.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                      <dt className="bg-green-50 px-3 py-2 text-sm text-gray-700 break-words">{row.label}</dt>
                      <dd className={`px-3 py-2 text-base break-words ${row.missing ? "text-red-700 font-bold" : "text-gray-900"}`}>
                        {row.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePdf}
            disabled={isGenerating}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
          >
            {isGenerating ? "PDF作成中…少々お待ちください" : "一覧をPDFで保存する"}
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            PDFは「下書き（提出用ではありません）」です。PDFはこの端末の中で作られ、入力内容が外に送られることはありません。
            {isGenerating && "（フォントを読み込んでいます…）"}
          </p>
        </section>

        {/* 手順の案内 */}
        <section className={sectionClass} aria-labelledby="ks-steps">
          <h2 id="ks-steps" className="text-xl font-bold text-green-800 mb-4">GビズIDの取得からeMAFFで送るまで</h2>
          <ol className="space-y-5">
            {[
              {
                title: "GビズIDを作る",
                body: (
                  <>
                    <p>すでにGビズIDをお持ちの場合、改めての作成は不要です。米穀等取扱事業の届出の電子申請においては、すべてのアカウント種別（エントリー・プライム・メンバー）が利用可能です。GビズIDエントリーはオンライン申請により即時発行されます。</p>
                    <p className="mt-1">ここで登録するGビズIDのアカウント情報は、届出の申請画面にて「事業者の情報」として自動反映されます。登録する際に、記載した情報に誤りがないことを確認してください（この下書きの段階1を見ながら登録できます）。</p>
                    <p className="mt-1"><a href={GBIZ_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>デジタル庁 GビズID情報サイト</a></p>
                  </>
                ),
              },
              {
                title: "eMAFF申請にログインする",
                body: (
                  <p>「eMAFF申請」にアクセスし、ホーム画面で［ログイン］ボタン、続けて［GビズIDでログイン］ボタンをクリックします。GビズIDのアカウントIDとパスワードを入力してログインします。</p>
                ),
              },
              {
                title: "「米穀等取扱事業の開始届出」を開く",
                body: (
                  <p>トップ画面で［手続検索］ボタンをクリックし、キーワードに「米穀等取扱事業の開始届出」と入力して［検索］。検索結果の［申請を開始］ボタンをクリックします。</p>
                ),
              },
              {
                title: "この下書きを見ながら入力する",
                body: (
                  <p>本店所在地の郵便番号のみ手動で入力してください。それ以外の「事業者の情報」は、GビズIDのアカウント情報が自動反映されます。郵便番号入力後に［郵便番号から検索］ボタンを押すと住所が上書きされてしまうのでご注意ください。入力を途中で中断したい場合は、［一時保存］ボタンで保存できます。</p>
                ),
              },
              {
                title: "申請する",
                body: (
                  <p>すべての入力が完了したら、画面下部の［申請］ボタンをクリックし、入力内容を再度確認して、もう一度［申請］ボタンをクリックします。申請が完了すると、申請者メールアドレスあてに「電子申請受付のお知らせ」の通知メールが送信されます。</p>
                ),
              },
              {
                title: "農林水産省にて受理",
                body: (
                  <p>農林水産省での確認及び受理が完了したら、「電子申請受理完了のお知らせ」の通知メールが送信されます。不備や確認事項があった場合は「差戻し」となり、「電子申請差戻しのご連絡」の通知メールが届きます。リンクをクリックする前に、差出人メールアドレスが「emaff2@maff.go.jp」であることを必ず確認してください。</p>
                ),
              },
            ].map((s, idx) => (
              <li key={s.title} className="flex gap-3 items-start">
                <span className="shrink-0 w-8 h-8 rounded-full bg-green-600 text-white text-base font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="text-base text-gray-800 leading-relaxed">
                  <p className="font-bold text-gray-900">{s.title}</p>
                  <div className="text-sm text-gray-700 mt-1">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="space-y-3 mt-6">
            <a
              href={EMAFF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-lg font-bold py-4 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              eMAFF申請を開く →
            </a>
            <a
              href={MAFF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-lg font-bold py-4 px-4 rounded-xl border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white transition-colors"
            >
              農林水産省：米穀等取扱事業の届出について →
            </a>
          </div>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            手順は、農林水産省のパンフレット「電子申請による届出の手順」をもとにしています。ご不明な点等がある場合は、農林水産省のページの「地方農政局等の連絡先」までお問い合わせください。
          </p>
        </section>

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
          このサービスは、eMAFFに入力する内容を整理するための補助ツールです。あぜみちから国へ送信することはありません。記載内容の正確性や届出の要否はご自身でご確認ください。あぜみちは行政書士業務を行うものではありません。
        </p>
      </main>
    </div>
  );
}
