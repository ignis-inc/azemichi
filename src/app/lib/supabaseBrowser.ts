import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ブラウザ（利用者のスマホ・パソコン）で使うSupabaseクライアント。
// ログイン・新規登録・ログアウトなど、認証まわりで使う。
// 何度呼んでも同じものを使い回す（シングルトン）。
let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
