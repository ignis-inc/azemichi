import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

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

    const form = await request.json();

    const dobText = (form.dobEra && form.dobYear && form.dobMonth && form.dobDay)
      ? `${form.dobEra}${form.dobYear}年${form.dobMonth}月${form.dobDay}日`
      : "　　年　　月　　日";

    const address = `${form.prefecture || ""}${form.cityAddress || ""}`;

    const applyGeta    = form.applyGeta    || "（未選択）";
    const applyNarashi = form.applyNarashi || "（未選択）";
    const applyWataden = form.applyWataden || "（未選択）";

    const watadenSubText = (form.watadenSub && form.watadenSub.length > 0)
      ? form.watadenSub.join("・")
      : "（なし）";

    const bankInfo = form.bankStatus === "新規登録・変更"
      ? [
          form.bankName || "　",
          form.branchName ? `${form.branchName}` : "　",
          form.accountType ? `${form.accountType}　${form.accountNumber || "　"}` : "　",
          form.accountHolder || "　",
        ].join(" / ")
      : "変更なし";

    const tableBody = [
      [
        { text: "項　目", style: "tableHeader", fillColor: "#e8f5e9" },
        { text: "内　容", style: "tableHeader", fillColor: "#e8f5e9" },
      ],
      ["申請年産", `令和${form.nenji || "　"}年産`],
      ["申請区分", form.applicationStatus || "（未選択）"],
      ["氏名または法人名（ふりがな）", `${form.name || "　"}（${form.nameKana || "　"}）`],
      ["生年月日", dobText],
      ["経営形態", form.managementType || "（未選択）"],
      ["認定状況", form.certificationStatus || "（未選択）"],
      ["住所", address || "　"],
      ["電話番号", form.phone || "　"],
      ["ゲタ対策（畑作物の直接支払交付金）", applyGeta],
      ["ナラシ対策（収入減少影響緩和交付金）", applyNarashi],
      ["水田活用の直接支払交付金", applyWataden],
      ["水田活用の申請内容", applyWataden === "申請する" ? watadenSubText : "―"],
      ["環境と調和のとれた農業生産の実施", form.envCheck ? "実施する" : "未確認"],
      ["個人情報取扱いへの同意", form.privacyCheck ? "同意する" : "未確認"],
      ["振込口座", bankInfo],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [50, 60, 50, 60],
      defaultStyle: { font: "NotoSansJP", fontSize: 11, lineHeight: 1.6 },
      content: [
        {
          text: "経営所得安定対策等交付金交付申請書（様式第1号A）",
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
          text: "農林水産大臣　殿",
          fontSize: 13,
          margin: [0, 0, 0, 6],
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2 }],
          margin: [0, 4, 0, 14],
        },
        {
          text: "　下記のとおり、経営所得安定対策等交付金の交付を申請します。",
          fontSize: 10,
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            widths: [180, "*"],
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
          "attachment; filename*=UTF-8''%E7%B5%8C%E5%96%B6%E6%89%80%E5%BE%97%E5%AE%89%E5%AE%9A%E5%AF%BE%E7%AD%96%E7%AD%89%E4%BA%A4%E4%BB%98%E9%87%91%E4%BA%A4%E4%BB%98%E7%94%B3%E8%AB%8B%E6%9B%B8.pdf",
      },
    });
  } catch (error) {
    console.error("keiei PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
