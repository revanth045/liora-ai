// Persistent ticket store backing every Support page.
import { adminNotify } from './adminNotifications';

export type TicketScope = 'consumer' | 'restaurant' | 'hotel';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory =
  | 'order_issue'
  | 'payment_issue'
  | 'account'
  | 'food_quality'
  | 'delivery'
  | 'booking_issue'
  | 'banking_payouts'
  | 'technical'
  | 'feature_request'
  | 'billing'
  | 'other';

export type TicketReply = {
  id: string;
  authorRole: 'customer' | 'venue' | 'admin' | 'system';
  authorName?: string;
  body: string;
  createdAt: number;
};

export type Ticket = {
  id: string;
  scope: TicketScope;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  body: string;
  fromUserId?: string;
  fromEmail?: string;
  fromName?: string;
  fromRole?: string;
  /** For restaurant/hotel scope tickets: the venue raising it. */
  venueId?: string;
  venueName?: string;
  /** For consumer order/booking issues: optional reference. */
  orderId?: string;
  bookingId?: string;
  replies: TicketReply[];
  createdAt: number;
  updatedAt: number;
};

const TKEY = 'liora_support_tickets';
const uid = () => 'tk_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

function read(): Ticket[] {
  try { return JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch { return []; }
}
function write(list: Ticket[]) {
  localStorage.setItem(TKEY, JSON.stringify(list));
  try { window.dispatchEvent(new CustomEvent('liora:tickets-changed')); } catch {}
}

export function ticketsList(filter?: { scope?: TicketScope; status?: TicketStatus | 'any'; userId?: string; venueId?: string }): Ticket[] {
  let list = read();
  if (filter?.scope) list = list.filter(t => t.scope === filter.scope);
  if (filter?.status && filter.status !== 'any') list = list.filter(t => t.status === filter.status);
  if (filter?.userId) list = list.filter(t => t.fromUserId === filter.userId);
  if (filter?.venueId) list = list.filter(t => t.venueId === filter.venueId);
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function ticketsAll(): Ticket[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function ticketsCreate(input: Omit<Ticket, 'id' | 'replies' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TicketStatus }): Ticket {
  const now = Date.now();
  const t: Ticket = {
    ...input,
    id: uid(),
    status: input.status || 'open',
    replies: [],
    createdAt: now,
    updatedAt: now,
  };
  const list = read();
  list.unshift(t);
  write(list);
  // Notify admin
  try {
    adminNotify({
      kind: 'ticket_opened',
      venueId: t.venueId,
      venueName: t.venueName,
      venueType: t.scope === 'hotel' ? 'hotel' : (t.scope === 'restaurant' ? 'restaurant' : undefined),
      message: `[${t.priority.toUpperCase()}] ${t.subject}`,
      meta: { ticketId: t.id, scope: t.scope, category: t.category, fromEmail: t.fromEmail },
    });
  } catch {}
  return t;
}

export function ticketsAddReply(id: string, reply: Omit<TicketReply, 'id' | 'createdAt'>): Ticket | null {
  const list = read();
  const i = list.findIndex(t => t.id === id);
  if (i < 0) return null;
  const r: TicketReply = { ...reply, id: uid(), createdAt: Date.now() };
  list[i].replies.push(r);
  list[i].updatedAt = Date.now();
  if (list[i].status === 'open' && reply.authorRole === 'admin') list[i].status = 'in_progress';
  write(list);
  return list[i];
}

export function ticketsSetStatus(id: string, status: TicketStatus): Ticket | null {
  const list = read();
  const i = list.findIndex(t => t.id === id);
  if (i < 0) return null;
  list[i].status = status;
  list[i].updatedAt = Date.now();
  write(list);
  return list[i];
}

export function ticketsCounts(): { open: number; in_progress: number; resolved: number; closed: number; total: number } {
  const list = read();
  const c = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: list.length };
  list.forEach(t => { (c as any)[t.status] += 1; });
  return c;
}

export function ticketCategoryLabel(c: TicketCategory): string {
  const map: Record<TicketCategory, string> = {
    order_issue: 'Order issue',
    payment_issue: 'Payment issue',
    account: 'Account & login',
    food_quality: 'Food quality',
    delivery: 'Delivery / pickup',
    booking_issue: 'Booking issue',
    banking_payouts: 'Banking & payouts',
    technical: 'Technical issue',
    feature_request: 'Feature request',
    billing: 'Billing inquiry',
    other: 'Other',
  };
  return map[c] || c;
}

export function priorityTone(p: TicketPriority): string {
  return p === 'urgent' ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
    : p === 'high' ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    : p === 'normal' ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
    : 'bg-stone-100 text-stone-600 ring-1 ring-stone-200';
}

export function statusTone(s: TicketStatus): string {
  return s === 'open' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    : s === 'in_progress' ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
    : s === 'resolved' ? 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
    : 'bg-stone-200 text-stone-500 ring-1 ring-stone-300';
}
