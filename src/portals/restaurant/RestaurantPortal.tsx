
import React, { useEffect, useState } from "react";
import { useSession } from "../../auth/useSession";
import { db_getRestaurantsByOwner, db_seedIfEmpty, db_listOrders, type DemoRestaurant } from "../../demoDb";
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
import RestoNotifications from './pages/Notifications';
import RestoQRCodes from './pages/QRCodes';
const MENU_GROUPS = [
  {
    label: 'Intelligence',
    items: [
      { id: 'overview',          label: 'Overview',          icon: 'dashboard' },
      { id: 'ai_consultant',     label: 'AI Consultant',     icon: 'smart_toy',   isNew: true },
      { id: 'analytics',         label: 'KPIs & Analytics',  icon: 'insights' },
      { id: 'customer_insights', label: 'Customer Insights', icon: 'group',       isNew: true },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'orders',       label: 'Order Management',  icon: 'receipt_long',         isNew: true },
      { id: 'notifications',label: 'Notifications',     icon: 'notifications_active', isNew: true },
      { id: 'menu',         label: 'Menu Studio',       icon: 'restaurant_menu' },
      { id: 'chef_specials',label: 'Chef Specials',     icon: 'chef_hat',             isNew: true },
      { id: 'inventory',    label: 'Inventory',         icon: 'inventory_2' },
      { id: 'tables',       label: 'Table Management',  icon: 'table_restaurant' },
      { id: 'qr_codes',     label: 'QR Codes',          icon: 'qr_code_2',            isNew: true },
      { id: 'staff',        label: 'Staff & Scheduling',icon: 'badge' },
      { id: 'chef_gpt',     label: 'Chef GPT',          icon: 'soup_kitchen',         isNew: true },
    ]
  },
  {
    label: 'Growth',
    items: [
      { id: 'marketing',  label: 'Marketing Studio',   icon: 'campaign' },
      { id: 'promotions', label: 'Promotions & Offers', icon: 'local_offer', isNew: true },
      { id: 'loyalty',    label: 'Loyalty & Rewards',  icon: 'loyalty',     isNew: true },
    ]
  },
  {
    label: 'Admin',
    items: [
      { id: 'finance',  label: 'Finance',        icon: 'attach_money' },
      { id: 'settings', label: 'Venue Settings', icon: 'settings' },
      { id: 'support',  label: 'Support',        icon: 'support' },
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
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    const checkOrders = () => {
      const orders = db_listOrders(restaurant.id);
      if (orderCount !== null && orders.length > orderCount) {
        const newest = orders[orders.length - 1];
        const allergensStr = newest.allergens && newest.allergens.length > 0 ? ` ⚠️ Allergies: ${newest.allergens.join(', ')}` : '';
        setToast({ title: 'New Order Received', message: `Table ${newest.tableNumber || '?'} ordered ${newest.items.length} items.${allergensStr}` });
        setTimeout(() => setToast(null), 5000);
      }
      setOrderCount(orders.length);
    };
    checkOrders();
    const interval = setInterval(checkOrders, 3000);
    return () => clearInterval(interval);
  }, [restaurant, orderCount]);

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
  if (!restaurant) return <div className="p-6 flex items-center justify-center min-h-screen">Loading your restaurant...</div>;

  const activeItem = MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':          return <RestoOverview restaurant={restaurant} onNavigate={setActiveTab} />;
      case 'ai_consultant':     return <RestoAiConsultant restaurant={restaurant} />;
      case 'analytics':         return <RestoKPIs restaurant={restaurant} />;
      case 'customer_insights': return <RestoCustomerInsights restaurant={restaurant} />;
      case 'orders':            return <RestoOrders restaurant={restaurant} />;
      case 'notifications':     return <RestoNotifications restaurant={restaurant} />;
      case 'menu':              return <RestoMenuStudio restaurant={restaurant} />;
      case 'chef_specials':     return <RestoChefSpecials restaurant={restaurant} />;
      case 'inventory':         return <RestoInventory restaurant={restaurant} />;
      case 'tables':            return <RestoTables restaurant={restaurant} />;
      case 'qr_codes':          return <RestoQRCodes restaurant={restaurant} />;
      case 'staff':             return <RestoStaff restaurant={restaurant} />;
      case 'chef_gpt':          return <RestoChefGPT restaurant={restaurant} />;
      case 'marketing':         return <RestoMarketingStudio restaurant={restaurant} />;
      case 'promotions':        return <RestoPromotions restaurant={restaurant} />;
      case 'loyalty':           return <RestoLoyalty restaurant={restaurant} />;
      case 'finance':           return <RestoFinance restaurant={restaurant} />;
      case 'settings':          return <RestoVenueSettings restaurant={restaurant} />;
      case 'support':           return <RestoSupport restaurant={restaurant} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
            <div className="w-24 h-24 bg-cream-50 rounded-[2rem] flex items-center justify-center text-stone-400 mb-6 shadow-sm border border-cream-200">
              <Icon name="construction" size={40} />
            </div>
            <h2 className="text-2xl font-lora font-bold text-stone-800 mb-2">Coming Soon</h2>
            <p className="text-stone-400 max-w-md text-sm leading-relaxed">
              The <strong>{activeItem?.label}</strong> module is currently being calibrated for your venue.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-slate-800 overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-[2px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-64 bg-white border-r border-stone-100 flex flex-col h-full z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-sm ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <span className="font-lora font-bold text-lg text-white leading-none">L</span>
            </div>
            <div>
              <span className="font-lora font-bold text-stone-900 text-lg leading-none tracking-tight">Liora</span>
              <p className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.18em] mt-0.5">for Restaurants</p>
            </div>
          </div>
          <button
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx}>
              <p className="px-3 mb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.16em]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                        isActive
                          ? 'bg-stone-900 text-white shadow-md scale-[1.01]'
                          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800 hover:translate-x-0.5'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex-shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'text-amber-400 scale-110'
                            : 'text-stone-400 group-hover:text-stone-600 group-hover:scale-110'
                        }`}>
                          <Icon name={item.icon} size={18} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.isNew && (
                        <span className={`flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-1 transition-all ${
                          isActive ? 'bg-amber-400/30 text-amber-300' : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'
                        }`}>
                          NEW
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="p-3 border-t border-stone-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {restaurant.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-800 truncate">{restaurant.name}</p>
              <button
                onClick={handleLogout}
                className="text-[10px] font-semibold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider mt-0.5"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-stone-50 overflow-y-auto flex flex-col relative">

        {/* Top Header */}
        <header className="px-6 py-4 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Icon name="menu" size={22} />
            </button>
            <div className="flex items-center gap-3">
              {activeItem && (
                <div className="hidden sm:flex w-9 h-9 rounded-xl bg-stone-100 items-center justify-center text-stone-600">
                  <Icon name={activeItem.icon} size={18} />
                </div>
              )}
              <div>
                <h2 className="text-lg font-lora font-bold text-stone-900 leading-tight">
                  {activeItem?.label}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Live</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">
              <Icon name="notifications" size={20} />
            </button>
            <button className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">
              <Icon name="help" size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 flex-1">
          {renderContent()}
        </div>
      </main>

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-stone-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
              🛎️
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm tracking-wide">{toast.title}</h4>
              <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
