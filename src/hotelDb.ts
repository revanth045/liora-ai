// Liora — Hotel demo database (localStorage-backed). Mirrors the demoDb pattern.
// Used by HotelPortal + (eventually) the consumer-side hotel browser.

export type HotelAmenity =
  | 'wifi' | 'parking' | 'pool' | 'spa' | 'gym' | 'restaurant'
  | 'bar' | 'concierge' | 'laundry' | 'pet_friendly' | 'beach' | 'airport_shuttle';

export type DemoHotel = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  starRating?: number;          // 1..5
  amenities?: HotelAmenity[];
  heroImageUrl?: string;
  galleryUrls?: string[];
  logoUrl?: string;
  tagline?: string;
  welcomeMessage?: string;
  ctaLabel?: string;              // e.g. "Reserve your stay" — shown on consumer booking CTA
  brandColor?: string;
  accentColor?: string;
  fontStyle?: 'modern' | 'classic' | 'playful'; // hero/title font family on consumer view
  policies?: {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    children?: string;
    pets?: string;
  };
  createdAt: number;
  updatedAt: number;
  /** Admin lifecycle. Defaults to 'active' for legacy rows; new owner sign-ups become 'pending'. */
  status?: 'pending' | 'active' | 'blocked';
  blockedReason?: string;
  /** Code shared with hotel front-desk staff so they can register their portal account. */
  frontDeskCode?: string;
  bankingDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
    swift?: string;
    country?: string;
    payoutEmail?: string;
    verified?: boolean;
    updatedAt?: number;
  };
};

export type RoomType = 'single' | 'double' | 'twin' | 'deluxe' | 'suite' | 'penthouse' | 'family';

export type DemoHotelRoom = {
  id: string;
  hotelId: string;
  name: string;                 // e.g. "Garden Deluxe"
  type: RoomType;
  description?: string;
  pricePerNightCents: number;
  capacityAdults: number;
  capacityChildren: number;
  totalUnits: number;           // inventory
  amenities?: string[];
  imageUrls?: string[];
  active: boolean;
};

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type DemoHotelBooking = {
  id: string;
  hotelId: string;
  roomId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: string;              // ISO date
  checkOut: string;             // ISO date
  adults: number;
  children: number;
  nightsCount: number;
  totalCents: number;
  status: BookingStatus;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  addOnIds?: string[];
  notes?: string;
  createdAt: number;
};

export type DemoHotelAddOn = {
  id: string;
  hotelId: string;
  name: string;                 // "Breakfast", "Airport pickup", "Spa session"
  description?: string;
  priceCents: number;
  perPerson?: boolean;
  active: boolean;
};

export type DemoHotelReview = {
  id: string;
  hotelId: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  rating: number;               // 1..5
  comment: string;
  photoUrls?: string[];
  createdAt: number;
  ownerResponse?: string;
  ownerResponseAt?: number;
};

const HKEY  = 'liora_demo_hotels';
const RKEY  = 'liora_demo_hotel_rooms';
const BKEY  = 'liora_demo_hotel_bookings';
const AKEY  = 'liora_demo_hotel_addons';
const RVKEY = 'liora_demo_hotel_reviews';

import { syncListChange } from './lib/dataSync';

const read = <T>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } };
const write = (k: string, v: any) => {
  localStorage.setItem(k, JSON.stringify(v));
  // Fire-and-forget write-through to the Neon-backed API.
  if (Array.isArray(v)) syncListChange(k, v);
};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- Hotels ----------
export function db_listHotels(): DemoHotel[] {
  return read<DemoHotel[]>(HKEY, []).filter(h => (h.status ?? 'active') === 'active');
}
export function db_getHotelsByOwner(ownerId: string): DemoHotel[] {
  return read<DemoHotel[]>(HKEY, []).filter(h => h.ownerId === ownerId);
}
export function db_getHotel(id: string): DemoHotel | null {
  return read<DemoHotel[]>(HKEY, []).find(h => h.id === id) || null;
}
export function db_upsertHotel(h: DemoHotel): DemoHotel {
  const all = read<DemoHotel[]>(HKEY, []);
  const idx = all.findIndex(x => x.id === h.id);
  const row = { ...h, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = row; else all.push(row);
  write(HKEY, all);
  return row;
}
export function db_createHotel(ownerId: string, name: string): DemoHotel {
  const h: DemoHotel = {
    id: uid(),
    ownerId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    starRating: 4,
    amenities: ['wifi', 'parking', 'concierge'],
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation up to 48 hours before check-in.',
    },
    heroImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=85',
    frontDeskCode: genFrontDeskCode(),
  };
  return db_upsertHotel(h);
}

/** Generate a short, human-friendly front-desk access code (e.g. "FD-7K3X9P"). */
export function genFrontDeskCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return 'FD-' + s;
}

/** Find a hotel by its front-desk code (used by front-desk sign-up). */
export function db_findHotelByFrontDeskCode(code: string): DemoHotel | undefined {
  const c = code.trim().toUpperCase();
  if (!c) return undefined;
  return read<DemoHotel[]>(HKEY, []).find(h => (h.frontDeskCode || '').toUpperCase() === c);
}

/** Look up a hotel by id (used by FrontDeskPortal session). */
export function db_getHotelById(id: string): DemoHotel | undefined {
  return read<DemoHotel[]>(HKEY, []).find(h => h.id === id);
}

/** Ensure a hotel has a front-desk code, generating one lazily for legacy rows. */
export function db_ensureFrontDeskCode(hotel: DemoHotel): DemoHotel {
  if (hotel.frontDeskCode) return hotel;
  const updated = { ...hotel, frontDeskCode: genFrontDeskCode() };
  return db_upsertHotel(updated);
}
export function db_deleteHotel(id: string) {
  write(HKEY, read<DemoHotel[]>(HKEY, []).filter(h => h.id !== id));
  write(RKEY, read<DemoHotelRoom[]>(RKEY, []).filter(r => r.hotelId !== id));
  write(BKEY, read<DemoHotelBooking[]>(BKEY, []).filter(b => b.hotelId !== id));
  write(AKEY, read<DemoHotelAddOn[]>(AKEY, []).filter(a => a.hotelId !== id));
  write(RVKEY, read<DemoHotelReview[]>(RVKEY, []).filter(r => r.hotelId !== id));
}

// ---------- Rooms ----------
export function db_listRooms(hotelId: string): DemoHotelRoom[] {
  return read<DemoHotelRoom[]>(RKEY, []).filter(r => r.hotelId === hotelId);
}
export function db_upsertRoom(r: DemoHotelRoom): DemoHotelRoom {
  const all = read<DemoHotelRoom[]>(RKEY, []);
  const idx = all.findIndex(x => x.id === r.id);
  if (idx >= 0) all[idx] = r; else all.push(r);
  write(RKEY, all);
  return r;
}
export function db_deleteRoom(id: string) {
  write(RKEY, read<DemoHotelRoom[]>(RKEY, []).filter(r => r.id !== id));
}

// ---------- Bookings ----------
export function db_listBookings(hotelId: string): DemoHotelBooking[] {
  return read<DemoHotelBooking[]>(BKEY, [])
    .filter(b => b.hotelId === hotelId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function db_addBooking(b: Omit<DemoHotelBooking, 'id' | 'createdAt'>): DemoHotelBooking {
  const all = read<DemoHotelBooking[]>(BKEY, []);
  const row: DemoHotelBooking = { ...b, id: uid(), createdAt: Date.now() };
  all.push(row);
  write(BKEY, all);
    try {
    const hotels = read<DemoHotel[]>(HKEY, []);
    const h = hotels.find(x => x.id === b.hotelId);
    // Also push to the hotel-side notification feed (Front Desk + Owner SSE)
    try {
      fetch('/api/hotel-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: b.hotelId,
          kind: 'booking_placed',
          title: `New booking · ${b.guestName}`,
          body: `${b.checkIn} → ${b.checkOut} · ${b.nightsCount} night${b.nightsCount === 1 ? '' : 's'} · $${(b.totalCents / 100).toFixed(2)}`,
          meta: { bookingId: row.id, guestName: b.guestName, guestEmail: b.guestEmail, checkIn: b.checkIn, checkOut: b.checkOut, totalCents: b.totalCents },
        }),
      }).catch(() => {});
    } catch {}
    import('./lib/adminNotifications').then(mod => {
      mod.adminNotify({
        kind: 'booking_placed',
        venueId: b.hotelId,
        venueName: h?.name || 'Unknown hotel',
        venueType: 'hotel',
        amountCents: b.totalCents,
        meta: {
          bookingId: row.id,
          guestName: b.guestName,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          bankingOnFile: !!(h?.bankingDetails?.accountNumber || h?.bankingDetails?.iban),
        },
      });
    }).catch(() => {});
  } catch {}
  return row;
}
export function db_updateBookingStatus(id: string, status: BookingStatus) {
  const all = read<DemoHotelBooking[]>(BKEY, []);
  const idx = all.findIndex(x => x.id === id);
  if (idx >= 0) { all[idx].status = status; write(BKEY, all); }
}
export function db_deleteBooking(id: string) {
  write(BKEY, read<DemoHotelBooking[]>(BKEY, []).filter(b => b.id !== id));
}

// ---------- Add-ons ----------
export function db_listAddOns(hotelId: string): DemoHotelAddOn[] {
  return read<DemoHotelAddOn[]>(AKEY, []).filter(a => a.hotelId === hotelId);
}
export function db_upsertAddOn(a: DemoHotelAddOn): DemoHotelAddOn {
  const all = read<DemoHotelAddOn[]>(AKEY, []);
  const idx = all.findIndex(x => x.id === a.id);
  if (idx >= 0) all[idx] = a; else all.push(a);
  write(AKEY, all);
  return a;
}
export function db_deleteAddOn(id: string) {
  write(AKEY, read<DemoHotelAddOn[]>(AKEY, []).filter(a => a.id !== id));
}

// ---------- Reviews ----------
export function db_listReviews(hotelId: string): DemoHotelReview[] {
  return read<DemoHotelReview[]>(RVKEY, [])
    .filter(r => r.hotelId === hotelId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function db_addReview(r: Omit<DemoHotelReview, 'id' | 'createdAt'>): DemoHotelReview {
  const all = read<DemoHotelReview[]>(RVKEY, []);
  const row: DemoHotelReview = { ...r, id: uid(), createdAt: Date.now() };
  all.push(row);
  write(RVKEY, all);
  return row;
}
export function db_respondReview(id: string, response: string) {
  const all = read<DemoHotelReview[]>(RVKEY, []);
  const idx = all.findIndex(x => x.id === id);
  if (idx >= 0) {
    all[idx].ownerResponse = response;
    all[idx].ownerResponseAt = Date.now();
    write(RVKEY, all);
  }
}

// ---------- Helpers ----------
export const newRoomId    = () => 'rm_' + uid();
export const newAddOnId   = () => 'ax_' + uid();
export const formatMoney  = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const nightsBetween = (ci: string, co: string) => {
  const a = new Date(ci).getTime();
  const b = new Date(co).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
};

// ---------- Seed ----------
export function db_seedHotelIfEmpty(ownerId: string, fallbackName = 'Liora Grand Hotel', initialStatus: 'pending' | 'active' | 'blocked' = 'pending') {
  const owned = db_getHotelsByOwner(ownerId);
  if (owned.length > 0) return owned[0];
  const created = db_createHotel(ownerId, fallbackName);
  const h = db_upsertHotel({ ...created, status: initialStatus });
  // Seed rooms
  const sampleRooms: Omit<DemoHotelRoom, 'id' | 'hotelId'>[] = [
    { name: 'Garden Suite',     type: 'suite',   description: 'Spacious suite overlooking the garden', pricePerNightCents: 38000, capacityAdults: 2, capacityChildren: 2, totalUnits: 4, amenities: ['King bed','Balcony','Bathtub'], imageUrls: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85'], active: true },
    { name: 'Ocean Deluxe',     type: 'deluxe',  description: 'Panoramic ocean view',                  pricePerNightCents: 48000, capacityAdults: 2, capacityChildren: 1, totalUnits: 6, amenities: ['King bed','Sea view','Mini bar'],  imageUrls: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=85'], active: true },
    { name: 'Penthouse Liora',  type: 'penthouse',description:'Top-floor penthouse with private terrace',pricePerNightCents:148000,capacityAdults: 4, capacityChildren: 2, totalUnits: 1, amenities: ['Terrace','Jacuzzi','Butler service'],imageUrls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85'], active: true },
    { name: 'Classic Double',   type: 'double',  description: 'Comfortable double room',               pricePerNightCents: 22000, capacityAdults: 2, capacityChildren: 0, totalUnits: 12, amenities: ['Queen bed','Work desk'],            imageUrls: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85'], active: true },
  ];
  sampleRooms.forEach(r => db_upsertRoom({ ...r, id: newRoomId(), hotelId: h.id }));

  // Seed add-ons
  const addOns: Omit<DemoHotelAddOn, 'id' | 'hotelId'>[] = [
    { name: 'Continental Breakfast', description: 'Daily breakfast in-room or at the lounge', priceCents: 3500, perPerson: true, active: true },
    { name: 'Airport Pickup',         description: 'Premium sedan service from the airport',   priceCents: 12000, perPerson: false, active: true },
    { name: 'Signature Spa Ritual',   description: '60-minute couples wellness ritual',         priceCents: 22000, perPerson: false, active: true },
  ];
  addOns.forEach(a => db_upsertAddOn({ ...a, id: newAddOnId(), hotelId: h.id }));

  // Seed reviews
  db_addReview({ hotelId: h.id, guestName: 'Anna L.',  rating: 5, comment: 'Impeccable service and breathtaking views.' });
  db_addReview({ hotelId: h.id, guestName: 'Marcus R.', rating: 4, comment: 'Beautiful property, breakfast was outstanding.' });
  db_addReview({ hotelId: h.id, guestName: 'Yuki S.',   rating: 5, comment: 'A truly elevated experience from arrival to departure.' });

  // Seed bookings
  const rooms = db_listRooms(h.id);
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  if (rooms[0]) {
    db_addBooking({ hotelId: h.id, roomId: rooms[0].id, guestName: 'Sofia Vento',  guestEmail: 'sofia@liora.demo', checkIn: iso(addDays(today, 2)),  checkOut: iso(addDays(today, 5)),  adults: 2, children: 0, nightsCount: 3, totalCents: rooms[0].pricePerNightCents * 3, status: 'confirmed', paymentStatus: 'paid' });
  }
  if (rooms[1]) {
    db_addBooking({ hotelId: h.id, roomId: rooms[1].id, guestName: 'Henrik Olsen', guestEmail: 'henrik@liora.demo', checkIn: iso(addDays(today, -3)), checkOut: iso(addDays(today, -1)), adults: 2, children: 1, nightsCount: 2, totalCents: rooms[1].pricePerNightCents * 2, status: 'completed', paymentStatus: 'paid' });
  }
  if (rooms[2]) {
    db_addBooking({ hotelId: h.id, roomId: rooms[2].id, guestName: 'James Whitfield',guestEmail:'james@liora.demo',checkIn: iso(addDays(today, 10)), checkOut: iso(addDays(today, 14)),adults: 4, children: 0, nightsCount: 4, totalCents: rooms[2].pricePerNightCents * 4, status: 'pending', paymentStatus: 'pending' });
  }
  return h;
}

// ---------- Demo hotels (consumer-side catalog) ----------
// Stable owner IDs so that when a demo hotel owner signs in, they "own" the
// same hotel record consumers are booking against — bookings flow through
// instantly to the hotel portal's Bookings tab.
export const DEMO_HOTEL_DIRECTORY: Array<{
  email: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  starRating: number;
  amenities: HotelAmenity[];
  heroImageUrl: string;
  galleryUrls: string[];
  brandColor: string;
  phone: string;
  tagline: string;
}> = [
  {
    email: 'grand@liora.demo', ownerId: 'demo_owner_grand', ownerName: 'Mr. Alaric',
    name: 'Liora Grand Resort',
    tagline: 'Beachfront · 5★',
    description: 'A flagship overwater resort on the Indian Ocean — private villas, infinity pools and Michelin-grade cuisine just steps from the lagoon.',
    address: 'Maafushivaru Atoll, North Malé', city: 'Malé', country: 'Maldives', postalCode: '20026',
    latitude: 4.1755, longitude: 73.5093,
    starRating: 5, amenities: ['wifi','pool','spa','gym','restaurant','bar','concierge','beach','airport_shuttle'],
    heroImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200&q=85',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=85',
    ],
    brandColor: '#0ea5e9', phone: '+960 400 7700',
  },
  {
    email: 'aspen@liora.demo', ownerId: 'demo_owner_aspen', ownerName: 'Ms. Helena',
    name: 'Aspen Pines Lodge',
    tagline: 'Alpine retreat',
    description: 'A timber-and-stone alpine lodge in the Rockies — fireside lounges, ski-in/ski-out access and a heated outdoor pool under the stars.',
    address: '3120 Maroon Creek Road', city: 'Aspen', country: 'United States', postalCode: '81611',
    latitude: 39.1911, longitude: -106.8175,
    starRating: 5, amenities: ['wifi','parking','pool','spa','gym','restaurant','bar','concierge','pet_friendly'],
    heroImageUrl: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200&q=85',
      'https://images.unsplash.com/photo-1502780402662-acc01917738e?w=1200&q=85',
      'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=1200&q=85',
    ],
    brandColor: '#0f766e', phone: '+1 970 925 1100',
  },
  {
    email: 'skyline@liora.demo', ownerId: 'demo_owner_skyline', ownerName: 'Mr. Carter',
    name: 'Manhattan Skyline Hotel',
    tagline: 'Urban luxury',
    description: 'A 42-story art-deco landmark in midtown Manhattan — rooftop bar, private screening room and unobstructed Central Park views.',
    address: '550 Madison Avenue', city: 'New York', country: 'United States', postalCode: '10022',
    latitude: 40.7616, longitude: -73.9737,
    starRating: 5, amenities: ['wifi','parking','gym','restaurant','bar','concierge','laundry'],
    heroImageUrl: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=85',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85',
      'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=1200&q=85',
    ],
    brandColor: '#1e293b', phone: '+1 212 555 0142',
  },
  {
    email: 'coral@liora.demo', ownerId: 'demo_owner_coral', ownerName: 'Ms. Liana',
    name: 'Coral Bay Boutique',
    tagline: 'Private island',
    description: 'A 14-suite boutique hideaway on a private cove in Bali — open-air pavilions, beach bonfire dinners and a cliffside spa.',
    address: 'Jl. Pantai Bingin, Pecatu', city: 'Bali', country: 'Indonesia', postalCode: '80361',
    latitude: -8.8067, longitude: 115.1039,
    starRating: 4, amenities: ['wifi','pool','spa','restaurant','bar','concierge','beach','pet_friendly'],
    heroImageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1800&q=85',
    galleryUrls: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=85',
      'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=1200&q=85',
      'https://images.unsplash.com/photo-1505881502353-a1986add3762?w=1200&q=85',
    ],
    brandColor: '#f97316', phone: '+62 361 7472 100',
  },
];

export function db_findDemoHotelOwnerByEmail(email: string) {
  return DEMO_HOTEL_DIRECTORY.find(d => d.email.toLowerCase() === email.toLowerCase()) || null;
}

/** One-time migration: any demo hotel user that was created before stable
 * owner IDs existed gets re-pointed at the canonical demo owner ID, and any
 * hotel rows they own are merged onto that ID so consumer bookings sync. */
export function db_migrateDemoHotelOwners() {
  try {
    const UKEY = 'liora_demo_users';
    const usersRaw = localStorage.getItem(UKEY);
    if (!usersRaw) return;
    const users: Array<{ id: string; email: string; role: string }> = JSON.parse(usersRaw);
    let usersChanged = false;
    DEMO_HOTEL_DIRECTORY.forEach(d => {
      const u = users.find(x => x.email.toLowerCase() === d.email.toLowerCase() && x.role === 'hotel_owner');
      if (!u || u.id === d.ownerId) return;
      const oldId = u.id;
      u.id = d.ownerId; usersChanged = true;
      // Re-point any hotel rows from the old owner ID to the canonical one.
      const allHotels = db_listHotels();
      const oldHotels = allHotels.filter(h => h.ownerId === oldId);
      const stableExists = allHotels.some(h => h.ownerId === d.ownerId);
      if (oldHotels.length && !stableExists) {
        oldHotels.forEach(h => db_upsertHotel({ ...h, ownerId: d.ownerId }));
      } else if (oldHotels.length && stableExists) {
        // Stable hotel already exists — drop the duplicates owned by the old ID.
        oldHotels.forEach(h => db_deleteHotel(h.id));
      }
    });
    if (usersChanged) localStorage.setItem(UKEY, JSON.stringify(users));
  } catch {}
}

/** Idempotent: ensures all four demo hotels exist with full location, photos,
 * rooms, add-ons, reviews and a few sample bookings. Safe to call on every
 * page mount. */
export function db_seedAllDemoHotels() {
  db_migrateDemoHotelOwners();
  DEMO_HOTEL_DIRECTORY.forEach(d => {
    const existing = db_getHotelsByOwner(d.ownerId)[0];
    if (existing) {
      // Backfill any newer location fields if a previous seed missed them.
      if (!existing.city || !existing.country || existing.latitude == null) {
        db_upsertHotel({
          ...existing,
          description: d.description, address: d.address,
          city: d.city, country: d.country, postalCode: d.postalCode,
          latitude: d.latitude, longitude: d.longitude,
          starRating: d.starRating, amenities: d.amenities,
          heroImageUrl: d.heroImageUrl, galleryUrls: d.galleryUrls,
          brandColor: d.brandColor, phone: d.phone, email: d.email,
        });
      } else if (!existing.postalCode && d.postalCode) {
        // Backfill the postal code on already-seeded hotels so the date-night
        // proximity matcher has data to work with on existing installs.
        db_upsertHotel({ ...existing, postalCode: d.postalCode });
      }
      return;
    }
    // First-time seed (demo venues are pre-approved → active)
    const h = db_seedHotelIfEmpty(d.ownerId, d.name, 'active');
    db_upsertHotel({
      ...h,
      status: 'active',
      description: d.description, address: d.address,
      city: d.city, country: d.country, postalCode: d.postalCode,
      latitude: d.latitude, longitude: d.longitude,
      starRating: d.starRating, amenities: d.amenities,
      heroImageUrl: d.heroImageUrl, galleryUrls: d.galleryUrls,
      brandColor: d.brandColor, phone: d.phone, email: d.email,
    });
  });
}


// ===== Admin / Super-Admin helpers =====
export function db_adminListHotels(): DemoHotel[] {
  return read<DemoHotel[]>(HKEY, []);
}
export function db_listActiveHotels(): DemoHotel[] {
  return read<DemoHotel[]>(HKEY, []).filter(h => (h.status ?? 'active') === 'active');
}
export function db_setHotelStatus(id: string, status: 'pending' | 'active' | 'blocked', blockedReason?: string) {
  const all = read<DemoHotel[]>(HKEY, []);
  const i = all.findIndex(h => h.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], status, blockedReason: status === 'blocked' ? blockedReason : undefined, updatedAt: Date.now() };
    write(HKEY, all);
  }
}
export function db_setHotelBanking(id: string, banking: NonNullable<DemoHotel['bankingDetails']>) {
  const all = read<DemoHotel[]>(HKEY, []);
  const i = all.findIndex(h => h.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], bankingDetails: { ...banking, updatedAt: Date.now() }, updatedAt: Date.now() };
    write(HKEY, all);
  }
}
