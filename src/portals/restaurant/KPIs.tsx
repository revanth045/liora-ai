import React, { useMemo } from "react";
import type { DemoRestaurant } from "../../demoDb";
import { db_eventsForRestaurant } from "../../demoDb";

export default function RestoKPIs({restaurant}:{restaurant:DemoRestaurant}){
  const events = db_eventsForRestaurant(restaurant.id);
  const counts = useMemo(()=>{
    const c: Record<string,number> = {};
    for (const e of events) c[e.type]=(c[e.type]||0)+1;
    return c;
  }, [events]);

  const metrics = [
    {key:"view_restaurant", label:"Views"},
    {key:"open_menu", label:"Menu opens"},
    {key:"click_call", label:"Calls"},
    {key:"click_directions", label:"Directions"},
    {key:"favorite", label:"Favorites"},
    {key:"reservation", label:"Reservations"},
  ];

  return (
    <div className="bg-cream-50 border border-cream-200 rounded-2xl shadow-lg p-6">
      <div className="font-lora text-xl text-stone-800 mb-4">Engagement (last 90 days)</div>
      <div className="space-y-4">
        {metrics.map(m=>{
          const v = counts[m.key]||0;
          const w = Math.min(100, v*10); // A simple scaling factor for demo purposes
          return <div key={m.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-600">{m.label}</span>
              <b className="font-semibold text-stone-800">{v}</b>
            </div>
            <div className="h-2 bg-black/10 rounded-full"><div className="h-2 bg-brand-400 rounded-full" style={{width:`${w}%`}}/></div>
          </div>;
        })}
      </div>
    </div>
  );
}