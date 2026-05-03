import React, { useEffect, useState, useMemo } from 'react';
import { Icon } from '../../../components/Icon';
import type { DemoRestaurant } from '../../demoDb';
import {
  fetchRestoReviews, type RestoReviewSummary, type RestoReview,
  StarRow,
} from '../../components/reviews/RestaurantReviews';

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const POSITIVE_WORDS = ['amazing','great','love','excellent','perfect','fantastic','wonderful','best','delicious','awesome','outstanding','beautiful','recommend','friendly','fast','quick','warm','cozy','fresh','tasty'];
const NEGATIVE_WORDS = ['bad','slow','rude','cold','dirty','disappointed','poor','terrible','awful','wait','waited','overpriced','noisy','loud','undercooked','overcooked','bland'];

function sentimentOf(r: RestoReview) {
  const lower = (r.text || '').toLowerCase();
  const pos = POSITIVE_WORDS.some(w => lower.includes(w));
  const neg = NEGATIVE_WORDS.some(w => lower.includes(w));
  if (r.rating >= 4 && !neg) return 'positive';
  if (r.rating <= 2 || (neg && !pos)) return 'negative';
  return 'neutral';
}

function topKeyword(reviews: RestoReview[]): string {
  const counts: Record<string, number> = {};
  const words = ['service','food','ambience','atmosphere','staff','wine','dessert','wait','price','menu','chef','drinks','music','seating','view'];
  reviews.forEach(r => {
    const t = (r.text || '').toLowerCase();
    words.forEach(w => { if (t.includes(w)) counts[w] = (counts[w] || 0) + 1; });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ? sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1) : '—';
}

export default function RestoReputation({ restaurant }: { restaurant: DemoRestaurant }) {
  const [data, setData] = useState<RestoReviewSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'critical' | 'replied'>('all');
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = () => fetchRestoReviews(restaurant.id).then(setData);
  useEffect(() => { refresh(); }, [restaurant.id]);

  const reviews = data?.reviews || [];

  const sentimentBreakdown = useMemo(() => {
    if (reviews.length === 0) return { pos: 0, neg: 0, neu: 0, posPct: 0 };
    let pos = 0, neg = 0, neu = 0;
    reviews.forEach(r => { const s = sentimentOf(r); if (s === 'positive') pos++; else if (s === 'negative') neg++; else neu++; });
    return { pos, neg, neu, posPct: Math.round((pos / reviews.length) * 100) };
  }, [reviews]);

  const keyword = useMemo(() => topKeyword(reviews), [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (activeTab === 'unread') list = list.filter(r => !r.replied);
    else if (activeTab === 'critical') list = list.filter(r => r.rating <= 3);
    else if (activeTab === 'replied') list = list.filter(r => r.replied);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.text.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [reviews, activeTab, search]);

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/reviews/${id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      await refresh();
    } catch {}
    setSubmitting(false);
    setReplyId(null);
    setReplyText('');
  };

  const unrepliedCount = reviews.filter(r => !r.replied).length;
  const criticalCount = reviews.filter(r => r.rating <= 3).length;
  const repliedCount = reviews.filter(r => r.replied).length;

  if (!data) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full"/></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-24">

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">Overall Rating</p>
            <h3 className="text-4xl font-lora font-bold text-stone-800">
              {data.avgRating ? data.avgRating.toFixed(1) : '—'}
              <span className="text-sm text-stone-600 font-sans font-normal"> / 5.0</span>
            </h3>
            <p className="text-[10px] text-stone-600 font-bold mt-1 uppercase tracking-widest">{data.totalCount} review{data.totalCount === 1 ? '' : 's'}</p>
          </div>
          <StarRow value={data.avgRating} size={20} />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Sentiment Analysis</p>
            <Icon name="insights" size={16} className="text-green-500" />
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-bold ${sentimentBreakdown.posPct >= 70 ? 'text-green-600' : sentimentBreakdown.posPct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
              {data.totalCount === 0 ? '—' : `${sentimentBreakdown.posPct}% Positive`}
            </span>
            <div className="flex-1 h-2.5 bg-cream-100/50 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm transition-all" style={{ width: `${sentimentBreakdown.posPct}%` }}></div>
            </div>
          </div>
          <p className="text-[10px] text-stone-600 font-bold mt-3 uppercase tracking-widest">
            Top keyword: <span className="text-stone-800">"{keyword}"</span>
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-3">Distribution</p>
          {data.distribution.map(({ star, count }) => {
            const pct = data.totalCount ? (count / data.totalCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <span className="text-[10px] font-bold text-stone-600 w-6">{star}★</span>
                <div className="flex-1 h-1.5 bg-cream-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-stone-600 w-5 text-right tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Feed Section */}
      <div className="bg-white rounded-[2.5rem] border border-cream-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="px-8 py-5 border-b border-cream-200 bg-cream-100/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6">
            {[
              { id: 'all' as const, label: 'All', count: reviews.length },
              { id: 'unread' as const, label: 'Needs reply', count: unrepliedCount },
              { id: 'critical' as const, label: 'Critical', count: criticalCount },
              { id: 'replied' as const, label: 'Replied', count: repliedCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-stone-800 border-b-2 border-brand-400'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand-400 text-white' : 'bg-cream-200 text-stone-600'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reviews…"
              className="pl-9 pr-3 py-2 text-xs rounded-full border border-cream-200 bg-white text-stone-700 placeholder-stone-500 focus:outline-none focus:border-brand-400 w-56"
            />
          </div>
        </div>

        {/* Feed List */}
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center">
              <Icon name="star" size={24} className="text-stone-500" />
            </div>
            <p className="text-stone-800 font-bold text-sm">{reviews.length === 0 ? 'No reviews yet' : 'No reviews match this view'}</p>
            <p className="text-stone-600 text-xs mt-1">{reviews.length === 0 ? 'Encourage guests to leave a review after their visit.' : 'Try a different filter.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-200">
            {filtered.map(review => {
              const sent = sentimentOf(review);
              return (
                <div key={review.id} className="p-8 hover:bg-cream-50/30 transition-all group">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-cream-50 rounded-2xl flex items-center justify-center text-stone-700 font-lora font-bold text-xl border border-cream-200 shadow-sm group-hover:bg-white transition-colors flex-shrink-0">
                        {review.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-stone-800 text-base">{review.customerName}</h4>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            sent === 'positive' ? 'bg-green-50 text-green-700 border border-green-200' :
                            sent === 'negative' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                  'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>{sent}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRow value={review.rating} size={14} />
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">Liora · {timeAgo(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {!review.replied && (
                      <span className="bg-brand-400/10 text-brand-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-brand-400/30">Unanswered</span>
                    )}
                  </div>

                  <p className="text-stone-700 text-sm mb-4 pl-16 leading-relaxed max-w-3xl">"{review.text}"</p>

                  {review.replied && review.reply ? (
                    <div className="ml-16 mt-2 p-4 bg-cream-100/60 rounded-2xl border border-dashed border-cream-200 flex items-start gap-3">
                      <Icon name="check" size={16} className="text-green-500 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">
                          Your reply{review.repliedAt ? ` · ${timeAgo(review.repliedAt)}` : ''}
                        </p>
                        <p className="text-xs text-stone-700 leading-relaxed">"{review.reply}"</p>
                      </div>
                    </div>
                  ) : replyId === review.id ? (
                    <div className="ml-16 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Thank the guest, address concerns, invite them back…"
                        rows={3}
                        className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm text-stone-700 resize-none focus:outline-none focus:border-brand-400"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={() => submitReply(review.id)} disabled={submitting || !replyText.trim()}
                          className="px-5 py-2 bg-brand-400 text-white rounded-xl text-xs font-bold hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-50">
                          {submitting ? 'Posting…' : 'Post reply'}
                        </button>
                        <button onClick={() => { setReplyId(null); setReplyText(''); }}
                          className="px-5 py-2 bg-white border border-cream-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-cream-50 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-16 flex flex-wrap gap-3">
                      <button
                        onClick={() => { setReplyId(review.id); setReplyText(''); }}
                        className="px-6 py-2.5 bg-white border border-cream-200 text-stone-800 rounded-xl text-xs font-bold hover:bg-cream-50 transition-all active:scale-95 flex items-center gap-2">
                        <Icon name="chat" size={14} /> Reply to review
                      </button>
                      {review.rating >= 4 && (
                        <button
                          onClick={() => {
                            setReplyId(review.id);
                            setReplyText(`Thank you so much for the kind words, ${review.customerName.split(' ')[0]}! We're thrilled you enjoyed your visit and can't wait to welcome you back to ${restaurant.name}.`);
                          }}
                          className="px-6 py-2.5 bg-cream-100 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-cream-200 transition-all shadow-sm active:scale-95">
                          <Icon name="auto_awesome" size={14} className="text-brand-400" /> Suggest reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
