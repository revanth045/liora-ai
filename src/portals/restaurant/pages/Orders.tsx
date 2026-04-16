import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listOrders, db_updateOrderStatus,
  db_listTableAlerts, db_dismissTableAlert,
  type DemoOrder, type DemoOrderStatus, type DemoTableAlert,
} from '../../../demoDb';
import type { DemoRestaurant } from '../../../demoDb';

const STATUS_CONFIG: Record<DemoOrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  preparing: { label: 'Preparing', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  ready:     { label: 'Ready',     color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  delivered: { label: 'Delivered', color: 'text-stone-500',  bg: 'bg-stone-50 border-stone-200' },
  rejected:  { label: 'Rejected',  color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
};

const STATUS_FLOW: DemoOrderStatus[] = ['pending','preparing','ready','delivered'];

type FilterTab = 'all' | DemoOrderStatus;
const FILTER_TABS: FilterTab[] = ['all','pending','preparing','ready','delivered','rejected'];

function fmt(cents: number) { return `$${(cents/100).toFixed(2)}`; }
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

const ALERT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  'Call Waiter':      { icon: '📈️', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-300' },
  'Order Drinks':     { icon: 'ð  ·', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300' },
  'Request Bill':     { icon: 'ð §¾', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-300' },
  'Dietary Question': { icon: '🥗', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-300' },
  'Get Manager':      { icon: '📈', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300' },
};

export default function RestoOrders({ restaurant }: { restaurant: DemoRestaurant }) {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [alerts, setAlerts] = useState<DemoTableAlert[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = () => {
    setOrders(db_listOrders(restaurant.id).sort((a,b) => b.createdAt - a.createdAt));
    setAlerts(db_listTableAlerts(restaurant.name).sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    reload();
    // Auto-poll every 5 s so new customer orders appear without manual refresh
    const timer = setInterval(reload, 5000);
    return () => clearInterval(timer);
  }, [restaurant.id, restaurant.name]);

  const dismiss = (id: string) => {
    db_dismissTableAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const dismissAll = () => {
    alerts.forEach(a => db_dismissTableAlert(a.id));
    setAlerts([]);
  };

  const advance = (order: DemoOrder) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    db_updateOrderStatus(order.id, STATUS_FLOW[idx + 1]);
    reload();
  };

  const reject = (order: DemoOrder) => {
    db_updateOrderStatus(order.id, 'rejected');
    reload();
  };

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts: Record<FilterTab, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-slide pb-20">

      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Orders', value: orders.length, icon: 'receipt_long', color: 'bg-blue-100 text-blue-700' },
          { label: 'Active Now', value: orders.filter(o => o.status === 'preparing').length, icon: 'local_fire_department', color: 'bg-orange-100 text-orange-700' },
          { label: 'Pending', value: counts.pending, icon: 'pending_actions', color: 'bg-amber-100 text-amber-700' },
          { label: "Today's Revenue", value: fmt(orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+o.totalCents,0)), icon: 'attach_money', color: 'bg-green-100 text-green-700' },
        ].map((m,i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className="text-2xl font-lora font-bold text-stone-800">{m.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${m.color}`}><Icon name={m.icon} size={20} /></div>
          </div>
        ))}
      </div>

      {/* Table Request Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold text-amber-800 text-sm">Table Requests</span>
              <span className="bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
            </div>
            <button onClick={dismissAll} className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors">
              Dismiss All
            </button>
          </div>
          <div className="divide-y divide-amber-100">
            {alerts.map(alert => {
              const cfg = ALERT_CONFIG[alert.action] ?? { icon: 'ð  £', color: 'text-stone-700', bg: 'bg-stone-50', border: 'border-stone-200' };
              return (
                <div key={alert.id} className={`flex items-center gap-4 px-5 py-3.5 ${cfg.bg} hover:brightness-95 transition-all`}>
                  <span className="text-xl flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        Table {alert.tableNumber}
                      </span>
                      <span className={`font-bold text-sm ${cfg.color}`}>{alert.action}</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">{alert.message}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-stone-400 font-medium">{timeAgo(alert.createdAt)}</span>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="w-7 h-7 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-700 hover:border-stone-400 flex items-center justify-center transition-all shadow-sm"
                      title="Dismiss"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
              filter === tab
                ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                : 'bg-white text-stone-500 border-cream-200 hover:border-stone-300 hover:text-stone-700'
            }`}>
            {tab === 'all' ? 'All' : STATUS_CONFIG[tab as DemoOrderStatus].label}
            {counts[tab] > 0 && <span className={`ml-1.5 ${filter === tab ? 'bg-white/20' : 'bg-stone-100'} px-1.5 py-0.5 rounded-full text-[9px]`}>{counts[tab]}</span>}
          </button>
        ))}
        <button onClick={reload} className="ml-auto px-3 py-2 rounded-xl text-xs font-bold text-stone-400 border border-cream-200 hover:bg-cream-100 flex items-center gap-1.5">
          <Icon name="refresh" size={14} /> Refresh
        </button>
        <span className="text-[9px] text-stone-300 font-medium ml-1 hidden sm:block">Auto-refreshes every 5s</span>
      </div>

      {/* Orders list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-stone-400">
          <Icon name="restaurant_menu" size={48} className="mb-4 opacity-30" />
          <p className="font-lora font-bold text-lg text-stone-500">No orders here</p>
          <p className="text-sm mt-1 text-stone-400">New orders will appear in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            const isExpanded = expanded === order.id;
            const canAdvance = STATUS_FLOW.includes(order.status) && STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1;
            const canReject = order.status === 'pending';

            return (
              <div key={order.id}
                className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden transition-all">
                <button onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-cream-50/30 text-left transition-colors">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${order.status === 'pending' ? 'bg-amber-400 animate-pulse' : order.status === 'preparing' ? 'bg-blue-400 animate-pulse' : order.status === 'ready' ? 'bg-green-400' : order.status === 'delivered' ? 'bg-stone-300' : 'bg-red-300'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-stone-800 text-sm">{order.customerName}</span>
                      {order.tableNumber && (
                        <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full uppercase">Table {order.tableNumber}</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate">
                      {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-stone-800 text-sm">{fmt(order.totalCents)}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[10px] text-stone-400">{timeAgo(order.createdAt)}</span>
                    <Icon name={isExpanded ? 'expand_less' : 'expand_more'} size={18} className="text-stone-400" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-cream-200 p-5 space-y-4">
                    {/* Item breakdown */}
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Order Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-cream-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-500 flex items-center justify-center">{item.qty}×</span>
                              <span className="text-sm font-medium text-stone-800">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-stone-800">{fmt(item.qty * item.priceCents)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm font-bold text-stone-800">Total</span>
                          <span className="text-lg font-lora font-bold text-stone-800">{fmt(order.totalCents)}</span>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Icon name="info" size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700"><span className="font-bold">Note:</span> {order.notes}</p>
                      </div>
                    )}

                    {/* Status flow */}
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Progress</p>
                      <div className="flex items-center gap-2">
                        {STATUS_FLOW.map((s, idx) => {
                          const currentIdx = STATUS_FLOW.indexOf(order.status);
                          const done = idx <= currentIdx;
                          return (
                            <React.Fragment key={s}>
                              <div className={`flex flex-col items-center gap-1 ${done ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                  {idx + 1}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">{STATUS_CONFIG[s].label}</span>
                              </div>
                              {idx < STATUS_FLOW.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded ${STATUS_FLOW.indexOf(order.status) > idx ? 'bg-stone-800' : 'bg-stone-200'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(canAdvance || canReject) && (
                      <div className="flex gap-3 pt-2">
                        {canReject && (
                          <button onClick={() => reject(order)}
                            className="flex-1 py-3 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                            <Icon name="close" size={18} /> Reject Order
                          </button>
                        )}
                        {canAdvance && (
                          <button onClick={() => advance(order)}
                            className="flex-1 py-3 rounded-2xl bg-stone-800 text-white font-bold text-sm hover:bg-stone-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <Icon name="arrow_forward" size={18} />
                            {order.status === 'pending' ? 'Accept & Prepare' : order.status === 'preparing' ? 'Mark Ready' : 'Mark Delivered'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
