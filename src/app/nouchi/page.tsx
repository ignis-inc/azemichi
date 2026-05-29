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

const SHOWA_YEARS  = Array.from({ length: 25 }, (_, i) => i + 40); // 昭和40〜64
const HEISEI_YEARS = Array.from({ length: 31 }, (_, i) => i + 1);  // 平成1〜31
const REIWA_YEARS  = Array.from({ length: 8  }, (_, i) => i + 1);  // 令和1〜8

const ERA_YEARS: Record<string, number[]> = {
  "昭和": SHOWA_YEARS,
  "平成": HEISEI_YEARS,
  "令和": REIWA_YEARS,
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

type NouchiFormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  nationality: string;
  landCity: string;
  landAza: string;
  landChiban: string;
  landType: string;
  area: string;
  acquisitionReason: string;
  acqEra: string;
  acqYear: string;
  acqMonth: string;
  acqDay: string;
  rightType: string;
  committeeName: string;
};

export default function NouchiPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NouchiFormData>({
    name: "",
    nameKana: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    nationality: "日本",
    landCity: "",
    landAza: "",
    landChiban: "",
    landType: "",
    area: "",
    acquisitionReason: "",
    acqEra: "令和",
    acqYear: "1",
    acqMonth: "1",
    acqDay: "1",
    rightType: "",
    committeeName: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function generatePDF() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/nouchi-pdf", {
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
      a.download = "農地法第3条の3届出書.pdf";
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

  const acqEraYears = ERA_YEARS[form.acqEra] ?? [];

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
            "農地のある市区町村の農業委員会に提出してください",
          ]}
          buttons={[
            { label: "eMAFFで申請する →", href: "https://e.maff.go.jp/PortalLogin", variant: "green" },
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          農地法第3条の3届出書
        </h1>
        <p className="mt-2 text-green-100 text-base">
          農業委員会への提出書類を作成します
        </p>
      </header>

      <DocNav current="/nouchi" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 届出者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            届出者情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>氏名</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="例：田中　太郎" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ふりがな</label>
              <input type="text" name="nameKana" value={form.nameKana} onChange={handleChange}
                placeholder="例：たなか　たろう" className={inputClass} />
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
              <input type="text" name="cityAddress" value={form.cityAddress} onChange={handleChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
            </div>

            {/* 電話番号 */}
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            {/* 国籍 */}
            <div>
              <label className={labelClass}>国籍</label>
              <div className="flex gap-4">
                {["日本", "その他"].map((n) => (
                  <label key={n} className={radioClass(form.nationality === n)}>
                    <input type="radio" name="nationality" value={n}
                      checked={form.nationality === n} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{n}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 取得した農地の情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            取得した農地の情報
          </h2>
          <div className="space-y-5">

            {/* 所在地 */}
            <div>
              <label className={labelClass}>所在地</label>
              <div className="flex gap-2">
                <input type="text" name="landCity" value={form.landCity} onChange={handleChange}
                  placeholder="市区町村" className={inputClass} />
                <input type="text" name="landAza" value={form.landAza} onChange={handleChange}
                  placeholder="字" className={inputClass} />
                <input type="text" name="landChiban" value={form.landChiban} onChange={handleChange}
                  placeholder="地番" className={inputClass} />
              </div>
            </div>

            {/* 地目 */}
            <div>
              <label className={labelClass}>地目</label>
              <div className="flex gap-4">
                {["田", "畑", "採草放牧地"].map((t) => (
                  <label key={t} className={radioClass(form.landType === t)}>
                    <input type="radio" name="landType" value={t}
                      checked={form.landType === t} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 面積 */}
            <div>
              <label className={labelClass}>面積</label>
              <div className="flex items-center gap-3">
                <input type="number" name="area" value={form.area} onChange={handleChange}
                  placeholder="0" min="0"
                  className={`${inputClass} flex-1`} />
                <span className="text-lg text-gray-600 whitespace-nowrap">㎡</span>
              </div>
            </div>

            {/* 権利取得の原因 */}
            <div>
              <label className={labelClass}>権利取得の原因</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {["相続", "遺産分割", "法人合併", "法人分割", "時効", "その他"].map((r) => (
                  <label key={r} className={radioClass(form.acquisitionReason === r)}>
                    <input type="radio" name="acquisitionReason" value={r}
                      checked={form.acquisitionReason === r} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 権利取得年月日 */}
            <div>
              <label className={labelClass}>権利取得年月日</label>
              <div className="flex flex-wrap gap-2 items-center">
                <select name="acqEra" value={form.acqEra} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {Object.keys(ERA_YEARS).map((era) => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
                <select name="acqYear" value={form.acqYear} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {acqEraYears.map((y) => (
                    <option key={y} value={String(y)}>{y}年</option>
                  ))}
                </select>
                <select name="acqMonth" value={form.acqMonth} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {MONTHS.map((m) => (
                    <option key={m} value={String(m)}>{m}月</option>
                  ))}
                </select>
                <select name="acqDay" value={form.acqDay} onChange={handleChange}
                  className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                  {DAYS.map((d) => (
                    <option key={d} value={String(d)}>{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 権利の種類 */}
            <div>
              <label className={labelClass}>権利の種類</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {["所有権", "賃借権", "使用貸借権", "その他"].map((r) => (
                  <label key={r} className={radioClass(form.rightType === r)}>
                    <input type="radio" name="rightType" value={r}
                      checked={form.rightType === r} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{r}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 提出先 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            提出先
          </h2>
          <div>
            <label className={labelClass}>提出先農業委員会名</label>
            <input type="text" name="committeeName" value={form.committeeName} onChange={handleChange}
              placeholder="例：○○市農業委員会" className={inputClass} />
          </div>
        </section>

        {/* 生成ボタン */}
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
        >
          {isGenerating ? "PDF作成中…少々お待ちください" : "届出書PDFを作成する"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4 mb-8">
          ボタンを押すと PDF ファイルが自動でダウンロードされます
        </p>
      </main>
    </div>
  );
}
