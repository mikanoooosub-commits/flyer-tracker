import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { DEMO_COOKIE } from "@/lib/demo";

/** 現在のリクエストがデモ表示モードか */
export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === "1";
}

/**
 * サーバー（Server Component / Route Handler / Server Action）用 Supabase クライアント。
 *
 * デモ表示モードのときは参照スキーマを demo に切り替える。
 * ここが唯一の切替点なので、queries.ts / actions.ts 側は変更不要
 * （`.from("visits")` はそのまま demo.visits を指すようになる）。
 */
export async function createClient() {
  const cookieStore = await cookies();
  // 参照スキーマの切替はここだけ。queries.ts / actions.ts は変更不要。
  const schema = cookieStore.get(DEMO_COOKIE)?.value === "1" ? "demo" : "public";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component からの呼び出しでは cookie を書き込めないが、
            // セッション更新は middleware が担うため無視してよい。
          }
        },
      },
    }
  );
}
