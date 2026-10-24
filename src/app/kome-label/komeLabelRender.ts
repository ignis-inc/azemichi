// ラベルの絵をブラウザの中（canvas）で描く。PDFも画像も、ここで描いた絵を使う。
// 入力内容やロゴ・写真はサーバーへ送らない。

import type { BackModel, Design, FrontModel } from "./komeLabelData";

// JIS Z 8305 の1ポイント（mm）
export const JIS_PT_MM = 0.3514;
export const OUTPUT_DPI = 300;

export type Fonts = { sans: string; mincho: string; brush: string };
export type LabelImageElements = { logo: HTMLImageElement | null; photo: HTMLImageElement | null };

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / 25.4);
}

export function makeCanvas(wMm: number, hMm: number, dpi: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = mmToPx(wMm, dpi);
  c.height = mmToPx(hMm, dpi);
  return c;
}

// 描く前に、使う文字のフォントを読み込んでおく（日本語フォントは文字ごとに分かれて読み込まれるため）
export async function ensureFonts(fonts: Fonts, text: string): Promise<void> {
  const sample = `${text}0123456789産地品種産年使用割合名称原料玄米単一複数内容量精米調製時期販売者工場電話番号国内割上中下旬令和年月日`;
  await Promise.all([
    document.fonts.load(`400 24px ${fonts.sans}`, sample),
    document.fonts.load(`700 24px ${fonts.sans}`, sample),
    document.fonts.load(`500 24px ${fonts.mincho}`, sample),
    document.fonts.load(`700 24px ${fonts.mincho}`, sample),
    document.fonts.load(`400 24px ${fonts.brush}`, sample),
  ]);
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ---- 共通の小さな部品 ----

type Ctx = CanvasRenderingContext2D;

function font(weight: number, px: number, family: string): string {
  return `${weight} ${px}px ${family}`;
}

// 行頭に来てはいけない記号（簡単な禁則処理）
const NO_LINE_START = "、。，．・：；？！）」』】〕ー～ぁぃぅぇぉっゃゅょァィゥェォッャュョ";

// 数字や英字のつながり（電話番号・番地など）は、途中で改行しない。1行に入りきらないときだけ文字ごとに分ける。
function wrapText(ctx: Ctx, text: string, maxW: number): string[] {
  const tokens = text.match(/[0-9A-Za-z\-‐－().,]+|./gu) ?? [];
  const lines: string[] = [];
  let line = "";
  const push = (piece: string) => {
    if (line && ctx.measureText(line + piece).width > maxW) {
      if (NO_LINE_START.includes(piece) && Array.from(line).length > 1) {
        const chars = Array.from(line);
        const last = chars.pop() ?? "";
        lines.push(chars.join(""));
        line = last + piece;
      } else {
        lines.push(line.replace(/\s+$/u, ""));
        line = piece.trim() ? piece : "";
      }
    } else {
      line += piece;
    }
  };
  for (const tok of tokens) {
    if (tok.length > 1 && ctx.measureText(tok).width > maxW) {
      for (const ch of Array.from(tok)) push(ch);
    } else {
      push(tok);
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// 幅と高さに収まる文字の大きさ（px）
function fitSize(ctx: Ctx, text: string, weight: number, family: string, maxW: number, maxH: number): number {
  ctx.font = font(weight, 100, family);
  const w = ctx.measureText(text).width || 1;
  return Math.max(4, Math.min(maxH, (100 * maxW) / w));
}

function drawFitted(
  ctx: Ctx,
  text: string,
  opts: { x: number; y: number; maxW: number; maxH: number; weight: number; family: string; color: string; align?: CanvasTextAlign },
): number {
  if (!text) return 0;
  const size = fitSize(ctx, text, opts.weight, opts.family, opts.maxW, opts.maxH);
  ctx.font = font(opts.weight, size, opts.family);
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, opts.x, opts.y);
  return size;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawContain(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

// 新米・無洗米などの小さな札を横に並べる
function drawBadges(
  ctx: Ctx,
  badges: string[],
  cx: number,
  cy: number,
  h: number,
  maxW: number,
  style: { family: string; weight: number; stroke: string; fill: string; text: string },
) {
  if (!badges.length) return;
  let size = h * 0.6;
  const gap = h * 0.35;
  const widths = () => {
    ctx.font = font(style.weight, size, style.family);
    return badges.map((b) => ctx.measureText(b).width + size * 1.1);
  };
  let ws = widths();
  let total = ws.reduce((a, b) => a + b, 0) + gap * (badges.length - 1);
  if (total > maxW) {
    size *= maxW / total;
    ws = widths();
    total = ws.reduce((a, b) => a + b, 0) + gap * (badges.length - 1);
  }
  const bh = size * 1.55;
  let x = cx - total / 2;
  badges.forEach((b, k) => {
    roundRect(ctx, x, cy - bh / 2, ws[k], bh, bh * 0.22);
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.09);
    ctx.strokeStyle = style.stroke;
    ctx.stroke();
    ctx.fillStyle = style.text;
    ctx.font = font(style.weight, size, style.family);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b, x + ws[k] / 2, cy + size * 0.04);
    x += ws[k] + gap;
  });
}

// 決まった並び（同じ乱数）で模様を描くための乱数
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// 上から順に積む部品。高さの割合に合わせて配置し、余りは部品の間に均等に分ける
type StackItem = { h: number; draw: (cy: number, h: number) => void };

function layoutStack(items: StackItem[], top: number, bottom: number) {
  const avail = bottom - top;
  const total = items.reduce((a, it) => a + it.h, 0);
  const scale = total > avail ? avail / total : 1;
  const gap = total > avail ? 0 : (avail - total) / (items.length + 1);
  let y = top + gap;
  for (const it of items) {
    const h = it.h * scale;
    it.draw(y + h / 2, h);
    y += h + gap;
  }
}

// ---- 表（デザイン面） ----

// ラベルの端から内側へ空ける幅（mm）。背景の色や模様はこの内側だけに塗り、
// 用紙の上でラベルとラベルのすき間（と端）は白のままにする。
export const FRONT_INSET_MM = 1.5;

export function renderFront(
  canvas: HTMLCanvasElement,
  wMm: number,
  model: FrontModel,
  design: Design,
  color: string,
  images: LabelImageElements,
  fonts: Fonts,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const inset = (canvas.width / wMm) * FRONT_INSET_MM;
  const W = canvas.width - 2 * inset;
  const H = canvas.height - 2 * inset;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(inset, inset);
  roundRect(ctx, 0, 0, W, H, inset);
  ctx.clip();
  if (design === "washi") drawWashi(ctx, W, H, model, color, images, fonts);
  else if (design === "tanbo") drawTanbo(ctx, W, H, model, color, images, fonts);
  else if (design === "fude") drawFude(ctx, W, H, model, color, images, fonts);
  else drawPhoto(ctx, W, H, model, color, images, fonts);
  ctx.restore();
}

function drawWashi(ctx: Ctx, W: number, H: number, m: FrontModel, color: string, img: LabelImageElements, f: Fonts) {
  const u = Math.min(W, H) / 100;
  ctx.fillStyle = "#f5eedb";
  ctx.fillRect(0, 0, W, H);
  // 和紙のすじ
  const rnd = seeded(7);
  ctx.lineCap = "round";
  const fibers = Math.round((W * H) / (u * u * 6));
  for (let k = 0; k < fibers; k++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const len = u * (1.5 + rnd() * 5);
    const a = rnd() * Math.PI;
    ctx.strokeStyle = `rgba(150,120,70,${0.05 + rnd() * 0.07})`;
    ctx.lineWidth = u * (0.08 + rnd() * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + u, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  // 二重の枠
  const b = u * 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = u * 0.7;
  ctx.strokeRect(b, b, W - 2 * b, H - 2 * b);
  ctx.lineWidth = u * 0.25;
  ctx.strokeRect(b + u * 1.6, b + u * 1.6, W - 2 * (b + u * 1.6), H - 2 * (b + u * 1.6));

  const cx = W / 2;
  const maxW = W - 2 * (b + u * 6);
  const ink = "#2b2116";
  const items: StackItem[] = [];
  if (m.catchCopy) items.push({ h: H * 0.08, draw: (cy, h) => drawFitted(ctx, m.catchCopy, { x: cx, y: cy, maxW, maxH: h, weight: 500, family: f.mincho, color }) });
  items.push({ h: H * 0.3, draw: (cy, h) => drawFitted(ctx, m.big, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.mincho, color: ink }) });
  if (m.originLine) items.push({ h: H * 0.075, draw: (cy, h) => drawFitted(ctx, m.originLine, { x: cx, y: cy, maxW, maxH: h, weight: 500, family: f.mincho, color: ink }) });
  if (m.badges.length) items.push({ h: H * 0.085, draw: (cy, h) => drawBadges(ctx, m.badges, cx, cy, h, maxW, { family: f.mincho, weight: 700, stroke: color, fill: "rgba(255,255,255,0.5)", text: color }) });
  if (m.kindLine) items.push({ h: H * 0.06, draw: (cy, h) => drawFitted(ctx, m.kindLine, { x: cx, y: cy, maxW, maxH: h, weight: 500, family: f.mincho, color: ink }) });
  if (img.logo) items.push({ h: H * 0.13, draw: (cy, h) => drawContain(ctx, img.logo!, cx - maxW / 2, cy - h / 2, maxW, h) });
  if (m.farm) items.push({ h: H * 0.085, draw: (cy, h) => drawFitted(ctx, m.farm, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.mincho, color }) });
  layoutStack(items, b + u * 3, H - b - u * 3);
}

function drawTanbo(ctx: Ctx, W: number, H: number, m: FrontModel, color: string, img: LabelImageElements, f: Fonts) {
  const u = Math.min(W, H) / 100;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hexToRgba(color, 0.06);
  ctx.fillRect(0, 0, W, H);
  // お日さま
  ctx.fillStyle = hexToRgba(color, 0.14);
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.12, Math.min(W, H) * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // 田んぼ（重なった畦）
  const base = H * 0.7;
  const bands = [0.3, 0.55, 0.92];
  bands.forEach((alpha, k) => {
    const top = base + k * H * 0.075;
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, top);
    const waves = 3;
    for (let w = 0; w < waves; w++) {
      const x0 = (W / waves) * w;
      const x1 = (W / waves) * (w + 1);
      ctx.quadraticCurveTo((x0 + x1) / 2, top - H * (0.04 - k * 0.008) * (w % 2 ? -1 : 1), x1, top);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  });
  // 稲穂
  const rnd = seeded(11);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineCap = "round";
  ctx.lineWidth = u * 0.5;
  for (let k = 0; k < 26; k++) {
    const x = rnd() * W;
    const y = base + H * 0.02 + rnd() * H * 0.12;
    const len = u * (2 + rnd() * 3);
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.quadraticCurveTo(x + len * 0.2, y + len * 0.3, x + len * 0.7, y);
    ctx.stroke();
  }

  const cx = W / 2;
  const maxW = W - u * 14;
  const dark = "#1f2a1d";
  if (img.logo) drawContain(ctx, img.logo, u * 4, u * 4, Math.min(W, H) * 0.2, Math.min(W, H) * 0.2);
  const items: StackItem[] = [];
  if (m.badges.length) items.push({ h: H * 0.08, draw: (cy, h) => drawBadges(ctx, m.badges, cx, cy, h, maxW, { family: f.sans, weight: 700, stroke: color, fill: "#ffffff", text: color }) });
  items.push({ h: H * 0.27, draw: (cy, h) => drawFitted(ctx, m.big, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.sans, color: dark }) });
  if (m.originLine) items.push({ h: H * 0.07, draw: (cy, h) => drawFitted(ctx, m.originLine, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.sans, color }) });
  if (m.catchCopy) items.push({ h: H * 0.065, draw: (cy, h) => drawFitted(ctx, m.catchCopy, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.sans, color: dark }) });
  if (m.kindLine) items.push({ h: H * 0.055, draw: (cy, h) => drawFitted(ctx, m.kindLine, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.sans, color: dark }) });
  layoutStack(items, img.logo ? Math.min(W, H) * 0.12 : u * 3, base - H * 0.04);
  if (m.farm) drawFitted(ctx, m.farm, { x: cx, y: base + H * 0.15 + (H - base - H * 0.15) / 2, maxW, maxH: H * 0.08, weight: 700, family: f.sans, color: "#ffffff" });
}

function drawFude(ctx: Ctx, W: number, H: number, m: FrontModel, color: string, img: LabelImageElements, f: Fonts) {
  const u = Math.min(W, H) / 100;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const b = u * 3.5;
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = u * 0.35;
  ctx.strokeRect(b, b, W - 2 * b, H - 2 * b);

  const cx = W / 2;
  const maxW = W - 2 * (b + u * 6);
  const ink = "#111111";
  // 落款（はんこ）風の印。白黒印刷では灰色になる
  const stampText = m.badges.includes("新米") ? "新米" : Array.from(m.farm || m.big || "米")[0];
  const st = Math.min(W, H) * 0.15;
  const sx = W - b - u * 3 - st;
  const sy = b + u * 3;
  ctx.fillStyle = color;
  roundRect(ctx, sx, sy, st, st, st * 0.08);
  ctx.fill();
  drawFitted(ctx, stampText, { x: sx + st / 2, y: sy + st / 2, maxW: st * 0.82, maxH: st * (stampText.length > 1 ? 0.42 : 0.72), weight: 400, family: f.brush, color: "#ffffff" });

  const badges = m.badges.filter((x) => x !== "新米");
  const items: StackItem[] = [];
  // ひとことは、右上の印と重ならないように左へ寄せる
  const catchShift = (st + u * 3) / 2;
  if (m.catchCopy) items.push({ h: H * 0.085, draw: (cy, h) => drawFitted(ctx, m.catchCopy, { x: cx - catchShift, y: cy, maxW: maxW - st - u * 3, maxH: h, weight: 400, family: f.brush, color: "#333333" }) });
  items.push({
    h: H * 0.36,
    draw: (cy, h) => {
      // 墨のにじみ
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.05, maxW * 0.5, h * 0.42, -0.06, 0, Math.PI * 2);
      ctx.fill();
      drawFitted(ctx, m.big, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.brush, color: ink });
    },
  });
  items.push({
    h: H * 0.02,
    draw: (cy) => {
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = u * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - maxW * 0.35, cy);
      ctx.lineTo(cx + maxW * 0.35, cy);
      ctx.stroke();
    },
  });
  if (m.originLine) items.push({ h: H * 0.065, draw: (cy, h) => drawFitted(ctx, m.originLine, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.sans, color: ink }) });
  if (badges.length) items.push({ h: H * 0.075, draw: (cy, h) => drawBadges(ctx, badges, cx, cy, h, maxW, { family: f.sans, weight: 700, stroke: "#111111", fill: "#ffffff", text: "#111111" }) });
  if (m.kindLine) items.push({ h: H * 0.055, draw: (cy, h) => drawFitted(ctx, m.kindLine, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.sans, color: ink }) });
  if (img.logo) items.push({ h: H * 0.12, draw: (cy, h) => drawContain(ctx, img.logo!, cx - maxW / 2, cy - h / 2, maxW, h) });
  if (m.farm) items.push({ h: H * 0.09, draw: (cy, h) => drawFitted(ctx, m.farm, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.brush, color: ink }) });
  layoutStack(items, b + u * 2, H - b - u * 2);
}

function drawPhoto(ctx: Ctx, W: number, H: number, m: FrontModel, color: string, img: LabelImageElements, f: Fonts) {
  const u = Math.min(W, H) / 100;
  const landscape = W > H * 1.15;
  // 写真の場所と、文字を置く帯の場所
  const ph = landscape ? { x: 0, y: 0, w: W * 0.55, h: H } : { x: 0, y: 0, w: W, h: H * 0.6 };
  const pn = landscape ? { x: W * 0.55, y: 0, w: W * 0.45, h: H } : { x: 0, y: H * 0.6, w: W, h: H * 0.4 };

  if (img.photo) {
    drawCover(ctx, img.photo, ph.x, ph.y, ph.w, ph.h);
  } else {
    // 写真がないときは、色の濃淡と稲穂の模様
    const g = ctx.createLinearGradient(0, 0, ph.w, ph.h);
    g.addColorStop(0, hexToRgba(color, 0.35));
    g.addColorStop(1, hexToRgba(color, 0.75));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);
    ctx.fillStyle = g;
    ctx.fillRect(ph.x, ph.y, ph.w, ph.h);
    const rnd = seeded(5);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = u * 0.6;
    ctx.lineCap = "round";
    for (let k = 0; k < 40; k++) {
      const x = ph.x + rnd() * ph.w;
      const y = ph.y + rnd() * ph.h;
      const len = u * (4 + rnd() * 6);
      ctx.beginPath();
      ctx.moveTo(x, y + len);
      ctx.quadraticCurveTo(x + len * 0.15, y + len * 0.4, x + len * 0.6, y);
      ctx.stroke();
    }
  }
  if (m.catchCopy) {
    const bh = Math.min(ph.h * 0.14, H * 0.1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(ph.x, ph.y + ph.h - bh, ph.w, bh);
    drawFitted(ctx, m.catchCopy, { x: ph.x + ph.w / 2, y: ph.y + ph.h - bh / 2, maxW: ph.w - u * 8, maxH: bh * 0.62, weight: 700, family: f.sans, color: "#ffffff" });
  }
  if (img.logo) {
    const s = Math.min(W, H) * 0.2;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    roundRect(ctx, ph.x + u * 3, ph.y + u * 3, s, s, s * 0.12);
    ctx.fill();
    drawContain(ctx, img.logo, ph.x + u * 4, ph.y + u * 4, s - u * 2, s - u * 2);
  }

  ctx.fillStyle = color;
  ctx.fillRect(pn.x, pn.y, pn.w, pn.h);
  const cx = pn.x + pn.w / 2;
  const maxW = pn.w - u * 10;
  const items: StackItem[] = [];
  items.push({ h: pn.h * 0.36, draw: (cy, h) => drawFitted(ctx, m.big, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.sans, color: "#ffffff" }) });
  if (m.originLine) items.push({ h: pn.h * 0.13, draw: (cy, h) => drawFitted(ctx, m.originLine, { x: cx, y: cy, maxW, maxH: h, weight: 700, family: f.sans, color: "#ffffff" }) });
  if (m.badges.length) items.push({ h: pn.h * 0.15, draw: (cy, h) => drawBadges(ctx, m.badges, cx, cy, h, maxW, { family: f.sans, weight: 700, stroke: "#ffffff", fill: "rgba(255,255,255,0.12)", text: "#ffffff" }) });
  const bottom = [m.kindLine, m.farm].filter(Boolean).join("　");
  if (bottom) items.push({ h: pn.h * 0.12, draw: (cy, h) => drawFitted(ctx, bottom, { x: cx, y: cy, maxW, maxH: h, weight: 400, family: f.sans, color: "#ffffff" }) });
  layoutStack(items, pn.y + u * 2, pn.y + pn.h - u * 2);
}

// ---- 裏（一括表示） ----

type Op =
  | { t: "text"; s: string; x: number; y: number; align: CanvasTextAlign }
  | { t: "line"; x1: number; y1: number; x2: number; y2: number; w: number }
  | { t: "rect"; x: number; y: number; w: number; h: number; lw: number };

// stacked: 産地・品種・産年を欄に分けられず、縦に並べたとき
type BackLayout = { ops: Op[]; height: number; ok: boolean; stacked: boolean };

function layoutBack(ctx: Ctx, m: BackModel, fs: number, family: string, x0: number, y0: number, availW: number): BackLayout {
  ctx.font = font(400, fs, family);
  const lineH = fs * 1.32;
  const padX = fs * 0.35;
  let stacked = false;
  const padY = fs * 0.28;
  const ops: Op[] = [];
  const thin = Math.max(1, fs * 0.07);
  const tw = (s: string) => ctx.measureText(s).width;

  const rows: { label: string; build: (x: number, y: number, w: number) => number }[] = [];

  // 文字の行を積む（返り値は使った高さ）
  const textBlock = (texts: string[]) => (x: number, y: number, w: number) => {
    let h = padY;
    for (const s of texts) {
      for (const line of wrapText(ctx, s, w - 2 * padX)) {
        ops.push({ t: "text", s: line, x: x + padX, y: y + h + lineH / 2, align: "left" });
        h += lineH;
      }
    }
    return h + padY;
  };

  rows.push({ label: "名称", build: textBlock([m.name]) });

  rows.push({
    label: "原料玄米",
    build: (x, y, w) => {
      const heads = m.single ? ["産地", "品種", "産年"] : ["産地", "使用割合"];
      const vals = m.single ? [m.origin, m.variety, m.year] : [m.origin, "10割"];
      // 欄の中の余白は少し狭くして、できるだけ欄に分けて書けるようにする
      const natural = heads.map((hd, k) => Math.max(tw(hd), tw(vals[k])) + 1.4 * padX);
      const sum = natural.reduce((a, b) => a + b, 0);
      let h = 0;
      if (sum <= w) {
        // 欄を分けて書く（産地｜品種｜産年）
        const extra = (w - sum) / heads.length;
        const cols = natural.map((n) => n + extra);
        const rowH = lineH + 2 * padY;
        // 見出し
        let cx = x;
        heads.forEach((hd, k) => {
          ops.push({ t: "text", s: hd, x: cx + padX * 0.7, y: y + rowH / 2, align: "left" });
          if (k > 0) ops.push({ t: "line", x1: cx, y1: y, x2: cx, y2: y + rowH, w: thin });
          cx += cols[k];
        });
        h += rowH;
        ops.push({ t: "line", x1: x, y1: y + h, x2: x + w, y2: y + h, w: thin });
        // 単一原料米／複数原料米
        ops.push({ t: "text", s: m.single ? "単一原料米" : "複数原料米", x: x + padX, y: y + h + rowH / 2, align: "left" });
        h += rowH;
        ops.push({ t: "line", x1: x, y1: y + h, x2: x + w, y2: y + h, w: thin });
        // 値（見出しと同じ位置で区切る）
        cx = x;
        vals.forEach((v, k) => {
          ops.push({ t: "text", s: v, x: cx + padX * 0.7, y: y + h + rowH / 2, align: "left" });
          if (k > 0) ops.push({ t: "line", x1: cx, y1: y + h, x2: cx, y2: y + h + rowH, w: thin });
          cx += cols[k];
        });
        h += rowH;
      } else {
        // 幅が足りないときは、項目名をつけて縦に並べる
        stacked = true;
        const lines = [m.single ? "単一原料米" : "複数原料米", ...heads.map((hd, k) => `${hd}：${vals[k]}`)];
        h += textBlock(lines)(x, y, w);
      }
      if (m.method) {
        ops.push({ t: "line", x1: x, y1: y + h, x2: x + w, y2: y + h, w: thin });
        h += textBlock([m.method])(x, y + h, w);
      }
      return h;
    },
  });

  rows.push({ label: "内容量", build: textBlock([m.amount]) });
  rows.push({ label: m.dateLabel, build: textBlock([m.date]) });
  rows.push({ label: m.roleLabel, build: textBlock([m.sellerName, m.sellerAddress, `電話番号　${m.sellerPhone}`]) });

  const leftW = Math.max(...rows.map((r) => tw(r.label))) + 2 * padX;
  const rightW = availW - leftW;
  if (rightW < fs * 6) return { ops: [], height: Infinity, ok: false, stacked };

  let y = y0;
  for (const r of rows) {
    const h = Math.max(r.build(x0 + leftW, y, rightW), lineH + 2 * padY);
    ops.push({ t: "text", s: r.label, x: x0 + padX, y: y + Math.min(h, lineH + 2 * padY) / 2, align: "left" });
    ops.push({ t: "line", x1: x0 + leftW, y1: y, x2: x0 + leftW, y2: y + h, w: thin });
    y += h;
    ops.push({ t: "line", x1: x0, y1: y, x2: x0 + availW, y2: y, w: thin });
  }
  ops.push({ t: "rect", x: x0, y: y0, w: availW, h: y - y0, lw: thin * 1.6 });

  // 枠の外に書く任意の表示（無洗米・分づき米・古代米）
  if (m.extras.length) {
    y += fs * 0.4;
    for (const line of wrapText(ctx, m.extras.join("　"), availW)) {
      ops.push({ t: "text", s: line, x: x0, y: y + lineH / 2, align: "left" });
      y += lineH;
    }
  }
  return { ops, height: y - y0, ok: true, stacked };
}

// 文字の大きさの下限に足す余裕（ポイント）。画像の細かさの丸めなどで、書き出したPDFの文字が
// ごくわずかに小さくなっても、下限を割らないようにする。
export const PT_SAFETY = 0.1;

// 試す文字の大きさ（大きい順）。最後は「下限＋余裕」。
function ptCandidates(minPt: number): number[] {
  const floor = minPt + PT_SAFETY;
  const list: number[] = [];
  for (let pt = minPt * 1.5; pt > floor + 1e-9; pt -= 0.5) list.push(pt);
  list.push(floor);
  return list;
}

export type BackResult = { fits: boolean; pt: number };

// 一括表示を描く。文字は minPt 以上の同じ大きさにそろえる（入りきらなければ fits=false）
// forcePt を渡すと、大きさを選ばずにその大きさで描く（画面の見本を、書き出しと同じ大きさで描くため）
export function renderBack(
  canvas: HTMLCanvasElement,
  wMm: number,
  model: BackModel,
  minPt: number,
  fonts: Fonts,
  forcePt?: number,
): BackResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { fits: false, pt: minPt };
  const W = canvas.width;
  const H = canvas.height;
  const pxPerMm = W / wMm;
  const margin = Math.min(5, Math.max(2.5, Math.min(wMm, H / pxPerMm) * 0.04)) * pxPerMm;
  const availW = W - 2 * margin;
  const availH = H - 2 * margin;

  // 大きすぎると読みにくく欄も崩れるので、下限の1.5倍までにする。
  // 産地・品種・産年を欄に分けて書ける大きさを優先し、分けられないときだけ縦に並べる。
  let chosen: { layout: BackLayout; pt: number } | null = null;
  if (forcePt !== undefined) {
    const fs = forcePt * JIS_PT_MM * pxPerMm;
    const layout = layoutBack(ctx, model, fs, fonts.sans, margin, margin, availW);
    if (layout.ok && layout.height <= availH) chosen = { layout, pt: forcePt };
  }
  for (const allowStacked of forcePt !== undefined ? [] : [false, true]) {
    for (const pt of ptCandidates(minPt)) {
      const fs = pt * JIS_PT_MM * pxPerMm;
      const layout = layoutBack(ctx, model, fs, fonts.sans, margin, margin, availW);
      if (layout.ok && layout.height <= availH && (allowStacked || !layout.stacked)) {
        chosen = { layout, pt };
        break;
      }
    }
    if (chosen) break;
  }
  const fits = chosen !== null;
  if (!chosen) {
    const pt = forcePt ?? minPt;
    const fs = pt * JIS_PT_MM * pxPerMm;
    chosen = { layout: layoutBack(ctx, model, fs, fonts.sans, margin, margin, availW), pt };
  }

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const fs = chosen.pt * JIS_PT_MM * pxPerMm;
  ctx.font = font(400, fs, fonts.sans);
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";
  ctx.textBaseline = "middle";
  for (const op of chosen.layout.ops) {
    if (op.t === "text") {
      ctx.textAlign = op.align;
      ctx.fillText(op.s, op.x, op.y);
    } else if (op.t === "line") {
      ctx.lineWidth = op.w;
      ctx.beginPath();
      ctx.moveTo(op.x1, op.y1);
      ctx.lineTo(op.x2, op.y2);
      ctx.stroke();
    } else {
      ctx.lineWidth = op.lw;
      ctx.strokeRect(op.x, op.y, op.w, op.h);
    }
  }
  if (!fits) {
    // 入りきらないことが一目でわかるように、赤い斜線を引く（出力はしない）
    ctx.strokeStyle = "rgba(220,38,38,0.8)";
    ctx.lineWidth = pxPerMm * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, H);
    ctx.moveTo(W, 0);
    ctx.lineTo(0, H);
    ctx.stroke();
  }
  ctx.restore();
  return { fits, pt: chosen.pt };
}
