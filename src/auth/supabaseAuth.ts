import { getSupabase } from "../lib/supabaseClient";
import { AuthAdapter, Role, Session } from "./types";

function toSession(supaSession: any): Session {
  if (!supaSession?.user) return null;
  const u = supaSession.user;
  const meta = u.user_metadata || {};
  return {
    user: {
      id: u.id,
      email: u.email ?? "",
      role: (meta.role as Role) ?? "user",
      name: meta.full_name ?? meta.name ?? u.email,
    },
  };
}

export const SupabaseAuth: AuthAdapter = {
  async getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return toSession(data.session);
  },

  onAuthStateChange(cb) {
    const sb = getSupabase();
    if (!sb) return () => {};
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      cb(toSession(session));
    });
    return () => data.subscription.unsubscribe();
  },

  async signInWithGoogle(_role?: 'user' | 'restaurant_owner') {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  },

  async signUpUser(email, password, fullName) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "user" } },
    });
    if (error) throw new Error(error.message);
  },

  async signInUser(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  },

  async signUpRestaurantOwner(email, password, ownerName, restaurantName) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: ownerName, role: "restaurant_owner", restaurantName },
      },
    });
    if (error) throw new Error(error.message);
  },

  async resetPassword(email) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '?reset=true',
    });
    if (error) throw new Error(error.message);
  },

  async updatePassword(password) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase not configured.");
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  async signInFromSwitcher(email) {
    throw new Error("Quick-switch not available with Supabase auth.");
  },
};