import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, COMMON_RULES, type FieldRule } from "../formValidation";

// 専従者1人分の項目（氏名以外は任意。従事者ごとに複数人分を配列で受け取る）
const SENJUSHA_FIELDS: Record<string, FieldRule> = {
  name: { label: "専従者の氏名", required: true, max: 50 },
  nameKana: { label: "専従者のふりがな", max: 50 },
  relationship: { label: "続柄", max: 20 },
  age: { label: "年齢", max: 5 },
  experience: { label: "経験年数", max: 20 },
  jobContent: { label: "仕事の内容・従事の程度", max: 200 },
  qualification: { label: "資格等", max: 100 },
  salaryMonthly: { label: "給与月額", max: 20 },
  salaryPeriod: { label: "給与の支給時期", max: 50 },
  bonusPeriod: { label: "賞与の支給時期", max: 50 },
  bonusAmount: { label: "賞与の金額", max: 20 },
  raiseCriteria: { label: "昇給の基準", max: 100 },
};

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  ...COMMON_RULES,
  farmName: { label: "屋号", max: 50 },
  occupation: { label: "職業", max: 30 },
  taxOffice: { label: "提出先税務署名", max: 50 },
  senjushaList: { label: "専従者情報", type: "objects", maxItems: 10, fields: SENJUSHA_FIELDS },
  otherNotes: { label: "その他参考事項", max: 500 },
  employeeSalaryInfo: { label: "使用人の給与の状況", max: 500 },
  accountantName: { label: "税理士の氏名", max: 50 },
  accountantPhone: { label: "税理士の電話番号", max: 20 },
};

function toWareki(y: number, m: number, day: number): string {
  let era = "";
  let eraYear = 0;
  if (y >= 2019) { era = "令和"; eraYear = y - 2018; }
  else if (y >= 1989) { era = "平成"; eraYear = y - 1988; }
  else if (y >= 1926) { era = "昭和"; eraYear = y - 1925; }
  else { era = "大正"; eraYear = y - 1911; }
  return `${era}${eraYear}年${m}月${day}日`;
}

function todayWareki(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return toWareki(jst.getUTCFullYear(), jst.getUTCMonth() + 1, jst.getUTCDate());
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require("pdfmake/build/pdfmake");

const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansJP.ttf");
if (fs.existsSync(fontPath)) {
  const fontData = fs.readFileSync(fontPath);
  pdfMake.virtualfs.storage["NotoSansJP.ttf"] = fontData;
}
pdfMake.fonts = {
  NotoSansJP: {
    normal: "NotoSansJP.ttf",
    bold: "NotoSansJP.ttf",
    italics: "NotoSansJP.ttf",
    bolditalics: "NotoSansJP.ttf",
  },
};

export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(fontPath)) {
      return NextResponse.json({ error: "フォントファイルが見つかりません" }, { status: 500 });
    }

    const checked = validateForm(await request.json(), RULES);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const form = checked.form;

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;

    // 「新宿税務署」のように末尾に「税務署」を含めて入力されても、
    // 続く「税務署長　殿」と二重表記にならないよう末尾の「税務署」を取り除く
    const taxOfficeRaw = typeof form.taxOffice === "string" ? form.taxOffice.trim() : "";
    const taxOfficeName = taxOfficeRaw.replace(/税務署$/, "");

    const basicInfoBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["納税地（住所）", address || "　"],
      ["電話番号", form.phone || "　"],
      ["職業", form.occupation || "　"],
      ["屋号", form.farmName || "なし"],
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const senjushaList: Record<string, any>[] = form.senjushaList ?? [];

    const senjushaHeader = [
      { text: "氏名・続柄", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "年齢", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "経験年数", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "仕事の内容・従事の程度", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "資格等", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "給与（月額／支給時期）", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "賞与（支給時期／金額）", style: "smallTableHeader", fillColor: "#e8f5e9" },
      { text: "昇給の基準", style: "smallTableHeader", fillColor: "#e8f5e9" },
    ];

    const senjushaRows = senjushaList.map((s) => [
      { text: `${s.name || "　"}（${s.nameKana || "　"}）\n続柄：${s.relationship || "　"}`, style: "smallTableCell" },
      { text: s.age ? `${s.age}歳` : "　", style: "smallTableCell" },
      { text: s.experience || "　", style: "smallTableCell" },
      { text: s.jobContent || "　", style: "smallTableCell" },
      { text: s.qualification || "　", style: "smallTableCell" },
      { text: `${s.salaryMonthly ? `${s.salaryMonthly}円` : "　"}\n（${s.salaryPeriod || "　"}）`, style: "smallTableCell" },
      { text: `${s.bonusAmount ? `${s.bonusAmount}円` : "　"}\n（${s.bonusPeriod || "　"}）`, style: "smallTableCell" },
      { text: s.raiseCriteria || "　", style: "smallTableCell" },
    ]);

    const senjushaTableBody = senjushaRows.length > 0
      ? [senjushaHeader, ...senjushaRows]
      : [senjushaHeader, [{ text: "（専従者の情報が入力されていません）", colSpan: 8, style: "smallTableCell" }, {}, {}, {}, {}, {}, {}, {}]];

    const referenceBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["その他参考事項", form.otherNotes || "　"],
      ["使用人の給与の状況（比較対象）", form.employeeSalaryInfo || "　"],
      ["関与税理士", (form.accountantName || form.accountantPhone)
        ? `${form.accountantName || "　"}（電話：${form.accountantPhone || "　"}）`
        : "－"],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "青色事業専従者給与に関する届出書",
          fontSize: 15,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 6],
        },
        {
          text: `提出日：${todayWareki()}`,
          alignment: "right",
          fontSize: 10,
          margin: [0, 0, 0, 12],
        },
        {
          text: `${taxOfficeName || "○○"}税務署長　殿`,
          fontSize: 13,
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、青色事業専従者給与に関する届出をします。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [140, "*"],
            body: basicInfoBody,
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.5 : 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#888888",
            vLineColor: () => "#888888",
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 7,
            paddingBottom: () => 7,
          },
          margin: [0, 0, 0, 18],
        },
        {
          text: "専従者に関する事項",
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            // 専従者の人数分だけ行が増える（見出し行＋1人1行）
            widths: ["18%", "7%", "9%", "22%", "11%", "13%", "13%", "7%"],
            body: senjushaTableBody,
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.2 : 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#888888",
            vLineColor: () => "#888888",
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 18],
        },
        {
          table: {
            widths: [160, "*"],
            body: referenceBody,
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.5 : 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#888888",
            vLineColor: () => "#888888",
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 7,
            paddingBottom: () => 7,
          },
          margin: [0, 0, 0, 24],
        },
        {
          columns: [
            { text: "届出者", width: 50, bold: true },
            {
              stack: [
                { text: "住所：", fontSize: 10 },
                { text: address || "　", margin: [10, 0, 0, 6] },
                { text: "氏名：", fontSize: 10 },
                {
                  columns: [
                    { text: form.name || "　", margin: [10, 0, 0, 0] },
                    { text: "　　㊞", width: "auto", color: "#888888", fontSize: 10 },
                  ],
                },
              ],
              width: "*",
            },
          ],
        },
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 11 },
        smallTableHeader: { bold: true, fontSize: 8 },
        smallTableCell: { fontSize: 8 },
      },
    };

    const pdfBuffer: Buffer = await pdfMake.createPdf(docDef).getBuffer();

    // Buffer<ArrayBufferLike> をそのまま渡すと BodyInit に型が合わないため、
    // ArrayBuffer 裏付けの Uint8Array に包む（送信するバイト列・挙動は同一）。
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename*=UTF-8''%E9%9D%92%E8%89%B2%E4%BA%8B%E6%A5%AD%E5%B0%82%E5%BE%93%E8%80%85%E7%B5%A6%E4%B8%8E%E3%81%AB%E9%96%A2%E3%81%99%E3%82%8B%E5%B1%8A%E5%87%BA%E6%9B%B8.pdf",
      },
    });
  } catch (error) {
    console.error("senjusha PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
