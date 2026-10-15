import { LAST_CHECKED, type SummarySection } from "./komeShinData";

// 下書きの一覧を、ブラウザの中だけで PDF にしてダウンロードさせる。
// 入力内容はサーバーへ送らない。読み込むのは同じサイトのフォントファイルだけ。
export async function downloadDraftPdf(sections: SummarySection[]): Promise<void> {
  const mod = await import("pdfmake/build/pdfmake");
  const pdfMake = mod.default ?? mod;

  const fontUrl = `${window.location.origin}/fonts/NotoSansJP.ttf`;
  // フォント以外の外部読み込みはさせない
  pdfMake.setUrlAccessPolicy((url: string) => url === fontUrl);
  pdfMake.setFonts({
    NotoSansJP: { normal: fontUrl, bold: fontUrl, italics: fontUrl, bolditalics: fontUrl },
  });

  const now = new Date();
  const created = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // 見出しを表の1行目（headerRows）にして、見出しだけが前のページに残らないようにする
  // （keepWithHeaderRows で、見出しと最初の行を同じページに置く。表が次のページに続くときは見出しも繰り返す）
  const sectionBlocks = sections.map((section) => ({
    margin: [0, 12, 0, 0],
    table: {
      widths: [210, "*"],
      headerRows: 1,
      keepWithHeaderRows: 1,
      body: [
        [
          {
            text: section.title,
            colSpan: 2,
            // 見出し行は上と左右に線を引かない（下の線だけ表の一部として残す）
            border: [false, false, false, true],
            fontSize: 11.5,
            bold: true,
            color: "#166534",
            margin: [-6, 0, 0, 2],
          },
          {},
        ],
        ...section.rows.map((row) => [
          { text: row.label, fontSize: 9, fillColor: "#f0fdf4" },
          { text: row.value, fontSize: 10, color: row.missing ? "#b91c1c" : "#111827" },
        ]),
      ],
    },
    layout: {
      // 表のいちばん上（見出し行の上）には線を引かない
      hLineWidth: (k: number) => (k === 0 ? 0 : 0.6),
      vLineWidth: () => 0.6,
      hLineColor: () => "#9ca3af",
      vLineColor: () => "#9ca3af",
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  }));

  const docDef = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    defaultStyle: { font: "NotoSansJP", fontSize: 10, lineHeight: 1.3 },
    // 透かし。斜めだと崩れた字に見えやすいため、横向きにする
    watermark: { text: "下書き", font: "NotoSansJP", opacity: 0.08, fontSize: 120, angle: 0 },
    header: {
      text: "下書き（提出用ではありません）",
      alignment: "right",
      fontSize: 9,
      bold: true,
      color: "#b91c1c",
      margin: [40, 20, 40, 0],
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `あぜみち「お米の新しい届出（電子申請）の下書き」で作成　${currentPage} / ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#6b7280",
      margin: [40, 16, 40, 0],
    }),
    content: [
      {
        table: {
          widths: ["*"],
          body: [[{
            text: "下書き（提出用ではありません）",
            alignment: "center",
            fontSize: 16,
            bold: true,
            color: "#b91c1c",
            margin: [0, 6, 0, 6],
          }]],
        },
        layout: {
          hLineWidth: () => 1.5,
          vLineWidth: () => 1.5,
          hLineColor: () => "#b91c1c",
          vLineColor: () => "#b91c1c",
        },
        margin: [0, 0, 0, 10],
      },
      {
        text: "米穀等取扱事業の開始届出　入力内容の下書き",
        fontSize: 15,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 6],
      },
      {
        text: "この下書きは、eMAFF（電子申請）に入力する内容を整理するためのものです。届出は、eMAFFで行ってください。",
        fontSize: 9,
        margin: [0, 0, 0, 2],
      },
      {
        text: `作成日：${created}　／　制度の最終確認：${LAST_CHECKED}`,
        fontSize: 9,
        color: "#4b5563",
        margin: [0, 0, 0, 2],
      },
      ...sectionBlocks,
    ],
  };

  await pdfMake.createPdf(docDef).download("米穀等取扱事業の届出_下書き.pdf");
}
