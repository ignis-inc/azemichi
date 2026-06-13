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

const TAISHO_YEARS = Array.from({ length: 15 }, (_, i) => i + 1);  // 大正1〜15
const SHOWA_YEARS  = Array.from({ length: 64 }, (_, i) => i + 1);  // 昭和1〜64
const HEISEI_YEARS = Array.from({ length: 31 }, (_, i) => i + 1);  // 平成1〜31
const REIWA_YEARS  = Array.from({ length: 8  }, (_, i) => i + 1);  // 令和1〜8

const ERA_YEARS: Record<string, number[]> = {
  "大正": TAISHO_YEARS,
  "昭和": SHOWA_YEARS,
  "平成": HEISEI_YEARS,
  "令和": REIWA_YEARS,
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

type KeieiFormData = {
  nenji: string;
  applicationStatus: string;
  name: string;
  nameKana: string;
  dobEra: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  managementType: string;
  certificationStatus: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  applyGeta: string;
  applyNarashi: string;
  applyWataden: string;
  watadenSub: string[];
  envCheck: boolean;
  privacyCheck: boolean;
  bankStatus: string;
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
};

export default function KeieiPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<KeieiFormData>({
    nenji: "6",
    applicationStatus: "",
    name: "",
    nameKana: "",
    dobEra: "昭和",
    dobYear: "40",
    dobMonth: "1",
    dobDay: "1",
    managementType: "",
    certificationStatus: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    applyGeta: "",
    applyNarashi: "",
    applyWataden: "",
    watadenSub: [],
    envCheck: false,
    privacyCheck: false,
    bankStatus: "",
    bankName: "",
    branchName: "",
    accountType: "",
    accountNumber: "",
    accountHolder: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "dobEra") {
      const years = ERA_YEARS[value] ?? [];
      setForm((prev) => ({ ...prev, dobEra: value, dobYear: String(years[0] ?? 1) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckbox(field: keyof KeieiFormData) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function handleWatadenSub(type: string) {
    setForm((prev) => {
      const has = prev.watadenSub.includes(type);
      return {
        ...prev,
        watadenSub: has ? prev.watadenSub.filter((t) => t !== type) : [...prev.watadenSub, type],
      };
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "氏名または法人名を入力してください";
    if (!form.prefecture) e.prefecture = "都道府県を選択してください";
    if (!form.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generatePDF() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/keiei-pdf", {
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
      a.download = "経営所得安定対策等交付金交付申請書.pdf";
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
            "地域農業再生協議会に提出してください（提出期限：毎年4月1日〜6月30日）",
            "様式第2号（営農計画書）も別途必要です",
          ]}
          buttons={[
            { label: "eMAFFで申請する →", href: "https://e.maff.go.jp/PortalLogin", variant: "green" },
            { label: "様式第2号をダウンロード →", href: "https://www.maff.go.jp/j/kobetu_ninaite/keiei/h27_download.html", variant: "outline" },
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          経営所得安定対策（補助金）の申請書
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：経営所得安定対策等交付金交付申請書（様式第1号A）
        </p>
      </header>

      <DocNav current="/keiei" />

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* ① 申請者情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            ① 申請者情報
          </h2>
          <div className="space-y-5">

            {/* 申請年産 */}
            <div>
              <label className={labelClass}>申請年産</label>
              <select name="nenji" value={form.nenji} onChange={handleChange}
                className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500 focus:outline-none">
                {["6", "7", "8"].map((y) => (
                  <option key={y} value={y}>令和{y}年産</option>
                ))}
              </select>
            </div>

            {/* 継続・新規 */}
            <div>
              <label className={labelClass}>申請区分</label>
              <div className="flex gap-4">
                {["継続", "新規"].map((s) => (
                  <label key={s} className={radioClass(form.applicationStatus === s)}>
                    <input type="radio" name="applicationStatus" value={s}
                      checked={form.applicationStatus === s} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-lg">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 氏名 */}
            <div>
              <label className={labelClass}>氏名または法人名</label>
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

            {/* 経営形態 */}
            <div>
              <label className={labelClass}>経営形態</label>
              <div className="space-y-2 mt-1">
                {["個人", "集落営農", "法人"].map((t) => (
                  <label key={t} className={radioClass(form.managementType === t)}>
                    <input type="radio" name="managementType" value={t}
                      checked={form.managementType === t} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base text-gray-800">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 認定状況 */}
            <div>
              <label className={labelClass}>認定状況</label>
              <div className="space-y-2 mt-1">
                {[
                  "認定農業者",
                  "認定新規就農者",
                  "集落営農（認定農業者・認定新規就農者以外）",
                  "その他（特例対象者）",
                ].map((s) => (
                  <label key={s} className={radioClass(form.certificationStatus === s)}>
                    <input type="radio" name="certificationStatus" value={s}
                      checked={form.certificationStatus === s} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base text-gray-800">{s}</span>
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

        {/* ② 交付申請内容 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            ② 交付申請内容
          </h2>
          <div className="space-y-6">

            {/* ゲタ */}
            <div>
              <label className={labelClass}>
                畑作物の直接支払交付金（ゲタ対策）
              </label>
              <div className="flex gap-4 mt-1">
                {["申請する", "申請しない"].map((v) => (
                  <label key={v} className={radioClass(form.applyGeta === v)}>
                    <input type="radio" name="applyGeta" value={v}
                      checked={form.applyGeta === v} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ナラシ */}
            <div>
              <label className={labelClass}>
                収入減少影響緩和交付金（ナラシ対策）
              </label>
              <div className="flex gap-4 mt-1">
                {["申請する", "申請しない"].map((v) => (
                  <label key={v} className={radioClass(form.applyNarashi === v)}>
                    <input type="radio" name="applyNarashi" value={v}
                      checked={form.applyNarashi === v} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 水田活用 */}
            <div>
              <label className={labelClass}>
                水田活用の直接支払交付金
              </label>
              <div className="flex gap-4 mt-1">
                {["申請する", "申請しない"].map((v) => (
                  <label key={v} className={radioClass(form.applyWataden === v)}>
                    <input type="radio" name="applyWataden" value={v}
                      checked={form.applyWataden === v} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base">{v}</span>
                  </label>
                ))}
              </div>

              {/* 水田活用サブ選択 */}
              {form.applyWataden === "申請する" && (
                <div className="mt-4 pl-4 border-l-4 border-green-300">
                  <p className="text-sm font-bold text-gray-600 mb-3">申請する作物・取組（複数選択可）</p>
                  <div className="space-y-2">
                    {[
                      "戦略作物（麦・大豆・飼料作物等）",
                      "産地交付金",
                      "耕畜連携活動支援",
                      "高収益作物転換推進",
                    ].map((sub) => (
                      <label key={sub}
                        className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-colors ${
                          form.watadenSub.includes(sub)
                            ? "border-green-500 bg-green-50"
                            : "border-green-100 bg-green-50 hover:border-green-400"
                        }`}>
                        <input type="checkbox" checked={form.watadenSub.includes(sub)}
                          onChange={() => handleWatadenSub(sub)} className="w-5 h-5 accent-green-600" />
                        <span className="text-base text-gray-800">{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ③ 環境と調和 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            ③ 環境と調和のとれた農業生産の実施
          </h2>
          <label className={`flex items-start gap-4 cursor-pointer px-4 py-4 rounded-xl border-2 transition-colors ${
            form.envCheck ? "border-green-500 bg-green-50" : "border-green-200 bg-white hover:border-green-400"
          }`}>
            <input type="checkbox" checked={form.envCheck}
              onChange={() => handleCheckbox("envCheck")}
              className="w-6 h-6 accent-green-600 mt-0.5 shrink-0" />
            <span className="text-base text-gray-800 leading-relaxed">
              過去1年及び今後1年間、環境と調和のとれた農業生産活動規範（エコファーマー等）に取り組んでいる、または取り組む予定である
            </span>
          </label>
        </section>

        {/* ④ 個人情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            ④ 個人情報の取扱いについて
          </h2>
          <label className={`flex items-start gap-4 cursor-pointer px-4 py-4 rounded-xl border-2 transition-colors ${
            form.privacyCheck ? "border-green-500 bg-green-50" : "border-green-200 bg-white hover:border-green-400"
          }`}>
            <input type="checkbox" checked={form.privacyCheck}
              onChange={() => handleCheckbox("privacyCheck")}
              className="w-6 h-6 accent-green-600 mt-0.5 shrink-0" />
            <span className="text-base text-gray-800 leading-relaxed">
              個人情報の取扱いについて同意する
            </span>
          </label>
        </section>

        {/* 振込口座 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            振込口座
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>口座情報</label>
              <div className="flex gap-4">
                {["変更なし", "新規登録・変更"].map((s) => (
                  <label key={s} className={`flex-1 ${radioClass(form.bankStatus === s)}`}>
                    <input type="radio" name="bankStatus" value={s}
                      checked={form.bankStatus === s} onChange={handleChange}
                      className="w-5 h-5 accent-green-600" />
                    <span className="text-base">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.bankStatus === "新規登録・変更" && (
              <div className="space-y-4 mt-2 pl-4 border-l-4 border-green-300">
                <div>
                  <label className={labelClass}>金融機関名</label>
                  <input type="text" name="bankName" value={form.bankName} onChange={handleChange}
                    placeholder="例：○○銀行、○○農業協同組合" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>支店名</label>
                  <input type="text" name="branchName" value={form.branchName} onChange={handleChange}
                    placeholder="例：○○支店" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>口座種別</label>
                  <div className="flex gap-4">
                    {["普通", "当座"].map((t) => (
                      <label key={t} className={radioClass(form.accountType === t)}>
                        <input type="radio" name="accountType" value={t}
                          checked={form.accountType === t} onChange={handleChange}
                          className="w-5 h-5 accent-green-600" />
                        <span className="text-base">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>口座番号</label>
                  <input type="text" name="accountNumber" value={form.accountNumber}
                    onChange={handleChange} inputMode="numeric"
                    placeholder="例：1234567" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>口座名義（カタカナ）</label>
                  <input type="text" name="accountHolder" value={form.accountHolder}
                    onChange={handleChange}
                    placeholder="例：タナカ　タロウ" className={inputClass} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 様式第2号について */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-3 pb-2 border-b-2 border-green-200">
            様式第2号（営農計画書）について
          </h2>
          <p className="text-base text-gray-700 leading-relaxed mb-3">
            本申請書とあわせて、<strong>様式第2号（営農計画書）</strong>の提出が必要です。<br />
            農林水産省の公式サイトから書式をダウンロードしてご使用ください。
          </p>
          <a
            href="https://www.maff.go.jp/j/kobetu_ninaite/keiei/h27_download.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-700 font-bold underline hover:text-green-900 text-base"
          >
            農林水産省 様式ダウンロードページ
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </section>

        {/* 生成ボタン */}
        <button
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
