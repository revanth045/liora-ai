
import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import {
  db_listOrders, db_listMenu, db_listInventory,
  db_listReservations, db_listChefSpecials,
  type DemoRestaurant, type DemoOrder, type DemoInventoryItem,
} from '../../demoDb';

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

export default function RestoOverview({ restaurant }: { restaurant: DemoRestaurant }) {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [inventory, setInventory] = useState<DemoInventoryItem[]>([]);
  const [menuCount, setMenuCount] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);
  const [specialsCount, setSpecialsCount] = useState(0);

  const reload = () => {
    const allOrders = db_listOrders(restaurant.id).sort((a, b) => b.createdAt - a.createdAt);
    setOrders(allOrders);
    setInventory(db_listInventory(restaurant.id));
    setMenuCount(db_listMenu(restaurant.id).filter(m => m.available).length);
    setReservationCount(db_listReservations(restaurant.id).filter(r => r.status !== 'canceled').length);
    setSpecialsCount(db_listChefSpecials(restaurant.id).filter(c => c.isAvailable).length);
  };

  useEffect(() => {
    reload();
    const timer = setInterval(reload, 5000);
    return () => clearInterval(timer);
  }, [restaurant.id]);

  // Derived metrics
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => o.createdAt >= todayStart.getTime());
  const deliveredToday = todayOrders.filter(o => o.status === 'delivered');
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const todayRevenue = deliveredToday.reduce((s, o) => s + o.totalCents, 0);
  const avgTicket = deliveredToday.length > 0 ? todayRevenue / deliveredToday.length : 0;
  const lowStockItems = inventory.filter(i => i.quantity <= i.reorderPoint);

  const METRICS = [
    { label: "Today's Revenue", value: fmt(todayRevenue), icon: 'attach_money', color: 'bg-green-100 text-green-700', sub: `${deliveredToday.length} completed orders` },
    { label: 'Active Orders', value: activeOrders.length, icon: 'local_fire_department', color: 'bg-orange-100 text-orange-700', sub: `${pendingOrders.length} pending` },
    { label: 'Avg Ticket', value: avgTicket > 0 ? fmt(avgTicket) : '—', icon: 'receipt_long', color: 'bg-blue-100 text-blue-700', sub: `${todayOrders.length} orders today` },
    { label: 'Low Stock Alerts', value: lowStockItems.length, icon: 'inventory_2', color: lowStockItems.length > 0 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700', sub: lowStockItems.length > 0 ? lowStockItems[0].name + (lowStockItems.length > 1 ? ` +${lowStockItems.length - 1}` : '') : 'All stocked' },
  ];

  // Build live feed from real recent orders (last 8)
  const recentFeed = orders.slice(0, 8).map(o => ({
    id: o.id,
    time: timeAgo(o.createdAt),
    table: o.tableNumber || '—',
    action: `${o.items.map(i => `${i.qty}× ${i.name}`).join(', ')} · ${fmt(o.totalCents)}`,
    type: o.status === 'pending' ? 'pending' : o.status === 'preparing' ? 'order' : o.status === 'ready' ? 'service' : 'done',
    status: o.status,
    notes: o.notes,
  }));

  // Alerts based on real data
  const ALERTS = [
    ...(pendingOrders.length > 0 ? [{ level: 'critical', msg: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} waiting to be accepted`, link: 'orders' }] : []),
    ...(lowStockItems.slice(0, 2).map(item => ({ level: 'warning', msg: `Low stock: ${item.name} (${item.quantity} ${item.unit} remaining)`, link: 'inventory' }))),
    ...(reservationCount > 0 ? [{ level: 'info', msg: `${reservationCount} active reservation${reservationCount > 1 ? 's' : ''}`, link: 'orders' }] : []),
    ...(menuCount === 0 ? [{ level: 'warning', msg: 'No menu items published yet — customers can\'t order', link: 'menu' }] : []),
  ].slice(0, 4);

  const STATUS_ICON: Record<string, string> = { pending: 'pending_actions', order: 'restaurant', service: 'done_all', done: 'check_circle' };
  const STATUS_COLOR: Record<string, string> = { pending: 'bg-amber-100 text-amber-600', order: 'bg-green-100 text-green-600', service: 'bg-blue-100 text-blue-600', done: 'bg-stone-100 text-stone-500' };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page-slide pb-20">
      
      {/* 1. Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex items-start justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{metric.label}</p>
              <h3 className="text-2xl font-lora font-bold text-stone-800">{metric.value}</h3>
              <p className="text-[10px] text-stone-400 mt-1">{metric.sub}</p>
            </div>
            <div className={`p-3 rounded-2xl ${metric.color} shadow-inner`}>
              <Icon name={metric.icon} size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* 2. Live Orders Feed */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-cream-50/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
              </div>
              <h3 className="font-lora text-xl font-bold text-stone-800">Live Order Feed</h3>
            </div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 px-2.5 py-1 rounded-full">Auto-refreshes · 5s</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {recentFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 py-8">
                <Icon name="restaurant_menu" size={40} className="mb-3 opacity-30" />
                <p className="font-bold text-stone-500">No orders yet today</p>
                <p className="text-xs mt-1">New orders will appear here in real time.</p>
              </div>
            ) : recentFeed.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-cream-50/30 rounded-2xl transition-all border border-transparent hover:border-cream-200">
                <div className={`p-3 rounded-xl shadow-sm ${STATUS_COLOR[item.type] ?? 'bg-stone-100 text-stone-500'}`}>
                  <Icon name={STATUS_ICON[item.type] ?? 'receipt'} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-stone-800 text-sm">
                      {item.table !== '—' ? `Table ${item.table}` : 'Pickup'}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase bg-cream-100/50 px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                  <p className="text-xs text-stone-400 font-medium truncate">{item.action}</p>
                  {item.notes && (
                    <p className="text-[10px] text-amber-600 mt-0.5 truncate">  {item.notes}</p>
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                  item.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  item.status === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  item.status === 'ready' ? 'bg-green-50 text-green-600 border-green-200' :
                  item.status === 'delivered' ? 'bg-stone-50 text-stone-500 border-stone-200' :
                  'bg-red-50 text-red-500 border-red-200'
                }`}>{item.status}</span>
              </div>
            ))}
            
            {recentFeed.length > 0 && (
              <div className="opacity-40 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 py-4">
                Showing {Math.min(8, orders.length)} of {orders.length} orders · Liora Live
              </div>
            )}
          </div>
        </div>

        {/* 3. Action Center / Alerts */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-cream-200">
              <h3 className="font-lora text-xl font-bold text-stone-800">Action Center</h3>
            </div>
            {ALERTS.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                <Icon name="check_circle" size={32} className="mb-2 opacity-30 mx-auto text-green-500" />
                <p className="text-sm font-bold text-stone-500">All clear!</p>
                <p className="text-xs mt-1">No alerts right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-cream-200">
                {ALERTS.map((alert, idx) => (
                  <div key={idx} className={`p-5 border-l-4 transition-colors ${
                    alert.level === 'critical' ? 'border-l-red-500 bg-red-50/20 hover:bg-red-50/40' : 
                    alert.level === 'warning' ? 'border-l-orange-500 bg-orange-50/20 hover:bg-orange-50/40' : 
                    'border-l-blue-500 bg-blue-50/20 hover:bg-blue-50/40'
                  }`}>
                    <p className="text-sm font-bold text-stone-800 mb-2 leading-relaxed">{alert.msg}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      alert.level === 'critical' ? 'text-red-500' : alert.level === 'warning' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {alert.level === 'critical' ? '← Urgent' : alert.level === 'warning' ? '⚠️ Warning' : 'ℹ️ Info'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* At-a-Glance Stats */}
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-6 space-y-4">
            <h3 className="font-lora text-lg font-bold text-stone-800">At a Glance</h3>
            {[
              { label: 'Menu Items (Live)', value: menuCount, icon: 'restaurant_menu' },
              { label: 'Chef Specials (Active)', value: specialsCount, icon: 'restaurant' },
              { label: 'Reservations', value: reservationCount, icon: 'calendar_today' },
              { label: 'Low Stock Items', value: lowStockItems.length, icon: 'warning', warn: lowStockItems.length > 0 },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <Icon name={s.icon} size={16} className={s.warn ? 'text-red-500' : 'text-stone-400'} />
                  {s.label}
                </div>
                <span className={`text-sm font-bold ${s.warn ? 'text-red-500' : 'text-stone-800'}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-cream-100 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
             <div className="relative z-10">
                <h3 className="font-lora text-xl font-bold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-3 backdrop-blur-md transition-all active:scale-95 border border-cream-100">
                    <Icon name="add" size={24} /> New Item
                  </button>
                  <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-3 backdrop-blur-md transition-all active:scale-95 border border-cream-100">
                    <Icon name="campaign" size={24} /> Blast Promo
                  </button>
                  <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-3 backdrop-blur-md transition-all active:scale-95 border border-cream-100">
                    <Icon name="pause" size={24} /> Pause Orders
                  </button>
                  <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-3 backdrop-blur-md transition-all active:scale-95 border border-cream-100">
                    <Icon name="support_agent" size={24} /> Liora Help
                  </button>
                </div>
             </div>
             <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
               <Icon name="bolt" size={200} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
