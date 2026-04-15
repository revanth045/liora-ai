import React, { useState, useEffect } from 'react';
import { Icon } from '../../../../components/Icon';
import { db_listAllOrders, db_getAllRestaurants, type DemoOrder, type DemoOrderStatus, type DemoRestaurant } from '../../../demoDb';
import { useSession } from '../../../auth/useSession';

// ─── Status config (dine-in flow only) ───────────────────────────────────────
const STATUS_STEPS: { key: DemoOrderStatus; label: string; icon: string }[] = [
  { key: 'pending',   label: 'Order Placed', icon: 'check_circle' },
  { key: 'preparing', label: 'Preparing',    icon: 'restaurant' },
  { key: 'ready',     label: 'Ready',        icon: 'done_all' },
  { key: 'delivered', label: 'Served',       icon: 'home' },
];

const ACTIVE_STATUSES: DemoOrderStatus[] = ['pending', 'preparing', 'ready'];
const DONE_STATUSES: DemoOrderStatus[] = ['delivered', 'rejected'];

function getStepIndex(status: DemoOrderStatus) {
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function statusPill(status: DemoOrderStatus) {
  const map: Record<DemoOrderStatus, { label: string; className: string }> = {
    pending:   { label: 'Order Placed', className: 'bg-amber-50 text-amber-600 border-amber-200' },
    preparing: { label: 'Preparing',   className: 'bg-blue-50 text-blue-600 border-blue-200' },
    ready:     { label: 'Ready',       className: 'bg-green-50 text-green-600 border-green-200' },
    delivered: { label: 'Served',      className: 'bg-stone-100 text-stone-500 border-stone-200' },
    rejected:  { label: 'Rejected',    className: 'bg-red-50 text-red-500 border-red-200' },
  };
  const s = map[status];
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, restaurantName, isExpanded, onToggle }: {
  order: DemoOrder;
  restaurantName: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isDone = DONE_STATUSES.includes(order.status);
  const stepIdx = getStepIndex(order.status);

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden">
      {/* Header row */}
      <button onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 hover:bg-cream-50/30 text-left transition-colors">
        <div className="w-11 h-11 rounded-2xl bg-forest-900/8 flex items-center justify-center text-xl flex-shrink-0">
          🍽️
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-stone-800 text-sm">{restaurantName}</span>
            {statusPill(order.status)}
          </div>
          <p className="text-xs text-stone-400 truncate">
            {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
          </p>
          {order.tableNumber && (
            <p className="text-[10px] text-stone-400 mt-0.5">Table {order.tableNumber}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-stone-800 text-sm">${(order.totalCents / 100).toFixed(2)}</p>
          <p className="text-[10px] text-stone-400">{timeAgo(order.createdAt)}</p>
        </div>
        <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={18} className="text-stone-400 flex-shrink-0" />
      </button>

      {isExpanded && (
        <div className="border-t border-cream-100 p-5 space-y-5">

          {/* Status progress (active orders only) */}
          {!isDone && order.status !== 'rejected' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= stepIdx;
                const active = idx === stepIdx;
                return (
                  <React.Fragment key={step.key}>
                    <div className={`flex flex-col items-center gap-1.5 flex-shrink-0 ${done ? 'opacity-100' : 'opacity-25'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        active ? 'bg-stone-800 text-white shadow-lg scale-110'
                        : done  ? 'bg-stone-200 text-stone-600'
                        :         'bg-cream-100 text-stone-300'}`}>
                        <Icon name={step.icon} size={18} />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${active ? 'text-stone-800' : 'text-stone-400'}`}>
                        {step.label}
                      </span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded mb-5 min-w-[16px] ${stepIdx > idx ? 'bg-stone-800' : 'bg-cream-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-800">
              <span className="font-bold">Note:</span> {order.notes}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Order Summary</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-cream-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-stone-100 rounded text-[10px] font-bold text-stone-500 flex items-center justify-center">{item.qty}×</span>
                    <span className="text-sm text-stone-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-stone-800">${((item.qty * item.priceCents) / 100).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-stone-800 text-sm">Total</span>
                <span className="font-lora font-bold text-stone-800 text-lg">${(order.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order meta */}
          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-medium">
            <span className="bg-stone-100 rounded-full px-2 py-1 font-mono uppercase">{order.id.slice(-6).toUpperCase()}</span>
            {order.tableNumber && <span>Table {order.tableNumber}</span>}
            <span>{new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [restaurants, setRestaurants] = useState<DemoRestaurant[]>([]);
  const session = useSession();
  const userEmail = session?.user?.email ?? null;

  // Poll localStorage every 5 s so status changes from restaurant side reflect live
  useEffect(() => {
    const load = () => {
      const all = db_listAllOrders();
      // Show only this user's orders (matched by email, or all if no email yet)
      const mine = all.filter(o => o.customerEmail === userEmail);
      setOrders(mine);
      setRestaurants(db_getAllRestaurants());
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [userEmail]);

  const getRestaurantName = (id: string) =>
    restaurants.find(r => r.id === id)?.name ?? 'Restaurant';

  const activeOrders  = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const pastOrders    = orders.filter(o => DONE_STATUSES.includes(o.status));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 px-4">
      {/* Header */}
      <div className="pt-4">
        <h1 className="font-lora text-3xl font-bold text-stone-800">My Orders</h1>
        <p className="text-stone-500 text-sm mt-1">Track dine-in orders and browse your history.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 p-1 rounded-xl border border-cream-200 bg-cream-100 max-w-xs">
        {(['active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-stone-800 shadow-sm border border-cream-200' : 'text-stone-500 hover:text-stone-700'
            }`}>
            {t === 'active' ? `Active (${activeOrders.length})` : `History (${pastOrders.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {tab === 'active' && (
          activeOrders.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <Icon name="restaurant" size={48} className="mb-4 opacity-30 mx-auto" />
              <p className="font-lora font-bold text-lg text-stone-500">No active orders</p>
              <p className="text-sm mt-1">When a restaurant receives your order, it will appear here.</p>
            </div>
          ) : activeOrders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              restaurantName={getRestaurantName(o.restaurantId)}
              isExpanded={expandedId === o.id}
              onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
            />
          ))
        )}

        {tab === 'history' && (
          pastOrders.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <Icon name="receipt_long" size={48} className="mb-4 opacity-30 mx-auto" />
              <p className="font-lora font-bold text-lg text-stone-500">No order history yet</p>
              <p className="text-sm mt-1">Completed and past orders will show up here.</p>
            </div>
          ) : pastOrders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              restaurantName={getRestaurantName(o.restaurantId)}
              isExpanded={expandedId === o.id}
              onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
