// 「お米のラベルづくり」の入力項目・判定・ラベルに載せる中身の組み立て。
// 表示のルールは、食品表示基準（別表第24・別記様式4・第22条・第23条）と、
// 消費者庁「食品表示基準Q&A 別添 玄米及び精米に関する事項」（令和8年4月1日版）に合わせている。
// 条件つきの言葉は、農林水産省「特別栽培農産物に係る表示ガイドライン」と同Q&A、有機JASの案内による。

export { PREFECTURES } from "../kome-shin/komeShinData";

export const LAST_CHECKED = "2026年10月";
export const CAA_QA_URL =
  "https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/assets/food_labeling_cms201_260401_29.pdf";
export const CAA_ACT_URL = "https://www.caa.go.jp/policies/policy/food_labeling/food_labeling_act/";
export const EGOV_URL = "https://laws.e-gov.go.jp/law/427M60000002010";
export const MAFF_TOKUSAI_URL = "https://www.maff.go.jp/j/jas/jas_kikaku/tokusai_a.html";
export const MAFF_YUUKI_URL = "https://www.maff.go.jp/j/jas/jas_kikaku/yuuki.html";

// /kome-shin の下書き（販売者情報の読み込み元。読むだけで書き戻さない）
export const KOME_SHIN_KEY = "azemichi-kome-shin-v1";

export const STORAGE_KEY = "azemichi-kome-label-v1";
// ロゴ・写真は容量が大きいので、入力内容とは別の場所に保存する（入りきらなくても入力内容は守る）
export const IMAGE_STORAGE_KEY = "azemichi-kome-label-images-v1";

export const KIND_OPTIONS = [
  { value: "uruchi", label: "うるち精米（ふつうの白いお米・分づき米）" },
  { value: "mochi", label: "もち精米（もち米を精米したもの）" },
  { value: "haiga", label: "胚芽精米（胚芽が残った精米が重さで8割以上）" },
  { value: "genmai", label: "玄米（黒米・赤米などの古代米、お湯につけて芽を出させただけの発芽玄米を含む）" },
] as const;

export const EVIDENCE_OPTIONS = [
  { value: "kensa", label: "農産物検査の証明書を保管している" },
  { value: "shubyo", label: "種苗の購入記録と、作付けがわかる資料（営農日誌・営農計画書など）を保管している" },
  { value: "none", label: "どちらも保管していない" },
] as const;

export const BUNZUKI_OPTIONS = ["三分づき", "五分づき", "七分づき"] as const;
export const KODAIMAI_OPTIONS = ["黒米", "赤米", "紫黒米"] as const;

// よく作られている品種の例（入力の候補として出すだけ。登録品種かどうかの判定には使わない）
export const VARIETY_CANDIDATES = [
  "コシヒカリ", "ひとめぼれ", "ヒノヒカリ", "あきたこまち", "ななつぼし", "はえぬき", "まっしぐら",
  "キヌヒカリ", "ゆめぴりか", "きぬむすめ", "つや姫", "あさひの夢", "こしいぶき", "夢つくし",
  "森のくまさん", "にこまる", "元気つくし", "さがびより", "天のつぶ", "雪若丸", "青天の霹靂",
  "新之助", "銀河のしずく", "だて正夢", "いちほまれ", "富富富", "彩のかがやき", "きらら397",
  "ヒヨクモチ", "こがねもち", "ヒメノモチ", "朝紫", "おくのむらさき",
];

export const DESIGN_OPTIONS = [
  { value: "washi", label: "和紙のやさしさ", desc: "生成り色の和紙に明朝体。直売所や贈りものに。" },
  { value: "tanbo", label: "田んぼ風景", desc: "田んぼと稲穂の絵。ネット販売や定番の商品に。" },
  { value: "fude", label: "毛筆の力強さ", desc: "白地に黒の筆文字。白黒で印刷してもきれいです。" },
  { value: "photo", label: "写真を大きく", desc: "農園や田んぼの写真を大きく。顔の見える販売に。" },
] as const;
export type Design = (typeof DESIGN_OPTIONS)[number]["value"];

export const COLOR_OPTIONS = [
  { value: "wakakusa", label: "若草", hex: "#3f7d3a" },
  { value: "ai", label: "藍", hex: "#24456e" },
  { value: "shu", label: "朱", hex: "#b5452f" },
  { value: "yamabuki", label: "山吹", hex: "#a8780a" },
  { value: "cha", label: "茶", hex: "#7a5230" },
  { value: "sumi", label: "墨", hex: "#333333" },
] as const;

// A4のシール用紙。余白はメーカーの公式ページに記載がないため、用紙の中央にそろえて置く（ずれは微調整で直す）
export const SHEET_OPTIONS = [
  { value: "4", label: "A4 4面（1枚 148.5×105mm）", cols: 2, rows: 2, wMm: 148.5, hMm: 105, landscape: true },
  { value: "10", label: "A4 10面（1枚 86.4×50.8mm）", cols: 2, rows: 5, wMm: 86.4, hMm: 50.8, landscape: false },
  { value: "12", label: "A4 12面（1枚 86.4×42.3mm）", cols: 2, rows: 6, wMm: 86.4, hMm: 42.3, landscape: false },
] as const;
export type SheetOption = (typeof SHEET_OPTIONS)[number];

// コンビニのシール紙（写真のL判・2L判。縦向きの全面画像にする）
export const PRINT_SIZES = [
  { value: "L", label: "L判（89×127mm）", wMm: 89, hMm: 127 },
  { value: "2L", label: "2L判（127×178mm）", wMm: 127, hMm: 178 },
] as const;

// 入力欄はすべて文字列のまま持つ（空欄と0を区別し、入力途中の値も保存できるようにする）
const FIELD_KEYS = [
  // 1. 対象の確認
  "targetOk",
  // 2. お米の種類
  "kind", "seimaiName", "bunzuki", "bunzukiConfirm", "musenmai", "musenmaiConfirm", "kodaimai",
  // 3. 産地・品種・産年
  "evidence", "confirmMethod", "pref", "city", "variety", "year",
  // 4. 内容量・時期・販売者
  "amount", "unit", "date", "dateStyle", "era", "sellerRole", "sellerName", "sellerAddress", "sellerPhone",
  // 5. 表のデザイン面
  "bigText", "farmName", "catchCopy", "showOrigin", "showAmount", "shinmai", "design", "color",
  // 7. 出力
  "sheet", "offsetX", "offsetY",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];
export type Inputs = Record<FieldKey, string>;

const BLANK: Inputs = Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])) as Inputs;

export const EMPTY: Inputs = {
  ...BLANK,
  seimaiName: "精米",
  unit: "kg",
  dateStyle: "jun",
  era: "wa",
  sellerRole: "seller",
  bigText: "auto",
  showOrigin: "1",
  showAmount: "1",
  design: "washi",
  color: "wakakusa",
  sheet: "4",
  offsetX: "0",
  offsetY: "0",
};

// このモジュールの load/save はブラウザでのみ呼ばれる（page.tsx で ssr: false）
export function loadInputs(): Inputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const result: Inputs = { ...EMPTY };
    for (const k of FIELD_KEYS) {
      if (typeof parsed[k] === "string") result[k] = parsed[k];
    }
    return result;
  } catch {
    return EMPTY;
  }
}

export function saveInputs(inputs: Inputs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // 保存できなくても画面の入力は続けられる
  }
}

export type LabelImages = { logo: string; photo: string };

export function loadImages(): LabelImages {
  try {
    const raw = localStorage.getItem(IMAGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      logo: typeof parsed?.logo === "string" ? parsed.logo : "",
      photo: typeof parsed?.photo === "string" ? parsed.photo : "",
    };
  } catch {
    return { logo: "", photo: "" };
  }
}

// 入りきらない（容量超過）ときは false を返す。画像は画面の中では使い続けられる。
export function saveImages(images: LabelImages): boolean {
  try {
    if (!images.logo && !images.photo) localStorage.removeItem(IMAGE_STORAGE_KEY);
    else localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    return true;
  } catch {
    return false;
  }
}

// ---- /kome-shin の下書きから販売者情報を読む（コピーするだけ。書き戻さない） ----

export type SellerDraft = { name: string; address: string; phone: string };

export function readKomeShinSeller(): SellerDraft | null {
  try {
    const raw = localStorage.getItem(KOME_SHIN_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    const s = (k: string) => (typeof d[k] === "string" ? d[k].trim() : "");
    const same = s("contactSame") === "1";
    const address = same
      ? `${s("officePref")}${s("officeCity")}${s("officeRest")}`
      : `${s("contactPref")}${s("contactCity")}${s("contactRest")}`;
    const draft = { name: s("tradeName") || s("repName"), address, phone: s("contactPhone") };
    return draft.name || draft.address || draft.phone ? draft : null;
  } catch {
    return null;
  }
}

// ---- 値の組み立て ----

export function hasEvidence(i: Inputs): boolean {
  return i.evidence === "kensa" || i.evidence === "shubyo";
}

export function isGenmai(i: Inputs): boolean {
  return i.kind === "genmai";
}

// 一括表示の「名称」
export function kindName(i: Inputs): string {
  if (i.kind === "genmai") return "玄米";
  if (i.kind === "mochi") return "もち精米";
  if (i.kind === "haiga") return "胚芽精米";
  if (i.kind === "uruchi") return i.seimaiName === "うるち精米" ? "うるち精米" : "精米";
  return "";
}

export function dateItemLabel(i: Inputs): string {
  return isGenmai(i) ? "調製時期" : "精米時期";
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function reiwa(year: number): string {
  const r = year - 2018;
  return r === 1 ? "元" : String(r);
}

export function yearText(year: string, era: string): string {
  const y = Number(year);
  if (!/^\d{4}$/.test(year)) return "";
  return era === "sei" ? `${y}年産` : `令和${reiwa(y)}年産`;
}

function parseDate(date: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

// 旬：1〜10日は上旬、11〜20日は中旬、21日〜末日は下旬（消費者庁Q&A 玄米精米－８）
function junOf(day: number): string {
  if (day <= 10) return "上旬";
  if (day <= 20) return "中旬";
  return "下旬";
}

// 精米時期・調製時期の書き方（消費者庁Q&A 玄米精米－７・８で望ましいとされる書き方）
export function dateText(i: Inputs): string {
  const p = parseDate(i.date);
  if (!p) return "";
  const jun = i.dateStyle === "jun";
  if (i.era === "sei") return jun ? `${p.y}.${pad2(p.m)}.${junOf(p.d)}` : `${p.y}.${pad2(p.m)}.${pad2(p.d)}`;
  return jun ? `令和${reiwa(p.y)}年${p.m}月${junOf(p.d)}` : `令和${reiwa(p.y)}年${p.m}月${p.d}日`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// 内容量を整数のグラムにする（小数の計算はしない）。kg は小数点以下3けたまで。
export function parseGrams(amount: string, unit: string): { grams: number | null; error?: string } {
  const t = amount.trim().replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (!t) return { grams: null };
  if (unit === "g") {
    if (!/^\d+$/.test(t)) return { grams: null, error: "グラムは整数で入力してください（例：500）" };
    const g = Number(t);
    return g > 0 ? { grams: g } : { grams: null, error: "0より大きい数を入力してください" };
  }
  const m = /^(\d+)(?:\.(\d{1,3}))?$/.exec(t);
  if (!m) return { grams: null, error: "数字で入力してください（例：5 や 1.5）" };
  const g = Number(m[1]) * 1000 + Number((m[2] ?? "").padEnd(3, "0") || "0");
  return g > 0 ? { grams: g } : { grams: null, error: "0より大きい数を入力してください" };
}

export function amountText(i: Inputs): string {
  const { grams } = parseGrams(i.amount, i.unit);
  if (grams === null) return "";
  if (i.unit === "g") return `${grams}g`;
  const kg = Math.floor(grams / 1000);
  const rest = grams % 1000;
  return rest === 0 ? `${kg}kg` : `${kg}.${String(rest).padStart(3, "0").replace(/0+$/, "")}kg`;
}

// 文字の大きさの下限（ポイント）。内容量3kg以下は8ポイント、それより大きい袋は12ポイント（第22条第1項第9号）。
// 表示面積が小さい場合の5.5ポイントの例外は使わない。
export function minPointFor(grams: number | null): number {
  return grams !== null && grams <= 3000 ? 8 : 12;
}

export function originText(i: Inputs): string {
  return `${i.pref}${i.city.trim()}`;
}

export function confirmMethodText(i: Inputs): string {
  if (i.confirmMethod === "kensa" && i.evidence === "kensa") return "農産物検査証明による";
  if (i.confirmMethod === "shubyo" && i.evidence === "shubyo") return "種子の購入記録及び生産記録による確認";
  return "";
}

export function sellerRoleLabel(i: Inputs): string {
  return i.sellerRole === "factory" && !isGenmai(i) ? "精米工場" : "販売者";
}

// 裏（一括表示）に載せる中身
export type BackModel = {
  name: string;
  single: boolean;
  origin: string;
  variety: string;
  year: string;
  method: string;
  amount: string;
  dateLabel: string;
  date: string;
  roleLabel: string;
  sellerName: string;
  sellerAddress: string;
  sellerPhone: string;
  // 一括表示の枠の外に書く任意の表示（無洗米・分づき・古代米）
  extras: string[];
};

export function optionalNotes(i: Inputs): string[] {
  const notes: string[] = [];
  if (isGenmai(i) && i.kodaimai) notes.push(i.kodaimai);
  if (!isGenmai(i) && i.kind === "uruchi" && i.bunzuki && i.bunzukiConfirm === "1") notes.push(`${i.bunzuki}米`);
  if (!isGenmai(i) && i.musenmai === "1" && i.musenmaiConfirm === "1") notes.push("無洗米");
  return notes;
}

export function buildBack(i: Inputs): BackModel {
  const single = hasEvidence(i);
  return {
    name: kindName(i),
    single,
    origin: single ? originText(i) : "国内産",
    variety: single ? i.variety.trim() : "",
    year: single ? yearText(i.year, i.era) : "",
    method: single ? confirmMethodText(i) : "",
    amount: amountText(i),
    dateLabel: dateItemLabel(i),
    date: dateText(i),
    roleLabel: sellerRoleLabel(i),
    sellerName: i.sellerName.trim(),
    sellerAddress: i.sellerAddress.trim(),
    sellerPhone: i.sellerPhone.trim(),
    extras: optionalNotes(i),
  };
}

// 表（デザイン面）に載せる中身
export type FrontModel = {
  big: string;
  originLine: string;
  kindLine: string;
  badges: string[];
  farm: string;
  catchCopy: string;
};

export function bigTextChoices(i: Inputs): { value: string; label: string }[] {
  const list: { value: string; label: string }[] = [{ value: "auto", label: "おまかせ" }];
  if (hasEvidence(i)) list.push({ value: "variety", label: "品種名" });
  list.push({ value: "farm", label: "農園名" }, { value: "kind", label: "「お米」などの言葉" });
  return list;
}

function kindWord(i: Inputs): string {
  if (i.kind === "genmai") return i.kodaimai || "玄米";
  if (i.kind === "mochi") return "もち米";
  return "お米";
}

// 品種名の大きな文字。根拠資料がないときは品種名を出さず、農園名や「お米」などに切り替える。
export function resolveBigText(i: Inputs): string {
  const variety = hasEvidence(i) ? i.variety.trim() : "";
  const farm = i.farmName.trim();
  const choice = i.bigText === "variety" && !variety ? "auto" : i.bigText;
  if (choice === "variety") return variety;
  if (choice === "farm" && farm) return farm;
  if (choice === "kind") return kindWord(i);
  return variety || farm || kindWord(i);
}

export function buildFront(i: Inputs, shinmaiOk: boolean): FrontModel {
  const single = hasEvidence(i);
  const parts: string[] = [];
  if (single && i.showOrigin === "1" && i.pref) parts.push(`${originText(i)}産`);
  if (single && i.year) parts.push(yearText(i.year, i.era));
  const big = resolveBigText(i);
  const kindParts = [kindName(i)];
  if (i.showAmount === "1" && amountText(i)) kindParts.push(amountText(i));
  const badges: string[] = [];
  if (shinmaiOk && i.shinmai === "1") badges.push("新米");
  badges.push(...optionalNotes(i));
  return {
    big,
    originLine: parts.join("　"),
    kindLine: kindParts.filter(Boolean).join("　"),
    badges,
    // 大きな文字が農園名のときは、下に同じ名前を重ねて出さない
    farm: big === i.farmName.trim() ? "" : i.farmName.trim(),
    catchCopy: i.catchCopy.trim(),
  };
}

// ---- 条件つきの言葉のチェック ----

export type Issue = {
  id: string;
  level: "block" | "warn";
  title: string;
  message: string;
  link?: { href: string; label: string };
};

// 全角英数字→半角、カタカナ→ひらがな、空白除去（言い換えの一部を拾うため）
function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/\s/g, "")
    .toLowerCase();
}

// ラベルに載る自由入力の文字（販売者の正式な名称・住所は対象にしない）
function freeTexts(i: Inputs): string {
  return normalize([i.farmName, i.catchCopy, hasEvidence(i) ? i.variety : "", i.city].join(" "));
}

// 新米：産年の12月31日までに、玄米は袋詰め、精米は精米して袋詰めしたものだけ（第23条第2項第1号）
export type ShinmaiJudge = { ok: boolean; reason: string };

export function judgeShinmai(i: Inputs): ShinmaiJudge {
  const item = dateItemLabel(i);
  if (!hasEvidence(i)) {
    return { ok: false, reason: "根拠資料がない場合は産年を表示しないため、このツールでは「新米」を使えません。" };
  }
  if (!/^\d{4}$/.test(i.year) || !parseDate(i.date)) {
    return { ok: false, reason: `産年と${item}を入れると、「新米」を使えるか自動で判定します。` };
  }
  const limit = `${i.year}-12-31`;
  if (i.date > limit) {
    return {
      ok: false,
      reason: `${item}が産年（${yearText(i.year, i.era)}）の12月31日を過ぎているため、「新米」は使えません。`,
    };
  }
  return {
    ok: true,
    reason: `${item}が産年の12月31日までなので、「新米」を使えます。袋詰めも${i.year}年12月31日までに行ってください。`,
  };
}

const PESTICIDE_WORDS = /無農薬|減農薬|無化学肥料|減化学肥料|むのうやく|げんのうやく|無農藥|減農藥/;

export function checkWords(i: Inputs): Issue[] {
  const t = freeTexts(i);
  const issues: Issue[] = [];

  if (PESTICIDE_WORDS.test(t)) {
    issues.push({
      id: "pesticide",
      level: "block",
      title: "「無農薬」「減農薬」「無化学肥料」「減化学肥料」は使えません",
      message:
        "農林水産省の「特別栽培農産物に係る表示ガイドライン」で、表示してはいけない言葉とされています（「残留農薬が全くない」と誤解されやすいため）。農薬を使わなかったことを伝えるときは、ガイドラインの決まった書き方（「農薬：栽培期間中不使用」「節減対象農薬：当地比○割減」など）と、そのための表示が必要です。このツールではその表示は作れません。",
      link: { href: MAFF_TOKUSAI_URL, label: "農林水産省：特別栽培農産物に係る表示ガイドライン" },
    });
  }

  if (/特別栽培|特栽/.test(t)) {
    issues.push({
      id: "tokusai",
      level: "block",
      title: "「特別栽培」は、このツールでは扱えません",
      message:
        "特別栽培米と表示するには、農薬の使用回数と化学肥料の窒素成分量を地域のふつうのやり方の5割以下にしたうえで、栽培責任者・確認責任者などを書いた専用の表示が必要です。このツールではその表示を作れないため、「特別栽培」の言葉を入れたままでは出力できません。",
      link: { href: MAFF_TOKUSAI_URL, label: "農林水産省：特別栽培農産物に係る表示ガイドライン" },
    });
  }

  if (/有機|おーがにっく|organic/.test(t)) {
    issues.push({
      id: "yuuki",
      level: "block",
      title: "「有機」「オーガニック」は使えません",
      message: "有機JASの認証を受けた事業者だけが表示できます。このツールでは扱えません。",
      link: { href: MAFF_YUUKI_URL, label: "農林水産省：有機JAS認証について" },
    });
  }

  if (/[一二三123]等米|一等(?!賞|地)/.test(t)) {
    if (i.evidence === "kensa" && i.confirmMethod === "kensa") {
      issues.push({
        id: "tokyu",
        level: "warn",
        title: "等級（一等米など）は、農産物検査の証明書のとおりに書いてください",
        message: "段階3で確認方法を「農産物検査証明による」にしているため使えます。証明書に書かれた等級と違う書き方はしないでください。",
      });
    } else {
      issues.push({
        id: "tokyu",
        level: "block",
        title: "「一等米」などの等級は、いまの設定では使えません",
        message:
          "等級は、農産物検査で決まるものです。このツールでは、段階3で根拠資料を「農産物検査の証明書」にし、確認方法を「農産物検査証明による」にしたときだけ、等級の言葉を使えるようにしています。",
      });
    }
  }

  const shinmaiWanted = i.shinmai === "1" || /新米/.test(t);
  if (shinmaiWanted) {
    const j = judgeShinmai(i);
    issues.push({
      id: "shinmai",
      level: j.ok ? "warn" : "block",
      title: j.ok ? "「新米」を使えます" : "「新米」は使えません",
      message: j.reason,
    });
  }

  if (/無洗米|むせんまい/.test(t) && !(i.musenmai === "1" && i.musenmaiConfirm === "1")) {
    issues.push({
      id: "musenmai-word",
      level: "block",
      title: "「無洗米」と書くには、段階2の確認が必要です",
      message: "段階2で「無洗米」を選び、事実を確認できることにチェックを入れてください。",
    });
  }

  if (/[一二三四五六七八九十1-9]分(づき|つき|搗)/.test(t) && !(i.bunzuki && i.bunzukiConfirm === "1")) {
    issues.push({
      id: "bunzuki-word",
      level: "block",
      title: "「○分づき」と書くには、段階2の確認が必要です",
      message: "段階2で分づきの度合いを選び、事実を確認できることにチェックを入れてください。",
    });
  }

  if (/日本一|世界一|最高|最上|no\.?1|なんばーわん|一番/.test(t)) {
    issues.push({
      id: "superlative",
      level: "warn",
      title: "「日本一」「最高」などの言葉に注意してください",
      message:
        "実際より著しく優れていると思わせる言葉は、表示してはいけないとされています（食品表示基準 第23条）。根拠を説明できる場合だけにしてください。",
    });
  }

  return issues;
}

// 任意の項目（分づき・無洗米）を選んだのに、事実の確認にチェックがないとき
export function checkOptional(i: Inputs): Issue[] {
  const issues: Issue[] = [];
  if (i.kind === "uruchi" && i.bunzuki && i.bunzukiConfirm !== "1") {
    issues.push({
      id: "bunzuki-confirm",
      level: "block",
      title: "分づきの度合いの確認が必要です",
      message: "段階2で、分づきの度合いを事実として確認できることにチェックを入れてください。書かない場合は「書かない」を選んでください。",
    });
  }
  if (!isGenmai(i) && i.musenmai === "1" && i.musenmaiConfirm !== "1") {
    issues.push({
      id: "musenmai-confirm",
      level: "block",
      title: "無洗米の確認が必要です",
      message: "段階2で、無洗米であることを事実として確認できることにチェックを入れてください。",
    });
  }
  return issues;
}

// まだ入力されていない必須の項目
export function missingItems(i: Inputs): string[] {
  const m: string[] = [];
  if (i.targetOk !== "yes") m.push("段階1：対象の確認");
  if (!i.kind) m.push("段階2：お米の種類");
  if (!i.evidence) m.push("段階3：根拠資料の保管");
  if (hasEvidence(i)) {
    if (!i.pref) m.push("段階3：産地（都道府県）");
    if (!i.variety.trim()) m.push("段階3：品種");
    if (!/^\d{4}$/.test(i.year)) m.push("段階3：産年（収穫した年）");
  }
  if (parseGrams(i.amount, i.unit).grams === null) m.push("段階4：内容量");
  if (!parseDate(i.date)) m.push(`段階4：${dateItemLabel(i)}`);
  if (!i.sellerName.trim()) m.push("段階4：販売者の氏名又は名称");
  if (!i.sellerAddress.trim()) m.push("段階4：住所");
  if (!i.sellerPhone.trim()) m.push("段階4：電話番号");
  return m;
}
