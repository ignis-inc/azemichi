import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "../../lib/supabaseService";

// 運営side専用の集計取得API。/admin/stats からだけ呼ばれる想定。
// パスワードはリクエストのたびに照合する（セッションは持たない、簡易な保護）。
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const expected = process.env.ADMIN_STATS_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "管理パスワードが設定されていません（ADMIN_STATS_PASSWORD）。" },
      { status: 500 },
    );
  }
  if (password !== expected) {
    return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY が設定されていません（.env.local を確認してください）。" },
      { status: 500 },
    );
  }

  try {
    const supabase = getSupabaseService();

    const [totalsRes, dailyRes, monthlyRes] = await Promise.all([
      supabase.from("analytics_totals").select("*"),
      supabase.from("analytics_daily").select("*").order("day", { ascending: true }),
      supabase.from("analytics_monthly").select("*").order("month", { ascending: true }),
    ]);

    const firstError = totalsRes.error || dailyRes.error || monthlyRes.error;
    if (firstError) {
      return NextResponse.json(
        {
          error: `集計データを取得できませんでした：${firstError.message}　（docs/analytics-setup.sql をSupabaseのSQL Editorで実行済みか確認してください）`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      totals: totalsRes.data ?? [],
      daily: dailyRes.data ?? [],
      monthly: monthlyRes.data ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json({ error: `サーバーエラー：${message}` }, { status: 500 });
  }
}
