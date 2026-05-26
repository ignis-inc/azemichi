import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function toWareki(dateStr: string): string {
  if (!dateStr) return "　　年　　月　　日";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let era = "";
  let eraYear = 0;
  if (y >= 2019) { era = "令和"; eraYear = y - 2018; }
  else if (y >= 1989) { era = "平成"; eraYear = y - 1988; }
  else { era = "昭和"; eraYear = y - 1925; }
  return `${era}${eraYear}年${m}月${day}日`;
}

function todayWareki(): string {
  return toWareki(new Date().toISOString().slice(0, 10));
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require("pdfmake/build/pdfmake");

// フォントはサーバー起動時に1回だけ読み込んでキャッシュ
const fontPath = path.join(process.cwd(), "public", "fonts", "YuMincho.ttf");
if (fs.existsSync(fontPath)) {
  const fontData = fs.readFileSync(fontPath);
  pdfMake.virtualfs.storage["YuMincho.ttf"] = fontData;
}
pdfMake.fonts = {
  YuMincho: {
    normal: "YuMincho.ttf",
    bold: "YuMincho.ttf",
    italics: "YuMincho.ttf",
    bolditalics: "YuMincho.ttf",
  },
};

const NOSEI_KYOKU: Record<string, string> = {
  "北海道": "北海道農政事務所",
  "青森県": "東北農政局","岩手県": "東北農政局","宮城県": "東北農政局",
  "秋田県": "東北農政局","山形県": "東北農政局","福島県": "東北農政局",
  "茨城県": "関東農政局","栃木県": "関東農政局","群馬県": "関東農政局",
  "埼玉県": "関東農政局","千葉県": "関東農政局","東京都": "関東農政局",
  "神奈川県": "関東農政局","山梨県": "関東農政局","長野県": "関東農政局",
  "静岡県": "関東農政局",
  "新潟県": "北陸農政局","富山県": "北陸農政局","石川県": "北陸農政局",
  "福井県": "北陸農政局",
  "岐阜県": "東海農政局","愛知県": "東海農政局","三重県": "東海農政局",
  "滋賀県": "近畿農政局","京都府": "近畿農政局","大阪府": "近畿農政局",
  "兵庫県": "近畿農政局","奈良県": "近畿農政局","和歌山県": "近畿農政局",
  "鳥取県": "中国四国農政局","島根県": "中国四国農政局","岡山県": "中国四国農政局",
  "広島県": "中国四国農政局","山口県": "中国四国農政局","徳島県": "中国四国農政局",
  "香川県": "中国四国農政局","愛媛県": "中国四国農政局","高知県": "中国四国農政局",
  "福岡県": "九州農政局","佐賀県": "九州農政局","長崎県": "九州農政局",
  "熊本県": "九州農政局","大分県": "九州農政局","宮崎県": "九州農政局",
  "鹿児島県": "九州農政局",
  "沖縄県": "内閣府沖縄総合事務局",
};

export async function POST(request: NextRequest) {
  try {
    if (!fs.existsSync(fontPath)) {
      return NextResponse.json({ error: "フォントファイルが見つかりません" }, { status: 500 });
    }

    const form = await request.json();

    const nokyo = form.prefecture ? (NOSEI_KYOKU[form.prefecture] ?? "") : "";

    const farmAddress = form.farmAddressSame
      ? `${form.prefecture}${form.cityAddress}`
      : `${form.farmPrefecture}${form.farmCityAddress}`;

    const grainText = form.grainTypes?.length > 0
      ? form.grainTypes.join("・")
      : "（未選択）";

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["氏名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["住所", `${form.prefecture || ""}${form.cityAddress || ""}` || "　"],
      ["電話番号", form.phone || "　"],
      ["農場名", form.farmName || "　"],
      ["事業所住所", farmAddress || "　"],
      ["米穀の種類", grainText],
      ["年間取扱予定数量", `${form.quantity || "0"} 精米トン`],
      ["事業開始予定日", toWareki(form.startDate || "")],
      ["提出先農政局", nokyo ? `${nokyo}長　殿` : "　"],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "YuMincho", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "米穀の出荷又は販売の事業開始届出書",
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
          text: nokyo ? `${nokyo}長　殿` : "農政局長　殿",
          fontSize: 13,
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、米穀の出荷又は販売の事業を開始するので、食糧法第３条第１項の規定により届け出ます。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [140, "*"],
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
                { text: `${form.prefecture || ""}${form.cityAddress || ""}`, margin: [10, 0, 0, 6] },
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
        "Content-Disposition": 'attachment; filename*=UTF-8\'\'%E7%B1%B3%E7%A9%80%E8%B2%A9%E5%A3%B2%E5%B1%8A%E5%87%BA%E6%9B%B8.pdf',
      },
    });
  } catch (error) {
    console.error("PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
