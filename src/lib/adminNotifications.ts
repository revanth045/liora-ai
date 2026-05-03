// Lightweight localStorage-backed event log for the super-admin console.
// Captures payment / booking / signup events so the admin can process payouts.

export type AdminNotificationKind =
  | 'order_placed'
  | 'payment_received'
  | 'booking_placed'
  | 'venue_signup'
  | 'ticket_opened';

export type AdminNotification = {
  id: string;
  kind: AdminNotificationKind;
  venueId?: string;
  venueName?: string;
  venueType?: 'restaurant' | 'hotel';
  amountCents?: number;
  message?: string;
  meta?: Record<string, any>;
  createdAt: number;
  /** Set by the admin when the payout has been processed (or notification dismissed). */
  processedAt?: number;
};

const NKEY = 'liora_admin_notifications';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function read(): AdminNotification[] {
  try { return JSON.parse(localStorage.getItem(NKEY) || '[]'); } catch { return []; }
}
function write(list: AdminNotification[]) {
  localStorage.setItem(NKEY, JSON.stringify(list));
  try { window.dispatchEvent(new CustomEvent('liora:admin-notifications-changed')); } catch {}
}

export function adminNotify(input: Omit<AdminNotification, 'id' | 'createdAt'>): AdminNotification {
  const n: AdminNotification = { ...input, id: uid(), createdAt: Date.now() };
  const list = read();
  list.unshift(n);
  // Cap to most recent 500
  write(list.slice(0, 500));
  return n;
}

export function adminListNotifications(): AdminNotification[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function adminUnprocessedCount(): number {
  return read().filter(n => !n.processedAt).length;
}

export function adminMarkProcessed(id: string) {
  const list = read();
  const i = list.findIndex(n => n.id === id);
  if (i >= 0) { list[i].processedAt = Date.now(); write(list); }
}

export function adminMarkAllProcessed() {
  const list = read().map(n => n.processedAt ? n : { ...n, processedAt: Date.now() });
  write(list);
}

export function adminClearNotification(id: string) {
  write(read().filter(n => n.id !== id));
}

/** Sum of pending payouts owed per venue based on captured payments. */
export function adminPayoutsByVenue(): Array<{ venueId: string; venueName: string; venueType: 'restaurant' | 'hotel'; pendingCents: number; processedCents: number; lastEventAt: number }> {
  const list = read();
  const map = new Map<string, { venueId: string; venueName: string; venueType: 'restaurant' | 'hotel'; pendingCents: number; processedCents: number; lastEventAt: number }>();
  for (const n of list) {
    if (!n.venueId || !n.amountCents) continue;
    if (n.kind !== 'payment_received' && n.kind !== 'booking_placed' && n.kind !== 'order_placed') continue;
    const key = n.venueId;
    const cur = map.get(key) || {
      venueId: n.venueId,
      venueName: n.venueName || 'Unknown',
      venueType: n.venueType || 'restaurant',
      pendingCents: 0,
      processedCents: 0,
      lastEventAt: 0,
    };
    if (n.processedAt) cur.processedCents += n.amountCents;
    else cur.pendingCents += n.amountCents;
    if (n.createdAt > cur.lastEventAt) cur.lastEventAt = n.createdAt;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.pendingCents - a.pendingCents);
}
