import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { validateForm, type FieldRule } from "../formValidation";

// 金額項目共通のルール（マイナス値は不可、上限は現実的な範囲で防御）
const AMOUNT: FieldRule = { label: "金額", type: "number", min: 0, maxNum: 999999999 };

// 受信データの検証ルール。/kicho の記帳データから集計された科目別合計と、
// 減価償却費・棚卸高などの手入力値を受け取る（型と長さ上限のみ検証。ここに無いキーは無視される）
const RULES: Record<string, FieldRule> = {
  name: { label: "氏名", required: true, max: 50 },
  address: { label: "住所", max: 100 },
  farmName: { label: "屋号", max: 50 },
  year: { label: "年分", required: true, max: 10 },
  // 手入力（/kichoのデータに存在しないため空欄・後から記入する前提）
  openingInventory: { ...AMOUNT, label: "期首棚卸高" },
  closingInventory: { ...AMOUNT, label: "期末棚卸高" },
  depreciation: { ...AMOUNT, label: "減価償却費" },
  // 収入（/kichoのINCOME_CATEGORIESの集計値）
  incomeSales: { ...AMOUNT, label: "農産物売上（販売金額）" },
  incomeHousehold: { ...AMOUNT, label: "家事消費・事業消費" },
  incomeMisc: { ...AMOUNT, label: "雑収入" },
  incomeOther: { ...AMOUNT, label: "その他の収入" },
  // 経費（/kichoのEXPENSE_CATEGORIESの集計値。減価償却費のみ手入力）
  expenseTax: { ...AMOUNT, label: "租税公課" },
  expenseSeedling: { ...AMOUNT, label: "種苗費" },
  expenseLivestock: { ...AMOUNT, label: "素畜費" },
  expenseFertilizer: { ...AMOUNT, label: "肥料費" },
  expenseFeed: { ...AMOUNT, label: "飼料費" },
  expenseTools: { ...AMOUNT, label: "農具費" },
  expensePesticide: { ...AMOUNT, label: "農薬衛生費" },
  expenseMaterials: { ...AMOUNT, label: "諸材料費" },
  expenseRepair: { ...AMOUNT, label: "修繕費" },
  expenseUtilities: { ...AMOUNT, label: "動力光熱費" },
  expenseWorkwear: { ...AMOUNT, label: "作業用衣料費" },
  expenseInsurance: { ...AMOUNT, label: "農業共済掛金" },
  expenseShipping: { ...AMOUNT, label: "荷造運賃手数料" },
  expenseLandImprovement: { ...AMOUNT, label: "土地改良費" },
  expenseWages: { ...AMOUNT, label: "雇人費" },
  expenseRent: { ...AMOUNT, label: "小作料・賃借料" },
  expenseInterest: { ...AMOUNT, label: "利子割引料" },
  expenseCommission: { ...AMOUNT, label: "委託費用" },
  expenseMisc: { ...AMOUNT, label: "雑費" },
  expenseOther: { ...AMOUNT, label: "その他の経費" },
};

function todayWareki(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const eraYear = y - 2018;
  return `令和${eraYear}年${m}月${d}日`;
}

function yen(n: number): string {
  return `${n.toLocaleString("ja-JP")}円`;
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
    const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

    const opening = num(form.openingInventory);
    const closing = num(form.closingInventory);
    const depreciation = num(form.depreciation);

    const incomeRows: [string, number][] = [
      ["農産物売上（販売金額）", num(form.incomeSales)],
      ["家事消費・事業消費", num(form.incomeHousehold)],
      ["雑収入", num(form.incomeMisc)],
      ["その他の収入", num(form.incomeOther)],
    ];
    const incomeSubtotal = incomeRows.reduce((sum, [, v]) => sum + v, 0);
    const incomeTotal = incomeSubtotal + closing - opening;

    const expenseRows: [string, number, boolean][] = [
      ["租税公課", num(form.expenseTax), false],
      ["種苗費", num(form.expenseSeedling), false],
      ["素畜費", num(form.expenseLivestock), false],
      ["肥料費", num(form.expenseFertilizer), false],
      ["飼料費", num(form.expenseFeed), false],
      ["農具費", num(form.expenseTools), false],
      ["農薬衛生費", num(form.expensePesticide), false],
      ["諸材料費", num(form.expenseMaterials), false],
      ["修繕費", num(form.expenseRepair), false],
      ["動力光熱費", num(form.expenseUtilities), false],
      ["作業用衣料費", num(form.expenseWorkwear), false],
      ["農業共済掛金", num(form.expenseInsurance), false],
      ["減価償却費", depreciation, true],
      ["荷造運賃手数料", num(form.expenseShipping), false],
      ["土地改良費", num(form.expenseLandImprovement), false],
      ["雇人費", num(form.expenseWages), false],
      ["小作料・賃借料", num(form.expenseRent), false],
      ["利子割引料", num(form.expenseInterest), false],
      ["委託費用", num(form.expenseCommission), false],
      ["雑費", num(form.expenseMisc), false],
      ["その他の経費", num(form.expenseOther), false],
    ];
    const expenseTotal = expenseRows.reduce((sum, [, v]) => sum + v, 0);
    const balance = incomeTotal - expenseTotal;

    const yearLabel = /^\d+$/.test(String(form.year)) ? `${form.year}年分` : String(form.year);

    const sectionHeaderRow = (text: string) => [
      { text, colSpan: 2, style: "tableHeader", fillColor: "#e8f5e9" },
      {},
    ];

    const incomeTableBody = [
      sectionHeaderRow("収入の部"),
      ...incomeRows.map(([label, amount]) => [label, { text: yen(amount), alignment: "right" }]),
      ["期首棚卸高（手入力・マイナス）", { text: `－${yen(opening)}`, alignment: "right" }],
      ["期末棚卸高（手入力）", { text: yen(closing), alignment: "right" }],
      [
        { text: "収入金額計", bold: true },
        { text: yen(incomeTotal), alignment: "right", bold: true },
      ],
    ];

    const expenseTableBody = [
      sectionHeaderRow("経費の部"),
      ...expenseRows.map(([label, amount, isManual]) => [
        isManual ? `${label}（手入力）` : label,
        { text: yen(amount), alignment: "right" },
      ]),
      [
        { text: "経費計", bold: true },
        { text: yen(expenseTotal), alignment: "right", bold: true },
      ],
    ];

    const docDef = {
      pageSize: "A4",
      pageMargins: [45, 55, 45, 55],
      defaultStyle: { font: "NotoSansJP", fontSize: 10, lineHeight: 1.4 },
      content: [
        {
          text: "所得税青色申告決算書（農業所得用）－ 損益計算書",
          fontSize: 15,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 4],
        },
        {
          text: "（あぜみちの記帳データから自動生成した参考資料・1ページ目相当）",
          fontSize: 9,
          alignment: "center",
          color: "#666666",
          margin: [0, 0, 0, 12],
        },
        {
          columns: [
            { text: yearLabel, bold: true, fontSize: 13 },
            { text: `作成日：${todayWareki()}`, alignment: "right", fontSize: 9, color: "#666666" },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: [70, "*"],
            body: [
              ["氏名", form.name || "　"],
              ["住所", form.address || "　"],
              ["屋号", form.farmName || "　"],
            ],
          },
          layout: {
            hLineWidth: () => 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#aaaaaa",
            vLineColor: () => "#aaaaaa",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 16],
        },
        {
          table: { widths: [280, "*"], body: incomeTableBody },
          layout: {
            hLineWidth: () => 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#aaaaaa",
            vLineColor: () => "#aaaaaa",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
          margin: [0, 0, 0, 14],
        },
        {
          table: { widths: [280, "*"], body: expenseTableBody },
          layout: {
            hLineWidth: () => 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#aaaaaa",
            vLineColor: () => "#aaaaaa",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
          margin: [0, 0, 0, 14],
        },
        {
          table: {
            widths: [280, "*"],
            body: [
              [
                { text: "差引金額（青色申告特別控除前の所得金額）", bold: true, fillColor: "#e8f5e9" },
                { text: yen(balance), alignment: "right", bold: true, fillColor: "#e8f5e9" },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1.2,
            vLineWidth: () => 1.2,
            hLineColor: () => "#2e7d32",
            vLineColor: () => "#2e7d32",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 18],
        },
        {
          text:
            "※ この書類は/kichoの記帳データ（収入・経費の科目別合計）から損益計算書（決算書1ページ目相当）だけを自動生成した参考資料です。" +
            "期首・期末棚卸高、減価償却費は手入力の値です。専従者給与・貸倒引当金・青色申告特別控除額の欄、2〜4ページ目（収入金額の内訳、減価償却費の計算、貸借対照表）は含まれていません。" +
            "65万円・55万円の青色申告特別控除を受けるには複式簿記による貸借対照表の作成が必要です。正式な提出書類としての要件充足はご自身でご確認いただくか、税理士にご相談ください。",
          fontSize: 8,
          color: "#666666",
          lineHeight: 1.5,
        },
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 10 },
      },
    };

    const pdfBuffer: Buffer = await pdfMake.createPdf(docDef).getBuffer();

    // Buffer<ArrayBufferLike> をそのまま渡すと BodyInit に型が合わないため、
    // ArrayBuffer 裏付けの Uint8Array に包む（送信するバイト列・挙動は同一）
    const fileName = `青色申告決算書_損益計算書_${form.year}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("kessansho PDF生成エラー:", error);
    return NextResponse.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  }
}
