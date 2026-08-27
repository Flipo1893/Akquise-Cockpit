"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./database.types";

/**
 * Browser-Client. `createBrowserClient` ist intern ein Singleton, mehrfaches
 * Aufrufen erzeugt also keine zusätzlichen Verbindungen.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
