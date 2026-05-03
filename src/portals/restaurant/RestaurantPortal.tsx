import React, { useEffect, useState } from "react";
import { useSession } from "../../auth/useSession";
import { db_getRestaurantsByOwner, db_seedIfEmpty, db_listOrders, type DemoRestaurant } from "../../demoDb";
import { getAuth } from "../../auth";
import { Icon } from "../../../components/Icon";
import { LogoMark } from "../../../components/Logo";
import { useSettings } from "../../context/SettingsContext";
import { t } from "../../lib/i18n";
import SettingsPanel from "../../components/SettingsPanel";

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
      { id: 'overview',         label: 'Overview',         icon: 'dashboard' },
      { id: 'ai_consultant',    label: 'AI Consultant',    icon: 'smart_toy', isNew: true },
      { id: 'analytics',        label: 'KPIs & Analytics', icon: 'insights' },
      { id: 'customer_insights',label: 'Customer Insights',icon: 'group',     isNew: true },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'orders',         label: 'Order Management', icon: 'receipt_long',         isNew: true },
      { id: 'notifications',  label: 'Notifications',    icon: 'notifications_active', isNew: true },
      { id: 'menu',           label: 'Menu Studio',      icon: 'restaurant_menu' },
      { id: 'chef_specials',  label: 'Chef Specials',    icon: 'restaurant',           isNew: true },
      { id: 'inventory',      label: 'Inventory',        icon: 'inventory_2' },
      { id: 'tables',         label: 'Tables',           icon: 'table_restaurant' },
      { id: 'qr_codes',       label: 'QR Codes',         icon: 'qr_code_2',            isNew: true },
      { id: 'staff',          label: 'Staff & Roster',   icon: 'badge' },
      { id: 'chef_gpt',       label: 'Chef GPT',         icon: 'soup_kitchen',         isNew: true },
    ]
  },
  {
    label: 'Growth',
    items: [
      { id: 'marketing',  label: 'Marketing Studio',     icon: 'campaign' },
      { id: 'promotions', label: 'Promotions & Offers',  icon: 'local_offer', isNew: true },
      { id: 'loyalty',    label: 'Loyalty & Rewards',    icon: 'loyalty',     isNew: true },
    ]
  },
  {
    label: 'Admin',
    items: [
      { id: 'finance',  label: 'Finance',         icon: 'attach_money' },
      { id: 'settings', label: 'Venue Settings',  icon: 'settings' },
      { id: 'support',  label: 'Support',         icon: 'support' },
    ]
  }
];

export default function RestaurantPortal(){
  const s = useSession();
  const auth = getAuth();
  const settings = useSettings();
  const ownerId = s?.user?.id || "";
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurant, setRestaurant] = useState<DemoRestaurant|null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const collapsed = settings.layout === 'collapsed';

  useEffect(() => {
    if (!restaurant) return;
    const checkOrders = () => {
      const orders = db_listOrders(restaurant.id);
      if (orderCount !== null && orders.length > orderCount) {
        const newest = orders[orders.length - 1];
        const allergensStr = newest.allergens && newest.allergens.length > 0 ? ` ⚠️ Allergies: ${newest.allergens.join(', ')}` : '';
        setToast({ title: 'New Order', message: `Table ${newest.tableNumber || '?'} ordered ${newest.items.length} items.${allergensStr}` });
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

  const handleLogout = () => setShowSignOut(true);
  const confirmSignOut = async () => {
    setSigningOut(true);
    try { await auth.signOut(); } finally { setSigningOut(false); setShowSignOut(false); }
  };

  if (!s || s.user.role!=="restaurant_owner") {
    return <div className="p-6 text-stone-700">Please login as a restaurant owner.</div>;
  }
  if (!restaurant) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app text-stone-700 gap-3">
      <LogoMark className="w-12 h-12 animate-pulse-soft" />
      <p className="text-sm font-semibold">Preparing your kitchen…</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':         return <RestoOverview restaurant={restaurant} />;
      case 'ai_consultant':    return <RestoAiConsultant restaurant={restaurant} />;
      case 'analytics':        return <RestoKPIs restaurant={restaurant} />;
      case 'customer_insights':return <RestoCustomerInsights restaurant={restaurant} />;
      case 'orders':           return <RestoOrders restaurant={restaurant} />;
      case 'notifications':    return <RestoNotifications restaurant={restaurant} />;
      case 'menu':             return <RestoMenuStudio restaurant={restaurant} />;
      case 'chef_specials':    return <RestoChefSpecials restaurant={restaurant} />;
      case 'inventory':        return <RestoInventory restaurant={restaurant} />;
      case 'tables':           return <RestoTables restaurant={restaurant} />;
      case 'qr_codes':         return <RestoQRCodes restaurant={restaurant} />;
      case 'staff':            return <RestoStaff restaurant={restaurant} />;
      case 'chef_gpt':         return <RestoChefGPT restaurant={restaurant} />;
      case 'marketing':        return <RestoMarketingStudio restaurant={restaurant} />;
      case 'promotions':       return <RestoPromotions restaurant={restaurant} />;
      case 'loyalty':          return <RestoLoyalty restaurant={restaurant} />;
      case 'finance':          return <RestoFinance restaurant={restaurant} />;
      case 'settings':         return <RestoVenueSettings restaurant={restaurant} />;
      case 'support':          return <RestoSupport restaurant={restaurant} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center text-brand-700 mb-5 shadow-pop">
              <Icon name="construction" size={36} />
            </div>
            <h2 className="font-display text-3xl text-stone-800 mb-2">Coming soon</h2>
            <p className="text-stone-600 max-w-md text-sm">
              <strong className="text-stone-800">{MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label}</strong> is being calibrated for your venue.
            </p>
          </div>
        );
    }
  };

  const activeMeta = MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab);
  const venueLabel = settings.brand.displayName || restaurant.name;

  return (
    <div className="flex h-dscreen bg-app text-stone-800 overflow-hidden relative px-safe pt-safe">
      {/* Soft ambient backdrop wash so the floating sidebar reads against any page */}
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-cream-50/60 via-app to-amber-50/40" />
      <div className="pointer-events-none absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-brand-500/10 blur-3xl -z-0" />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ============= FLOATING SIDEBAR — DARK LUXE ============= */}
      <aside
        style={{
          background:
            'linear-gradient(180deg, #1a1410 0%, #221913 35%, #2a1f17 70%, #1f1612 100%)',
        }}
        className={`fixed md:relative top-0 md:top-4 left-0 md:left-4 md:bottom-4 md:h-[calc(100vh-2rem)] h-full ${collapsed ? 'w-[80px]' : 'w-[272px]'} md:rounded-3xl md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(231,195,132,0.08)_inset] md:ring-1 md:ring-amber-300/[0.08] flex flex-col z-40 transform transition-all duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}
      >
        {/* warm top vignette */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent" />
        {/* gold hairline highlight */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-amber-300/25 to-transparent" />

        {/* Brand */}
        <div className={`relative px-5 py-5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b border-amber-200/10`}>
          <button onClick={() => setActiveTab('overview')} className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0">
            <div className="relative flex-shrink-0">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name} className="w-10 h-10 rounded-2xl object-cover ring-1 ring-amber-300/30 shadow-md" />
              ) : (
                <LogoMark className="w-10 h-10" />
              )}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-stone-900" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-display text-xl text-cream-50 tracking-tight font-semibold truncate">{restaurant?.name || 'Liora'}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] mt-1 truncate" style={{ color: '#e7c384' }}>{restaurant?.tagline || 'for Restaurants'}</span>
              </div>
            )}
          </button>
          <button className="md:hidden p-1.5 text-cream-200 hover:bg-amber-200/10 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: '#c9a873' }}>{group.label}</h3>
              )}
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                      title={collapsed ? item.label : undefined}
                      className={`group relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-2' : 'px-3'} py-2.5 rounded-2xl text-sm font-semibold transition-all
                        ${active
                          ? 'bg-gradient-to-r from-amber-400/20 via-amber-500/12 to-transparent text-cream-50 shadow-[inset_0_0_0_1px_rgba(231,195,132,0.25)]'
                          : 'text-cream-100/85 hover:bg-amber-200/[0.06] hover:text-cream-50'}`}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,200,100,0.6)]" />}
                      <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                        <Icon name={item.icon} size={18} className={active ? '' : 'group-hover:text-cream-50 transition-colors'} style={active ? { color: '#f3c977' } : { color: 'rgb(231 229 228 / 0.75)' }} />
                        {!collapsed && <span className="text-[13px]">{item.label}</span>}
                      </div>
                      {!collapsed && item.isNew && (
                        <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                      )}
                      {collapsed && item.isNew && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative p-3 border-t border-amber-200/10 space-y-1.5">
          <button
            onClick={() => window.dispatchEvent(new Event('liora:browse-home'))}
            title="Visit Liora homepage"
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl bg-gradient-to-r from-amber-400/15 to-amber-500/10 border border-amber-300/25 text-cream-50 hover:from-amber-400/25 hover:to-amber-500/15 hover:border-amber-300/40 transition-all`}
          >
            <Icon name="home" size={18} style={{ color: '#f3c977' }} />
            {!collapsed && <span className="text-[13px] font-bold tracking-tight">Visit homepage</span>}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title={t(settings.locale, 'common.settings')}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl text-cream-100/85 hover:bg-amber-200/[0.06] hover:text-cream-50 transition-colors`}
          >
            <Icon name="settings" size={18} />
            {!collapsed && <span className="text-[13px] font-semibold">{t(settings.locale, 'common.settings')}</span>}
          </button>

          {!collapsed ? (
            <div className="rounded-2xl p-3 flex items-center gap-3 border border-amber-200/15 shadow-inner" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-stone-900 text-xs font-bold flex items-center justify-center shadow-[0_0_18px_rgba(245,200,100,0.4)] shrink-0">
                {venueLabel.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cream-50 truncate">{venueLabel}</p>
                <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest hover:text-amber-200 transition-colors" style={{ color: '#e7c384' }}>
                  {t(settings.locale, 'common.signOut')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogout} title={t(settings.locale, 'common.signOut')} className="w-full flex justify-center py-2 rounded-2xl hover:bg-amber-200/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-stone-900 text-xs font-bold flex items-center justify-center">
                {venueLabel.substring(0, 2).toUpperCase()}
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* ============= MAIN ============= */}
      <main className="flex-1 overflow-y-auto flex flex-col relative md:ml-2 pb-safe">
        <header className="px-5 md:px-8 py-5 border-b border-stone-900/[0.06] flex justify-between items-center sticky top-0 bg-app-elev/70 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-stone-700 hover:bg-cream-100 rounded-xl" onClick={() => setIsSidebarOpen(true)}>
              <Icon name="menu" size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl md:text-3xl text-stone-900 tracking-tight">{activeMeta?.label}</h2>
                <span className="tag-soft hidden md:inline-flex">Live</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors relative"
              title="Notifications"
            >
              <Icon name="notifications" size={20} />
              {orderCount && orderCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-app-elev" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors"
              title={t(settings.locale, 'common.settings')}
            >
              <Icon name="settings" size={20} />
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors"
              title="Help"
            >
              <Icon name="help" size={20} />
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8 flex-1 animate-page-slide max-w-[1400px] mx-auto w-full">
          {renderContent()}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-5 py-4 rounded-2xl shadow-lift flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-xl">🛎️</div>
            <div className="flex-1">
              <h4 className="font-bold text-sm uppercase tracking-wide">{toast.title}</h4>
              <p className="text-white/90 text-sm mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Professional Sign Out Modal */}
      {showSignOut && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in"
          onClick={() => !signingOut && setShowSignOut(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-cream-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-7 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-amber-500/10" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow mb-4">
                  <Icon name="logout" size={28} className="text-white" />
                </div>
                <h3 className="font-display text-2xl text-white font-semibold tracking-tight">Sign out of {restaurant?.name || 'your portal'}?</h3>
                <p className="text-cream-100 text-sm mt-2 font-light">You'll need to sign in again to access your venue dashboard, orders and analytics.</p>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 mb-5">
                <Icon name="info" size={16} className="text-amber-700 flex-shrink-0" />
                <p className="text-xs font-semibold text-amber-900">Live order alerts will pause until you return.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignOut(false)}
                  disabled={signingOut}
                  className="flex-1 py-3.5 rounded-2xl border border-cream-200 text-stone-700 text-sm font-bold hover:bg-cream-50 transition-colors disabled:opacity-50"
                >
                  Stay signed in
                </button>
                <button
                  type="button"
                  onClick={confirmSignOut}
                  disabled={signingOut}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold shadow-glow hover:shadow-lg hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {signingOut ? (
                    <><Icon name="refresh" size={14} className="animate-spin" /> Signing out…</>
                  ) : (
                    <>Sign out <Icon name="arrow_forward" size={14} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
