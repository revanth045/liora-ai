import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../../auth/useSession";
import { getAuth } from "../../auth";
import { Icon } from "../../../components/Icon";
import { LogoMark } from "../../../components/Logo";
import {
  DemoHotel, DemoHotelRoom, DemoHotelBooking, DemoHotelReview,
  db_getHotelById,
  db_listRooms,
  db_listBookings, db_updateBookingStatus,
  db_listReviews, db_respondReview,
  db_upsertRoom,
  formatMoney,
} from "../../hotelDb";

const TABS = [
  { id: "today",         label: "Today",          icon: "dashboard" },
  { id: "bookings",      label: "Check-in / out", icon: "receipt_dot" },
  { id: "rooms",         label: "Room availability", icon: "hotel" },
  { id: "reviews",       label: "Reviews & Ratings", icon: "star" },
  { id: "notifications", label: "Notifications",  icon: "notifications_active" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function FrontDeskPortal() {
  const s = useSession();
  const auth = getAuth();
  const hotelId = s?.user?.hotelId || "";

  const [hotel, setHotel] = useState<DemoHotel | null>(null);
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [showSignOut, setShowSignOut] = useState(false);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!hotelId) return;
    const h = db_getHotelById(hotelId);
    if (h) setHotel(h);
  }, [hotelId, tick]);

  if (!s || s.user.role !== "front_desk") {
    return <div className="p-6 text-stone-700">Please sign in as a front-desk member.</div>;
  }
  if (!hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app text-stone-700 gap-3">
      <LogoMark className="w-12 h-12 animate-pulse-soft" />
      <p className="text-sm font-semibold">Loading your front-desk console…</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "today":         return <TodayPage hotel={hotel} {...({key:tick} as any)} />;
      case "bookings":      return <FrontDeskBookings hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case "rooms":         return <FrontDeskRooms hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case "reviews":       return <FrontDeskReviews hotel={hotel} onChange={refresh} {...({key:tick} as any)} />;
      case "notifications": return <FrontDeskNotifications hotel={hotel} {...({key:tick} as any)} />;
    }
  };

  const activeMeta = TABS.find(t => t.id === activeTab)!;
  const bookings = db_listBookings(hotel.id);
  const todayISO = new Date().toISOString().slice(0, 10);
  const checkInsToday = bookings.filter(b => b.checkIn === todayISO && b.status !== "cancelled").length;
  const checkOutsToday = bookings.filter(b => b.checkOut === todayISO && b.status !== "cancelled").length;
  const pendingArrivals = bookings.filter(b => b.checkIn >= todayISO && b.status === "confirmed").length;

  return (
    <div className="flex h-dscreen bg-app text-stone-800 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-cream-50/60 via-app to-sky-50/40" />

      <aside
        style={{ background: 'linear-gradient(180deg, #0c1320 0%, #11192a 35%, #16203a 70%, #0c1424 100%)' }}
        className="hidden md:flex md:relative md:top-4 md:left-4 md:bottom-4 md:h-[calc(100vh-2rem)] w-[260px] md:rounded-3xl md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] flex-col z-40 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/10 to-transparent" />

        <div className="relative px-5 py-5 flex items-center justify-between border-b border-sky-200/10">
          <div className="flex items-center gap-3 min-w-0">
            {hotel.heroImageUrl ? (
              <img src={hotel.heroImageUrl} alt={hotel.name} className="w-10 h-10 rounded-2xl object-cover ring-1 ring-sky-300/30 shadow-md" />
            ) : (
              <LogoMark className="w-10 h-10" />
            )}
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-display text-lg text-cream-50 font-semibold truncate">{hotel.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] mt-1 truncate" style={{ color: '#84b3e7' }}>Front Desk</span>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-sky-400/15 text-cream-50 ring-1 ring-sky-300/30 shadow-inner"
                    : "text-cream-100/70 hover:bg-white/5 hover:text-cream-50"
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="relative p-4 border-t border-sky-200/10">
          <div className="text-[10px] uppercase tracking-[0.22em] text-sky-200/70 mb-2">Signed in as</div>
          <div className="text-cream-50 text-sm font-semibold truncate">{s.user.name || s.user.email}</div>
          <div className="text-[11px] text-cream-100/60 truncate">{s.user.email}</div>
          <button
            onClick={() => setShowSignOut(true)}
            className="mt-3 w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream-100 text-[12px] font-semibold flex items-center justify-center gap-2"
          >
            <Icon name="logout" size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main className="relative flex-1 flex flex-col overflow-hidden md:my-4 md:mr-4 md:rounded-3xl md:shadow-xl md:bg-white/70 md:backdrop-blur-xl">
        <header className="flex items-center justify-between gap-3 px-6 py-5 border-b border-stone-200/60">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-sky-700 uppercase tracking-[0.24em]">Front Desk</div>
            <h1 className="font-display text-2xl text-stone-900 truncate">{activeMeta.label}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <Pill tone="sky" label={`${checkInsToday} check-ins`} />
            <Pill tone="amber" label={`${checkOutsToday} check-outs`} />
            <Pill tone="stone" label={`${pendingArrivals} upcoming`} />
          </div>
        </header>

        <div className="md:hidden flex overflow-x-auto gap-1.5 px-4 py-3 border-b border-stone-200/60 bg-white/60 backdrop-blur">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </div>
      </main>

      {showSignOut && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSignOut(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-stone-900 mb-2">Sign out?</h2>
            <p className="text-sm text-stone-600 mb-5">You'll need your front-desk credentials to sign back in.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowSignOut(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-semibold">Cancel</button>
              <button
                onClick={async () => { await auth.signOut(); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800"
              >Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Pages ----------------------------------------------------------

function TodayPage({ hotel }: { hotel: DemoHotel }) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  const bookings = useMemo(() => db_listBookings(hotel.id), [hotel.id, tick]);
  const rooms = useMemo(() => db_listRooms(hotel.id), [hotel.id, tick]);
  const todayISO = new Date().toISOString().slice(0, 10);
  const arrivals = bookings.filter(b => b.checkIn === todayISO && b.status !== "cancelled");
  const departures = bookings.filter(b => b.checkOut === todayISO && b.status !== "cancelled");
  const inHouse = bookings.filter(b => b.checkIn <= todayISO && b.checkOut > todayISO && b.status !== "cancelled");
  const totalUnits = rooms.reduce((s, r) => s + (r.totalUnits || 0), 0);
  const occupancy = totalUnits ? Math.min(100, Math.round((inHouse.length / totalUnits) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="login" label="Arrivals today" value={arrivals.length} tone="sky" />
        <StatCard icon="logout" label="Departures today" value={departures.length} tone="amber" />
        <StatCard icon="hotel" label="In-house guests" value={inHouse.length} tone="emerald" />
        <StatCard icon="insights" label="Occupancy" value={`${occupancy}%`} tone="violet" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <BookingList title="Arriving today" rows={arrivals} rooms={rooms} action="check_in" onChange={refresh} />
        <BookingList title="Departing today" rows={departures} rooms={rooms} action="check_out" onChange={refresh} />
      </div>
    </div>
  );
}

function FrontDeskBookings({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const [filter, setFilter] = useState<"upcoming" | "today" | "in_house" | "past" | "all">("today");
  const [tick, setTick] = useState(0);
  useEffect(() => { onChange(); }, [tick]); // bubble local change up
  const bookings = useMemo(() => db_listBookings(hotel.id), [hotel.id, tick]);
  const rooms = useMemo(() => db_listRooms(hotel.id), [hotel.id, tick]);
  const todayISO = new Date().toISOString().slice(0, 10);
  const filtered = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "today") return b.checkIn === todayISO || b.checkOut === todayISO;
    if (filter === "in_house") return b.checkIn <= todayISO && b.checkOut > todayISO && b.status !== "cancelled";
    if (filter === "upcoming") return b.checkIn > todayISO;
    return b.checkOut < todayISO;
  }).sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const countFor = (id: string) => bookings.filter(b => {
    if (id === "today") return b.checkIn === todayISO || b.checkOut === todayISO;
    if (id === "in_house") return b.checkIn <= todayISO && b.checkOut > todayISO && b.status !== "cancelled";
    if (id === "upcoming") return b.checkIn > todayISO;
    if (id === "past") return b.checkOut < todayISO;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "today", label: "Today" },
          { id: "in_house", label: "In-house" },
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
          { id: "all", label: "All" },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setFilter(o.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              filter === o.id
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
            }`}
          >
            {o.label} <span className="opacity-60 ml-1">({countFor(o.id)})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="receipt_dot" title="No bookings here" body="Try a different filter to see other arrivals or stays." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(b => {
            const room = rooms.find(r => r.id === b.roomId);
            const isArrival = b.checkIn === todayISO && b.status !== "completed" && b.status !== "cancelled";
            const isDeparture = b.checkOut === todayISO && b.status === "confirmed";
            return (
              <React.Fragment key={b.id}>
                <BookingRow
                  b={b}
                  room={room}
                  primaryAction={isArrival ? "check_in" : isDeparture ? "check_out" : null}
                  onChange={() => setTick(t => t + 1)}
                />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FrontDeskRooms({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { onChange(); }, [tick]);
  const rooms = useMemo(() => db_listRooms(hotel.id), [hotel.id, tick]);
  const bookings = useMemo(() => db_listBookings(hotel.id), [hotel.id, tick]);
  const todayISO = new Date().toISOString().slice(0, 10);

  const occupiedByRoom = (roomId: string) =>
    bookings.filter(b => b.roomId === roomId && b.checkIn <= todayISO && b.checkOut > todayISO && b.status !== "cancelled").length;

  const toggleAvailability = (room: DemoHotelRoom) => {
    db_upsertRoom({ ...room, active: !room.active });
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-3">
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm text-sky-900">
        <strong className="font-semibold">Tip:</strong> Toggle a room off when it needs maintenance — it will instantly stop appearing on the consumer booking page.
      </div>
      {rooms.length === 0 ? (
        <EmptyState icon="hotel" title="No rooms configured yet" body="Ask the hotel owner to add rooms in the main hotel portal." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map(room => {
            const occupied = occupiedByRoom(room.id);
            const free = Math.max(0, (room.totalUnits || 0) - occupied);
            return (
              <div key={room.id} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-display text-lg text-stone-900 truncate">{room.name}</div>
                    <div className="text-[11px] text-stone-500 uppercase tracking-wider">{room.type}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${room.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {room.active ? "Available" : "Off"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <Mini label="Free" value={free} />
                  <Mini label="In use" value={occupied} />
                  <Mini label="Total" value={room.totalUnits || 0} />
                </div>
                <div className="text-[12px] text-stone-600 mb-3">{formatMoney(room.pricePerNightCents)} / night</div>
                <button
                  onClick={() => toggleAvailability(room)}
                  className={`w-full px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                    room.active
                      ? "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >{room.active ? "Mark unavailable" : "Bring back online"}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FrontDeskReviews({ hotel, onChange }: { hotel: DemoHotel; onChange: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { onChange(); }, [tick]);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "high" | "low">("needs_reply");
  const [reply, setReply] = useState<{ id: string; text: string } | null>(null);
  const reviews: DemoHotelReview[] = useMemo(() => db_listReviews(hotel.id), [hotel.id, tick]);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const filtered = reviews.filter(r => {
    if (filter === "needs_reply") return !r.ownerResponse;
    if (filter === "high") return r.rating >= 4;
    if (filter === "low") return r.rating <= 3;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const submitReply = () => {
    if (!reply || !reply.text.trim()) return;
    db_respondReview(reply.id, reply.text.trim());
    setReply(null);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-50 via-white to-cream-50 border border-amber-100 rounded-3xl p-5 flex items-center gap-5 shadow-sm">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Overall rating</div>
          <div className="font-display text-5xl text-stone-900 leading-none">{avg.toFixed(1)}</div>
          <div className="text-amber-500 text-lg mt-1">{"★".repeat(Math.round(avg)).padEnd(5, "☆")}</div>
        </div>
        <div className="text-sm text-stone-600">
          <div>{reviews.length} guest review{reviews.length === 1 ? "" : "s"} all-time</div>
          <div className="text-[12px] text-stone-500 mt-1">{reviews.filter(r => !r.ownerResponse).length} awaiting your reply</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "needs_reply", label: "Needs reply" },
          { id: "high", label: "Happy guests (4★+)" },
          { id: "low", label: "Critical (≤3★)" },
          { id: "all", label: "All" },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setFilter(o.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              filter === o.id ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-700 border-stone-200"
            }`}
          >{o.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="star" title="Nothing here" body="Reviews matching this filter will appear in real time." />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="font-semibold text-stone-900 text-sm">{r.guestName}</div>
                  <div className="text-amber-500 text-[14px] leading-none mt-0.5">{"★".repeat(r.rating).padEnd(5, "☆")}</div>
                </div>
                <div className="text-[11px] text-stone-400">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <p className="text-[13px] text-stone-700 whitespace-pre-wrap leading-relaxed mt-2">{r.comment}</p>

              {r.ownerResponse ? (
                <div className="mt-3 bg-cream-50 border border-cream-200 rounded-xl p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">From the hotel</div>
                  <p className="text-[13px] text-stone-700 whitespace-pre-wrap">{r.ownerResponse}</p>
                </div>
              ) : reply?.id === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    autoFocus
                    rows={3}
                    value={reply.text}
                    onChange={(e) => setReply({ id: r.id, text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-sky-400"
                    placeholder="Thank the guest, address their feedback, invite them back…"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setReply(null)} className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-[12px] font-semibold">Cancel</button>
                    <button onClick={submitReply} className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-[12px] font-semibold hover:bg-sky-700">Post reply</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReply({ id: r.id, text: r.rating >= 4 ? `Thank you so much, ${r.guestName.split(" ")[0]}! We're delighted you enjoyed your stay at ${hotel.name}. We can't wait to welcome you back.` : "" })}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[12px] font-semibold inline-flex items-center gap-1.5"
                >
                  <Icon name="reply" size={14} /> Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FrontDeskNotifications({ hotel }: { hotel: DemoHotel }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch(`/api/hotel-notifications?hotelId=${encodeURIComponent(hotel.id)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : (data.notifications || []));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // SSE live stream
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/hotel-notifications/stream?hotelId=${encodeURIComponent(hotel.id)}`);
      es.onmessage = () => refresh();
    } catch {}
    const t = setInterval(refresh, 8000);
    return () => { es?.close(); clearInterval(t); };
  }, [hotel.id]);

  const markAllRead = async () => {
    try { await fetch(`/api/hotel-notifications/mark-all-read?hotelId=${encodeURIComponent(hotel.id)}`, { method: "POST" }); } catch {}
    refresh();
  };

  if (loading && items.length === 0) {
    return <div className="text-stone-500 text-sm">Loading notifications…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-stone-500">
          {items.filter((n: any) => !n.read).length} unread · {items.length} total
        </div>
        <button onClick={markAllRead} className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[12px] font-semibold">Mark all read</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="notifications_active" title="All clear" body="New bookings, reviews and guest messages will appear here in real time." />
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => {
            const ts = Number(n.createdAt || n.created_at);
            const icon = n.kind === "booking" ? "receipt_dot" : n.kind === "review" ? "star" : n.kind === "message" ? "sparkle_chat" : "notifications";
            const tone = n.kind === "booking" ? "bg-sky-50 border-sky-100" : n.kind === "review" ? "bg-amber-50 border-amber-100" : n.kind === "message" ? "bg-violet-50 border-violet-100" : "bg-stone-50 border-stone-100";
            return (
              <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${tone} ${n.read ? "opacity-60" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-stone-700 shadow-sm">
                  <Icon name={icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{n.title}</div>
                  {n.body && <div className="text-[13px] text-stone-700 mt-0.5">{n.body}</div>}
                  <div className="text-[11px] text-stone-400 mt-1">{ts ? new Date(ts).toLocaleString() : ""}</div>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Reusables -------------------------------------------------------

function StatCard({ icon, label, value, tone }: { icon: string; label: string; value: number | string; tone: "sky" | "amber" | "emerald" | "violet" }) {
  const toneClasses: Record<string, string> = {
    sky: "from-sky-50 to-white border-sky-100 text-sky-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    emerald: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
    violet: "from-violet-50 to-white border-violet-100 text-violet-700",
  };
  return (
    <div className={`bg-gradient-to-br ${toneClasses[tone]} border rounded-2xl p-4 shadow-sm`}>
      <Icon name={icon} size={18} />
      <div className="text-[11px] uppercase tracking-wider mt-1.5 font-semibold opacity-80">{label}</div>
      <div className="font-display text-3xl text-stone-900 mt-1 leading-none">{value}</div>
    </div>
  );
}

function Pill({ tone, label }: { tone: "sky" | "amber" | "stone"; label: string }) {
  const c = tone === "sky" ? "bg-sky-100 text-sky-700" : tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-700";
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c}`}>{label}</span>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-stone-50 rounded-xl py-2 px-1">
      <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
      <div className="font-semibold text-stone-900 text-base">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 mx-auto flex items-center justify-center mb-3 text-stone-500">
        <Icon name={icon} size={24} />
      </div>
      <div className="font-display text-lg text-stone-900">{title}</div>
      <p className="text-sm text-stone-500 mt-1">{body}</p>
    </div>
  );
}

function BookingList({ title, rows, rooms, action, onChange }: { title: string; rows: DemoHotelBooking[]; rooms: DemoHotelRoom[]; action: "check_in" | "check_out"; onChange: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm">
      <h3 className="font-display text-lg text-stone-900 mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-stone-500 text-sm py-6 text-center">Nothing scheduled.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(b => (
            <React.Fragment key={b.id}>
              <BookingRow b={b} room={rooms.find(r => r.id === b.roomId)} primaryAction={action} onChange={onChange} compact />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ b, room, primaryAction, onChange, compact }: { b: DemoHotelBooking; room?: DemoHotelRoom; primaryAction: "check_in" | "check_out" | null; onChange: () => void; compact?: boolean }) {
  const handle = (next: "confirmed" | "completed" | "cancelled") => {
    db_updateBookingStatus(b.id, next);
    onChange();
  };
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-sky-100 text-sky-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <div className={`flex items-center gap-3 ${compact ? "p-2.5 bg-stone-50" : "p-3.5 bg-white border border-stone-200"} rounded-2xl`}>
      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold">
        {b.guestName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-stone-900 text-sm truncate">{b.guestName}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>{b.status}</span>
        </div>
        <div className="text-[12px] text-stone-500 truncate">
          {room?.name || "Room"} · {b.checkIn} → {b.checkOut} · {b.adults}A{b.children ? ` · ${b.children}C` : ""}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {primaryAction === "check_in" && b.status !== "completed" && (
          <button onClick={() => handle("confirmed")} className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-700 inline-flex items-center gap-1">
            <Icon name="login" size={12} /> Check in
          </button>
        )}
        {primaryAction === "check_out" && b.status === "confirmed" && (
          <button onClick={() => handle("completed")} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1">
            <Icon name="logout" size={12} /> Check out
          </button>
        )}
        {!compact && b.status !== "cancelled" && b.status !== "completed" && (
          <button onClick={() => handle("cancelled")} className="text-[10px] text-stone-500 hover:text-red-600 font-semibold">Cancel</button>
        )}
      </div>
    </div>
  );
}
