
import React, { useEffect, useState } from "react";
import { useSession } from "../../auth/useSession";
import { db_getRestaurantsByOwner, db_seedIfEmpty, type DemoRestaurant } from "../../demoDb";
import { getAuth } from "../../auth";
import { Icon } from "../../../components/Icon";

// Page Components
import RestoOverview from "./Overview";
import RestoAiConsultant from "./AiConsultant";
import RestoMenuStudio from "./MenuStudio";
import RestoMarketingStudio from "./MarketingStudio";
import RestoKPIs from "./KPIs";
import RestoInventory from "./Inventory";
import RestoStaff from "./Staff";
import RestoFinance from "./Finance";
import RestoVenueSettings from "./VenueSettings";
import RestoSupport from "./Support";
import RestoOrders from './pages/Orders';
import RestoPromotions from './pages/Promotions';
import RestoCustomerInsights from './pages/CustomerInsights';
import RestoChefSpecials from './pages/ChefSpecials';
import RestoTables from './pages/Tables';
import RestoLoyalty from './pages/LoyaltyProgram';
import RestoChefGPT from './ChefGPT';
const MENU_GROUPS = [
  {
    label: 'Intelligence',
    items: [
      { id: 'overview', label: 'Overview', icon: 'dashboard' },
      { id: 'ai_consultant', label: 'AI Consultant', icon: 'smart_toy', isNew: true },
      { id: 'analytics', label: 'KPIs & Analytics', icon: 'insights' },
      { id: 'customer_insights', label: 'Customer Insights', icon: 'group', isNew: true },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'orders', label: 'Order Management', icon: 'receipt_long', isNew: true },
      { id: 'menu', label: 'Menu Studio', icon: 'restaurant_menu' },
      { id: 'chef_specials', label: 'Chef Specials', icon: 'restaurant', isNew: true },
      { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
      { id: 'tables', label: 'Table Management', icon: 'table_restaurant' },
      { id: 'staff', label: 'Staff & Scheduling', icon: 'badge' },
      { id: 'chef_gpt', label: 'Chef GPT', icon: 'soup_kitchen', isNew: true },
    ]
  },
  {
    label: 'Growth',
    items: [
      { id: 'marketing', label: 'Marketing Studio', icon: 'campaign' },
      { id: 'promotions', label: 'Promotions & Offers', icon: 'local_offer', isNew: true },
      { id: 'loyalty', label: 'Loyalty & Rewards', icon: 'loyalty', isNew: true },
    ]
  },
  {
    label: 'Admin',
    items: [
      { id: 'finance', label: 'Finance', icon: 'attach_money' },
      { id: 'settings', label: 'Venue Settings', icon: 'settings' },
      { id: 'support', label: 'Support', icon: 'support' },
    ]
  }
];

export default function RestaurantPortal(){
  const s = useSession();
  const auth = getAuth();
  const ownerId = s?.user?.id || "";
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurant, setRestaurant] = useState<DemoRestaurant|null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(()=>{
    if (!ownerId) return;
    db_seedIfEmpty(ownerId);
    const r = db_getRestaurantsByOwner(ownerId)[0] || null;
    setRestaurant(r);
  }, [ownerId]);
  
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
        await auth.signOut();
    }
  };

  if (!s || s.user.role!=="restaurant_owner") {
    return <div className="p-6">Please login as a restaurant owner.</div>;
  }
  if (!restaurant) return <div className="p-6 flex items-center justify-center min-h-screen">Loading your restaurantâ ¦</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <RestoOverview restaurant={restaurant} />;
      case 'ai_consultant': return <RestoAiConsultant restaurant={restaurant} />;
      case 'analytics': return <RestoKPIs restaurant={restaurant} />;
      case 'customer_insights': return <RestoCustomerInsights restaurant={restaurant} />;
      case 'orders': return <RestoOrders restaurant={restaurant} />;
      case 'menu': return <RestoMenuStudio restaurant={restaurant} />;
      case 'chef_specials': return <RestoChefSpecials restaurant={restaurant} />;
      case 'inventory': return <RestoInventory restaurant={restaurant} />;
      case 'tables': return <RestoTables restaurant={restaurant} />;
      case 'staff': return <RestoStaff restaurant={restaurant} />;
      case 'chef_gpt': return <RestoChefGPT restaurant={restaurant} />;
      case 'marketing': return <RestoMarketingStudio restaurant={restaurant} />;
      case 'promotions': return <RestoPromotions restaurant={restaurant} />;
      case 'loyalty': return <RestoLoyalty restaurant={restaurant} />;
      case 'finance': return <RestoFinance restaurant={restaurant} />;
      case 'settings': return <RestoVenueSettings restaurant={restaurant} />;
      case 'support': return <RestoSupport restaurant={restaurant} />;

      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
            <div className="w-24 h-24 bg-cream-50 rounded-[2rem] flex items-center justify-center text-brand-400 mb-6 shadow-sm border border-cream-200">
              <Icon name="construction" size={40} />
            </div>
            <h2 className="text-2xl font-lora font-bold text-stone-800 mb-2">Coming Soon</h2>
            <p className="text-stone-400 max-w-md text-sm leading-relaxed">
              The <strong>{MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label}</strong> module is currently being calibrated for your venue.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-[2px]" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-72 bg-cream-50 border-r border-cream-200 flex flex-col h-full z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-forest-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="font-lora font-bold text-xl">L</span>
            </div>
            <div className="flex flex-col">
              <span className="font-lora text-2xl text-stone-800 leading-none tracking-tight font-bold">Liora</span>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] leading-tight mt-1 whitespace-nowrap">
                for Restaurants
              </span>
            </div>
          </div>
          <button className="md:hidden p-1 text-stone-800 hover:bg-black/5 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scrollbar-hide">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-4 text-[10px] font-bold text-[#B0A695] uppercase tracking-widest mb-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-cream-200/60 text-stone-800 shadow-sm ring-1 ring-black/5' 
                        : 'text-stone-400 hover:bg-cream-200/60/40 hover:text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={item.icon} size={20} className={activeTab === item.id ? 'text-stone-800' : 'text-stone-400'} />
                      {item.label}
                    </div>
                    {item.isNew && (
                      <span className="bg-brand-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">NEW</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-cream-200/60 bg-cream-50/50 backdrop-blur-sm">
          <div className="bg-white/80 rounded-2xl p-4 flex items-center gap-3 border border-cream-200 shadow-sm">
            <div className="w-9 h-9 bg-cream-50 rounded-full flex items-center justify-center text-stone-800 text-xs font-bold border border-cream-200 shadow-inner">
              {restaurant.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-stone-800 truncate">{restaurant.name}</p>
              <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors mt-0.5">Log Out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white overflow-y-auto flex flex-col relative">
        <header className="px-8 py-6 border-b border-cream-200/60 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-stone-800 hover:bg-cream-100/50 rounded-full" onClick={() => setIsSidebarOpen(true)}>
                <Icon name="menu" size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-lora font-bold text-stone-800">
                {MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live Data Updated: Today, 2:30 PM
                </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 text-stone-400 hover:bg-cream-100/80 rounded-xl transition-colors border border-transparent hover:border-cream-200/60"><Icon name="notifications" size={22} /></button>
            <button className="p-2.5 text-stone-400 hover:bg-cream-100/80 rounded-xl transition-colors border border-transparent hover:border-cream-200/60"><Icon name="help" size={22} /></button>
          </div>
        </header>
        
        <div className="p-8 flex-1">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}
