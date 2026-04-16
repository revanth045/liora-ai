import React, { useState, useEffect } from 'react';
import { Icon } from '../../../../components/Icon';
import type { DemoRestaurant } from '../../../demoDb';

interface Review {
  id: string; restaurantId: string; customerName: string; rating: number;
  text: string; createdAt: number; replied: boolean; reply: string;
}

async function fetchReviews(restaurantId: string): Promise<{ reviews: Review[]; avgRating: number; totalCount: number; distribution: { star: number; count: number }[] }> {
  try {
    const r = await fetch(`/api/reviews?restaurantId=${restaurantId}`);
    if (!r.ok) throw new Error('api error');
    return r.json();
  } catch {
    // API unavailable — return empty state
    return {
      avgRating: 0, totalCount: 0,
      distribution: [{ star: 5, count: 0 }, { star: 4, count: 0 }, { star: 3, count: 0 }, { star: 2, count: 0 }, { star: 1, count: 0 }],
      reviews: [],
    };
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-brand-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'; return `${d} days ago`;
}

export default function RestoReviews({ restaurant }: { restaurant: DemoRestaurant }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchReviews>> | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReviews(restaurant.id).then(setData); }, [restaurant.id]);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/reviews/${id}/reply`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply: replyText }) });
      if (r.ok) {
        setData(prev => prev ? {
          ...prev,
          reviews: prev.reviews.map(rv => rv.id === id ? { ...rv, replied: true, reply: replyText } : rv)
        } : prev);
      }
    } catch { /* use local update already done */ }
    setReplyId(null); setReplyText(''); setSubmitting(false);
  };

  if (!data) return <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full"/></div>;

  const filtered = filterRating ? data.reviews.filter(r => r.rating === filterRating) : data.reviews;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white border border-cream-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
          <p className="text-5xl font-display font-bold text-stone-800">{data.avgRating.toFixed(1)}</p>
          <StarRating rating={Math.round(data.avgRating)} />
          <p className="text-sm text-stone-400 mt-2">{data.totalCount} reviews</p>
        </div>
        <div className="md:col-span-2 bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Rating Distribution</h3>
          {data.distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3 mb-1.5">
              <button onClick={() => setFilterRating(filterRating === star ? 0 : star)} className="flex items-center gap-1 w-16 text-xs text-stone-500 hover:text-brand-400 transition-colors">
                {star} <svg className="w-3 h-3 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </button>
              <div className="flex-1 bg-cream-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${data.totalCount ? (count / data.totalCount) * 100 : 0}%` }}/>
              </div>
              <span className="text-xs text-stone-400 w-6 text-right">{count}</span>
            </div>
          ))}
          {filterRating > 0 && <button onClick={() => setFilterRating(0)} className="mt-2 text-xs text-brand-400 hover:underline">Clear filter</button>}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {filtered.map(review => (
          <div key={review.id} className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center font-semibold text-stone-600 text-sm">{review.customerName.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{review.customerName}</p>
                  <p className="text-xs text-stone-400">{timeAgo(review.createdAt)}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{review.text}</p>

            {review.replied && (
              <div className="mt-3 pl-4 border-l-2 border-brand-400/40 bg-cream-50 rounded-r-lg p-3">
                <p className="text-xs font-semibold text-brand-400 mb-1">Your reply</p>
                <p className="text-sm text-stone-600">{review.reply}</p>
              </div>
            )}

            {!review.replied && (
              replyId === review.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a thoughtful reply..."
                    className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm text-stone-700 resize-none focus:outline-none focus:border-brand-400"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(review.id)} disabled={submitting || !replyText.trim()} className="btn-gold text-xs px-4 py-2 font-semibold disabled:opacity-50">
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                    <button onClick={() => { setReplyId(null); setReplyText(''); }} className="text-xs px-4 py-2 text-stone-500 hover:text-stone-700 bg-cream-100 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyId(review.id); setReplyText(''); }} className="mt-3 flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-400 transition-colors font-medium">
                  <Icon name="chat" className="w-3.5 h-3.5" /> Reply to review
                </button>
              )
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-stone-400">No reviews match the selected filter.</div>}
      </div>
    </div>
  );
}
