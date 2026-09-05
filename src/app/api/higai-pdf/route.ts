import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, type FieldRule } from "../formValidation";

// 記録1件分の項目（/higaiのEntryと同じ形。すべて文字列で受け取る）
const ENTRY_FIELDS: Record<string, FieldRule> = {
  date: { label: "発生日", max: 20 },
  target: { label: "対象の作物・ほ場", max: 200 },
  damageType: { label: "被害の種類", max: 20 },
  extent: { label: "被害の程度・面積", max: 200 },
  memo: { label: "メモ", max: 1000 },
  photoNote: { label: "写真メモ", max: 200 },
};

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  entries: { label: "記録", type: "objects", maxItems: 1000, fields: ENTRY_FIELDS },
  startDate: { label: "開始日", max: 20 },
  endDate: { label: "終了日", max: 20 },
  damageTypeFilter: { label: "被害の種類のしぼりこみ", max: 20 },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Record<string, any>[] = form.entries ?? [];

    const header = [
      { text: "発生日", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "対象の作物・ほ場", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "被害の種類", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "被害の程度・面積", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "メモ", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "写真メモ", style: "tableHeader", fillColor: "#e8f5e9" },
    ];

    const rows = entries.map((e) => [
      { text: e.date || "　", style: "smallTableCell" },
      { text: e.target || "　", style: "smallTableCell" },
      { text: e.damageType || "　", style: "smallTableCell" },
      { text: e.extent || "　", style: "smallTableCell" },
      { text: e.memo || "　", style: "smallTableCell" },
      { text: e.photoNote || "　", style: "smallTableCell" },
    ]);

    const tableBody = rows.length > 0
      ? [header, ...rows]
      : [header, [{ text: "（対象期間の記録がありません）", colSpan: 6, style: "smallTableCell" }, {}, {}, {}, {}, {}]];

    const conditionLines: string[] = [];
    if (form.startDate || form.endDate) {
      conditionLines.push(`期間：${form.startDate || "（指定なし）"} 〜 ${form.endDate || "（指定なし）"}`);
    }
    if (form.damageTypeFilter) conditionLines.push(`被害の種類：${form.damageTypeFilter}`);

    const docDef = {
      pageSize: "A4",
      pageMargins: [30, 40, 30, 40],
      defaultStyle: { font: "NotoSansJP", fontSize: 10, lineHeight: 1.3 },
      content: [
        {
          text: "被害記録一覧",
          fontSize: 16,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 4],
        },
        {
          text: "この記録は、あぜみちの被害記録ツールで作成した記録用の資料です。正式なり災証明書や共済の届出書ではありません。",
          fontSize: 9,
          alignment: "center",
          color: "#666666",
          margin: [0, 0, 0, 2],
        },
        {
          text: "正式なり災証明・共済金請求については、共済組合または市区町村にご確認ください。",
          fontSize: 9,
          alignment: "center",
          color: "#666666",
          margin: [0, 0, 0, 2],
        },
        {
          text: `出力日：${todayWareki()}`,
          fontSize: 9,
          alignment: "center",
          color: "#666666",
          margin: [0, 0, 0, 10],
        },
        ...(conditionLines.length > 0
          ? [{ text: conditionLines.join("　"), fontSize: 10, bold: true, margin: [0, 0, 0, 10] }]
          : []),
        {
          table: {
            headerRows: 1,
            widths: ["12%", "20%", "12%", "18%", "24%", "14%"],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 1.2 : 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#888888",
            vLineColor: () => "#888888",
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 10 },
        smallTableCell: { fontSize: 9 },
      },
    };

    const pdfBuffer: Buffer = await pdfMake.createPdf(docDef).getBuffer();

    // Buffer<ArrayBufferLike> をそのまま渡すと BodyInit に型が合わないため、
    // ArrayBuffer 裏付けの Uint8Array に包む（送信するバイト列・挙動は同一）。
    const fileName = "被害記録一覧.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("higai PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
