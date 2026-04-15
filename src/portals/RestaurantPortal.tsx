import React, { useEffect, useState } from "react";
import { useSession } from "../auth/useSession";
import { db_getRestaurantsByOwner, db_seedIfEmpty, type DemoRestaurant } from "../demoDb";
import RestoOverview from "./restaurant/Overview";
import RestoMenuStudio from "./restaurant/MenuStudio";
import RestoMarketingStudio from "./restaurant/MarketingStudio";
import RestoKPIs from "./restaurant/KPIs";
import RestoInventory from "./restaurant/Inventory";
import RestoStaff from "./restaurant/Staff";
import RestoFinance from "./restaurant/Finance";
import RestoTraining from "./restaurant/Training";
import { getAuth } from "../auth";
import { Icon } from "../../components/Icon";
import RestoSupport from "./restaurant/Support";
import RestoAiConsultant from "./restaurant/AiConsultant";
import RestoOrders from "./restaurant/pages/Orders";
import RestoPromotions from "./restaurant/pages/Promotions";
import RestoCustomers from "./restaurant/pages/CustomerInsights";
import RestoChefSpecials from "./restaurant/pages/ChefSpecials";
import RestoTables from "./restaurant/pages/Tables";


const TABS = [
  // ─ Core operations
  {key:"overview",   label:"Dashboard",        icon: "search",          group: "Operations"},
  {key:"orders",     label:"Order Management",  icon: "restaurant_menu", group: "Operations"},
  {key:"menu",       label:"Menu Studio",       icon: "menu",            group: "Operations"},
  {key:"inventory",  label:"Inventory",         icon: "briefcase",       group: "Operations"},
  {key:"tables",     label:"Table Management",   icon: "table_restaurant",group: "Operations"},
  {key:"chef",       label:"Chef Specials",     icon: "star",            group: "Operations"},
  // ─ Growth
  {key:"consultant", label:"AI Consultant",     icon: "chat",            group: "Growth"},
  {key:"marketing",  label:"Marketing Studio",  icon: "sparkles",        group: "Growth"},
  {key:"promotions", label:"Promotions",        icon: "tag",             group: "Growth"},
  // ─ Insights
  {key:"kpis",       label:"KPIs & Analytics",  icon: "clipboard-list",  group: "Insights"},
  {key:"customers",  label:"Customer Insights", icon: "user-circle",     group: "Insights"},
  // ─ Team
  {key:"staff",      label:"Staff & Scheduling",icon: "user-circle",     group: "Team"},
  {key:"finance",    label:"Finance",           icon: "attach_money",    group: "Team"},
  {key:"training",   label:"Training",          icon: "calendar",        group: "Team"},
  {key:"support",    label:"Support",           icon: "support",         group: "Team"},
] as const;

export default function RestaurantPortal(){
  const s = useSession();
  const auth = getAuth();
  const ownerId = s?.user?.id || "";
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("consultant");
  const [restaurant, setRestaurant] = useState<DemoRestaurant|null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(()=>{
    if (!ownerId) return;
    db_seedIfEmpty(ownerId);
    const r = db_getRestaurantsByOwner(ownerId)[0] || null;
    setRestaurant(r);
  }, [ownerId]);
  
  const handleLogout = async () => {
    await auth.signOut();
  };
  
  const handleTabClick = (tabKey: typeof TABS[number]["key"]) => {
    setTab(tabKey);
    setIsSidebarOpen(false); // Close sidebar on nav
  }

  if (!s || s.user.role!=="restaurant_owner") {
    return <div className="p-6">Please login as a restaurant owner.</div>;
  }
  if (!restaurant) return <div className="p-6">Loading your restaurant…</div>;

  // Group tabs for sidebar rendering
  const TAB_GROUPS = [...new Set(TABS.map(t => t.group))];

  const sidebarContent = (
    <>
      <div className="flex justify-between items-center px-3 py-4 mb-2">
        <div>
          <div className="font-display text-xl font-semibold text-stone-800 tracking-wide">Liora</div>
          <div className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest">for Restaurants</div>
        </div>
        <button className="md:hidden p-1 text-stone-400" onClick={() => setIsSidebarOpen(false)}>
          <Icon name="x" className="w-5 h-5" />
        </button>
      </div>
      <div className="px-3 py-2.5 bg-forest-900 rounded-xl text-sm font-semibold text-cream-100 mb-3 truncate">{restaurant.name}</div>
      <nav className="space-y-0.5 overflow-y-auto flex-1">
        {TAB_GROUPS.map(group => (
          <div key={group}>
            <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest">{group}</div>
            {TABS.filter(t => t.group === group).map(t => (
              <button key={t.key}
                className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 text-sm ${
                  tab === t.key ? 'bg-brand-400/15 text-stone-800 font-semibold' : 'text-stone-500 hover:bg-cream-100 hover:text-stone-700'
                }`}
                onClick={() => handleTabClick(t.key)}>
                <Icon name={t.icon} className="w-4 h-4 flex-shrink-0" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-6 text-xs text-stone-300">
        Data is stored locally in this demo. When you export, connect Supabase and storage.
      </div>

      <div className="mt-auto pt-4 border-t border-cream-200">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-stone-700 truncate">{s.user.full_name || s.user.email}</p>
          <p className="text-xs text-stone-400 truncate">{s.user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200 text-red-400/70 hover:bg-red-500/5 hover:text-red-400"
        >
          <Icon name="arrow-right" className="w-5 h-5 flex-shrink-0 rotate-180" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream-50 md:grid md:grid-cols-[240px_1fr]">
      {/* Mobile Backdrop */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-64 bg-white text-stone-800 border-r border-cream-200 p-4 flex flex-col h-screen z-40 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 bg-cream-50/80 backdrop-blur-sm sticky top-0 z-10 border-b border-cream-200">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Icon name="menu" className="w-6 h-6"/>
            </button>
            <div className="font-lora text-2xl font-bold text-stone-800">{TABS.find(t=>t.key===tab)?.label}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-400/5 border border-brand-400/20 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-400">{s.user.email.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm text-stone-400 hidden sm:block">{s.user.email}</span>
            <button onClick={handleLogout} className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Sign out">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${tab === 'consultant' ? 'md:overflow-hidden' : ''}`}>
          <div className={`max-w-6xl mx-auto w-full ${tab === 'consultant' ? 'h-full' : ''}`}>
            {tab==="overview"   && <RestoOverview restaurant={restaurant}/>}
            {tab==="orders"     && <RestoOrders restaurant={restaurant}/>}
            {tab==="consultant" && <RestoAiConsultant restaurant={restaurant}/>}
            {tab==="menu"       && <RestoMenuStudio restaurant={restaurant}/>}
            {tab==="marketing"  && <RestoMarketingStudio restaurant={restaurant}/>}
            {tab==="kpis"       && <RestoKPIs restaurant={restaurant}/>}
            {tab==="inventory"  && <RestoInventory restaurant={restaurant}/>}
            {tab==="tables"     && <RestoTables restaurant={restaurant}/>}
            {tab==="chef"       && <RestoChefSpecials restaurant={restaurant}/>}
            {tab==="promotions" && <RestoPromotions restaurant={restaurant}/>}
            {tab==="customers"  && <RestoCustomers restaurant={restaurant}/>}
            {tab==="staff"      && <RestoStaff restaurant={restaurant}/>}
            {tab==="finance"    && <RestoFinance restaurant={restaurant}/>}
            {tab==="training"   && <RestoTraining restaurant={restaurant}/>}
            {tab==="support"    && <RestoSupport restaurant={restaurant} />}
          </div>
        </main>
      </div>
    </div>
  );
}