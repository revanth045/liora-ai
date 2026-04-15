import { DemoAuth } from "./demoAuth";
import { SupabaseAuth } from "./supabaseAuth";
import { hasSupabase } from "../lib/supabaseClient";
import type { AuthAdapter } from "./types";

// Automatically use Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set,
// otherwise fall back to in-memory DemoAuth (localStorage).
export function getAuth(): AuthAdapter {
  return hasSupabase ? SupabaseAuth : DemoAuth;
}
