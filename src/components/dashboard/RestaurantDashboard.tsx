import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../../auth/useSession";
import {
  DemoRestaurant, DemoMenuItem, db_getRestaurantsByOwner, db_seedIfEmpty,
  db_upsertRestaurant, db_listMenu, db_addMenu, db_updateMenu, db_deleteMenu,
  db_eventsForRestaurant, db_listReservations
} from "../../demoDb";

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
    <h3 className="font-semibold mb-3">{title}</h3>{children}
  </section>;
}

function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>){
  return <label className="block mb-2">
    <div className="text-sm text-stone-400">{label}</div>
    <input className="border rounded px-3 py-2 w-full bg-white text-stone-800 focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200" {...p}/>
  </label>;
}

function dollars(cents:number){ return `$${(cents/100).toFixed(2)}` }

export default function RestaurantDashboard(){
  const session = useSession();
  const ownerId = session?.user?.id || "";
  const [active, setActive] = useState<"profile"|"menu"|"reservations"|"analytics">("profile");
  const [restaurant, setRestaurant] = useState<DemoRestaurant|null>(null);
  const [menu, setMenu] = useState<DemoMenuItem[]>([]);
  const [msg,setMsg] = useState("");

  useEffect(()=>{ if (!ownerId) return;
    db_seedIfEmpty(ownerId);
    const r = db_getRestaurantsByOwner(ownerId)[0] || null;
    setRestaurant(r);
    if (r) setMenu(db_listMenu(r.id));
  }, [ownerId]);

  if (!session || session.user.role!=="restaurant_owner"){
    return <div className="p-6">Please login as a restaurant owner.</div>;
  }
  if (!restaurant) return <div className="p-6">Setting up your restaurant...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">{restaurant.name} — Dashboard</h2>

      <div className="flex gap-2 mb-4">
        {["profile","menu","reservations","analytics"].map(t=>(
          <button key={t} onClick={()=>setActive(t as any)}
            className={`px-3 py-1 rounded-full ${active===t?"bg-amber-600 text-white":"border"}`}>
            {t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {active==="profile" && <ProfileTab restaurant={restaurant} onSave={(r)=>{ db_upsertRestaurant(r); setRestaurant({...r}); setMsg("Saved."); setTimeout(()=>setMsg(""),1500); }}/>}
      {active==="menu" && <MenuTab restaurantId={restaurant.id} menu={menu} onChange={(m)=>setMenu(m)}/>}
      {active==="reservations" && <ReservationsTab restaurantId={restaurant.id} />}
      {active==="analytics" && <AnalyticsTab restaurantId={restaurant.id} />}

      {msg && <div className="text-sm mt-2">{msg}</div>}
    </div>
  );
}

function ProfileTab({restaurant, onSave}:{restaurant:DemoRestaurant; onSave:(r:DemoRestaurant)=>void}){
  const [form,setForm]=useState<DemoRestaurant>(restaurant);
  useEffect(()=>setForm(restaurant),[restaurant]);
  return (
    <Section title="Business Profile">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Restaurant name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <Field label="Phone" value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/>
        <Field label="Website" value={form.website||""} onChange={e=>setForm({...form,website:e.target.value})}/>
        <Field label="Address" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})}/>
      </div>
      <div className="mt-3">
        <button className="bg-amber-600 text-white px-3 py-2 rounded" onClick={()=>onSave(form)}>Save changes</button>
      </div>
    </Section>
  );
}

function MenuTab({restaurantId, menu, onChange}:{restaurantId:string; menu:DemoMenuItem[]; onChange:(m:DemoMenuItem[])=>void}){
  const blank: Omit<DemoMenuItem,"id"|"restaurantId"> = { name:"", description:"", priceCents:1500, tags:[], available:true };
  const [form,setForm]=useState(blank);
  function add(){
    if (!form.name.trim()) return;
    db_addMenu(restaurantId, form);
    onChange(db_listMenu(restaurantId));
    setForm(blank);
  }
  function toggle(item:DemoMenuItem){ db_updateMenu({...item, available:!item.available}); onChange(db_listMenu(restaurantId)); }
  function del(id:string){ db_deleteMenu(id); onChange(db_listMenu(restaurantId)); }

  return (
    <>
      <Section title="Add Item">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <Field label="Price ($)" value={(form.priceCents/100).toString()} onChange={e=>setForm({...form,priceCents:Math.round(Number(e.target.value)*100)})}/>
          <Field label="Tags (comma)" value={(form.tags||[]).join(", ")} onChange={e=>setForm({...form,tags:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})}/>
        </div>
        <textarea className="border rounded w-full px-3 py-2 mt-2 bg-white text-stone-800 focus:ring-2 focus:ring-brand-400/30 transition-shadow duration-200" rows={3} placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div className="mt-3 flex gap-2">
          <button className="bg-amber-600 text-white px-3 py-2 rounded" onClick={add}>Add to menu</button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.available} onChange={e=>setForm({...form,available:e.target.checked})}/> Available</label>
        </div>
      </Section>

      <Section title="Current Menu">
        <div className="space-y-2">
          {(menu||[]).length===0 && <div className="text-sm text-stone-400">No items yet.</div>}
          {(menu||[]).map(item=>(
            <div key={item.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{item.name} <span className="text-stone-400">— {dollars(item.priceCents)}</span></div>
                {item.description && <div className="text-sm text-stone-600">{item.description}</div>}
                {(item.tags||[]).length>0 && <div className="text-xs text-stone-400 mt-1">#{item.tags?.join("  #")}</div>}
                {!item.available && <div className="text-xs text-red-600 mt-1">Unavailable</div>}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={()=>toggle(item)}>{item.available?"Disable":"Enable"}</button>
                <button className="px-3 py-1 rounded border" onClick={()=>del(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function ReservationsTab({restaurantId}:{restaurantId:string}){
  const list = db_listReservations(restaurantId);
  return (
    <Section title="Reservations">
      {list.length===0 ? <div className="text-sm text-stone-400">No reservations yet.</div> :
      <table className="w-full text-sm">
        <thead><tr className="text-left text-stone-400"><th>Email</th><th>Party</th><th>When</th><th>Status</th></tr></thead>
        <tbody>
          {list.map(r=>(
            <tr key={r.id}><td>{r.userEmail}</td><td>{r.partySize}</td><td>{r.when}</td><td>{r.status}</td></tr>
          ))}
        </tbody>
      </table>}
    </Section>
  );
}

function AnalyticsTab({restaurantId}:{restaurantId:string}){
  const events = db_eventsForRestaurant(restaurantId);
  const counts = useMemo(()=>{
    const c: Record<string,number> = {};
    for (const e of events) c[e.type]=(c[e.type]||0)+1;
    return c;
  }, [events]);

  const metrics = [
    { key:"view_restaurant", label:"Views" },
    { key:"open_menu", label:"Menu opens" },
    { key:"click_call", label:"Calls" },
    { key:"click_directions", label:"Directions" },
    { key:"favorite", label:"Favorites" },
    { key:"reservation", label:"Reservations" },
  ];

  return (
    <Section title="Engagement (last 90 days)">
      {events.length===0 && <div className="text-sm text-stone-400">No activity yet.</div>}
      <div className="space-y-2">
        {metrics.map(m=>{
          const v = counts[m.key]||0;
          const w = Math.min(100, v*10);
          return (
            <div key={m.key}>
              <div className="text-sm flex justify-between"><span>{m.label}</span><b>{v}</b></div>
              <div className="h-2 bg-cream-200/60 rounded"><div className="h-2 bg-amber-600 rounded" style={{width:`${w}%`}}/></div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-stone-400 mt-3">Tip: these grow when users tap your card CTAs (menu, call, directions, favorite).</div>
    </Section>
  );
}