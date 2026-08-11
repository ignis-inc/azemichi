import { getSupabaseBrowser } from "./supabaseBrowser";

// record_save = ログイン版（クラウド保存）／ record_save_free = 無料版（ログイン不要・ローカル保存）
export type AnalyticsEventType = "page_view" | "pdf_create" | "record_save" | "record_save_free";

// この端末を集計から除外する印（localStorage）。運営者・開発者の自分のアクセスを数えないために使う。
const NOTRACK_KEY = "azemichi-notrack";

// 開発中（localhost）かどうか。ローカルでの動作確認・自動テストは集計しない（A）。
function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local");
}

// この端末を「数えない」に設定／解除する（B）。
export function setNoTrack(on: boolean): void {
  try {
    if (on) localStorage.setItem(NOTRACK_KEY, "1");
    else localStorage.removeItem(NOTRACK_KEY);
  } catch {
    // localStorageが使えない場合は何もしない
  }
}

// この端末が「数えない」設定になっているか。
export function isNoTrack(): boolean {
  try {
    return localStorage.getItem(NOTRACK_KEY) === "1";
  } catch {
    return false;
  }
}

// 匿名の利用状況（どのページが見られたか・PDFが作られたか・記録が保存されたか）を記録する。
// 個人情報やIPアドレスは送らない（event_typeとkey＝ページのパスやツール名だけ）。
// 記録に失敗しても、利用者の操作（PDF作成や記録保存など）は止めない。
//
// 次の場合は記録しない：
//   A) 開発中（localhost）… ローカルの動作確認・自動テストを集計に混ぜない
//   B) この端末が「数えない」設定（?notrack=1 や 管理画面ログイン）になっている
export function trackEvent(eventType: AnalyticsEventType, key: string): void {
  try {
    if (isLocalhost() || isNoTrack()) return;
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
