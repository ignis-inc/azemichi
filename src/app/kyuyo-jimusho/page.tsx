"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";
import { isValidWarekiDate, warekiToISO } from "../wareki";
import { recordGeneratedDoc } from "../dashboardStore";
import { createFuriganaTracker } from "../furiganaAutofill";

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

const NOTICE_TYPES = ["開設", "移転", "廃止"] as const;

type FormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  myNumber: string;
  farmName: string;
  noticeType: string;
  startEra: string;
  startYear: string;
  startMonth: string;
  startDay: string;
  officeAddressSame: boolean;
  officePrefecture: string;
  officeCityAddress: string;
  officePhone: string;
  officerCount: string;
  employeeCount: string;
  otherCount: string;
  taxOffice: string;
};

export default function KyuyoJimushoPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    nameKana: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    myNumber: "",
    farmName: "",
    noticeType: "開設",
    startEra: "令和",
    startYear: "1",
    startMonth: "1",
    startDay: "1",
    officeAddressSame: true,
    officePrefecture: "",
    officeCityAddress: "",
    officePhone: "",
    officerCount: "0",
    employeeCount: "0",
    otherCount: "0",
    taxOffice: "",
  });
  const [nameTracker] = useState(() =>
    createFuriganaTracker((kana) => setForm((prev) => ({ ...prev, nameKana: kana })))
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "startEra") {
      const years = ERA_YEARS[value] ?? [];
      setForm((prev) => ({ ...prev, startEra: value, startYear: String(years[0] ?? 1) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSameOfficeAddress(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      officeAddressSame: checked,
      officePrefecture: checked ? prev.prefecture : prev.officePrefecture,
      officeCityAddress: checked ? prev.cityAddress : prev.officeCityAddress,
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "氏名を入力してください";
    if (!form.prefecture) e.prefecture = "都道府県を選択してください";
    if (!form.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    if (!isValidWarekiDate(form.startEra, Number(form.startYear), Number(form.startMonth), Number(form.startDay))) {
      e.startDate = "給与支払開始年月日が実在しない日付です。月と日をご確認ください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/kyuyo-jimusho-pdf", {
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
      a.download = "給与支払事務所等の開設届出書.pdf";
      a.click();
      URL.revokeObjectURL(url);
      recordGeneratedDoc("kyuyoJimusho", warekiToISO(form.startEra, Number(form.startYear), Number(form.startMonth), Number(form.startDay)));
      setShowModal(true);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

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
          給与を払い始めるときの届出
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：給与支払事務所等の開設・移転・廃止届出書
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            家族（専従者）や従業員に給与を払い始める・事務所を移転する・給与の支払をやめるときに、税務署へ提出する届出書です。要件や期限の詳細は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/gensen/annai/1648_11.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              国税庁「A2-7 給与支払事務所等の開設・移転・廃止の届出」
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

      <DocNav current="/kyuyo-jimusho" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 届出者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            届出者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>届出区分</label>
              <div className="grid grid-cols-3 gap-3">
                {NOTICE_TYPES.map((t) => (
                  <label key={t} className={radioClass(form.noticeType === t)}>
                    <input type="radio" name="noticeType" value={t}
                      checked={form.noticeType === t} onChange={handleChange}
                      className="w-5 h-5 accent-green-600 shrink-0" />
                    <span className="text-base text-gray-800">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-name">氏名<span className="req">必須</span></label>
              <input type="text" id="kj-name" name="name" aria-required="true" value={form.name} onChange={handleChange}
                onCompositionUpdate={nameTracker.handleCompositionUpdate}
                onCompositionEnd={nameTracker.handleCompositionEnd}
                onInput={nameTracker.handleInput}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="kj-nameKana">ふりがな</label>
              <input type="text" id="kj-nameKana" name="nameKana" value={form.nameKana}
                onChange={(e) => { handleChange(e); nameTracker.notifyManualKanaEdit(); }}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-prefecture">住所<span className="req">必須</span></label>
              <select id="kj-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="kj-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-phone">電話番号</label>
              <input type="tel" id="kj-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-myNumber">個人番号（マイナンバー）</label>
              <input type="text" id="kj-myNumber" inputMode="numeric" maxLength={12} name="myNumber"
                value={form.myNumber} onChange={handleChange} placeholder="123456789012" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-farmName">屋号（農場名）</label>
              <input type="text" id="kj-farmName" name="farmName" value={form.farmName} onChange={handleChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 事務所情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            事務所情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="kj-startEra">給与支払を開始する年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select id="kj-startEra" aria-label="給与支払開始年月日（年号）" name="startEra" value={form.startEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {Object.keys(ERA_YEARS).map((era) => (<option key={era} value={era}>{era}</option>))}
                </select>
                <select id="kj-startYear" aria-label="給与支払開始年月日（年）" name="startYear" value={form.startYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {startEraYears.map((y) => (<option key={y} value={String(y)}>{y}年</option>))}
                </select>
                <select id="kj-startMonth" aria-label="給与支払開始年月日（月）" name="startMonth" value={form.startMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {MONTHS.map((m) => (<option key={m} value={String(m)}>{m}月</option>))}
                </select>
                <select id="kj-startDay" aria-label="給与支払開始年月日（日）" name="startDay" value={form.startDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                  {DAYS.map((d) => (<option key={d} value={String(d)}>{d}日</option>))}
                </select>
              </div>
              {errors.startDate && <p className="text-red-600 text-base mt-2">{errors.startDate}</p>}
            </div>

            <div>
              <label className={labelClass}>事務所等の所在地</label>
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input type="checkbox" checked={form.officeAddressSame} onChange={handleSameOfficeAddress}
                  className="w-5 h-5 accent-green-600" />
                <span className="text-base text-gray-700">自宅住所と同じ</span>
              </label>
              {!form.officeAddressSame && (
                <>
                  <select
                    aria-label="事務所の所在地（都道府県）"
                    name="officePrefecture"
                    value={form.officePrefecture}
                    onChange={handleChange}
                    className={`${inputClass} mb-2`}
                  >
                    <option value="">都道府県を選択</option>
                    {PREFECTURES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    aria-label="事務所の所在地（市区町村・番地）"
                    type="text"
                    name="officeCityAddress"
                    value={form.officeCityAddress}
                    onChange={handleChange}
                    placeholder="例：○○市○○町1-2-3"
                    className={inputClass}
                  />
                </>
              )}
              {form.officeAddressSame && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-base text-gray-600">
                  {form.prefecture}{form.cityAddress || "（届出者情報の住所が反映されます）"}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-officePhone">事務所等の電話番号</label>
              <input type="tel" id="kj-officePhone" name="officePhone" value={form.officePhone} onChange={handleChange}
                placeholder="例：090-1234-5678（住所と同じ場合は空欄可）" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>従事員数</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="kj-officerCount">役員</label>
                  <input type="number" min="0" step="1" id="kj-officerCount" name="officerCount"
                    value={form.officerCount} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="kj-employeeCount">従業員</label>
                  <input type="number" min="0" step="1" id="kj-employeeCount" name="employeeCount"
                    value={form.employeeCount} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="kj-otherCount">その他</label>
                  <input type="number" min="0" step="1" id="kj-otherCount" name="otherCount"
                    value={form.otherCount} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">専従者給与を受ける家族従業員は「従業員」に含めて構いません。</p>
            </div>

            <div>
              <label className={labelClass} htmlFor="kj-taxOffice">提出先税務署名</label>
              <input type="text" id="kj-taxOffice" name="taxOffice" value={form.taxOffice} onChange={handleChange}
                placeholder="例：新宿税務署" className={inputClass} />
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
          {isGenerating ? "PDF作成中…少々お待ちください" : "届出書PDFを作成する"}
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
