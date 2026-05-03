import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../../auth/useSession";
import { getAuth } from "../../auth";
import { Icon } from "../../../components/Icon";
import { LogoMark } from "../../../components/Logo";
import { toast } from "../../lib/toast";
import { useSettings } from "../../context/SettingsContext";
import { t } from "../../lib/i18n";
import SettingsPanel from "../../components/SettingsPanel";
import {
  DemoHotel, DemoHotelRoom, DemoHotelBooking, DemoHotelAddOn, DemoHotelReview,
  RoomType, BookingStatus, HotelAmenity,
  db_seedHotelIfEmpty, db_getHotelsByOwner, db_upsertHotel, db_ensureFrontDeskCode, genFrontDeskCode,
  db_listRooms, db_upsertRoom, db_deleteRoom, newRoomId,
  db_listBookings, db_addBooking, db_updateBookingStatus, db_deleteBooking,
  db_listAddOns, db_upsertAddOn, db_deleteAddOn, newAddOnId,
  db_listReviews, db_addReview, db_respondReview,
  formatMoney, nightsBetween, db_createHotel,
} from "../../hotelDb";
import { api, apiBase } from "../../lib/api";

const MENU_GROUPS = [
  { label: 'Intelligence', items: [
    { id: 'overview',  label: 'Overview',         icon: 'dashboard' },
    { id: 'analytics', label: 'Analytics',        icon: 'insights' },
  ]},
  { label: 'Operations', items: [
    { id: 'bookings',  label: 'Bookings',         icon: 'receipt_dot',     isNew: true },
    { id: 'calendar',  label: 'Calendar',         icon: 'calendar_month',  isNew: true },
    { id: 'rooms',     label: 'Rooms & Inventory',icon: 'hotel' },
    { id: 'pricing',   label: 'Pricing',          icon: 'attach_money' },
    { id: 'addons',    label: 'Add-ons & Extras', icon: 'sparkle_chat',    isNew: true },
    { id: 'offers',    label: 'Offers & Promos',  icon: 'redeem',          isNew: true },
  ]},
  { label: 'Guests', items: [
    { id: 'messages',    label: 'Messages',        icon: 'sparkle_chat',          isNew: true },
    { id: 'reviews',     label: 'Reviews',         icon: 'star' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
  ]},
  { label: 'Admin', items: [
    { id: 'profile',  label: 'Hotel Profile',     icon: 'concierge_bell' },
    { id: 'branding', label: 'Branding & Policies',icon: 'settings' },
    { id: 'support',  label: 'Support',           icon: 'support' },
  ]},
];

export default function HotelPortal() {
  const s = useSession();
  const auth = getAuth();
  const settings = useSettings();
  const ownerId = s?.user?.id || "";

  const [activeTab, setActiveTab] = useState('overview');
  const [hotel, setHotel] = useState<DemoHotel | null>(null);
  const [allHotels, setAllHotels] = useState<DemoHotel[]>([]);
  const [tick, setTick] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const collapsed = settings.layout === 'collapsed';
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!ownerId) return;
    let pendingName: string | undefined;
    try {
      const pending = JSON.parse(localStorage.getItem('liora_pending_hotel_names') || '{}');
      pendingName = pending[ownerId];
    } catch {}
    const fallback = pendingName || (s?.user?.name ? `${s.user.name.split(' ')[0]}'s Hotel` : "Your Hotel");
    // Only seed a real hotel record on first sign-up (when we have a stashed
    // pending name). Do NOT auto-create a hotel on every login — owners should
    // see exactly the hotels they have actually created.
    if (pendingName) db_seedHotelIfEmpty(ownerId, fallback);
    const list = db_getHotelsByOwner(ownerId);
    setAllHotels(list);
    setHotel(prev => (prev && list.find(x => x.id === prev.id)) || list[0] || null);
  }, [ownerId, tick]);

  // Refresh once Neon hydration finishes, so an owner who signs in on a fresh
  // device immediately sees the hotels they created elsewhere.
  useEffect(() => {
    const onHydrated = () => setTick(t => t + 1);
    window.addEventListener('liora:hydrated', onHydrated);
    return () => window.removeEventListener('liora:hydrated', onHydrated);
  }, []);

  const handleLogout = () => setShowSignOut(true);
  const confirmSignOut = async () => {
    setSigningOut(true);
    try { await auth.signOut(); } finally { setSigningOut(false); setShowSignOut(false); }
  };

  if (!s || s.user.role !== "hotel_owner") {
    return <div className="p-6 text-stone-700">Please login as a hotel owner.</div>;
  }
  if (!hotel) return (
    <EmptyHotelState
      ownerName={s.user.name?.split(' ')[0]}
      onLogout={handleLogout}
      onCreate={(name) => {
        const created = db_createHotel(ownerId!, name);
        setAllHotels([created]);
        setHotel(created);
        setActiveTab('profile');
      }}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':      return <OverviewPage hotel={hotel} {...({key:tick} as any)} />;
      case 'analytics':     return <AnalyticsPage hotel={hotel} {...({key:tick} as any)} />;
      case 'bookings':      return <BookingsPage hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case 'rooms':         return <RoomsPage hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case 'pricing':       return <PricingPage hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case 'addons':        return <AddOnsPage hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case 'offers':        return <OffersPage hotel={hotel} {...({key:tick} as any)} />;
      case 'calendar':      return <CalendarPage hotel={hotel} {...({key:tick} as any)} />;
      case 'messages':      return <MessagesPage hotel={hotel} {...({key:tick} as any)} />;
      case 'reviews':       return <ReviewsPage hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case 'notifications': return <NotificationsPage hotel={hotel} {...({key:tick} as any)} />;
      case 'profile':       return <ProfilePage hotel={hotel} onChange={(h) => { setHotel(h); refresh(); }} {...({key:tick} as any)} />;
      case 'branding':      return <BrandingPage hotel={hotel} onChange={(h) => { setHotel(h); refresh(); }} {...({key:tick} as any)} />;
      case 'support':       return <SupportPage hotel={hotel} {...({key:tick} as any)} />;
      default:              return <ComingSoon label={activeTab} />;
    }
  };

  const activeMeta = MENU_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab);
  const venueLabel = settings.brand.displayName || hotel.name;

  return (
    <div className="flex h-dscreen bg-app text-stone-800 overflow-hidden relative px-safe pt-safe">
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-cream-50/60 via-app to-sky-50/40" />
      <div className="pointer-events-none absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-3xl -z-0" />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ============= FLOATING SIDEBAR — DARK LUXE (Sapphire) ============= */}
      <aside
        style={{ background: 'linear-gradient(180deg, #0c1320 0%, #11192a 35%, #16203a 70%, #0c1424 100%)' }}
        className={`fixed md:relative top-0 md:top-4 left-0 md:left-4 md:bottom-4 md:h-[calc(100vh-2rem)] h-full ${collapsed ? 'w-[80px]' : 'w-[272px]'} md:rounded-3xl md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(125,170,230,0.08)_inset] md:ring-1 md:ring-sky-300/[0.08] flex flex-col z-40 transform transition-all duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/10 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-sky-300/25 to-transparent" />

        {/* Brand */}
        <div className={`relative px-5 py-5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b border-sky-200/10`}>
          <button onClick={() => setActiveTab('overview')} className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0">
            <div className="relative flex-shrink-0">
              {hotel.heroImageUrl ? (
                <img src={hotel.heroImageUrl} alt={hotel.name} className="w-10 h-10 rounded-2xl object-cover ring-1 ring-sky-300/30 shadow-md" />
              ) : (
                <LogoMark className="w-10 h-10" />
              )}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-stone-900" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-display text-xl text-cream-50 tracking-tight font-semibold truncate">{hotel.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] mt-1 truncate" style={{ color: '#84b3e7' }}>For Hotels</span>
              </div>
            )}
          </button>
          <button className="md:hidden p-1.5 text-cream-200 hover:bg-sky-200/10 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: '#73a1d3' }}>{group.label}</h3>
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
                          ? 'bg-gradient-to-r from-sky-400/20 via-sky-500/12 to-transparent text-cream-50 shadow-[inset_0_0_0_1px_rgba(125,170,230,0.25)]'
                          : 'text-cream-100/85 hover:bg-sky-200/[0.06] hover:text-cream-50'}`}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-sky-300 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(100,170,245,0.6)]" />}
                      <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                        <Icon name={item.icon} size={18} className={active ? '' : 'group-hover:text-cream-50 transition-colors'} style={active ? { color: '#7cc7ff' } : { color: 'rgb(231 229 228 / 0.75)' }} />
                        {!collapsed && <span className="text-[13px]">{item.label}</span>}
                      </div>
                      {!collapsed && (item as any).isNew && (
                        <span className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative p-3 border-t border-sky-200/10 space-y-1.5">
          <button
            onClick={() => setShowSettings(true)}
            title={t(settings.locale, 'common.settings')}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl text-cream-100/85 hover:bg-sky-200/[0.06] hover:text-cream-50 transition-colors`}
          >
            <Icon name="settings" size={18} />
            {!collapsed && <span className="text-[13px] font-semibold">{t(settings.locale, 'common.settings')}</span>}
          </button>

          {!collapsed ? (
            <div className="rounded-2xl p-3 flex items-center gap-3 border border-sky-200/15 shadow-inner" style={{ background: 'rgba(0,0,0,0.25)' }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-300 via-sky-400 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_18px_rgba(100,170,245,0.4)] shrink-0">
                {venueLabel.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-cream-50 truncate">{venueLabel}</p>
                <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest hover:text-sky-200 transition-colors" style={{ color: '#84b3e7' }}>
                  {t(settings.locale, 'common.signOut')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogout} title={t(settings.locale, 'common.signOut')} className="w-full flex justify-center py-2 rounded-2xl hover:bg-sky-200/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-300 via-sky-400 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
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
          <div className="flex gap-2 items-center">
            {allHotels.length > 1 && (
              <select
                value={hotel.id}
                onChange={e => { const h = allHotels.find(x => x.id === e.target.value); if (h) { setHotel(h); refresh(); } }}
                className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 max-w-[200px]"
                title="Switch property"
              >
                {allHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            )}
            <button onClick={() => setActiveTab('notifications')} className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors relative" title="Notifications">
              <Icon name="notifications" size={20} />
              <UnreadDot hotelId={hotel.id} />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors" title="Settings">
              <Icon name="settings" size={20} />
            </button>
            <button onClick={() => setActiveTab('support')} className="p-2.5 text-stone-600 hover:bg-cream-100 rounded-xl transition-colors" title="Help">
              <Icon name="help" size={20} />
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8 flex-1 animate-page-slide max-w-[1400px] mx-auto w-full">
          {renderContent()}
        </div>
      </main>

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

      {showSignOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in" onClick={() => !signingOut && setShowSignOut(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-cream-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-7 py-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/10" />
              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow mb-4">
                  <Icon name="logout" size={28} className="text-white" />
                </div>
                <h3 className="font-display text-2xl text-white font-semibold tracking-tight">Sign out of {hotel.name}?</h3>
                <p className="text-cream-100 text-sm mt-2 font-light">You'll need to sign in again to access your hotel dashboard, bookings and analytics.</p>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSignOut(false)} disabled={signingOut} className="flex-1 py-3.5 rounded-2xl border border-cream-200 text-stone-700 text-sm font-bold hover:bg-cream-50 transition-colors disabled:opacity-50">
                  Stay signed in
                </button>
                <button type="button" onClick={confirmSignOut} disabled={signingOut} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-bold shadow-glow hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {signingOut ? <><Icon name="refresh" size={14} className="animate-spin" /> Signing out…</> : <>Sign out <Icon name="arrow_forward" size={14} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// PAGE: OVERVIEW
// ====================================================================
function OverviewPage({ hotel }: { hotel: DemoHotel }) {
  const rooms = db_listRooms(hotel.id);
  const bookings = db_listBookings(hotel.id);
  const reviews = db_listReviews(hotel.id);

  const upcomingArrivals = bookings.filter(b => b.status !== 'cancelled' && new Date(b.checkIn).getTime() >= Date.now() - 86400000).slice(0, 5);
  const totalRevenue = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').reduce((s, b) => s + b.totalCents, 0);
  const occupancy = (() => {
    const totalUnits = rooms.reduce((s, r) => s + r.totalUnits, 0) || 1;
    const today = new Date().toISOString().slice(0, 10);
    const activeToday = bookings.filter(b => b.status === 'confirmed' && b.checkIn <= today && b.checkOut > today).length;
    return Math.round((activeToday / totalUnits) * 100);
  })();
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  const stats = [
    { label: 'Upcoming Bookings', value: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length, icon: 'receipt_dot', tint: 'from-emerald-400 to-teal-600' },
    { label: 'Occupancy Today',   value: `${occupancy}%`,            icon: 'hotel',         tint: 'from-sky-400 to-indigo-600' },
    { label: 'Total Revenue',     value: formatMoney(totalRevenue),  icon: 'attach_money',  tint: 'from-amber-400 to-orange-600' },
    { label: 'Avg Rating',        value: `${avgRating} ★`,           icon: 'star',          tint: 'from-fuchsia-400 to-violet-600' },
  ];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl shadow-lift">
        <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${hotel.heroImageUrl}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/15" />
        <div className="relative p-8 md:p-12 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300 mb-3">Welcome back</p>
          <h1 className="font-display text-3xl md:text-5xl font-light leading-tight tracking-tight">{hotel.name}</h1>
          <p className="text-white/85 text-sm md:text-base mt-3 max-w-xl font-light">
            {hotel.description || `${'★'.repeat(hotel.starRating || 4)} property · ${hotel.city || 'A signature destination'}`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5 lift-on-hover">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.tint} ring-1 ring-white/30 shadow-lg flex items-center justify-center mb-4 relative`}>
              <span className="absolute inset-x-1 top-1 h-2.5 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
              <Icon name={s.icon} size={22} className="text-white drop-shadow-sm relative" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700">{s.label}</p>
            <p className="font-display text-3xl text-stone-900 mt-1 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming arrivals */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl text-stone-900 tracking-tight">Upcoming arrivals</h3>
          <span className="tag-soft">{upcomingArrivals.length} guest{upcomingArrivals.length === 1 ? '' : 's'}</span>
        </div>
        {upcomingArrivals.length === 0 ? (
          <EmptyState icon="receipt_dot" title="No upcoming arrivals" desc="New bookings will appear here." />
        ) : (
          <div className="space-y-3">
            {upcomingArrivals.map(b => {
              const room = rooms.find(r => r.id === b.roomId);
              return (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-2xl bg-cream-50 border border-stone-100 hover:border-sky-300 transition-colors">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {b.guestName.split(' ').map(s => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 text-sm truncate">{b.guestName}</p>
                    <p className="text-xs text-stone-700 font-medium truncate">{room?.name || 'Room'} · {b.adults} adult{b.adults > 1 ? 's' : ''}{b.children ? `, ${b.children} child` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-900">{new Date(b.checkIn).toLocaleDateString()}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-stone-600">{b.nightsCount}n · {formatMoney(b.totalCents)}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// PAGE: MESSAGES (A3)
// ====================================================================
type HotelThread = { hotelId: string; guestEmail: string; guestName?: string; bookingId?: string; lastAt: number; unread: number; lastBody?: string };
type HotelMessage = { id: string; hotelId: string; bookingId?: string; guestEmail: string; guestName?: string; sender: 'guest'|'hotel'; body: string; readByHotel: boolean; readByGuest: boolean; createdAt: number };

function MessagesPage({ hotel }: { hotel: DemoHotel }) {
  const [threads, setThreads] = useState<HotelThread[]>([]);
  const [active, setActive] = useState<HotelThread | null>(null);
  const [msgs, setMsgs] = useState<HotelMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    try { const t = await api.get(`/api/hotel-messages/threads?hotelId=${encodeURIComponent(hotel.id)}`); setThreads(t || []); } catch {}
  };
  const loadMessages = async (t: HotelThread) => {
    try {
      const m = await api.get(`/api/hotel-messages?hotelId=${encodeURIComponent(hotel.id)}&guestEmail=${encodeURIComponent(t.guestEmail)}`);
      setMsgs(m || []);
      await api.patch('/api/hotel-messages/mark-read', { hotelId: hotel.id, guestEmail: t.guestEmail, side: 'hotel' });
      loadThreads();
    } catch {}
  };

  useEffect(() => { loadThreads(); }, [hotel.id]);

  useEffect(() => {
    let alive = true;
    const es = new EventSource(`${apiBase}/api/hotel-messages/stream?hotelId=${encodeURIComponent(hotel.id)}`);
    es.onmessage = (evt) => {
      if (!alive) return;
      try {
        const m: HotelMessage = JSON.parse(evt.data);
        if (active && m.guestEmail.toLowerCase() === active.guestEmail.toLowerCase()) {
          setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
        }
        loadThreads();
      } catch {}
    };
    return () => { alive = false; es.close(); };
  }, [hotel.id, active?.guestEmail]);

  useEffect(() => { if (active) loadMessages(active); }, [active?.guestEmail]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs.length]);

  const send = async () => {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    try {
      const m = await api.post('/api/hotel-messages', {
        hotelId: hotel.id, bookingId: active.bookingId, guestEmail: active.guestEmail,
        guestName: active.guestName, sender: 'hotel', body: draft.trim(),
      });
      if (m && m.id) setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
      setDraft('');
    } catch (e: any) { toast.error('Could not send: ' + (e?.message || 'unknown')); }
    finally { setSending(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
      {/* Threads list */}
      <div className="card p-3 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <h3 className="font-display text-lg text-stone-900">Conversations</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{threads.length}</span>
        </div>
        {threads.length === 0 && <EmptyState icon="sparkle_chat" title="No messages yet" desc="Guest messages from the booking flow appear here." />}
        <div className="space-y-1">
          {threads.map(t => (
            <button key={t.guestEmail} onClick={() => setActive(t)}
              className={`w-full text-left p-3 rounded-2xl transition-all ${active?.guestEmail === t.guestEmail ? 'bg-sky-100 ring-1 ring-sky-300' : 'hover:bg-cream-100'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-stone-900 text-sm truncate">{t.guestName || t.guestEmail}</p>
                {t.unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{t.unread}</span>}
              </div>
              <p className="text-[11px] text-stone-600 truncate mt-0.5">{t.lastBody || '—'}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">{new Date(t.lastAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active thread */}
      <div className="card flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 flex items-center justify-center"><EmptyState icon="sparkle_chat" title="Pick a conversation" desc="Select a guest on the left to view messages." /></div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-stone-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-white flex items-center justify-center font-bold">{(active.guestName || active.guestEmail).slice(0,2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-900 truncate">{active.guestName || active.guestEmail}</p>
                <p className="text-[11px] text-stone-600 truncate">{active.guestEmail}{active.bookingId ? ` · Booking #${active.bookingId.slice(0,8)}` : ''}</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-cream-50">
              {msgs.map(m => (
                <div key={m.id} className={`flex ${m.sender === 'hotel' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender === 'hotel' ? 'bg-sky-500 text-white' : 'bg-white border border-stone-200 text-stone-900'}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.sender === 'hotel' ? 'text-sky-100' : 'text-stone-500'}`}>{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-stone-200 flex gap-2">
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Reply to guest…" className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <button onClick={send} disabled={!draft.trim() || sending} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 disabled:opacity-40">{sending ? '…' : 'Send'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// PAGE: ANALYTICS
// ====================================================================
function AnalyticsPage({ hotel }: { hotel: DemoHotel }) {
  const bookings = db_listBookings(hotel.id);
  const rooms = db_listRooms(hotel.id);

  // Monthly revenue for last 6 months
  const monthly = useMemo(() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toLocaleDateString(undefined, { month: 'short' });
      buckets[k] = 0;
    }
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const d = new Date(b.createdAt);
      const k = d.toLocaleDateString(undefined, { month: 'short' });
      if (k in buckets) buckets[k] += b.totalCents;
    });
    return Object.entries(buckets);
  }, [bookings]);

  const max = Math.max(1, ...monthly.map(m => m[1]));
  const totalRev = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalCents, 0);
  const avgNightly = bookings.length ? Math.round(totalRev / Math.max(1, bookings.reduce((s, b) => s + b.nightsCount, 0))) : 0;

  const roomBreakdown = rooms.map(r => {
    const ct = bookings.filter(b => b.roomId === r.id && b.status !== 'cancelled').length;
    return { name: r.name, count: ct, revenue: bookings.filter(b => b.roomId === r.id && b.status !== 'cancelled').reduce((s, b) => s + b.totalCents, 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <AIInsightsPanel hotel={hotel} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Revenue" value={formatMoney(totalRev)} icon="attach_money" tint="from-amber-400 to-orange-600" />
        <KpiCard label="Avg Nightly Rate" value={formatMoney(avgNightly)} icon="insights" tint="from-emerald-400 to-teal-600" />
        <KpiCard label="Bookings" value={bookings.length} icon="receipt_dot" tint="from-sky-400 to-indigo-600" />
      </div>

      <div className="card p-6">
        <h3 className="font-display text-2xl text-stone-900 tracking-tight mb-5">Revenue · last 6 months</h3>
        <div className="flex items-end gap-3 h-52">
          {monthly.map(([m, v]) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-stone-100 rounded-2xl overflow-hidden flex items-end" style={{ height: '180px' }}>
                <div className="w-full bg-gradient-to-t from-sky-500 via-sky-400 to-indigo-400 rounded-2xl transition-all" style={{ height: `${(v / max) * 100}%` }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700">{m}</p>
              <p className="text-[10px] font-bold text-stone-900">{v ? formatMoney(v) : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-2xl text-stone-900 tracking-tight mb-5">Top performing rooms</h3>
        {roomBreakdown.length === 0 ? <EmptyState icon="hotel" title="No room data" desc="Add rooms to start tracking performance." /> : (
          <div className="space-y-3">
            {roomBreakdown.map(r => (
              <div key={r.name} className="flex items-center gap-4 p-3 rounded-2xl bg-cream-50">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-sm truncate">{r.name}</p>
                  <p className="text-[11px] font-medium text-stone-700">{r.count} booking{r.count === 1 ? '' : 's'}</p>
                </div>
                <p className="font-display text-xl text-stone-900">{formatMoney(r.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AIInsightsPanel({ hotel }: { hotel: DemoHotel }) {
  const [data, setData] = useState<{ summary: string; source: string; kpis: any; generatedAt: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { const r = await api.get(`/api/ai-insights/weekly/${encodeURIComponent(hotel.id)}`); setData(r); }
    catch (e: any) { setErr(e?.message || 'Could not load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [hotel.id]);

  return (
    <div className="card p-6 bg-gradient-to-br from-indigo-50 via-white to-sky-50 border-sky-200">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Icon name="sparkles" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">AI Weekly Briefing {data?.source === 'gemini' && <span className="ml-2 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Gemini</span>}</p>
            <button onClick={load} disabled={loading} className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 disabled:opacity-40">{loading ? 'Generating…' : 'Refresh'}</button>
          </div>
          {err && <p className="text-[12px] text-rose-700">{err}</p>}
          {!err && (loading && !data ? <p className="text-sm text-stone-600">Analyzing this week's data…</p> :
            data ? <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">{data.summary}</p> :
            <p className="text-sm text-stone-600">No data yet.</p>
          )}
          {data?.kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-indigo-100">
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Rev (week)</p><p className="font-display text-lg text-stone-900">${(data.kpis.revThisWeek/100).toFixed(0)}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">vs Last</p><p className={`font-display text-lg ${data.kpis.revPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{data.kpis.revPct == null ? '—' : `${data.kpis.revPct > 0 ? '+' : ''}${data.kpis.revPct}%`}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Bookings</p><p className="font-display text-lg text-stone-900">{data.kpis.bookings}</p></div>
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Avg Rating</p><p className="font-display text-lg text-stone-900">{data.kpis.avgRating || '—'}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// PAGE: BOOKINGS
// ====================================================================
function BookingsPage({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const rooms = db_listRooms(hotel.id);
  const bookings = db_listBookings(hotel.id);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const filters: Array<'all' | BookingStatus> = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                filter === f ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
              }`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} disabled={rooms.length === 0}
          className="btn-primary !px-5 !py-2.5 !text-[13px] disabled:opacity-50">
          <Icon name="add" size={14} /> New booking
        </button>
      </div>

      {filtered.length === 0 ? <EmptyState icon="receipt_dot" title="No bookings" desc="New bookings will appear here." /> : (
        <div className="space-y-3">
          {filtered.map(b => {
            const room = rooms.find(r => r.id === b.roomId);
            return (
              <div key={b.id} className="card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {b.guestName.split(' ').map(s => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{b.guestName}</p>
                    <p className="text-[12px] text-stone-700 font-medium truncate">{b.guestEmail || '—'}</p>
                    <p className="text-[11px] text-stone-600 mt-1">{room?.name || 'Room'} · {b.adults}A{b.children ? `, ${b.children}C` : ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:flex md:items-center gap-4 md:gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Check-in</p>
                    <p className="text-sm font-bold text-stone-900">{new Date(b.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Check-out</p>
                    <p className="text-sm font-bold text-stone-900">{new Date(b.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{b.nightsCount}n total</p>
                    <p className="text-sm font-bold text-stone-900">{formatMoney(b.totalCents)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  <select value={b.status} onChange={e => { db_updateBookingStatus(b.id, e.target.value as BookingStatus); onChange(); }}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-[11px] font-bold bg-white text-stone-900">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={() => { if (confirm('Delete this booking?')) { db_deleteBooking(b.id); onChange(); } }}
                    className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <NewBookingModal hotel={hotel} rooms={rooms} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); onChange(); }} />}
    </div>
  );
}

function NewBookingModal({ hotel, rooms, onClose, onSaved }: { hotel: DemoHotel; rooms: DemoHotelRoom[]; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const room = rooms.find(r => r.id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const total = (room?.pricePerNightCents || 0) * nights;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    db_addBooking({
      hotelId: hotel.id, roomId: room.id, guestName, guestEmail,
      checkIn, checkOut, adults, children, nightsCount: nights, totalCents: total,
      status: 'confirmed', paymentStatus: 'pending',
    });
    onSaved();
  };

  return (
    <Modal title="New booking" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Guest name"><input className={inp} value={guestName} onChange={e => setGuestName(e.target.value)} required /></Field>
        <Field label="Email"><input className={inp} type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} /></Field>
        <Field label="Room"><select className={inp} value={roomId} onChange={e => setRoomId(e.target.value)} required>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name} — {formatMoney(r.pricePerNightCents)}/night</option>)}
        </select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in"><input className={inp} type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required /></Field>
          <Field label="Check-out"><input className={inp} type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adults"><input className={inp} type="number" min={1} value={adults} onChange={e => setAdults(+e.target.value)} /></Field>
          <Field label="Children"><input className={inp} type="number" min={0} value={children} onChange={e => setChildren(+e.target.value)} /></Field>
        </div>
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
          <p className="text-xs font-bold text-sky-900">{nights} night{nights > 1 ? 's' : ''} · Total <span className="font-display text-xl">{formatMoney(total)}</span></p>
        </div>
        <button type="submit" className="btn-primary w-full !py-3.5">Create booking</button>
      </form>
    </Modal>
  );
}

// ====================================================================
// PAGE: ROOMS
// ====================================================================
function RoomsPage({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const rooms = db_listRooms(hotel.id);
  const [editing, setEditing] = useState<DemoHotelRoom | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-widest text-stone-700">{rooms.length} room type{rooms.length === 1 ? '' : 's'}</p>
        <button onClick={() => setShowAdd(true)} className="btn-primary !px-5 !py-2.5 !text-[13px]"><Icon name="add" size={14} /> Add room</button>
      </div>

      {rooms.length === 0 ? <EmptyState icon="hotel" title="No rooms yet" desc="Add your first room type to start taking bookings." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map(r => (
            <div key={r.id} className="card overflow-hidden lift-on-hover">
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url('${r.imageUrls?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}')` }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">{r.type}</p>
                    <h3 className="font-display text-xl text-stone-900 tracking-tight">{r.name}</h3>
                  </div>
                  {!r.active && <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[9px] font-bold uppercase tracking-widest">Inactive</span>}
                </div>
                <p className="text-[12px] text-stone-700 line-clamp-2 mb-3">{r.description}</p>
                <div className="flex items-center gap-3 text-[11px] font-bold text-stone-600 mb-4">
                  <span className="flex items-center gap-1"><Icon name="user" size={12} /> {r.capacityAdults}A{r.capacityChildren ? `+${r.capacityChildren}C` : ''}</span>
                  <span className="flex items-center gap-1"><Icon name="hotel" size={12} /> {r.totalUnits} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-display text-2xl text-stone-900">{formatMoney(r.pricePerNightCents)}<span className="text-xs font-medium text-stone-600">/night</span></p>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(r)} className="p-2 rounded-xl text-stone-700 hover:bg-cream-100"><Icon name="edit" size={16} /></button>
                    <button onClick={() => { if (confirm('Delete this room?')) { db_deleteRoom(r.id); onChange(); } }} className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50"><Icon name="delete" size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || showAdd) && (
        <RoomEditor
          hotel={hotel}
          room={editing}
          onClose={() => { setEditing(null); setShowAdd(false); }}
          onSaved={() => { setEditing(null); setShowAdd(false); onChange(); }}
        />
      )}
    </div>
  );
}

function RoomEditor({ hotel, room, onClose, onSaved }: { hotel: DemoHotel; room: DemoHotelRoom | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(room?.name || '');
  const [type, setType] = useState<RoomType>(room?.type || 'double');
  const [description, setDescription] = useState(room?.description || '');
  const [price, setPrice] = useState(((room?.pricePerNightCents || 0) / 100).toString());
  const [adults, setAdults] = useState(room?.capacityAdults || 2);
  const [children, setChildren] = useState(room?.capacityChildren || 0);
  const [units, setUnits] = useState(room?.totalUnits || 1);
  const [imagesText, setImagesText] = useState((room?.imageUrls || []).join('\n'));
  const [amenitiesText, setAmenitiesText] = useState((room?.amenities || []).join(', '));
  const [active, setActive] = useState(room?.active ?? true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrls = imagesText.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
    const amenities = amenitiesText.split(',').map(s => s.trim()).filter(Boolean).slice(0, 16);
    db_upsertRoom({
      id: room?.id || newRoomId(),
      hotelId: hotel.id,
      name, type, description,
      pricePerNightCents: Math.round(parseFloat(price) * 100),
      capacityAdults: adults, capacityChildren: children, totalUnits: units,
      imageUrls,
      amenities,
      active,
    });
    onSaved();
  };

  return (
    <Modal title={room ? 'Edit room' : 'Add room'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Room name"><input className={inp} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Type"><select className={inp} value={type} onChange={e => setType(e.target.value as RoomType)}>
          {(['single','double','twin','deluxe','suite','penthouse','family'] as RoomType[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select></Field>
        <Field label="Description"><textarea className={inp} rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Price/night ($)"><input className={inp} type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></Field>
          <Field label="Adults"><input className={inp} type="number" min={1} value={adults} onChange={e => setAdults(+e.target.value)} /></Field>
          <Field label="Children"><input className={inp} type="number" min={0} value={children} onChange={e => setChildren(+e.target.value)} /></Field>
        </div>
        <Field label="Total units (inventory)"><input className={inp} type="number" min={1} value={units} onChange={e => setUnits(+e.target.value)} /></Field>
        <Field label="Photos (one URL per line — first one is the cover)">
          <textarea className={inp} rows={3} value={imagesText} onChange={e => setImagesText(e.target.value)} placeholder={'https://…\nhttps://…'} />
        </Field>
        {imagesText.trim() && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imagesText.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8).map((u, i) => (
              <img key={i} src={u} alt="" className="h-14 w-20 object-cover rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0" onError={(e) => { (e.currentTarget.style.opacity = '0.2'); }} />
            ))}
          </div>
        )}
        <Field label="Room amenities (comma-separated)">
          <input className={inp} value={amenitiesText} onChange={e => setAmenitiesText(e.target.value)} placeholder="King bed, Sea view, Espresso machine, Balcony" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4" /> Active &amp; bookable
        </label>
        <button type="submit" className="btn-primary w-full !py-3.5">{room ? 'Save changes' : 'Create room'}</button>
      </form>
    </Modal>
  );
}

// ====================================================================
// PAGE: PRICING
// ====================================================================
type PricingDay = { date: string; dow: string; basePriceCents: number; suggestedPriceCents: number; occupancyHistory: number; occupancyToday: number; totalUnits: number; soldOut: boolean; deltaPct: number };
type PricingSuggestion = { roomId: string; roomName: string; type: string; currentPriceCents: number; avgSuggestedCents: number; avgDeltaPct: number; days: PricingDay[] };

function PricingPage({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const rooms = db_listRooms(hotel.id);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try { const r = await api.get(`/api/dynamic-pricing/suggestions/${encodeURIComponent(hotel.id)}`); setSuggestions(r?.suggestions || []); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadSuggestions(); }, [hotel.id]);

  const applyAll = async () => {
    if (!suggestions.length) return;
    if (!confirm(`Apply suggested prices to ${suggestions.length} room${suggestions.length > 1 ? 's' : ''}? This updates the base nightly rate for each room.`)) return;
    setApplying(true);
    try {
      await api.post('/api/dynamic-pricing/apply', {
        updates: suggestions.map(s => ({ roomId: s.roomId, priceCents: s.avgSuggestedCents })),
      });
      onChange(); await loadSuggestions();
    } catch (e: any) { toast.error('Could not apply: ' + (e?.message || 'unknown')); }
    finally { setApplying(false); }
  };

  const save = (id: string) => {
    const r = rooms.find(x => x.id === id);
    if (!r) return;
    const v = parseFloat(edits[id]);
    if (isNaN(v)) return;
    db_upsertRoom({ ...r, pricePerNightCents: Math.round(v * 100) });
    onChange();
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0"><Icon name="sparkles" size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Demand-based Pricing · next 14 days</p>
              <div className="flex gap-2">
                <button onClick={loadSuggestions} disabled={loading} className="text-[11px] font-bold text-amber-700 hover:text-amber-900 disabled:opacity-40">{loading ? 'Loading…' : 'Refresh'}</button>
                {suggestions.length > 0 && <button onClick={applyAll} disabled={applying} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-amber-600 disabled:opacity-40">{applying ? 'Applying…' : 'Apply all'}</button>}
              </div>
            </div>
            {suggestions.length === 0 && !loading && <p className="text-sm text-stone-700">Add rooms and bookings to receive demand-based price suggestions.</p>}
            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.roomId} className="bg-white border border-amber-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{s.roomName}</p>
                      <p className="text-[10px] text-stone-600">Current ${(s.currentPriceCents/100).toFixed(0)} → Suggested avg <strong>${(s.avgSuggestedCents/100).toFixed(0)}</strong> <span className={s.avgDeltaPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>({s.avgDeltaPct > 0 ? '+' : ''}{s.avgDeltaPct}%)</span></p>
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {s.days.map(d => (
                      <div key={d.date} title={`${d.date} · ${d.occupancyHistory}% historic occupancy${d.soldOut ? ' · SOLD OUT' : ''}`}
                        className={`flex-shrink-0 w-12 text-center px-1 py-1.5 rounded-lg border text-[10px] ${d.soldOut ? 'bg-rose-50 border-rose-200 text-rose-900' : d.deltaPct > 5 ? 'bg-emerald-50 border-emerald-200' : d.deltaPct < -5 ? 'bg-sky-50 border-sky-200' : 'bg-cream-50 border-stone-100'}`}>
                        <p className="font-bold text-stone-700">{d.dow.slice(0,1)}</p>
                        <p className="font-bold text-stone-900">${(d.suggestedPriceCents/100).toFixed(0)}</p>
                        <p className={`text-[9px] font-bold ${d.deltaPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{d.deltaPct > 0 ? '+' : ''}{d.deltaPct}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-2xl text-stone-900 tracking-tight mb-5">Base nightly rates</h3>
        {rooms.length === 0 ? <EmptyState icon="hotel" title="No rooms" desc="Add rooms first to set pricing." /> : (
          <div className="space-y-3">
            {rooms.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-cream-50 border border-stone-100">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 truncate">{r.name}</p>
                  <p className="text-[11px] uppercase tracking-widest font-bold text-stone-600">{r.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-700 font-bold">$</span>
                  <input
                    className="w-28 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold text-right"
                    type="number" step="0.01"
                    value={edits[r.id] ?? (r.pricePerNightCents / 100).toString()}
                    onChange={e => setEdits({ ...edits, [r.id]: e.target.value })}
                  />
                  <button onClick={() => save(r.id)} className="px-4 py-2 rounded-xl bg-stone-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-stone-800">Save</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ====================================================================
// PAGE: ADD-ONS
// ====================================================================
function AddOnsPage({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const addons = db_listAddOns(hotel.id);
  const [editing, setEditing] = useState<DemoHotelAddOn | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-widest text-stone-700">{addons.length} add-on{addons.length === 1 ? '' : 's'}</p>
        <button onClick={() => setShowAdd(true)} className="btn-primary !px-5 !py-2.5 !text-[13px]"><Icon name="add" size={14} /> Add extra</button>
      </div>

      {addons.length === 0 ? <EmptyState icon="sparkle_chat" title="No add-ons" desc="Offer breakfast, spa, transfers and more during checkout." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map(a => (
            <div key={a.id} className="card p-5 lift-on-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg ring-1 ring-white/30">
                  <Icon name="sparkle_chat" size={20} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(a)} className="p-2 rounded-xl text-stone-700 hover:bg-cream-100"><Icon name="edit" size={14} /></button>
                  <button onClick={() => { if (confirm('Delete add-on?')) { db_deleteAddOn(a.id); onChange(); } }} className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50"><Icon name="delete" size={14} /></button>
                </div>
              </div>
              <h3 className="font-display text-xl text-stone-900 tracking-tight">{a.name}</h3>
              <p className="text-[12px] text-stone-700 line-clamp-2 mt-1 mb-3">{a.description}</p>
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl text-stone-900">{formatMoney(a.priceCents)}<span className="text-[11px] font-medium text-stone-600">{a.perPerson ? '/person' : ''}</span></p>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${a.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{a.active ? 'Active' : 'Off'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || showAdd) && (
        <AddOnEditor
          hotel={hotel}
          addon={editing}
          onClose={() => { setEditing(null); setShowAdd(false); }}
          onSaved={() => { setEditing(null); setShowAdd(false); onChange(); }}
        />
      )}
    </div>
  );
}

function AddOnEditor({ hotel, addon, onClose, onSaved }: { hotel: DemoHotel; addon: DemoHotelAddOn | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(addon?.name || '');
  const [description, setDescription] = useState(addon?.description || '');
  const [price, setPrice] = useState(((addon?.priceCents || 0) / 100).toString());
  const [perPerson, setPerPerson] = useState(addon?.perPerson || false);
  const [active, setActive] = useState(addon?.active ?? true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    db_upsertAddOn({
      id: addon?.id || newAddOnId(),
      hotelId: hotel.id,
      name, description,
      priceCents: Math.round(parseFloat(price) * 100),
      perPerson, active,
    });
    onSaved();
  };

  return (
    <Modal title={addon ? 'Edit add-on' : 'Add extra'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name"><input className={inp} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Description"><textarea className={inp} rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <Field label="Price ($)"><input className={inp} type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <input type="checkbox" checked={perPerson} onChange={e => setPerPerson(e.target.checked)} className="w-4 h-4" /> Per person
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4" /> Active
        </label>
        <button type="submit" className="btn-primary w-full !py-3.5">{addon ? 'Save changes' : 'Add extra'}</button>
      </form>
    </Modal>
  );
}

// ====================================================================
// PAGE: REVIEWS
// ====================================================================
function ReviewsPage({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const reviews = db_listReviews(hotel.id);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const dist = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  return (
    <div className="space-y-5">
      <div className="card p-6 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 border-fuchsia-200">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-center md:text-left">
            <p className="font-display text-6xl text-stone-900 tracking-tight">{avg}</p>
            <p className="text-amber-500 text-2xl">{'★'.repeat(Math.round(reviews.length ? +avg : 0))}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-700 mt-1">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            {dist.map(d => (
              <div key={d.star} className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <span className="w-3">{d.star}★</span>
                <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reviews.length === 0 ? <EmptyState icon="star" title="No reviews yet" desc="Verified guest reviews will appear here." /> : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600 text-white flex items-center justify-center font-bold text-sm">{r.guestName[0]}</div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{r.guestName}</p>
                    <p className="text-amber-500 text-sm">{'★'.repeat(r.rating)}<span className="text-stone-300">{'★'.repeat(5 - r.rating)}</span></p>
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-stone-800 leading-relaxed font-medium">{r.comment}</p>
              {r.ownerResponse ? (
                <div className="mt-3 ml-12 p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-1">Hotel response</p>
                  <p className="text-sm text-stone-800 font-medium">{r.ownerResponse}</p>
                </div>
              ) : responding === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea className={inp} rows={2} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Thank the guest, address concerns…" />
                  <div className="flex gap-2">
                    <button onClick={() => { db_respondReview(r.id, responseText); setResponding(null); setResponseText(''); onChange(); }}
                      className="btn-primary !px-5 !py-2 !text-[12px]">Post response</button>
                    <button onClick={() => { setResponding(null); setResponseText(''); }} className="px-5 py-2 rounded-full text-[12px] font-bold text-stone-700 border border-stone-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setResponding(r.id); setResponseText(''); }} className="mt-3 text-[12px] font-bold text-sky-700 hover:text-sky-900 underline-luxe">Respond</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================================================================
// PAGE: NOTIFICATIONS
// ====================================================================
type HotelNotif = { id: string; hotelId: string; kind: string; title: string; body?: string; meta?: any; read: boolean; createdAt: number };

function UnreadDot({ hotelId }: { hotelId: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => api.get(`/api/hotel-notifications?hotelId=${encodeURIComponent(hotelId)}`)
      .then(rows => { if (alive) setCount((rows || []).filter(n => !n.read).length); }).catch(() => {});
    load();
    const es = new EventSource(`${apiBase}/api/hotel-notifications/stream?hotelId=${encodeURIComponent(hotelId)}`);
    es.onmessage = () => load();
    return () => { alive = false; es.close(); };
  }, [hotelId]);
  if (count <= 0) return null;
  return <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">{count > 9 ? '9+' : count}</span>;
}

function NotificationsPage({ hotel }: { hotel: DemoHotel }) {
  const [notifs, setNotifs] = useState<HotelNotif[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const load = useCallbackLoad(hotel.id, setNotifs);

  useEffect(() => {
    let alive = true;
    const safeLoad = () => { if (alive) load(); };
    safeLoad();
    const es = new EventSource(`${apiBase}/api/hotel-notifications/stream?hotelId=${encodeURIComponent(hotel.id)}`);
    es.onopen = () => { if (alive) setStreaming(true); };
    es.onerror = () => { if (alive) setStreaming(false); };
    es.onmessage = (evt) => {
      if (!alive) return;
      try {
        const n = JSON.parse(evt.data);
        setFlashId(n.id);
        setTimeout(() => { if (alive) setFlashId(null); }, 1500);
      } catch {}
      safeLoad();
    };
    return () => { alive = false; es.close(); setStreaming(false); };
  }, [hotel.id, load]);

  const markAll = async () => {
    try { await api.patch(`/api/hotel-notifications/mark-all-read?hotelId=${encodeURIComponent(hotel.id)}`, {}); load(); } catch {}
  };

  const markOne = async (id: string) => {
    try { await api.patch(`/api/hotel-notifications/${id}/read`, {}); load(); } catch {}
  };

  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-[12px] font-bold uppercase tracking-widest text-stone-700">Live activity</p>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${streaming ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
            {streaming ? 'Connected' : 'Offline'}
          </span>
          {unread > 0 && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-rose-100 text-rose-800">{unread} unread</span>}
        </div>
        {unread > 0 && <button onClick={markAll} className="text-[12px] font-bold text-sky-700 hover:text-sky-900 underline-luxe">Mark all read</button>}
      </div>
      {notifs.length === 0 ? <EmptyState icon="notifications_active" title="All clear" desc="Real-time bookings, reviews and alerts appear here." /> : (
        <div className="space-y-2">
          {notifs.map(n => {
            const tint = n.kind === 'booking' ? 'from-sky-400 to-indigo-600' : n.kind === 'review' ? 'from-fuchsia-400 to-violet-600' : 'from-amber-400 to-orange-600';
            const icon = n.kind === 'booking' ? 'receipt_dot' : n.kind === 'review' ? 'star' : 'notifications';
            return (
              <button key={n.id} onClick={() => !n.read && markOne(n.id)}
                className={`w-full text-left card p-4 flex items-center gap-4 transition-all ${!n.read ? 'ring-2 ring-sky-200 bg-sky-50/40' : ''} ${flashId === n.id ? 'animate-pulse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${tint} flex items-center justify-center text-white shrink-0`}><Icon name={icon} size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-sm">{n.title}</p>
                  {n.body && <p className="text-[12px] text-stone-700 font-medium truncate">{n.body}</p>}
                  <p className="text-[10px] text-stone-600 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useCallbackLoad(hotelId: string, setNotifs: (n: HotelNotif[]) => void) {
  return React.useCallback(() => {
    api.get(`/api/hotel-notifications?hotelId=${encodeURIComponent(hotelId)}`)
      .then(rows => setNotifs(rows || [])).catch(() => setNotifs([]));
  }, [hotelId, setNotifs]);
}

// ====================================================================
// PAGE: OFFERS & PROMOS  (B6)
// ====================================================================
type HotelOffer = { id: string; hotelId: string; title: string; description?: string; type: 'percent'|'flat'|'bogo'; value: number; code: string; active: boolean; validUntil?: string; minNights: number; appliesTo: string; createdAt: number };

function OffersPage({ hotel }: { hotel: DemoHotel }) {
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [editing, setEditing] = useState<HotelOffer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    api.get(`/api/hotel-offers?hotelId=${encodeURIComponent(hotel.id)}`)
      .then(o => setOffers(o || [])).catch(() => setOffers([]));
  }, [hotel.id, tick]);

  const refresh = () => setTick(t => t + 1);
  const toggle = async (id: string) => { try { await api.patch(`/api/hotel-offers/${id}/toggle`, {}); refresh(); } catch {} };
  const remove = async (id: string) => { if (!confirm('Delete this offer?')) return; try { await api.del(`/api/hotel-offers/${id}`); refresh(); } catch {} };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-stone-900 tracking-tight">Offers & promo codes</h3>
          <p className="text-[12px] font-medium text-stone-700 mt-1">Drive bookings with discounts, free nights and exclusive perks. Codes redeem at checkout.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary !px-5 !py-2.5"><Icon name="add" size={16} className="mr-1" /> New offer</button>
      </div>

      {offers.length === 0 ? <EmptyState icon="redeem" title="No offers yet" desc="Create your first promo code to start running campaigns." /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {offers.map(o => (
            <div key={o.id} className={`card p-5 ${!o.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl text-stone-900 leading-tight tracking-tight">{o.title}</p>
                  {o.description && <p className="text-[13px] text-stone-700 font-medium mt-1">{o.description}</p>}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${o.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{o.active ? 'Active' : 'Off'}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 bg-cream-50 border border-dashed border-cream-300 rounded-xl px-3 py-2">
                <code className="font-mono font-bold text-stone-900 tracking-widest">{o.code}</code>
                <span className="text-stone-900 font-bold text-sm">
                  {o.type === 'percent' ? `${o.value}% off` : o.type === 'flat' ? `${formatMoney(o.value * 100)} off` : 'BOGO'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-2">
                Min {o.minNights} night{o.minNights !== 1 ? 's' : ''}{o.validUntil ? ` · valid until ${new Date(o.validUntil).toLocaleDateString()}` : ''}
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(o)} className="text-[12px] font-bold text-sky-700 hover:text-sky-900">Edit</button>
                <button onClick={() => toggle(o.id)} className="text-[12px] font-bold text-amber-700 hover:text-amber-900">{o.active ? 'Pause' : 'Activate'}</button>
                <button onClick={() => remove(o.id)} className="text-[12px] font-bold text-rose-700 hover:text-rose-900 ml-auto">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || showAdd) && (
        <OfferEditor hotel={hotel} offer={editing} onClose={() => { setEditing(null); setShowAdd(false); }} onSaved={() => { setEditing(null); setShowAdd(false); refresh(); }} />
      )}
    </div>
  );
}

function OfferEditor({ hotel, offer, onClose, onSaved }: { hotel: DemoHotel; offer: HotelOffer | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(offer?.title || '');
  const [description, setDescription] = useState(offer?.description || '');
  const [type, setType] = useState<'percent'|'flat'|'bogo'>(offer?.type || 'percent');
  const [value, setValue] = useState(String(offer?.value ?? 10));
  const [code, setCode] = useState(offer?.code || '');
  const [minNights, setMinNights] = useState(String(offer?.minNights ?? 1));
  const [validUntil, setValidUntil] = useState(offer?.validUntil || '');
  const [active, setActive] = useState(offer?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.post('/api/hotel-offers', {
        id: offer?.id, hotelId: hotel.id, title, description, type,
        value: Number(value) || 0, code: code || undefined,
        active, validUntil: validUntil || null, minNights: Number(minNights) || 1, appliesTo: 'all',
      });
      onSaved();
    } catch (e: any) { setErr(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={offer ? 'Edit offer' : 'New offer'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title"><input className={inp} value={title} onChange={e => setTitle(e.target.value)} required /></Field>
        <Field label="Description"><textarea className={inp} rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className={inp} value={type} onChange={e => setType(e.target.value as any)}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat amount off ($)</option>
              <option value="bogo">Buy one, get one</option>
            </select>
          </Field>
          <Field label={type === 'percent' ? 'Discount %' : type === 'flat' ? 'Amount $' : 'Value'}>
            <input className={inp} type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Promo code"><input className={inp} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Auto" /></Field>
          <Field label="Min nights"><input className={inp} type="number" min={1} value={minNights} onChange={e => setMinNights(e.target.value)} /></Field>
        </div>
        <Field label="Valid until (optional)"><input className={inp} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4" /> Active
        </label>
        {err && <p className="text-rose-700 text-[12px] font-bold">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5 disabled:opacity-50">{busy ? 'Saving…' : (offer ? 'Save changes' : 'Create offer')}</button>
      </form>
    </Modal>
  );
}

// ====================================================================
// PAGE: CALENDAR  (C12)
// ====================================================================
function CalendarPage({ hotel }: { hotel: DemoHotel }) {
  const bookings = db_listBookings(hotel.id);
  const rooms = db_listRooms(hotel.id);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayKey = (d: number) => {
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    return `${cursor.getFullYear()}-${m}-${day}`;
  };

  const bookingsForDay = (d: number) => {
    const key = dayKey(d);
    return bookings.filter(b => key >= b.checkIn && key < b.checkOut);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-stone-900 tracking-tight">Calendar</h3>
          <p className="text-[12px] font-medium text-stone-700 mt-1">Occupancy heat-map across {rooms.length} room{rooms.length !== 1 ? 's' : ''}.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(m => m - 1)} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm font-bold hover:bg-stone-50">‹</button>
          <span className="text-sm font-bold text-stone-900 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(m => m + 1)} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm font-bold hover:bg-stone-50">›</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-7 gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => <div key={`b${i}`} />)}
          {days.map(d => {
            const list = bookingsForDay(d);
            const occRatio = rooms.length ? list.length / rooms.length : 0;
            const tone = occRatio === 0 ? 'bg-cream-50 border-cream-200' : occRatio < 0.5 ? 'bg-emerald-50 border-emerald-200' : occRatio < 0.85 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-300';
            const isToday = dayKey(d) === today.toISOString().slice(0,10);
            return (
              <div key={d} className={`min-h-[80px] rounded-xl border p-1.5 ${tone} ${isToday ? 'ring-2 ring-sky-400' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-900">{d}</span>
                  {list.length > 0 && <span className="text-[9px] font-bold text-stone-700">{list.length}/{rooms.length}</span>}
                </div>
                <div className="mt-1 space-y-0.5">
                  {list.slice(0, 2).map(b => (
                    <div key={b.id} className="text-[9px] font-semibold text-stone-800 bg-white/60 rounded px-1 truncate">{b.guestName}</div>
                  ))}
                  {list.length > 2 && <div className="text-[9px] text-stone-600">+{list.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-bold text-stone-700">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cream-100 border border-cream-200" /> Empty</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Light</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Busy</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" /> Sold out</span>
      </div>
    </div>
  );
}

// ====================================================================
// PAGE: HOTEL PROFILE
// ====================================================================
const ALL_AMENITIES: HotelAmenity[] = ['wifi','parking','pool','spa','gym','restaurant','bar','concierge','laundry','pet_friendly','beach','airport_shuttle'];

function FrontDeskCodeCard({ hotel, onChange }: { hotel: DemoHotel; onChange: (h: DemoHotel) => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!hotel.frontDeskCode) {
      const updated = db_ensureFrontDeskCode(hotel);
      onChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const code = hotel.frontDeskCode || '—';
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  const regen = () => {
    const updated = db_upsertHotel({ ...hotel, frontDeskCode: genFrontDeskCode() });
    onChange(updated);
  };
  return (
    <div className="card p-6 bg-gradient-to-br from-sky-50 via-white to-cream-50 border-sky-100">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon name="concierge_bell" size={18} />
            <h3 className="font-display text-xl text-stone-900 tracking-tight">Front Desk access code</h3>
          </div>
          <p className="text-sm text-stone-600">Share this code with reception staff so they can register their own front-desk login (limited to bookings, room availability, reviews and notifications — no analytics or pricing).</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <code className="text-xl font-bold tracking-widest bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-inner">{code}</code>
        <button type="button" onClick={copy} className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:border-stone-300 inline-flex items-center gap-2">
          <Icon name="content_copy" size={14} /> {copied ? 'Copied!' : 'Copy code'}
        </button>
        <button type="button" onClick={regen} className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:border-stone-300 inline-flex items-center gap-2">
          <Icon name="refresh" size={14} /> Regenerate
        </button>
      </div>
      <p className="text-[11px] text-stone-500 mt-3">Front-desk staff register at the <strong>Service Provider login → Hotel → Front Desk</strong> tab using this code.</p>
    </div>
  );
}

function ProfilePage({ hotel, onChange }: { hotel: DemoHotel; onChange: (h: DemoHotel) => void }) {
  const [name, setName] = useState(hotel.name);
  const [tagline, setTagline] = useState(hotel.tagline || '');
  const [description, setDescription] = useState(hotel.description || '');
  const [welcomeMessage, setWelcomeMessage] = useState(hotel.welcomeMessage || '');
  const [ctaLabel, setCtaLabel] = useState(hotel.ctaLabel || '');
  const [address, setAddress] = useState(hotel.address || '');
  const [city, setCity] = useState(hotel.city || '');
  const [country, setCountry] = useState(hotel.country || '');
  const [postalCode, setPostalCode] = useState(hotel.postalCode || '');
  const [phone, setPhone] = useState(hotel.phone || '');
  const [email, setEmail] = useState(hotel.email || '');
  const [website, setWebsite] = useState(hotel.website || '');
  const [stars, setStars] = useState(hotel.starRating || 4);
  const [logoUrl, setLogoUrl] = useState(hotel.logoUrl || '');
  const [heroImageUrl, setHeroImageUrl] = useState(hotel.heroImageUrl || '');
  const [galleryText, setGalleryText] = useState((hotel.galleryUrls || []).join('\n'));
  const [amenities, setAmenities] = useState<HotelAmenity[]>(hotel.amenities || []);
  const [saved, setSaved] = useState(false);

  const toggle = (a: HotelAmenity) => setAmenities(amenities.includes(a) ? amenities.filter(x => x !== a) : [...amenities, a]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const galleryUrls = galleryText
      .split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
    const updated = db_upsertHotel({
      ...hotel, name, tagline, description, welcomeMessage, ctaLabel,
      address, city, country, postalCode: postalCode.trim() || undefined,
      phone, email, website,
      starRating: stars, logoUrl, heroImageUrl, galleryUrls, amenities,
    });
    onChange(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={save} className="space-y-5 max-w-3xl">
      {/* Front-desk access code — share with desk staff so they can register */}
      <FrontDeskCodeCard hotel={hotel} onChange={onChange} />

      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl text-stone-900 tracking-tight">Basic information</h3>
        <Field label="Hotel name"><input className={inp} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Tagline (shown under the name)"><input className={inp} value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Beachfront · 5★" maxLength={80} /></Field>
        <Field label="Description"><textarea className={inp} rows={3} value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <Field label="Welcome message (shown to guests in the booking modal)">
          <textarea className={inp} rows={2} value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} placeholder="A personal note from the hotel to your guests…" maxLength={400} />
        </Field>
        <Field label="Booking CTA label">
          <input className={inp} value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Defaults to 'Confirm booking'" maxLength={40} />
        </Field>
        <Field label="Star rating">
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setStars(n)} className={`text-2xl transition-transform ${n <= stars ? 'text-amber-500' : 'text-stone-300'}`}>★</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl text-stone-900 tracking-tight">Brand imagery</h3>
        <Field label="Logo URL (square works best)">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover bg-stone-100 border border-stone-200" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
              : <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-[10px] font-bold uppercase">No logo</div>}
            <input className={inp} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" />
          </div>
        </Field>
        <Field label="Hero image URL"><input className={inp} value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="https://…" /></Field>
        <Field label="Gallery (one image URL per line — up to 12)">
          <textarea className={inp} rows={4} value={galleryText} onChange={e => setGalleryText(e.target.value)} placeholder={'https://…\nhttps://…'} />
        </Field>
        {galleryText.trim() && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {galleryText.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12).map((u, i) => (
              <img key={i} src={u} alt="" className="h-16 w-24 object-cover rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0" onError={(e) => { (e.currentTarget.style.opacity = '0.2'); }} />
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl text-stone-900 tracking-tight">Location & contact</h3>
        <Field label="Address"><input className={inp} value={address} onChange={e => setAddress(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="City"><input className={inp} value={city} onChange={e => setCity(e.target.value)} /></Field>
          <Field label="Country"><input className={inp} value={country} onChange={e => setCountry(e.target.value)} /></Field>
          <Field label="ZIP / Postal code">
            <input className={inp} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 10022" maxLength={12} />
          </Field>
        </div>
        <p className="text-[11px] text-stone-500 -mt-2">
          Used to surface your hotel as a “nearby stay” when couples plan a date night at restaurants in your area.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><input className={inp} value={phone} onChange={e => setPhone(e.target.value)} /></Field>
          <Field label="Email"><input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        </div>
        <Field label="Website"><input className={inp} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></Field>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-xl text-stone-900 tracking-tight mb-4">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_AMENITIES.map(a => {
            const active = amenities.includes(a);
            return (
              <button key={a} type="button" onClick={() => toggle(a)}
                className={`px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                  active ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}>{a.replace('_', ' ')}</button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary !px-7 !py-3.5">Save changes</button>
        {saved && <span className="text-emerald-700 font-bold text-sm flex items-center gap-1"><Icon name="check" size={14} /> Saved</span>}
      </div>
    </form>
  );
}

// ====================================================================
// PAGE: BRANDING & POLICIES
// ====================================================================
function BrandingPage({ hotel, onChange }: { hotel: DemoHotel; onChange: (h: DemoHotel) => void }) {
  const [brandColor, setBrandColor] = useState(hotel.brandColor || '#0ea5e9');
  const [accentColor, setAccentColor] = useState(hotel.accentColor || '#6366f1');
  const [fontStyle, setFontStyle] = useState<NonNullable<DemoHotel['fontStyle']>>(hotel.fontStyle || 'modern');
  const [checkIn, setCheckIn] = useState(hotel.policies?.checkIn || '15:00');
  const [checkOut, setCheckOut] = useState(hotel.policies?.checkOut || '11:00');
  const [cancellation, setCancellation] = useState(hotel.policies?.cancellation || '');
  const [children, setChildren] = useState(hotel.policies?.children || '');
  const [pets, setPets] = useState(hotel.policies?.pets || '');
  const [saved, setSaved] = useState(false);

  const fontFamilyFor = (s: typeof fontStyle) =>
    s === 'classic' ? '"Cormorant Garamond", "Playfair Display", Georgia, serif'
    : s === 'playful' ? '"Caveat", "Pacifico", cursive'
    : '"Manrope", "Inter", system-ui, sans-serif';

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db_upsertHotel({
      ...hotel, brandColor, accentColor, fontStyle,
      policies: { checkIn, checkOut, cancellation, children, pets },
    });
    onChange(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={save} className="space-y-5 max-w-3xl">
      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl text-stone-900 tracking-tight">Brand colors</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand color"><div className="flex gap-2 items-center"><input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="h-12 w-16 rounded-xl border border-stone-200" /><input className={inp} value={brandColor} onChange={e => setBrandColor(e.target.value)} /></div></Field>
          <Field label="Accent color"><div className="flex gap-2 items-center"><input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-12 w-16 rounded-xl border border-stone-200" /><input className={inp} value={accentColor} onChange={e => setAccentColor(e.target.value)} /></div></Field>
        </div>
        <Field label="Heading font style">
          <div className="grid grid-cols-3 gap-2">
            {(['modern','classic','playful'] as const).map(s => (
              <button key={s} type="button" onClick={() => setFontStyle(s)}
                className={`p-3 rounded-2xl border text-left transition-all ${fontStyle === s ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{s}</p>
                <p className="text-2xl text-stone-900 mt-1 leading-none" style={{ fontFamily: fontFamilyFor(s) }}>Aa</p>
              </button>
            ))}
          </div>
        </Field>
        <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Live preview</p>
          <p className="text-2xl mt-1" style={{ fontFamily: fontFamilyFor(fontStyle) }}>{hotel.name}</p>
          {hotel.tagline && <p className="text-white/85 text-sm mt-0.5">{hotel.tagline}</p>}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-display text-xl text-stone-900 tracking-tight">Policies</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in time"><input className={inp} type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></Field>
          <Field label="Check-out time"><input className={inp} type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></Field>
        </div>
        <Field label="Cancellation policy"><textarea className={inp} rows={2} value={cancellation} onChange={e => setCancellation(e.target.value)} /></Field>
        <Field label="Children policy"><textarea className={inp} rows={2} value={children} onChange={e => setChildren(e.target.value)} /></Field>
        <Field label="Pet policy"><textarea className={inp} rows={2} value={pets} onChange={e => setPets(e.target.value)} /></Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary !px-7 !py-3.5">Save settings</button>
        {saved && <span className="text-emerald-700 font-bold text-sm flex items-center gap-1"><Icon name="check" size={14} /> Saved</span>}
      </div>
    </form>
  );
}

// ====================================================================
// PAGE: SUPPORT
// ====================================================================
function SupportPage({ hotel }: { hotel: DemoHotel }) {
  return (
    <div className="card p-8 max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-glow mb-5">
        <Icon name="support" size={28} />
      </div>
      <h2 className="font-display text-3xl text-stone-900 tracking-tight">We're here to help</h2>
      <p className="text-stone-700 mt-3 font-medium">Reach our concierge support team any time, day or night.</p>
      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
        <a className="card p-5 text-left lift-on-hover" href="mailto:hotels@liora.demo">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2"><Icon name="mail" size={18} /></div>
          <p className="font-bold text-stone-900">Email</p>
          <p className="text-[12px] text-stone-700 font-medium">hotels@liora.demo</p>
        </a>
        <a className="card p-5 text-left lift-on-hover" href="tel:+1-555-0100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2"><Icon name="phone" size={18} /></div>
          <p className="font-bold text-stone-900">Phone</p>
          <p className="text-[12px] text-stone-700 font-medium">+1 (555) 010-LIORA</p>
        </a>
      </div>
    </div>
  );
}

// ====================================================================
// SHARED COMPONENTS
// ====================================================================
const inp = "w-full px-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all text-[14px]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em] mb-2">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-cream-200 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-display text-xl text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-cream-100 hover:bg-white/10"><Icon name="x" size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    pending:   'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-sky-100 text-sky-800',
    cancelled: 'bg-stone-200 text-stone-700',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${map[status]}`}>{status}</span>;
}

function KpiCard({ label, value, icon, tint }: { label: string; value: React.ReactNode; icon: string; tint: string }) {
  return (
    <div className="card p-5 lift-on-hover">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tint} ring-1 ring-white/30 shadow-lg flex items-center justify-center mb-4 relative`}>
        <span className="absolute inset-x-1 top-1 h-2.5 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
        <Icon name={icon} size={22} className="text-white drop-shadow-sm relative" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700">{label}</p>
      <p className="font-display text-3xl text-stone-900 mt-1 tracking-tight">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-14">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-200 flex items-center justify-center text-sky-700 mb-4">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="font-display text-xl text-stone-800 tracking-tight">{title}</h3>
      <p className="text-stone-600 text-sm mt-1 font-medium">{desc}</p>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-200 flex items-center justify-center text-sky-700 mb-5">
        <Icon name="construction" size={36} />
      </div>
      <h2 className="font-display text-3xl text-stone-800">Coming soon</h2>
      <p className="text-stone-600 mt-1 text-sm">{label} is being calibrated.</p>
    </div>
  );
}


/* ───────────────────────── EMPTY STATE — first hotel ───────────────────────── */

function EmptyHotelState({
  ownerName,
  onCreate,
  onLogout,
}: {
  ownerName?: string;
  onCreate: (name: string) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(ownerName ? `${ownerName}'s Hotel` : '');
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try { onCreate(trimmed); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app text-stone-800 px-5 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.18)] ring-1 ring-stone-100 p-7 md:p-9">
        <div className="flex items-center gap-3 mb-6">
          <LogoMark className="w-12 h-12" />
          <div className="leading-none">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-700">For Hotels</p>
            <h1 className="font-display text-2xl mt-1 text-stone-900">Welcome{ownerName ? `, ${ownerName}` : ''}.</h1>
          </div>
        </div>

        <h2 className="font-display text-xl text-stone-900 mb-1.5">Let's set up your first property.</h2>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          Give your hotel a name to get started. You can polish photos, rooms, pricing and policies right after.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Property name</span>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Saffron House"
              className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 text-stone-900 placeholder-stone-400 text-base font-medium border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
            />
          </label>

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full py-3.5 rounded-2xl bg-stone-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-stone-800 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create my hotel'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Need to switch accounts?</span>
          <button onClick={onLogout} className="font-bold uppercase tracking-widest text-stone-700 hover:text-stone-900">Sign out</button>
        </div>
      </div>
    </div>
  );
}
