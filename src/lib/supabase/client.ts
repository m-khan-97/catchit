import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Anon-key client for use in Client Components (browser only). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
