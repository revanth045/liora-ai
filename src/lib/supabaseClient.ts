import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Access environment variables using `import.meta.env` which is the standard for Vite.
// FIX: Cast `import.meta` to `any` to resolve TypeScript error when Vite client types are not available.
const url  = (import.meta as any).env.VITE_SUPABASE_URL;
const anon = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anon);

// Create the client only if keys exist.
// Do NOT throw here; return null so UI can decide what to do.
let _client: SupabaseClient | null = null;
if (hasSupabase) {
  _client = createClient(url!, anon!);
}

export function getSupabase(): SupabaseClient | null {
  return _client;
}