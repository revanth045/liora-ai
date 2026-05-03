import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from '../../auth';
import {
  db_listOrders,
  db_updateOrderStatus,
  db_getRestaurantById,
  DemoOrder,
  DemoOrderStatus,
} from '../../demoDb';
import { LogoMark } from '../../../components/Logo';
import { useSettings } from '../../context/SettingsContext';
import SettingsPanel from '../../components/SettingsPanel';

const STATUS_FLOW: DemoOrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => ctx.close();
  } catch {}
}

type FilterTab = 'active' | 'ready' | 'done' | 'all';

const STATUS_LABELS: Record<DemoOrderStatus, string> = {
  pending: 'New',
  preparing: 'Cooking',
  ready: 'Ready',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

const STATUS_COLOURS: Record<DemoOrderStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-200 border-amber-500/40 ring-amber-500/30',
  preparing: 'bg-sky-500/20 text-sky-200 border-sky-500/40 ring-sky-500/30',
  ready: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 ring-emerald-500/30',
  delivered: 'bg-stone-700/40 text-stone-300 border-stone-600/40 ring-stone-600/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/40 ring-red-500/30',
};

const STATUS_GLOW: Record<DemoOrderStatus, string> = {
  pending:   'shadow-[0_0_0_1px_rgb(245_158_11_/_.3),0_8px_28px_-12px_rgb(245_158_11_/_.55)] border-amber-500/40 bg-amber-950/30',
  preparing: 'border-sky-500/30 bg-sky-950/25',
  ready:     'border-emerald-500/30 bg-emerald-950/25',
  delivered: 'border-stone-700/40 bg-stone-900/40',
  rejected:  'border-red-700/40 bg-red-950/25',
};

function filterOrders(orders: DemoOrder[], tab: FilterTab): DemoOrder[] {
  switch (tab) {
    case 'active': return orders.filter(o => o.status === 'pending' || o.status === 'preparing');
    case 'ready':  return orders.filter(o => o.status === 'ready');
    case 'done':   return orders.filter(o => o.status === 'delivered' || o.status === 'rejected');
    case 'all':    return orders;
  }
}

function elapsedMin(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

function OrderCard({ order, onStatusChange }: { order: DemoOrder; onStatusChange: () => void; key?: React.Key }) {
  const [expanded, setExpanded] = useState(order.status === 'pending');
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] as DemoOrderStatus | undefined;

  const advance = () => { if (!nextStatus) return; db_updateOrderStatus(order.id, nextStatus); onStatusChange(); };
  const reject  = () => { db_updateOrderStatus(order.id, 'rejected'); onStatusChange(); };

  const total = order.items.reduce((s, i) => s + (i.priceCents * i.qty) / 100, 0);

  return (
    <div className={`rounded-2xl border transition-all ${STATUS_GLOW[order.status]}`}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-stone-800/80 flex flex-col items-center justify-center border border-stone-700/50">
            {order.tableNumber ? (
              <>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Table</span>
                <span className="text-2xl font-bold text-white leading-tight">{order.tableNumber}</span>
              </>
            ) : (
              <>
                <span className="text-xl">🥡</span>
                <span className="text-[9px] text-stone-400 font-bold leading-tight">Pickup</span>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">{order.customerName || 'Guest'}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLOURS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
              {order.status === 'pending' && (
                <span className="text-[10px] font-bold text-amber-200 animate-pulse-soft">⏱ {elapsedMin(order.createdAt)}</span>
              )}
            </div>
            <div className="text-xs text-stone-400 mt-1">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · £{total.toFixed(2)} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <svg className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <ul className="space-y-1.5">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-stone-200">
                  <span className="inline-flex items-center justify-center min-w-[26px] h-6 rounded-md bg-white/10 font-bold text-white mr-2 px-1.5 text-xs">{item.qty}×</span>
                  {item.name}
                </span>
                <span className="text-stone-400 font-mono text-xs">£{((item.priceCents * item.qty) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {order.allergens && order.allergens.length > 0 ? (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
              <span className="font-bold text-red-300 uppercase tracking-wider text-[10px] mr-1">⚠ Allergy:</span>
              {order.allergens.join(', ')}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
              <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] mr-1">✓ Clear:</span>
              No allergies noted.
            </div>
          )}
          {order.notes && (
            <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/40 text-xs text-stone-300">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px] mr-1">Note:</span>
              {order.notes}
            </div>
          )}

          {order.status !== 'delivered' && order.status !== 'rejected' && (
            <div className="flex gap-2 pt-1">
              {nextStatus && (
                <button
                  onClick={advance}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 transition-all shadow-lg active:scale-[0.98]"
                >
                  {nextStatus === 'preparing' ? '✓ Accept · Start Preparing'
                    : nextStatus === 'ready'   ? '🔔 Mark as Ready'
                    : nextStatus === 'delivered' ? '✓ Mark Delivered'
                    : `→ ${STATUS_LABELS[nextStatus]}`}
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  onClick={reject}
                  className="px-4 py-3 rounded-xl font-bold text-sm bg-red-900/40 text-red-300 border border-red-700/40 hover:bg-red-900/60 transition-all"
                >
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceDeskPortal() {
  const auth = getAuth();
  const session = auth.getSessionSync?.();
  const restaurantId = session?.user.restaurantId ?? '';
  const staffName = session?.user.name ?? 'Staff';
  const settings = useSettings();
  const restaurant = restaurantId ? db_getRestaurantById(restaurantId) : null;

  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [tab, setTab] = useState<FilterTab>('active');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const prevPendingIds = useRef<Set<string>>(new Set());

  const reload = () => {
    if (!restaurantId) return;
    const all = db_listOrders(restaurantId);
    all.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setOrders(all);

    const currentPendingIds = new Set(all.filter(o => o.status === 'pending').map(o => o.id));
    let hasNew = false;
    currentPendingIds.forEach(id => { if (!prevPendingIds.current.has(id)) hasNew = true; });

    if (hasNew) {
      beep();
      const newest = all.filter(o => o.status === 'pending').sort((a, b) => b.createdAt - a.createdAt)[0];
      if (newest) {
        const allergensStr = newest.allergens && newest.allergens.length > 0 ? ` ⚠️ ${newest.allergens.join(', ')}` : '';
        setToast({ title: 'New Order', message: `Table ${newest.tableNumber || '?'} · ${newest.items.length} items.${allergensStr}` });
        setTimeout(() => setToast(null), 5000);
      }
    }
    prevPendingIds.current = currentPendingIds;
  };

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 text-sm">
        No restaurant linked to this account. Please contact your manager.
      </div>
    );
  }

  const filtered = filterOrders(orders, tab);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: pendingCount + preparingCount },
    { id: 'ready', label: 'Ready', count: readyCount },
    { id: 'done', label: 'Done' },
    { id: 'all', label: 'All', count: orders.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-950 to-stone-900 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-stone-950/85 backdrop-blur-xl border-b border-stone-800/60 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-9 h-9" />
            <div>
              <p className="text-sm font-bold text-white leading-tight">{restaurant?.name ?? 'Service Desk'}</p>
              <p className="text-[10px] text-stone-500 leading-tight uppercase tracking-widest mt-0.5">{staffName} · KDS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold animate-pulse-soft">
                🔔 {pendingCount} new
              </span>
            )}
            <button
              onClick={() => window.dispatchEvent(new Event('liora:browse-home'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-500 to-amber-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:from-brand-600 hover:to-amber-600 transition-all"
              title="Visit Liora homepage"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition-colors" title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button onClick={() => auth.signOut()} className="text-xs font-semibold text-stone-400 hover:text-white transition-colors px-2 py-1">Sign out</button>
          </div>
        </div>
      </header>

      {/* Stat strip */}
      <div className="max-w-3xl mx-auto px-4 pt-4 grid grid-cols-3 gap-2">
        {[
          { l: 'New',     v: pendingCount,   c: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-200' },
          { l: 'Cooking', v: preparingCount, c: 'from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-200' },
          { l: 'Ready',   v: readyCount,     c: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-200' },
        ].map(s => (
          <div key={s.l} className={`rounded-2xl border bg-gradient-to-br ${s.c} px-4 py-3`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{s.l}</div>
            <div className="text-3xl font-display font-light mt-0.5 leading-none">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="sticky top-[57px] z-20 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/40 mt-3">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 py-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.id ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.id ? 'bg-stone-200 text-stone-700' : 'bg-stone-800 text-stone-300'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-600">
            <p className="text-5xl mb-3">🍽️</p>
            <p className="text-sm font-bold text-stone-400">{tab === 'active' ? 'All quiet — no active orders' : 'Nothing here yet'}</p>
            <p className="text-xs mt-1">Auto-refreshes every 5 seconds</p>
          </div>
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} onStatusChange={reload} />)
        )}
      </main>

      <div className="max-w-3xl mx-auto px-4 pb-6 text-center">
        <p className="text-[10px] text-stone-700 uppercase tracking-widest">Auto-refreshes · Liora Service Desk</p>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-stone-900 px-5 py-4 rounded-2xl shadow-lift flex items-center gap-4 border border-amber-300">
            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-xl">🔔</div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wide">{toast.title}</h4>
              <p className="text-stone-800 font-medium text-sm mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-2 p-1.5 bg-white/30 hover:bg-white/40 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
