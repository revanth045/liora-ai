import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { db_listOrders, type DemoOrder } from '../../../demoDb';
import type { DemoRestaurant } from '../../../demoDb';

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

interface CustomerProfile {
  name: string;
  orderCount: number;
  totalSpent: number;
  favoriteItem: string;
  lastVisit: string;
}

// Aggregate customer data from orders
function buildProfiles(orders: DemoOrder[]): CustomerProfile[] {
  const map = new Map<string, { orders: DemoOrder[] }>();
  for (const o of orders) {
    if (!map.has(o.customerName)) map.set(o.customerName, { orders: [] });
    map.get(o.customerName)!.orders.push(o);
  }
  const profiles: CustomerProfile[] = [];
  map.forEach(({ orders }, name) => {
    const allItems = orders.flatMap(o => o.items);
    const itemFreq = new Map<string, number>();
    for (const item of allItems) itemFreq.set(item.name, (itemFreq.get(item.name) || 0) + item.qty);
    const favoriteItem = [...itemFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const lastOrder = orders.reduce((latest, o) => o.createdAt > latest.createdAt ? o : latest, orders[0]);
    const msAgo = Date.now() - lastOrder.createdAt;
    const hoursAgo = Math.floor(msAgo / 3600000);
    const lastVisit = hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
    profiles.push({ name, orderCount: orders.length, totalSpent: orders.reduce((s, o) => s + o.totalCents, 0), favoriteItem, lastVisit });
  });
  return profiles.sort((a, b) => b.totalSpent - a.totalSpent);
}

// Build peak hour data
function buildPeakHours(orders: DemoOrder[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    hours[h].count++;
  }
  return hours.map(h => ({ ...h, count: h.count }));
}

function buildTopDishes(orders: DemoOrder[]) {
  const freq = new Map<string, number>();
  for (const o of orders) for (const item of o.items) freq.set(item.name, (freq.get(item.name) || 0) + item.qty);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
}

export default function RestoCustomerInsights({ restaurant }: { restaurant: DemoRestaurant }) {
  const [orders, setOrders] = useState<DemoOrder[]>([]);

  useEffect(() => {
    setOrders(db_listOrders(restaurant.id));
  }, [restaurant.id]);

  const profiles = buildProfiles(orders);
  const peakHours = buildPeakHours(orders);
  const topDishes = buildTopDishes(orders);
  const maxPeak = Math.max(...peakHours.map(h => h.count), 1);
  const maxDish = Math.max(...topDishes.map(d => d.count), 1);
  const repeatRate = profiles.length > 0 ? Math.round((profiles.filter(p => p.orderCount > 1).length / profiles.length) * 100) : 0;
  const avgSpend = profiles.length > 0 ? profiles.reduce((s, p) => s + p.totalSpent, 0) / profiles.length : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: profiles.length, icon: 'group', color: 'bg-blue-100 text-blue-700' },
          { label: 'Repeat Rate', value: `${repeatRate}%`, icon: 'autorenew', color: 'bg-green-100 text-green-700' },
          { label: 'Avg Spend', value: fmt(avgSpend), icon: 'attach_money', color: 'bg-purple-100 text-purple-700' },
          { label: 'VIP Customers', value: profiles.filter(p => p.orderCount >= 2).length, icon: 'star', color: 'bg-amber-100 text-amber-700' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className="text-2xl font-lora font-bold text-stone-800">{m.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${m.color}`}><Icon name={m.icon} size={20} /></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Top Customers Table */}
        <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
            <h3 className="font-lora text-xl font-bold text-stone-800">Top Customers</h3>
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">By spend</span>
          </div>
          <div className="divide-y divide-cream-100">
            {profiles.slice(0, 6).map((p, i) => (
              <div key={p.name} className="flex items-center gap-4 px-6 py-4 hover:bg-cream-50/30 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-stone-200 text-stone-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-cream-100 text-stone-600'}`}>
                  {i < 3 ? ['🥗','🥗','🥗'][i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-stone-600 truncate">Fav: {p.favoriteItem}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-stone-800 text-sm">{fmt(p.totalSpent)}</p>
                  <p className="text-[10px] text-stone-600">{p.orderCount} orders · {p.lastVisit}</p>
                </div>
                {p.orderCount >= 2 && (
                  <span className="ml-2 text-[9px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0">VIP</span>
                )}
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="py-12 text-center text-stone-600">
                <p className="text-sm">No customer data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-cream-200 bg-cream-50/50">
            <h3 className="font-lora text-xl font-bold text-stone-800">Peak Hours</h3>
            <p className="text-xs text-stone-600 mt-0.5">When your restaurant is busiest</p>
          </div>
          <div className="p-6">
            <div className="flex items-end gap-1 h-28">
              {peakHours.filter((_, i) => i >= 10 && i <= 23).map(({ hour, count }) => (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-sm bg-brand-400/20 group-hover:bg-brand-400/60 transition-all relative"
                    style={{ height: `${(count / maxPeak) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                    title={`${hour}:00 — ${count} orders`}
                  />
                  {(hour === 12 || hour === 18 || hour === 21 || hour === 14) && (
                    <span className="text-[9px] text-stone-600 font-bold">{hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              {[12, 18, 19, 20].map(h => {
                const info = peakHours[h];
                return (
                  <div key={h} className="flex-1 bg-cream-50 rounded-2xl p-3 text-center border border-cream-200">
                    <p className="text-[10px] font-bold text-stone-600 uppercase">{h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}</p>
                    <p className="font-bold text-stone-800 text-sm mt-0.5">{info.count} orders</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Dishes */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
          <h3 className="font-lora text-xl font-bold text-stone-800">Most Ordered Dishes</h3>
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">All time</span>
        </div>
        <div className="p-6 space-y-4">
          {topDishes.length === 0 && (
            <p className="text-sm text-stone-600 text-center py-8">No dish data yet.</p>
          )}
          {topDishes.map((d, i) => (
            <div key={d.name} className="flex items-center gap-4">
              <span className="text-sm font-bold text-stone-600 w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-stone-800">{d.name}</span>
                  <span className="text-sm font-bold text-stone-600">{d.count}x ordered</span>
                </div>
                <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? 'bg-green-400' : i === 1 ? 'bg-blue-400' : i === 2 ? 'bg-purple-400' : 'bg-stone-300'}`}
                    style={{ width: `${(d.count / maxDish) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-stone-800 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
              <Icon name="smart_toy" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">AI Insight</p>
              <p className="font-lora font-bold text-lg">Liora's Recommendation</p>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-xl">
            Your busiest window is <strong className="text-white">6-9 PM</strong>. Consider running a happy hour promotion from <strong className="text-white">4-6 PM</strong> to increase early-evening revenue by an estimated <strong className="text-white">18-25%</strong>. Your top customers tend to order {topDishes[0]?.name || 'signature items'} — prompt them to try the new menu items next visit.
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none">
          <Icon name="smart_toy" size={180} />
        </div>
      </div>
    </div>
  );
}
