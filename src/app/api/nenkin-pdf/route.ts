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

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

    const farmTypeText = form.farmTypes?.length > 0 ? form.farmTypes.join("・") : "（未選択）";

    const dobText = (form.dobEra && form.dobYear && form.dobMonth && form.dobDay)
      ? `${form.dobEra}${form.dobYear}年${form.dobMonth}月${form.dobDay}日`
      : "　　年　　月　　日";
    const dobWithGender = form.gender ? `${dobText}　（${form.gender}）` : dobText;

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;

    const nenkinLabel = form.nenkinType
      ? `${form.nenkinType}被保険者`
      : "　";

    const destTitleMap: Record<string, string> = {
      "農業協同組合": "組合長",
      "農業委員会": "会長",
    };
    const destTitle = form.submissionDest ? (destTitleMap[form.submissionDest] ?? "長") : "";
    const submissionLabel = form.submissionName && form.submissionDest
      ? `${form.submissionName}　${destTitle}　殿`
      : form.submissionDest
        ? `${form.submissionDest}　殿`
        : "農業協同組合（農業委員会）　殿";

    const premium = form.monthlyPremium ?? 20000;

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["生年月日・性別", dobWithGender],
      ["住所", address || "　"],
      ["電話番号", form.phone || "　"],
      ["農業の種類", farmTypeText],
      ["農業従事日数（年間）", form.workDays ? `${form.workDays} 日` : "　"],
      ["農地面積", form.farmArea ? `${form.farmArea} ha` : "　"],
      ["国民年金の被保険者種別", nenkinLabel],
      ["月額保険料", `${formatNum(premium)} 円`],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "農業者年金通常加入申込書（様式第１号）",
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
          text: submissionLabel,
          fontSize: 13,
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、農業者年金基金の通常加入を申し込みます。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [155, "*"],
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
            { text: "申込者", width: 50, bold: true },
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

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename*=UTF-8\'\'%E8%BE%B2%E6%A5%AD%E8%80%85%E5%B9%B4%E9%87%91%E9%80%9A%E5%B8%B8%E5%8A%A0%E5%85%A5%E7%94%B3%E8%BE%BC%E6%9B%B8.pdf',
      },
    });
  } catch (error) {
    console.error("nenkin PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
