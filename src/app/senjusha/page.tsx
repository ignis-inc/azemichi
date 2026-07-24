"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

type SenjushaEntry = {
  key: string;
  name: string;
  nameKana: string;
  relationship: string;
  age: string;
  experience: string;
  jobContent: string;
  qualification: string;
  salaryMonthly: string;
  salaryPeriod: string;
  bonusPeriod: string;
  bonusAmount: string;
  raiseCriteria: string;
};

function newSenjusha(): SenjushaEntry {
  return {
    key: crypto.randomUUID(),
    name: "", nameKana: "", relationship: "", age: "", experience: "",
    jobContent: "", qualification: "", salaryMonthly: "", salaryPeriod: "",
    bonusPeriod: "", bonusAmount: "", raiseCriteria: "",
  };
}

type FormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  occupation: string;
  farmName: string;
  taxOffice: string;
  otherNotes: string;
  employeeSalaryInfo: string;
  accountantName: string;
  accountantPhone: string;
};

export default function SenjushaPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // モーダルを閉じたときにフォーカスを戻す先（作成ボタン）
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    nameKana: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    occupation: "農業",
    farmName: "",
    taxOffice: "",
    otherNotes: "",
    employeeSalaryInfo: "",
    accountantName: "",
    accountantPhone: "",
  });
  const [senjushaList, setSenjushaList] = useState<SenjushaEntry[]>([newSenjusha()]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addSenjusha() {
    setSenjushaList((prev) => [...prev, newSenjusha()]);
  }

  function removeSenjusha(key: string) {
    setSenjushaList((prev) => prev.filter((s) => s.key !== key));
  }

  function updateSenjusha(key: string, field: keyof SenjushaEntry, value: string) {
    setSenjushaList((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "氏名を入力してください";
    if (!form.prefecture) e.prefecture = "都道府県を選択してください";
    if (!form.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    if (senjushaList.length === 0 || senjushaList.every((s) => !s.name.trim())) {
      e.senjusha = "専従者を1人以上、氏名を入力して追加してください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const body = {
        ...form,
        senjushaList: senjushaList
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name,
            nameKana: s.nameKana,
            relationship: s.relationship,
            age: s.age,
            experience: s.experience,
            jobContent: s.jobContent,
            qualification: s.qualification,
            salaryMonthly: s.salaryMonthly,
            salaryPeriod: s.salaryPeriod,
            bonusPeriod: s.bonusPeriod,
            bonusAmount: s.bonusAmount,
            raiseCriteria: s.raiseCriteria,
          })),
      };
      const res = await fetch("/api/senjusha-pdf", {
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
      a.download = "青色事業専従者給与に関する届出書.pdf";
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
          家族に給与を払うときの届出書
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：青色事業専従者給与に関する届出書
        </p>
      </header>

      {/* この書類が必要な場面（一般的な説明・非断定）＋出典 */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            家族に事業専従者として給与を支払い、必要経費に算入するために税務署へ提出する届出書です。原則、その年の3月15日まで（1月16日以後の新規開業・新たに専従者を有することとなった場合はその日から2か月以内）に提出します。要件や期限の詳細は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/shinkoku/annai/12.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              国税庁「A1-10 青色事業専従者給与に関する届出手続」
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

      <DocNav current="/senjusha" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 届出者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            届出者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="senjusha-name">氏名<span className="req">必須</span></label>
              <input type="text" id="senjusha-name" name="name" aria-required="true" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="senjusha-nameKana">ふりがな</label>
              <input type="text" id="senjusha-nameKana" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            {/* 住所 */}
            <div>
              <label className={labelClass} htmlFor="senjusha-prefecture">納税地（住所）<span className="req">必須</span></label>
              <select id="senjusha-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="senjusha-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="senjusha-phone">電話番号</label>
              <input type="tel" id="senjusha-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="senjusha-occupation">職業</label>
              <input type="text" id="senjusha-occupation" name="occupation" value={form.occupation} onChange={handleChange}
                className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="senjusha-farmName">屋号（農場名）</label>
              <input type="text" id="senjusha-farmName" name="farmName" value={form.farmName} onChange={handleChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>

            <div>
              <label className={labelClass} htmlFor="senjusha-taxOffice">提出先税務署名</label>
              <input type="text" id="senjusha-taxOffice" name="taxOffice" value={form.taxOffice} onChange={handleChange}
                placeholder="例：新宿税務署" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 専従者に関する事項 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            専従者に関する事項<span className="req">必須</span>
          </h2>
          {errors.senjusha && <p className="text-red-600 text-base mb-4">{errors.senjusha}</p>}
          <div className="space-y-5">
            {senjushaList.map((s, i) => (
              <div key={s.key} className="border-2 border-green-200 rounded-xl p-4 bg-green-50/40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-green-800">専従者 {i + 1}</h3>
                  {senjushaList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSenjusha(s.key)}
                      className="text-rose-600 underline text-sm"
                      aria-label={`専従者${i + 1}を削除`}
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={smallLabelClass}>氏名</label>
                    <input type="text" value={s.name} onChange={(e) => updateSenjusha(s.key, "name", e.target.value)}
                      placeholder="例：田中　花子" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>ふりがな</label>
                    <input type="text" value={s.nameKana} onChange={(e) => updateSenjusha(s.key, "nameKana", e.target.value)}
                      placeholder="例：たなか　はなこ" className={smallInputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={smallLabelClass}>続柄</label>
                    <input type="text" value={s.relationship} onChange={(e) => updateSenjusha(s.key, "relationship", e.target.value)}
                      placeholder="例：配偶者" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>年齢</label>
                    <input type="number" min="0" value={s.age} onChange={(e) => updateSenjusha(s.key, "age", e.target.value)}
                      placeholder="例：45" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>経験年数</label>
                    <input type="text" value={s.experience} onChange={(e) => updateSenjusha(s.key, "experience", e.target.value)}
                      placeholder="例：10年" className={smallInputClass} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className={smallLabelClass}>仕事の内容・従事の程度</label>
                  <input type="text" value={s.jobContent} onChange={(e) => updateSenjusha(s.key, "jobContent", e.target.value)}
                    placeholder="例：田植え・稲刈り等の農作業に年間200日従事" className={smallInputClass} />
                </div>
                <div className="mb-3">
                  <label className={smallLabelClass}>資格等</label>
                  <input type="text" value={s.qualification} onChange={(e) => updateSenjusha(s.key, "qualification", e.target.value)}
                    placeholder="例：大型特殊自動車免許（任意）" className={smallInputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={smallLabelClass}>給与月額（円）</label>
                    <input type="number" min="0" value={s.salaryMonthly} onChange={(e) => updateSenjusha(s.key, "salaryMonthly", e.target.value)}
                      placeholder="例：80000" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>給与の支給時期</label>
                    <input type="text" value={s.salaryPeriod} onChange={(e) => updateSenjusha(s.key, "salaryPeriod", e.target.value)}
                      placeholder="例：毎月25日" className={smallInputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={smallLabelClass}>賞与の支給時期</label>
                    <input type="text" value={s.bonusPeriod} onChange={(e) => updateSenjusha(s.key, "bonusPeriod", e.target.value)}
                      placeholder="例：12月" className={smallInputClass} />
                  </div>
                  <div>
                    <label className={smallLabelClass}>賞与の金額（円）</label>
                    <input type="number" min="0" value={s.bonusAmount} onChange={(e) => updateSenjusha(s.key, "bonusAmount", e.target.value)}
                      placeholder="例：50000" className={smallInputClass} />
                  </div>
                </div>
                <div>
                  <label className={smallLabelClass}>昇給の基準</label>
                  <input type="text" value={s.raiseCriteria} onChange={(e) => updateSenjusha(s.key, "raiseCriteria", e.target.value)}
                    placeholder="例：経験・能力に応じて（任意）" className={smallInputClass} />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSenjusha}
            className="w-full mt-4 bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg font-bold py-3 px-6 rounded-2xl shadow-sm transition-colors"
          >
            ＋ 専従者を追加する
          </button>
        </section>

        {/* その他の事項 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            その他の事項
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="senjusha-otherNotes">その他参考事項</label>
              <textarea id="senjusha-otherNotes" name="otherNotes" value={form.otherNotes} onChange={handleChange}
                rows={3} placeholder="（任意）" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="senjusha-employeeSalaryInfo">
                使用人（専従者以外の従業員）の給与の状況
              </label>
              <textarea id="senjusha-employeeSalaryInfo" name="employeeSalaryInfo" value={form.employeeSalaryInfo} onChange={handleChange}
                rows={3} placeholder="例：他に雇用している従業員はいません（任意）" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 税理士情報（任意） */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            税理士情報（任意）
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="senjusha-accountantName">税理士の氏名</label>
              <input type="text" id="senjusha-accountantName" name="accountantName" value={form.accountantName} onChange={handleChange}
                placeholder="依頼している場合のみ" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="senjusha-accountantPhone">税理士の電話番号</label>
              <input type="tel" id="senjusha-accountantPhone" name="accountantPhone" value={form.accountantPhone} onChange={handleChange}
                placeholder="依頼している場合のみ" className={inputClass} />
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
