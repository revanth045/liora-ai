import { DemoAuth } from "./demoAuth";
import type { AuthAdapter } from "./types";

// Always use DemoAuth, as it now has built-in dual-write sync to Supabase.
// This ensures Quick Access profiles and Demo Restaurant logins continue to work perfectly.
export function getAuth(): AuthAdapter {
  return DemoAuth;
}
