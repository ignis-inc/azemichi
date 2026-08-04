import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, COMMON_RULES, warekiRules, type FieldRule } from "../formValidation";

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  ...COMMON_RULES,
  ...warekiRules("start", "給与支払開始年月日"),
  myNumber: { label: "個人番号", max: 20 },
  farmName: { label: "屋号", max: 50 },
  noticeType: { label: "届出区分", max: 10 },
  officePrefecture: { label: "事務所の所在地（都道府県）", max: 10 },
  officeCityAddress: { label: "事務所の所在地（市区町村・番地）", max: 100 },
  officePhone: { label: "事務所の電話番号", max: 20 },
  officerCount: { label: "役員の人数", max: 10 },
  employeeCount: { label: "従業員の人数", max: 10 },
  otherCount: { label: "その他の人数", max: 10 },
  taxOffice: { label: "提出先税務署名", max: 50 },
};

function toWareki(y: number, m: number, day: number): string {
  let era = "";
  let eraYear = 0;
  if (y >= 2019) { era = "令和"; eraYear = y - 2018; }
  else if (y >= 1989) { era = "平成"; eraYear = y - 1988; }
  else { era = "昭和"; eraYear = y - 1925; }
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

    const startText = (form.startEra && form.startYear && form.startMonth && form.startDay)
      ? `${form.startEra}${form.startYear}年${form.startMonth}月${form.startDay}日`
      : "　　年　　月　　日";

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;
    const officeAddress = `${form.officePrefecture || ""}${form.officeCityAddress || ""}`;

    const taxOfficeRaw = typeof form.taxOffice === "string" ? form.taxOffice.trim() : "";
    const taxOfficeName = taxOfficeRaw.replace(/税務署$/, "");

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["届出区分", form.noticeType || "開設"],
      ["住所", address || "　"],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["屋号", form.farmName || "なし"],
      ["個人番号", form.myNumber || "　"],
      ["電話番号", form.phone || "　"],
      ["給与支払を開始する年月日", startText],
      ["事務所等の所在地", officeAddress || "　"],
      ["事務所等の電話番号", form.officePhone || "　"],
      ["従事員数（役員）", form.officerCount ? `${form.officerCount}人` : "0人"],
      ["従事員数（従業員）", form.employeeCount ? `${form.employeeCount}人` : "0人"],
      ["従事員数（その他）", form.otherCount ? `${form.otherCount}人` : "0人"],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "給与支払事務所等の開設・移転・廃止届出書",
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
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、給与支払事務所等の開設・移転・廃止について届け出ます。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [160, "*"],
            body: tableBody,
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
      },
    };

    const pdfBuffer: Buffer = await pdfMake.createPdf(docDef).getBuffer();

    // Buffer<ArrayBufferLike> をそのまま渡すと BodyInit に型が合わないため、
    // ArrayBuffer 裏付けの Uint8Array に包む（送信するバイト列・挙動は同一）。
    const fileName = "給与支払事務所等の開設届出書.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("kyuyo-jimusho PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
