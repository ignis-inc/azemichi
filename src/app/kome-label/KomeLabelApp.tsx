"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DocNav from "../components/DocNav";
import { trackEvent } from "../lib/analytics";
import {
  BUNZUKI_OPTIONS,
  CAA_ACT_URL,
  CAA_QA_URL,
  COLOR_OPTIONS,
  DESIGN_OPTIONS,
  EGOV_URL,
  EMPTY,
  EVIDENCE_OPTIONS,
  IMAGE_STORAGE_KEY,
  KIND_OPTIONS,
  KODAIMAI_OPTIONS,
  LAST_CHECKED,
  PREFECTURES,
  PRINT_SIZES,
  SHEET_OPTIONS,
  STORAGE_KEY,
  VARIETY_CANDIDATES,
  amountText,
  bigTextChoices,
  buildBack,
  buildFront,
  checkOptional,
  checkWords,
  dateItemLabel,
  dateText,
  hasEvidence,
  isGenmai,
  judgeShinmai,
  loadImages,
  loadInputs,
  minPointFor,
  missingItems,
  parseGrams,
  readKomeShinSeller,
  saveImages,
  saveInputs,
  todayIso,
  yearText,
  type Design,
  type FieldKey,
  type Inputs,
  type Issue,
  type LabelImages,
} from "./komeLabelData";
import {
  OUTPUT_DPI,
  ensureFonts,
  loadImage,
  makeCanvas,
  renderBack,
  renderFront,
  type LabelImageElements,
} from "./komeLabelRender";
import { LABEL_FONTS, registerLabelFonts } from "./komeLabelFonts";

const inputClass =
  "w-full rounded-lg border-2 border-green-200 bg-white px-4 py-3 text-lg focus:border-green-500 transition-colors";
const labelClass = "block text-base font-bold text-gray-700 mb-1";
const sectionClass = "bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-6";
const noteClass = "text-sm text-gray-600 leading-relaxed mt-2";
const linkClass = "text-green-700 underline underline-offset-2 hover:text-green-800 break-words";

// ---- 小さな部品 ----

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className={sectionClass} aria-labelledby={`kl-step-${step}`}>
      <p className="text-sm font-bold text-green-700">段階{step}</p>
      <h2 id={`kl-step-${step}`} className="text-xl font-bold text-green-800 mb-5 pb-2 border-b-2 border-green-200">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Req() {
  return <span className="req">必須</span>;
}

// 一括表示での項目名（法律での呼び方）
function Formal({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs font-normal text-gray-500 mt-0.5">一括表示の項目：{children}</span>;
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 mt-2 leading-relaxed">
      {children}
    </div>
  );
}

function Choice({
  name,
  legend,
  formal,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  legend: string;
  formal?: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {legend}
        {required && <Req />}
        {formal && <Formal>{formal}</Formal>}
      </legend>
      <div className="space-y-2 mt-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-start gap-3 cursor-pointer bg-green-50 rounded-lg px-4 py-3 border-2 border-green-100 hover:border-green-400 transition-colors"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="w-5 h-5 mt-0.5 accent-green-600 shrink-0"
            />
            <span className="text-base text-gray-800">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckBox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 mt-0.5 accent-green-600 shrink-0"
      />
      <span className="text-base text-gray-800">{children}</span>
    </label>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <ul className="space-y-3">
      {issues.map((x) => (
        <li
          key={x.id}
          className={`rounded-lg border-2 px-4 py-3 ${
            x.level === "block" ? "bg-red-50 border-red-300 text-red-900" : "bg-yellow-50 border-yellow-300 text-yellow-900"
          }`}
        >
          <p className="text-base font-bold">
            {x.level === "block" ? "止まります：" : "注意："}
            {x.title}
          </p>
          <p className="text-sm leading-relaxed mt-1">{x.message}</p>
          {x.link && (
            <p className="text-sm mt-1">
              <a href={x.link.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-bold">
                {x.link.label} →
              </a>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// 画像を小さくしてから data URL にする（端末の中だけで処理し、サーバーへ送らない）
function shrinkImage(file: File, maxSide: number, type: "image/png" | "image/jpeg"): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      if (type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(type, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

// 画面の見本の細かさ（横幅がおよそ640pxになるようにする）
function previewDpi(wMm: number): number {
  return Math.min(220, Math.max(90, (640 * 25.4) / wMm));
}

// ---- 本体 ----

export default function KomeLabelApp() {
  const [inputs, setInputs] = useState<Inputs>(loadInputs);
  const [images, setImages] = useState<LabelImages>(loadImages);
  const [imageNote, setImageNote] = useState("");
  const [importNote, setImportNote] = useState("");
  const [busy, setBusy] = useState("");
  const [backInfo, setBackInfo] = useState<{ fits: boolean; pt: number } | null>(null);

  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  function set(key: FieldKey, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const i = inputs;
  const evidence = hasEvidence(i);
  const genmai = isGenmai(i);
  const grams = parseGrams(i.amount, i.unit);
  const minPt = minPointFor(grams.grams);
  const sheet = SHEET_OPTIONS.find((s) => s.value === i.sheet) ?? SHEET_OPTIONS[0];
  const shinmai = judgeShinmai(i);
  const issues = useMemo(() => [...checkOptional(inputs), ...checkWords(inputs)], [inputs]);
  const blocks = issues.filter((x) => x.level === "block");
  const missing = missingItems(i);
  const backModel = useMemo(() => buildBack(inputs), [inputs]);
  const frontModel = useMemo(() => buildFront(inputs, shinmai.ok), [inputs, shinmai.ok]);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, k) => String(thisYear - k));
  const notTarget = i.targetOk === "no";
  const canOutput = !notTarget && missing.length === 0 && blocks.length === 0;
  const pdfReady = canOutput && backInfo?.fits === true;
  // 使えない言葉が入っているときは、見本にも「出力できません」と重ねて出す
  const wordBlocked = blocks.some((x) => !x.id.endsWith("-confirm"));

  // 見本を描く（入力が変わるたびに、少し待ってから描き直す）
  const imageCache = useRef(new Map<string, HTMLImageElement | null>());
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const getImg = async (src: string) => {
        if (!src) return null;
        if (!imageCache.current.has(src)) imageCache.current.set(src, await loadImage(src));
        return imageCache.current.get(src) ?? null;
      };
      const els: LabelImageElements = { logo: await getImg(images.logo), photo: await getImg(images.photo) };
      const allText = [
        frontModel.big, frontModel.originLine, frontModel.kindLine, frontModel.farm, frontModel.catchCopy,
        ...frontModel.badges, backModel.sellerName, backModel.sellerAddress, backModel.sellerPhone,
        backModel.variety, backModel.origin, backModel.method, backModel.date, ...backModel.extras,
      ].join("");
      try {
        await registerLabelFonts();
        await ensureFonts(LABEL_FONTS, allText);
      } catch {
        // フォントが読めなくても、ほかのフォントで描く
      }
      if (cancelled) return;
      const dpi = previewDpi(sheet.wMm);
      if (frontRef.current) {
        const c = frontRef.current;
        c.width = Math.round((sheet.wMm * dpi) / 25.4);
        c.height = Math.round((sheet.hMm * dpi) / 25.4);
        renderFront(c, sheet.wMm, frontModel, i.design as Design, colorHex(i.color), els, LABEL_FONTS);
        if (wordBlocked) markBlocked(c);
      }
      if (backRef.current) {
        // 文字の大きさは、PDFに書き出すときと同じ細かさ（OUTPUT_DPI）で決める。
        // 画面の見本も、その大きさで描く（画面の表示と書き出しの大きさをそろえる）
        const out = renderBack(makeCanvas(sheet.wMm, sheet.hMm, OUTPUT_DPI), sheet.wMm, backModel, minPt, LABEL_FONTS);
        const c = backRef.current;
        c.width = Math.round((sheet.wMm * dpi) / 25.4);
        c.height = Math.round((sheet.hMm * dpi) / 25.4);
        renderBack(c, sheet.wMm, backModel, minPt, LABEL_FONTS, out.pt);
        setBackInfo(out);
      }
      for (const d of DESIGN_OPTIONS) {
        const c = thumbRefs.current[d.value];
        if (!c) continue;
        const tdpi = (150 * 25.4) / sheet.wMm;
        c.width = Math.round((sheet.wMm * tdpi) / 25.4);
        c.height = Math.round((sheet.hMm * tdpi) / 25.4);
        renderFront(c, sheet.wMm, frontModel, d.value, colorHex(i.color), els, LABEL_FONTS);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [frontModel, backModel, images, i.design, i.color, sheet, minPt, wordBlocked]);

  function resetInputs() {
    if (!window.confirm("入力した内容とロゴ・写真をすべて消して、最初の状態に戻します。よろしいですか？")) return;
    setInputs(EMPTY);
    setImages({ logo: "", photo: "" });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(IMAGE_STORAGE_KEY);
    } catch {
      // 消せなくても画面の入力は空になる
    }
  }

  function importSeller() {
    const draft = readKomeShinSeller();
    if (!draft) {
      setImportNote("この端末に「お米の新しい届出（電子申請）の下書き」の入力が見つかりませんでした。");
      return;
    }
    const filled = i.sellerName || i.sellerAddress || i.sellerPhone;
    if (filled && !window.confirm("いま入っている販売者の名前・住所・電話番号を、届出の下書きの内容に置きかえます。よろしいですか？")) return;
    setInputs((prev) => ({ ...prev, sellerName: draft.name, sellerAddress: draft.address, sellerPhone: draft.phone }));
    setImportNote("届出の下書きから読み込みました。ここで直しても、届出の下書きは変わりません。");
  }

  async function handleImage(kind: "logo" | "photo", file: File | undefined) {
    if (!file) return;
    try {
      const data = kind === "logo" ? await shrinkImage(file, 800, "image/png") : await shrinkImage(file, 1800, "image/jpeg");
      const next = { ...images, [kind]: data };
      setImages(next);
      setImageNote(
        saveImages(next)
          ? ""
          : "画像が大きいため、この端末に保存できませんでした。ラベルには使えますが、ページを閉じると消えます。",
      );
    } catch {
      setImageNote("画像を読み込めませんでした。JPEG または PNG の画像を選んでください。");
    }
  }

  function removeImage(kind: "logo" | "photo") {
    const next = { ...images, [kind]: "" };
    setImages(next);
    saveImages(next);
    setImageNote("");
  }

  async function drawForOutput(wMm: number, hMm: number) {
    const els: LabelImageElements = { logo: await loadImage(images.logo), photo: await loadImage(images.photo) };
    await registerLabelFonts();
    await ensureFonts(LABEL_FONTS, [frontModel.big, frontModel.farm, frontModel.catchCopy, backModel.sellerName, backModel.sellerAddress].join(""));
    const front = makeCanvas(wMm, hMm, OUTPUT_DPI);
    renderFront(front, wMm, frontModel, i.design as Design, colorHex(i.color), els, LABEL_FONTS);
    const back = makeCanvas(wMm, hMm, OUTPUT_DPI);
    const result = renderBack(back, wMm, backModel, minPt, LABEL_FONTS);
    return { front, back, fits: result.fits, pt: result.pt };
  }

  async function handlePdf() {
    if (!pdfReady) return;
    setBusy("pdf");
    try {
      const { front, back, fits, pt } = await drawForOutput(sheet.wMm, sheet.hMm);
      // 画面の「文字の大きさ」は、実際に書き出した大きさにそろえる
      setBackInfo({ fits, pt });
      if (!fits) {
        alert(`この大きさでは、一括表示が${minPt}ポイント以上の文字で入りきりません。大きい用紙を選んでください。`);
        return;
      }
      const { downloadSheetPdf } = await import("./komeLabelOutput");
      await downloadSheetPdf(front, back, sheet, toMm(i.offsetX), toMm(i.offsetY), `お米のラベル_A4_${sheet.value}面.pdf`);
      trackEvent("pdf_create", "komeLabel");
    } catch (err) {
      console.error("PDF作成エラー:", err);
      alert("PDFの作成に失敗しました。もう一度お試しください。");
    } finally {
      setBusy("");
    }
  }

  async function handlePng(sizeValue: string, side: "front" | "back") {
    if (!canOutput) return;
    const size = PRINT_SIZES.find((s) => s.value === sizeValue);
    if (!size) return;
    setBusy(`${sizeValue}-${side}`);
    try {
      const { front, back, fits } = await drawForOutput(size.wMm, size.hMm);
      if (side === "back" && !fits) {
        alert(`この大きさでは、一括表示が${minPt}ポイント以上の文字で入りきりません。`);
        return;
      }
      const { downloadPng } = await import("./komeLabelOutput");
      await downloadPng(side === "front" ? front : back, `お米のラベル_${side === "front" ? "表" : "裏"}_${size.value}判.png`);
      trackEvent("pdf_create", "komeLabel");
    } catch (err) {
      console.error("画像作成エラー:", err);
      alert("画像の作成に失敗しました。もう一度お試しください。");
    } finally {
      setBusy("");
    }
  }

  const wordIssues = issues.filter((x) => !x.id.endsWith("-confirm"));

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-700 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold leading-tight">お米のラベルづくり</h1>
        <p className="mt-2 text-green-100 text-base">袋詰めしたお米の、表（デザイン面）と裏（一括表示）のラベル</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white border border-green-100 rounded-xl px-5 py-4">
          <p className="text-base text-gray-600 leading-relaxed">
            1種類のお米をそのまま袋に詰めて売るときのラベルを、無料で作れます。入力した内容とロゴ・写真は、この端末のブラウザの中だけで使い、どこにも送りません。PDFと画像も、この端末の中で作ります。
          </p>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            出典：
            <a href={EGOV_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              食品表示基準（e-Gov法令検索）
            </a>
            ／
            <a href={CAA_QA_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              消費者庁「食品表示基準Q&A 別添 玄米及び精米に関する事項」
            </a>
            <br />
            最終確認：{LAST_CHECKED}
          </p>
        </div>

        {/* 段階0：はじめに */}
        <section className="border-4 border-red-300 bg-red-50 rounded-xl px-5 py-5 mt-4" aria-labelledby="kl-step-0">
          <p className="text-sm font-bold text-red-800">段階0</p>
          <h2 id="kl-step-0" className="text-xl font-bold text-red-900 mb-3">はじめに（必ずお読みください）</h2>
          <ul className="space-y-3 text-base font-bold text-red-900 leading-relaxed">
            <li className="bg-white border-2 border-red-200 rounded-lg px-4 py-3">
              表示の内容の正しさは、販売する方の責任です。最終的な確認は、県の食品表示の相談窓口などで行ってください。
            </li>
            <li className="bg-white border-2 border-red-200 rounded-lg px-4 py-3">
              事実と違う表示のラベルを作ることはご遠慮ください。
            </li>
            <li className="bg-white border-2 border-red-200 rounded-lg px-4 py-3">
              このツールで作れば法律に合う、という保証はしません。
            </li>
          </ul>
          <p className="text-sm text-red-900 mt-3 leading-relaxed">
            一括表示とは、袋に書くことが法律で決まっている表示の欄のことです（名称・原料玄米・内容量・精米時期・販売者）。このツールは、その書き漏らしを防ぐための手伝いをします。
          </p>
        </section>
      </div>

      <DocNav current="/kome-label" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          <span className="req">必須</span> は、ラベルを作るために入力が必要な項目です。入力は途中まででも、この端末に自動で保存されます。
        </p>

        {/* 段階1 */}
        <Section step="1" title="対象の確認">
          <Choice
            name="targetOk"
            legend="どんなお米を売りますか"
            options={[
              { value: "yes", label: "1種類のお米を、そのまま袋に詰めて売る（玄米・うるち精米・もち精米・胚芽精米）" },
              { value: "no", label: "ちがう（ブレンド米、特別な工程の発芽玄米、加工品など）" },
            ]}
            value={i.targetOk}
            onChange={(v) => set("targetOk", v)}
            required
          />
          <p className={noteClass}>
            黒米・赤米などの古代米と、お湯につけて芽を出させただけの発芽玄米は、玄米として作れます。GABAを増やすなど特別な工程を経た発芽玄米は、加工食品になるため対象外です（消費者庁Q&A 玄米精米－13）。
          </p>
          {notTarget && (
            <p role="alert" className="rounded-lg bg-red-50 border-2 border-red-300 px-4 py-3 text-base text-red-900 font-bold">
              このツールでは作れません。複数のお米を混ぜたもの（ブレンド米）、特別な工程を経た発芽玄米、加工品の表示は、県の食品表示の相談窓口などでご確認ください。
            </p>
          )}
        </Section>

        {/* 段階2 */}
        <Section step="2" title="お米の種類">
          <Choice
            name="kind"
            legend="お米の種類"
            formal="名称"
            options={KIND_OPTIONS}
            value={i.kind}
            onChange={(v) => set("kind", v)}
            required
          />
          {i.kind === "uruchi" && (
            <Choice
              name="seimaiName"
              legend="名称の書き方"
              options={[
                { value: "精米", label: "精米" },
                { value: "うるち精米", label: "うるち精米" },
              ]}
              value={i.seimaiName}
              onChange={(v) => set("seimaiName", v)}
            />
          )}
          {i.kind === "haiga" && (
            <p className={noteClass}>
              胚芽を含む精米が、製品の重さの8割以上のときだけ「胚芽精米」と書きます。8割未満なら「うるち精米」を選んでください（食品表示基準 別表第24）。
            </p>
          )}

          {i.kind === "uruchi" && (
            <div>
              <label className={labelClass} htmlFor="kl-bunzuki">分づき（任意）</label>
              <select id="kl-bunzuki" value={i.bunzuki} onChange={(e) => set("bunzuki", e.target.value)} className={inputClass}>
                <option value="">書かない</option>
                {BUNZUKI_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {i.bunzuki && (
                <div className="mt-3">
                  <CheckBox checked={i.bunzukiConfirm === "1"} onChange={(v) => set("bunzukiConfirm", v ? "1" : "")}>
                    {i.bunzuki}であることを、自分で事実として確認できる
                  </CheckBox>
                </div>
              )}
              <InfoNote>
                分づきの度合いの書き方は、国の決まりがありません。消費者庁のQ&Aでは、「分つき米である旨」は書いてもよい任意の表示の例とされています（玄米精米－40）。
              </InfoNote>
            </div>
          )}

          {i.kind && !genmai && (
            <div>
              <p className={labelClass}>無洗米（任意）</p>
              <CheckBox checked={i.musenmai === "1"} onChange={(v) => set("musenmai", v ? "1" : "")}>
                「無洗米」と書く
              </CheckBox>
              {i.musenmai === "1" && (
                <div className="mt-3">
                  <CheckBox checked={i.musenmaiConfirm === "1"} onChange={(v) => set("musenmaiConfirm", v ? "1" : "")}>
                    洗わずに炊けるように加工した無洗米であることを、自分で事実として確認できる
                  </CheckBox>
                </div>
              )}
              <InfoNote>
                無洗米の書き方は、国の決まりがありません（無洗米の基準は、業界の団体ごとに違います）。事実を確認できる場合だけ書いてください。
              </InfoNote>
            </div>
          )}

          {genmai && (
            <div>
              <label className={labelClass} htmlFor="kl-kodaimai">古代米（任意）</label>
              <select id="kl-kodaimai" value={i.kodaimai} onChange={(e) => set("kodaimai", e.target.value)} className={inputClass}>
                <option value="">書かない</option>
                {KODAIMAI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <p className={noteClass}>
                黒米・赤米・紫黒米は、名称は「玄米」のままで、一括表示の欄の外に「黒米」などと書いてよいとされています（消費者庁Q&A 玄米精米－14）。
              </p>
            </div>
          )}
        </Section>

        {/* 段階3 */}
        <Section step="3" title="産地・品種・産年">
          <div>
            <Choice
              name="evidence"
              legend="産地・品種・産年の根拠資料を保管していますか"
              formal="原料玄米"
              options={EVIDENCE_OPTIONS}
              value={i.evidence}
              onChange={(v) => setInputs((prev) => ({ ...prev, evidence: v, confirmMethod: "" }))}
              required
            />
            <p className={noteClass}>
              根拠資料とは、表示が正しいことを説明できる書類です。農産物検査を受けていないお米は、「どの種苗を使ったかがわかる資料（種苗の購入記録など）」と「品種ごとの作付けがわかる資料（水稲共済細目書異動申告書、営農計画書、営農日誌など）」の両方が考えられるとされています。袋詰めの時期（調製・精米した日）から3年間保管します（消費者庁Q&A 玄米精米－19・20）。
            </p>
          </div>

          {i.evidence === "none" && (
            <p className="rounded-lg bg-blue-50 border-2 border-blue-200 px-4 py-3 text-base text-blue-900 leading-relaxed">
              根拠資料がない場合、一括表示は「複数原料米　国内産　10割」の形になります。表（デザイン面）にも、品種名と産年は出しません（産地・品種・産年を表示するには、根拠資料の保管が必要です）。
            </p>
          )}

          {evidence && (
            <>
              <div>
                <p className={labelClass}>
                  産地<Req />
                  <Formal>原料玄米（産地）</Formal>
                </p>
                <select aria-label="産地（都道府県）" value={i.pref} onChange={(e) => set("pref", e.target.value)} className={inputClass}>
                  <option value="">都道府県を選択</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  aria-label="産地（市町村名など・任意）"
                  value={i.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="市町村名など（任意。例：豊後大野市）"
                  className={`${inputClass} mt-2`}
                />
                <p className={noteClass}>都道府県名に、市町村名などを続けて書くこともできます（消費者庁Q&A 玄米精米－23）。</p>
              </div>

              <div>
                <label className={labelClass} htmlFor="kl-variety">
                  品種<Req />
                  <Formal>原料玄米（品種）</Formal>
                </label>
                <input
                  id="kl-variety"
                  type="text"
                  list="kl-variety-list"
                  value={i.variety}
                  onChange={(e) => set("variety", e.target.value)}
                  placeholder="例：ヒノヒカリ"
                  className={inputClass}
                />
                <datalist id="kl-variety-list">
                  {VARIETY_CANDIDATES.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                <p className={noteClass}>入力すると、よく作られている品種の候補が出ます。候補にない品種も、そのまま入力できます。</p>
                <InfoNote>
                  登録品種かどうかはツールでは確認できません。品種として表示できるのは、原則として種苗法で品種登録（または出願）された品種や、農産物規格規程に載っている品種で、根拠資料があるものとされています（消費者庁Q&A 玄米精米－4）。ブランド品種の場合は、県やブランドの決まりもご確認ください。
                </InfoNote>
              </div>

              <div>
                <label className={labelClass} htmlFor="kl-year">
                  産年（収穫した年）<Req />
                  <Formal>原料玄米（産年）</Formal>
                </label>
                <select id="kl-year" value={i.year} onChange={(e) => set("year", e.target.value)} className={inputClass}>
                  <option value="">選択してください</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{yearText(y, i.era)}（{y}年）</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="kl-method">根拠を確認した方法の表示（任意）</label>
                <select id="kl-method" value={i.confirmMethod} onChange={(e) => set("confirmMethod", e.target.value)} className={inputClass}>
                  <option value="">書かない</option>
                  {i.evidence === "kensa" && <option value="kensa">農産物検査証明による</option>}
                  {i.evidence === "shubyo" && <option value="shubyo">種子の購入記録及び生産記録による確認</option>}
                </select>
                <p className={noteClass}>
                  書くかどうかは任意ですが、書くことが望ましいとされています（消費者庁Q&A 玄米精米－3）。「一等米」などの等級の言葉は、ここで「農産物検査証明による」を選んだときだけ使えます。
                </p>
              </div>
            </>
          )}
        </Section>

        {/* 段階4 */}
        <Section step="4" title="内容量・時期・販売者">
          <div>
            <label className={labelClass} htmlFor="kl-amount">
              内容量<Req />
              <Formal>内容量</Formal>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="kl-amount"
                type="text"
                inputMode="decimal"
                value={i.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="5"
                className={`${inputClass} flex-1 min-w-0`}
              />
              <select aria-label="内容量の単位" value={i.unit} onChange={(e) => set("unit", e.target.value)} className={`${inputClass} w-24`}>
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
            {grams.error && <p className="text-red-600 text-base mt-2">{grams.error}</p>}
            {grams.grams !== null && (
              <p className="mt-2 rounded-lg bg-green-50 border-2 border-green-200 px-4 py-2 text-base text-green-900">
                一括表示の文字は <strong>{minPt}ポイント以上</strong> で作ります（内容量{grams.grams <= 3000 ? "3kg以下は8ポイント以上" : "3kgより大きい袋は12ポイント以上"}）。
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="kl-date">
              {genmai ? "調製した日（玄米にした日）" : "精米した日"}<Req />
              <Formal>{dateItemLabel(i)}</Formal>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="kl-date"
                type="date"
                value={i.date}
                onChange={(e) => set("date", e.target.value)}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <button
                type="button"
                onClick={() => set("date", todayIso())}
                className="shrink-0 border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white text-base font-bold py-3 px-4 rounded-lg transition-colors"
              >
                今日
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <Choice
                name="dateStyle"
                legend="書き方"
                options={[
                  { value: "jun", label: "上旬・中旬・下旬" },
                  { value: "date", label: "年月日" },
                ]}
                value={i.dateStyle}
                onChange={(v) => set("dateStyle", v)}
              />
              <Choice
                name="era"
                legend="年の書き方"
                options={[
                  { value: "wa", label: "令和" },
                  { value: "sei", label: "西暦" },
                ]}
                value={i.era}
                onChange={(v) => set("era", v)}
              />
            </div>
            {dateText(i) && (
              <p className="mt-2 text-base text-gray-800">
                ラベルでの書き方：<strong>{dateText(i)}</strong>
              </p>
            )}
            <p className={noteClass}>
              上旬は1〜10日、中旬は11〜20日、下旬は21日〜末日です（消費者庁Q&A 玄米精米－7・8）。年の書き方は、産年にも使います。
            </p>
          </div>

          <div className="space-y-3">
            <p className={labelClass}>
              販売者<Req />
              <Formal>{genmai ? "販売者" : "販売者（精米工場）"}の氏名又は名称、住所及び電話番号</Formal>
            </p>
            <button
              type="button"
              onClick={importSeller}
              className="border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white text-base font-bold py-2 px-4 rounded-lg transition-colors"
            >
              「お米の新しい届出」の下書きから読み込む
            </button>
            <p className="text-sm text-gray-600 leading-relaxed">
              この端末で
              <Link href="/kome-shin" className={linkClass}>お米の新しい届出（電子申請）の下書き</Link>
              を入力している場合、屋号（なければお名前）・住所・電話番号を一度だけコピーします。届出の下書きは変わりません。
            </p>
            {importNote && (
              <p role="status" className="text-sm text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{importNote}</p>
            )}
            {!genmai && (
              <Choice
                name="sellerRole"
                legend="表示する人"
                options={[
                  { value: "seller", label: "販売者（ふつうはこちら）" },
                  { value: "factory", label: "精米工場（精米工場が表示する場合）" },
                ]}
                value={i.sellerRole}
                onChange={(v) => set("sellerRole", v)}
              />
            )}
            {i.sellerRole === "factory" && !genmai && (
              <p className={noteClass}>精米工場のときは、工場を持つ業者の名前と工場の名前、工場の住所・電話番号を書きます（消費者庁Q&A 玄米精米－2）。</p>
            )}
            <div>
              <label className="block text-sm text-gray-600" htmlFor="kl-sellerName">氏名又は名称（屋号も書けます）</label>
              <input id="kl-sellerName" type="text" value={i.sellerName} onChange={(e) => set("sellerName", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-gray-600" htmlFor="kl-sellerAddress">住所</label>
              <input id="kl-sellerAddress" type="text" autoComplete="street-address" value={i.sellerAddress} onChange={(e) => set("sellerAddress", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-gray-600" htmlFor="kl-sellerPhone">電話番号</label>
              <input id="kl-sellerPhone" type="tel" autoComplete="tel" value={i.sellerPhone} onChange={(e) => set("sellerPhone", e.target.value)} className={inputClass} />
            </div>
          </div>
        </Section>

        {/* 段階5 */}
        <Section step="5" title="表（デザイン面）">
          <div>
            <label className={labelClass} htmlFor="kl-farm">農園名（任意）</label>
            <input id="kl-farm" type="text" value={i.farmName} onChange={(e) => set("farmName", e.target.value)} placeholder="例：あぜみち農園" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="kl-catch">ひとこと（キャッチコピー・任意）</label>
            <input
              id="kl-catch"
              type="text"
              maxLength={40}
              value={i.catchCopy}
              onChange={(e) => set("catchCopy", e.target.value)}
              placeholder="例：朝の冷え込みが育てた、つやつやの粒"
              className={inputClass}
            />
            {wordIssues.some((x) => x.level === "block") && (
              <p role="alert" className="text-base text-red-700 font-bold mt-2">
                使えない言葉があります。段階6でくわしい理由を確認してください。
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="kl-big">大きく出す文字</label>
            <select id="kl-big" value={i.bigText} onChange={(e) => set("bigText", e.target.value)} className={inputClass}>
              {bigTextChoices(i).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <p className="mt-2 text-base text-gray-800">
              いまの大きな文字：<strong>{frontModel.big}</strong>
            </p>
            {!evidence && (
              <p className={noteClass}>根拠資料がないため、品種名は使えません。農園名や「お米」などに自動で切り替えます。</p>
            )}
          </div>

          <div className="space-y-3">
            <p className={labelClass}>表に出すもの</p>
            {evidence && (
              <CheckBox checked={i.showOrigin === "1"} onChange={(v) => set("showOrigin", v ? "1" : "")}>
                産地（{i.pref ? `${i.pref}${i.city}産` : "段階3で選んだ産地"}）
              </CheckBox>
            )}
            <CheckBox checked={i.showAmount === "1"} onChange={(v) => set("showAmount", v ? "1" : "")}>
              お米の種類と内容量（{[backModel.name, amountText(i)].filter(Boolean).join("　") || "段階2・4で入力"}）
            </CheckBox>
            <CheckBox checked={i.shinmai === "1"} onChange={(v) => set("shinmai", v ? "1" : "")}>
              「新米」と入れる
            </CheckBox>
            {(i.shinmai === "1" || /新米/.test(i.catchCopy + i.farmName)) && (
              <p
                role="status"
                className={`text-sm leading-relaxed rounded-lg border-2 px-3 py-2 ${
                  shinmai.ok ? "bg-green-50 border-green-300 text-green-900" : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                自動の判定：{shinmai.reason}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className={labelClass}>農園のロゴ・写真（任意）</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              画像は、この端末のブラウザの中だけで使います。サーバーには送りません。県やブランドの公式ロゴは使わないでください。
            </p>
            {(["logo", "photo"] as const).map((kind) => (
              <div key={kind} className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white text-base font-bold py-2 px-4 rounded-lg transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-green-500">
                  {kind === "logo" ? "ロゴを選ぶ" : "写真を選ぶ"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(e) => {
                      handleImage(kind, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {images[kind] && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[kind]} alt={kind === "logo" ? "選んだロゴ" : "選んだ写真"} className="h-12 w-auto rounded border border-gray-200" />
                    <button type="button" onClick={() => removeImage(kind)} className="text-sm text-gray-700 underline underline-offset-2">
                      取り消す
                    </button>
                  </>
                )}
              </div>
            ))}
            {imageNote && <p role="status" className="text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2">{imageNote}</p>}
          </div>

          <fieldset>
            <legend className={labelClass}>デザインの見本</legend>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {DESIGN_OPTIONS.map((d) => (
                <label
                  key={d.value}
                  className={`cursor-pointer rounded-xl border-2 p-2 bg-white transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-green-500 ${
                    i.design === d.value ? "border-green-600 ring-2 ring-green-300" : "border-green-100 hover:border-green-400"
                  }`}
                >
                  <input type="radio" name="design" value={d.value} checked={i.design === d.value} onChange={() => set("design", d.value)} className="sr-only" />
                  <canvas
                    ref={(el) => {
                      thumbRefs.current[d.value] = el;
                    }}
                    className="w-full h-auto rounded border border-gray-200"
                    aria-hidden="true"
                  />
                  <span className="block text-base font-bold text-gray-800 mt-2">
                    {i.design === d.value ? "✓ " : ""}
                    {d.label}
                  </span>
                  <span className="block text-xs text-gray-600 leading-snug">{d.desc}</span>
                </label>
              ))}
            </div>
            {i.design === "photo" && !images.photo && (
              <p className={noteClass}>写真を選ぶと、色の部分に写真が入ります。</p>
            )}
          </fieldset>

          <fieldset>
            <legend className={labelClass}>色</legend>
            <div className="flex flex-wrap gap-3 mt-2">
              {COLOR_OPTIONS.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border-2 px-3 py-2 bg-white focus-within:outline focus-within:outline-3 focus-within:outline-green-500 ${
                    i.color === c.value ? "border-green-600" : "border-gray-200"
                  }`}
                >
                  <input type="radio" name="color" value={c.value} checked={i.color === c.value} onChange={() => set("color", c.value)} className="sr-only" />
                  <span className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  <span className="text-base text-gray-800">{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        {/* 段階6 */}
        <Section step="6" title="条件つきの言葉の確認">
          <p className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-900">
            このチェックで法律に合うことを保証するものではありません。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            農園名・ひとこと・品種・産地の欄に入れた言葉と、「新米」の設定を確かめます。「無農薬」「減農薬」「無化学肥料」「減化学肥料」「特別栽培」「有機」「オーガニック」は使えません。「新米」「一等米」は条件を満たすときだけ使えます。言い換えた言葉は見つけられないことがあります。
          </p>
          <div role="status" aria-live="polite">
            {issues.length === 0 ? (
              <p className="rounded-lg bg-green-50 border-2 border-green-300 px-4 py-3 text-base text-green-900 font-bold">
                止まる言葉は見つかりませんでした。
              </p>
            ) : (
              <IssueList issues={issues} />
            )}
          </div>
        </Section>

        {/* 段階7 */}
        <Section step="7" title="見本と出力">
          <div>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              下の見本は、選んだ用紙の1枚分の大きさです。表と裏を見比べて、内容をよく確かめてください。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <figure>
                <canvas ref={frontRef} className="w-full h-auto border border-gray-300 rounded bg-white" role="img" aria-label="表（デザイン面）の見本" />
                <figcaption className="text-sm text-gray-700 text-center mt-1">表（デザイン面）</figcaption>
              </figure>
              <figure>
                <canvas ref={backRef} className="w-full h-auto border border-gray-300 rounded bg-white" role="img" aria-label="裏（一括表示）の見本" />
                <figcaption className="text-sm text-gray-700 text-center mt-1">裏（一括表示）</figcaption>
              </figure>
            </div>
            {backInfo && (
              <p
                role="status"
                className={`mt-3 rounded-lg border-2 px-4 py-2 text-base ${
                  backInfo.fits ? "bg-green-50 border-green-300 text-green-900" : "bg-red-50 border-red-300 text-red-900 font-bold"
                }`}
              >
                {backInfo.fits
                  ? `一括表示の文字の大きさ：${backInfo.pt}ポイント（下限 ${minPt}ポイント）`
                  : `この用紙の大きさでは、一括表示が${minPt}ポイント以上の文字で入りきりません。大きい用紙を選んでください。`}
              </p>
            )}
          </div>

          <Choice
            name="sheet"
            legend="A4シール用紙の種類"
            options={SHEET_OPTIONS}
            value={i.sheet}
            onChange={(v) => set("sheet", v)}
          />
          <details className="rounded-lg border-2 border-green-100 px-4 py-3">
            <summary className="cursor-pointer text-base font-bold text-gray-700">印刷の位置がずれるとき（微調整）</summary>
            <p className={noteClass}>
              ラベルの位置は、エーワンの公式の寸法（4面は余白・すき間なし、10面は左18.6mm・上21.2mm）のとおりです。それでも機械ごとに少しずれることがあるので、試しに普通紙へ印刷し、シール用紙と重ねてずれを確かめてください。4面はA4をぴったり4つに分ける形なので、フチなし印刷（または余白なしの設定）が必要です。
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm text-gray-600" htmlFor="kl-offx">右へずらす（mm）</label>
                <input id="kl-offx" type="number" step="0.5" min="-10" max="10" value={i.offsetX} onChange={(e) => set("offsetX", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-600" htmlFor="kl-offy">下へずらす（mm）</label>
                <input id="kl-offy" type="number" step="0.5" min="-10" max="10" value={i.offsetY} onChange={(e) => set("offsetY", e.target.value)} className={inputClass} />
              </div>
            </div>
            <p className={noteClass}>マイナスの数を入れると、左・上へずれます。</p>
          </details>

          {!canOutput && (
            <div role="alert" className="rounded-lg bg-red-50 border-2 border-red-300 px-4 py-3 text-red-900">
              <p className="text-base font-bold">まだ出力できません。次を確かめてください。</p>
              <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                {notTarget && <li>段階1：このツールの対象外のお米です</li>}
                {missing.filter((m) => !(notTarget && m.startsWith("段階1"))).map((m) => (
                  <li key={m}>{m}（未入力）</li>
                ))}
                {blocks.map((b) => (
                  <li key={b.id}>段階{b.id.endsWith("-confirm") ? "2" : "6"}：{b.title}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handlePdf}
              disabled={!pdfReady || busy !== ""}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:text-gray-600 text-white text-xl font-bold py-5 px-6 rounded-2xl shadow-lg transition-colors"
            >
              {busy === "pdf" ? "PDF作成中…少々お待ちください" : `A4 ${sheet.value}面のPDFを保存する（表と裏は別のページ）`}
            </button>
            <p className={noteClass}>
              印刷するときは、倍率を「100%」または「実際のサイズ」にしてください（「用紙に合わせる」にすると、大きさが変わります）。1ページ目が表、2ページ目が裏のシートです。
            </p>
          </div>

          <div>
            <p className={labelClass}>コンビニのシール紙向けの画像（断裁線なしの全面画像）</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {PRINT_SIZES.map((s) =>
                (["front", "back"] as const).map((side) => (
                  <button
                    key={`${s.value}-${side}`}
                    type="button"
                    onClick={() => handlePng(s.value, side)}
                    disabled={!canOutput || busy !== ""}
                    className="border-2 border-green-600 text-green-700 hover:bg-green-50 bg-white disabled:border-gray-300 disabled:text-gray-500 disabled:bg-gray-50 text-base font-bold py-3 px-3 rounded-xl transition-colors"
                  >
                    {busy === `${s.value}-${side}` ? "作成中…" : `${s.label.replace(/（.*/, "")}の${side === "front" ? "表" : "裏"}`}
                  </button>
                )),
              )}
            </div>
            <p className={noteClass}>
              L判は89×127mm、2L判は127×178mmの縦長の画像（PNG）です。2026年10月に各社の公式ページで確認したところ、ローソンとファミリーマートのマルチコピー機にシール紙（L判・2L判）があり、セブン‐イレブンの案内にはシール紙の記載がありませんでした。料金・使えるファイル・アプリが必要かどうかは、店や時期で変わるため、印刷する前に各社の案内でご確認ください。シール紙は切り分けられていないことがあるため、はさみ等で切って使ってください。
            </p>
          </div>
        </Section>

        <div className="text-center mb-6">
          <button
            type="button"
            onClick={resetInputs}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-bold py-3 px-6 rounded-xl transition-colors"
          >
            入力をリセット
          </button>
          <p className="text-sm text-gray-500 mt-2">共用のパソコンでは、最後にリセットしてください。</p>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed text-center max-w-lg mx-auto mb-10 px-2">
          このサービスは、お米の袋に貼るラベルを作るための補助ツールです。表示の内容の正しさは、販売する方の責任です。最終的な確認は、県の食品表示の相談窓口などで行ってください。食品表示のしくみは
          <a href={CAA_ACT_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>消費者庁「食品表示法等」</a>
          でご確認いただけます。
        </p>
      </main>
    </div>
  );
}

// 見本の上に、赤い帯で「出力できません」と重ねる（見本だけ。出力の絵には描かない）
function markBlocked(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(0, 0, c.width, c.height);
  const h = c.height * 0.22;
  ctx.fillStyle = "rgba(185,28,28,0.92)";
  ctx.fillRect(0, (c.height - h) / 2, c.width, h);
  ctx.fillStyle = "#ffffff";
  const text = "使えない言葉があるため出力できません";
  ctx.font = `700 100px ${LABEL_FONTS.sans}`;
  const size = Math.min(h * 0.38, (100 * c.width * 0.9) / ctx.measureText(text).width);
  ctx.font = `700 ${size}px ${LABEL_FONTS.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2);
  ctx.restore();
}

function colorHex(value: string): string {
  return COLOR_OPTIONS.find((c) => c.value === value)?.hex ?? COLOR_OPTIONS[0].hex;
}

function toMm(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-10, Math.min(10, n)) : 0;
}
