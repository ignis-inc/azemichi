import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, COMMON_RULES, type FieldRule } from "../formValidation";

// 直近6か月分、1か月分の項目
const MONTH_FIELDS: Record<string, FieldRule> = {
  yearMonth: { label: "年月", max: 20 },
  headcount: { label: "支払人員", max: 10 },
  amount: { label: "支給金額", max: 20 },
};

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  ...COMMON_RULES,
  myNumber: { label: "個人番号", max: 20 },
  officeName: { label: "給与支払事務所の名称", max: 100 },
  officePrefecture: { label: "給与支払事務所の所在地（都道府県）", max: 10 },
  officeCityAddress: { label: "給与支払事務所の所在地（市区町村・番地）", max: 100 },
  currentPayeeCount: { label: "現在の給与支払を受ける人数", max: 10 },
  sixMonths: { label: "直近6か月の支払人員・支給金額", type: "objects", maxItems: 6, fields: MONTH_FIELDS },
  taxOffice: { label: "提出先税務署名", max: 50 },
};

function todayWareki(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const eraYear = y - 2018;
  return `令和${eraYear}年${m}月${d}日`;
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
    const officeAddress = `${form.officePrefecture || ""}${form.officeCityAddress || ""}`;

    const taxOfficeRaw = typeof form.taxOffice === "string" ? form.taxOffice.trim() : "";
    const taxOfficeName = taxOfficeRaw.replace(/税務署$/, "");

    const basicInfoBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["住所", address || "　"],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["個人番号", form.myNumber || "　"],
      ["電話番号", form.phone || "　"],
      ["給与支払事務所の名称", form.officeName || "　"],
      ["給与支払事務所の所在地", officeAddress || "　"],
      ["現在の給与支払を受ける人数（俸給・給料等の別）", form.currentPayeeCount ? `${form.currentPayeeCount}人` : "　"],
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sixMonths: Record<string, any>[] = form.sixMonths ?? [];
    const monthHeader = [
      { text: "年月", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "支払人員", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "支給金額", style: "tableHeader", fillColor: "#e8f5e9" },
    ];
    const monthRows = sixMonths.map((m) => [
      m.yearMonth || "　",
      m.headcount ? `${m.headcount}人` : "　",
      m.amount ? `${m.amount}円` : "　",
    ]);
    const monthTableBody = monthRows.length > 0 ? [monthHeader, ...monthRows] : [monthHeader, ["　", "　", "　"]];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "源泉所得税の納期の特例の承認に関する申請書",
          fontSize: 15,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 6],
        },
        {
          text: "常時10人未満の使用人を雇用する事業者が対象です。",
          fontSize: 9,
          alignment: "center",
          color: "#666666",
          margin: [0, 0, 0, 4],
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
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、源泉所得税の納期の特例の承認を申請します。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [220, "*"],
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
          text: "直近6か月の支払人員・支給金額",
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            widths: ["*", "*", "*"],
            body: monthTableBody,
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.2 : 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#888888",
            vLineColor: () => "#888888",
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 24],
        },
        {
          columns: [
            { text: "申請者", width: 50, bold: true },
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
      },
    };

    const pdfBuffer: Buffer = await pdfMake.createPdf(docDef).getBuffer();

    // Buffer<ArrayBufferLike> をそのまま渡すと BodyInit に型が合わないため、
    // ArrayBuffer 裏付けの Uint8Array に包む（送信するバイト列・挙動は同一）。
    const fileName = "源泉所得税の納期の特例の承認に関する申請書.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("gennsen-tokurei PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
