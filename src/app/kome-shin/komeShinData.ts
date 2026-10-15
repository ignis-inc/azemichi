// 「米穀等取扱事業の開始届出」下書きツールの入力項目・計算・一覧の組み立て。
// 項目と順番は、農林水産省の別紙様式「米穀等取扱事業の開始届出書」（Excel）と
// 「米穀等取扱事業に関する届出制度運用要領」（令和8年9月30日付け8農産第2501号）に合わせている。

export const LAST_CHECKED = "2026年10月";
export const MAFF_URL = "https://www.maff.go.jp/j/nousan/kokumotu/kome_todokede.html";
export const EMAFF_URL = "https://emaff2.maff.go.jp/emaff/app/ext/guest/top/extUserTopView";
export const GBIZ_URL = "https://gbiz-id.go.jp/top/";

export const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

// 選択肢の文言は Excel 様式の選択肢そのまま
export const ENTITY_OPTIONS = [
  { value: "1", label: "１．法人" },
  { value: "2", label: "２．個人事業主（その他任意団体を含む）" },
];
export const CATEGORY_OPTIONS = [
  { value: "9", label: "１．食糧法第９条に基づく届出（特定規模届出事業者、年間300玄米トン以上）" },
  { value: "47", label: "２．食糧法第47条に基づく届出（一般届出事業者、年間20精米トン(22玄米トン)～300玄米トン未満）" },
];
export const CHAIN_OPTIONS = [
  { value: "1", label: "１．該当する" },
  { value: "2", label: "２．該当しない" },
];
export const LIQUOR_OPTIONS = [
  { value: "1", label: "１．有" },
  { value: "2", label: "２．無" },
];
export const PUBLISH_OPTIONS = [
  { value: "1", label: "１．同意する" },
  { value: "2", label: "２．同意しない" },
];

// 主たる事業として位置付ける米穀等取扱事業の種類（内容はパンフレット「表２．米穀等取扱事業の種類」より）
export const MAIN_BIZ_OPTIONS = [
  { value: "1", label: "１．生産販売", desc: "主として、自ら生産した米穀の販売又は販売の委託を行う事業" },
  { value: "2", label: "２．集荷", desc: "主として、米穀の生産者から米穀の販売又は販売の委託を受けることによりその米穀の集荷及び出荷を取り扱う事業" },
  { value: "3", label: "３．卸売（一般）", desc: "卸売の事業のうち、特例条件に該当しないもの" },
  { value: "4", label: "４．卸売（特例条件該当）", desc: "卸売の事業のうち、玄米を精米に加工する設備（とう精施設）を有さず、かつ、グループ会社の小売、加工、中食、外食事業者のみに対して米穀の販売を行うもの" },
  { value: "5", label: "５．小売（とう精施設あり）", desc: "小売の事業のうち、とう精施設を有して事業を行うもの" },
  { value: "6", label: "６．小売（とう精施設なし）", desc: "小売の事業のうち、とう精施設を有しないで事業を行うもの" },
  { value: "7", label: "７．加工（餅・だんご、米穀粉）", desc: "加工の事業のうち、餅・だんご、米穀粉（米粉、上新粉、白玉粉等）の加工の事業を行うもの" },
  { value: "8", label: "８．加工（米飯）", desc: "加工の事業のうち、米飯（他事業者に販売する米飯、包装米飯、乾燥米飯、冷凍米飯等）の加工の事業を行うもの" },
  { value: "9", label: "９．加工（酒造）", desc: "加工の事業のうち、清酒、単式蒸留焼酎又はみりんの製造の事業を行うもの" },
  { value: "10", label: "10．加工（米菓）", desc: "加工事業者のうち、米菓（せんべい、あられ等）の加工の事業を行うもの" },
  { value: "11", label: "11．加工（米こうじ）", desc: "加工事業者のうち、米こうじの加工の事業を行うもの（味噌、醤油など、米こうじを作製し、さらに加工するものを含む）" },
  { value: "12", label: "12．加工（その他）", desc: "加工事業者のうち、上記以外の米穀を原材料とする飲食料品の加工、製造又は調製の事業を行うもの" },
  { value: "13", label: "13．中食", desc: "一般消費者に対して、家庭や職場・学校等で、そのまま(調理することなく)食べる米穀を原材料とする飲食料品を調製し、販売する事業（弁当屋、おにぎり屋など）" },
  { value: "14", label: "14．外食", desc: "一般消費者に対して、店舗等で米穀を原材料とする飲食料品を調製し、提供する事業" },
];

// 割合の欄（様式の並び順）
export const SUPPLY_KEYS = [
  { key: "supplyOwn", label: "自ら生産したもの" },
  { key: "supplyProducer", label: "生産者から" },
  { key: "supplyCollector", label: "集荷業者から" },
  { key: "supplyWholesaler", label: "卸売業者から" },
  { key: "supplyOther", label: "その他" },
] as const;
export const SALES_KEYS = [
  { key: "salesCollector", label: "集荷業者へ" },
  { key: "salesWholesaler", label: "卸売業者へ" },
  { key: "salesRetailer", label: "小売業者へ" },
  { key: "salesProcessor", label: "加工業者へ" },
  { key: "salesFood", label: "中食・外食業者へ" },
  { key: "salesConsumer", label: "一般消費者へ" },
  { key: "salesOwnUse", label: "自らの事業で使用" },
  { key: "salesOther", label: "その他" },
] as const;

export const STAFF_NUMBERS = [1, 2, 3] as const;

// 入力欄はすべて文字列のまま持つ（空欄と0を区別し、入力途中の値も保存できるようにする）
const FIELD_KEYS = [
  // 1. 事業者の情報
  "entityType", "corpNumber", "tradeName", "repName",
  "officeZip", "officePref", "officeCity", "officeRest",
  "contactSame", "contactZip", "contactPref", "contactCity", "contactRest", "contactPhone", "contactEmail",
  "staff1Name", "staff1Dept", "staff1Phone", "staff1Email",
  "staff2Name", "staff2Dept", "staff2Phone", "staff2Email",
  "staff3Name", "staff3Dept", "staff3Phone", "staff3Email",
  // 2. 開始の届出
  "todokedeDate", "startYear", "startMonth", "category", "mainBiz", "chain", "liquor",
  // 3. 数量（前年・当年）
  "prevSeimai", "prevGenmai", "prevToTodokede",
  "curSeimai", "curGenmai", "curToTodokede",
  "buyPrev", "buyCur",
  // 4. 割合
  ...SUPPLY_KEYS.map((k) => k.key),
  ...SALES_KEYS.map((k) => k.key),
  // 5. 施設
  "prefCount", "tohseiCount", "tohseiCapacity", "soukoCount", "soukoCapacity",
  // 6. 公表
  "publish",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];
export type Inputs = Record<FieldKey, string>;

const BLANK: Inputs = Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])) as Inputs;

// 最初から「0」を値として入れておく欄（割合・玄米の量・届出事業者に販売した量）。リセット時もこの状態に戻す。
export const EMPTY: Inputs = {
  ...BLANK,
  ...Object.fromEntries(SUPPLY_KEYS.map((k) => [k.key, "0"])),
  ...Object.fromEntries(SALES_KEYS.map((k) => [k.key, "0"])),
  prevGenmai: "0",
  curGenmai: "0",
  prevToTodokede: "0",
  curToTodokede: "0",
};

export const STORAGE_KEY = "azemichi-kome-shin-v1";

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
    // 最初の状態のままなら保存内容も残さない（リセット後に空のデータが残らないようにする）
    if (FIELD_KEYS.every((k) => inputs[k] === EMPTY[k])) {
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

// トン数（0以上、小数可）
export function parseTon(v: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: "0以上の数字で入力してください" };
  return { value: n };
}

// 割合（0〜100の整数）
export function parsePercent(v: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 100) return { value: null, error: "0〜100の整数で入力してください" };
  return { value: n };
}

// 数（0以上の整数）
export function parseCount(v: string): Parsed {
  if (v.trim() === "") return { value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return { value: null, error: "0以上の整数で入力してください" };
  return { value: n };
}

// 精米は「精米÷0.91＝玄米」で玄米に換算し、玄米の数量と合算する（運用要領 第1の2 注2）。
// 玄米の欄は最初から「0」が入っているため、精米が空欄で玄米が0（または空欄）なら、まだ入力されていないものとして null。
export function toGenmai(seimai: string, genmai: string): number | null {
  const s = parseTon(seimai);
  const g = parseTon(genmai);
  if (s.error || g.error) return null;
  if (s.value === null && !g.value) return null;
  return (s.value ?? 0) / 0.91 + (g.value ?? 0);
}

// 換算結果は小数点以下2けたまで表示する（3けた目を四捨五入）
export function formatTon(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

// 「年」は毎年7月1日から翌年6月30日までの1年間。届出の日の属する期間を当年、その前を前年とする。
export function periodLabels(base: Date): { prev: string; cur: string } {
  const y = base.getMonth() + 1 >= 7 ? base.getFullYear() : base.getFullYear() - 1;
  return {
    prev: `${y - 1}年7月〜${y}年6月`,
    cur: `${y}年7月〜${y + 1}年6月`,
  };
}

// 届出年月日（"2026-10-15" 形式）があればその日、なければ今日を基準にする
export function baseDate(todokedeDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todokedeDate);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date();
}

// 届出の区分の目安。前年実績又は当年予定のいずれか大きい方の数量で判定する。
//   出荷・販売数量 300玄米トン以上 or 加工等事業の買入数量 300玄米トン以上 → 第9条
//   出荷・販売数量 22玄米トン（20精米トン）以上300玄米トン未満 → 第47条
export type Suggestion = "9" | "47" | "under" | null;

export function suggestCategory(inputs: Inputs): { suggestion: Suggestion; salesMax: number | null } {
  const prev = toGenmai(inputs.prevSeimai, inputs.prevGenmai);
  const cur = toGenmai(inputs.curSeimai, inputs.curGenmai);
  const buyPrev = parseTon(inputs.buyPrev).value ?? 0;
  const buyCur = parseTon(inputs.buyCur).value ?? 0;
  const buyMax = Math.max(buyPrev, buyCur);
  if (prev === null && cur === null) {
    return { suggestion: buyMax >= 300 ? "9" : null, salesMax: null };
  }
  const salesMax = Math.max(prev ?? 0, cur ?? 0);
  if (salesMax >= 300 || buyMax >= 300) return { suggestion: "9", salesMax };
  if (salesMax >= 22) return { suggestion: "47", salesMax };
  return { suggestion: "under", salesMax };
}

export function sumPercents(inputs: Inputs, keys: readonly { key: FieldKey }[]): { total: number; hasError: boolean } {
  let total = 0;
  let hasError = false;
  for (const { key } of keys) {
    const p = parsePercent(inputs[key]);
    if (p.error) hasError = true;
    total += p.value ?? 0;
  }
  return { total, hasError };
}

// ---- 一覧（画面とPDFで共通） ----
export type SummaryRow = { label: string; value: string; missing?: boolean };
export type SummarySection = { title: string; rows: SummaryRow[] };

const MISSING = "（未入力）";

function optionLabel(options: { value: string; label: string }[], v: string): string {
  return options.find((o) => o.value === v)?.label ?? "";
}

function required(label: string, value: string): SummaryRow {
  return value.trim() ? { label, value } : { label, value: MISSING, missing: true };
}

function tonRow(label: string, n: number | null): SummaryRow {
  return n === null ? { label, value: MISSING, missing: true } : { label, value: `${formatTon(n)} 玄米トン` };
}

function formatDate(v: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : "";
}

function addressRows(prefix: string, zip: string, pref: string, city: string, rest: string): SummaryRow[] {
  return [
    required(`${prefix}　郵便番号`, zip),
    required(`${prefix}　都道府県名`, pref),
    required(`${prefix}　市区町村名`, city),
    required(`${prefix}　町域以降`, rest),
  ];
}

export function buildSummary(inputs: Inputs): SummarySection[] {
  const i = inputs;
  const isCorp = i.entityType === "1";
  const same = i.contactSame === "1";

  // 1. 事業者の情報
  const s1: SummaryRow[] = [
    required("法人・個人の区別", optionLabel(ENTITY_OPTIONS, i.entityType)),
    isCorp
      ? required("法人番号", i.corpNumber)
      : { label: "法人番号", value: "（法人の場合のみ記載）" },
    required("商号、名称又は屋号", i.tradeName),
    required("代表者氏名又は氏名", i.repName),
    ...addressRows("主たる事務所の所在地", i.officeZip, i.officePref, i.officeCity, i.officeRest),
    ...addressRows(
      "住所・連絡先",
      same ? i.officeZip : i.contactZip,
      same ? i.officePref : i.contactPref,
      same ? i.officeCity : i.contactCity,
      same ? i.officeRest : i.contactRest,
    ),
    required("住所・連絡先　連絡先電話番号", i.contactPhone),
    required("住所・連絡先　メールアドレス", i.contactEmail),
  ];
  let staffCount = 0;
  for (const n of STAFF_NUMBERS) {
    const name = i[`staff${n}Name`];
    const dept = i[`staff${n}Dept`];
    const phone = i[`staff${n}Phone`];
    const email = i[`staff${n}Email`];
    if (!(name || dept || phone || email)) continue;
    staffCount++;
    s1.push(
      { label: `担当者連絡先${n}　担当者氏名`, value: name },
      { label: `担当者連絡先${n}　担当者部署名`, value: dept },
      { label: `担当者連絡先${n}　担当者電話番号`, value: phone },
      { label: `担当者連絡先${n}　担当者メールアドレス`, value: email },
    );
  }
  if (staffCount === 0) s1.push({ label: "担当者連絡先（任意）", value: "なし" });

  // 2. 開始の届出
  const start = i.startYear && i.startMonth ? `${i.startYear}年${i.startMonth}月` : "";
  const s2: SummaryRow[] = [
    { label: "届出年月日（西暦）", value: formatDate(i.todokedeDate) || "（eMAFFで申請する日）" },
    required("事業の開始時期", start),
    required("届出の区分", optionLabel(CATEGORY_OPTIONS, i.category)),
    required("主たる事業として位置付ける米穀等取扱事業の種類", optionLabel(MAIN_BIZ_OPTIONS, i.mainBiz)),
    required("連鎖化事業者としての届出", optionLabel(CHAIN_OPTIONS, i.chain)),
    required("酒類製造免許の有無", optionLabel(LIQUOR_OPTIONS, i.liquor)),
  ];

  // 3. 数量（取扱いがない項目は「0」と記載するため、買入数量の空欄は0として扱う）
  const buyPrev = parseTon(i.buyPrev).value ?? 0;
  const buyCur = parseTon(i.buyCur).value ?? 0;
  const s3: SummaryRow[] = [
    tonRow("米穀の出荷又は販売の事業における出荷数量及び販売数量の合計　前年の数量", toGenmai(i.prevSeimai, i.prevGenmai)),
    tonRow("米穀の出荷又は販売の事業における出荷数量及び販売数量の合計　当年の予定数量", toGenmai(i.curSeimai, i.curGenmai)),
    { label: "加工等事業における買入数量　前年の数量", value: `${formatTon(buyPrev)} 玄米トン` },
    { label: "加工等事業における買入数量　当年の予定数量", value: `${formatTon(buyCur)} 玄米トン` },
  ];

  // 4. 割合（空欄は0%として扱う。合計が100%でなければ未完了として示す）
  const percentRows = (keys: readonly { key: FieldKey; label: string }[]): SummaryRow[] => {
    const rows: SummaryRow[] = keys.map(({ key, label }) => ({
      label,
      value: `${parsePercent(i[key]).value ?? 0}%`,
    }));
    const { total } = sumPercents(i, keys);
    rows.push(
      total === 100
        ? { label: "合計", value: "100%" }
        : { label: "合計", value: `${total}%（100%になるように入力してください）`, missing: true },
    );
    return rows;
  };
  const s4supply = percentRows(SUPPLY_KEYS).map((r) => ({ ...r, label: `生産又は仕入先の割合　${r.label}` }));
  const s4sales = percentRows(SALES_KEYS).map((r) => ({ ...r, label: `販売先又は使用の割合　${r.label}` }));

  // 5. 施設（能力の欄は、施設の数が1以上のときだけ記載する）
  const tohsei = parseCount(i.tohseiCount).value;
  const souko = parseCount(i.soukoCount).value;
  const s5: SummaryRow[] = [
    required("事業拠点がある都道府県の数", i.prefCount),
    required("とう精施設の数（か所）", i.tohseiCount),
  ];
  if (tohsei !== null && tohsei >= 1) s5.push(required("合計とう精能力（kg／時間）", i.tohseiCapacity));
  s5.push(required("定温倉庫の数（か所）", i.soukoCount));
  if (souko !== null && souko >= 1) s5.push(required("合計収容能力（トン）", i.soukoCapacity));

  // 6. 公表
  const s6: SummaryRow[] = [
    required("届出情報の一部情報の公表への同意", optionLabel(PUBLISH_OPTIONS, i.publish)),
  ];

  return [
    { title: "１．事業者の情報", rows: s1 },
    { title: "２．開始の届出", rows: s2 },
    { title: "３．届出時点における出荷、販売又は買入の数量", rows: s3 },
    { title: "４．届出時点における米穀の生産又は仕入先の割合及び販売先又は使用の割合", rows: [...s4supply, ...s4sales] },
    { title: "５．届出時点における事業の用に供する施設の内容", rows: s5 },
    { title: "６．届出事項の一部情報の公表について", rows: s6 },
  ];
}
