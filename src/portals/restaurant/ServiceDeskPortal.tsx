import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from '../../auth';
import {
  db_listOrders,
  db_updateOrderStatus,
  db_getRestaurantById,
  DemoOrder,
  DemoOrderStatus,
} from '../../demoDb';

const STATUS_FLOW: DemoOrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];

// ----------------------------------------------
//  Sound helper — Web Audio API beep
// ----------------------------------------------
function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => ctx.close();
  } catch {
    // browser may block autoplay — ignore silently
  }
}

// ----------------------------------------------
//  Filter tabs
// ----------------------------------------------
type FilterTab = 'active' | 'ready' | 'done' | 'all';

const STATUS_LABELS: Record<DemoOrderStatus, string> = {
  pending: 'New Order',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  rejected: 'Rejected',
};

const STATUS_COLOURS: Record<DemoOrderStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  preparing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  delivered: 'bg-stone-600/40 text-stone-400 border-stone-600/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function filterOrders(orders: DemoOrder[], tab: FilterTab): DemoOrder[] {
  switch (tab) {
    case 'active': return orders.filter(o => o.status === 'pending' || o.status === 'preparing');
    case 'ready':  return orders.filter(o => o.status === 'ready');
    case 'done':   return orders.filter(o => o.status === 'delivered' || o.status === 'rejected');
    case 'all':    return orders;
  }
}

// ----------------------------------------------
//  Order card
// ----------------------------------------------
function OrderCard({ order, onStatusChange }: { order: DemoOrder; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(order.status === 'pending');
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] as DemoOrderStatus | undefined;

  const advance = () => {
    if (!nextStatus) return;
    db_updateOrderStatus(order.id, nextStatus);
    onStatusChange();
  };

  const reject = () => {
    db_updateOrderStatus(order.id, 'rejected');
    onStatusChange();
  };

  const total = order.items.reduce((s, i) => s + (i.priceCents * i.qty) / 100, 0);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        order.status === 'pending'
          ? 'border-amber-500/40 bg-amber-950/30'
          : order.status === 'preparing'
          ? 'border-blue-500/30 bg-blue-950/20'
          : order.status === 'ready'
          ? 'border-emerald-500/30 bg-emerald-950/20'
          : 'border-stone-700/40 bg-stone-900/40'
      }`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {/* Table badge */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-800/80 flex flex-col items-center justify-center border border-stone-700/50">
            {order.tableNumber ? (
              <>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight">Table</span>
                <span className="text-xl font-bold text-white leading-tight">{order.tableNumber}</span>
              </>
            ) : (
              <>
                <span className="text-lg">🥡</span>
                <span className="text-[9px] text-stone-400 font-bold leading-tight">Pickup</span>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {order.customerName || 'Guest'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLOURS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · £{total.toFixed(2)} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <svg className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-700/30 pt-3">
          {/* Line items */}
          <ul className="space-y-1">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-stone-300">
                  <span className="font-bold text-white">{item.qty}×</span> {item.name}
                </span>
                <span className="text-stone-400">£{((item.priceCents * item.qty) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {/* Notes and Allergies */}
          {order.allergens && order.allergens.length > 0 ? (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 mb-2">
              <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">Allergy Warning:</span>{' '}
              {order.allergens.join(', ')}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/30 text-xs text-green-200 mb-2">
              <span className="font-bold text-green-400 uppercase tracking-wider text-[10px]">Dietary Notes:</span>{' '}
              No allergies or dietary restrictions mentioned.
            </div>
          )}
          {order.notes && (
            <div className="p-2.5 rounded-lg bg-stone-800/60 border border-stone-700/40 text-xs text-stone-300">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px]">Note:</span>{' '}
              {order.notes}
            </div>
          )}

          {/* Actions */}
          {order.status !== 'delivered' && order.status !== 'rejected' && (
            <div className="flex gap-2 pt-1">
              {nextStatus && (
                <button
                  onClick={advance}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white text-stone-900 hover:bg-stone-100 transition-all"
                >
                  {nextStatus === 'preparing' ? '- Accept — Start Preparing'
                    : nextStatus === 'ready' ? '- Mark as Ready'
                    : nextStatus === 'delivered' ? '- Mark Delivered'
                    : `→ ${STATUS_LABELS[nextStatus]}`}
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  onClick={reject}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm bg-red-900/40 text-red-400 border border-red-800/40 hover:bg-red-900/60 transition-all"
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

// ----------------------------------------------
//  Main portal
// ----------------------------------------------
export default function ServiceDeskPortal() {
  const auth = getAuth();
  const session = auth.getSessionSync?.();
  const restaurantId = session?.user.restaurantId ?? '';
  const staffName = session?.user.name ?? 'Staff';

  const restaurant = restaurantId ? db_getRestaurantById(restaurantId) : null;

  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [tab, setTab] = useState<FilterTab>('active');
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const prevPendingIds = useRef<Set<string>>(new Set());

  const reload = () => {
    if (!restaurantId) return;
    const all = db_listOrders(restaurantId);
    // Sort: pending first, then by createdAt desc
    all.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setOrders(all);

    // Beep on new pending orders
    const currentPendingIds = new Set(all.filter(o => o.status === 'pending').map(o => o.id));
    let hasNew = false;
    currentPendingIds.forEach(id => {
      if (!prevPendingIds.current.has(id)) hasNew = true;
    });
    
    if (hasNew) {
      beep();
      const newestPending = all.filter(o => o.status === 'pending').sort((a, b) => b.createdAt - a.createdAt)[0];
      if (newestPending) {
        setToast({ title: 'New Order Received', message: `Table ${newestPending.tableNumber || '?'} ordered ${newestPending.items.length} items.` });
        setTimeout(() => setToast(null), 5000);
      }
    }
    prevPendingIds.current = currentPendingIds;
  };

  // Initial load + 5s polling
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

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'active', label: 'Active', count: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length },
    { id: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { id: 'done', label: 'Done' },
    { id: 'all', label: 'All', count: orders.length },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur border-b border-stone-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center">
              <span className="font-display font-bold text-white text-base">L</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                {restaurant?.name ?? 'Service Desk'}
              </p>
              <p className="text-[10px] text-stone-500 leading-tight">
                {staffName} · Staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                🍝 {pendingCount} new
              </span>
            )}
            <button
              onClick={() => auth.signOut()}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors px-2 py-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="sticky top-[57px] z-20 bg-stone-950/90 backdrop-blur border-b border-stone-800/40">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-white text-stone-900'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/60'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.id ? 'bg-stone-200 text-stone-700' : 'bg-stone-800 text-stone-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Order list */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-600">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm font-semibold">
              {tab === 'active' ? 'No active orders right now' : 'Nothing here yet'}
            </p>
            <p className="text-xs mt-1">Orders appear automatically every 5 seconds</p>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={reload} />
          ))
        )}
      </main>

      {/* Bottom refresh hint */}
      <div className="max-w-2xl mx-auto px-4 pb-6 text-center">
        <p className="text-[10px] text-stone-700">Auto-refreshes every 5 seconds</p>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-amber-500 text-stone-900 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-amber-400">
            <div className="w-10 h-10 bg-amber-900/10 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
              🛎️
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-wide uppercase">{toast.title}</h4>
              <p className="text-stone-800 font-medium text-sm mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-4 p-2 bg-amber-900/5 hover:bg-amber-900/10 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
