// 「認定農業者の申請書づくり」の入力項目・計算・保存。
// 項目・行数・並び順は、農林水産省が配っている「農業経営改善計画」（Excel、告示第1419号の様式）の
// 本体・別紙１に合わせている。記入の説明は「農業経営改善計画認定申請書の記載方法」（令和５年６月 Ver.1.3）による。
// 別紙２・３（農業用施設の整備・農地法の特例）は対象外。

export { PREFECTURES } from "../kome-shin/komeShinData";

export const LAST_CHECKED = "2026年10月";
export const MAFF_URL = "https://www.maff.go.jp/j/kobetu_ninaite/n_seido/seido_ninaite.html";
export const KISAI_URL = "https://www.maff.go.jp/j/kobetu_ninaite/n_seido/attach/pdf/seido_ninaite-10.pdf";
export const SHOTOKU_URL = "https://www.maff.go.jp/j/kobetu_ninaite/n_seido/attach/pdf/seido_ninaite-11.pdf";
export const YOUKOU_URL = "https://www.maff.go.jp/j/kobetu_ninaite/n_seido/pdf/seido_nintei_130.pdf";
export const BCP_URL = "https://www.maff.go.jp/j/keiei/maff_bcp.html";
export const KENSHU_URL = "https://agri-educ.maff.go.jp/keiei/";

// 国のExcelの行数（本体：耕種3行・畜産3行・関連事業4行・農用地6行・施設6行・構成員4行、別紙１：20行）
export const CROP_ROWS = 3;
export const LIVESTOCK_ROWS = 3;
export const RELATED_ROWS = 4;
export const LAND_ROWS = 6;
export const FACILITY_ROWS = 6;
export const MEMBER_ROWS = 4;
export const MACHINE_ROWS = 20;
// 農用地は「所有地」「借入地」「その他」を2行ずつ
export const LAND_KUBUN = ["所有地", "所有地", "借入地", "借入地", "その他", "その他"] as const;

export const ADDRESSEE_OPTIONS = [
  { value: "city", label: "市町村長", formal: "○○市町村長　殿", hint: "1つの市町村の中だけで農業をしている場合", placeholder: "例：豊後大野市長" },
  { value: "pref", label: "都道府県知事", formal: "○○都道府県知事　殿", hint: "同じ都道府県の2つ以上の市町村で農業をしている場合", placeholder: "例：大分県知事" },
  { value: "bureau", label: "農政局長", formal: "○○農政局長　殿", hint: "同じ農政局の区域の2つ以上の都道府県で農業をしている場合", placeholder: "例：九州農政局長" },
  { value: "minister", label: "農林水産大臣", formal: "農林水産大臣　殿", hint: "2つ以上の農政局の区域で農業をしている場合", placeholder: "農林水産大臣" },
] as const;

export const ENTITY_OPTIONS = [
  { value: "individual", label: "個人（夫婦・親子などの共同申請を含む）" },
  { value: "corp", label: "法人" },
];

// 営農類型（様式のチェック欄の並び順・文言）
export const CROP_TYPES = ["稲作", "麦類作", "雑穀・いも類・豆類", "工芸農作物", "露地野菜", "施設野菜", "果樹類", "花き・花木", "その他の作物"] as const;
export const LIVESTOCK_TYPES = ["酪農", "肉用牛", "養豚", "養鶏", "養蚕", "その他の畜産"] as const;
export const COMPLEX_TYPE = "複合経営";
export const OTHER_CROP = "その他の作物";
export const OTHER_LIVESTOCK = "その他の畜産";

// 地目は現況の地目（田、畑、樹園地、採草放牧地から選択）
export const CHIMOKU_OPTIONS = ["田", "畑", "樹園地", "採草放牧地"] as const;

export type Applicant = { name: string; kana: string; birth: string };
export type CropRow = { name: string; areaCur: string; qtyCur: string; areaGoal: string; qtyGoal: string };
export type LivestockRow = { name: string; headsCur: string; qtyCur: string; headsGoal: string; qtyGoal: string };
export type RelatedRow = { content: string; salesCur: string; salesGoal: string };
export type LandRow = { pref: string; city: string; chimoku: string; areaCur: string; areaGoal: string };
export type FacilityRow = { kind: string; pref: string; city: string; bldCur: string; sqmCur: string; bldGoal: string; sqmGoal: string };
export type MemberRow = {
  name: string; age: string; sex: string; relation: string;
  dutyCur: string; mainCur: string; hoursCur: string;
  dutyGoal: string; mainGoal: string; hoursGoal: string;
};
export type MachineRow = { name: string; qty: string };

export const MAX_APPLICANTS = 4;

export type Inputs = {
  // 段階1
  addresseeType: string;
  addresseeName: string;
  applyDate: string;
  entityType: string;
  applicants: Applicant[];
  address: string;
  phone: string;
  corpNumber: string;
  repName: string;
  repKana: string;
  // 段階2
  targetYear: string;
  typeCur: string;
  typeCurOther: string;
  typeGoal: string;
  typeGoalOther: string;
  incomeCur: string; // 円
  incomeGoal: string; // 円
  people: string;
  hoursCur: string;
  hoursGoal: string;
  revCur: string; // 補助計算（収入金額・円）
  expCur: string; // 補助計算（経費・円）
  revGoal: string;
  expGoal: string;
  // 段階3
  crops: CropRow[];
  livestock: LivestockRow[];
  related: RelatedRow[]; // 売上は円
  lands: LandRow[];
  facilities: FacilityRow[];
  // 段階4
  members: MemberRow[];
  empRegularCur: string;
  empRegularGoal: string;
  empTempCur: string;
  empTempGoal: string;
  empTempDaysCur: string;
  empTempDaysGoal: string;
  // 段階5
  plan3: string;
  plan4: string;
  plan5: string;
  plan6: string;
  machines: MachineRow[];
  // 段階6（提出前のチェックで確かめた項目のid）
  checks: string[];
};

const blankCrop = (): CropRow => ({ name: "", areaCur: "", qtyCur: "", areaGoal: "", qtyGoal: "" });
const blankLivestock = (): LivestockRow => ({ name: "", headsCur: "", qtyCur: "", headsGoal: "", qtyGoal: "" });
const blankRelated = (): RelatedRow => ({ content: "", salesCur: "", salesGoal: "" });
const blankLand = (): LandRow => ({ pref: "", city: "", chimoku: "", areaCur: "", areaGoal: "" });
const blankFacility = (): FacilityRow => ({ kind: "", pref: "", city: "", bldCur: "", sqmCur: "", bldGoal: "", sqmGoal: "" });
const blankMember = (): MemberRow => ({
  name: "", age: "", sex: "", relation: "",
  dutyCur: "", mainCur: "", hoursCur: "",
  dutyGoal: "", mainGoal: "", hoursGoal: "",
});
const blankMachine = (): MachineRow => ({ name: "", qty: "" });
export const blankApplicant = (): Applicant => ({ name: "", kana: "", birth: "" });

function rows<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make);
}

export function makeEmpty(): Inputs {
  return {
    addresseeType: "", addresseeName: "", applyDate: "", entityType: "",
    applicants: [blankApplicant()],
    address: "", phone: "", corpNumber: "", repName: "", repKana: "",
    targetYear: "", typeCur: "", typeCurOther: "", typeGoal: "", typeGoalOther: "",
    incomeCur: "", incomeGoal: "", people: "", hoursCur: "", hoursGoal: "",
    revCur: "", expCur: "", revGoal: "", expGoal: "",
    crops: rows(CROP_ROWS, blankCrop),
    livestock: rows(LIVESTOCK_ROWS, blankLivestock),
    related: rows(RELATED_ROWS, blankRelated),
    lands: rows(LAND_ROWS, blankLand),
    facilities: rows(FACILITY_ROWS, blankFacility),
    members: rows(MEMBER_ROWS, blankMember),
    empRegularCur: "", empRegularGoal: "", empTempCur: "", empTempGoal: "", empTempDaysCur: "", empTempDaysGoal: "",
    plan3: "", plan4: "", plan5: "", plan6: "",
    machines: rows(MACHINE_ROWS, blankMachine),
    checks: [],
  };
}

export const STORAGE_KEY = "azemichi-nintei-v1";

// 保存データの形を確かめながら読み込む（壊れた値・古い形は初期値で埋める）
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readRows<T extends Record<string, string>>(v: unknown, n: number, make: () => T): T[] {
  const src = Array.isArray(v) ? v : [];
  return Array.from({ length: n }, (_, k) => {
    const base = make();
    const item = src[k];
    if (item && typeof item === "object") {
      for (const key of Object.keys(base) as (keyof T)[]) {
        base[key] = str((item as Record<string, unknown>)[key as string]) as T[keyof T];
      }
    }
    return base;
  });
}

// このモジュールの load/save はブラウザでのみ呼ばれる（page.tsx で ssr: false）
export function loadInputs(): Inputs {
  const empty = makeEmpty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return empty;
    const result = { ...empty };
    for (const key of Object.keys(empty) as (keyof Inputs)[]) {
      if (typeof empty[key] === "string") (result as Record<string, unknown>)[key] = str(p[key]);
    }
    const applicantCount = Array.isArray(p.applicants) ? Math.min(Math.max(p.applicants.length, 1), MAX_APPLICANTS) : 1;
    result.applicants = readRows(p.applicants, applicantCount, blankApplicant);
    result.crops = readRows(p.crops, CROP_ROWS, blankCrop);
    result.livestock = readRows(p.livestock, LIVESTOCK_ROWS, blankLivestock);
    result.related = readRows(p.related, RELATED_ROWS, blankRelated);
    result.lands = readRows(p.lands, LAND_ROWS, blankLand);
    result.facilities = readRows(p.facilities, FACILITY_ROWS, blankFacility);
    result.members = readRows(p.members, MEMBER_ROWS, blankMember);
    result.machines = readRows(p.machines, MACHINE_ROWS, blankMachine);
    result.checks = Array.isArray(p.checks) ? p.checks.filter((c: unknown): c is string => typeof c === "string") : [];
    return result;
  } catch {
    return empty;
  }
}

export function saveInputs(inputs: Inputs) {
  try {
    // 最初の状態のままなら保存内容も残さない（リセット後に空のデータが残らないようにする）
    if (JSON.stringify(inputs) === JSON.stringify(makeEmpty())) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  } catch {
    // 容量超過等は静かに無視する（保存されないだけで、入力は妨げない）
  }
}

// ---- 数値の読み取り ----
// value=null は空欄、error があれば入力が正しくない
export type Parsed = { value: number | null; error?: string };

function normalizeNumber(v: string): string {
  // 全角数字・カンマ・空白を受け付ける
  return v
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[，,\s]/g, "")
    .replace(/[－−ー]/g, "-")
    .replace(/．/g, ".");
}

// 金額（円の整数）。所得はマイナス（赤字）もありうる
export function parseYen(v: string, allowNegative = false): Parsed {
  const s = normalizeNumber(v);
  if (s === "") return { value: null };
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return { value: null, error: "円単位の整数で入力してください（例：9979000）" };
  if (n < 0 && !allowNegative) return { value: null, error: "0以上の数字で入力してください" };
  return { value: n };
}

// 人数・時間・棟数・頭数（0以上の整数）
export function parseCount(v: string): Parsed {
  const s = normalizeNumber(v);
  if (s === "") return { value: null };
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < 0) return { value: null, error: "0以上の整数で入力してください" };
  return { value: n };
}

// 面積（a・㎡。0以上、小数可）
export function parseArea(v: string): Parsed {
  const s = normalizeNumber(v);
  if (s === "") return { value: null };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: "0以上の数字で入力してください" };
  return { value: n };
}

// 円 → 万円（万円未満は切り捨て。マイナスのときも0に近い方へ切り捨てる）
export function yenToMan(yen: number): number {
  return Math.trunc(yen / 10000);
}

export function formatMan(yen: number | null): string {
  return yen === null ? "" : yenToMan(yen).toLocaleString("ja-JP");
}

export function formatYen(yen: number): string {
  return yen.toLocaleString("ja-JP");
}

// 1人あたり（円の整数。円未満は切り捨て）
export function perPersonYen(totalYen: number | null, people: number | null): number | null {
  if (totalYen === null || !people) return null;
  return Math.trunc(totalYen / people);
}

// 1人あたりの年間労働時間（1時間未満は切り捨て）
export function perPersonHours(hours: number | null, people: number | null): number | null {
  if (hours === null || !people) return null;
  return Math.trunc(hours / people);
}

// 個人の所得の補助計算：収入金額 − 経費（農林水産省「農業経営改善計画の所得水準の算出方法（例）」）
export function incomeFromHelper(rev: string, exp: string): number | null {
  const r = parseYen(rev);
  const e = parseYen(exp);
  if (r.value === null || e.value === null) return null;
  return r.value - e.value;
}

// 面積の合計（小数第2位までで丸めて、浮動小数点の誤差を消す）
export function sumArea(values: string[]): number | null {
  let total = 0;
  let any = false;
  for (const v of values) {
    const p = parseArea(v);
    if (p.value !== null) {
      total += p.value;
      any = true;
    }
  }
  return any ? Math.round(total * 100) / 100 : null;
}

export function sumCount(values: string[]): number | null {
  let total = 0;
  let any = false;
  for (const v of values) {
    const p = parseCount(v);
    if (p.value !== null) {
      total += p.value;
      any = true;
    }
  }
  return any ? total : null;
}

// 時間・人数などの整数を、カンマ区切りにする（例：3600 → 3,600）。読み取れない値はそのまま返す
export function formatCountText(v: string): string {
  const p = parseCount(v);
  return p.value === null ? v.trim() : p.value.toLocaleString("ja-JP");
}

export function formatArea(n: number | null): string {
  return n === null ? "" : n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

// 「一緒に働く人」で主たる従事者に○をつけた人数（現状）
export function countMainMembers(members: MemberRow[]): number {
  return members.filter((m) => m.mainCur === "1").length;
}

export type Totals = {
  incomeCur: number | null;
  incomeGoal: number | null;
  people: number | null;
  perIncomeCur: number | null;
  perIncomeGoal: number | null;
  perHoursCur: number | null;
  perHoursGoal: number | null;
  landCur: number | null;
  landGoal: number | null;
  bldCur: number | null;
  bldGoal: number | null;
  sqmCur: number | null;
  sqmGoal: number | null;
};

export function computeTotals(i: Inputs): Totals {
  const incomeCur = parseYen(i.incomeCur, true).value;
  const incomeGoal = parseYen(i.incomeGoal, true).value;
  const people = parseCount(i.people).value;
  return {
    incomeCur,
    incomeGoal,
    people,
    perIncomeCur: perPersonYen(incomeCur, people),
    perIncomeGoal: perPersonYen(incomeGoal, people),
    perHoursCur: perPersonHours(parseCount(i.hoursCur).value, people),
    perHoursGoal: perPersonHours(parseCount(i.hoursGoal).value, people),
    landCur: sumArea(i.lands.map((r) => r.areaCur)),
    landGoal: sumArea(i.lands.map((r) => r.areaGoal)),
    bldCur: sumCount(i.facilities.map((r) => r.bldCur)),
    bldGoal: sumCount(i.facilities.map((r) => r.bldGoal)),
    sqmCur: sumArea(i.facilities.map((r) => r.sqmCur)),
    sqmGoal: sumArea(i.facilities.map((r) => r.sqmGoal)),
  };
}

// ---- 日付 ----
export function toWareki(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ymd = y * 10000 + mo * 100 + d;
  let era: string;
  let eraYear: number;
  if (ymd >= 20190501) { era = "令和"; eraYear = y - 2018; }
  else if (ymd >= 19890108) { era = "平成"; eraYear = y - 1988; }
  else if (ymd >= 19261225) { era = "昭和"; eraYear = y - 1925; }
  else { era = "大正"; eraYear = y - 1911; }
  return `${era}${eraYear === 1 ? "元" : eraYear}年${mo}月${d}日`;
}

// ---- 入力されていない必須項目 ----
export type Missing = { step: string; label: string };

export function findMissing(i: Inputs): Missing[] {
  const list: Missing[] = [];
  const need = (step: string, label: string, ok: boolean) => {
    if (!ok) list.push({ step, label });
  };
  const isCorp = i.entityType === "corp";
  const filled = (v: string) => v.trim() !== "";

  need("1", "提出先", filled(i.addresseeType));
  need("1", "提出先の名前（例：○○市長）", filled(i.addresseeName));
  need("1", "個人か法人か", filled(i.entityType));
  const people = isCorp ? i.applicants.slice(0, 1) : i.applicants;
  people.forEach((a, k) => {
    const who = people.length > 1 ? `（${k + 1}人目）` : "";
    need("1", `${isCorp ? "法人名" : "氏名"}${who}`, filled(a.name));
    need("1", `フリガナ${who}`, filled(a.kana));
    need("1", `${isCorp ? "法人設立年月日" : "生年月日"}${who}`, filled(a.birth));
  });
  need("1", "住所", filled(i.address));
  need("1", "連絡先", filled(i.phone));
  if (isCorp) {
    need("1", "法人番号", filled(i.corpNumber));
    need("1", "代表者の氏名", filled(i.repName));
  }

  need("2", "目標の年", filled(i.targetYear));
  need("2", "営農類型（現状）", filled(i.typeCur));
  need("2", "営農類型（目標）", filled(i.typeGoal));
  need("2", "年間所得（現状）", parseYen(i.incomeCur, true).value !== null);
  need("2", "年間所得（目標）", parseYen(i.incomeGoal, true).value !== null);
  need("2", "主たる従事者の人数", !!parseCount(i.people).value);
  need("2", "年間労働時間（現状）", parseCount(i.hoursCur).value !== null);
  need("2", "年間労働時間（目標）", parseCount(i.hoursGoal).value !== null);

  need("3", "作物または家畜（1つ以上）", i.crops.some((r) => filled(r.name)) || i.livestock.some((r) => filled(r.name)));
  need("3", "農用地（1行以上）", i.lands.some((r) => filled(r.areaCur) || filled(r.areaGoal)));

  need("4", "代表者の氏名（一緒に働く人の1行目）", filled(i.members[0]?.name ?? ""));

  need("5", "生産方式の合理化", filled(i.plan3));
  need("5", "経営管理の合理化", filled(i.plan4));
  need("5", "農業従事の態様の改善", filled(i.plan5));

  return list;
}

// ---- 段階5：書き方のヒントと見本 ----
// ヒントと例示の項目は、国の「記載方法」の文言による。見本の文章はあぜみち作成（国の例文ではない）。
export type PlanGuide = {
  key: "plan3" | "plan4" | "plan5" | "plan6";
  no: string;
  title: string; // 画面の表示名
  formal: string; // 国の様式の項目名
  required: boolean;
  hint: string[];
  examples: string[]; // 国の資料の例示（見出し）
  sample: string; // あぜみち作成の見本
};

export const PLAN_GUIDES: PlanGuide[] = [
  {
    key: "plan3",
    no: "③",
    title: "作り方の改善",
    formal: "③生産方式の合理化に関する現状と目標・措置",
    required: true,
    hint: [
      "農用地の利用条件（ほ場の区画の大きさ、団地化）、作目・部門別合理化の方向その他の生産方式の合理化について、現状、目標及びその達成のための措置を記載して下さい。（複数記載可）",
      "目標を達成するために農業用機械等を取得する場合は、別紙に取得する予定の資産を記載してください（下の「買う予定の機械など」）。",
    ],
    examples: [
      "農地の集積・集約化",
      "農業生産工程管理（ＧＡＰ）の導入",
      "生産の効率化・高度化スマート農業の推進",
      "栽培・飼養に係る新技術の導入",
      "自給飼料の生産・利用の拡大",
      "持続性の高い農業生産方式",
      "省エネ技術を利用した生産管理の推進",
      "有機農業の推進",
      "その他合理化の方向",
    ],
    sample:
      "【農地の集積・集約化】\n現状：水田○○a（○か所に分かれている）\n目標：水田○○a（○か所にまとめる）\n方策：近くの農地を借り受け、作業する田をまとめる。\n\n【生産の効率化・高度化スマート農業の推進】\n現状：○○の作業を手作業で行っている。\n目標：○○の作業時間を○割減らす。\n方策：○○年に○○を導入する（別紙１に記載）。",
  },
  {
    key: "plan4",
    no: "④",
    title: "経営の管理の改善",
    formal: "④経営管理の合理化に関する現状と目標・措置",
    required: true,
    hint: [
      "簿記記帳等の会計処理、経営内役割分担、経営の法人化等について、現状、目標及びその達成のための措置を記載してください。（複数記載可）",
    ],
    examples: [
      "簿記記帳等の会計処理",
      "経営内役割分担",
      "経営の法人化",
      "高付加価値化・ブランド化",
      "新たな販路拡大や新製品の創造",
      "マーケティング力の強化",
      "顧客に対する情報発信",
      "農業生産工程管理（ＧＡＰ）の導入",
      "その他合理化に向けた取組",
    ],
    sample:
      "【簿記記帳等の会計処理】\n現状：収入と支出をノートに記録している。\n目標：複式簿記で記帳し、青色申告を行う。\n方策：○○年から会計ソフトで毎月記帳する。\n\n【新たな販路拡大や新製品の創造】\n現状：販売先は○○だけである。\n目標：販売先を○か所に増やす。\n方策：○○年から○○での販売を始める。",
  },
  {
    key: "plan5",
    no: "⑤",
    title: "働き方の改善",
    formal: "⑤農業従事の態様の改善に関する現状と目標・措置",
    required: true,
    hint: [
      "人材確保に向けた就業規則等の整備、相続・経営継承に関する取組等について、現状、目標及びその達成のための措置を記載してください。（複数記載可）",
      "家族経営協定を締結している場合には、①家族経営協定を締結していること、②協定に基づく家族間の役割分担等の内容を記載してください。",
    ],
    examples: [
      "人材確保に向けた就業規則等の整備",
      "相続・経営継承に関する取組",
      "多様な人材の育成・定着に向けた取組",
      "家族間の役割分担等（家族経営協定を締結している場合）",
      "その他改善に向けた取組",
    ],
    sample:
      "【家族間の役割分担等】\n現状：家族の役割分担や休日を決めていない。\n目標：家族経営協定を結び、役割分担と休日を決める。\n方策：○○年までに家族で話し合い、協定を結ぶ。\n\n【相続・経営継承に関する取組】\n現状：後継者（○○）が○○の作業を手伝っている。\n目標：○○年までに経営を引き継ぐ。\n方策：○○の作業から段階的に任せる。",
  },
  {
    key: "plan6",
    no: "⑥",
    title: "その他の改善",
    formal: "⑥その他の農業経営の改善に関する現状と目標・措置",
    required: false,
    hint: [
      "③生産方式の合理化、④経営管理の合理化及び⑤農業従事の態様の改善以外の取組等を記載してください。（複数記載可）",
      "農業近代化資金等の制度資金の融資を受けることを予定する場合には、予定年度、予定資金、予定貸付額等を記載してください。",
      "関連事業者等が申請者の農業経営の改善のために行う措置（出資など）を記載する場合は、書き方が細かく決められています。窓口でご確認ください。",
    ],
    examples: [],
    sample:
      "【制度資金の活用】\n予定年度：○○年度\n予定資金：○○資金\n予定貸付額：○○万円",
  },
];

// ---- 段階6：提出前のチェック ----
export type CheckItem = { id: string; title: string; note: string; link?: { href: string; label: string } };

export const CHECK_ITEMS: CheckItem[] = [
  {
    id: "pdf",
    title: "このツールで作ったPDFの申請書を受け付けてもらえるか",
    note: "国の様式に合わせて作っていますが、受け付けてもらえるかどうかは、窓口でご確認ください。",
  },
  {
    id: "extra",
    title: "追加で必要な資料（決算書の写し、市町村独自の書類など）",
    note: "追加で必要な資料は市町村ごとに違います。窓口でご確認ください。",
  },
  {
    id: "consent",
    title: "個人情報の取扱いについての同意書",
    note: "国の要綱では、認定申請者から、氏名・住所・計画の内容などを関係機関に提供することについて、あらかじめ同意を得ておくことが必要とされています。同意書の様式は市町村などで用意されていることがあるため、窓口でご確認ください。このツールでは作成しません。",
  },
  {
    id: "bcp",
    title: "農業版ＢＣＰ（事業継続計画書）",
    note: "要綱で提出を促すとされている資料です。必要かどうかは窓口でご確認ください。",
    link: { href: BCP_URL, label: "農林水産省「自然災害等のリスクに備えるためのチェックリストと農業版BCPについて」" },
  },
  {
    id: "kenshu",
    title: "農業経営人材育成研修プログラム（初級コース）の修了がわかる資料",
    note: "要綱で提出を促すとされている資料です。必要かどうかは窓口でご確認ください。",
    link: { href: KENSHU_URL, label: "農林水産省「農業経営人材育成研修プログラム」" },
  },
  {
    id: "facility",
    title: "施設を整備する場合・農地転用の特例を受ける場合（別紙２・３）",
    note: "畜舎や農産物の加工・販売施設などを整備する計画を書く場合や、農地法の特例を受ける場合は、別紙２・３と図面などの書類が必要です。このツールでは作れません。窓口でご確認ください。",
  },
];
