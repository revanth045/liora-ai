// Compatibility shim — Supabase has been removed in favour of the Neon-backed API.
// These exports are preserved so existing callers continue to compile.
export const hasSupabase = false;
export function getSupabase(): null { return null; }
