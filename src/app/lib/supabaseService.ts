import { createClient } from "@supabase/supabase-js";

// サーバー専用のSupabaseクライアント（service role / secret key を使う）。
// RLS（行レベルセキュリティ）を無視して全データを読み書きできるため、
// 必ずAPIルートなど「サーバー側のコード」からだけ呼び出すこと。
// ブラウザ（クライアントコンポーネント）から呼んではいけない。
export function getSupabaseService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Next.jsが拡張したfetch（データキャッシュ機構）を経由すると、Supabase側の
      // 内部リクエストが正しく処理されないことがあるため、キャッシュしない素のfetchを明示的に使う
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}
