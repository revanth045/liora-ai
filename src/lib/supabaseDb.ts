// supabaseDb.ts — API-backed shim.
// Supabase has been removed; these functions now proxy to the Neon-backed
// Express API so existing callers (RestaurantPortal, Inventory, Staff,
// Notifications, Overview, RestaurantsPage, demoAuth) keep working unchanged.

import { api } from './api';
import type {
  DemoOrder, DemoOrderStatus, DemoTableAlert,
  DemoStaffMember, DemoShift, DemoAttendanceRecord,
  DemoInventoryItem, DemoRestaurant,
} from '../demoDb';

// ─────────── Customer profiles ───────────
export interface SbCustomerProfile {
  id?: string;
  email: string;
  name?: string;
  city?: string;
  budget?: string;
  cuisines?: string[];
  spice_level?: number;
  allergens?: string[];
  diet?: string;
  avoid?: string[];
  vibe?: string;
  ai_tone?: string;
  ai_style?: string;
  summary?: string;
  experience_pts?: number;
  is_premium?: boolean;
  plan?: string;
  updated_at?: number;
}

export async function sbUpsertCustomerProfile(p: SbCustomerProfile): Promise<void> {
  await api.post('/api/customer-profiles', p).catch(() => {});
}
export async function sbGetCustomerProfile(email: string): Promise<SbCustomerProfile | null> {
  return api.get(`/api/customer-profiles/${encodeURIComponent(email)}`).catch(() => null);
}

// ─────────── Users (auth sync) ───────────
export async function sbUpsertUser(id: string, email: string, role: string, name?: string): Promise<void> {
  await api.post('/api/users', { id, email, role, name }).catch(() => {});
}

// ─────────── Restaurants ───────────
export async function sbUpsertRestaurant(r: Partial<DemoRestaurant> & { id: string; ownerId: string; name: string }): Promise<void> {
  await api.post('/api/restaurants', r).catch(() => {});
}
export async function sbGetRestaurantsByOwnerEmail(email: string): Promise<DemoRestaurant[]> {
  // Resolve ownerId via /api/users then fetch their restaurants.
  const users = await api.get(`/api/users?email=${encodeURIComponent(email)}`).catch(() => []);
  const owner = Array.isArray(users) ? users[0] : null;
  if (!owner) return [];
  const list = await api.get(`/api/restaurants?ownerId=${encodeURIComponent(owner.id)}`).catch(() => []);
  return Array.isArray(list) ? list : [];
}

// ─────────── Staff ───────────
export async function sbListStaff(restaurantId: string): Promise<DemoStaffMember[]> {
  const rows = await api.get(`/api/staff?restaurantId=${encodeURIComponent(restaurantId)}`).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbAddStaff(member: Omit<DemoStaffMember, 'id' | 'createdAt'>): Promise<DemoStaffMember | null> {
  return api.post('/api/staff', member).catch(() => null);
}
export async function sbUpdateStaff(member: DemoStaffMember): Promise<void> {
  await api.post('/api/staff', member).catch(() => {});
}
export async function sbDeleteStaff(id: string): Promise<void> {
  await api.del(`/api/staff/${encodeURIComponent(id)}`).catch(() => {});
}

// ─────────── Shifts ───────────
export async function sbListShifts(restaurantId: string, weekStart: string): Promise<DemoShift[]> {
  const rows = await api.get(`/api/shifts?restaurantId=${encodeURIComponent(restaurantId)}&weekStart=${weekStart}`).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbAddShift(shift: Omit<DemoShift, 'id'>): Promise<DemoShift | null> {
  return api.post('/api/shifts', shift).catch(() => null);
}
export async function sbUpdateShift(shift: DemoShift): Promise<void> {
  await api.post('/api/shifts', shift).catch(() => {});
}
export async function sbDeleteShift(id: string): Promise<void> {
  await api.del(`/api/shifts/${encodeURIComponent(id)}`).catch(() => {});
}

// ─────────── Attendance ───────────
export async function sbListAttendance(restaurantId: string, date?: string): Promise<DemoAttendanceRecord[]> {
  const url = date
    ? `/api/attendance?restaurantId=${encodeURIComponent(restaurantId)}&date=${date}`
    : `/api/attendance?restaurantId=${encodeURIComponent(restaurantId)}`;
  const rows = await api.get(url).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbUpsertAttendance(rec: DemoAttendanceRecord): Promise<void> {
  await api.post('/api/attendance', rec).catch(() => {});
}

// ─────────── Inventory ───────────
export async function sbListInventory(restaurantId: string): Promise<DemoInventoryItem[]> {
  const rows = await api.get(`/api/inventory?restaurantId=${encodeURIComponent(restaurantId)}`).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbAddInventoryItem(item: Omit<DemoInventoryItem, 'id' | 'updatedAt'>): Promise<DemoInventoryItem | null> {
  return api.post('/api/inventory', item).catch(() => null);
}
export async function sbUpdateInventoryItem(item: DemoInventoryItem): Promise<void> {
  await api.post('/api/inventory', item).catch(() => {});
}
export async function sbDeleteInventoryItem(id: string): Promise<void> {
  await api.del(`/api/inventory/${encodeURIComponent(id)}`).catch(() => {});
}

// ─────────── Orders ───────────
export async function sbAddOrder(order: DemoOrder): Promise<void> {
  await api.post('/api/orders', order).catch(() => {});
}
export async function sbListOrders(restaurantName: string): Promise<DemoOrder[]> {
  // Some flows pass the restaurant name where an id is expected; both are
  // valid lookups against the orders table because the AI Waiter uses the
  // restaurant name as the restaurantId.
  const rows = await api.get(`/api/orders?restaurantId=${encodeURIComponent(restaurantName)}`).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbUpdateOrderStatus(id: string, status: DemoOrderStatus): Promise<void> {
  await api.patch(`/api/orders/${encodeURIComponent(id)}/status`, { status }).catch(() => {});
}

// ─────────── Table alerts ───────────
export async function sbAddTableAlert(alert: Omit<DemoTableAlert, 'id' | 'createdAt' | 'status'> & { id: string }): Promise<void> {
  await api.post('/api/table-alerts', alert).catch(() => {});
}
export async function sbListTableAlerts(restaurantName: string): Promise<DemoTableAlert[]> {
  const rows = await api.get(`/api/table-alerts?restaurantName=${encodeURIComponent(restaurantName)}`).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
export async function sbDismissTableAlert(id: string): Promise<void> {
  await api.patch(`/api/table-alerts/${encodeURIComponent(id)}/dismiss`, {}).catch(() => {});
}

export const isSupabaseReady = true; // legacy flag; readers only check truthiness
