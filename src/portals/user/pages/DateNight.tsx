import React, { useMemo, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { db_listHotels, db_listReviews, db_listRooms, formatMoney, type DemoHotel } from '../../../hotelDb';
import { HotelDetail } from './HotelsHub';

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
  if (score >= 3) return { label: 'Just minutes away', tone: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (score >= 1) return { label: 'In your region', tone: 'bg-sky-100 text-sky-700 border-sky-200' };
  return { label: 'Liora pick', tone: 'bg-stone-100 text-stone-700 border-stone-200' };
}

export default function DateNightPage() {
  const [zip, setZip] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<DemoHotel | null>(null);
  const hotels = useMemo(() => db_listHotels(), []);

  const ranked = useMemo(() => {
    const scored = hotels.map(h => {
      const score = zipScore(h.postalCode, zip.trim());
      const rooms = db_listRooms(h.id).filter(r => r.active);
      const fromPrice = rooms.length ? Math.min(...rooms.map(r => r.pricePerNightCents)) : 0;
      const reviews = db_listReviews(h.id);
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : (h.starRating || 0);
      return { hotel: h, score, fromPrice, avgRating };
    });
    scored.sort((a, b) => (b.score - a.score) || (b.avgRating - a.avgRating) || a.hotel.name.localeCompare(b.hotel.name));
    return scored;
  }, [hotels, zip]);

  if (selectedHotel) {
    return (
      <HotelDetail
        hotel={selectedHotel}
        onClose={() => setSelectedHotel(null)}
        onBooked={() => setSelectedHotel(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto animate-page-slide">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/80 mb-2">Date Night</p>
        <h1 className="font-display text-3xl md:text-4xl font-extralight leading-tight">Plan the perfect night out.</h1>
        <p className="text-white/90 text-sm mt-2 max-w-2xl">
          Dinner and nearby stays in one place. Pick a hotel close to your evening plans and book in minutes.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-600 mb-1.5">
          ZIP code (optional)
        </label>
        <input
          value={zip}
          onChange={e => setZip(e.target.value)}
          placeholder="e.g. 10001"
          maxLength={12}
          className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
        />
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-12 text-stone-600 bg-stone-50 rounded-2xl border border-stone-200">
          <p className="text-3xl mb-2">🏨</p>
          <p className="text-sm">No partner hotels available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ hotel, score, fromPrice, avgRating }) => {
            const tag = distanceLabel(score);
            return (
              <button
                key={hotel.id}
                onClick={() => setSelectedHotel(hotel)}
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
                      <span className="text-amber-500">{'★'.repeat(Math.max(1, Math.round(avgRating)))}</span>
                      {fromPrice > 0 && (
                        <span className="font-semibold text-stone-900">
                          from {formatMoney(fromPrice)}
                          <span className="text-stone-500 font-normal"> /night</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 group-hover:text-rose-700 flex items-center gap-1">
                      View stay
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
  );
}