import { getSupabaseBrowser } from "./supabaseBrowser";

export type AnalyticsEventType = "page_view" | "pdf_create" | "record_save";

// 匿名の利用状況（どのページが見られたか・PDFが作られたか・記録が保存されたか）を記録する。
// 個人情報やIPアドレスは送らない（event_typeとkey＝ページのパスやツール名だけ）。
// 記録に失敗しても、利用者の操作（PDF作成や記録保存など）は止めない。
export function trackEvent(eventType: AnalyticsEventType, key: string): void {
  try {
    getSupabaseBrowser()
      .from("analytics_events")
      .insert({ event_type: eventType, key })
      .then(({ error }) => {
        if (error && process.env.NODE_ENV !== "production") {
          console.warn("[analytics] 記録できませんでした:", error.message);
        }
      });
  } catch {
    // Supabase未設定など、想定外の状況でもアプリの動作に影響させない
  }
}
