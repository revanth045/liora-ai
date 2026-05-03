import React, { useEffect, useMemo, useState } from 'react';
import { View } from '../../../../types';
import { useSession } from '../../../auth/useSession';
import {
  DemoHotel, DemoHotelRoom, DemoHotelAddOn, DemoHotelBooking, HotelAmenity,
  db_listHotels, db_listRooms, db_listAddOns, db_listReviews, db_listBookings,
  db_addBooking, db_addReview,
  formatMoney, nightsBetween,
} from '../../../hotelDb';
import { api, apiBase } from '../../../lib/api';
import { toast } from '../../../lib/toast';
import { fileToResizedDataUrl } from '../../../lib/imageResize';
import HotelsMapView from '../../../components/HotelsMapView';

type ConsumerHotelOffer = { id: string; hotelId: string; title: string; description?: string; type: 'percent'|'flat'|'bogo'; value: number; code: string; minNights: number };

const AMENITY_META: Record<HotelAmenity, { icon: string; label: string }> = {
  wifi:            { icon: 'wifi',         label: 'Wi-Fi' },
  parking:         { icon: 'parking',      label: 'Parking' },
  pool:            { icon: 'pool',         label: 'Pool' },
  spa:             { icon: 'spa',          label: 'Spa' },
  gym:             { icon: 'fitness',      label: 'Gym' },
  restaurant:      { icon: 'restaurant',   label: 'Restaurant' },
  bar:             { icon: 'cocktail',     label: 'Bar' },
  concierge:       { icon: 'concierge',    label: 'Concierge' },
  laundry:         { icon: 'wash',         label: 'Laundry' },
  pet_friendly:    { icon: 'paw',          label: 'Pet-friendly' },
  beach:           { icon: 'beach',        label: 'Beach' },
  airport_shuttle: { icon: 'plane',        label: 'Airport shuttle' },
};

const STAR = (r = 0) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDaysISO = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
};

export const HotelsHub = ({ onNavigate: _ }: { onNavigate: (tab: View) => void }) => {
  const session = useSession();
  const [tick, setTick] = useState(0);

  useEffect(() => { setTick(t => t + 1); }, []);
  // Re-render once Neon hydration completes so consumers see fresh hotels.
  useEffect(() => {
    const onHydrated = () => setTick(t => t + 1);
    window.addEventListener('liora:hydrated', onHydrated);
    return () => window.removeEventListener('liora:hydrated', onHydrated);
  }, []);

  const hotels = useMemo<DemoHotel[]>(() => db_listHotels(), [tick]);

  const [query, setQuery] = useState('');
  const [activeAmenity, setActiveAmenity] = useState<HotelAmenity | 'all'>('all');
  const [selected, setSelected] = useState<DemoHotel | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotels.filter(h => {
      if (activeAmenity !== 'all' && !(h.amenities || []).includes(activeAmenity)) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        (h.city || '').toLowerCase().includes(q) ||
        (h.country || '').toLowerCase().includes(q)
      );
    });
  }, [hotels, query, activeAmenity]);

  // User's own bookings across all hotels (matched by guest email)
  const myBookings = useMemo<Array<DemoHotelBooking & { hotelName: string; roomName: string }>>(() => {
    const email = session?.user?.email?.toLowerCase();
    if (!email) return [];
    const all: Array<DemoHotelBooking & { hotelName: string; roomName: string }> = [];
    hotels.forEach(h => {
      const rooms = db_listRooms(h.id);
      db_listBookings(h.id)
        .filter(b => (b.guestEmail || '').toLowerCase() === email)
        .forEach(b => {
          const room = rooms.find(r => r.id === b.roomId);
          all.push({ ...b, hotelName: h.name, roomName: room?.name || 'Room' });
        });
    });
    return all.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [hotels, session?.user?.email, tick]);

  const cities = useMemo(() => Array.from(new Set(hotels.map(h => h.city).filter(Boolean))) as string[], [hotels]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-7 md:mb-10 shadow-sm">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=85')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/20" />
        <div className="relative px-6 md:px-10 py-9 md:py-14 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300 mb-3">Curated escapes</p>
          <h1 className="font-display text-3xl md:text-5xl font-extralight leading-tight tracking-tight max-w-2xl">
            Stay <em className="italic text-sky-300">somewhere extraordinary.</em>
          </h1>
          <p className="text-white/90 text-sm md:text-base font-light max-w-xl mt-4 leading-relaxed">
            Book directly from {hotels.length} concierge-vetted hotels and resorts — your reservation lands instantly with the property.
          </p>

          {/* Search bar */}
          <div className="mt-7 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-base">🔎</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by hotel, city or country…"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-stone-900 placeholder-stone-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-lg"
              />
            </div>
            {cities.length > 0 && (
              <select
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-white/95 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-lg"
              >
                <option value="">All cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <AIConciergePanel onPickHotel={(h) => setSelected(h)} hotels={hotels} />

      {/* Amenity filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 pl-1 pr-6 hide-scrollbar snap-x snap-mandatory">
        <button
          onClick={() => setActiveAmenity('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest border transition-all ${activeAmenity === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'}`}
        >All</button>
        {(Object.keys(AMENITY_META) as HotelAmenity[]).map(a => (
          <button
            key={a}
            onClick={() => setActiveAmenity(a === activeAmenity ? 'all' : a)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest border transition-all ${activeAmenity === a ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'}`}
          >{AMENITY_META[a].label}</button>
        ))}
      </div>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-2xl text-stone-900 mb-3">Your reservations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myBookings.map(b => (
              <MyBookingCard key={b.id} booking={b} onReviewed={() => setTick(t => t + 1)} />
            ))}
          </div>
        </section>
      )}

      {/* Hotel grid / map */}
      <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-display text-2xl text-stone-900">{filtered.length} {filtered.length === 1 ? 'hotel' : 'hotels'} available</h2>
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5 text-xs font-bold">
          <button type="button" onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}>
            Grid
          </button>
          <button type="button" onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-full transition-colors ${viewMode === 'map' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'}`}>
            Map
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-700 bg-white border border-stone-200 rounded-3xl">
          <p className="text-4xl mb-3">🏨</p>
          <p className="font-display text-xl text-stone-900 mb-1">No matches</p>
          <p className="text-sm font-medium">Try clearing filters or a different city.</p>
        </div>
      ) : viewMode === 'map' ? (
        <HotelsMapView hotels={filtered} onOpen={setSelected} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(h => <HotelCard key={h.id} hotel={h} onOpen={() => setSelected(h)} />)}
        </div>
      )}

      {/* Detail / booking modal */}
      {selected && (
        <HotelDetail
          hotel={selected}
          onClose={() => setSelected(null)}
          onBooked={() => { setSelected(null); setTick(t => t + 1); }}
          guestEmail={session?.user?.email}
          guestName={session?.user?.name}
        />
      )}
    </div>
  );
};

// ---------------- Reviews summary section (B7 enhanced) ----------------
function HotelReviewsSection({ reviews, avgRating }: { reviews: any[]; avgRating: number }) {
  const [filter, setFilter] = React.useState(0);
  const [sort, setSort] = React.useState<'recent' | 'highest' | 'lowest'>('recent');
  const [showAll, setShowAll] = React.useState(false);

  if (reviews.length === 0) {
    return (
      <div className="bg-cream-50 border border-cream-200 rounded-2xl p-6 text-center">
        <p className="text-stone-700 text-sm font-bold">No guest reviews yet</p>
        <p className="text-stone-600 text-xs mt-1">Be the first to share your stay experience after check-out.</p>
      </div>
    );
  }

  const dist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));
  let list = filter ? reviews.filter(r => r.rating === filter) : [...reviews];
  if (sort === 'recent')  list.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'highest') list.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
  if (sort === 'lowest')  list.sort((a, b) => a.rating - b.rating || b.createdAt - a.createdAt);
  const visible = showAll ? list : list.slice(0, 4);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-3">Guest reviews</p>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-200 rounded-2xl p-5 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="text-center md:border-r md:border-amber-200 md:pr-4">
            <p className="font-display text-5xl font-bold text-stone-900 leading-none">{avgRating.toFixed(1)}</p>
            <p className="text-amber-500 text-base mt-1">{STAR(avgRating)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mt-1">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
          </div>
          <div className="md:col-span-2 space-y-1">
            {dist.map(d => {
              const pct = (d.count / reviews.length) * 100;
              const isActive = filter === d.star;
              return (
                <button key={d.star} type="button"
                  onClick={() => d.count > 0 && setFilter(filter === d.star ? 0 : d.star)}
                  disabled={d.count === 0}
                  className={`w-full flex items-center gap-2 text-xs ${d.count > 0 ? 'cursor-pointer hover:opacity-90' : 'cursor-default opacity-60'}`}>
                  <span className={`w-7 text-left font-bold ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>{d.star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-7 text-right font-semibold text-stone-700 tabular-nums">{d.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sort/filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(['recent', 'highest', 'lowest'] as const).map(m => (
          <button key={m} type="button" onClick={() => setSort(m)}
            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${sort === m ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-cream-200 hover:border-stone-400'}`}>
            {m === 'recent' ? 'Most recent' : m === 'highest' ? 'Highest rated' : 'Lowest rated'}
          </button>
        ))}
        {filter > 0 && (
          <button type="button" onClick={() => setFilter(0)}
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {filter}★ only · clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map(r => (
          <div key={r.id} className="bg-white border border-cream-200 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {(r.guestName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-bold text-stone-900 text-sm">{r.guestName}</p>
                  <p className="text-amber-500 text-sm">{STAR(r.rating)}</p>
                </div>
                <p className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <p className="text-stone-800 text-[13px] leading-relaxed font-medium">"{r.comment}"</p>
            {Array.isArray(r.photoUrls) && r.photoUrls.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {r.photoUrls.map((u: string, i: number) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden bg-stone-100 hover:ring-2 hover:ring-sky-400">
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
            {r.ownerResponse && (
              <div className="mt-2 ml-12 pl-3 border-l-2 border-sky-300 bg-sky-50 rounded-r-xl p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-0.5">Hotel response</p>
                <p className="text-stone-800 text-[12px] leading-relaxed">{r.ownerResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {list.length > 4 && (
        <button type="button" onClick={() => setShowAll(s => !s)}
          className="mt-3 w-full text-[12px] font-bold text-stone-700 hover:text-stone-900 bg-cream-100 hover:bg-cream-200 rounded-xl py-2.5 transition-colors">
          {showAll ? 'Show fewer reviews' : `Show all ${list.length} ${filter ? filter + '★ ' : ''}reviews`}
        </button>
      )}
    </div>
  );
}

// ---------------- Card ----------------

// Maps a hotel-chosen font style to a CSS font-family stack used on consumer
// surfaces (hero/title), and provides a small brand-color helper that falls
// back to the platform sky/indigo when a hotel hasn't picked one.
function brandFontFamily(s?: DemoHotel['fontStyle']) {
  return s === 'classic' ? '"Cormorant Garamond", "Playfair Display", Georgia, serif'
    : s === 'playful' ? '"Caveat", "Pacifico", cursive'
    : '"Manrope", "Inter", system-ui, sans-serif';
}
function brandGradient(h: DemoHotel) {
  const a = h.brandColor || '#0ea5e9';
  const b = h.accentColor || '#6366f1';
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function HotelCard({ hotel, onOpen }: { hotel: DemoHotel; onOpen: () => void; key?: React.Key }) {
  const rooms = useMemo(() => db_listRooms(hotel.id).filter(r => r.active), [hotel.id]);
  const fromPrice = rooms.length ? Math.min(...rooms.map(r => r.pricePerNightCents)) : 0;
  const reviews = useMemo(() => db_listReviews(hotel.id), [hotel.id]);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : (hotel.starRating || 0);
  const titleFont = brandFontFamily(hotel.fontStyle);

  return (
    <button onClick={onOpen} className="group text-left bg-white rounded-3xl overflow-hidden border border-stone-200 hover:border-stone-400 hover:shadow-xl transition-all">
      <div className="aspect-[16/10] overflow-hidden relative bg-stone-100">
        {hotel.heroImageUrl && (
          <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('${hotel.heroImageUrl}')` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-transparent to-transparent" />
        {hotel.logoUrl && (
          <img src={hotel.logoUrl} alt="" className="absolute top-3 right-3 w-10 h-10 rounded-2xl object-cover bg-white/90 p-1 shadow" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
        )}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-900 shadow">
          <span className="text-amber-500">★</span> {avgRating.toFixed(1)}
        </div>
        {fromPrice > 0 && (
          <div className="absolute bottom-3 right-3 text-white px-3 py-1.5 rounded-full text-[12px] font-bold backdrop-blur-sm" style={{ background: hotel.brandColor ? `${hotel.brandColor}e6` : 'rgba(12,10,9,0.85)' }}>
            from {formatMoney(fromPrice)}<span className="text-white/70 font-medium"> /night</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: hotel.brandColor || '#44403c' }}>
          📍 {[hotel.city, hotel.country].filter(Boolean).join(', ') || 'Location TBD'}
        </p>
        <h3 className="text-xl text-stone-900 leading-tight tracking-tight mb-1" style={{ fontFamily: titleFont }}>{hotel.name}</h3>
        {hotel.tagline && <p className="text-stone-600 text-[12px] font-semibold italic mb-1">{hotel.tagline}</p>}
        {hotel.description && (
          <p className="text-stone-700 text-[13px] leading-relaxed font-medium line-clamp-2">{hotel.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(hotel.amenities || []).slice(0, 4).map(a => (
            <span key={a} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">{AMENITY_META[a]?.label || a}</span>
          ))}
          {(hotel.amenities || []).length > 4 && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">+{(hotel.amenities || []).length - 4}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------- Detail / booking modal ----------------

export function HotelDetail({ hotel, onClose, onBooked, guestEmail, guestName }: {
  hotel: DemoHotel;
  onClose: () => void;
  onBooked: () => void;
  guestEmail?: string;
  guestName?: string;
}) {
  const rooms = useMemo(() => db_listRooms(hotel.id).filter(r => r.active), [hotel.id]);
  const addOns = useMemo(() => db_listAddOns(hotel.id).filter(a => a.active), [hotel.id]);
  const reviews = useMemo(() => db_listReviews(hotel.id), [hotel.id]);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : (hotel.starRating || 0);

  const [roomId, setRoomId] = useState(rooms[0]?.id || '');
  const [checkIn, setCheckIn] = useState(plusDaysISO(7));
  const [checkOut, setCheckOut] = useState(plusDaysISO(10));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState(guestName || '');
  const [email, setEmail] = useState(guestEmail || '');
  const [phone, setPhone] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<DemoHotelBooking | null>(null);
  // B5 — promo offers
  const [offers, setOffers] = useState<ConsumerHotelOffer[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<ConsumerHotelOffer | null>(null);
  const [promoMsg, setPromoMsg] = useState('');

  useEffect(() => {
    api.get(`/api/hotel-offers?hotelId=${encodeURIComponent(hotel.id)}&activeOnly=true`)
      .then((o: any) => setOffers((o || []) as ConsumerHotelOffer[]))
      .catch(() => setOffers([]));
  }, [hotel.id]);

  const room = useMemo(() => rooms.find(r => r.id === roomId), [rooms, roomId]);
  const nights = nightsBetween(checkIn, checkOut);

  const subtotalCents = useMemo(() => {
    if (!room) return 0;
    let t = room.pricePerNightCents * nights;
    selectedAddOnIds.forEach(id => {
      const a = addOns.find(x => x.id === id);
      if (!a) return;
      t += a.perPerson ? a.priceCents * (adults + children) * nights : a.priceCents;
    });
    return t;
  }, [room, nights, selectedAddOnIds, addOns, adults, children]);

  const discountCents = useMemo(() => {
    if (!appliedOffer || subtotalCents <= 0) return 0;
    if (appliedOffer.type === 'percent') return Math.round(subtotalCents * (appliedOffer.value / 100));
    if (appliedOffer.type === 'flat')    return Math.min(subtotalCents, Math.round(appliedOffer.value * 100));
    return 0;
  }, [appliedOffer, subtotalCents]);

  const totalCents = Math.max(0, subtotalCents - discountCents);

  const applyPromo = async (overrideCode?: string) => {
    setPromoMsg('');
    const codeToUse = (overrideCode ?? promoCode).trim();
    if (!codeToUse) { setAppliedOffer(null); return; }
    try {
      const res: any = await api.post('/api/hotel-offers/validate', {
        code: codeToUse, hotelId: hotel.id, roomId, nights,
      });
      if (res?.valid) { setAppliedOffer(res.offer); setPromoMsg(`✓ ${res.offer.title} applied`); }
      else { setAppliedOffer(null); setPromoMsg('Invalid code'); }
    } catch (e: any) {
      setAppliedOffer(null);
      const m = String(e?.message || '');
      const match = m.match(/:\s*\{.*"error":"([^"]+)"/);
      setPromoMsg(match ? match[1] : 'Could not validate code');
    }
  };

  const toggleAddOn = (id: string) =>
    setSelectedAddOnIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!room) { setError('Pick a room'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out must be after check-in'); return; }
    if (!name.trim() || !email.trim()) { setError('Please share a guest name and email'); return; }
    if (adults < 1) { setError('At least one adult required'); return; }
    if (adults > room.capacityAdults || children > room.capacityChildren) {
      setError(`This room sleeps up to ${room.capacityAdults} adult${room.capacityAdults !== 1 ? 's' : ''}${room.capacityChildren ? ` + ${room.capacityChildren} children` : ''}`);
      return;
    }
    const booking = db_addBooking({
      hotelId: hotel.id, roomId: room.id,
      guestName: name.trim(), guestEmail: email.trim(), guestPhone: phone.trim() || undefined,
      checkIn, checkOut, adults, children, nightsCount: nights, totalCents,
      status: 'confirmed', paymentStatus: 'paid',
      addOnIds: selectedAddOnIds.length ? selectedAddOnIds : undefined,
    });
    setConfirmation(booking);
  };

  const titleFont = brandFontFamily(hotel.fontStyle);
  const eyebrowColor = hotel.brandColor ? hotel.accentColor || hotel.brandColor : '#7dd3fc';
  const ctaLabel = hotel.ctaLabel?.trim() || 'Confirm reservation';

  return (
    <div className="fixed inset-0 z-[80] bg-stone-950/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full md:max-w-4xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[100dvh] md:max-h-[95vh] flex flex-col overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <div className="relative h-56 md:h-72 flex-shrink-0 bg-stone-200">
          {hotel.heroImageUrl && (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${hotel.heroImageUrl}')` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center text-stone-900 font-bold text-lg hover:bg-white transition-colors">✕</button>
          {hotel.logoUrl && (
            <img src={hotel.logoUrl} alt="" className="absolute top-4 left-4 w-14 h-14 rounded-2xl object-cover bg-white/90 p-1 shadow-lg" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
          )}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] mb-1" style={{ color: eyebrowColor }}>📍 {[hotel.city, hotel.country].filter(Boolean).join(', ')}</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-shadow-luxe" style={{ fontFamily: titleFont }}>{hotel.name}</h2>
            {hotel.tagline && <p className="text-white/90 text-sm font-medium italic mt-0.5">{hotel.tagline}</p>}
            <p className="text-white/85 text-[13px] mt-1 font-medium"><span className="text-amber-300">{STAR(avgRating)}</span> · {reviews.length} review{reviews.length !== 1 && 's'}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 md:p-8 grid md:grid-cols-5 gap-6">
            {/* Left: hotel info */}
            <div className="md:col-span-3 space-y-5">
              {hotel.welcomeMessage && (
                <div className="rounded-2xl p-4 text-white shadow-sm" style={{ background: brandGradient(hotel) }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-85 mb-1">A note from the hotel</p>
                  <p className="text-[14px] leading-relaxed font-medium">{hotel.welcomeMessage}</p>
                </div>
              )}

              {hotel.description && <p className="text-stone-800 text-[14px] leading-relaxed font-medium">{hotel.description}</p>}

              {(hotel.galleryUrls || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Gallery</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                    {(hotel.galleryUrls || []).slice(0, 12).map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer" className="flex-shrink-0 snap-start">
                        <img src={u} alt="" loading="lazy" className="h-32 w-44 object-cover rounded-2xl bg-stone-100 border border-stone-200" onError={(e) => { (e.currentTarget.style.opacity = '0.2'); }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {hotel.address && (
                <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-1">Location</p>
                  <p className="text-stone-900 text-sm font-semibold">{hotel.address}</p>
                  <p className="text-stone-700 text-[13px]">{[hotel.city, hotel.country].filter(Boolean).join(', ')}</p>
                  {hotel.latitude != null && hotel.longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="inline-block mt-2 text-[12px] font-bold text-sky-700 hover:text-sky-900 underline"
                    >Open in Maps →</a>
                  )}
                </div>
              )}

              {(hotel.amenities || []).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(hotel.amenities || []).map(a => (
                      <span key={a} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                        {AMENITY_META[a]?.label || a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Pick a room</p>
                <div className="space-y-2">
                  {rooms.map(r => (
                    <RoomOption key={r.id} room={r} selected={roomId === r.id} onSelect={() => setRoomId(r.id)} />
                  ))}
                  {rooms.length === 0 && <p className="text-stone-700 text-sm">No rooms available right now.</p>}
                </div>
              </div>

              {addOns.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Add-ons</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {addOns.map(a => {
                      const on = selectedAddOnIds.includes(a.id);
                      return (
                        <button key={a.id} type="button" onClick={() => toggleAddOn(a.id)}
                          className={`text-left p-3 rounded-2xl border transition-all ${on ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-stone-900 text-[14px]">{a.name}</p>
                            <p className="text-stone-900 font-bold text-[13px] whitespace-nowrap">{formatMoney(a.priceCents)}{a.perPerson && <span className="text-stone-600 text-[11px] font-medium"> /person</span>}</p>
                          </div>
                          {a.description && <p className="text-stone-700 text-[12px] mt-1 leading-snug">{a.description}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(hotel.policies?.checkIn || hotel.policies?.checkOut || hotel.policies?.cancellation || hotel.policies?.children || hotel.policies?.pets) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">House policies</p>
                  <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {hotel.policies?.checkIn && <div><p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Check-in</p><p className="font-semibold text-stone-900">{hotel.policies.checkIn}</p></div>}
                    {hotel.policies?.checkOut && <div><p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Check-out</p><p className="font-semibold text-stone-900">{hotel.policies.checkOut}</p></div>}
                    {hotel.policies?.cancellation && <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Cancellation</p><p className="text-stone-800 leading-snug">{hotel.policies.cancellation}</p></div>}
                    {hotel.policies?.children && <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Children</p><p className="text-stone-800 leading-snug">{hotel.policies.children}</p></div>}
                    {hotel.policies?.pets && <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Pets</p><p className="text-stone-800 leading-snug">{hotel.policies.pets}</p></div>}
                  </div>
                </div>
              )}

              <HotelReviewsSection reviews={reviews} avgRating={avgRating} />

              {reviews.some(r => r.ownerResponse) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">From the hotel</p>
                  <div className="space-y-2">
                    {reviews.filter(r => r.ownerResponse).slice(0, 2).map(r => (
                      <div key={r.id} className="bg-sky-50 border border-sky-200 rounded-2xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 mb-1">Response to {r.guestName}'s {r.rating}★ review</p>
                        <p className="text-stone-800 text-[13px] leading-relaxed font-medium">"{r.ownerResponse}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: booking sidebar */}
            <form onSubmit={submit} className="md:col-span-2 bg-stone-50 border border-stone-200 rounded-2xl p-5 h-fit md:sticky md:top-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-stone-700">Reserve your stay</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Check in</span>
                  <input type="date" value={checkIn} min={todayISO()} onChange={e => setCheckIn(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Check out</span>
                  <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Adults</span>
                  <input type="number" min={1} value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Children</span>
                  <input type="number" min={0} value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </label>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Guest name" className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-400" />

              {/* Promo code (B5) */}
              {offers.length > 0 && (
                <div className="bg-white border border-dashed border-amber-300 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">Have a promo code?</p>
                  <div className="flex gap-2">
                    <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder={offers[0]?.code || 'CODE'} className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <button type="button" onClick={applyPromo} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-bold text-[12px] hover:bg-amber-600">Apply</button>
                  </div>
                  {promoMsg && <p className={`text-[11px] font-bold mt-1.5 ${appliedOffer ? 'text-emerald-700' : 'text-rose-700'}`}>{promoMsg}</p>}
                  <details className="mt-2">
                    <summary className="text-[10px] font-bold text-amber-700 cursor-pointer hover:text-amber-900">View {offers.length} active offer{offers.length !== 1 ? 's' : ''}</summary>
                    <div className="mt-2 space-y-1.5">
                      {offers.map(o => (
                        <button key={o.id} type="button" onClick={() => { setPromoCode(o.code); applyPromo(o.code); }}
                          className="w-full text-left bg-amber-50 border border-amber-200 rounded-lg p-2 hover:bg-amber-100 transition-colors">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="font-bold text-stone-900 text-[12px]">{o.title}</span>
                            <code className="font-mono font-bold text-amber-800 text-[11px]">{o.code}</code>
                          </div>
                          {o.description && <p className="text-[10px] text-stone-700 mt-0.5">{o.description}</p>}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              <div className="bg-white border border-stone-200 rounded-xl p-3">
                <div className="flex justify-between text-[12px] text-stone-700 font-medium">
                  <span>{room ? `${room.name} × ${nights} night${nights !== 1 ? 's' : ''}` : 'Pick a room'}</span>
                  <span>{room ? formatMoney(room.pricePerNightCents * nights) : '—'}</span>
                </div>
                {selectedAddOnIds.length > 0 && (
                  <div className="flex justify-between text-[12px] text-stone-700 font-medium mt-1">
                    <span>{selectedAddOnIds.length} add-on{selectedAddOnIds.length !== 1 ? 's' : ''}</span>
                    <span>{formatMoney(subtotalCents - (room ? room.pricePerNightCents * nights : 0))}</span>
                  </div>
                )}
                {discountCents > 0 && (
                  <div className="flex justify-between text-[12px] text-emerald-700 font-bold mt-1">
                    <span>Promo · {appliedOffer?.code}</span>
                    <span>-{formatMoney(discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between mt-2 pt-2 border-t border-stone-100">
                  <span className="font-bold text-stone-900">Total</span>
                  <span className="font-bold text-stone-900 text-lg">{formatMoney(totalCents)}</span>
                </div>
              </div>

              {error && <p className="text-red-700 text-[12px] font-bold">{error}</p>}

              <button type="submit" className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-glow hover:shadow-2xl transition-all" style={{ background: brandGradient(hotel) }}>
                {ctaLabel}
              </button>
              <p className="text-[10px] text-stone-600 text-center font-medium">Booking syncs instantly with the hotel.</p>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation overlay */}
      {confirmation && (
        <div className="fixed inset-0 z-[90] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onBooked}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-3xl">✓</div>
            <h3 className="font-display text-2xl text-stone-900 mb-1">Booking confirmed</h3>
            <p className="text-stone-700 text-sm font-medium mb-4">A confirmation has been sent to <strong>{confirmation.guestEmail}</strong></p>
            <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4 text-left mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-1">{hotel.name}</p>
              <p className="font-bold text-stone-900">{rooms.find(r => r.id === confirmation.roomId)?.name}</p>
              <p className="text-stone-700 text-[13px]">{confirmation.checkIn} → {confirmation.checkOut} · {confirmation.nightsCount} night{confirmation.nightsCount !== 1 ? 's' : ''}</p>
              <p className="text-stone-900 font-bold mt-2">{formatMoney(confirmation.totalCents)}</p>
            </div>
            <button onClick={onBooked} className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-700 transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- AI Concierge (D-tier) ----------------
function AIConciergePanel({ hotels, onPickHotel }: { hotels: DemoHotel[]; onPickHotel: (h: DemoHotel) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ matches: Array<{ hotelId: string; reason: string }>; advice: string } | null>(null);
  const [err, setErr] = useState('');

  const ask = async () => {
    if (!query.trim()) return;
    setBusy(true); setErr(''); setResult(null);
    try {
      const r = await api.post('/api/ai-concierge/recommend', {
        query: query.trim(),
        maxBudgetUsd: budget ? Number(budget) : undefined,
      });
      setResult({ matches: r.matches || [], advice: r.advice || '' });
    } catch (e: any) { setErr(e?.message || 'Could not reach concierge'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mb-6">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all">
          <span className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">✨</span>
          <div className="flex-1 text-left">
            <p className="font-bold">Ask the AI Concierge</p>
            <p className="text-[12px] text-white/85">"Beach hotel under $300 with a pool" — get instant tailored picks.</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest bg-white/15 px-3 py-1.5 rounded-full">Try it</span>
        </button>
      ) : (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 border border-sky-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center">✨</div>
              <p className="font-display text-xl text-stone-900">AI Concierge</p>
            </div>
            <button onClick={() => { setOpen(false); setResult(null); setErr(''); }} className="text-stone-600 hover:text-stone-900 text-sm font-bold">✕ Close</button>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(); }}
              placeholder='e.g. "Romantic beach hotel with a spa for two"'
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input value={budget} onChange={e => setBudget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Max $/night"
              className="md:w-36 px-4 py-3 rounded-2xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button onClick={ask} disabled={busy || !query.trim()}
              className="px-6 py-3 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 disabled:opacity-40">
              {busy ? 'Thinking…' : 'Find hotels'}
            </button>
          </div>
          {err && <p className="text-rose-700 text-[12px] font-bold mt-3">{err}</p>}
          {result && (
            <div className="mt-4 space-y-3">
              {result.advice && <p className="text-[13px] text-stone-700 italic">{result.advice}</p>}
              {result.matches.length === 0 ? (
                <p className="text-sm text-stone-700">No matches yet — try broader keywords.</p>
              ) : result.matches.map(m => {
                const h = hotels.find(x => x.id === m.hotelId);
                if (!h) return null;
                return (
                  <button key={m.hotelId} onClick={() => onPickHotel(h)}
                    className="w-full text-left flex gap-3 items-start p-3 rounded-2xl bg-white border border-stone-200 hover:border-sky-400 hover:shadow-md transition-all">
                    <div className="w-16 h-16 rounded-xl bg-cover bg-center bg-stone-100 flex-shrink-0" style={h.heroImageUrl ? { backgroundImage: `url('${h.heroImageUrl}')` } : {}} />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base text-stone-900">{h.name}</p>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-600">{[h.city, h.country].filter(Boolean).join(' · ')}</p>
                      <p className="text-[12px] text-stone-700 mt-1">{m.reason}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- My booking card with review CTA (B7) ----------------
function MyBookingCard({ booking, onReviewed }: { booking: DemoHotelBooking & { hotelName: string; roomName: string }; onReviewed: () => void; key?: React.Key }) {
  const session = useSession();
  const [showReview, setShowReview] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!booking.guestEmail) return;
    api.get(`/api/hotel-messages?hotelId=${encodeURIComponent(booking.hotelId)}&guestEmail=${encodeURIComponent(booking.guestEmail)}&bookingId=${encodeURIComponent(booking.id)}`)
      .then((m: any[]) => setUnread((m || []).filter(x => x.sender === 'hotel' && !x.readByGuest).length))
      .catch(() => {});
  }, [booking.hotelId, booking.guestEmail, booking.id]);
  const isPast = new Date(booking.checkOut) <= new Date();
  const canReview = isPast && booking.status !== 'cancelled';

  useEffect(() => {
    const reviews = db_listReviews(booking.hotelId);
    const email = (booking.guestEmail || '').toLowerCase();
    setHasReviewed(reviews.some(r => (r.guestEmail || '').toLowerCase() === email && r.bookingId === booking.id));
  }, [booking.hotelId, booking.id, booking.guestEmail]);

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : booking.status === 'pending' ? 'bg-amber-100 text-amber-800' : booking.status === 'completed' || isPast ? 'bg-sky-100 text-sky-800' : 'bg-stone-100 text-stone-700'}`}>{isPast && booking.status !== 'cancelled' ? 'completed' : booking.status}</span>
          <span className="text-stone-900 font-bold text-sm">{formatMoney(booking.totalCents)}</span>
        </div>
        <p className="font-display text-lg text-stone-900 leading-tight">{booking.hotelName}</p>
        <p className="text-stone-700 text-[13px] font-medium">{booking.roomName}</p>
        <p className="text-stone-600 text-[12px] mt-2">{booking.checkIn} → {booking.checkOut} · {booking.nightsCount} {booking.nightsCount === 1 ? 'night' : 'nights'} · {booking.adults} adult{booking.adults !== 1 && 's'}{booking.children ? ` + ${booking.children}` : ''}</p>
        {canReview && !hasReviewed && (
          <button onClick={() => setShowReview(true)} className="mt-3 w-full py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px] font-bold hover:bg-amber-100 transition-colors">★ Leave a review</button>
        )}
        {hasReviewed && <p className="mt-3 text-[11px] font-bold text-emerald-700 text-center">✓ Review submitted</p>}
        {booking.guestEmail && (
          <button onClick={() => { setShowChat(true); setUnread(0); }} className="mt-2 w-full py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[12px] font-bold hover:bg-sky-100 transition-colors flex items-center justify-center gap-2">
            💬 Message hotel {unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">{unread}</span>}
          </button>
        )}
      </div>
      {showChat && booking.guestEmail && (
        <GuestMessageThread hotelId={booking.hotelId} hotelName={booking.hotelName}
          bookingId={booking.id} guestEmail={booking.guestEmail}
          guestName={booking.guestName || session?.user?.name || 'Guest'}
          onClose={() => setShowChat(false)} />
      )}
      {showReview && (
        <ReviewModal
          hotelId={booking.hotelId}
          hotelName={booking.hotelName}
          bookingId={booking.id}
          guestName={booking.guestName || session?.user?.name || 'Guest'}
          guestEmail={booking.guestEmail}
          onClose={() => setShowReview(false)}
          onPosted={() => { setShowReview(false); setHasReviewed(true); onReviewed(); }}
        />
      )}
    </>
  );
}

// ---------------- Guest ↔ hotel chat thread (A3) ----------------
type GuestMsg = { id: string; sender: 'guest'|'hotel'; body: string; createdAt: number };
function GuestMessageThread({ hotelId, hotelName, bookingId, guestEmail, guestName, onClose }: {
  hotelId: string; hotelName: string; bookingId: string; guestEmail: string; guestName: string; onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<GuestMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const m = await api.get(`/api/hotel-messages?hotelId=${encodeURIComponent(hotelId)}&guestEmail=${encodeURIComponent(guestEmail)}&bookingId=${encodeURIComponent(bookingId)}`);
      setMsgs((m || []).map((x: any) => ({ id: x.id, sender: x.sender, body: x.body, createdAt: x.createdAt })));
      await api.patch('/api/hotel-messages/mark-read', { hotelId, guestEmail, side: 'guest' });
    } catch {}
  };
  useEffect(() => { load(); }, [hotelId, guestEmail]);

  useEffect(() => {
    let alive = true;
    const es = new EventSource(`${apiBase}/api/hotel-messages/stream?hotelId=${encodeURIComponent(hotelId)}&guestEmail=${encodeURIComponent(guestEmail)}&bookingId=${encodeURIComponent(bookingId)}`);
    es.onmessage = (evt) => {
      if (!alive) return;
      try {
        const m = JSON.parse(evt.data);
        setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, { id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt }]);
      } catch {}
    };
    return () => { alive = false; es.close(); };
  }, [hotelId, guestEmail]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const m = await api.post('/api/hotel-messages', {
        hotelId, bookingId, guestEmail, guestName, sender: 'guest', body: draft.trim(),
      });
      if (m && m.id) setMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, { id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt }]);
      setDraft('');
    } catch (e: any) { toast.error('Could not send: ' + (e?.message || 'unknown')); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-stone-950/70 backdrop-blur-md flex items-end md:items-center justify-center md:p-6" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Concierge chat</p>
            <p className="font-display text-lg text-stone-900">{hotelName}</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-xl">✕</button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-cream-50 min-h-[280px]">
          {msgs.length === 0 && <p className="text-center text-sm text-stone-600 mt-8">Send a message — early check-in, restaurant reservations, transfers… the team will reply here.</p>}
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.sender === 'guest' ? 'bg-sky-500 text-white' : 'bg-white border border-stone-200 text-stone-900'}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <p className={`text-[10px] mt-1 ${m.sender === 'guest' ? 'text-sky-100' : 'text-stone-500'}`}>{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-stone-200 flex gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…" className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <button onClick={send} disabled={!draft.trim() || sending} className="px-5 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 disabled:opacity-40">{sending ? '…' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ hotelId, hotelName, bookingId, guestName, guestEmail, onClose, onPosted }: {
  hotelId: string; hotelName: string; bookingId: string;
  guestName: string; guestEmail?: string;
  onClose: () => void; onPosted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const onPhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = 3 - photos.length;
    if (room <= 0) { toast.info('Up to 3 photos per review.'); return; }
    const next: string[] = [];
    for (const f of files.slice(0, room)) {
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} is over 8 MB`); continue; }
      try { next.push(await fileToResizedDataUrl(f, 1280, 0.82)); }
      catch { toast.error(`Could not read ${f.name}`); }
    }
    if (next.length) setPhotos(prev => [...prev, ...next]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) { setErr('Please share a few words about your stay.'); return; }
    setBusy(true); setErr('');
    try {
      db_addReview({ hotelId, bookingId, guestName, guestEmail, rating, comment: comment.trim(), photoUrls: photos });
      onPosted();
    } catch (e: any) { setErr(e?.message || 'Could not post review'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div>
          <h3 className="font-display text-2xl text-stone-900">Review your stay</h3>
          <p className="text-stone-700 text-sm font-medium mt-0.5">{hotelName}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Your rating</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl transition-transform hover:scale-110 ${n <= rating ? 'text-amber-500' : 'text-stone-300'}`}>★</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Your review</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" placeholder="What did you love? Anything to improve?" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700 mb-2">Photos <span className="text-stone-500 normal-case tracking-normal font-medium">(optional · up to 3)</span></p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 group">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-stone-900/80 text-white flex items-center justify-center text-xs hover:bg-rose-600">×</button>
              </div>
            ))}
            {photos.length < 3 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-300 hover:border-sky-400 hover:bg-sky-50 flex flex-col items-center justify-center cursor-pointer text-stone-500 hover:text-sky-600 transition-colors">
                <span className="text-xl leading-none">+</span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotoFiles} />
              </label>
            )}
          </div>
        </div>
        {err && <p className="text-rose-700 text-[12px] font-bold">{err}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-800 font-bold text-sm hover:bg-stone-200 transition-colors">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>{busy ? 'Posting…' : 'Post review'}</button>
        </div>
      </form>
    </div>
  );
}

function RoomOption({ room, selected, onSelect }: { room: DemoHotelRoom; selected: boolean; onSelect: () => void; key?: React.Key }) {
  const extraImages = (room.imageUrls || []).slice(1, 4);
  return (
    <button type="button" onClick={onSelect}
      className={`w-full text-left p-3 rounded-2xl border transition-all ${selected ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
      <div className="flex gap-3 items-center">
        <div className="w-20 h-16 rounded-xl bg-cover bg-center bg-stone-100 flex-shrink-0" style={room.imageUrls?.[0] ? { backgroundImage: `url('${room.imageUrls[0]}')` } : {}} />
        <div className="flex-1 min-w-0">
          <p className="font-display text-base text-stone-900 leading-tight">{room.name}</p>
          <p className="text-stone-700 text-[12px] font-medium">Sleeps {room.capacityAdults}{room.capacityChildren ? ` + ${room.capacityChildren}` : ''}</p>
          {(room.amenities || []).length > 0 && (
            <p className="text-stone-600 text-[11px] mt-0.5 truncate">{(room.amenities || []).slice(0, 4).join(' · ')}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-stone-900">{formatMoney(room.pricePerNightCents)}</p>
          <p className="text-stone-600 text-[11px] font-medium">/ night</p>
        </div>
      </div>
      {selected && (extraImages.length > 0 || room.description) && (
        <div className="mt-3 pt-3 border-t border-sky-200/60 space-y-2">
          {extraImages.length > 0 && (
            <div className="flex gap-1.5">
              {extraImages.map((u, i) => (
                <img key={i} src={u} alt="" className="h-14 w-20 object-cover rounded-lg bg-stone-100 flex-shrink-0" onError={(e) => { (e.currentTarget.style.opacity = '0.2'); }} />
              ))}
            </div>
          )}
          {room.description && <p className="text-stone-700 text-[12px] leading-snug">{room.description}</p>}
        </div>
      )}
    </button>
  );
}
