import React, { useMemo, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  type DemoHotel,
  db_listHotels, db_listRooms, db_listReviews,
  formatMoney,
} from '../../../hotelDb';
import { HotelDetail } from './HotelsHub';

// US-style ZIP prefix scoring. Counts how many leading characters match —
// US ZIPs share the first 3 digits within ~50 miles, first digit within a
// state group. Works on any alphanumeric postal code as a fallback.
function zipScore(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const x = a.replace(/\D/g, '');
  const y = b.replace(/\D/g, '');
  if (!x || !y) return 0;
  let n = 0;
  const max = Math.min(x.length, y.length, 5);
  while (n < max && x[n] === y[n]) n++;
  return n;
}

function distanceLabel(score: number): { label: string; tone: string } {
  if (score >= 5) return { label: 'Same neighborhood', tone: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (score >= 3) return { label: 'Just minutes away',  tone: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (score >= 1) return { label: 'In your region',      tone: 'bg-sky-100 text-sky-700 border-sky-200' };
  return                 { label: 'Liora pick',           tone: 'bg-stone-100 text-stone-700 border-stone-200' };
}

const FLIRTY_LINES = [
  "Don't let the night end at dessert. ✨",
  "Make tonight one you'll both remember.",
  "Why Uber home when you could stay a little longer?",
  "Two of you. One unforgettable evening.",
  "Trade the commute for a candlelit nightcap.",
];

export function DateNightModal({
  restaurantName,
  restaurantZip,
  restaurantAddress,
  customerName,
  customerEmail,
  onClose,
}: {
  restaurantName: string;
  restaurantZip?: string;
  restaurantAddress?: string;
  customerName?: string;
  customerEmail?: string;
  onClose: () => void;
}) {
  // Seed demo hotels synchronously so the list below has data on first render.
  // RestaurantsPage may be the first place a consumer ever sees a hotel — they
  // might never have opened HotelsHub. Seeding is idempotent.
  const [userZip, setUserZip] = useState('');
  const [bookingHotel, setBookingHotel] = useState<DemoHotel | null>(null);
  const [flirtyLine] = useState(() => FLIRTY_LINES[Math.floor(Math.random() * FLIRTY_LINES.length)]);

  const allHotels = useMemo(() => {
    return db_listHotels();
  }, []);

  // Use the customer's zip if they typed one, otherwise the restaurant's zip
  // — both make for great "near where you'll be tonight" matches.
  const referenceZip = (userZip.trim() || restaurantZip || '').trim();

  const ranked = useMemo(() => {
    const scored = allHotels.map(h => {
      const score = zipScore(h.postalCode, referenceZip);
      const rooms = db_listRooms(h.id).filter(r => r.active);
      const fromPrice = rooms.length ? Math.min(...rooms.map(r => r.pricePerNightCents)) : 0;
      const reviews = db_listReviews(h.id);
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : (h.starRating || 0);
      return { hotel: h, score, fromPrice, avgRating };
    });
    // Highest zip-prefix match first, then highest rating, then name.
    scored.sort((a, b) => (b.score - a.score) || (b.avgRating - a.avgRating) || a.hotel.name.localeCompare(b.hotel.name));
    return scored;
  }, [allHotels, referenceZip]);

  const haveAnyMatch = ranked.some(r => r.score > 0);

  if (bookingHotel) {
    return (
      <HotelDetail
        hotel={bookingHotel}
        onClose={() => setBookingHotel(null)}
        onBooked={() => { setBookingHotel(null); onClose(); }}
        guestEmail={customerEmail}
        guestName={customerName}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[100dvh] sm:max-h-[92vh] flex flex-col overscroll-contain pb-[env(safe-area-inset-bottom)]">

        {/* Hero */}
        <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <Icon name="close" className="w-4 h-4 text-white" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/80 mb-2">✨ Make it a date night</p>
          <h2 className="font-display text-2xl sm:text-3xl font-extralight leading-tight italic">
            Why let the magic end after dinner?
          </h2>
          <p className="text-white/90 text-sm mt-2 leading-relaxed">{flirtyLine}</p>
          <p className="text-white/75 text-xs mt-3">
            Dining at <span className="font-semibold">{restaurantName}</span>
            {restaurantZip ? ` · ${restaurantZip}` : ''}
            {restaurantAddress ? ` · ${restaurantAddress}` : ''}
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-5">

          {/* Optional zip input */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-600 mb-1.5">
              Your current ZIP <span className="text-stone-400 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                value={userZip}
                onChange={e => setUserZip(e.target.value)}
                placeholder={restaurantZip ? `Defaults to ${restaurantZip}` : 'e.g. 10001'}
                maxLength={12}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
              {userZip && (
                <button
                  onClick={() => setUserZip('')}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Tell us where you're starting from and we'll surface the closest stays — a 5-minute taxi after dessert beats an hour-long drive home.
            </p>
          </div>

          {/* Hotel suggestions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-stone-900">
                {haveAnyMatch ? 'Stay close to the candlelight' : 'Hand-picked stays for you'}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
                {ranked.length} {ranked.length === 1 ? 'option' : 'options'}
              </span>
            </div>

            {ranked.length === 0 ? (
              <div className="text-center py-12 text-stone-600 bg-stone-50 rounded-2xl border border-stone-200">
                <p className="text-3xl mb-2">🏨</p>
                <p className="text-sm">No partner hotels yet — check back soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ranked.map(({ hotel, score, fromPrice, avgRating }) => {
                  const tag = distanceLabel(score);
                  return (
                    <button
                      key={hotel.id}
                      onClick={() => setBookingHotel(hotel)}
                      className="w-full text-left bg-white border border-stone-200 hover:border-rose-300 hover:shadow-md rounded-2xl overflow-hidden transition-all group flex"
                    >
                      <div
                        className="w-28 sm:w-32 flex-shrink-0 bg-cover bg-center bg-stone-100"
                        style={{ backgroundImage: hotel.heroImageUrl ? `url('${hotel.heroImageUrl}')` : undefined }}
                      />
                      <div className="flex-1 min-w-0 p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-display text-base text-stone-900 truncate">{hotel.name}</h4>
                          <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tag.tone}`}>
                            {tag.label}
                          </span>
                        </div>
                        {hotel.tagline && (
                          <p className="text-[11px] text-stone-500 truncate">{hotel.tagline}</p>
                        )}
                        <p className="text-xs text-stone-700 mt-1.5 leading-snug line-clamp-2">
                          <Icon name="location" className="w-3 h-3 inline -mt-0.5 mr-1 text-rose-500" />
                          {hotel.address || hotel.city || '—'}
                          {hotel.postalCode ? ` · ${hotel.postalCode}` : ''}
                        </p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-2 text-[11px] text-stone-600">
                            <span className="text-amber-500">{'★'.repeat(Math.round(avgRating))}</span>
                            {fromPrice > 0 && (
                              <span className="font-semibold text-stone-900">
                                from {formatMoney(fromPrice)}
                                <span className="text-stone-500 font-normal"> /night</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-rose-600 group-hover:text-rose-700 flex items-center gap-1">
                            Book the night
                            <Icon name="chevron-right" className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer flirty line */}
          <p className="text-center text-[11px] text-stone-500 italic">
            Liora keeps your dinner reservation and hotel booking on the same evening — one perfect night, planned together.
          </p>
        </div>
      </div>
    </div>
  );
}
