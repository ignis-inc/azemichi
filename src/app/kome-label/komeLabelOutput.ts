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

// PNGに「300dpi」の情報（pHYsチャンク）を入れる。コンビニの機械が大きさを決めるときの手がかりになる。
// pHYs は 1メートルあたりの点の数。300dpi = 300 / 0.0254 = 11811（四捨五入）。
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function addPngDpi(png: Uint8Array, dpi: number): Uint8Array {
  const sig = 8;
  const ihdrEnd = sig + 8 + 13 + 4; // 署名 + (長さ・種類) + IHDR本体 + CRC
  const perMeter = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21); // 長さ4 + 種類4 + 本体9 + CRC4
  const v = new DataView(chunk.buffer);
  v.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  v.setUint32(8, perMeter);
  v.setUint32(12, perMeter);
  chunk[16] = 1; // 単位：メートル
  v.setUint32(17, crc32(chunk.subarray(4, 17)));
  // すでに pHYs があれば作り直さずそのまま返す（canvas の出力には通常ない）
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

// コンビニのシール紙向けの画像（断裁線なしの全面画像・300dpi）をダウンロードさせる
export function downloadPng(canvas: HTMLCanvasElement, fileName: string, dpi = 300): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("画像を作れませんでした"));
        return;
      }
      try {
        const bytes = addPngDpi(new Uint8Array(await blob.arrayBuffer()), dpi);
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      } catch (e) {
        reject(e);
      }
    }, "image/png");
  });
}
