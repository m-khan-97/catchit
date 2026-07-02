import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Anon-key client for Server Components, Server Actions, and Route Handlers.
 * Respects RLS using the caller's session (if any) — this is what admin
 * pages use so admin_users/is_admin() policies apply.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no response to write to —
            // safe to ignore as long as middleware.ts is refreshing sessions.
          }
        },
      },
    }
  );
}
