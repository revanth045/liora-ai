import React, { useMemo, useEffect, useState } from "react";
import type { DemoRestaurant } from "../../demoDb";
import { db_eventsForRestaurant } from "../../demoDb";
import { Icon } from "../../../components/Icon";

function AnimatedBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
      <div
        className={`h-full ${colorClass} rounded-full`}
        style={{ width: `${width}%`, transition: "width 1s cubic-bezier(.16,1,.3,1)" }}
      />
    </div>
  );
}

export default function RestoKPIs({ restaurant }: { restaurant: DemoRestaurant }) {
  const events = db_eventsForRestaurant(restaurant.id);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.type] = (c[e.type] || 0) + 1;
    return c;
  }, [events]);

  const metrics = [
    { key: "view_restaurant",  label: "Restaurant Views",  icon: "visibility",      colorIcon: "bg-blue-100 text-blue-700",    bar: "bg-blue-500",    trend: "+12%" },
    { key: "open_menu",        label: "Menu Opens",        icon: "restaurant_menu", colorIcon: "bg-amber-100 text-amber-700",  bar: "bg-amber-500",   trend: "+8%"  },
    { key: "click_call",       label: "Phone Calls",       icon: "phone",           colorIcon: "bg-green-100 text-green-700",  bar: "bg-green-500",   trend: "+3%"  },
    { key: "click_directions", label: "Directions",        icon: "place",           colorIcon: "bg-purple-100 text-purple-700",bar: "bg-purple-500",  trend: "+5%"  },
    { key: "favorite",         label: "Favorites",         icon: "favorite",        colorIcon: "bg-red-100 text-red-700",      bar: "bg-red-500",     trend: "+21%" },
    { key: "reservation",      label: "Reservations",      icon: "calendar_today",  colorIcon: "bg-teal-100 text-teal-700",    bar: "bg-teal-500",    trend: "+9%"  },
  ];

  const totalEvents = Object.values(counts).reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...metrics.map(m => counts[m.key] || 0), 1);

  const TOP_STATS = [
    { label: "Total Engagements", value: totalEvents,                                          icon: "insights",     grad: "from-amber-500 to-orange-500"   },
    { label: "Conversion Rate",   value: "4.8%",                                              icon: "show_chart",   grad: "from-green-500 to-emerald-600"  },
    { label: "Avg Weekly Views",  value: Math.round((counts.view_restaurant || 0) / 13) || 0, icon: "trending_up",  grad: "from-blue-500 to-indigo-600"    },
    { label: "Repeat Visitors",   value: "62%",                                               icon: "loyalty",      grad: "from-purple-500 to-violet-600"  },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TOP_STATS.map((s, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-[2rem] p-6 text-white shadow-lg group card-lift animate-slide-up stagger-${i + 1}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.grad}`} />
            <div className="relative z-10">
              <div className="p-2 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                <Icon name={s.icon} size={18} />
              </div>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className="text-3xl font-lora font-bold">{s.value}</h3>
            </div>
            <div className="absolute -bottom-6 -right-6 text-white/10 group-hover:text-white/15 transition-all duration-500 group-hover:scale-110 pointer-events-none">
              <Icon name={s.icon} size={100} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-8">

        {/* Engagement Bars */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-cream-200 shadow-sm p-8 card-lift animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-lora text-xl font-bold text-stone-800">Engagement Breakdown</h3>
              <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Last 90 days · All channels</p>
            </div>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 px-3 py-1.5 rounded-full">90 days</span>
          </div>

          <div className="space-y-6">
            {metrics.map((m, i) => {
              const v = counts[m.key] || 0;
              return (
                <div key={m.key} className={`group animate-slide-up stagger-${i + 1}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${m.colorIcon} group-hover:scale-110 transition-transform`}>
                        <Icon name={m.icon} size={13} />
                      </div>
                      <span className="text-sm font-semibold text-stone-700">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{m.trend}</span>
                      <span className="text-sm font-bold text-stone-900 w-8 text-right">{v}</span>
                    </div>
                  </div>
                  <AnimatedBar value={v} max={maxVal} colorClass={m.bar} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Liora Score */}
          <div className="bg-stone-900 rounded-[2rem] p-8 text-white relative overflow-hidden group card-lift animate-slide-up stagger-4">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Liora Score</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-5xl font-lora font-bold">8.4</span>
              <span className="text-white/30 text-lg mb-1.5">/10</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed mb-6">
              Performing above the city average. Focus on call-to-action to push above 9.0.
            </p>
            <div className="space-y-3">
              {[
                { label: "Content Quality",    pct: 82 },
                { label: "Response Time",      pct: 74 },
                { label: "Menu Completeness",  pct: 91 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-bold text-white/60 mb-1.5">
                    <span>{item.label}</span><span>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full bar-fill"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-6 -right-6 text-white/5 group-hover:text-white/8 transition-colors pointer-events-none">
              <Icon name="insights" size={120} />
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm p-6 card-lift animate-slide-up stagger-5">
            <h4 className="font-lora text-base font-bold text-stone-800 mb-4">Weekly Snapshot</h4>
            <div className="flex items-end gap-1.5 h-20">
              {[40, 65, 55, 80, 70, 90, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar cursor-pointer">
                  <div
                    className="w-full bg-amber-100 rounded-t-lg group-hover/bar:bg-amber-400 transition-colors duration-200"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-stone-400 font-bold">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight Strip */}
      <div className="bg-gradient-to-r from-amber-50 to-cream-100 rounded-[2rem] border border-amber-100 p-6 flex items-center gap-6 group card-lift animate-slide-up stagger-5">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 group-hover:scale-110 transition-transform">
          <Icon name="sparkles" size={22} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-stone-800 text-sm mb-0.5">AI Insight · This Week</h4>
          <p className="text-stone-500 text-xs leading-relaxed">
            Menu opens increased by 8% this week. Customers who open your menu convert to reservations at a{" "}
            <strong className="text-stone-700">4.8%</strong> rate — above the {restaurant.cuisine} category average of 3.1%.
          </p>
        </div>
        <button className="flex-shrink-0 px-4 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all active:scale-95 shadow-md hidden sm:block">
          Full Report
        </button>
      </div>
    </div>
  );
}
