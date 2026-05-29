"use client";

import { useState } from "react";
import DocNav from "./components/DocNav";
import PDFModal from "./components/PDFModal";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const NOSEI_KYOKU: Record<string, string> = {
  "北海道": "北海道農政事務所",
  "青森県": "東北農政局","岩手県": "東北農政局","宮城県": "東北農政局",
  "秋田県": "東北農政局","山形県": "東北農政局","福島県": "東北農政局",
  "茨城県": "関東農政局","栃木県": "関東農政局","群馬県": "関東農政局",
  "埼玉県": "関東農政局","千葉県": "関東農政局","東京都": "関東農政局",
  "神奈川県": "関東農政局","山梨県": "関東農政局","長野県": "関東農政局",
  "静岡県": "関東農政局",
  "新潟県": "北陸農政局","富山県": "北陸農政局","石川県": "北陸農政局",
  "福井県": "北陸農政局",
  "岐阜県": "東海農政局","愛知県": "東海農政局","三重県": "東海農政局",
  "滋賀県": "近畿農政局","京都府": "近畿農政局","大阪府": "近畿農政局",
  "兵庫県": "近畿農政局","奈良県": "近畿農政局","和歌山県": "近畿農政局",
  "鳥取県": "中国四国農政局","島根県": "中国四国農政局","岡山県": "中国四国農政局",
  "広島県": "中国四国農政局","山口県": "中国四国農政局","徳島県": "中国四国農政局",
  "香川県": "中国四国農政局","愛媛県": "中国四国農政局","高知県": "中国四国農政局",
  "福岡県": "九州農政局","佐賀県": "九州農政局","長崎県": "九州農政局",
  "熊本県": "九州農政局","大分県": "九州農政局","宮崎県": "九州農政局",
  "鹿児島県": "九州農政局",
  "沖縄県": "内閣府沖縄総合事務局",
};

function toWareki(dateStr: string): string {
  if (!dateStr) return "　　年　　月　　日";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let era = "";
  let eraYear = 0;
  if (y >= 2019) { era = "令和"; eraYear = y - 2018; }
  else if (y >= 1989) { era = "平成"; eraYear = y - 1988; }
  else { era = "昭和"; eraYear = y - 1925; }
  return `${era}${eraYear}年${m}月${day}日`;
}

function todayWareki(): string {
  const today = new Date();
  return toWareki(today.toISOString().slice(0, 10));
}

type FormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  farmName: string;
  farmAddressSame: boolean;
  farmPrefecture: string;
  farmCityAddress: string;
  grainTypes: string[];
  quantity: string;
  startDate: string;
};

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    nameKana: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    farmName: "",
    farmAddressSame: false,
    farmPrefecture: "",
    farmCityAddress: "",
    grainTypes: [],
    quantity: "",
    startDate: "",
  });

  const nokyo = form.prefecture ? NOSEI_KYOKU[form.prefecture] ?? "" : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSameAddress(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      farmAddressSame: checked,
      farmPrefecture: checked ? prev.prefecture : prev.farmPrefecture,
      farmCityAddress: checked ? prev.cityAddress : prev.farmCityAddress,
    }));
  }

  function handleGrainType(type: string) {
    setForm((prev) => {
      const has = prev.grainTypes.includes(type);
      return {
        ...prev,
        grainTypes: has
          ? prev.grainTypes.filter((t) => t !== type)
          : [...prev.grainTypes, type],
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
      // サーバーサイドAPIにフォームデータを送ってPDFを生成・ダウンロード
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `サーバーエラー (${res.status})`);
      }

      // バイナリデータを受け取りブラウザにダウンロードさせる
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "米穀販売届出書.pdf";
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
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 focus:outline-none transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  return (
    <div className="min-h-screen bg-green-50">
      {showModal && (
        <PDFModal
          steps={[
            "このPDFを印刷してください",
            "以下のいずれかで農政局に提出してください",
          ]}
          buttons={[
            { label: "eMAFFでオンライン申請する →", href: "https://e.maff.go.jp/PortalLogin", variant: "green" },
            { label: "最寄りの農政局を探す →", href: "https://www.maff.go.jp/j/org/outline/dial/kyoku.html", variant: "outline" },
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* あぜみち サービス紹介 */}
      <div className="bg-white border-b-2 border-green-100 px-4 py-8 text-center">
        <h2 className="text-4xl font-bold text-green-800 mb-3">あぜみち</h2>
        <p className="text-xl font-medium text-gray-700 mb-4">農業の手続き書類を、スマホで簡単に作れます</p>
        <p className="text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
          必要な情報を入力するだけで、農林水産省や税務署に提出する書類のPDFが自動で作成されます。印刷して窓口に持参するか、オンラインで申請できます。
        </p>
      </div>

      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          お米を売り始めるときの届出
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：米穀の出荷又は販売の事業開始届出書
        </p>
      </header>

      <DocNav current="/" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 基本情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            基本情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>氏名</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="例：田中　太郎"
                className={inputClass}
              />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>ふりがな</label>
              <input
                type="text"
                name="nameKana"
                value={form.nameKana}
                onChange={handleChange}
                placeholder="例：たなか　たろう"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>住所</label>
              <select
                name="prefecture"
                value={form.prefecture}
                onChange={handleChange}
                className={`${inputClass} mb-2`}
              >
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input
                type="text"
                name="cityAddress"
                value={form.cityAddress}
                onChange={handleChange}
                placeholder="例：○○市○○町1-2-3"
                className={inputClass}
              />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>
            <div>
              <label className={labelClass}>電話番号</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="例：090-1234-5678"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* 事業所情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            事業所情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>農場名</label>
              <input
                type="text"
                name="farmName"
                value={form.farmName}
                onChange={handleChange}
                placeholder="例：田中農場"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>事業所住所</label>
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.farmAddressSame}
                  onChange={handleSameAddress}
                  className="w-5 h-5 accent-green-600"
                />
                <span className="text-base text-gray-700">自宅住所と同じ</span>
              </label>
              {!form.farmAddressSame && (
                <>
                  <select
                    name="farmPrefecture"
                    value={form.farmPrefecture}
                    onChange={handleChange}
                    className={`${inputClass} mb-2`}
                  >
                    <option value="">都道府県を選択</option>
                    {PREFECTURES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="farmCityAddress"
                    value={form.farmCityAddress}
                    onChange={handleChange}
                    placeholder="例：○○市○○町1-2-3"
                    className={inputClass}
                  />
                </>
              )}
              {form.farmAddressSame && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-base text-gray-600">
                  {form.prefecture}{form.cityAddress || "（基本情報の住所が反映されます）"}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 届出内容 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            届出内容
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>米穀の種類（複数選択可）</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {["うるち米", "もち米", "玄米", "精米"].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer bg-green-50 rounded-lg px-4 py-3 border-2 border-green-100 hover:border-green-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.grainTypes.includes(type)}
                      onChange={() => handleGrainType(type)}
                      className="w-5 h-5 accent-green-600"
                    />
                    <span className="text-lg text-gray-800">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>年間取扱予定数量</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`${inputClass} flex-1`}
                />
                <span className="text-lg text-gray-600 whitespace-nowrap">精米トン</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>事業開始予定日</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>提出先農政局</label>
              <div className="rounded-lg bg-green-50 border-2 border-green-200 px-4 py-3 text-lg text-gray-800 font-medium min-h-[52px]">
                {nokyo ? `${nokyo}長　殿` : "（住所の都道府県を入力すると自動で表示されます）"}
              </div>
            </div>
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
          {isGenerating && "（フォントを読み込んでいます…）"}
        </p>
      </main>
    </div>
  );
}
