import type { Fonts } from "./komeLabelRender";

// ラベルの絵に使うフォント（どれも SIL Open Font License 1.1。無料で商用利用できる）。
// 日本語でよく使う文字（Windowsの日本語の文字の範囲）だけに絞って軽くしたものを、サイトの中に置いている。
// ライセンス文は public/fonts/kome-label/OFL-*.txt。ラベルを描くときにだけ読み込む。
const FACES = [
  { family: "KomeLabel Sans", file: "NotoSansJP-subset.woff2" }, // Noto Sans JP
  { family: "KomeLabel Mincho", file: "ShipporiMincho-Bold-subset.woff2" }, // しっぽり明朝 Bold
  { family: "KomeLabel Brush", file: "YujiBoku-Regular-subset.woff2" }, // Yuji Boku（毛筆風）
];

// 入っていない文字は、Noto Sans JP で描く
export const LABEL_FONTS: Fonts = {
  sans: '"KomeLabel Sans", sans-serif',
  mincho: '"KomeLabel Mincho", "KomeLabel Sans", serif',
  brush: '"KomeLabel Brush", "KomeLabel Sans", serif',
};

let loading: Promise<void> | null = null;

export function registerLabelFonts(): Promise<void> {
  if (!loading) {
    loading = Promise.all(
      FACES.map(async (f) => {
        // 太さは 100〜900 のどれでも同じ字形を使う（ブラウザが勝手に太らせないようにする）
        const face = new FontFace(f.family, `url(/fonts/kome-label/${f.file}) format("woff2")`, { weight: "100 900" });
        document.fonts.add(face);
        await face.load();
      }),
    ).then(
      () => undefined,
      () => {
        // 読み込めないときは次の機会にもう一度試す（その間はほかのフォントで描く）
        loading = null;
      },
    );
  }
  return loading;
}
