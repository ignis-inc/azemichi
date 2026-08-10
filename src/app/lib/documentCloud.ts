import { getSupabaseBrowser } from "./supabaseBrowser";
import { DOC_META, type DocType } from "../dashboardStore";

// 書類作成ツールで生成したPDFのクラウド保管（/app/documents）を扱う共通モジュール。
// PDF本体はSupabase Storageの"generated-pdfs"バケットに、
// 種類・作成日時などの情報はgenerated_documentsテーブルに保存する。
// どちらもRLSにより、ログイン中の本人の分だけ読み書きできる。

const BUCKET = "generated-pdfs";

export type SavedDocument = {
  id: string;
  doc_type: string;
  title: string;
  filename: string;
  storage_path: string;
  created_at: string;
};

// PDF作成後に呼ぶ。ログインしていなければ何もしない（無料版利用時はこれまで通りダウンロードのみ）。
// 保存に失敗しても、既にダウンロード自体は成功しているため、利用者の操作は妨げない（エラーは投げない）。
export async function saveGeneratedPdfToCloud(docType: DocType, filename: string, blob: Blob): Promise<void> {
  try {
    const supabase = getSupabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return; // 未ログイン＝無料版の使い方なので、クラウド保存は行わない

    const id = crypto.randomUUID();
    const storagePath = `${user.id}/${id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: "application/pdf" });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("generated_documents").insert({
      id,
      doc_type: docType,
      title: DOC_META[docType].title,
      filename,
      storage_path: storagePath,
    });
    if (insertError) throw insertError;
  } catch (err) {
    console.error("[documentCloud] PDFのクラウド保存に失敗しました:", err);
  }
}

// ログイン中の自分が保存したPDFの一覧を、新しい順に読み込む
export async function listMyDocuments(): Promise<SavedDocument[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, doc_type, title, filename, storage_path, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedDocument[];
}

// 保存したPDFをダウンロードする（RLSにより自分の分だけ取得できる）
export async function downloadDocument(doc: SavedDocument): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage.from(BUCKET).download(doc.storage_path);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 保存したPDFを削除する（Storage本体とテーブルの行の両方）
export async function deleteDocument(doc: SavedDocument): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  if (storageError) throw storageError;
  const { error: rowError } = await supabase.from("generated_documents").delete().eq("id", doc.id);
  if (rowError) throw rowError;
}
