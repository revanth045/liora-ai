/**
 * Canonical demo accounts for the Liora ecosystem.
 *
 * Two accounts per role, each with fully-distinct seeded data:
 *   - Customers      → see their booking + order history immediately
 *   - Restaurant     → owns one specific seeded restaurant + menu
 *   - Hotel owner    → owns one specific seeded hotel from DEMO_HOTEL_DIRECTORY
 *
 * Idempotent: safe to call on every app boot. Won't overwrite a user's
 * password if they've changed it.
 */

import type { Role } from './types';
import { DEMO_HOTEL_DIRECTORY, db_seedAllDemoHotels } from '../hotelDb';
import { DEMO_OWNER_ID, db_seedDemoRestaurants } from '../demoDb';

type DemoAccountRole = 'user' | 'restaurant_owner' | 'hotel_owner';

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: DemoAccountRole;
  /** Tagline shown on the login button */
  tagline: string;
  /** Stable id so seeded data (restaurants/hotels) stays linked across boots */
  id: string;
  /** For restaurant owners: name of the restaurant they own */
  ownsRestaurantName?: string;
  /** For hotel owners: maps to DEMO_HOTEL_DIRECTORY by email */
  ownsHotelEmail?: string;
};

const PASS = 'demo1234';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // ----- Customers -----
  {
    email: 'sofia@liora.demo', password: PASS, name: 'Sofia Vento', role: 'user',
    id: 'demo_user_sofia',
    tagline: 'Foodie · Maldives stay confirmed',
  },
  {
    email: 'henrik@liora.demo', password: PASS, name: 'Henrik Olsen', role: 'user',
    id: 'demo_user_henrik',
    tagline: 'Traveler · Past stays + reviews',
  },
  // ----- Restaurant owners -----
  {
    email: 'golden@liora.demo', password: PASS, name: 'Marco Rossi', role: 'restaurant_owner',
    id: 'demo_owner_restaurant_golden',
    tagline: 'Owns The Golden Fork (Italian, NYC)',
    ownsRestaurantName: 'The Golden Fork',
  },
  {
    email: 'sakura@liora.demo', password: PASS, name: 'Yuki Tanaka', role: 'restaurant_owner',
    id: 'demo_owner_restaurant_sakura',
    tagline: 'Owns Sakura Blossom (Japanese, SF)',
    ownsRestaurantName: 'Sakura Blossom',
  },
  // ----- Hotel owners (linked to DEMO_HOTEL_DIRECTORY) -----
  {
    email: 'grand@liora.demo', password: PASS, name: 'Mr. Alaric', role: 'hotel_owner',
    id: 'demo_owner_grand',
    tagline: 'Owns Liora Grand Resort (Maldives)',
    ownsHotelEmail: 'grand@liora.demo',
  },
  {
    email: 'aspen@liora.demo', password: PASS, name: 'Ms. Helena', role: 'hotel_owner',
    id: 'demo_owner_aspen',
    tagline: 'Owns Aspen Pines Lodge (Colorado)',
    ownsHotelEmail: 'aspen@liora.demo',
  },
];

const UKEY = 'liora_demo_users';
const RKEY = 'liora_demo_restaurants';
const AKEY = 'liora_demo_saved_accounts';

type StoredUser = {
  id: string; email: string; password: string; role: Role;
  name?: string; restaurantId?: string; hotelId?: string; lastUsedAt?: number;
};

function read<T>(k: string, d: T): T {
  try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; }
}
function write(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); }

/** Idempotently seed all 6 demo accounts + their owned data. Call once at boot. */
export function seedDemoAccounts() {
  // 1. Make sure the underlying restaurant + hotel data exists.
  db_seedDemoRestaurants();
  db_seedAllDemoHotels();

  // 2. Upsert the user records (preserves password if user changed it).
  const users = read<StoredUser[]>(UKEY, []);
  let usersChanged = false;
  for (const acc of DEMO_ACCOUNTS) {
    const existing = users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
    if (existing) {
      // Heal id/name/role drift but keep their password.
      if (existing.id !== acc.id) { existing.id = acc.id; usersChanged = true; }
      if (existing.role !== acc.role) { existing.role = acc.role as Role; usersChanged = true; }
      if (acc.name && existing.name !== acc.name) { existing.name = acc.name; usersChanged = true; }
    } else {
      users.push({
        id: acc.id, email: acc.email, password: acc.password,
        role: acc.role as Role, name: acc.name, lastUsedAt: 0,
      });
      usersChanged = true;
    }
  }
  if (usersChanged) write(UKEY, users);

  // 3. Re-link the 2 designated restaurants to the 2 demo restaurant owners.
  //    (db_seedDemoRestaurants put everything under the shared DEMO_OWNER_ID.)
  const restaurants = read<Array<{ id: string; ownerId: string; name: string }>>(RKEY, []);
  let restaurantsChanged = false;
  for (const acc of DEMO_ACCOUNTS) {
    if (acc.role !== 'restaurant_owner' || !acc.ownsRestaurantName) continue;
    const r = restaurants.find(x => x.name.toLowerCase() === acc.ownsRestaurantName!.toLowerCase());
    if (r && r.ownerId !== acc.id) {
      r.ownerId = acc.id;
      restaurantsChanged = true;
    }
  }
  if (restaurantsChanged) write(RKEY, restaurants);

  // 4. Make sure the demo accounts show up in the saved-accounts switcher.
  const saved = read<Array<{ email: string; role: Role; name?: string; lastUsedAt?: number }>>(AKEY, []);
  let savedChanged = false;
  for (const acc of DEMO_ACCOUNTS) {
    if (!saved.some(s => s.email === acc.email)) {
      saved.push({ email: acc.email, role: acc.role as Role, name: acc.name, lastUsedAt: 0 });
      savedChanged = true;
    }
  }
  if (savedChanged) write(AKEY, saved);
}

/** Returns demo accounts filtered by which login form they apply to. */
export function getDemoAccountsFor(kind: 'user' | 'hotel' | 'restaurant'): DemoAccount[] {
  if (kind === 'user') return DEMO_ACCOUNTS.filter(a => a.role === 'user');
  if (kind === 'hotel') return DEMO_ACCOUNTS.filter(a => a.role === 'hotel_owner');
  return DEMO_ACCOUNTS.filter(a => a.role === 'restaurant_owner');
}

// Defensive: assert we kept the hotel owner emails in lock-step with DEMO_HOTEL_DIRECTORY.
if (typeof window !== 'undefined') {
  for (const acc of DEMO_ACCOUNTS) {
    if (acc.role === 'hotel_owner' && acc.ownsHotelEmail) {
      const h = DEMO_HOTEL_DIRECTORY.find(d => d.email.toLowerCase() === acc.ownsHotelEmail!.toLowerCase());
      if (!h) console.warn('[demoSeed] Hotel owner', acc.email, 'missing from DEMO_HOTEL_DIRECTORY');
    }
  }
}
