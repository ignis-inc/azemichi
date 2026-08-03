import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, type FieldRule } from "../formValidation";

// 記録1件分の項目（/boujoのEntryと同じ形。すべて文字列で受け取る）
const ENTRY_FIELDS: Record<string, FieldRule> = {
  date: { label: "日付", max: 20 },
  type: { label: "区分", max: 10 },
  field: { label: "圃場", max: 100 },
  crop: { label: "作物", max: 100 },
  name: { label: "名称", max: 200 },
  targetPest: { label: "対象病害虫", max: 100 },
  amount: { label: "使用量", max: 100 },
  dilution: { label: "希釈倍率", max: 100 },
  applicator: { label: "使用者", max: 100 },
  memo: { label: "メモ", max: 500 },
};

// 受信データの検証ルール（型と長さ上限）。ここに無いキーは無視される
const RULES: Record<string, FieldRule> = {
  entries: { label: "記録", type: "objects", maxItems: 1000, fields: ENTRY_FIELDS },
  startDate: { label: "開始日", max: 20 },
  endDate: { label: "終了日", max: 20 },
  fieldFilter: { label: "圃場のしぼりこみ", max: 100 },
  cropFilter: { label: "作物のしぼりこみ", max: 100 },
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
      { text: "日付", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "区分", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "圃場", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "作物", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "名称", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "対象病害虫", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "使用量", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "希釈倍率", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "使用者", style: "tableHeader", fillColor: "#e8f5e9" },
      { text: "メモ", style: "tableHeader", fillColor: "#e8f5e9" },
    ];

    const rows = entries.map((e) => [
      { text: e.date || "　", style: "smallTableCell" },
      { text: e.type || "　", style: "smallTableCell" },
      { text: e.field || "　", style: "smallTableCell" },
      { text: e.crop || "　", style: "smallTableCell" },
      { text: e.name || "　", style: "smallTableCell" },
      { text: e.targetPest || "　", style: "smallTableCell" },
      { text: e.amount || "　", style: "smallTableCell" },
      { text: e.dilution || "　", style: "smallTableCell" },
      { text: e.applicator || "　", style: "smallTableCell" },
      { text: e.memo || "　", style: "smallTableCell" },
    ]);

    const tableBody = rows.length > 0
      ? [header, ...rows]
      : [header, [{ text: "（対象期間の記録がありません）", colSpan: 10, style: "smallTableCell" }, {}, {}, {}, {}, {}, {}, {}, {}, {}]];

    const conditionLines: string[] = [];
    if (form.startDate || form.endDate) {
      conditionLines.push(`期間：${form.startDate || "（指定なし）"} 〜 ${form.endDate || "（指定なし）"}`);
    }
    if (form.fieldFilter) conditionLines.push(`圃場：${form.fieldFilter}`);
    if (form.cropFilter) conditionLines.push(`作物：${form.cropFilter}`);

    const docDef = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [30, 40, 30, 40],
      defaultStyle: { font: "NotoSansJP", fontSize: 10, lineHeight: 1.3 },
      content: [
        {
          text: "農薬・肥料の使用記録",
          fontSize: 16,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 4],
        },
        {
          text: "この記録は、あぜみちの農薬・肥料使用記録ツールで作成したものです。",
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
            widths: ["8%", "6%", "11%", "11%", "16%", "11%", "11%", "9%", "8%", "9%"],
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
    const fileName = "農薬肥料使用記録.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("boujo PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
