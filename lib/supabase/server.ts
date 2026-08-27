import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./database.types";

/**
 * Server-Client für Server Components, Server Actions und Route Handler.
 * Pro Request neu erzeugen — niemals über Requests hinweg teilen.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components dürfen keine Cookies setzen. Das Auffrischen der
          // Session übernimmt proxy.ts, deshalb ist das hier gefahrlos.
        }
      },
    },
  });
}
