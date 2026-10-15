// pdfmake のブラウザ用ビルドには型定義が同梱されていないため、ここで宣言する。
// （サーバー側の各 PDF API は require で読み込んでいるので、この宣言は使っていない）
declare module "pdfmake/build/pdfmake";
