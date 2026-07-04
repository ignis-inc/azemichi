"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";
import { isValidWarekiDate } from "../wareki";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const SHOWA_YEARS  = Array.from({ length: 45 }, (_, i) => i + 20); // 昭和20〜64
const HEISEI_YEARS = Array.from({ length: 31 }, (_, i) => i + 1);  // 平成1〜31
const REIWA_YEARS  = Array.from({ length: 8  }, (_, i) => i + 1);  // 令和1〜8

const ERA_YEARS: Record<string, number[]> = {
  "昭和": SHOWA_YEARS,
  "平成": HEISEI_YEARS,
  "令和": REIWA_YEARS,
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

type AoiroFormData = {
  name: string;
  nameKana: string;
  dobEra: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  myNumber: string;
  farmName: string;
  farmTypes: string[];
  startEra: string;
  startYear: string;
  startMonth: string;
  startDay: string;
  taxOffice: string;
  bookType: string;
};

export default function AoiroPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // モーダルを閉じたときにフォーカスを戻す先（作成ボタン）
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<AoiroFormData>({
    name: "",
    nameKana: "",
    dobEra: "昭和",
    dobYear: "50",
    dobMonth: "1",
    dobDay: "1",
    prefecture: "",
    cityAddress: "",
    phone: "",
    myNumber: "",
    farmName: "",
    farmTypes: [],
    startEra: "令和",
    startYear: "1",
    startMonth: "1",
    startDay: "1",
    taxOffice: "",
    bookType: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    // 元号が変わったとき年のデフォルトをリセット
    if (name === "dobEra") {
      const years = ERA_YEARS[value] ?? [];
      setForm((prev) => ({ ...prev, dobEra: value, dobYear: String(years[0] ?? 1) }));
      return;
    }
    if (name === "startEra") {
      const years = ERA_YEARS[value] ?? [];
      setForm((prev) => ({ ...prev, startEra: value, startYear: String(years[0] ?? 1) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFarmType(type: string) {
    setForm((prev) => {
      const has = prev.farmTypes.includes(type);
      return {
        ...prev,
        farmTypes: has ? prev.farmTypes.filter((t) => t !== type) : [...prev.farmTypes, type],
      };
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "氏名を入力してください";
    if (!form.prefecture) e.prefecture = "都道府県を選択してください";
    if (!form.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    if (!isValidWarekiDate(form.dobEra, Number(form.dobYear), Number(form.dobMonth), Number(form.dobDay))) {
      e.dob = "生年月日が実在しない日付です。月と日をご確認ください";
    }
    if (!isValidWarekiDate(form.startEra, Number(form.startYear), Number(form.startMonth), Number(form.startDay))) {
      e.startDate = "事業開始年月日が実在しない日付です。月と日をご確認ください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/aoiro-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `サーバーエラー (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "青色申告承認申請書.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setShowModal(true);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

  const dobEraYears   = ERA_YEARS[form.dobEra]   ?? [];
  const startEraYears = ERA_YEARS[form.startEra] ?? [];

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
      {showModal && (
        <PDFModal
          returnFocusRef={pdfButtonRef}
          steps={[
            "このPDFを印刷してください",
            "最寄りの税務署に提出してください",
          ]}
          note="※ e-Taxでオンライン申請もできます"
          buttons={[
            { label: "e-Taxで申請する →", href: "https://www.e-tax.nta.go.jp/", variant: "green" },
            { label: "最寄りの税務署を探す →", href: "https://www.nta.go.jp/about/organization/access/map.htm", variant: "outline" },
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          青色申告をはじめるときの申請書
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：所得税の青色申告承認申請書
        </p>
      </header>

      {/* この書類が必要な場面（一般的な説明・非断定）＋出典 */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            農業所得を青色申告するために、事前に税務署へ提出する申請書です。提出期限や要件は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/shinkoku/annai/09.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              国税庁「A1-8 所得税の青色申告承認申請手続」
            </a>
            <br />
            最終確認：{DOC_LAST_CHECKED}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            わからない言葉は
            <Link href="/yougo" className="text-green-700 underline underline-offset-2 hover:text-green-800">用語集</Link>
            で説明しています。
          </p>
        </div>
      </div>

      <DocNav current="/aoiro" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 申請者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            申請者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="aoiro-name">氏名<span className="req">必須</span></label>
              <input type="text" id="aoiro-name" name="name" aria-required="true" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="aoiro-nameKana">ふりがな</label>
              <input type="text" id="aoiro-nameKana" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            {/* 生年月日 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-dobEra">生年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="aoiro-dobEra" aria-label="生年月日（年号）" name="dobEra" value={form.dobEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select id="aoiro-dobYear" aria-label="生年月日（年）" name="dobYear" value={form.dobYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {dobEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select id="aoiro-dobMonth" aria-label="生年月日（月）" name="dobMonth" value={form.dobMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select id="aoiro-dobDay" aria-label="生年月日（日）" name="dobDay" value={form.dobDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
              {errors.dob && <p className="text-red-600 text-base mt-2">{errors.dob}</p>}
            </div>

            {/* 住所 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-prefecture">住所<span className="req">必須</span></label>
              <select id="aoiro-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="aoiro-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            {/* 電話番号 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-phone">電話番号</label>
              <input type="tel" id="aoiro-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            {/* 個人番号 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-myNumber">個人番号（マイナンバー）</label>
              <input
                type="text"
                id="aoiro-myNumber"
                inputMode="numeric"
                maxLength={12}
                name="myNumber"
                value={form.myNumber}
                onChange={handleChange}
                placeholder="123456789012"
                className={inputClass}
              />
            </div>

            {/* 職業 */}
            <div>
              <label className={labelClass}>職業</label>
              <div className="bg-gray-50 rounded px-4 py-3 text-gray-600 text-lg">
                農業
              </div>
            </div>
          </div>
        </section>

        {/* 事業情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            事業情報
          </h2>
          <div className="space-y-5">

            {/* 屋号 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-farmName">屋号（農場名）</label>
              <input type="text" id="aoiro-farmName" name="farmName" value={form.farmName} onChange={handleChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>

            {/* 農業の種類 */}
            <div>
              <label className={labelClass}>農業の種類（複数選択可）</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["水稲", "畑作", "野菜", "果樹", "畜産", "その他"].map((type) => (
                  <label key={type}
                    className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-colors ${
                      form.farmTypes.includes(type)
                        ? "border-green-500 bg-green-50"
                        : "border-green-100 bg-green-50 hover:border-green-400"
                    }`}>
                    <input type="checkbox" checked={form.farmTypes.includes(type)}
                      onChange={() => handleFarmType(type)} className="w-5 h-5 accent-green-600" />
                    <span className="text-lg text-gray-800">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 事業開始年月日 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-startEra">事業開始年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="aoiro-startEra" aria-label="事業開始年月日（年号）" name="startEra" value={form.startEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select id="aoiro-startYear" aria-label="事業開始年月日（年）" name="startYear" value={form.startYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {startEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select id="aoiro-startMonth" aria-label="事業開始年月日（月）" name="startMonth" value={form.startMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select id="aoiro-startDay" aria-label="事業開始年月日（日）" name="startDay" value={form.startDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
              {errors.startDate && <p className="text-red-600 text-base mt-2">{errors.startDate}</p>}
            </div>

            {/* 提出先税務署名 */}
            <div>
              <label className={labelClass} htmlFor="aoiro-taxOffice">提出先税務署名</label>
              <input type="text" id="aoiro-taxOffice" name="taxOffice" value={form.taxOffice} onChange={handleChange}
                placeholder="例：新宿税務署" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 帳簿の種類 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            帳簿の種類
          </h2>
          <div className="space-y-3">
            {[
              {
                value: "複式簿記（65万円控除）",
                label: "複式簿記（65万円控除）",
                desc: "主な書類：仕訳帳・総勘定元帳など",
              },
              {
                value: "簡易簿記（10万円控除）",
                label: "簡易簿記（10万円控除）",
                desc: "主な書類：現金出納帳・売掛帳など",
              },
            ].map((opt) => (
              <label key={opt.value} className={radioClass(form.bookType === opt.value)}>
                <input type="radio" name="bookType" value={opt.value}
                  checked={form.bookType === opt.value} onChange={handleChange}
                  className="w-5 h-5 accent-green-600 shrink-0" />
                <div>
                  <div className="text-lg font-bold text-gray-800">{opt.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* 生成ボタン */}
        <button
          ref={pdfButtonRef}
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
        >
          {isGenerating ? "PDF作成中…少々お待ちください" : "申請書PDFを作成する"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4 mb-4">
          ボタンを押すと PDF ファイルが自動でダウンロードされます
        </p>

        <p className="text-xs text-gray-400 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、入力内容をもとに書類の様式を作成する補助ツールです。記載内容の正確性や提出の可否はご自身でご確認ください。あぜみちは行政書士・税理士業務を行うものではありません。正式な手続きの前に、提出先の窓口や専門家にご相談ください。
        </p>
      </main>
    </div>
  );
}
