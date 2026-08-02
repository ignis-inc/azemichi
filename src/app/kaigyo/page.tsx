"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";
import { isValidWarekiDate, warekiToISO } from "../wareki";
import { recordGeneratedDoc } from "../dashboardStore";

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

type KaigyoFormData = {
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
  occupation: string;
  businessSummary: string;
  farmName: string;
  farmNameKana: string;
  incomeType: string;
  taxLocationType: string;
  startEra: string;
  startYear: string;
  startMonth: string;
  startDay: string;
  taxOffice: string;
  aoiroSubmission: string;
  professionalCount: string;
  employeeCount: string;
  wageMethod: string;
  withholdingTax: string;
  paymentStartEra: string;
  paymentStartYear: string;
  paymentStartMonth: string;
  paymentStartDay: string;
};

export default function KaigyoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // モーダルを閉じたときにフォーカスを戻す先（作成ボタン）
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<KaigyoFormData>({
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
    occupation: "農業",
    businessSummary: "",
    farmName: "",
    farmNameKana: "",
    incomeType: "事業所得",
    taxLocationType: "住所地",
    startEra: "令和",
    startYear: "1",
    startMonth: "1",
    startDay: "1",
    taxOffice: "",
    aoiroSubmission: "有",
    professionalCount: "0",
    employeeCount: "0",
    wageMethod: "",
    withholdingTax: "無",
    paymentStartEra: "令和",
    paymentStartYear: "1",
    paymentStartMonth: "1",
    paymentStartDay: "1",
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
    if (name === "paymentStartEra") {
      const years = ERA_YEARS[value] ?? [];
      setForm((prev) => ({ ...prev, paymentStartEra: value, paymentStartYear: String(years[0] ?? 1) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
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
      e.startDate = "開業年月日が実在しない日付です。月と日をご確認ください";
    }
    if (!isValidWarekiDate(form.paymentStartEra, Number(form.paymentStartYear), Number(form.paymentStartMonth), Number(form.paymentStartDay))) {
      e.paymentStartDate = "支給開始予定日が実在しない日付です。月と日をご確認ください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/kaigyo-pdf", {
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
      a.download = "個人事業の開業届出書.pdf";
      a.click();
      URL.revokeObjectURL(url);
      recordGeneratedDoc("kaigyo", warekiToISO(form.startEra, Number(form.startYear), Number(form.startMonth), Number(form.startDay)));
      setShowModal(true);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

  const dobEraYears = ERA_YEARS[form.dobEra] ?? [];
  const startEraYears = ERA_YEARS[form.startEra] ?? [];
  const paymentStartEraYears = ERA_YEARS[form.paymentStartEra] ?? [];

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
          農業をはじめるときの開業届
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：個人事業の開業・廃業等届出書（開業）
        </p>
      </header>

      {/* この書類が必要な場面・提出期限の案内＋出典 */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            新たに農業を事業として始めたことを税務署に知らせる届出書です。提出期限や要件は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/shinkoku/annai/04.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              国税庁「A1-5 個人事業の開業届出・廃業届出等手続」
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

        <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-5 py-4 mt-4">
          <p className="text-sm text-yellow-900 leading-relaxed">
            開業届の提出期限は、開業日から1か月以内です。青色申告承認申請書（
            <Link href="/aoiro" className="underline underline-offset-2 font-bold hover:text-yellow-950">
              /aoiro
            </Link>
            ）は別の期限（1月16日以降の開業なら開業日から2か月以内、それ以外はその年の3月15日まで）なので、初年度から青色申告を受けたい場合はあわせてご確認ください。
          </p>
        </div>
      </div>

      <DocNav current="/kaigyo" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 届出者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            届出者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="kaigyo-name">氏名<span className="req">必須</span></label>
              <input type="text" id="kaigyo-name" name="name" aria-required="true" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="kaigyo-nameKana">ふりがな</label>
              <input type="text" id="kaigyo-nameKana" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            {/* 生年月日 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-dobEra">生年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="kaigyo-dobEra" aria-label="生年月日（年号）" name="dobEra" value={form.dobEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select id="kaigyo-dobYear" aria-label="生年月日（年）" name="dobYear" value={form.dobYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {dobEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select id="kaigyo-dobMonth" aria-label="生年月日（月）" name="dobMonth" value={form.dobMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select id="kaigyo-dobDay" aria-label="生年月日（日）" name="dobDay" value={form.dobDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
              {errors.dob && <p className="text-red-600 text-base mt-2">{errors.dob}</p>}
            </div>

            {/* 納税地の種別 */}
            <div>
              <label className={labelClass}>納税地の種別</label>
              <div className="grid grid-cols-3 gap-3">
                {["住所地", "居所地", "事業所等"].map((opt) => (
                  <label key={opt} className={radioClass(form.taxLocationType === opt)}>
                    <input type="radio" name="taxLocationType" value={opt}
                      checked={form.taxLocationType === opt} onChange={handleChange}
                      className="w-5 h-5 accent-green-600 shrink-0" />
                    <span className="text-base text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">通常は住所地（住民票上の住所）を選びます。税務署からのお知らせは納税地宛に届きます。</p>
            </div>

            {/* 住所 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-prefecture">住所（納税地）<span className="req">必須</span></label>
              <select id="kaigyo-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="kaigyo-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            {/* 電話番号 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-phone">電話番号</label>
              <input type="tel" id="kaigyo-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            {/* 個人番号 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-myNumber">個人番号（マイナンバー）</label>
              <input
                type="text"
                id="kaigyo-myNumber"
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
              <label className={labelClass} htmlFor="kaigyo-occupation">職業</label>
              <input type="text" id="kaigyo-occupation" name="occupation" value={form.occupation} onChange={handleChange}
                placeholder="例：農業" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 事業情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            事業情報
          </h2>
          <div className="space-y-5">

            {/* 所得の種類 */}
            <div>
              <label className={labelClass}>所得の種類</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["事業所得", "不動産所得", "山林所得"].map((opt) => (
                  <label key={opt} className={radioClass(form.incomeType === opt)}>
                    <input type="radio" name="incomeType" value={opt}
                      checked={form.incomeType === opt} onChange={handleChange}
                      className="w-5 h-5 accent-green-600 shrink-0" />
                    <span className="text-base text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">農業から生じる所得は「事業所得」です。</p>
            </div>

            {/* 屋号 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-farmName">屋号（農場名）</label>
              <input type="text" id="kaigyo-farmName" name="farmName" value={form.farmName} onChange={handleChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="kaigyo-farmNameKana">屋号のふりがな</label>
              <input type="text" id="kaigyo-farmNameKana" name="farmNameKana" value={form.farmNameKana} onChange={handleChange}
                placeholder="例：たなかのうじょう（任意）" className={inputClass} />
            </div>

            {/* 開業年月日 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-startEra">開業年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="kaigyo-startEra" aria-label="開業年月日（年号）" name="startEra" value={form.startEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select id="kaigyo-startYear" aria-label="開業年月日（年）" name="startYear" value={form.startYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {startEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select id="kaigyo-startMonth" aria-label="開業年月日（月）" name="startMonth" value={form.startMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select id="kaigyo-startDay" aria-label="開業年月日（日）" name="startDay" value={form.startDay} onChange={handleChange}
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
              <label className={labelClass} htmlFor="kaigyo-taxOffice">提出先税務署名</label>
              <input type="text" id="kaigyo-taxOffice" name="taxOffice" value={form.taxOffice} onChange={handleChange}
                placeholder="例：新宿税務署" className={inputClass} />
            </div>

            {/* 青色申告承認申請書の提出有無 */}
            <div>
              <label className={labelClass}>「青色申告承認申請書」の提出</label>
              <div className="flex gap-4">
                {["有", "無"].map((opt) => (
                  <label key={opt} className={`flex-1 ${radioClass(form.aoiroSubmission === opt)}`}>
                    <input type="radio" name="aoiroSubmission" value={opt}
                      checked={form.aoiroSubmission === opt} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                同時に青色申告承認申請書も提出する場合は「有」を選んでください。まだの場合は
                <Link href="/aoiro" className="text-green-700 underline underline-offset-2 hover:text-green-800">/aoiro</Link>
                で作成できます。
              </p>
            </div>

            {/* 事業の概要 */}
            <div>
              <label className={labelClass} htmlFor="kaigyo-businessSummary">事業の概要</label>
              <input type="text" id="kaigyo-businessSummary" name="businessSummary" value={form.businessSummary} onChange={handleChange}
                placeholder="例：野菜の生産・販売、米作" className={inputClass} />
              <p className="text-sm text-gray-500 mt-1">どんな農業を行うか、できるだけ具体的に記入してください。</p>
            </div>
          </div>
        </section>

        {/* 給与等の支払の状況 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            給与等の支払の状況
          </h2>
          <p className="text-sm text-gray-500 mb-5">家族や従業員に給与を支払う予定がない場合は、0のままで構いません。</p>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="kaigyo-professionalCount">専従者の人数</label>
              <input type="number" min="0" step="1" id="kaigyo-professionalCount" name="professionalCount"
                value={form.professionalCount} onChange={handleChange} className={inputClass} />
              <p className="text-sm text-gray-500 mt-1">専従者とは、生計を一にする家族従業員のことです。</p>
            </div>

            <div>
              <label className={labelClass} htmlFor="kaigyo-employeeCount">使用人の人数</label>
              <input type="number" min="0" step="1" id="kaigyo-employeeCount" name="employeeCount"
                value={form.employeeCount} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="kaigyo-wageMethod">給与の定め方</label>
              <input type="text" id="kaigyo-wageMethod" name="wageMethod" value={form.wageMethod} onChange={handleChange}
                placeholder="例：月給" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>源泉徴収税額の有無</label>
              <div className="flex gap-4">
                {["有", "無"].map((opt) => (
                  <label key={opt} className={`flex-1 ${radioClass(form.withholdingTax === opt)}`}>
                    <input type="radio" name="withholdingTax" value={opt}
                      checked={form.withholdingTax === opt} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="kaigyo-paymentStartEra">支給開始予定日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="kaigyo-paymentStartEra" aria-label="支給開始予定日（年号）" name="paymentStartEra" value={form.paymentStartEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select id="kaigyo-paymentStartYear" aria-label="支給開始予定日（年）" name="paymentStartYear" value={form.paymentStartYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {paymentStartEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select id="kaigyo-paymentStartMonth" aria-label="支給開始予定日（月）" name="paymentStartMonth" value={form.paymentStartMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select id="kaigyo-paymentStartDay" aria-label="支給開始予定日（日）" name="paymentStartDay" value={form.paymentStartDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
              {errors.paymentStartDate && <p className="text-red-600 text-base mt-2">{errors.paymentStartDate}</p>}
            </div>
          </div>
        </section>

        {/* 生成ボタン */}
        <button
          ref={pdfButtonRef}
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
        >
          {isGenerating ? "PDF作成中…少々お待ちください" : "開業届PDFを作成する"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4 mb-4">
          ボタンを押すと PDF ファイルが自動でダウンロードされます
        </p>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、入力内容をもとに書類の様式を作成する補助ツールです。記載内容の正確性や提出の可否はご自身でご確認ください。あぜみちは行政書士・税理士業務を行うものではありません。正式な手続きの前に、提出先の窓口や専門家にご相談ください。
        </p>
      </main>
    </div>
  );
}
