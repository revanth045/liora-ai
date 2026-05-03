import { Router } from 'express';
import { q } from '../db.js';
import { GoogleGenAI } from '@google/genai';

const r = Router();
const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });

async function loadHotelContext(hotelId) {
  const [hotel] = await q('SELECT * FROM hotels WHERE id=$1', [hotelId]);
  if (!hotel) return null;
  const rooms    = await q('SELECT * FROM hotel_rooms WHERE hotel_id=$1', [hotelId]);
  const bookings = await q('SELECT * FROM hotel_bookings WHERE hotel_id=$1 ORDER BY created_at DESC LIMIT 200', [hotelId]);
  const reviews  = await q('SELECT * FROM hotel_reviews WHERE hotel_id=$1 ORDER BY created_at DESC LIMIT 50', [hotelId]);

  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const thisWeek = bookings.filter(b => Number(b.created_at) >= now - week && b.status !== 'cancelled');
  const lastWeek = bookings.filter(b => {
    const t = Number(b.created_at);
    return t >= now - 2 * week && t < now - week && b.status !== 'cancelled';
  });
  const revThis = thisWeek.reduce((s, b) => s + b.total_cents, 0);
  const revLast = lastWeek.reduce((s, b) => s + b.total_cents, 0);
  const revPct  = revLast === 0 ? null : Math.round((revThis - revLast) / revLast * 100);

  // Top room by revenue (last 30 days)
  const m30 = now - 30 * 24 * 3600 * 1000;
  const recent = bookings.filter(b => Number(b.created_at) >= m30 && b.status !== 'cancelled');
  const byRoom = new Map();
  for (const b of recent) byRoom.set(b.room_id, (byRoom.get(b.room_id) || 0) + b.total_cents);
  const topEntry = [...byRoom.entries()].sort((a, b) => b[1] - a[1])[0];
  const topRoom  = topEntry ? rooms.find(r => r.id === topEntry[0]) : null;

  // Lower-rated reviews
  const lowReviews = reviews.filter(r => r.rating <= 3).slice(0, 5);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return { hotel, rooms, bookings, reviews, thisWeek, lastWeek, revThis, revLast, revPct, topRoom, lowReviews, avgRating };
}

function fallbackInsights(c) {
  const lines = [];
  if (c.revPct != null) {
    const dir = c.revPct >= 0 ? 'up' : 'down';
    lines.push(`Revenue is ${dir} ${Math.abs(c.revPct)}% week-over-week (${(c.revThis/100).toFixed(0)} vs ${(c.revLast/100).toFixed(0)} USD).`);
  } else if (c.revThis > 0) {
    lines.push(`Generated $${(c.revThis/100).toFixed(0)} this week across ${c.thisWeek.length} bookings.`);
  } else {
    lines.push(`No bookings yet this week — consider running a flash promo.`);
  }
  if (c.topRoom) lines.push(`Your top performer (last 30 days): ${c.topRoom.name}.`);
  if (c.avgRating) lines.push(`Average guest rating is ${c.avgRating}/5 across ${c.reviews.length} reviews.`);
  if (c.lowReviews.length) lines.push(`${c.lowReviews.length} guests left a 3-star or lower review recently — review feedback in the Reviews tab.`);
  return lines.join(' ');
}

r.get('/weekly/:hotelId', async (req, res, next) => {
  try {
    const c = await loadHotelContext(req.params.hotelId);
    if (!c) return res.status(404).json({ error: 'Hotel not found' });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.json({
        generatedAt: Date.now(), source: 'fallback',
        summary: fallbackInsights(c),
        kpis: { revThisWeek: c.revThis, revLastWeek: c.revLast, revPct: c.revPct, bookings: c.thisWeek.length, avgRating: c.avgRating },
      });
    }

    const ai = getAi();
    const prompt = `You are a hospitality business analyst. Write a 4-bullet weekly insight report for the hotel "${c.hotel.name}".
Use ONLY this data. Be specific, cite numbers, and end with one concrete next-step recommendation.

DATA:
- Revenue this week: $${(c.revThis/100).toFixed(0)} (${c.thisWeek.length} bookings)
- Revenue last week: $${(c.revLast/100).toFixed(0)} (${c.lastWeek.length} bookings)
- Top-performing room (30d): ${c.topRoom?.name || 'n/a'}
- Average rating: ${c.avgRating || 'no reviews'}/5 across ${c.reviews.length} reviews
- Recent lower-rated reviews (≤3★): ${c.lowReviews.map(r => `"${r.comment?.slice(0,80) || ''}"`).join(' | ') || 'none'}

Format as 4 short bullet points (no markdown headers). Plain text only.`;

    let summary;
    try {
      const out = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      summary = (out.text || '').trim() || fallbackInsights(c);
    } catch (e) {
      console.warn('[aiInsights] Gemini failed, falling back:', e.message);
      summary = fallbackInsights(c);
    }

    res.json({
      generatedAt: Date.now(), source: summary === fallbackInsights(c) ? 'fallback' : 'gemini',
      summary,
      kpis: { revThisWeek: c.revThis, revLastWeek: c.revLast, revPct: c.revPct, bookings: c.thisWeek.length, avgRating: c.avgRating },
    });
  } catch (e) { next(e); }
});

export default r;
