import { DemoAuth } from "./demoAuth";
import { SupabaseAuth } from "./supabaseAuth";
import { hasSupabase } from "../lib/supabaseClient";
import type { AuthAdapter } from "./types";

// Use DemoAuth for all auth (keeps Quick Access profiles & Demo Restaurant logins working).
// Exception: when Supabase credentials are configured, use real Google OAuth for signInWithGoogle.
export function getAuth(): AuthAdapter {
  if (hasSupabase) {
    return {
      ...DemoAuth,
      signInWithGoogle: (_role?) => SupabaseAuth.signInWithGoogle!(_role),
    };
  }
  return DemoAuth;
}
