import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ログイン版の5ページ（/app/kicho・/app/boujo・/app/nisshi・/app/dashboard・/app/documents）だけを守る。
// 元の /kicho・/boujo・/nisshi・/dashboard は無料・ログイン不要のまま変更しない。
// 書類作成系の9ツールや紹介ページも、これまで通りログイン不要なので対象外。
//
// やっていること：
//   1. Supabaseのログイン情報（Cookie）を最新に保つ
//   2. ログインしていなければ /login に案内する（元のページはredirectで覚えておく）
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabaseに接続できないとき（設定前など）は、ログインしていない扱いにして/loginへ送る
    user = null;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // 対象は /app 配下の5ページのみ（元の /kicho 等・トップページ・書類作成ツールは対象外）
  matcher: [
    "/app/kicho",
    "/app/kicho/:path*",
    "/app/boujo",
    "/app/boujo/:path*",
    "/app/nisshi",
    "/app/nisshi/:path*",
    "/app/dashboard",
    "/app/dashboard/:path*",
    "/app/documents",
    "/app/documents/:path*",
    "/app/settings",
    "/app/settings/:path*",
  ],
};
