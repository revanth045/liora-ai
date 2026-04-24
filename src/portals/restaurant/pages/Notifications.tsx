import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listTableAlerts, db_dismissTableAlert,
  type DemoTableAlert, type DemoRestaurant,
} from '../../../demoDb';
import { sbListTableAlerts, sbDismissTableAlert } from '../../../lib/supabaseDb';

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  'Call Waiter':      { icon: 'support_agent', color: 'bg-amber-100 text-amber-700 border-amber-200',   label: 'Waiter Requested' },
  'Order Drinks':     { icon: 'local_bar',      color: 'bg-blue-100 text-blue-700 border-blue-200',     label: 'Drink Order' },
  'Request Bill':     { icon: 'receipt_long',   color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Bill Request' },
  'Dietary Question': { icon: 'eco',             color: 'bg-green-100 text-green-700 border-green-200', label: 'Dietary Query' },
  'Get Manager':      { icon: 'manage_accounts', color: 'bg-red-100 text-red-700 border-red-200',       label: 'Manager Needed' },
  'New Order':        { icon: 'restaurant_menu', color: 'bg-teal-100 text-teal-700 border-teal-200',    label: 'New Order Placed' },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { icon: 'notifications', color: 'bg-stone-100 text-stone-700 border-stone-200', label: action };
}

export default function RestoNotifications({ restaurant }: { restaurant: DemoRestaurant }) {
  const [active, setActive]   = useState<DemoTableAlert[]>([]);
  const [history, setHistory] = useState<DemoTableAlert[]>([]);
  const [filter, setFilter]   = useState<string>('all');
  const [lastCount, setLastCount] = useState(0);
  const [flash, setFlash]     = useState(false);

  const refresh = useCallback(async () => {
    const localAlerts = db_listTableAlerts(restaurant.name);
    let sbAlerts: DemoTableAlert[] = [];
    try { sbAlerts = await sbListTableAlerts(restaurant.name); } catch {}
    const all = [...sbAlerts];
    localAlerts.forEach(a => { if (!all.some(x => x.id === a.id)) all.push(a); });
    const act = all.filter(a => a.status === 'active').sort((a, b) => b.createdAt - a.createdAt);
    const hist = all.filter(a => a.status === 'dismissed').sort((a, b) => b.createdAt - a.createdAt);
    if (act.length > lastCount && lastCount !== 0) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
    setLastCount(act.length);
    setActive(act);
    setHistory(hist);
  }, [restaurant.name, lastCount]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleDismiss = async (id: string) => {
    db_dismissTableAlert(id);
    try { await sbDismissTableAlert(id); } catch {}
    refresh();
  };

  const handleDismissAll = () => {
    active.forEach(a => db_dismissTableAlert(a.id));
    refresh();
  };

  const filtered = filter === 'all' ? active : active.filter(a => a.action === filter);
  const actions = Array.from(new Set(active.map(a => a.action)));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Header strip */}
      <div className={`flex items-center justify-between rounded-3xl p-6 transition-all duration-500 ${flash ? 'bg-red-50 border border-red-200 shadow-md' : 'bg-white border border-cream-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${active.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <Icon name="notifications_active" size={26} />
          </div>
          <div>
            <h2 className="font-lora text-2xl font-bold text-stone-800">Live Notifications</h2>
            <p className="text-xs text-stone-400 mt-0.5 font-medium">
              {active.length === 0
                ? 'All clear — no active alerts right now'
                : `${active.length} active alert${active.length !== 1 ? 's' : ''} · refreshes every 3 s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {active.length > 0 && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-4" />
            </>
          )}
          {active.length > 1 && (
            <button
              onClick={handleDismissAll}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-xl hover:bg-stone-50 hover:text-green-600 hover:border-green-300 transition-all"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Action filter pills */}
      {actions.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {['all', ...actions].map(a => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                filter === a
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 border-cream-200 hover:border-stone-300'
              }`}
            >
              {a === 'all' ? 'All' : getActionMeta(a).label}
            </button>
          ))}
        </div>
      )}

      {/* Active alerts */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-16 text-center">
            <Icon name="check_circle" size={48} className="text-green-400 mx-auto mb-4 opacity-60" />
            <p className="font-bold text-stone-600 text-lg">No active alerts</p>
            <p className="text-stone-400 text-sm mt-1">New requests from customers will appear here instantly.</p>
          </div>
        ) : filtered.map(alert => {
          const meta = getActionMeta(alert.action);
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-4 p-5 bg-white rounded-3xl border-2 shadow-sm hover:shadow-md transition-all ${meta.color}`}
            >
              <div className={`p-3 rounded-2xl border ${meta.color} flex-shrink-0`}>
                <Icon name={meta.icon} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-stone-800 text-base">Table {alert.tableNumber}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold ml-auto">{timeAgo(alert.createdAt)}</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">{alert.message}</p>
              </div>
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/80 border border-stone-200 text-stone-400 hover:text-green-600 hover:border-green-400 transition-all shadow-sm"
                title="Mark as handled"
              >
                <Icon name="check" size={20} />
              </button>
            </div>
          );
        })}
      </div>

      {/* History section */}
      {history.length > 0 && (
        <div className="bg-white border border-cream-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-cream-200 flex items-center gap-3">
            <Icon name="history" size={20} className="text-stone-400" />
            <h3 className="font-lora font-bold text-lg text-stone-800">Handled · Last 20</h3>
          </div>
          <div className="divide-y divide-cream-100">
            {history.slice(0, 20).map(alert => {
              const meta = getActionMeta(alert.action);
              return (
                <div key={alert.id} className="flex items-center gap-4 px-5 py-3.5 opacity-60 hover:opacity-100 transition-opacity">
                  <div className={`p-2 rounded-xl border ${meta.color} flex-shrink-0`}>
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-700 truncate">Table {alert.tableNumber} — {meta.label}</p>
                    <p className="text-xs text-stone-400 truncate">{alert.message}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold flex-shrink-0">{timeAgo(alert.createdAt)}</span>
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="check" size={12} className="text-green-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
