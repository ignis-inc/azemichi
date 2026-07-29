import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, COMMON_RULES, warekiRules, type FieldRule } from "../formValidation";

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  ...COMMON_RULES,
  ...warekiRules("dob", "生年月日"),
  ...warekiRules("start", "開業年月日"),
  ...warekiRules("paymentStart", "給与の支給開始予定日"),
  myNumber: { label: "個人番号", max: 20 },
  occupation: { label: "職業", max: 30 },
  businessSummary: { label: "事業の概要", max: 200 },
  farmName: { label: "屋号", max: 50 },
  farmNameKana: { label: "屋号のふりがな", max: 50 },
  incomeType: { label: "所得の種類", max: 20 },
  taxLocationType: { label: "納税地の種別", max: 20 },
  taxOffice: { label: "提出先税務署名", max: 50 },
  aoiroSubmission: { label: "青色申告承認申請書の提出の有無", max: 5 },
  professionalCount: { label: "専従者の人数", max: 10 },
  employeeCount: { label: "使用人の人数", max: 10 },
  wageMethod: { label: "給与の定め方", max: 50 },
  withholdingTax: { label: "源泉徴収税額の有無", max: 5 },
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

    const dobText = (form.dobEra && form.dobYear && form.dobMonth && form.dobDay)
      ? `${form.dobEra}${form.dobYear}年${form.dobMonth}月${form.dobDay}日`
      : "　　年　　月　　日";

    const startText = (form.startEra && form.startYear && form.startMonth && form.startDay)
      ? `${form.startEra}${form.startYear}年${form.startMonth}月${form.startDay}日`
      : "　　年　　月　　日";

    const paymentStartText = (form.paymentStartEra && form.paymentStartYear && form.paymentStartMonth && form.paymentStartDay)
      ? `${form.paymentStartEra}${form.paymentStartYear}年${form.paymentStartMonth}月${form.paymentStartDay}日`
      : "（未定）";

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;

    // 「新宿税務署」のように末尾に「税務署」を含めて入力されても、
    // 続く「税務署長　殿」と二重表記にならないよう末尾の「税務署」を取り除く
    const taxOfficeRaw = typeof form.taxOffice === "string" ? form.taxOffice.trim() : "";
    const taxOfficeName = taxOfficeRaw.replace(/税務署$/, "");

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["届出の区分", "開業"],
      ["所得の種類", form.incomeType || "事業所得"],
      ["開業年月日", startText],
      ["納税地の種別", form.taxLocationType || "住所地"],
      ["納税地（住所）", address || "　"],
      ["電話番号", form.phone || "　"],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["生年月日", dobText],
      ["個人番号", form.myNumber || "　"],
      ["職業", form.occupation || "農業"],
      ["屋号（ふりがな）", `${form.farmName || "なし"}（${form.farmNameKana || "　"}）`],
      ["「青色申告承認申請書」の提出", form.aoiroSubmission || "無"],
      ["事業の概要", form.businessSummary || "　"],
    ];

    const wageTableBody = [
      [
        { text: "区分", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["専従者の人数", form.professionalCount ? `${form.professionalCount}人` : "0人"],
      ["使用人の人数", form.employeeCount ? `${form.employeeCount}人` : "0人"],
      ["給与の定め方", form.wageMethod || "　"],
      ["源泉徴収税額の有無", form.withholdingTax || "無"],
      ["支給開始予定日", paymentStartText],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "個人事業の開業・廃業等届出書（開業）",
          fontSize: 16,
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
          text: "　個人事業の開廃業等について、次のとおり届けます。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [150, "*"],
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
          margin: [0, 0, 0, 16],
        },
        {
          text: "給与等の支払の状況",
          bold: true,
          fontSize: 12,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: [150, "*"],
            body: wageTableBody,
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
    const fileName = "個人事業の開業届出書.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("kaigyo PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
