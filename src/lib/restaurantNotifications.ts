// Lightweight localStorage-backed notification log for restaurant owners.
// Mirrors `adminNotifications.ts` shape so the restaurant portal can show a
// unified "what just happened" feed (new orders, new reviews, replies, etc).

export type RestoNotificationKind =
  | 'review_received'
  | 'order_placed'
  | 'reservation_placed'
  | 'reply_posted';

export type RestoNotification = {
  id: string;
  restaurantId: string;
  kind: RestoNotificationKind;
  title: string;
  body?: string;
  meta?: Record<string, any>;
  read?: boolean;
  createdAt: number;
};

const NKEY = 'liora_resto_notifications';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function readAll(): RestoNotification[] {
  try { return JSON.parse(localStorage.getItem(NKEY) || '[]'); } catch { return []; }
}
function writeAll(list: RestoNotification[]) {
  localStorage.setItem(NKEY, JSON.stringify(list));
  try { window.dispatchEvent(new CustomEvent('liora:resto-notifications-changed')); } catch {}
}

export function restoNotify(input: Omit<RestoNotification, 'id' | 'createdAt' | 'read'>): RestoNotification {
  const n: RestoNotification = { ...input, id: uid(), createdAt: Date.now(), read: false };
  const list = readAll();
  list.unshift(n);
  writeAll(list.slice(0, 500));
  return n;
}

export function restoListNotifications(restaurantId?: string): RestoNotification[] {
  const list = readAll();
  return (restaurantId ? list.filter(n => n.restaurantId === restaurantId) : list)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function restoUnreadCount(restaurantId?: string): number {
  return restoListNotifications(restaurantId).filter(n => !n.read).length;
}

export function restoMarkRead(id: string) {
  const list = readAll();
  const i = list.findIndex(n => n.id === id);
  if (i >= 0) { list[i].read = true; writeAll(list); }
}

export function restoMarkAllRead(restaurantId?: string) {
  const list = readAll().map(n => (restaurantId && n.restaurantId !== restaurantId) ? n : { ...n, read: true });
  writeAll(list);
}

export function restoClear(id: string) {
  writeAll(readAll().filter(n => n.id !== id));
}
