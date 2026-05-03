import { AuthAdapter, Role, Session } from "./types";
import { sbUpsertUser, sbUpsertRestaurant } from "../lib/supabaseDb";

const UKEY = "liora_demo_users";
const RKEY = "liora_demo_restaurants";
const SKEY = "liora_demo_session";
const LKEY = "liora_demo_last_email";
const PKEY = "liora_demo_last_role";
const AKEY = "liora_demo_saved_accounts";

type DemoUser = { id: string; email: string; password: string; role: Role; name?: string; restaurantId?: string; hotelId?: string; lastUsedAt?: number };
type DemoRestaurant = { id: string; ownerId: string; name: string; staffCode?: string };

export type SavedAccount = {
  email: string;
  role: Role;
  name?: string;
  lastUsedAt?: number;
};

function read<T>(k: string, d: T){ try{ return JSON.parse(localStorage.getItem(k) || "") as T; }catch{ return d; } }
function write(k: string, v: any){ localStorage.setItem(k, JSON.stringify(v)); }

function cryptoRandom(){ 
    try { return Array.from(crypto.getRandomValues(new Uint32Array(4))).map(n => n.toString(36)).join(""); }
    catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

let listeners: ((s: Session)=>void)[] = [];

function emit(){
  const s = getSessionSync();
  listeners.forEach(l=>l(s));
  // Notify per-user data hooks (favorites/profile/subscription) that the
  // active account changed so they can reload from their per-user storage key.
  try { window.dispatchEvent(new CustomEvent('liora:session-changed', { detail: s })); } catch {}
}
function getSessionSync(): Session {
  const raw = read<{id:string; email:string; role:Role; name?:string; restaurantId?:string; hotelId?:string}>(SKEY, null as any);
  return raw ? { user: raw } : null;
}

export function demoAutoRestore() {
  const s = read<{ id:string; email:string; role:Role }>(SKEY, null as any);
  if (s) { emit(); return; }
}

function upsertSavedAccount(sa: Omit<SavedAccount, 'lastUsedAt'>) {
    const list = read<SavedAccount[]>(AKEY, []);
    const i = list.findIndex(x => x.email === sa.email);
    const now = Date.now();
    const row = { ...sa, lastUsedAt: now };
    if (i >= 0) list[i] = { ...list[i], ...row };
    else list.push(row);
    write(AKEY, list);
}

export function listSavedAccounts(): SavedAccount[] {
    const list = read<SavedAccount[]>(AKEY, []);
    return list.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
}

export function forgetSavedAccount(email: string) {
    const list = read<SavedAccount[]>(AKEY, []);
    write(AKEY, list.filter(x => x.email !== email));
    const sess = read<{ id: string; email: string; role: Role } | null>(SKEY, null);
    if (sess?.email === email) {
        localStorage.removeItem(SKEY);
        emit();
    }
}

async function signInFromSwitcher(email: string) {
    const users = read<DemoUser[]>(UKEY, []);
    const u = users.find(x => x.email === email);

    if (u) {
      // Full session restore from stored user
      write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, restaurantId: u.restaurantId, hotelId: u.hotelId });
      localStorage.setItem(LKEY, u.email);
      localStorage.setItem(PKEY, u.role);
      u.lastUsedAt = Date.now();
      write(UKEY, users);
      upsertSavedAccount({ email: u.email, role: u.role, name: u.name });
    } else {
      // User not found in store (localStorage was cleared) — restore from saved accounts
      const saved = read<SavedAccount[]>(AKEY, []).find(x => x.email === email);
      if (!saved) throw new Error("Account not found. Please sign in with your email and password.");
      // Create a minimal session so the user gets back in
      const tempId = cryptoRandom();
      write(SKEY, { id: tempId, email: saved.email, role: saved.role, name: saved.name });
      localStorage.setItem(LKEY, saved.email);
      localStorage.setItem(PKEY, saved.role);
    }

    emit();
}


export const DemoAuth: AuthAdapter = {
  async getSession(){ return getSessionSync(); },
  getSessionSync(){ return getSessionSync(); },
  onAuthStateChange(cb){ listeners.push(cb); return ()=>{ listeners = listeners.filter(x=>x!==cb); }; },
  
  async signUpUser(email, password, fullName){
    const users = read<DemoUser[]>(UKEY, []);
    if (users.some(u=>u.email===email)) throw new Error("Email already registered");
    const u: DemoUser = { id: cryptoRandom(), email, password, role: "user", name: fullName, lastUsedAt: Date.now() };
    users.push(u);
    write(UKEY, users);
    upsertSavedAccount({ email, role: "user", name: fullName });
    localStorage.setItem('liora-needs-onboarding', 'true');
    // Set session immediately so the user is logged in after signup
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);
    // Sync to Supabase (fire-and-forget)
    sbUpsertUser(u.id, email, 'user', fullName).catch(() => {});
    emit();
  },

  async signInUser(email: string, password: string) {
    const users = read<DemoUser[]>(UKEY, []);
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid email or password");

    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, restaurantId: u.restaurantId, hotelId: u.hotelId });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);

    u.lastUsedAt = Date.now();
    write(UKEY, users);
    upsertSavedAccount({ email: u.email, role: u.role, name: u.name });

    // Sync to Supabase
    sbUpsertUser(u.id, u.email, u.role, u.name).catch(() => {});

    emit();
  },
  
  async signOut(){
    localStorage.removeItem(SKEY);
    emit();
  },
  
  async signUpRestaurantOwner(email, password, ownerName, restaurantName){
    const users = read<DemoUser[]>(UKEY, []);
    if (users.some(u=>u.email===email)) throw new Error("Email already registered");
    const owner: DemoUser = { id: cryptoRandom(), email, password, role: "restaurant_owner", name: ownerName, lastUsedAt: Date.now() };
    users.push(owner);
    write(UKEY, users);
    upsertSavedAccount({ email, role: "restaurant_owner", name: ownerName });
    // Sync owner account to Supabase
    sbUpsertUser(owner.id, email, 'restaurant_owner', ownerName).catch(() => {});
    if (restaurantName){
      const r = read<DemoRestaurant[]>(RKEY, []);
      const newResto = { id: cryptoRandom(), ownerId: owner.id, name: restaurantName, status: 'pending' as const, createdAt: Date.now() };
      r.push(newResto);
      write(RKEY, r);
      try {
        import('../lib/adminNotifications').then(m => m.adminNotify({
          kind: 'venue_signup',
          venueId: newResto.id,
          venueName: restaurantName,
          venueType: 'restaurant',
          message: `Restaurant sign-up by ${ownerName} (${email})`,
        })).catch(() => {});
      } catch {}
      // Sync restaurant to Supabase
      sbUpsertRestaurant({ id: newResto.id, ownerId: owner.id, name: restaurantName }).catch(() => {});
    }
    // Set session immediately — user is logged in after registration
    write(SKEY, { id: owner.id, email: owner.email, role: owner.role, name: owner.name });
    localStorage.setItem(LKEY, owner.email);
    localStorage.setItem(PKEY, owner.role);
    emit();
  },
  
  async resetPassword(email) {
    const users = read<DemoUser[]>(UKEY, []);
    if (!users.some(u => u.email === email)) throw new Error("Email not found");
    // Inline import to avoid any circular dep at module load
    const { toast } = await import('../lib/toast');
    toast.info("DEMO MODE: Password reset link sent to " + email);
  },

  async updatePassword(password) {
    const sess = getSessionSync();
    if (!sess) throw new Error("Not logged in");
    const users = read<DemoUser[]>(UKEY, []);
    const idx = users.findIndex(u => u.email === sess.user.email);
    if (idx >= 0) {
      users[idx].password = password;
      write(UKEY, users);
    }
  },

  signInFromSwitcher,

  async signInWithGoogle() {
    // Demo-mode Google Sign-In: creates a shared Google-style account and signs in.
    const googleEmail = "google-demo@gmail.com";
    const googlePassword = "__google_oauth_demo__";
    const googleName = "Google User (Demo)";
    const users = read<DemoUser[]>(UKEY, []);
    let u = users.find(x => x.email === googleEmail);
    const isNewGoogleUser = !u;
    if (!u) {
      u = { id: cryptoRandom(), email: googleEmail, password: googlePassword, role: "user", name: googleName, lastUsedAt: Date.now() };
      users.push(u);
      write(UKEY, users);
      upsertSavedAccount({ email: googleEmail, role: "user", name: googleName });
    }
    if (isNewGoogleUser) {
      localStorage.setItem('liora-needs-onboarding', 'true');
    }
    u.lastUsedAt = Date.now();
    write(UKEY, users);
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);
    upsertSavedAccount({ email: u.email, role: u.role, name: u.name });
    emit();
  },

  async signUpHotelOwner(email, password, ownerName, hotelName){
    const users = read<DemoUser[]>(UKEY, []);
    if (users.some(u=>u.email===email)) throw new Error("Email already registered");
    // Demo hotel emails get stable owner IDs so consumer bookings flow through
    // to the same hotel record they manage in the portal.
    const ownerId = cryptoRandom();
    const owner: DemoUser = { id: ownerId, email, password, role: "hotel_owner", name: ownerName, lastUsedAt: Date.now() };
    users.push(owner);
    write(UKEY, users);
    upsertSavedAccount({ email, role: "hotel_owner", name: ownerName });
    sbUpsertUser(owner.id, email, 'hotel_owner' as any, ownerName).catch(() => {});
    // Stash the chosen hotel name so HotelPortal can seed under it.
    // Do NOT pre-create a hotel record here — that would short-circuit the
    // demo seeding (rooms/add-ons/reviews/bookings) inside hotelDb.
    if (hotelName) {
      try {
        const pending = JSON.parse(localStorage.getItem('liora_pending_hotel_names') || '{}');
        pending[owner.id] = hotelName;
        localStorage.setItem('liora_pending_hotel_names', JSON.stringify(pending));
      } catch {}
    }
    write(SKEY, { id: owner.id, email: owner.email, role: owner.role, name: owner.name });
    localStorage.setItem(LKEY, owner.email);
    localStorage.setItem(PKEY, owner.role);
    emit();
  },

  async signUpFrontDesk(email, password, name, frontDeskCode) {
    const users = read<DemoUser[]>(UKEY, []);
    if (users.some(u => u.email === email)) throw new Error('Email already registered.');
    const { db_findHotelByFrontDeskCode } = await import('../hotelDb');
    const hotel = db_findHotelByFrontDeskCode(frontDeskCode);
    if (!hotel) throw new Error('Invalid front-desk access code. Ask your hotel owner to share the code from the Hotel Profile.');
    const u: DemoUser = { id: cryptoRandom(), email, password, role: 'front_desk', name, hotelId: hotel.id, lastUsedAt: Date.now() } as any;
    users.push(u);
    write(UKEY, users);
    upsertSavedAccount({ email, role: 'front_desk', name });
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, hotelId: hotel.id });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);
    emit();
  },

  async signUpStaff(email, password, name, staffCode) {
    const users = read<DemoUser[]>(UKEY, []);
    if (users.some(u => u.email === email)) throw new Error('Email already registered.');
    const restaurants = read<DemoRestaurant[]>(RKEY, []);
    const restaurant = restaurants.find(r => r.staffCode?.toUpperCase() === staffCode.trim().toUpperCase());
    if (!restaurant) throw new Error('Invalid staff access code. Ask your restaurant owner to share the code from Venue Settings.');
    const u: DemoUser = { id: cryptoRandom(), email, password, role: 'staff', name, restaurantId: restaurant.id, lastUsedAt: Date.now() };
    users.push(u);
    write(UKEY, users);
    upsertSavedAccount({ email, role: 'staff', name });
    // Set session immediately
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, restaurantId: u.restaurantId });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);
    emit();
  },

  async signInAdmin(email: string, password: string) {
    const ADMIN_EMAIL = 'admin@liora.app';
    const ADMIN_PASSWORD = 'LioraAdmin2026!';
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials.');
    }
    const users = read<DemoUser[]>(UKEY, []);
    let u = users.find(x => x.email === ADMIN_EMAIL);
    if (!u) {
      u = { id: 'admin_root', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', name: 'Liora Admin', lastUsedAt: Date.now() };
      users.push(u);
      write(UKEY, users);
    } else if (u.role !== 'admin') {
      u.role = 'admin';
      write(UKEY, users);
    }
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);
    upsertSavedAccount({ email: u.email, role: u.role, name: u.name });
    emit();
  },
};