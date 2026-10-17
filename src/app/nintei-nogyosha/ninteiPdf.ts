import {
  ADDRESSEE_OPTIONS,
  COMPLEX_TYPE,
  CROP_TYPES,
  LAND_KUBUN,
  LIVESTOCK_TYPES,
  OTHER_CROP,
  OTHER_LIVESTOCK,
  computeTotals,
  formatArea,
  formatCountText,
  formatMan,
  parseYen,
  toWareki,
  type Inputs,
} from "./ninteiData";

// 申請書を、国の様式（農林水産省が配っているExcel「農業経営改善計画」）に近い形で、
// ブラウザの中だけで PDF にしてダウンロードさせる。入力内容はサーバーへ送らない。
// 読み込むのは同じサイトのフォントファイルだけ。
// ページ構成は Excel の印刷範囲・改ページに合わせる：A4横で、本体1枚目（①・②（１）（２））、
// 本体2枚目（②（３）・③〜⑥・（参考）経営の構成）、別紙１。

type Cell = Record<string, unknown>;

const FS = 8; // 本文の文字の大きさ
const LINE = "#111827";

// PDFに使うフォント（NotoSansJP.ttf）に入っていない記号を、入っている文字に置き換える。
// そのままだと、入力された文章の「○」「①」「㎡」などがPDFで消えてしまうため。
const CIRCLED_DIGITS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
function san(text: string): string {
  return text
    .replace(/[○◯●]/g, "〇")
    .replace(/[□☐▢]/g, "［　］")
    .replace(/[■☑✓✔]/g, "［〇］")
    .replace(/㎡/g, "m²")
    .replace(/※/g, "＊")
    .replace(new RegExp(`[${CIRCLED_DIGITS}]`, "g"), (c) => `(${CIRCLED_DIGITS.indexOf(c) + 1})`);
}

function t(text: string, opts: Cell = {}): Cell {
  return { text: san(text), fontSize: FS, ...opts };
}
function h(text: string, opts: Cell = {}): Cell {
  return { text: san(text), fontSize: 7.5, alignment: "center", ...opts };
}
function num(text: string, unit: string, opts: Cell = {}): Cell {
  return { text: san(`${text}${unit}`), fontSize: FS, alignment: "right", ...opts };
}

// 丸数字（①など）。フォントに無いため、数字のまわりに円を描く
function circled(n: number, size = 9): Cell {
  const r = size / 2 + 0.6;
  return {
    width: size + 3,
    stack: [
      { text: String(n), fontSize: size - 2.5, alignment: "center", lineHeight: 1 },
      { canvas: [{ type: "ellipse", x: (size + 3) / 2, y: -(size - 2.5) / 2 - 1.2, r1: r, r2: r, lineWidth: 0.5, lineColor: LINE }] },
    ],
  };
}

// 丸数字＋見出し
function numbered(n: number, text: string, opts: Cell = {}): Cell {
  const size = (opts.fontSize as number | undefined) ?? FS;
  return {
    columns: [circled(n, size + 1), { width: "*", text, fontSize: size, ...opts }],
    columnGap: 2,
  };
}

// チェック欄（□）。選んだものは塗りつぶす（■）
function box(checked: boolean): Cell {
  return {
    width: 9,
    canvas: [{ type: "rect", x: 0.5, y: 3, w: 6, h: 6, lineWidth: 0.5, lineColor: LINE, ...(checked ? { color: LINE } : {}) }],
  };
}
const EMPTY_CELL: Cell = {};

const gridLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => LINE,
  vLineColor: () => LINE,
  paddingLeft: () => 3,
  paddingRight: () => 3,
  paddingTop: () => 2,
  paddingBottom: () => 2,
};
const tightLayout = { ...gridLayout, paddingTop: () => 1, paddingBottom: () => 1 };

function sectionTitle(text: string, margin: number[] = [0, 6, 0, 2]): Cell {
  return { text, fontSize: 9, bold: true, margin };
}

// 営農類型のチェック欄（様式の3行の並び）。選んだものを■、それ以外を□にする。
function typeLines(selected: string, other: string): Cell {
  const item = (name: string, label = name): Cell[] => [
    box(selected === name),
    { width: "auto", text: san(label), fontSize: FS, margin: [0, 0, 7, 0] },
  ];
  const withOther = (name: string) => {
    const text = selected === name && other.trim() ? other.trim() : "　　　";
    return item(name, `${name}（${text}）`);
  };
  const line = (cells: Cell[]): Cell => ({ columns: cells, columnGap: 0, margin: [0, 1, 0, 1] });
  return {
    stack: [
      line([...CROP_TYPES.slice(0, 5).flatMap((n) => item(n)), { width: 10, text: "" }, ...item(COMPLEX_TYPE)]),
      line([...CROP_TYPES.slice(5, 8).flatMap((n) => item(n)), ...withOther(OTHER_CROP)]),
      line([...LIVESTOCK_TYPES.slice(0, 5).flatMap((n) => item(n)), ...withOther(OTHER_LIVESTOCK)]),
    ],
  };
}

function man(v: string): string {
  return formatMan(parseYen(v, true).value);
}

export function buildDocDefinition(i: Inputs): Record<string, unknown> {
  const isCorp = i.entityType === "corp";
  const tot = computeTotals(i);
  const goal = `目標（${i.targetYear.trim() || "　　"}年）`;
  const outlook = `見通し（${i.targetYear.trim() || "　　"}年）`;
  const applicants = isCorp ? i.applicants.slice(0, 1) : i.applicants;
  const joinApplicants = (pick: (a: Inputs["applicants"][number]) => string) =>
    applicants.map(pick).filter((s) => s.trim()).join("\n");

  // ---- 1枚目 ----
  // 宛先は、選んだものだけを書く（例：豊後大野市長　殿）
  const chosenAddressee = ADDRESSEE_OPTIONS.some((o) => o.value === i.addresseeType) ? i.addresseeName.trim() : "";
  const addressee = [{ text: san(chosenAddressee ? `${chosenAddressee}　殿` : ""), fontSize: 10.5, margin: [0, 8, 0, 0] }];

  const applicantTable = {
    table: {
      widths: [14, 62, "*", 62, "*"],
      body: [
        [{ text: "申\n請\n者", rowSpan: 4, fontSize: FS, alignment: "center", margin: [0, 14, 0, 0] }, h("住所"), t(i.address), h("連絡先"), t(i.phone)],
        [EMPTY_CELL, h("フリガナ"), t(joinApplicants((a) => a.kana)), h("フリガナ"), t(isCorp ? i.repKana : "")],
        [EMPTY_CELL, h("個人・法人名"), t(joinApplicants((a) => a.name), { fontSize: 9 }), h("代表者氏名\n（法人のみ）"), t(isCorp ? i.repName : "", { fontSize: 9 })],
        [EMPTY_CELL, h("生年月日・\n法人設立年月日"), t(joinApplicants((a) => toWareki(a.birth))), h("法人番号"), t(isCorp ? i.corpNumber : "")],
      ],
    },
    layout: gridLayout,
  };

  const typeTable = {
    table: {
      widths: ["*", "*"],
      body: [
        [h("現　　状"), h(goal)],
        [typeLines(i.typeCur, i.typeCurOther), typeLines(i.typeGoal, i.typeGoalOther)],
      ],
    },
    layout: gridLayout,
  };

  const goalTable = {
    table: {
      widths: [110, 70, 70, 120, 70, 70, "*"],
      body: [
        [EMPTY_CELL, h("現状"), h(goal), EMPTY_CELL, h("現状"), h(goal), h("主たる従事者の人数")],
        [
          t("年間所得"), num(formatMan(tot.incomeCur), "万円"), num(formatMan(tot.incomeGoal), "万円"),
          t("年間労働時間"), num(formatCountText(i.hoursCur), "時間"), num(formatCountText(i.hoursGoal), "時間"),
          { text: `${tot.people ?? ""}人`, rowSpan: 2, fontSize: 9, alignment: "center", margin: [0, 8, 0, 0] },
        ],
        [
          t("主たる従事者１人\n当たりの年間所得"), num(formatMan(tot.perIncomeCur), "万円"), num(formatMan(tot.perIncomeGoal), "万円"),
          t("主たる従事者１人\n当たりの年間労働時間"),
          num(tot.perHoursCur === null ? "" : tot.perHoursCur.toLocaleString("ja-JP"), "時間"),
          num(tot.perHoursGoal === null ? "" : tot.perHoursGoal.toLocaleString("ja-JP"), "時間"),
          EMPTY_CELL,
        ],
      ],
    },
    layout: gridLayout,
  };

  const productionTable = {
    table: {
      widths: [56, 34, 40, 34, 40, 56, 36, 40, 36, 40],
      body: [
        [
          h("作目・部門名\n（耕　種）", { rowSpan: 2 }), h("現　状", { colSpan: 2 }), EMPTY_CELL, h(goal, { colSpan: 2 }), EMPTY_CELL,
          h("作目・部門名\n（畜　産）", { rowSpan: 2 }), h("現　状", { colSpan: 2 }), EMPTY_CELL, h(goal, { colSpan: 2 }), EMPTY_CELL,
        ],
        [
          EMPTY_CELL, h("作付面積\n(a)"), h("生産量"), h("作付面積\n(a)"), h("生産量"),
          EMPTY_CELL, h("飼養頭数\n（頭、羽）"), h("生産量"), h("飼養頭数\n（頭、羽）"), h("生産量"),
        ],
        ...i.crops.map((c, k) => {
          const l = i.livestock[k];
          return [
            t(c.name), num(c.areaCur.trim(), ""), t(c.qtyCur), num(c.areaGoal.trim(), ""), t(c.qtyGoal),
            t(l.name), num(l.headsCur.trim(), ""), t(l.qtyCur), num(l.headsGoal.trim(), ""), t(l.qtyGoal),
          ];
        }),
      ],
    },
    layout: gridLayout,
  };

  const relatedTable = {
    table: {
      widths: ["*", 52, 52],
      body: [
        [h("事　業　内　容"), h("現　状"), h(goal)],
        ...i.related.map((r) => [t(r.content), num(man(r.salesCur), "万円"), num(man(r.salesGoal), "万円")]),
      ],
    },
    layout: gridLayout,
  };

  // ---- 2枚目 ----
  const landTable = {
    table: {
      widths: [40, 58, 70, 40, "*", "*"],
      body: [
        [h("区　分", { rowSpan: 2 }), h("所在地", { colSpan: 2 }), EMPTY_CELL, h("地目", { rowSpan: 2 }), h("現　状\n(a)", { rowSpan: 2 }), h(`${goal}\n(a)`, { rowSpan: 2 })],
        [EMPTY_CELL, h("都道府県名"), h("市町村名"), EMPTY_CELL, EMPTY_CELL, EMPTY_CELL],
        ...i.lands.map((r, k) => [
          k % 2 === 0 ? { ...t(LAND_KUBUN[k], { alignment: "center" }), rowSpan: 2, margin: [0, 4, 0, 0] } : EMPTY_CELL,
          t(r.pref), t(r.city), t(r.chimoku, { alignment: "center" }), num(r.areaCur.trim(), ""), num(r.areaGoal.trim(), ""),
        ]),
        [h("経 営 面 積 合 計", { colSpan: 4 }), EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, num(formatArea(tot.landCur), ""), num(formatArea(tot.landGoal), "")],
      ],
    },
    layout: tightLayout,
  };

  const facilityTable = {
    table: {
      widths: ["*", 52, 62, 28, 42, 28, 42],
      body: [
        [h("種　別", { rowSpan: 2 }), h("所在地", { colSpan: 2 }), EMPTY_CELL, h("規模　現　状", { colSpan: 2 }), EMPTY_CELL, h(`規模　${goal}`, { colSpan: 2 }), EMPTY_CELL],
        [EMPTY_CELL, h("都道府県名"), h("市町村名"), h("棟"), h("m²"), h("棟"), h("m²")],
        ...i.facilities.map((r) => [
          t(r.kind), t(r.pref), t(r.city),
          num(r.bldCur.trim(), ""), num(r.sqmCur.trim(), ""), num(r.bldGoal.trim(), ""), num(r.sqmGoal.trim(), ""),
        ]),
        [
          h("経 営 面 積 合 計", { colSpan: 3 }), EMPTY_CELL, EMPTY_CELL,
          num(tot.bldCur === null ? "" : String(tot.bldCur), ""), num(formatArea(tot.sqmCur), ""),
          num(tot.bldGoal === null ? "" : String(tot.bldGoal), ""), num(formatArea(tot.sqmGoal), ""),
        ],
      ],
    },
    layout: tightLayout,
  };

  const planTable = (ln: number, leftTitle: string, left: string, rn: number, rightTitle: string, right: string) => ({
    table: {
      widths: ["*", "*"],
      heights: [10, 62],
      body: [
        [numbered(ln, leftTitle), numbered(rn, rightTitle)],
        [t(left, { fontSize: 7.5, lineHeight: 1.1 }), t(right, { fontSize: 7.5, lineHeight: 1.1 })],
      ],
    },
    layout: tightLayout,
    margin: [0, 5, 0, 0],
  });

  const memberTable = {
    table: {
      widths: ["*", 22, 22, 64, 58, 26, 38, 58, 26, 38],
      body: [
        [
          h("氏　名\n(法人経営にあっては役員の氏名）", { rowSpan: 2, fontSize: 7 }), h("年齢", { rowSpan: 2 }), h("性別", { rowSpan: 2 }),
          h("代表者との続柄\n(法人経営にあっては役職)", { rowSpan: 2, fontSize: 7 }),
          h("現　状", { colSpan: 3 }), EMPTY_CELL, EMPTY_CELL, h(outlook, { colSpan: 3 }), EMPTY_CELL, EMPTY_CELL,
        ],
        [
          EMPTY_CELL, EMPTY_CELL, EMPTY_CELL, EMPTY_CELL,
          h("担当業務"), h("主たる\n従事者"), h("年間農業\n従事時間"), h("担当業務"), h("主たる\n従事者"), h("年間農業\n従事時間"),
        ],
        ...i.members.map((m, k) => [
          t(m.name), num(m.age.trim(), ""), t(m.sex, { alignment: "center" }), t(k === 0 ? "（代表者）" : m.relation),
          t(m.dutyCur), t(m.mainCur === "1" ? "〇" : "", { alignment: "center" }), num(formatCountText(m.hoursCur), ""),
          t(m.dutyGoal), t(m.mainGoal === "1" ? "〇" : "", { alignment: "center" }), num(formatCountText(m.hoursGoal), ""),
        ]),
      ],
    },
    layout: tightLayout,
  };

  const employeeTable = {
    table: {
      widths: [62, 40, "*", "*"],
      body: [
        [EMPTY_CELL, EMPTY_CELL, h("現状"), h("見通し")],
        [t("常時雇（年間）"), h("実 人 数"), num(i.empRegularCur.trim(), "人"), num(i.empRegularGoal.trim(), "人")],
        [{ ...t("臨時雇（年間）"), rowSpan: 2, margin: [0, 5, 0, 0] }, h("実 人 数"), num(i.empTempCur.trim(), "人"), num(i.empTempGoal.trim(), "人")],
        [EMPTY_CELL, h("延べ人数"), num(i.empTempDaysCur.trim(), "人"), num(i.empTempDaysGoal.trim(), "人")],
      ],
    },
    layout: tightLayout,
  };

  // ---- 別紙１ ----
  const machineTable = {
    table: {
      widths: ["*", 90],
      body: [
        [h("農業用機械等の名称", { fontSize: 9 }), h("数量", { fontSize: 9 })],
        ...i.machines.map((m) => [t(m.name, { fontSize: 9 }), t(m.qty, { fontSize: 9, alignment: "right" })]),
      ],
    },
    layout: { ...gridLayout, paddingTop: () => 3, paddingBottom: () => 3 },
  };

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [36, 28, 36, 28],
    defaultStyle: { font: "NotoSansJP", fontSize: FS, lineHeight: 1.15 },
    content: [
      // 1枚目
      { text: "農業経営改善計画認定申請書", fontSize: 14, alignment: "center", margin: [0, 0, 0, 4] },
      { text: toWareki(i.applyDate) || "　　　　年　　月　　日", fontSize: 9, alignment: "right", margin: [0, 0, 0, 4] },
      {
        columns: [
          { width: 190, stack: addressee, margin: [0, 6, 0, 0] },
          { width: "*", ...applicantTable },
        ],
        columnGap: 12,
      },
      {
        text: "　農業経営基盤強化促進法（昭和５５年法律第６５号）第１２条第１項の規定に基づき、次の農業経営改善計画の認定を申請します。",
        fontSize: 9,
        margin: [0, 8, 0, 4],
      },
      { text: "農　業　経　営　改　善　計　画", fontSize: 11, alignment: "center", margin: [0, 0, 0, 2] },
      { ...numbered(1, "農業経営体の営農活動の現状及び目標", { fontSize: 9, bold: true }), margin: [0, 2, 0, 2] },
      t("（１）営農類型", { margin: [0, 0, 0, 2] }),
      typeTable,
      t("（２）農業経営の現状及びその改善に関する目標", { margin: [0, 4, 0, 2] }),
      goalTable,
      { ...numbered(2, "農業経営の規模拡大に関する現状及び目標", { fontSize: 9, bold: true }), margin: [0, 6, 0, 2] },
      {
        columns: [
          { width: 482, stack: [t("（１）生産", { margin: [0, 0, 0, 2] }), productionTable] },
          { width: "*", stack: [t("（２）農畜産物の加工・販売その他の関連・附帯事業（売上げ）", { margin: [0, 0, 0, 2] }), relatedTable] },
        ],
        columnGap: 10,
      },

      // 2枚目
      { ...t("（３）農用地及び農業生産施設", { margin: [0, 0, 0, 2] }), pageBreak: "before" },
      {
        columns: [
          { width: "*", stack: [t("ア　農用地", { margin: [0, 0, 0, 2] }), landTable] },
          { width: "*", stack: [t("イ　農業生産施設", { margin: [0, 0, 0, 2] }), facilityTable] },
        ],
        columnGap: 10,
      },
      planTable(3, "生産方式の合理化に関する現状と目標・措置", i.plan3, 4, "経営管理の合理化に関する現状と目標・措置", i.plan4),
      planTable(5, "農業従事の態様の改善に関する現状と目標・措置", i.plan5, 6, "その他の農業経営の改善に関する現状と目標・措置", i.plan6),
      sectionTitle("（参考）経営の構成", [0, 6, 0, 2]),
      {
        columns: [
          { width: "*", stack: [t("（１）構成員・役員", { margin: [0, 0, 0, 2] }), memberTable] },
          { width: 220, stack: [t("（２）雇　用　者", { margin: [0, 0, 0, 2] }), employeeTable] },
        ],
        columnGap: 10,
      },

      // 別紙１
      { text: "（別紙１）生産方式の合理化に係る農業用機械等の取得計画", fontSize: 11, margin: [0, 0, 0, 6], pageBreak: "before" },
      { columns: [{ width: 460, ...machineTable }, { width: "*", text: "" }] },
      {
        text: "（注）「農業用機械等の名称」欄には、生産方式の合理化のために、取得する予定の農業用の機械及び装置、器具及び備品、建物及びその附属設備、構築物並びにソフトウェア等を記載する。（(2)「（３）農用地及び農業生産施設」に記載しているものは記載不要。）",
        fontSize: 8,
        margin: [0, 6, 0, 0],
      },
    ],
  };
}

export async function downloadApplicationPdf(i: Inputs): Promise<void> {
  const mod = await import("pdfmake/build/pdfmake");
  const pdfMake = mod.default ?? mod;

  const fontUrl = `${window.location.origin}/fonts/NotoSansJP.ttf`;
  // フォント以外の外部読み込みはさせない
  pdfMake.setUrlAccessPolicy((url: string) => url === fontUrl);
  pdfMake.setFonts({
    NotoSansJP: { normal: fontUrl, bold: fontUrl, italics: fontUrl, bolditalics: fontUrl },
  });

  await pdfMake.createPdf(buildDocDefinition(i)).download("農業経営改善計画認定申請書.pdf");
}
