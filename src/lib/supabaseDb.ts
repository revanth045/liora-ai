/**
 * supabaseDb.ts  — Full platform Supabase DB layer
 * All writes go here for cross-device persistence.
 * Falls back silently so the app still works if Supabase is unreachable.
 */

import type {
  DemoOrder, DemoOrderStatus, DemoTableAlert,
  DemoStaffMember, DemoShift, DemoAttendanceRecord,
  DemoInventoryItem, DemoRestaurant,
} from '../demoDb';

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dXR5Z3p5enFuYnp6eGJqbmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg4NzUsImV4cCI6MjA4OTk1NDg3NX0.lhkB_ehhA2Eus_wnxvPqYFeNTdU4VqOOHs_7pOEMnjI';
const BASE = 'https://wuutygzyzqnbzzxbjnab.supabase.co/rest/v1';

async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch { return null; }
}

const sb = {
  get: (path: string) => sbFetch(path),
  post: (path: string, body: object, prefer = 'return=representation') =>
    sbFetch(path, { method: 'POST', headers: { Prefer: prefer }, body: JSON.stringify(body) }),
  patch: (path: string, body: object) =>
    sbFetch(path, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) }),
  del: (path: string) =>
    sbFetch(path, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }),
  upsert: (path: string, body: object) =>
    sbFetch(path, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────────
// CUSTOMER PROFILES
// ─────────────────────────────────────────────────

export interface SbCustomerProfile {
  id: string;
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
  await sb.upsert('/liora_customer_profiles', { ...p, updated_at: Date.now() });
}

export async function sbGetCustomerProfile(email: string): Promise<SbCustomerProfile | null> {
  const rows = await sb.get(`/liora_customer_profiles?email=eq.${encodeURIComponent(email)}&limit=1`);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// ─────────────────────────────────────────────────
// USERS (auth sync)
// ─────────────────────────────────────────────────

export async function sbUpsertUser(id: string, email: string, role: string, name?: string): Promise<void> {
  await sb.upsert('/liora_users', { id, email, role, name, last_login_at: Date.now() });
}

// ─────────────────────────────────────────────────
// RESTAURANTS
// ─────────────────────────────────────────────────

export async function sbUpsertRestaurant(r: DemoRestaurant): Promise<void> {
  await sb.upsert('/liora_restaurants', {
    id: r.id,
    owner_id: r.ownerId,
    name: r.name,
    address: r.address ?? null,
    phone: r.phone ?? null,
    website: r.website ?? null,
    cuisine: r.cuisine ?? null,
    bio: r.bio ?? null,
    staff_code: r.staffCode ?? null,
    hours: r.hours ?? [],
    updated_at: Date.now(),
  });
}

export async function sbGetRestaurantsByOwnerEmail(email: string): Promise<DemoRestaurant[]> {
  // First find ownerId from users table
  const users = await sb.get(`/liora_users?email=eq.${encodeURIComponent(email)}&limit=1`);
  if (!Array.isArray(users) || users.length === 0) return [];
  const ownerId = users[0].id;
  const rows = await sb.get(`/liora_restaurants?owner_id=eq.${encodeURIComponent(ownerId)}`);
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, ownerId: r.owner_id, name: r.name,
    address: r.address ?? undefined, phone: r.phone ?? undefined,
    website: r.website ?? undefined, cuisine: r.cuisine ?? undefined,
    bio: r.bio ?? undefined, staffCode: r.staff_code ?? undefined,
    hours: r.hours ?? [],
  }));
}

// ─────────────────────────────────────────────────
// STAFF MANAGEMENT
// ─────────────────────────────────────────────────

export async function sbListStaff(restaurantId: string): Promise<DemoStaffMember[]> {
  const rows = await sb.get(`/liora_staff?restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=name.asc`);
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, restaurantId: r.restaurant_id, name: r.name,
    role: r.role, phone: r.phone ?? undefined, email: r.email ?? undefined,
    hourlyRate: r.hourly_rate != null ? Number(r.hourly_rate) : undefined,
    status: r.status, notes: r.notes ?? undefined, createdAt: r.created_at,
  }));
}

export async function sbAddStaff(member: Omit<DemoStaffMember, 'id' | 'createdAt'>): Promise<DemoStaffMember | null> {
  const rows = await sb.post('/liora_staff', {
    id: `stf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    restaurant_id: member.restaurantId, name: member.name, role: member.role,
    phone: member.phone ?? null, email: member.email ?? null,
    hourly_rate: member.hourlyRate ?? null, status: member.status,
    notes: member.notes ?? null, created_at: Date.now(),
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, restaurantId: r.restaurant_id, name: r.name, role: r.role,
    phone: r.phone ?? undefined, email: r.email ?? undefined,
    hourlyRate: r.hourly_rate != null ? Number(r.hourly_rate) : undefined,
    status: r.status, notes: r.notes ?? undefined, createdAt: r.created_at };
}

export async function sbUpdateStaff(member: DemoStaffMember): Promise<void> {
  await sb.patch(`/liora_staff?id=eq.${encodeURIComponent(member.id)}`, {
    name: member.name, role: member.role, phone: member.phone ?? null,
    email: member.email ?? null, hourly_rate: member.hourlyRate ?? null,
    status: member.status, notes: member.notes ?? null,
  });
}

export async function sbDeleteStaff(id: string): Promise<void> {
  await sb.del(`/liora_staff?id=eq.${encodeURIComponent(id)}`);
  await sb.del(`/liora_shifts?staff_id=eq.${encodeURIComponent(id)}`);
}

// ─────────────────────────────────────────────────
// SHIFTS
// ─────────────────────────────────────────────────

export async function sbListShifts(restaurantId: string, weekStart: string): Promise<DemoShift[]> {
  const rows = await sb.get(
    `/liora_shifts?restaurant_id=eq.${encodeURIComponent(restaurantId)}&week_start=eq.${weekStart}`
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, restaurantId: r.restaurant_id, staffId: r.staff_id,
    weekStart: r.week_start, day: r.day,
    startTime: r.start_time, endTime: r.end_time, notes: r.notes ?? undefined,
  }));
}

export async function sbAddShift(shift: Omit<DemoShift, 'id'>): Promise<DemoShift | null> {
  const rows = await sb.post('/liora_shifts', {
    id: `shf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    restaurant_id: shift.restaurantId, staff_id: shift.staffId,
    week_start: shift.weekStart, day: shift.day,
    start_time: shift.startTime, end_time: shift.endTime, notes: shift.notes ?? null,
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, restaurantId: r.restaurant_id, staffId: r.staff_id,
    weekStart: r.week_start, day: r.day, startTime: r.start_time,
    endTime: r.end_time, notes: r.notes ?? undefined };
}

export async function sbUpdateShift(shift: DemoShift): Promise<void> {
  await sb.patch(`/liora_shifts?id=eq.${encodeURIComponent(shift.id)}`, {
    staff_id: shift.staffId, day: shift.day,
    start_time: shift.startTime, end_time: shift.endTime, notes: shift.notes ?? null,
  });
}

export async function sbDeleteShift(id: string): Promise<void> {
  await sb.del(`/liora_shifts?id=eq.${encodeURIComponent(id)}`);
}

// ─────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────

export async function sbListAttendance(restaurantId: string, date?: string): Promise<DemoAttendanceRecord[]> {
  let path = `/liora_attendance?restaurant_id=eq.${encodeURIComponent(restaurantId)}`;
  if (date) path += `&date=eq.${date}`;
  const rows = await sb.get(path);
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, staffId: r.staff_id, restaurantId: r.restaurant_id,
    date: r.date, clockIn: r.clock_in ?? '', clockOut: r.clock_out ?? '',
    status: r.status, notes: r.notes ?? '',
  }));
}

export async function sbUpsertAttendance(rec: DemoAttendanceRecord): Promise<void> {
  await sb.upsert('/liora_attendance', {
    id: rec.id, staff_id: rec.staffId, restaurant_id: rec.restaurantId,
    date: rec.date, clock_in: rec.clockIn || null, clock_out: rec.clockOut || null,
    status: rec.status, notes: rec.notes || null,
  });
}

// ─────────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────────

export async function sbListInventory(restaurantId: string): Promise<DemoInventoryItem[]> {
  const rows = await sb.get(
    `/liora_inventory?restaurant_id=eq.${encodeURIComponent(restaurantId)}&order=name.asc`
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, restaurantId: r.restaurant_id, name: r.name,
    category: r.category, quantity: Number(r.quantity), unit: r.unit,
    reorderPoint: Number(r.reorder_point),
    costPerUnit: r.cost_per_unit != null ? Number(r.cost_per_unit) : undefined,
    supplier: r.supplier ?? undefined, notes: r.notes ?? undefined,
    updatedAt: r.updated_at,
  }));
}

export async function sbAddInventoryItem(item: Omit<DemoInventoryItem, 'id' | 'updatedAt'>): Promise<DemoInventoryItem | null> {
  const rows = await sb.post('/liora_inventory', {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    restaurant_id: item.restaurantId, name: item.name, category: item.category,
    quantity: item.quantity, unit: item.unit, reorder_point: item.reorderPoint,
    cost_per_unit: item.costPerUnit ?? null, supplier: item.supplier ?? null,
    notes: item.notes ?? null, updated_at: Date.now(),
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, restaurantId: r.restaurant_id, name: r.name,
    category: r.category, quantity: Number(r.quantity), unit: r.unit,
    reorderPoint: Number(r.reorder_point),
    costPerUnit: r.cost_per_unit != null ? Number(r.cost_per_unit) : undefined,
    supplier: r.supplier ?? undefined, notes: r.notes ?? undefined,
    updatedAt: r.updated_at };
}

export async function sbUpdateInventoryItem(item: DemoInventoryItem): Promise<void> {
  await sb.patch(`/liora_inventory?id=eq.${encodeURIComponent(item.id)}`, {
    name: item.name, category: item.category, quantity: item.quantity,
    unit: item.unit, reorder_point: item.reorderPoint,
    cost_per_unit: item.costPerUnit ?? null, supplier: item.supplier ?? null,
    notes: item.notes ?? null, updated_at: Date.now(),
  });
}

export async function sbDeleteInventoryItem(id: string): Promise<void> {
  await sb.del(`/liora_inventory?id=eq.${encodeURIComponent(id)}`);
}

// ─────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────

export async function sbAddOrder(order: DemoOrder): Promise<void> {
  await sb.upsert('/liora_orders', {
    id: order.id, restaurant_id: order.restaurantId,
    restaurant_name: order.restaurantId, // restaurantId = name in AI Waiter flow
    customer_name: order.customerName ?? null,
    customer_email: order.customerEmail ?? null,
    table_number: order.tableNumber ?? null,
    items: order.items, status: order.status,
    total_cents: order.totalCents, notes: order.notes ?? null,
    created_at: order.createdAt, updated_at: order.updatedAt,
  });
}

export async function sbListOrders(restaurantName: string): Promise<DemoOrder[]> {
  const rows = await sb.get(
    `/liora_orders?restaurant_name=eq.${encodeURIComponent(restaurantName)}&order=created_at.desc&limit=100`
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, restaurantId: r.restaurant_id,
    customerName: r.customer_name ?? 'Guest', customerEmail: r.customer_email ?? undefined,
    tableNumber: r.table_number ?? undefined, items: r.items ?? [],
    status: r.status as DemoOrderStatus, totalCents: r.total_cents,
    createdAt: r.created_at, updatedAt: r.updated_at, notes: r.notes ?? undefined,
  }));
}

export async function sbUpdateOrderStatus(id: string, status: DemoOrderStatus): Promise<void> {
  await sb.patch(`/liora_orders?id=eq.${encodeURIComponent(id)}`, { status, updated_at: Date.now() });
}

// ─────────────────────────────────────────────────
// TABLE ALERTS
// ─────────────────────────────────────────────────

export async function sbAddTableAlert(alert: Omit<DemoTableAlert, 'id' | 'createdAt' | 'status'> & { id: string }): Promise<void> {
  await sb.upsert('/liora_table_alerts', {
    id: alert.id, restaurant_name: alert.restaurantName,
    table_number: alert.tableNumber, action: alert.action,
    message: alert.message, status: 'active', created_at: Date.now(),
  });
}

export async function sbListTableAlerts(restaurantName: string): Promise<DemoTableAlert[]> {
  const rows = await sb.get(
    `/liora_table_alerts?restaurant_name=eq.${encodeURIComponent(restaurantName)}&order=created_at.desc&limit=100`
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id, restaurantName: r.restaurant_name, tableNumber: r.table_number,
    action: r.action, message: r.message,
    status: r.status as 'active' | 'dismissed', createdAt: r.created_at,
  }));
}

export async function sbDismissTableAlert(id: string): Promise<void> {
  await sb.patch(`/liora_table_alerts?id=eq.${encodeURIComponent(id)}`, { status: 'dismissed' });
}

export const isSupabaseReady = true;
