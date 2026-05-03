// Pulls the canonical data set from Neon → localStorage on app boot.
// We suspend sync while hydrating so the writes don't echo back to the API.
import { api } from './api';
import { primeSnapshot, suspendSync, resumeSync } from './dataSync';

const RAW_KEY_BY_RESOURCE: Array<[string, string, (row: any) => any]> = [
  ['/api/hotels',         'liora_demo_hotels',         passthrough],
  ['/api/hotel-rooms',    'liora_demo_hotel_rooms',    passthrough],
  ['/api/hotel-bookings', 'liora_demo_hotel_bookings', passthrough],
  ['/api/hotel-addons',   'liora_demo_hotel_addons',   passthrough],
  ['/api/hotel-reviews',  'liora_demo_hotel_reviews',  passthrough],
  ['/api/restaurants',    'liora_demo_restaurants',    passthrough],
  ['/api/promotions',     'liora_demo_promotions',     passthrough],
  ['/api/chef-specials',  'liora_demo_chef_specials',  passthrough],
];

function passthrough<T>(x: T): T { return x; }

async function hydrateAll() {
  suspendSync();
  try {
    // Hotel-scoped resources need a hotelId param — we only fetch them after the
    // hotels list lands. Restaurant-scoped resources do the same.
    const [hotels, restaurants, promos] = await Promise.all([
      api.get('/api/hotels').catch(() => []),
      api.get('/api/restaurants').catch(() => []),
      api.get('/api/promotions').catch(() => []),
    ]);

    mergeAndPrime('liora_demo_hotels',      hotels || []);
    mergeAndPrime('liora_demo_restaurants', restaurants || []);
    mergeAndPrime('liora_demo_promotions',  promos || []);

    // Per-hotel rooms, add-ons, bookings, reviews
    const allRooms: any[] = [];
    const allAddons: any[] = [];
    const allBookings: any[] = [];
    const allReviews: any[] = [];
    await Promise.all((hotels || []).map(async (h: any) => {
      const [rooms, addons, bookings, reviews] = await Promise.all([
        api.get(`/api/hotel-rooms?hotelId=${encodeURIComponent(h.id)}`).catch(() => []),
        api.get(`/api/hotel-addons?hotelId=${encodeURIComponent(h.id)}`).catch(() => []),
        api.get(`/api/hotel-bookings?hotelId=${encodeURIComponent(h.id)}`).catch(() => []),
        api.get(`/api/hotel-reviews?hotelId=${encodeURIComponent(h.id)}`).catch(() => []),
      ]);
      allRooms.push(...(rooms || []));
      allAddons.push(...(addons || []));
      allBookings.push(...(bookings || []));
      allReviews.push(...(reviews || []));
    }));
    mergeAndPrime('liora_demo_hotel_rooms',    allRooms);
    mergeAndPrime('liora_demo_hotel_addons',   allAddons);
    mergeAndPrime('liora_demo_hotel_bookings', allBookings);
    mergeAndPrime('liora_demo_hotel_reviews',  allReviews);

    // Per-restaurant menu/orders/specials
    const allMenu: any[] = [];
    const allOrders: any[] = [];
    const allSpecials: any[] = [];
    await Promise.all((restaurants || []).map(async (r: any) => {
      const [menu, orders, specials] = await Promise.all([
        api.get(`/api/menu?restaurantId=${encodeURIComponent(r.id)}`).catch(() => []),
        api.get(`/api/orders?restaurantId=${encodeURIComponent(r.id)}`).catch(() => []),
        api.get(`/api/chef-specials?restaurantId=${encodeURIComponent(r.id)}`).catch(() => []),
      ]);
      allMenu.push(...(menu || []));
      allOrders.push(...(orders || []));
      allSpecials.push(...(specials || []));
    }));
    mergeAndPrime('liora_demo_menu_items',    allMenu);
    mergeAndPrime('liora_demo_orders',        allOrders);
    mergeAndPrime('liora_demo_chef_specials', allSpecials);

    // Notify the app that fresh data is available (pages can poll/refresh).
    try { window.dispatchEvent(new CustomEvent('liora:hydrated')); } catch {}
  } finally {
    resumeSync();
  }
}

/** Merge server items into whatever's already in localStorage by id. Server
 * is authoritative for items that exist on both sides; any local-only items
 * (created during the hydration window or while offline) are kept and will
 * be POSTed on the next sync tick once we resume. */
function mergeAndPrime(key: string, serverItems: any[]) {
  let local: any[] = [];
  try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  const byId = new Map<string, any>();
  for (const it of Array.isArray(local) ? local : []) {
    if (it && it.id != null) byId.set(String(it.id), it);
  }
  for (const it of serverItems || []) {
    if (it && it.id != null) byId.set(String(it.id), it);
  }
  const merged = Array.from(byId.values());
  try { localStorage.setItem(key, JSON.stringify(merged)); } catch {}
  // Prime snapshot to ONLY the server-known set so any local-only items
  // remain "unsynced" — when sync resumes they will be POSTed.
  primeSnapshot(key, serverItems || []);
}

let started = false;
export function startHydration() {
  if (started) return;
  started = true;
  // Fire-and-forget; the UI can render immediately from any cached localStorage
  // value and re-render when 'liora:hydrated' fires.
  hydrateAll().catch(e => console.warn('[hydrate] failed', e?.message));
}
