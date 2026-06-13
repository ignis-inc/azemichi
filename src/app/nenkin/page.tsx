"use client";

import { useState } from "react";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";

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

type FormData = {
  name: string;
  nameKana: string;
  dobEra: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  gender: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  farmTypes: string[];
  workDays: string;
  farmArea: string;
  nenkinType: string;
  monthlyPremium: number;
  submissionDest: string;
  submissionName: string;
};

export default function NenkinPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    nameKana: "",
    dobEra: "昭和",
    dobYear: "50",
    dobMonth: "1",
    dobDay: "1",
    gender: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    farmTypes: [],
    workDays: "",
    farmArea: "",
    nenkinType: "",
    monthlyPremium: 20000,
    submissionDest: "",
    submissionName: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
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
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/nenkin-pdf", {
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
      a.download = "農業者年金通常加入申込書.pdf";
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

  const eraYears = ERA_YEARS[form.dobEra] ?? [];

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 focus:outline-none transition-colors";
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
          steps={[
            "このPDFを印刷してください",
            "最寄りの農協または農業委員会に持参してください",
          ]}
          note="※ 農業者年金はeMAFF非対応です"
          buttons={[
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          農業者年金に加入するときの申込書
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：農業者年金通常加入申込書（様式第1号）
        </p>
      </header>

      <DocNav current="/nenkin" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 申込者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            申込者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>氏名</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>ふりがな</label>
              <input type="text" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            {/* 生年月日 */}
            <div>
              <label className={labelClass}>生年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select name="dobEra" value={form.dobEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select name="dobYear" value={form.dobYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {eraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select name="dobMonth" value={form.dobMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select name="dobDay" value={form.dobDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 性別 */}
            <div>
              <label className={labelClass}>性別</label>
              <div className="flex gap-4">
                {["男", "女"].map((g) => (
                  <label key={g} className={radioClass(form.gender === g)}>
                    <input type="radio" name="gender" value={g} checked={form.gender === g}
                      onChange={handleChange} className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 住所 */}
            <div>
              <label className={labelClass}>住所</label>
              <select name="prefecture" value={form.prefecture} onChange={handleChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" name="cityAddress" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            {/* 電話番号 */}
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>
          </div>
        </section>

        {/* 農業情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            農業情報
          </h2>
          <div className="space-y-5">
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

            {/* 農業従事日数 */}
            <div>
              <label className={labelClass}>農業従事日数（年間）</label>
              <div className="flex items-center gap-3">
                <input type="number" name="workDays" value={form.workDays} onChange={handleChange}
                  placeholder="0" min="0" max="365"
                  className={`${inputClass} flex-1`} />
                <span className="text-lg text-gray-600 whitespace-nowrap">日</span>
              </div>
            </div>

            {/* 農地面積 */}
            <div>
              <label className={labelClass}>農地面積</label>
              <div className="flex items-center gap-3">
                <input type="number" name="farmArea" value={form.farmArea} onChange={handleChange}
                  placeholder="0.00" min="0" step="0.01"
                  className={`${inputClass} flex-1`} />
                <span className="text-lg text-gray-600 whitespace-nowrap">ha</span>
              </div>
            </div>

            {/* 国民年金の被保険者種別 */}
            <div>
              <label className={labelClass}>国民年金の被保険者種別</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: "第1号", label: "第1号被保険者（自営業・農業者など）" },
                  { value: "第2号", label: "第2号被保険者（会社員・公務員など）" },
                  { value: "第3号", label: "第3号被保険者（専業主婦・主夫など）" },
                ].map((opt) => (
                  <label key={opt.value} className={radioClass(form.nenkinType === opt.value)}>
                    <input type="radio" name="nenkinType" value={opt.value}
                      checked={form.nenkinType === opt.value} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base text-gray-800">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 保険料情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            保険料情報
          </h2>
          <div>
            <label className={labelClass}>月額保険料</label>
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-green-700">
                  {form.monthlyPremium.toLocaleString("ja-JP")}
                </span>
                <span className="text-lg text-gray-600 ml-2">円 / 月</span>
              </div>
              <input
                type="range"
                min="20000"
                max="67000"
                step="1000"
                value={form.monthlyPremium}
                onChange={(e) => setForm((prev) => ({ ...prev, monthlyPremium: parseInt(e.target.value) }))}
                className="w-full accent-green-600 h-2"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>20,000円（最低額）</span>
                <span>67,000円（最高額）</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ※ 1,000円単位でスライダーを動かして選択できます
            </p>
          </div>
        </section>

        {/* 提出先 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            提出先
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>提出先の区分</label>
              <div className="flex gap-4">
                {["農業協同組合", "農業委員会"].map((dest) => (
                  <label key={dest} className={`flex-1 ${radioClass(form.submissionDest === dest)}`}>
                    <input type="radio" name="submissionDest" value={dest}
                      checked={form.submissionDest === dest} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base">{dest}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>提出先の名称</label>
              <input type="text" name="submissionName" value={form.submissionName}
                onChange={handleChange}
                placeholder="例：○○農業協同組合、○○市農業委員会"
                className={inputClass} />
            </div>
          </div>
        </section>

        {/* 生成ボタン */}
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
        >
          {isGenerating ? "PDF作成中…少々お待ちください" : "申込書PDFを作成する"}
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
