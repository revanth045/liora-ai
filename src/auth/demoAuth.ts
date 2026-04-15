import { AuthAdapter, Role, Session } from "./types";

const UKEY = "liora_demo_users";
const RKEY = "liora_demo_restaurants";
const SKEY = "liora_demo_session";
const LKEY = "liora_demo_last_email";
const PKEY = "liora_demo_last_role";
const AKEY = "liora_demo_saved_accounts";

type DemoUser = { id: string; email: string; password: string; role: Role; name?: string; restaurantId?: string; lastUsedAt?: number };
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

function emit(){ const s = getSessionSync(); listeners.forEach(l=>l(s)); }
function getSessionSync(): Session {
  const raw = read<{id:string; email:string; role:Role; name?:string; restaurantId?:string}>(SKEY, null as any);
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
    if (!u) throw new Error("Account not found for quick access.");

    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, restaurantId: u.restaurantId });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);

    u.lastUsedAt = Date.now(); 
    write(UKEY, users);
    upsertSavedAccount({ email: u.email, role: u.role, name: u.name });

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
  },

  async signInUser(email: string, password: string) {
    const users = read<DemoUser[]>(UKEY, []);
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) throw new Error("Invalid email or password");
    
    write(SKEY, { id: u.id, email: u.email, role: u.role, name: u.name, restaurantId: u.restaurantId });
    localStorage.setItem(LKEY, u.email);
    localStorage.setItem(PKEY, u.role);

    u.lastUsedAt = Date.now(); 
    write(UKEY, users);
    upsertSavedAccount({ email: u.email, role: u.role, name: u.name });
    
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
    if (restaurantName){
      const r = read<DemoRestaurant[]>(RKEY, []);
      r.push({ id: cryptoRandom(), ownerId: owner.id, name: restaurantName });
      write(RKEY, r);
    }
  },
  
  async resetPassword(email) {
    const users = read<DemoUser[]>(UKEY, []);
    if (!users.some(u => u.email === email)) throw new Error("Email not found");
    alert("DEMO MODE: Password reset link sent to " + email);
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
  },
};