// Diff-based write-through to the Neon-backed API.
// Each localStorage key maps to an API resource. After every local write,
// we compute the diff vs the previous snapshot and fire upserts/deletes
// in the background so Neon stays the source of truth across devices.
import { api } from './api';

type Mapper = {
  endpoint: string;                       // REST root e.g. '/api/hotels'
  toServer?: (item: any) => any;          // optional shape transform
};

const KEY_TO_RESOURCE: Record<string, Mapper> = {
  liora_demo_hotels:           { endpoint: '/api/hotels' },
  liora_demo_hotel_rooms:      { endpoint: '/api/hotel-rooms' },
  liora_demo_hotel_bookings:   { endpoint: '/api/hotel-bookings' },
  liora_demo_hotel_addons:     { endpoint: '/api/hotel-addons' },
  liora_demo_hotel_reviews:    { endpoint: '/api/hotel-reviews' },
  liora_demo_restaurants:      { endpoint: '/api/restaurants' },
  liora_demo_menu_items:       { endpoint: '/api/menu' },
  liora_demo_orders:           { endpoint: '/api/orders' },
  liora_demo_promotions:       { endpoint: '/api/promotions' },
  liora_demo_chef_specials:    { endpoint: '/api/chef-specials' },
  liora_demo_inventory:        { endpoint: '/api/inventory' },
  liora_demo_staff:            { endpoint: '/api/staff' },
  liora_demo_shifts:           { endpoint: '/api/shifts' },
  liora_demo_attendance:       { endpoint: '/api/attendance' },
  liora_demo_tables:           { endpoint: '/api/tables' },
  liora_demo_table_alerts:     { endpoint: '/api/table-alerts' },
  liora_demo_events:           { endpoint: '/api/events' },
  liora_dine_sessions:         { endpoint: '/api/dine-sessions' },
};

// Last-known snapshot so we can compute diffs.
const snapshots = new Map<string, Map<string, string>>();

// Block syncing during initial hydration so we don't echo Neon data back to itself.
let suspended = false;
export function suspendSync() { suspended = true; }
export function resumeSync()  { suspended = false; }

function fingerprint(item: any): string {
  // Stable enough — diff on serialized payload sans volatile fields.
  return JSON.stringify(item);
}

export function syncListChange(key: string, items: any[]) {
  if (suspended) { snapshots.set(key, indexBy(items)); return; }
  const mapper = KEY_TO_RESOURCE[key];
  if (!mapper) return;
  const prev = snapshots.get(key) || new Map<string, string>();
  const next = indexBy(items);
  // Upserts: new id or changed payload.
  for (const [id, fp] of next.entries()) {
    if (prev.get(id) !== fp) {
      const item = items.find((x: any) => x.id === id);
      if (item) {
        api.post(mapper.endpoint, mapper.toServer ? mapper.toServer(item) : item)
           .catch(() => {/* offline-friendly */});
      }
    }
  }
  // Deletes: id was in prev but not in next.
  for (const id of prev.keys()) {
    if (!next.has(id)) {
      api.del(`${mapper.endpoint}/${encodeURIComponent(id)}`).catch(() => {});
    }
  }
  snapshots.set(key, next);
}

function indexBy(items: any[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const it of items || []) {
    if (it && it.id != null) out.set(String(it.id), fingerprint(it));
  }
  return out;
}

// Seed the snapshot from an existing localStorage value (called on boot
// before user interaction, so we don't re-POST things we already have).
export function primeSnapshot(key: string, items: any[]) {
  snapshots.set(key, indexBy(items || []));
}
