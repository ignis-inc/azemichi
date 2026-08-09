"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PDFModal from "../components/PDFModal";
import { DOC_LAST_CHECKED } from "../site";
import { isValidWarekiDate, warekiToISO } from "../wareki";
import { recordGeneratedDoc } from "../dashboardStore";
import { createFuriganaTracker } from "../furiganaAutofill";
import { trackEvent } from "../lib/analytics";

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

type CommonFormData = {
  name: string;
  nameKana: string;
  prefecture: string;
  cityAddress: string;
  phone: string;
  farmName: string;
  taxOffice: string;
  occupation: string;
  dobEra: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  myNumber: string;
  startEra: string;
  startYear: string;
  startMonth: string;
  startDay: string;
};

type KaigyoExtra = {
  businessSummary: string;
  farmNameKana: string;
  incomeType: string;
  taxLocationType: string;
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

type AoiroExtra = {
  farmTypes: string[];
  bookType: string;
};

type KyuyoJimushoExtra = {
  noticeType: string;
  officeAddressSame: boolean;
  officePrefecture: string;
  officeCityAddress: string;
  officePhone: string;
  officerCount: string;
  employeeCount: string;
  otherCount: string;
};

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

type SenjushaExtra = {
  otherNotes: string;
  employeeSalaryInfo: string;
  accountantName: string;
  accountantPhone: string;
};

type DocKey = "kaigyo" | "aoiro" | "senjusha" | "kyuyoJimusho";

const DOC_INFO: Record<DocKey, { title: string; formal: string; filename: string }> = {
  kaigyo: { title: "開業届", formal: "個人事業の開業・廃業等届出書（開業）", filename: "個人事業の開業届出書.pdf" },
  aoiro: { title: "青色申告承認申請書", formal: "所得税の青色申告承認申請書", filename: "青色申告承認申請書.pdf" },
  senjusha: { title: "専従者給与の届出書", formal: "青色事業専従者給与に関する届出書", filename: "青色事業専従者給与に関する届出書.pdf" },
  kyuyoJimusho: { title: "給与支払事務所等の開設届出書", formal: "給与支払事務所等の開設・移転・廃止届出書", filename: "給与支払事務所等の開設届出書.pdf" },
};

export default function KaigyoSetPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<DocKey[]>([]);
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [docs, setDocs] = useState<Record<DocKey, boolean>>({
    kaigyo: true,
    aoiro: true,
    senjusha: false,
    kyuyoJimusho: false,
  });

  const [common, setCommon] = useState<CommonFormData>({
    name: "",
    nameKana: "",
    prefecture: "",
    cityAddress: "",
    phone: "",
    farmName: "",
    taxOffice: "",
    occupation: "農業",
    dobEra: "昭和",
    dobYear: "50",
    dobMonth: "1",
    dobDay: "1",
    myNumber: "",
    startEra: "令和",
    startYear: "1",
    startMonth: "1",
    startDay: "1",
  });

  const [kaigyoExtra, setKaigyoExtra] = useState<KaigyoExtra>({
    businessSummary: "",
    farmNameKana: "",
    incomeType: "事業所得",
    taxLocationType: "住所地",
    aoiroSubmission: "無",
    professionalCount: "0",
    employeeCount: "0",
    wageMethod: "",
    withholdingTax: "無",
    paymentStartEra: "令和",
    paymentStartYear: "1",
    paymentStartMonth: "1",
    paymentStartDay: "1",
  });

  const [aoiroExtra, setAoiroExtra] = useState<AoiroExtra>({
    farmTypes: [],
    bookType: "",
  });

  const [kyuyoJimushoExtra, setKyuyoJimushoExtra] = useState<KyuyoJimushoExtra>({
    noticeType: "開設",
    officeAddressSame: true,
    officePrefecture: "",
    officeCityAddress: "",
    officePhone: "",
    officerCount: "0",
    employeeCount: "0",
    otherCount: "0",
  });

  const [senjushaList, setSenjushaList] = useState<SenjushaEntry[]>([newSenjusha()]);
  const [senjushaExtra, setSenjushaExtra] = useState<SenjushaExtra>({
    otherNotes: "",
    employeeSalaryInfo: "",
    accountantName: "",
    accountantPhone: "",
  });
  const [nameTracker] = useState(() =>
    createFuriganaTracker((kana) => setCommon((prev) => ({ ...prev, nameKana: kana })))
  );
  // 専従者は行の追加・削除があるため、専従者ごとにトラッカーをkeyで管理する
  const [senjushaTrackers] = useState(() => new Map<string, ReturnType<typeof createFuriganaTracker>>());
  function getSenjushaTracker(key: string) {
    let t = senjushaTrackers.get(key);
    if (!t) {
      t = createFuriganaTracker((kana) => updateSenjusha(key, "nameKana", kana));
      senjushaTrackers.set(key, t);
    }
    return t;
  }

  const needsPersonalDates = docs.kaigyo || docs.aoiro;
  const needsOccupation = docs.kaigyo || docs.senjusha;
  // 個人番号は/kyuyoJimushoでも使う
  const needsMyNumber = docs.kaigyo || docs.aoiro || docs.kyuyoJimusho;
  // 開業年月日は/senjushaの期限計算（採用日の代わり）、/kyuyoJimushoの給与支払開始日にも使うため、
  // それらだけにチェックが入っている場合も表示する
  const needsStartDate = docs.kaigyo || docs.aoiro || docs.senjusha || docs.kyuyoJimusho;

  function handleCommonChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "dobEra") {
      const years = ERA_YEARS[value] ?? [];
      setCommon((prev) => ({ ...prev, dobEra: value, dobYear: String(years[0] ?? 1) }));
      return;
    }
    if (name === "startEra") {
      const years = ERA_YEARS[value] ?? [];
      setCommon((prev) => ({ ...prev, startEra: value, startYear: String(years[0] ?? 1) }));
      return;
    }
    setCommon((prev) => ({ ...prev, [name]: value }));
  }

  function handleKaigyoExtraChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === "paymentStartEra") {
      const years = ERA_YEARS[value] ?? [];
      setKaigyoExtra((prev) => ({ ...prev, paymentStartEra: value, paymentStartYear: String(years[0] ?? 1) }));
      return;
    }
    setKaigyoExtra((prev) => ({ ...prev, [name]: value }));
  }

  function handleAoiroFarmType(type: string) {
    setAoiroExtra((prev) => {
      const has = prev.farmTypes.includes(type);
      return { ...prev, farmTypes: has ? prev.farmTypes.filter((t) => t !== type) : [...prev.farmTypes, type] };
    });
  }

  function handleSenjushaExtraChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    const { name, value } = e.target;
    setSenjushaExtra((prev) => ({ ...prev, [name]: value }));
  }

  function handleKyuyoJimushoExtraChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setKyuyoJimushoExtra((prev) => ({ ...prev, [name]: value }));
  }

  function handleKyuyoJimushoSameAddress(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setKyuyoJimushoExtra((prev) => ({
      ...prev,
      officeAddressSame: checked,
      officePrefecture: checked ? common.prefecture : prev.officePrefecture,
      officeCityAddress: checked ? common.cityAddress : prev.officeCityAddress,
    }));
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

  function toggleDoc(key: DocKey) {
    setDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // /aoiroにチェックが入っている間は、/kaigyoの「青色申告承認申請書の提出」欄を強制的に「有」にする
  const effectiveAoiroSubmission = docs.aoiro ? "有" : kaigyoExtra.aoiroSubmission;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!common.name.trim()) e.name = "氏名を入力してください";
    if (!common.prefecture) e.prefecture = "都道府県を選択してください";
    if (!common.cityAddress.trim()) e.cityAddress = "市区町村・番地を入力してください";
    if (!docs.kaigyo && !docs.aoiro && !docs.senjusha && !docs.kyuyoJimusho) {
      e.docs = "作成する書類を1つ以上選んでください";
    }
    if (needsPersonalDates) {
      if (!isValidWarekiDate(common.dobEra, Number(common.dobYear), Number(common.dobMonth), Number(common.dobDay))) {
        e.dob = "生年月日が実在しない日付です。月と日をご確認ください";
      }
    }
    if (needsStartDate) {
      if (!isValidWarekiDate(common.startEra, Number(common.startYear), Number(common.startMonth), Number(common.startDay))) {
        e.startDate = "開業年月日が実在しない日付です。月と日をご確認ください";
      }
    }
    if (docs.kaigyo) {
      if (!isValidWarekiDate(kaigyoExtra.paymentStartEra, Number(kaigyoExtra.paymentStartYear), Number(kaigyoExtra.paymentStartMonth), Number(kaigyoExtra.paymentStartDay))) {
        e.paymentStartDate = "支給開始予定日が実在しない日付です。月と日をご確認ください";
      }
    }
    if (docs.senjusha) {
      if (senjushaList.length === 0 || senjushaList.every((s) => !s.name.trim())) {
        e.senjusha = "専従者を1人以上、氏名を入力して追加してください";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function generateAll() {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const jobs: { key: DocKey; url: string; filename: string; body: Record<string, unknown> }[] = [];

      if (docs.kaigyo) {
        jobs.push({
          key: "kaigyo",
          url: "/api/kaigyo-pdf",
          filename: DOC_INFO.kaigyo.filename,
          body: {
            name: common.name, nameKana: common.nameKana, prefecture: common.prefecture, cityAddress: common.cityAddress, phone: common.phone,
            dobEra: common.dobEra, dobYear: common.dobYear, dobMonth: common.dobMonth, dobDay: common.dobDay,
            startEra: common.startEra, startYear: common.startYear, startMonth: common.startMonth, startDay: common.startDay,
            myNumber: common.myNumber,
            occupation: common.occupation,
            businessSummary: kaigyoExtra.businessSummary,
            farmName: common.farmName,
            farmNameKana: kaigyoExtra.farmNameKana,
            incomeType: kaigyoExtra.incomeType,
            taxLocationType: kaigyoExtra.taxLocationType,
            taxOffice: common.taxOffice,
            aoiroSubmission: effectiveAoiroSubmission,
            professionalCount: kaigyoExtra.professionalCount,
            employeeCount: kaigyoExtra.employeeCount,
            wageMethod: kaigyoExtra.wageMethod,
            withholdingTax: kaigyoExtra.withholdingTax,
            paymentStartEra: kaigyoExtra.paymentStartEra,
            paymentStartYear: kaigyoExtra.paymentStartYear,
            paymentStartMonth: kaigyoExtra.paymentStartMonth,
            paymentStartDay: kaigyoExtra.paymentStartDay,
          },
        });
      }

      if (docs.aoiro) {
        jobs.push({
          key: "aoiro",
          url: "/api/aoiro-pdf",
          filename: DOC_INFO.aoiro.filename,
          body: {
            name: common.name, nameKana: common.nameKana, prefecture: common.prefecture, cityAddress: common.cityAddress, phone: common.phone,
            dobEra: common.dobEra, dobYear: common.dobYear, dobMonth: common.dobMonth, dobDay: common.dobDay,
            startEra: common.startEra, startYear: common.startYear, startMonth: common.startMonth, startDay: common.startDay,
            myNumber: common.myNumber,
            farmName: common.farmName,
            farmTypes: aoiroExtra.farmTypes,
            taxOffice: common.taxOffice,
            bookType: aoiroExtra.bookType,
          },
        });
      }

      if (docs.senjusha) {
        jobs.push({
          key: "senjusha",
          url: "/api/senjusha-pdf",
          filename: DOC_INFO.senjusha.filename,
          body: {
            name: common.name, nameKana: common.nameKana, prefecture: common.prefecture, cityAddress: common.cityAddress, phone: common.phone,
            occupation: common.occupation,
            farmName: common.farmName,
            taxOffice: common.taxOffice,
            senjushaList: senjushaList
              .filter((s) => s.name.trim())
              .map((s) => ({
                name: s.name, nameKana: s.nameKana, relationship: s.relationship, age: s.age,
                experience: s.experience, jobContent: s.jobContent, qualification: s.qualification,
                salaryMonthly: s.salaryMonthly, salaryPeriod: s.salaryPeriod, bonusPeriod: s.bonusPeriod,
                bonusAmount: s.bonusAmount, raiseCriteria: s.raiseCriteria,
              })),
            otherNotes: senjushaExtra.otherNotes,
            employeeSalaryInfo: senjushaExtra.employeeSalaryInfo,
            accountantName: senjushaExtra.accountantName,
            accountantPhone: senjushaExtra.accountantPhone,
          },
        });
      }

      if (docs.kyuyoJimusho) {
        jobs.push({
          key: "kyuyoJimusho",
          url: "/api/kyuyo-jimusho-pdf",
          filename: DOC_INFO.kyuyoJimusho.filename,
          body: {
            name: common.name, nameKana: common.nameKana, prefecture: common.prefecture, cityAddress: common.cityAddress, phone: common.phone,
            myNumber: common.myNumber,
            farmName: common.farmName,
            noticeType: kyuyoJimushoExtra.noticeType,
            startEra: common.startEra, startYear: common.startYear, startMonth: common.startMonth, startDay: common.startDay,
            officePrefecture: kyuyoJimushoExtra.officeAddressSame ? common.prefecture : kyuyoJimushoExtra.officePrefecture,
            officeCityAddress: kyuyoJimushoExtra.officeAddressSame ? common.cityAddress : kyuyoJimushoExtra.officeCityAddress,
            officePhone: kyuyoJimushoExtra.officePhone,
            officerCount: kyuyoJimushoExtra.officerCount,
            employeeCount: kyuyoJimushoExtra.employeeCount,
            otherCount: kyuyoJimushoExtra.otherCount,
            taxOffice: common.taxOffice,
          },
        });
      }

      // 先に全PDFを取得してから、ダウンロードは少し間隔を空けて順番に発火する
      // （複数ファイルを一斉にトリガーするとブラウザに自動ダウンロードとしてブロックされることがあるため）
      const results = await Promise.all(
        jobs.map(async (job) => {
          const res = await fetch(job.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(job.body),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `サーバーエラー (${res.status})：${DOC_INFO[job.key].title}`);
          }
          const blob = await res.blob();
          return { key: job.key, blob, filename: job.filename };
        })
      );

      // kaigyo・aoiro・senjushaはいずれも共通項目の開業年月日を期限計算の起点日として使う
      const startDateISO = warekiToISO(common.startEra, Number(common.startYear), Number(common.startMonth), Number(common.startDay));

      for (let i = 0; i < results.length; i++) {
        const { key, blob, filename } = results[i];
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        recordGeneratedDoc(key, startDateISO);
        trackEvent("pdf_create", key);
        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      setGeneratedDocs(results.map((r) => r.key));
      setShowModal(true);
    } catch (err) {
      console.error("まとめてPDF生成エラー:", err);
      alert(err instanceof Error ? err.message : "PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }

  const dobEraYears = ERA_YEARS[common.dobEra] ?? [];
  const startEraYears = ERA_YEARS[common.startEra] ?? [];
  const paymentStartEraYears = ERA_YEARS[kaigyoExtra.paymentStartEra] ?? [];

  const inputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
  const smallInputClass =
    "w-full rounded-lg border-2 border-green-200 bg-white px-3 py-2 text-base focus:border-green-500 transition-colors";
  const labelClass = "block text-base font-bold text-gray-700 mb-1";
  const smallLabelClass = "block text-sm font-bold text-gray-600 mb-1";
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
            `作成した書類：${generatedDocs.map((k) => DOC_INFO[k].title).join("・")}`,
            "それぞれのPDFを印刷してください",
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
          開業時にまとめて書類を作る
        </h1>
        <p className="mt-2 text-green-100 text-base">
          開業届・青色申告承認申請書・専従者給与の届出書・給与支払事務所等の開設届出書
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            農業を新しく始めるときによく一緒に提出される4つの書類を、共通する情報の入力は1回だけで、まとめてPDFにできます。それぞれの書類は単体でも
            <Link href="/kaigyo" className="text-green-700 underline underline-offset-2 hover:text-green-800">/kaigyo</Link>
            ・
            <Link href="/aoiro" className="text-green-700 underline underline-offset-2 hover:text-green-800">/aoiro</Link>
            ・
            <Link href="/senjusha" className="text-green-700 underline underline-offset-2 hover:text-green-800">/senjusha</Link>
            ・
            <Link href="/kyuyo-jimusho" className="text-green-700 underline underline-offset-2 hover:text-green-800">/kyuyo-jimusho</Link>
            から作成できます。提出期限や要件は、国税庁・税務署の案内をご確認ください。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            最終確認：{DOC_LAST_CHECKED}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            わからない言葉は
            <Link href="/yougo" className="text-green-700 underline underline-offset-2 hover:text-green-800">用語集</Link>
            で説明しています。
          </p>
        </div>
        <div className="mt-4">
          <Link href="/tool" className="text-base font-bold text-green-700 underline underline-offset-4 hover:text-green-800">
            ← あぜみちの書類作成ツールへ
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 作成する書類を選ぶ */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            作成する書類を選ぶ
          </h2>
          {errors.docs && <p className="text-red-600 text-base mb-4">{errors.docs}</p>}
          <div className="space-y-3">
            {(["kaigyo", "aoiro", "senjusha", "kyuyoJimusho"] as DocKey[]).map((key) => (
              <label key={key} className={radioClass(docs[key])}>
                <input type="checkbox" checked={docs[key]} onChange={() => toggleDoc(key)}
                  className="w-5 h-5 accent-green-600 shrink-0" />
                <div>
                  <div className="text-lg font-bold text-gray-800">{DOC_INFO[key].title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{DOC_INFO[key].formal}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* 共通項目 */}
        <section className={sectionClass}>
          <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
            共通項目
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="set-name">氏名<span className="req">必須</span></label>
              <input type="text" id="set-name" name="name" aria-required="true" value={common.name} onChange={handleCommonChange}
                onCompositionUpdate={nameTracker.handleCompositionUpdate}
                onCompositionEnd={nameTracker.handleCompositionEnd}
                onInput={nameTracker.handleInput}
                placeholder="例：田中　太郎" className={inputClass} />
              {errors.name && <p className="text-red-600 text-base mt-2">{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="set-nameKana">ふりがな</label>
              <input type="text" id="set-nameKana" name="nameKana" value={common.nameKana}
                onChange={(e) => { handleCommonChange(e); nameTracker.notifyManualKanaEdit(); }}
                placeholder="例：たなか　たろう" className={inputClass} />
            </div>

            {needsPersonalDates && (
              <div>
                <label className={labelClass} htmlFor="set-dobEra">生年月日</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <select id="set-dobEra" aria-label="生年月日（年号）" name="dobEra" value={common.dobEra} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {Object.keys(ERA_YEARS).map((era) => (<option key={era} value={era}>{era}</option>))}
                  </select>
                  <select id="set-dobYear" aria-label="生年月日（年）" name="dobYear" value={common.dobYear} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {dobEraYears.map((y) => (<option key={y} value={String(y)}>{y}年</option>))}
                  </select>
                  <select id="set-dobMonth" aria-label="生年月日（月）" name="dobMonth" value={common.dobMonth} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {MONTHS.map((m) => (<option key={m} value={String(m)}>{m}月</option>))}
                  </select>
                  <select id="set-dobDay" aria-label="生年月日（日）" name="dobDay" value={common.dobDay} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {DAYS.map((d) => (<option key={d} value={String(d)}>{d}日</option>))}
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-1">開業届・青色申告承認申請書で使用します。</p>
                {errors.dob && <p className="text-red-600 text-base mt-2">{errors.dob}</p>}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="set-prefecture">住所（納税地）<span className="req">必須</span></label>
              <select id="set-prefecture" aria-label="住所（都道府県）" name="prefecture" aria-required="true" value={common.prefecture} onChange={handleCommonChange}
                className={`${inputClass} mb-2`}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              {errors.prefecture && <p className="text-red-600 text-base mb-2">{errors.prefecture}</p>}
              <input type="text" id="set-cityAddress" aria-label="住所（市区町村・番地）" name="cityAddress" aria-required="true" value={common.cityAddress} onChange={handleCommonChange}
                placeholder="例：○○市○○町1-2-3" className={inputClass} />
              {errors.cityAddress && <p className="text-red-600 text-base mt-2">{errors.cityAddress}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="set-phone">電話番号</label>
              <input type="tel" id="set-phone" name="phone" value={common.phone} onChange={handleCommonChange}
                placeholder="例：090-1234-5678" className={inputClass} />
            </div>

            {needsMyNumber && (
              <div>
                <label className={labelClass} htmlFor="set-myNumber">個人番号（マイナンバー）</label>
                <input type="text" id="set-myNumber" inputMode="numeric" maxLength={12} name="myNumber"
                  value={common.myNumber} onChange={handleCommonChange} placeholder="123456789012" className={inputClass} />
              </div>
            )}

            {needsOccupation && (
              <div>
                <label className={labelClass} htmlFor="set-occupation">職業</label>
                <input type="text" id="set-occupation" name="occupation" value={common.occupation} onChange={handleCommonChange}
                  placeholder="例：農業" className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="set-farmName">屋号（農場名）</label>
              <input type="text" id="set-farmName" name="farmName" value={common.farmName} onChange={handleCommonChange}
                placeholder="例：田中農場（任意）" className={inputClass} />
            </div>

            {needsStartDate && (
              <div>
                <label className={labelClass} htmlFor="set-startEra">開業年月日</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <select id="set-startEra" aria-label="開業年月日（年号）" name="startEra" value={common.startEra} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {Object.keys(ERA_YEARS).map((era) => (<option key={era} value={era}>{era}</option>))}
                  </select>
                  <select id="set-startYear" aria-label="開業年月日（年）" name="startYear" value={common.startYear} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {startEraYears.map((y) => (<option key={y} value={String(y)}>{y}年</option>))}
                  </select>
                  <select id="set-startMonth" aria-label="開業年月日（月）" name="startMonth" value={common.startMonth} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {MONTHS.map((m) => (<option key={m} value={String(m)}>{m}月</option>))}
                  </select>
                  <select id="set-startDay" aria-label="開業年月日（日）" name="startDay" value={common.startDay} onChange={handleCommonChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {DAYS.map((d) => (<option key={d} value={String(d)}>{d}日</option>))}
                  </select>
                </div>
                <p className="text-sm text-gray-500 mt-1">開業届・青色申告承認申請書・専従者給与の届出書（採用日の代わり）で使用します。</p>
                {errors.startDate && <p className="text-red-600 text-base mt-2">{errors.startDate}</p>}
              </div>
            )}

            <div>
              <label className={labelClass} htmlFor="set-taxOffice">提出先税務署名</label>
              <input type="text" id="set-taxOffice" name="taxOffice" value={common.taxOffice} onChange={handleCommonChange}
                placeholder="例：新宿税務署" className={inputClass} />
            </div>
          </div>
        </section>

        {/* /kaigyo 固有項目 */}
        {docs.kaigyo && (
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
              開業届の固有項目
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>所得の種類</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["事業所得", "不動産所得", "山林所得"].map((opt) => (
                    <label key={opt} className={radioClass(kaigyoExtra.incomeType === opt)}>
                      <input type="radio" name="incomeType" value={opt} checked={kaigyoExtra.incomeType === opt}
                        onChange={handleKaigyoExtraChange} className="w-5 h-5 accent-green-600 shrink-0" />
                      <span className="text-base text-gray-800">{opt}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">農業から生じる所得は「事業所得」です。</p>
              </div>

              <div>
                <label className={labelClass}>納税地の種別</label>
                <div className="grid grid-cols-3 gap-3">
                  {["住所地", "居所地", "事業所等"].map((opt) => (
                    <label key={opt} className={radioClass(kaigyoExtra.taxLocationType === opt)}>
                      <input type="radio" name="taxLocationType" value={opt} checked={kaigyoExtra.taxLocationType === opt}
                        onChange={handleKaigyoExtraChange} className="w-5 h-5 accent-green-600 shrink-0" />
                      <span className="text-base text-gray-800">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="set-farmNameKana">屋号のふりがな</label>
                <input type="text" id="set-farmNameKana" name="farmNameKana" value={kaigyoExtra.farmNameKana} onChange={handleKaigyoExtraChange}
                  placeholder="例：たなかのうじょう（任意）" className={inputClass} />
              </div>

              <div>
                <label className={labelClass} htmlFor="set-businessSummary">事業の概要</label>
                <input type="text" id="set-businessSummary" name="businessSummary" value={kaigyoExtra.businessSummary} onChange={handleKaigyoExtraChange}
                  placeholder="例：野菜の生産・販売、米作" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>「青色申告承認申請書」の提出</label>
                {docs.aoiro ? (
                  <div className="rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3">
                    <p className="text-lg font-bold text-green-800">有（/aoiroも同時に作成するため自動設定）</p>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {["有", "無"].map((opt) => (
                      <label key={opt} className={`flex-1 ${radioClass(kaigyoExtra.aoiroSubmission === opt)}`}>
                        <input type="radio" name="aoiroSubmission" value={opt} checked={kaigyoExtra.aoiroSubmission === opt}
                          onChange={handleKaigyoExtraChange} className="w-5 h-5 accent-green-600" />
                        <span className="text-lg">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-700 pt-2">給与等の支払の状況</h3>
              <p className="text-sm text-gray-500 -mt-3">家族や従業員に給与を支払う予定がない場合は、0のままで構いません。</p>

              <div>
                <label className={labelClass} htmlFor="set-professionalCount">専従者の人数</label>
                <input type="number" min="0" step="1" id="set-professionalCount" name="professionalCount"
                  value={kaigyoExtra.professionalCount} onChange={handleKaigyoExtraChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-employeeCount">使用人の人数</label>
                <input type="number" min="0" step="1" id="set-employeeCount" name="employeeCount"
                  value={kaigyoExtra.employeeCount} onChange={handleKaigyoExtraChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-wageMethod">給与の定め方</label>
                <input type="text" id="set-wageMethod" name="wageMethod" value={kaigyoExtra.wageMethod} onChange={handleKaigyoExtraChange}
                  placeholder="例：月給" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>源泉徴収税額の有無</label>
                <div className="flex gap-4">
                  {["有", "無"].map((opt) => (
                    <label key={opt} className={`flex-1 ${radioClass(kaigyoExtra.withholdingTax === opt)}`}>
                      <input type="radio" name="withholdingTax" value={opt} checked={kaigyoExtra.withholdingTax === opt}
                        onChange={handleKaigyoExtraChange} className="w-5 h-5 accent-green-600" />
                      <span className="text-lg">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="set-paymentStartEra">支給開始予定日</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <select id="set-paymentStartEra" aria-label="支給開始予定日（年号）" name="paymentStartEra" value={kaigyoExtra.paymentStartEra} onChange={handleKaigyoExtraChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {Object.keys(ERA_YEARS).map((era) => (<option key={era} value={era}>{era}</option>))}
                  </select>
                  <select id="set-paymentStartYear" aria-label="支給開始予定日（年）" name="paymentStartYear" value={kaigyoExtra.paymentStartYear} onChange={handleKaigyoExtraChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {paymentStartEraYears.map((y) => (<option key={y} value={String(y)}>{y}年</option>))}
                  </select>
                  <select id="set-paymentStartMonth" aria-label="支給開始予定日（月）" name="paymentStartMonth" value={kaigyoExtra.paymentStartMonth} onChange={handleKaigyoExtraChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {MONTHS.map((m) => (<option key={m} value={String(m)}>{m}月</option>))}
                  </select>
                  <select id="set-paymentStartDay" aria-label="支給開始予定日（日）" name="paymentStartDay" value={kaigyoExtra.paymentStartDay} onChange={handleKaigyoExtraChange}
                    className="rounded-lg border-2 border-green-200 bg-white px-3 py-3 text-lg focus:border-green-500">
                    {DAYS.map((d) => (<option key={d} value={String(d)}>{d}日</option>))}
                  </select>
                </div>
                {errors.paymentStartDate && <p className="text-red-600 text-base mt-2">{errors.paymentStartDate}</p>}
              </div>
            </div>
          </section>
        )}

        {/* /aoiro 固有項目 */}
        {docs.aoiro && (
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
              青色申告承認申請書の固有項目
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>農業の種類（複数選択可）</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["水稲", "畑作", "野菜", "果樹", "畜産", "その他"].map((type) => (
                    <label key={type}
                      className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-colors ${
                        aoiroExtra.farmTypes.includes(type)
                          ? "border-green-500 bg-green-50"
                          : "border-green-100 bg-green-50 hover:border-green-400"
                      }`}>
                      <input type="checkbox" checked={aoiroExtra.farmTypes.includes(type)}
                        onChange={() => handleAoiroFarmType(type)} className="w-5 h-5 accent-green-600" />
                      <span className="text-lg text-gray-800">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>帳簿の種類</label>
                <div className="space-y-3">
                  {[
                    { value: "複式簿記（65万円控除）", label: "複式簿記（65万円控除）", desc: "主な書類：仕訳帳・総勘定元帳など" },
                    { value: "簡易簿記（10万円控除）", label: "簡易簿記（10万円控除）", desc: "主な書類：現金出納帳・売掛帳など" },
                  ].map((opt) => (
                    <label key={opt.value} className={radioClass(aoiroExtra.bookType === opt.value)}>
                      <input type="radio" name="bookType" value={opt.value} checked={aoiroExtra.bookType === opt.value}
                        onChange={(e) => setAoiroExtra((prev) => ({ ...prev, bookType: e.target.value }))}
                        className="w-5 h-5 accent-green-600 shrink-0" />
                      <div>
                        <div className="text-lg font-bold text-gray-800">{opt.label}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* /senjusha 固有項目 */}
        {docs.senjusha && (
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
              専従者給与の届出書の固有項目<span className="req">必須</span>
            </h2>
            {errors.senjusha && <p className="text-red-600 text-base mb-4">{errors.senjusha}</p>}
            <div className="space-y-5">
              {senjushaList.map((s, i) => (
                <div key={s.key} className="border-2 border-green-200 rounded-xl p-4 bg-green-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-green-800">専従者 {i + 1}</h3>
                    {senjushaList.length > 1 && (
                      <button type="button" onClick={() => removeSenjusha(s.key)}
                        className="text-rose-600 underline text-sm" aria-label={`専従者${i + 1}を削除`}>
                        削除
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={smallLabelClass}>氏名</label>
                      <input type="text" value={s.name} onChange={(e) => updateSenjusha(s.key, "name", e.target.value)}
                        onCompositionUpdate={getSenjushaTracker(s.key).handleCompositionUpdate}
                        onCompositionEnd={getSenjushaTracker(s.key).handleCompositionEnd}
                        onInput={getSenjushaTracker(s.key).handleInput}
                        placeholder="例：田中　花子" className={smallInputClass} />
                    </div>
                    <div>
                      <label className={smallLabelClass}>ふりがな</label>
                      <input type="text" value={s.nameKana}
                        onChange={(e) => {
                          updateSenjusha(s.key, "nameKana", e.target.value);
                          getSenjushaTracker(s.key).notifyManualKanaEdit();
                        }}
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
            <button type="button" onClick={addSenjusha}
              className="w-full mt-4 bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 text-lg font-bold py-3 px-6 rounded-2xl shadow-sm transition-colors">
              ＋ 専従者を追加する
            </button>

            <div className="space-y-5 mt-6">
              <div>
                <label className={labelClass} htmlFor="set-otherNotes">その他参考事項</label>
                <textarea id="set-otherNotes" name="otherNotes" value={senjushaExtra.otherNotes} onChange={handleSenjushaExtraChange}
                  rows={3} placeholder="（任意）" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-employeeSalaryInfo">使用人（専従者以外の従業員）の給与の状況</label>
                <textarea id="set-employeeSalaryInfo" name="employeeSalaryInfo" value={senjushaExtra.employeeSalaryInfo} onChange={handleSenjushaExtraChange}
                  rows={3} placeholder="例：他に雇用している従業員はいません（任意）" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-accountantName">税理士の氏名（任意）</label>
                <input type="text" id="set-accountantName" name="accountantName" value={senjushaExtra.accountantName} onChange={handleSenjushaExtraChange}
                  placeholder="依頼している場合のみ" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="set-accountantPhone">税理士の電話番号（任意）</label>
                <input type="tel" id="set-accountantPhone" name="accountantPhone" value={senjushaExtra.accountantPhone} onChange={handleSenjushaExtraChange}
                  placeholder="依頼している場合のみ" className={inputClass} />
              </div>
            </div>
          </section>
        )}

        {/* /kyuyoJimusho 固有項目 */}
        {docs.kyuyoJimusho && (
          <section className={sectionClass}>
            <h2 className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
              給与支払事務所等の開設届出書の固有項目
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>届出区分</label>
                <div className="grid grid-cols-3 gap-3">
                  {["開設", "移転", "廃止"].map((t) => (
                    <label key={t} className={radioClass(kyuyoJimushoExtra.noticeType === t)}>
                      <input type="radio" name="noticeType" value={t} checked={kyuyoJimushoExtra.noticeType === t}
                        onChange={handleKyuyoJimushoExtraChange} className="w-5 h-5 accent-green-600 shrink-0" />
                      <span className="text-base text-gray-800">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>事務所等の所在地</label>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input type="checkbox" checked={kyuyoJimushoExtra.officeAddressSame} onChange={handleKyuyoJimushoSameAddress}
                    className="w-5 h-5 accent-green-600" />
                  <span className="text-base text-gray-700">共通項目の住所と同じ</span>
                </label>
                {!kyuyoJimushoExtra.officeAddressSame && (
                  <>
                    <select
                      aria-label="事務所の所在地（都道府県）"
                      name="officePrefecture"
                      value={kyuyoJimushoExtra.officePrefecture}
                      onChange={handleKyuyoJimushoExtraChange}
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
                      value={kyuyoJimushoExtra.officeCityAddress}
                      onChange={handleKyuyoJimushoExtraChange}
                      placeholder="例：○○市○○町1-2-3"
                      className={inputClass}
                    />
                  </>
                )}
                {kyuyoJimushoExtra.officeAddressSame && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-base text-gray-600">
                    {common.prefecture}{common.cityAddress || "（共通項目の住所が反映されます）"}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="set-officePhone">事務所等の電話番号</label>
                <input type="tel" id="set-officePhone" name="officePhone" value={kyuyoJimushoExtra.officePhone} onChange={handleKyuyoJimushoExtraChange}
                  placeholder="例：090-1234-5678（住所と同じ場合は空欄可）" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>従事員数</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="set-officerCount">役員</label>
                    <input type="number" min="0" step="1" id="set-officerCount" name="officerCount"
                      value={kyuyoJimushoExtra.officerCount} onChange={handleKyuyoJimushoExtraChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="set-employeeCount">従業員</label>
                    <input type="number" min="0" step="1" id="set-employeeCount" name="employeeCount"
                      value={kyuyoJimushoExtra.employeeCount} onChange={handleKyuyoJimushoExtraChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="set-otherCount">その他</label>
                    <input type="number" min="0" step="1" id="set-otherCount" name="otherCount"
                      value={kyuyoJimushoExtra.otherCount} onChange={handleKyuyoJimushoExtraChange} className={inputClass} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">専従者給与を受ける家族従業員は「従業員」に含めて構いません。</p>
              </div>
            </div>
          </section>
        )}

        {/* 生成ボタン */}
        <button
          ref={pdfButtonRef}
          onClick={generateAll}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
        >
          {isGenerating ? "PDF作成中…少々お待ちください" : "まとめて作成する"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4 mb-4">
          ボタンを押すと、選んだ書類の数だけPDFファイルが順番に自動でダウンロードされます
        </p>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、入力内容をもとに書類の様式を作成する補助ツールです。記載内容の正確性や提出の可否はご自身でご確認ください。あぜみちは行政書士・税理士業務を行うものではありません。正式な手続きの前に、提出先の窓口や専門家にご相談ください。
        </p>
      </main>
    </div>
  );
}
