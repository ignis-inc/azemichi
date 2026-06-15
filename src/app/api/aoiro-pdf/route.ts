import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

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

    const form = await request.json();

    const dobText = (form.dobEra && form.dobYear && form.dobMonth && form.dobDay)
      ? `${form.dobEra}${form.dobYear}年${form.dobMonth}月${form.dobDay}日`
      : "　　年　　月　　日";

    const startText = (form.startEra && form.startYear && form.startMonth && form.startDay)
      ? `${form.startEra}${form.startYear}年${form.startMonth}月${form.startDay}日`
      : "　　年　　月　　日";

    const farmTypeText = form.farmTypes?.length > 0
      ? form.farmTypes.join("・")
      : "（未選択）";

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["生年月日", dobText],
      ["住所", address || "　"],
      ["電話番号", form.phone || "　"],
      ["個人番号", form.myNumber || "　"],
      ["職業", "農業"],
      ["屋号", form.farmName || "なし"],
      ["農業の種類", farmTypeText],
      ["事業開始年月日", startText],
      ["帳簿の種類", form.bookType || "　"],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "所得税の青色申告承認申請書",
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
          text: `${form.taxOffice || "○○"}税務署長　殿`,
          fontSize: 13,
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、所得税の青色申告の承認を申請します。",
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
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename*=UTF-8''%E9%9D%92%E8%89%B2%E7%94%B3%E5%91%8A%E6%89%BF%E8%AA%8D%E7%94%B3%E8%AB%8B%E6%9B%B8.pdf",
      },
    });
  } catch (error) {
    console.error("aoiro PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
