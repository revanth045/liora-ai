import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from '../../auth';
import {
  db_adminListRestaurants, db_listActiveRestaurants, db_setRestaurantStatus,
  db_setRestaurantBanking, db_adminDeleteRestaurant, db_listAllOrders,
  type DemoRestaurant, type BankingDetails, type VenueStatus,
} from '../../demoDb';
import {
  db_adminListHotels, db_setHotelStatus, db_setHotelBanking, db_deleteHotel,
  db_listBookings, type DemoHotel,
} from '../../hotelDb';
import {
  ticketsAll, ticketsAddReply, ticketsSetStatus, ticketsCounts,
  ticketCategoryLabel, priorityTone, statusTone, type Ticket,
} from '../../lib/tickets';
import {
  adminListNotifications, adminMarkProcessed, adminMarkAllProcessed,
  adminClearNotification, adminPayoutsByVenue, adminUnprocessedCount,
  type AdminNotification,
} from '../../lib/adminNotifications';

type Tab = 'overview' | 'approvals' | 'restaurants' | 'hotels' | 'tickets' | 'payments' | 'customizations';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const ago = (ts: number) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const StatusPill: React.FC<{ status?: VenueStatus }> = ({ status }) => {
  const s = status || 'active';
  const tone = s === 'active' ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
    : s === 'pending' ? 'bg-amber-100 text-amber-800 ring-amber-200'
    : 'bg-rose-100 text-rose-700 ring-rose-200';
  return <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ring-1 ${tone}`}>{s}</span>;
};

export default function AdminPortal() {
  const [tab, setTab] = useState<Tab>('overview');
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(x => x + 1);

  useEffect(() => {
    const onTick = () => refresh();
    window.addEventListener('liora:admin-notifications-changed', onTick);
    window.addEventListener('liora:tickets-changed', onTick);
    return () => {
      window.removeEventListener('liora:admin-notifications-changed', onTick);
      window.removeEventListener('liora:tickets-changed', onTick);
    };
  }, []);

  const restaurants = useMemo(() => db_adminListRestaurants(), [tick]);
  const hotels = useMemo(() => db_adminListHotels(), [tick]);
  const tickets = useMemo(() => ticketsAll(), [tick]);
  const tCounts = useMemo(() => ticketsCounts(), [tick]);
  const notes = useMemo(() => adminListNotifications(), [tick]);
  const unprocessed = useMemo(() => adminUnprocessedCount(), [tick]);
  const payouts = useMemo(() => adminPayoutsByVenue(), [tick]);

  const pendingApprovals = useMemo(() => [
    ...restaurants.filter(r => r.status === 'pending').map(r => ({ kind: 'restaurant' as const, item: r })),
    ...hotels.filter(h => h.status === 'pending').map(h => ({ kind: 'hotel' as const, item: h })),
  ], [restaurants, hotels]);

  const onSignOut = async () => {
    await getAuth().signOut();
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: '◉' },
    { id: 'approvals', label: 'Approvals', icon: '◔', badge: pendingApprovals.length },
    { id: 'restaurants', label: 'Restaurants', icon: '◧' },
    { id: 'hotels', label: 'Hotels', icon: '◨' },
    { id: 'tickets', label: 'Support', icon: '◇', badge: tCounts.open + tCounts.in_progress },
    { id: 'payments', label: 'Payments', icon: '◈', badge: unprocessed },
    { id: 'customizations', label: 'Settings', icon: '◎' },
  ];

  return (
    <div className="min-h-dscreen bg-stone-50 text-stone-800 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-stone-950 text-white border-r border-stone-800 sticky top-0 h-dscreen">
        <div className="px-6 py-7 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-stone-950 font-display text-lg font-bold">L</div>
            <div className="leading-none">
              <p className="font-display text-lg text-white">Liora</p>
              <p className="text-[9px] font-bold text-amber-300 uppercase tracking-[0.32em] mt-1">Admin Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white text-stone-950 shadow-md'
                  : 'text-cream-100/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`text-base ${tab === t.id ? 'text-rose-500' : 'text-amber-300'}`}>{t.icon}</span>
                {t.label}
              </span>
              {!!t.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === t.id ? 'bg-rose-500 text-white' : 'bg-amber-300 text-stone-950'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 py-5 border-t border-stone-800">
          <button
            onClick={onSignOut}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-cream-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-stone-950 text-white z-40 border-b border-stone-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-stone-950 font-bold text-sm">L</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Admin</p>
          </div>
          <button onClick={onSignOut} className="text-xs font-semibold text-cream-100">Sign out</button>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${tab === t.id ? 'bg-white text-stone-950' : 'bg-white/5 text-cream-100'}`}
            >
              {t.label}{t.badge ? ` · ${t.badge}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-0 mt-24 md:mt-0 px-5 md:px-10 py-7 md:py-10 max-w-[1400px] mx-auto w-full">
        {tab === 'overview' && <OverviewTab restaurants={restaurants} hotels={hotels} tickets={tickets} notes={notes} pendingApprovals={pendingApprovals} payouts={payouts} onJump={setTab} />}
        {tab === 'approvals' && <ApprovalsTab pending={pendingApprovals} refresh={refresh} />}
        {tab === 'restaurants' && <RestaurantsTab restaurants={restaurants} refresh={refresh} />}
        {tab === 'hotels' && <HotelsTab hotels={hotels} refresh={refresh} />}
        {tab === 'tickets' && <TicketsTab tickets={tickets} counts={tCounts} refresh={refresh} />}
        {tab === 'payments' && <PaymentsTab notes={notes} payouts={payouts} restaurants={restaurants} hotels={hotels} refresh={refresh} />}
        {tab === 'customizations' && <CustomizationsTab />}
      </main>
    </div>
  );
}

// ---------------------- Overview ----------------------

const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: string; tone?: string; onClick?: () => void }> = ({ label, value, sub, tone, onClick }) => (
  <button
    onClick={onClick}
    className={`text-left p-5 rounded-2xl bg-white border border-stone-200 hover:shadow-md hover:border-stone-300 transition-all ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tone || 'text-stone-500'} mb-2`}>{label}</p>
    <p className="font-display text-3xl text-stone-900 leading-none">{value}</p>
    {sub && <p className="text-xs text-stone-500 mt-2">{sub}</p>}
  </button>
);

function OverviewTab({ restaurants, hotels, tickets, notes, pendingApprovals, payouts, onJump }: {
  restaurants: DemoRestaurant[]; hotels: DemoHotel[]; tickets: Ticket[]; notes: AdminNotification[];
  pendingApprovals: any[]; payouts: ReturnType<typeof adminPayoutsByVenue>; onJump: (t: Tab) => void;
}) {
  const totalPending = payouts.reduce((s, p) => s + p.pendingCents, 0);
  const orders = db_listAllOrders();
  const recent = notes.slice(0, 6);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-rose-500 mb-2">Super Admin</p>
        <h1 className="font-display text-4xl md:text-5xl font-extralight tracking-tight text-stone-900">Mission control.</h1>
        <p className="text-stone-600 mt-2 max-w-xl">Approve venues, manage banking, process payouts and respond to support — all from one console.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Restaurants" value={restaurants.length} sub={`${restaurants.filter(r => (r.status ?? 'active') === 'active').length} active · ${restaurants.filter(r => r.status === 'blocked').length} blocked`} onClick={() => onJump('restaurants')} />
        <Stat label="Hotels" value={hotels.length} sub={`${hotels.filter(h => (h.status ?? 'active') === 'active').length} active · ${hotels.filter(h => h.status === 'blocked').length} blocked`} onClick={() => onJump('hotels')} />
        <Stat label="Pending approval" value={pendingApprovals.length} tone="text-amber-600" sub="Awaiting review" onClick={() => onJump('approvals')} />
        <Stat label="Open tickets" value={tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} tone="text-sky-600" sub={`${tickets.length} total`} onClick={() => onJump('tickets')} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Payouts owed */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500">Payouts owed</p>
              <p className="font-display text-3xl text-stone-900 mt-1">{fmt(totalPending)}</p>
            </div>
            <button onClick={() => onJump('payments')} className="text-xs font-semibold text-rose-600 hover:underline">Process →</button>
          </div>
          {payouts.length === 0 ? (
            <p className="text-sm text-stone-500">No outstanding payouts.</p>
          ) : (
            <ul className="space-y-2">
              {payouts.slice(0, 5).map(p => (
                <li key={p.venueId} className="flex items-center justify-between text-sm py-2 border-b last:border-0 border-stone-100">
                  <span className="font-medium text-stone-800 truncate">{p.venueName}</span>
                  <span className="font-display text-stone-900">{fmt(p.pendingCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-4">Recent activity</p>
          {recent.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing yet — payment, booking and ticket events will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map(n => (
                <li key={n.id} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1 inline-block w-2 h-2 rounded-full flex-shrink-0 ${n.kind === 'payment_received' ? 'bg-emerald-500' : n.kind === 'booking_placed' ? 'bg-sky-500' : n.kind === 'ticket_opened' ? 'bg-amber-500' : 'bg-stone-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 truncate">
                      <span className="font-semibold">{n.venueName || n.kind}</span>
                      {n.amountCents != null && <span className="text-stone-500"> · {fmt(n.amountCents)}</span>}
                      {n.message && <span className="text-stone-500"> · {n.message}</span>}
                    </p>
                    <p className="text-[11px] text-stone-500">{n.kind.replace('_', ' ')} · {ago(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-7 grid md:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Lifetime orders</p>
          <p className="font-display text-3xl font-extralight">{orders.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Lifetime bookings</p>
          <p className="font-display text-3xl font-extralight">{hotels.reduce((s, h) => s + db_listBookings(h.id).length, 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Total processed</p>
          <p className="font-display text-3xl font-extralight">{fmt(payouts.reduce((s, p) => s + p.processedCents, 0))}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------- Approvals ----------------------

function ApprovalsTab({ pending, refresh }: { pending: Array<{ kind: 'restaurant' | 'hotel'; item: any }>; refresh: () => void }) {
  const onApprove = (kind: 'restaurant' | 'hotel', id: string) => {
    if (kind === 'restaurant') db_setRestaurantStatus(id, 'active');
    else db_setHotelStatus(id, 'active');
    refresh();
  };
  const onReject = (kind: 'restaurant' | 'hotel', id: string) => {
    const reason = prompt('Reason for rejection (will be visible to the venue):') || 'Rejected by admin';
    if (kind === 'restaurant') db_setRestaurantStatus(id, 'blocked', reason);
    else db_setHotelStatus(id, 'blocked', reason);
    refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-3xl font-extralight text-stone-900">Pending approvals</h2>
        <p className="text-stone-600 mt-1">New venues sit here until approved. Until then they don't appear to customers.</p>
      </header>

      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="font-display text-2xl text-stone-700 mb-2">All caught up.</p>
          <p className="text-sm text-stone-500">No venues are waiting for review.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map(({ kind, item }) => (
            <li key={`${kind}-${item.id}`} className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-stone-700 font-display text-xl flex-shrink-0">
                {item.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-stone-900 truncate">{item.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{kind}</span>
                  <StatusPill status={item.status} />
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {kind === 'restaurant'
                    ? `${item.cuisine || '—'}${item.address ? ' · ' + item.address : ''}`
                    : `${item.starRating ? item.starRating + '★' : '—'}${item.city ? ' · ' + item.city : ''}`}
                </p>
                {item.createdAt && <p className="text-[11px] text-stone-400 mt-1">Submitted {ago(item.createdAt)}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onReject(kind, item.id)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-700 border border-stone-300 hover:bg-stone-100"
                >
                  Reject
                </button>
                <button
                  onClick={() => onApprove(kind, item.id)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------- Restaurants ----------------------

function RestaurantsTab({ restaurants, refresh }: { restaurants: DemoRestaurant[]; refresh: () => void }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<DemoRestaurant | null>(null);
  const filtered = restaurants.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.cuisine || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extralight text-stone-900">Restaurants</h2>
          <p className="text-stone-600 mt-1">{restaurants.length} total · {restaurants.filter(r => (r.status ?? 'active') === 'active').length} active</p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or cuisine"
          className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            <tr>
              <th className="px-5 py-3 text-left">Restaurant</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Cuisine</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Banking</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-stone-500">No restaurants match.</td></tr>
            )}
            {filtered.map(r => {
              const status: VenueStatus = r.status ?? 'active';
              const hasBanking = !!(r.bankingDetails?.accountNumber || r.bankingDetails?.iban);
              return (
                <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-stone-900">{r.name}</p>
                    <p className="text-xs text-stone-500">{r.address || '—'}</p>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-stone-700">{r.cuisine || '—'}</td>
                  <td className="px-5 py-3"><StatusPill status={status} /></td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {hasBanking ? (
                      <span className="text-xs text-emerald-700 font-semibold">✓ {r.bankingDetails?.bankName || 'On file'}</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold">Missing</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button onClick={() => setEditing(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 hover:bg-stone-100">Banking</button>
                      {status !== 'active' && (
                        <button onClick={() => { db_setRestaurantStatus(r.id, 'active'); refresh(); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">Activate</button>
                      )}
                      {status !== 'blocked' && (
                        <button onClick={() => {
                          const reason = prompt('Block reason (optional):') || '';
                          db_setRestaurantStatus(r.id, 'blocked', reason);
                          refresh();
                        }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-50">Block</button>
                      )}
                      <button onClick={() => {
                        if (confirm(`Delete ${r.name}? This removes its menu and orders too.`)) {
                          db_adminDeleteRestaurant(r.id);
                          refresh();
                        }
                      }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-rose-700">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <BankingModal
          title={editing.name}
          banking={editing.bankingDetails || {}}
          onCancel={() => setEditing(null)}
          onSave={(b) => { db_setRestaurantBanking(editing.id, b); setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ---------------------- Hotels ----------------------

function HotelsTab({ hotels, refresh }: { hotels: DemoHotel[]; refresh: () => void }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<DemoHotel | null>(null);
  const filtered = hotels.filter(h => !q || h.name.toLowerCase().includes(q.toLowerCase()) || (h.city || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extralight text-stone-900">Hotels</h2>
          <p className="text-stone-600 mt-1">{hotels.length} total · {hotels.filter(h => (h.status ?? 'active') === 'active').length} active</p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or city"
          className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            <tr>
              <th className="px-5 py-3 text-left">Hotel</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Location</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Banking</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-stone-500">No hotels match.</td></tr>
            )}
            {filtered.map(h => {
              const status: VenueStatus = (h.status as VenueStatus) ?? 'active';
              const hasBanking = !!(h.bankingDetails?.accountNumber || h.bankingDetails?.iban);
              return (
                <tr key={h.id} className="border-t border-stone-100 hover:bg-stone-50/50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-stone-900">{h.name}</p>
                    <p className="text-xs text-stone-500">{h.starRating ? `${h.starRating}★` : '—'}</p>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-stone-700">{h.city || '—'}{h.country ? `, ${h.country}` : ''}</td>
                  <td className="px-5 py-3"><StatusPill status={status} /></td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {hasBanking ? (
                      <span className="text-xs text-emerald-700 font-semibold">✓ {h.bankingDetails?.bankName || 'On file'}</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold">Missing</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button onClick={() => setEditing(h)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 hover:bg-stone-100">Banking</button>
                      {status !== 'active' && (
                        <button onClick={() => { db_setHotelStatus(h.id, 'active'); refresh(); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">Activate</button>
                      )}
                      {status !== 'blocked' && (
                        <button onClick={() => {
                          const reason = prompt('Block reason (optional):') || '';
                          db_setHotelStatus(h.id, 'blocked', reason);
                          refresh();
                        }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-50">Block</button>
                      )}
                      <button onClick={() => {
                        if (confirm(`Delete ${h.name}? This removes its rooms and bookings too.`)) {
                          db_deleteHotel(h.id);
                          refresh();
                        }
                      }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-rose-700">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <BankingModal
          title={editing.name}
          banking={(editing.bankingDetails as BankingDetails) || {}}
          onCancel={() => setEditing(null)}
          onSave={(b) => { db_setHotelBanking(editing.id, b); setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ---------------------- Banking Modal ----------------------

function BankingModal({ title, banking, onCancel, onSave }: { title: string; banking: BankingDetails; onCancel: () => void; onSave: (b: BankingDetails) => void; }) {
  const [b, setB] = useState<BankingDetails>(banking);
  const upd = <K extends keyof BankingDetails>(k: K, v: BankingDetails[K]) => setB(s => ({ ...s, [k]: v }));

  const Field: React.FC<{ k: keyof BankingDetails; label: string; placeholder?: string; type?: string }> = ({ k, label, placeholder, type }) => (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">{label}</span>
      <input
        type={type || 'text'}
        value={(b[k] as any) ?? ''}
        onChange={e => upd(k, e.target.value as any)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Banking details</p>
            <h3 className="font-display text-2xl text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500 mt-1">Liora routes captured payments to this account during the next payout cycle.</p>
          </div>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field k="accountHolder" label="Account holder" placeholder="Acme Hospitality LLC" />
          <Field k="bankName" label="Bank name" placeholder="Chase Business" />
          <Field k="accountNumber" label="Account number" placeholder="••••••" />
          <Field k="routingNumber" label="Routing / sort code" placeholder="000000" />
          <Field k="iban" label="IBAN (intl.)" placeholder="GB29 NWBK 6016…" />
          <Field k="swift" label="SWIFT / BIC" placeholder="NWBKGB2L" />
          <Field k="country" label="Country" placeholder="US" />
          <Field k="payoutEmail" label="Payout notification email" type="email" placeholder="finance@venue.com" />
        </div>

        <label className="flex items-center gap-2 mt-5 text-sm text-stone-700">
          <input type="checkbox" checked={!!b.verified} onChange={e => upd('verified', e.target.checked)} className="rounded" />
          Mark as verified by admin (KYC complete)
        </label>

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-stone-200">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 border border-stone-300 hover:bg-stone-100">Cancel</button>
          <button onClick={() => onSave(b)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800">Save banking</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------- Tickets ----------------------

function TicketsTab({ tickets, counts, refresh }: { tickets: Ticket[]; counts: ReturnType<typeof ticketsCounts>; refresh: () => void }) {
  const [statusFilter, setStatusFilter] = useState<'open' | 'in_progress' | 'resolved' | 'closed' | 'all'>('open');
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');

  const filtered = tickets.filter(t => statusFilter === 'all' ? true : t.status === statusFilter);

  const submitReply = () => {
    if (!openTicket || !reply.trim()) return;
    ticketsAddReply(openTicket.id, { authorRole: 'admin', authorName: 'Liora Admin', body: reply.trim() });
    setReply('');
    refresh();
    // refresh open ticket reference
    setTimeout(() => {
      const fresh = ticketsAll().find(t => t.id === openTicket.id);
      if (fresh) setOpenTicket(fresh);
    }, 50);
  };

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-extralight text-stone-900">Support tickets</h2>
        <p className="text-stone-600 mt-1">{counts.total} total · {counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved</p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {(['open', 'in_progress', 'resolved', 'closed', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${statusFilter === s ? 'bg-stone-900 text-white' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'}`}
          >
            {s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
            No tickets match this filter.
          </div>
        )}
        {filtered.map(t => (
          <button
            key={t.id}
            onClick={() => setOpenTicket(t)}
            className="text-left bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md hover:border-stone-300 transition-all"
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusTone(t.status)}`}>{t.status.replace('_', ' ')}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityTone(t.priority)}`}>{t.priority}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{t.scope}</span>
              <span className="text-[10px] text-stone-500 ml-auto">{ago(t.updatedAt)}</span>
            </div>
            <p className="font-semibold text-stone-900 line-clamp-1">{t.subject}</p>
            <p className="text-xs text-stone-500 mt-1">{ticketCategoryLabel(t.category)} · {t.fromName || t.fromEmail || 'Anonymous'}{t.venueName ? ` · ${t.venueName}` : ''}</p>
            <p className="text-sm text-stone-600 mt-2 line-clamp-2">{t.body}</p>
            {t.replies.length > 0 && <p className="text-[11px] text-sky-600 mt-2 font-semibold">{t.replies.length} repl{t.replies.length === 1 ? 'y' : 'ies'}</p>}
          </button>
        ))}
      </div>

      {openTicket && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-stone-200 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusTone(openTicket.status)}`}>{openTicket.status.replace('_', ' ')}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityTone(openTicket.priority)}`}>{openTicket.priority}</span>
                  <span className="text-[10px] text-stone-500">#{openTicket.id}</span>
                </div>
                <h3 className="font-display text-xl text-stone-900">{openTicket.subject}</h3>
                <p className="text-xs text-stone-500 mt-1">{ticketCategoryLabel(openTicket.category)} · from {openTicket.fromName || openTicket.fromEmail || 'Anonymous'}{openTicket.venueName ? ` · ${openTicket.venueName}` : ''}</p>
              </div>
              <button onClick={() => setOpenTicket(null)} className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Original message · {ago(openTicket.createdAt)}</p>
                <p className="text-sm text-stone-800 whitespace-pre-wrap">{openTicket.body}</p>
              </div>
              {openTicket.replies.map(r => (
                <div key={r.id} className={`rounded-xl p-4 ${r.authorRole === 'admin' ? 'bg-rose-50 border border-rose-100' : 'bg-stone-50'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                    {r.authorRole === 'admin' ? '↩ Liora Admin' : r.authorName || r.authorRole} · {ago(r.createdAt)}
                  </p>
                  <p className="text-sm text-stone-800 whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-stone-200 space-y-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <div className="flex gap-2 flex-wrap justify-between items-center">
                <div className="flex gap-2">
                  <button onClick={() => { ticketsSetStatus(openTicket.id, 'resolved'); refresh(); setOpenTicket({ ...openTicket, status: 'resolved' }); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50">Mark resolved</button>
                  <button onClick={() => { ticketsSetStatus(openTicket.id, 'closed'); refresh(); setOpenTicket({ ...openTicket, status: 'closed' }); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 border border-stone-300 hover:bg-stone-100">Close</button>
                </div>
                <button onClick={submitReply} disabled={!reply.trim()} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed">Send reply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------- Payments ----------------------

function PaymentsTab({ notes, payouts, restaurants, hotels, refresh }: {
  notes: AdminNotification[]; payouts: ReturnType<typeof adminPayoutsByVenue>;
  restaurants: DemoRestaurant[]; hotels: DemoHotel[]; refresh: () => void;
}) {
  const venueBanking = (id: string) => {
    const r = restaurants.find(x => x.id === id);
    if (r) return !!(r.bankingDetails?.accountNumber || r.bankingDetails?.iban);
    const h = hotels.find(x => x.id === id);
    return !!(h?.bankingDetails?.accountNumber || h?.bankingDetails?.iban);
  };
  const totalPending = payouts.reduce((s, p) => s + p.pendingCents, 0);
  const totalProcessed = payouts.reduce((s, p) => s + p.processedCents, 0);
  const paymentNotes = notes.filter(n => n.kind === 'payment_received' || n.kind === 'order_placed' || n.kind === 'booking_placed');

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extralight text-stone-900">Payments &amp; payouts</h2>
          <p className="text-stone-600 mt-1">When a customer pays, the funds land here. Process the payout to the venue's account on file.</p>
        </div>
        {paymentNotes.some(n => !n.processedAt) && (
          <button onClick={() => { adminMarkAllProcessed(); refresh(); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800">
            Mark all processed
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Pending payouts" value={fmt(totalPending)} sub={`${payouts.filter(p => p.pendingCents > 0).length} venues`} tone="text-rose-600" />
        <Stat label="Total processed" value={fmt(totalProcessed)} sub="Lifetime" tone="text-emerald-600" />
        <Stat label="Activity events" value={paymentNotes.length} sub={`${paymentNotes.filter(n => !n.processedAt).length} unprocessed`} tone="text-sky-600" />
      </div>

      {/* Payouts by venue */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-500 mb-4">Payouts by venue</p>
        {payouts.length === 0 ? (
          <p className="text-sm text-stone-500">No payouts yet — once a customer pays for an order or books a stay it will appear here.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {payouts.map(p => (
              <li key={p.venueId} className="py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{p.venueName}</p>
                  <p className="text-xs text-stone-500">
                    {p.venueType} · last event {ago(p.lastEventAt)} ·{' '}
                    {venueBanking(p.venueId) ? (
                      <span className="text-emerald-700 font-semibold">banking on file</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">⚠ banking missing</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-stone-900">{fmt(p.pendingCents)}</p>
                  <p className="text-[11px] text-stone-500">pending</p>
                </div>
                <p className="text-right hidden md:block">
                  <span className="font-display text-lg text-emerald-700">{fmt(p.processedCents)}</span>
                  <span className="block text-[11px] text-stone-500">paid out</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Activity stream */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-4">Activity stream</p>
        {paymentNotes.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {paymentNotes.slice(0, 50).map(n => (
              <li key={n.id} className="py-3 flex items-center gap-4">
                <span className={`mt-1 inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.processedAt ? 'bg-stone-300' : (n.kind === 'payment_received' ? 'bg-emerald-500' : n.kind === 'booking_placed' ? 'bg-sky-500' : 'bg-amber-500')}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800">
                    <span className="font-semibold">{n.venueName}</span>
                    <span className="text-stone-500"> · {n.kind.replace('_', ' ')}</span>
                    {n.meta?.customerName && <span className="text-stone-500"> · {n.meta.customerName}</span>}
                    {n.meta?.guestName && <span className="text-stone-500"> · {n.meta.guestName}</span>}
                  </p>
                  <p className="text-[11px] text-stone-500">{ago(n.createdAt)}{n.processedAt ? ` · processed ${ago(n.processedAt)}` : ''}</p>
                </div>
                <p className="font-display text-base text-stone-900">{n.amountCents != null ? fmt(n.amountCents) : '—'}</p>
                {!n.processedAt ? (
                  <button onClick={() => { adminMarkProcessed(n.id); refresh(); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">Process</button>
                ) : (
                  <button onClick={() => { adminClearNotification(n.id); refresh(); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-rose-700">Clear</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------- Customizations ----------------------

const SETTINGS_KEY = 'liora_admin_platform_settings';
type PlatformSettings = {
  commissionPct?: number;
  payoutScheduleDays?: number;
  autoApproveSignups?: boolean;
  supportEmail?: string;
  brandTagline?: string;
};

function CustomizationsTab() {
  const [s, setS] = useState<PlatformSettings>(() => {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="font-display text-3xl font-extralight text-stone-900">Platform settings</h2>
        <p className="text-stone-600 mt-1">Tune how Liora behaves across every venue.</p>
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Liora commission (%)</span>
          <input type="number" min={0} max={50} value={s.commissionPct ?? ''} onChange={e => setS({ ...s, commissionPct: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" />
          <span className="text-xs text-stone-500 mt-1 block">Deducted from each captured payment before payout.</span>
        </label>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Payout schedule (days)</span>
          <input type="number" min={1} max={30} value={s.payoutScheduleDays ?? ''} onChange={e => setS({ ...s, payoutScheduleDays: Number(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" />
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={!!s.autoApproveSignups} onChange={e => setS({ ...s, autoApproveSignups: e.target.checked })} className="rounded" />
          <span className="text-sm text-stone-800">Auto-approve new venue sign-ups (skip the approval queue)</span>
        </label>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Customer support email</span>
          <input type="email" value={s.supportEmail ?? ''} onChange={e => setS({ ...s, supportEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" placeholder="support@liora.app" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Platform tagline</span>
          <input value={s.brandTagline ?? ''} onChange={e => setS({ ...s, brandTagline: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm" placeholder="A private AI concierge for those who consider every meal an occasion." />
        </label>

        <div className="flex justify-end items-center gap-3 pt-3 border-t border-stone-100">
          {saved && <span className="text-xs text-emerald-600 font-semibold">✓ Saved</span>}
          <button onClick={save} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-stone-900 hover:bg-stone-800">Save settings</button>
        </div>
      </div>
    </div>
  );
}
