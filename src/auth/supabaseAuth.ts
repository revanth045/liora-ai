// Compatibility shim — Supabase auth has been removed in favour of DemoAuth +
// the Neon-backed Express API. This file remains so legacy imports compile.
import type { AuthAdapter } from './types';

export const SupabaseAuth: AuthAdapter = {
  async getSession() { return null; },
  onAuthStateChange() { return () => {}; },
  async signUpUser() { throw new Error('Supabase auth removed — use email + password.'); },
  async signInUser() { throw new Error('Supabase auth removed — use email + password.'); },
  async signOut() { /* no-op */ },
  async signUpRestaurantOwner() { throw new Error('Supabase auth removed.'); },
};
