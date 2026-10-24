// ラベルの絵を、A4シール用紙のPDFと、コンビニ向けの画像にする。すべてブラウザの中だけで作る。

import type { SheetOption } from "./komeLabelData";
import { OUTPUT_DPI, mmToPx } from "./komeLabelRender";

const A4 = { w: 210, h: 297 };

// 用紙1枚ぶんに、同じラベルをすべての面に並べた絵を作る。
// 余白はエーワンの公式の寸法（komeLabelData の SHEET_OPTIONS）のとおり。offset で微調整できる。
function composeSheet(label: HTMLCanvasElement, sheet: SheetOption, offsetXMm: number, offsetYMm: number): HTMLCanvasElement {
  const pageW = sheet.landscape ? A4.h : A4.w;
  const pageH = sheet.landscape ? A4.w : A4.h;
  const page = document.createElement("canvas");
  page.width = mmToPx(pageW, OUTPUT_DPI);
  page.height = mmToPx(pageH, OUTPUT_DPI);
  const ctx = page.getContext("2d");
  if (!ctx) return page;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.width, page.height);
  const left = sheet.leftMm + offsetXMm;
  const top = sheet.topMm + offsetYMm;
  for (let r = 0; r < sheet.rows; r++) {
    for (let c = 0; c < sheet.cols; c++) {
      const x = mmToPx(left + c * sheet.wMm, OUTPUT_DPI);
      const y = mmToPx(top + r * sheet.hMm, OUTPUT_DPI);
      ctx.drawImage(label, x, y, mmToPx(sheet.wMm, OUTPUT_DPI), mmToPx(sheet.hMm, OUTPUT_DPI));
    }
  }
  return page;
}

// 表のシートと裏のシートを、別々のページにしたPDFを作ってダウンロードさせる
export async function downloadSheetPdf(
  front: HTMLCanvasElement,
  back: HTMLCanvasElement,
  sheet: SheetOption,
  offsetXMm: number,
  offsetYMm: number,
  fileName: string,
): Promise<void> {
  const mod = await import("pdfmake/build/pdfmake");
  const pdfMake = mod.default ?? mod;
  const fontUrl = `${window.location.origin}/fonts/NotoSansJP.ttf`;
  // フォント以外の外部読み込みはさせない（ラベルの絵は data URL で渡す）
  pdfMake.setUrlAccessPolicy((url: string) => url === fontUrl);
  pdfMake.setFonts({
    NotoSansJP: { normal: fontUrl, bold: fontUrl, italics: fontUrl, bolditalics: fontUrl },
  });

  // 表は写真や模様があるので JPEG、裏は文字と線だけなので PNG（文字をくっきりさせる）
  const frontPage = composeSheet(front, sheet, offsetXMm, offsetYMm).toDataURL("image/jpeg", 0.95);
  const backPage = composeSheet(back, sheet, offsetXMm, offsetYMm).toDataURL("image/png");
  const ptW = ((sheet.landscape ? A4.h : A4.w) * 72) / 25.4;

  const docDef = {
    pageSize: "A4",
    pageOrientation: sheet.landscape ? "landscape" : "portrait",
    pageMargins: [0, 0, 0, 0],
    defaultStyle: { font: "NotoSansJP" },
    info: { title: "お米のラベル（あぜみち）" },
    content: [
      { image: frontPage, width: ptW },
      { image: backPage, width: ptW, pageBreak: "before" },
    ],
  };
  await pdfMake.createPdf(docDef).download(fileName);
}

// コンビニのシール紙向けの画像（断裁線なしの全面画像）をダウンロードさせる
export function downloadPng(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("画像を作れませんでした"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
