/**
 * supabaseDb.ts
 * Cross-device real-time database layer using Supabase.
 * All orders and table alerts are written here so they sync
 * instantly between any browser / device.
 */

import { getSupabase, hasSupabase } from './supabaseClient';
import type { DemoOrder, DemoOrderStatus, DemoTableAlert } from '../demoDb';

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dXR5Z3p5enFuYnp6eGJqbmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg4NzUsImV4cCI6MjA4OTk1NDg3NX0.lhkB_ehhA2Eus_wnxvPqYFeNTdU4VqOOHs_7pOEMnjI';
const BASE = 'https://wuutygzyzqnbzzxbjnab.supabase.co/rest/v1';

/** Low-level fetch wrapper against Supabase REST API */
async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch { return null; }
}

// ── ORDERS ────────────────────────────────────────────────

export async function sbAddOrder(order: DemoOrder): Promise<void> {
  await sbFetch('/liora_orders', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      id: order.id,
      restaurant_id: order.restaurantId,
      restaurant_name: order.restaurantId, // restaurantId is set to name in AiWaiter
      customer_name: order.customerName,
      customer_email: order.customerEmail ?? null,
      table_number: order.tableNumber ?? null,
      items: order.items,
      status: order.status,
      total_cents: order.totalCents,
      notes: order.notes ?? null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }),
  });
}

export async function sbListOrders(restaurantName: string): Promise<DemoOrder[]> {
  const rows = await sbFetch(
    `/liora_orders?restaurant_name=eq.${encodeURIComponent(restaurantName)}&order=created_at.desc&limit=100`,
    { headers: { Prefer: 'return=representation' } }
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id,
    restaurantId: r.restaurant_id,
    customerName: r.customer_name ?? 'Guest',
    customerEmail: r.customer_email ?? undefined,
    tableNumber: r.table_number ?? undefined,
    items: r.items ?? [],
    status: r.status as DemoOrderStatus,
    totalCents: r.total_cents,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    notes: r.notes ?? undefined,
  }));
}

export async function sbUpdateOrderStatus(id: string, status: DemoOrderStatus): Promise<void> {
  await sbFetch(`/liora_orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, updated_at: Date.now() }),
  });
}

// ── TABLE ALERTS ──────────────────────────────────────────

export async function sbAddTableAlert(alert: Omit<DemoTableAlert, 'id' | 'createdAt' | 'status'> & { id: string }): Promise<void> {
  await sbFetch('/liora_table_alerts', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      id: alert.id,
      restaurant_name: alert.restaurantName,
      table_number: alert.tableNumber,
      action: alert.action,
      message: alert.message,
      status: 'active',
      created_at: Date.now(),
    }),
  });
}

export async function sbListTableAlerts(restaurantName: string): Promise<DemoTableAlert[]> {
  const rows = await sbFetch(
    `/liora_table_alerts?restaurant_name=eq.${encodeURIComponent(restaurantName)}&order=created_at.desc&limit=100`,
    { headers: { Prefer: 'return=representation' } }
  );
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({
    id: r.id,
    restaurantName: r.restaurant_name,
    tableNumber: r.table_number,
    action: r.action,
    message: r.message,
    status: r.status as 'active' | 'dismissed',
    createdAt: r.created_at,
  }));
}

export async function sbDismissTableAlert(id: string): Promise<void> {
  await sbFetch(`/liora_table_alerts?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'dismissed' }),
  });
}

export const isSupabaseReady = hasSupabase || true; // always true — hardcoded keys above
