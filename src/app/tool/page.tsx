"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import PDFModal from "../components/PDFModal";
import { CHOKKURA_NOTIFY_URL, DOC_LAST_CHECKED } from "../site";

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
  submissionDest: string;
};

export default function Home() {
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
    farmName: "",
    farmAddressSame: false,
    farmPrefecture: "",
    farmCityAddress: "",
    grainTypes: [],
    quantity: "",
    startDate: "",
    submissionDest: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // 都道府県を選ぶと提出先農政局を自動で入力する（利用者はあとから修正可能）
  function handlePrefectureChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const kyoku = value ? NOSEI_KYOKU[value] ?? "" : "";
    const dest = kyoku ? `${kyoku}長　殿` : "";
    setForm((prev) => ({ ...prev, prefecture: value, submissionDest: dest }));
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
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";

  return (
    <div className="min-h-screen bg-green-50">
      {showModal && (
        <PDFModal
          returnFocusRef={pdfButtonRef}
          steps={[
            "このPDFを印刷してください",
            "以下のいずれかで農政局に提出してください",
          ]}
          buttons={[
            { label: "eMAFFでオンライン申請する →", href: "https://e.maff.go.jp/PortalLogin", variant: "green" },
            { label: "最寄りの農政局を探す →", href: "https://www.maff.go.jp/j/org/outline/dial/kyoku.html", variant: "outline" },
            { label: "閉じる", variant: "gray", onClick: () => setShowModal(false) },
          ]}
          chokkuraCta={{
            text: "次は、つくったものを売る場所。ちょっくらで直販を始めませんか？（近日公開）",
            href: CHOKKURA_NOTIFY_URL,
          }}
          onClose={() => setShowModal(false)}
        />
      )}
      {/* あぜみち サービス紹介 */}
      <div className="bg-white border-b-2 border-green-100 px-4 py-8 text-center">
        <h2 className="text-4xl font-bold text-green-800 mb-2">あぜみち</h2>
        <p className="text-lg font-bold text-green-700 mb-3">農家の手続きを、もっと簡単に。</p>
        <p className="text-xl font-medium text-gray-700 mb-4">農業の手続き書類を、スマホで簡単に作れます</p>
        <p className="text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
          必要な情報を入力すると、農林水産省や税務署に提出する書類の様式をPDFにできます。内容をご確認のうえ、印刷して窓口に持参するか、オンラインで申請してください。
        </p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto mt-3">
          つくったものを売る準備ができたら、その先は直販のしくみ『ちょっくら』へ（近日公開）。
        </p>
        <div className="mt-5 flex items-center justify-center gap-5">
          <Link
            href="/"
            className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            ← あぜみちトップへ
          </Link>
          <Link
            href="/#omoi"
            className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800"
          >
            私たちの想い
          </Link>
        </div>
      </div>

      {/* やりたいことから書類を選ぶカード一覧 */}
      <section className="doc-picker">
        <div className="doc-picker-inner">
          <h2 className="doc-picker-title">やりたいことから書類を選ぶ</h2>
          <p className="doc-picker-lead">あてはまるものをお選びください。</p>
          <ul className="doc-picker-list">
            <li>
              <a href="#form" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">お米を売りはじめる方へ</span>
                  <span className="doc-card-name">米の販売届出（米穀の出荷又は販売の事業開始届出書）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">↓</span>
              </a>
            </li>
            <li>
              <Link href="/aoiro" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">青色申告をはじめる方へ</span>
                  <span className="doc-card-name">所得税の青色申告承認申請書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/nouchi" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">農地を相続・売買した方へ</span>
                  <span className="doc-card-name">農地法第3条の3第1項の規定による届出書</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/nenkin" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">農業者年金に加入する方へ</span>
                  <span className="doc-card-name">農業者年金通常加入申込書（様式第1号）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link href="/keiei" className="doc-card">
                <span className="doc-card-body">
                  <span className="doc-card-purpose">
                    経営所得安定対策（補助金）を申請する方へ
                  </span>
                  <span className="doc-card-name">経営所得安定対策等交付金交付申請書（様式第1号A）</span>
                </span>
                <span className="doc-card-arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ヘッダー */}
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">
          お米を売り始めるときの届出
        </h1>
        <p className="mt-2 text-green-100 text-base">
          正式名称：米穀の出荷又は販売の事業開始届出書
        </p>
      </header>

      {/* この書類が必要な場面（一般的な説明・非断定）＋出典 */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            米穀（お米）の出荷・販売の事業を始めるときに、食糧法にもとづいて地方農政局へ行う届出です。年間の取扱規模が一定（20精米トン）未満の場合は対象外とされています。要否や提出先は、農林水産省・地方農政局の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a
              href="https://www.maff.go.jp/j/seisan/syukka_hanbai_todokede/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline underline-offset-2 hover:text-green-800 break-words"
            >
              農林水産省「米穀の出荷又は販売の事業の届出等について」
            </a>
            <br />
            最終確認：{DOC_LAST_CHECKED}
          </p>
        </div>
      </div>

      <DocNav current="/tool" />

      <main id="form" className="max-w-2xl mx-auto px-4 py-6 scroll-mt-4">

        {/* 基本情報 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            基本情報
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="tool-name">氏名<span className="req">必須</span></label>
              <input
                id="tool-name"
                aria-required="true"
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
              <label className={labelClass} htmlFor="tool-nameKana">ふりがな</label>
              <input
                id="tool-nameKana"
                type="text"
                name="nameKana"
                value={form.nameKana}
                onChange={handleChange}
                placeholder="例：たなか　たろう"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tool-prefecture">住所<span className="req">必須</span></label>
              <select
                id="tool-prefecture"
                aria-label="住所（都道府県）"
                aria-required="true"
                name="prefecture"
                value={form.prefecture}
                onChange={handlePrefectureChange}
                className={`${inputClass} mb-2`}
              >
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input
                id="tool-cityAddress"
                aria-label="住所（市区町村・番地）"
                aria-required="true"
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
              <label className={labelClass} htmlFor="tool-phone">電話番号</label>
              <input
                id="tool-phone"
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
              <label className={labelClass} htmlFor="tool-farmName">農場名</label>
              <input
                id="tool-farmName"
                type="text"
                name="farmName"
                value={form.farmName}
                onChange={handleChange}
                placeholder="例：田中農場"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tool-farmPrefecture">事業所住所</label>
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
                    id="tool-farmPrefecture"
                    aria-label="事業所住所（都道府県）"
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
                    id="tool-farmCityAddress"
                    aria-label="事業所住所（市区町村・番地）"
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
              <label className={labelClass} htmlFor="tool-quantity">年間取扱予定数量</label>
              <div className="flex items-center gap-3">
                <input
                  id="tool-quantity"
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
              <label className={labelClass} htmlFor="tool-startDate">事業開始予定日</label>
              <input
                id="tool-startDate"
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tool-submissionDest">提出先農政局</label>
              <input
                id="tool-submissionDest"
                type="text"
                name="submissionDest"
                value={form.submissionDest}
                onChange={handleChange}
                placeholder="（住所の都道府県を選ぶと自動で表示されます）"
                className={inputClass}
              />
              <p className="text-sm text-gray-500 mt-2">
                ※自動で表示されますが、ご確認のうえ必要に応じて修正してください
              </p>
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
          {isGenerating && "（フォントを読み込んでいます…）"}
        </p>

        <p className="text-xs text-gray-400 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、入力内容をもとに書類の様式を作成する補助ツールです。記載内容の正確性や提出の可否はご自身でご確認ください。あぜみちは行政書士・税理士業務を行うものではありません。正式な手続きの前に、提出先の窓口や専門家にご相談ください。
        </p>
      </main>

      {/* 別サービス「ちょっくら」紹介（琥珀・茶系アクセントで別サービスと区別） */}
      <section className="border-t-4 px-4 py-10" style={{ background: "#FFFBEB", borderColor: "#B45309" }}>
        <div className="max-w-2xl mx-auto text-center">
          <span
            className="inline-block text-sm font-bold rounded-full px-4 py-1 mb-4"
            style={{ background: "#B45309", color: "#FFFFFF" }}
          >
            ちょっくら（近日公開）
          </span>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#92400E" }}>
            つくったものを、自分の値段で直接売る。
          </h2>
          <p className="text-base leading-relaxed max-w-lg mx-auto mb-6" style={{ color: "#78350F" }}>
            ちょっくらは、農家さんが育てた農産物を、自分でつけた価格でお客さまに直接販売できる直販サービスです。あぜみちで手続きを整えたら、次は売る場所へ。
          </p>
          <a
            href={CHOKKURA_NOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-lg font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            style={{ background: "#B45309", color: "#FFFFFF" }}
          >
            興味がある方はこちら（お知らせ登録）
          </a>
          <p className="text-xs mt-4" style={{ color: "#B45309" }}>
            ※ ちょっくらはあぜみちとは別のサービスです
          </p>
        </div>
      </section>
    </div>
  );
}
