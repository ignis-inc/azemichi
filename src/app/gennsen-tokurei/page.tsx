"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";
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

type MonthRow = {
  key: string;
  yearMonth: string;
  headcount: string;
  amount: string;
};

function newSixMonths(): MonthRow[] {
  return Array.from({ length: 6 }, () => ({
    key: crypto.randomUUID(),
    yearMonth: "",
    headcount: "",
    amount: "",
  }));
}

type FormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  myNumber: string;
  officeName: string;
  officeAddressSame: boolean;
  officePrefecture: string;
  officeCityAddress: string;
  currentPayeeCount: string;
  taxOffice: string;
};

export default function GennsenTokureiPage() {
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
    officeName: "",
    officeAddressSame: true,
    officePrefecture: "",
    officeCityAddress: "",
    currentPayeeCount: "",
    taxOffice: "",
  });
  const [sixMonths, setSixMonths] = useState<MonthRow[]>(() => newSixMonths());

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
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

  function updateMonth(key: string, field: keyof MonthRow, value: string) {
    setSixMonths((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "氏名を入力してください";
    if (!form.prefecture) e.prefecture = "都道府県を選択してください";
    if (!form.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const body = {
        ...form,
        sixMonths: sixMonths.map((m) => ({
          yearMonth: m.yearMonth,
          headcount: m.headcount,
          amount: m.amount,
        })),
      };
      const res = await fetch("/api/gennsen-tokurei-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `サーバーエラー (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "源泉所得税の納期の特例の承認に関する申請書.pdf";
      a.click();
      URL.revokeObjectURL(url);
      recordGeneratedDoc("gennsenTokurei");
      setShowModal(true);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const smallInputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-3 py-2 text-base focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const smallLabelClass = "block text-sm font-bold text-gray-600 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

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
          源泉所得税の納期をまとめるときの申請
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：源泉所得税の納期の特例の承認に関する申請書
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            給与から差し引いた源泉所得税は、原則毎月納めますが、この申請が承認されると年2回（7月・1月）にまとめて納められるようになります。要件や期限の詳細は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/gensen/annai/1648_14.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              国税庁「A2-8 源泉所得税の納期の特例の承認に関する申請」
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
            この申請は、<strong>常時10人未満の使用人を雇用する事業者</strong>が対象です。10人以上を雇用している場合は対象になりません。
          </p>
        </div>
      </div>

      <DocNav current="/gennsen-tokurei" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 申請者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            申請者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="gt-name">氏名<span className="req">必須</span></label>
              <input type="text" id="gt-name" name="name" aria-required="true" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="gt-nameKana">ふりがな</label>
              <input type="text" id="gt-nameKana" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="gt-prefecture">住所<span className="req">必須</span></label>
              <select id="gt-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="gt-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="gt-phone">電話番号</label>
              <input type="tel" id="gt-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="gt-myNumber">個人番号（マイナンバー）</label>
              <input type="text" id="gt-myNumber" inputMode="numeric" maxLength={12} name="myNumber"
                value={form.myNumber} onChange={handleChange} placeholder="123456789012" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 給与支払事務所の情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            給与支払事務所の情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="gt-officeName">給与支払事務所の名称</label>
              <input type="text" id="gt-officeName" name="officeName" value={form.officeName} onChange={handleChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>給与支払事務所の所在地</label>
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
                  {form.prefecture}{form.cityAddress || "（申請者情報の住所が反映されます）"}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="gt-currentPayeeCount">現在の給与支払を受ける人数（俸給・給料等の別）</label>
              <input type="number" min="0" step="1" id="gt-currentPayeeCount" name="currentPayeeCount"
                value={form.currentPayeeCount} onChange={handleChange} placeholder="0" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="gt-taxOffice">提出先税務署名</label>
              <input type="text" id="gt-taxOffice" name="taxOffice" value={form.taxOffice} onChange={handleChange}
                placeholder="例：新宿税務署" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 直近6か月の支払状況 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            直近6か月の支払人員・支給金額
          </h2>
          <p className="text-sm text-gray-500 mb-4">記入できる月だけで構いません。空欄のまま提出しても大丈夫です。</p>
          <div className="space-y-4">
            {sixMonths.map((m, i) => (
              <div key={m.key} className="border-2 border-green-200 rounded-xl p-4 bg-green-50/40">
                <h3 className="text-base font-bold text-green-800 mb-3">{i + 1}か月目</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={smallLabelClass}>年月</label>
                    <input type="text" value={m.yearMonth} onChange={(e) => updateMonth(m.key, "yearMonth", e.target.value)}
                      placeholder="例：令和8年7月" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>支払人員</label>
                    <input type="number" min="0" value={m.headcount} onChange={(e) => updateMonth(m.key, "headcount", e.target.value)}
                      placeholder="例：2" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>支給金額（円）</label>
                    <input type="number" min="0" value={m.amount} onChange={(e) => updateMonth(m.key, "amount", e.target.value)}
                      placeholder="例：160000" className={smallInputClass} />
                  </div>
                </div>
              </div>
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

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、入力内容をもとに書類の様式を作成する補助ツールです。記載内容の正確性や提出の可否はご自身でご確認ください。あぜみちは行政書士・税理士業務を行うものではありません。正式な手続きの前に、提出先の窓口や専門家にご相談ください。
        </p>
      </main>
    </div>
  );
}
