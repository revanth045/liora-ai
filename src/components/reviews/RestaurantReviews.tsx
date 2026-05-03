import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';

export type RestoReview = {
  id: string;
  restaurantId: string;
  customerName: string;
  rating: number;
  text: string;
  reply?: string;
  replied?: boolean;
  repliedAt?: number;
  createdAt: number;
};

export type RestoReviewSummary = {
  reviews: RestoReview[];
  avgRating: number;
  totalCount: number;
  distribution: { star: number; count: number }[];
};

export const EMPTY_RESTO_REVIEW_SUMMARY: RestoReviewSummary = {
  reviews: [],
  avgRating: 0,
  totalCount: 0,
  distribution: [5, 4, 3, 2, 1].map(star => ({ star, count: 0 })),
};

export async function fetchRestoReviews(restaurantId: string): Promise<RestoReviewSummary> {
  try {
    const r = await fetch(`/api/reviews?restaurantId=${encodeURIComponent(restaurantId)}`);
    if (!r.ok) throw new Error('api');
    const json = await r.json();
    return {
      reviews: json.reviews || [],
      avgRating: Number(json.avgRating) || 0,
      totalCount: Number(json.totalCount) || 0,
      distribution: json.distribution || EMPTY_RESTO_REVIEW_SUMMARY.distribution,
    };
  } catch {
    return EMPTY_RESTO_REVIEW_SUMMARY;
  }
}

export async function postRestoReview(input: {
  restaurantId: string; customerName: string; rating: number; text: string;
}): Promise<RestoReview | null> {
  try {
    const r = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function StarRow({ value, size = 14, mutedClass = 'text-stone-300', activeClass = 'text-amber-400' }: { value: number; size?: number; mutedClass?: string; activeClass?: string }) {
  const v = Math.round(value);
  return (
    <div className="flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} className={s <= v ? activeClass : mutedClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

type Theme = 'light' | 'dark';
const T = (theme: Theme) => theme === 'dark' ? {
  card: 'bg-white/5 border-white/10',
  text: 'text-white',
  sub: 'text-white/70',
  muted: 'text-white/50',
  bar: 'bg-white/10',
  filterBtn: (active: boolean) => active ? 'bg-[#f5c842] text-black border-[#f5c842]' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10',
  divider: 'border-white/10',
  reply: 'bg-white/5 border-white/10',
  pill: 'bg-white/10 text-white/85',
} : {
  card: 'bg-white border-cream-200',
  text: 'text-stone-800',
  sub: 'text-stone-600',
  muted: 'text-stone-500',
  bar: 'bg-cream-100',
  filterBtn: (active: boolean) => active ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-cream-200 hover:border-stone-400',
  divider: 'border-cream-200',
  reply: 'bg-cream-50 border-cream-200',
  pill: 'bg-cream-100 text-stone-700',
};

export function ReviewSummaryCard({ summary, theme = 'light', onFilter, activeFilter }: {
  summary: RestoReviewSummary;
  theme?: Theme;
  onFilter?: (star: number) => void;
  activeFilter?: number;
}) {
  const t = T(theme);
  const total = Math.max(1, summary.totalCount);
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3`}>
      <div className={`md:col-span-1 ${t.card} border rounded-2xl p-5 flex flex-col items-center justify-center text-center`}>
        <p className={`text-5xl font-display font-bold ${t.text} leading-none`}>{summary.avgRating ? summary.avgRating.toFixed(1) : '—'}</p>
        <div className="mt-2"><StarRow value={summary.avgRating} size={18} mutedClass={theme === 'dark' ? 'text-white/15' : 'text-stone-300'} /></div>
        <p className={`text-xs ${t.sub} mt-2 font-semibold`}>{summary.totalCount} {summary.totalCount === 1 ? 'review' : 'reviews'}</p>
      </div>
      <div className={`md:col-span-2 ${t.card} border rounded-2xl p-5`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest ${t.sub} mb-3`}>Rating distribution</h3>
        {summary.distribution.map(({ star, count }) => {
          const pct = (count / total) * 100;
          const isActive = activeFilter === star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onFilter?.(star)}
              disabled={!onFilter || count === 0}
              className={`w-full flex items-center gap-3 mb-1.5 last:mb-0 group ${onFilter && count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`flex items-center gap-1 w-12 text-xs font-semibold ${isActive ? (theme === 'dark' ? 'text-[#f5c842]' : 'text-stone-800') : t.sub}`}>
                {star} <svg className={isActive ? 'text-amber-400' : (theme === 'dark' ? 'text-white/40' : 'text-stone-400')} width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </span>
              <div className={`flex-1 h-2 rounded-full ${t.bar} overflow-hidden`}>
                <div className={`h-full rounded-full transition-all ${count > 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs ${t.sub} w-7 text-right tabular-nums font-semibold`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewListItem({ review, theme = 'light' }: { review: RestoReview; theme?: Theme }) {
  const t = T(theme);
  return (
    <div className={`${t.card} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-cream-200 text-stone-700'} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
            {review.customerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold ${t.text} text-sm truncate`}>{review.customerName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow value={review.rating} size={12} mutedClass={theme === 'dark' ? 'text-white/15' : 'text-stone-300'} />
              <span className={`text-[11px] ${t.muted}`}>{timeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <p className={`text-sm ${t.sub} leading-relaxed whitespace-pre-wrap`}>{review.text}</p>
      {review.replied && review.reply && (
        <div className={`mt-3 ml-2 pl-4 border-l-2 ${theme === 'dark' ? 'border-[#f5c842]/40' : 'border-brand-400/40'} ${t.reply} border rounded-r-xl p-3`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-[#f5c842]' : 'text-brand-400'} mb-1 flex items-center gap-1`}>
            <Icon name="restaurant" className="w-3 h-3" /> Owner response
          </p>
          <p className={`text-sm ${t.sub} leading-relaxed`}>{review.reply}</p>
        </div>
      )}
    </div>
  );
}

type SortMode = 'recent' | 'highest' | 'lowest';

export function RestaurantReviewsBlock({
  restaurantId,
  theme = 'light',
  onLeaveReview,
  refreshKey = 0,
}: {
  restaurantId: string;
  theme?: Theme;
  onLeaveReview?: () => void;
  refreshKey?: number;
}) {
  const [data, setData] = useState<RestoReviewSummary | null>(null);
  const [filter, setFilter] = useState(0);
  const [sort, setSort] = useState<SortMode>('recent');
  const t = T(theme);

  useEffect(() => {
    let alive = true;
    fetchRestoReviews(restaurantId).then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [restaurantId, refreshKey]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = filter ? data.reviews.filter(r => r.rating === filter) : [...data.reviews];
    if (sort === 'recent') list.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'highest') list.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
    if (sort === 'lowest') list.sort((a, b) => a.rating - b.rating || b.createdAt - a.createdAt);
    return list;
  }, [data, filter, sort]);

  if (!data) {
    return <div className="flex justify-center py-10"><div className={`animate-spin w-5 h-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-stone-400'} border-t-transparent rounded-full`}/></div>;
  }

  const sortBtn = (mode: SortMode, label: string) => (
    <button
      type="button"
      onClick={() => setSort(mode)}
      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${t.filterBtn(sort === mode)}`}
    >{label}</button>
  );

  return (
    <div className="space-y-4">
      <ReviewSummaryCard summary={data} theme={theme} onFilter={s => setFilter(filter === s ? 0 : s)} activeFilter={filter} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {sortBtn('recent', 'Most recent')}
          {sortBtn('highest', 'Highest rated')}
          {sortBtn('lowest', 'Lowest rated')}
          {filter > 0 && (
            <button type="button" onClick={() => setFilter(0)} className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-rose-500/15 text-rose-200 border-rose-400/30' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {filter}★ only · clear
            </button>
          )}
        </div>
        {onLeaveReview && (
          <button type="button" onClick={onLeaveReview}
            className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-[#f5c842] text-black hover:bg-yellow-300' : 'bg-stone-800 text-white hover:bg-stone-900'}`}>
            ★ Write a review
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={`${t.card} border rounded-2xl p-10 text-center`}>
          <div className={`mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-cream-100'}`}>
            <Icon name="star" className={`w-6 h-6 ${t.muted}`} />
          </div>
          <p className={`${t.text} font-semibold text-sm`}>{data.totalCount === 0 ? 'No reviews yet' : 'No reviews match this filter'}</p>
          <p className={`${t.sub} text-xs mt-1`}>{data.totalCount === 0 ? 'Be the first to share your experience.' : 'Try a different filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id}><ReviewListItem review={r} theme={theme} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeaveRestaurantReviewModal({
  restaurantId, restaurantName, defaultName = '', theme = 'light',
  onClose, onPosted,
}: {
  restaurantId: string;
  restaurantName: string;
  defaultName?: string;
  theme?: Theme;
  onClose: () => void;
  onPosted?: (review: RestoReview) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(defaultName);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const dark = theme === 'dark';

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (text.trim().length < 5) { setError('Please write at least a few words'); return; }
    setSubmitting(true);
    const res = await postRestoReview({
      restaurantId, customerName: name.trim(), rating, text: text.trim(),
    });
    setSubmitting(false);
    if (!res) { setError('Could not post your review. Please try again.'); return; }
    // Notify the restaurant owner (in their portal) and the super-admin event log.
    try {
      const { restoNotify } = await import('../../lib/restaurantNotifications');
      restoNotify({
        restaurantId,
        kind: 'review_received',
        title: `${rating}★ review from ${name.trim()}`,
        body: text.trim().length > 140 ? text.trim().slice(0, 140) + '…' : text.trim(),
        meta: { reviewId: res.id, rating, customerName: name.trim() },
      });
    } catch {}
    try {
      const { adminNotify } = await import('../../lib/adminNotifications');
      adminNotify({
        kind: 'ticket_opened', // generic event surface; admin sees it as activity
        venueId: restaurantId,
        venueName: restaurantName,
        venueType: 'restaurant',
        message: `New ${rating}★ review from ${name.trim()}`,
      });
    } catch {}
    onPosted?.(res);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 ${dark ? 'bg-[#111113] text-white border border-white/10' : 'bg-white text-stone-800 border border-cream-200'} shadow-2xl`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-[#f5c842]' : 'text-brand-400'}`}>Share your experience</p>
            <h3 className={`text-xl font-display font-bold mt-1 ${dark ? 'text-white' : 'text-stone-900'}`}>Review {restaurantName}</h3>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center ${dark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-cream-100 hover:bg-cream-200 text-stone-600'}`}>
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dark ? 'text-white/70' : 'text-stone-600'}`}>Your rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button"
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                className={`text-3xl transition-transform hover:scale-110 ${(hover || rating) >= n ? 'text-amber-400' : (dark ? 'text-white/20' : 'text-stone-300')}`}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >★</button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-white/70' : 'text-stone-600'}`}>Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex"
            className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none ${dark ? 'bg-[#1c1c1e] border border-white/10 text-white placeholder-white/30 focus:border-[#f5c842]/40' : 'bg-cream-50 border border-cream-200 text-stone-700 focus:border-brand-400'}`} />
        </div>

        <div className="mb-2">
          <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-white/70' : 'text-stone-600'}`}>Your review</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Tell others what you loved (or didn't)…"
            className={`w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none ${dark ? 'bg-[#1c1c1e] border border-white/10 text-white placeholder-white/30 focus:border-[#f5c842]/40' : 'bg-cream-50 border border-cream-200 text-stone-700 focus:border-brand-400'}`} />
        </div>

        {error && <p className="text-xs text-rose-500 font-semibold mb-3">{error}</p>}

        <button onClick={submit} disabled={submitting}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-colors disabled:opacity-50 ${dark ? 'bg-[#f5c842] text-black hover:bg-yellow-300' : 'bg-stone-800 text-white hover:bg-stone-900'}`}>
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </div>
  );
}
