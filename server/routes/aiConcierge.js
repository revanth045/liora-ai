import { Router } from 'express';
import { q } from '../db.js';
import { GoogleGenAI } from '@google/genai';

const r = Router();
const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });

const SYS = `You are Liora's hotel concierge AI. Given a guest's natural-language request and a list of candidate hotels (each with id, name, city, country, amenities, starRating, minPrice in USD per night, description), pick the best 1-3 matches and explain why in 1-2 short sentences each.

Always respond with VALID JSON ONLY (no markdown), in this shape:
{ "matches": [{ "hotelId": "...", "reason": "..." }], "advice": "one line of friendly extra advice" }

If nothing matches, return { "matches": [], "advice": "..." }.`;

r.post('/recommend', async (req, res, next) => {
  try {
    const { query, maxBudgetUsd } = req.body || {};
    if (!query?.trim()) return res.status(400).json({ error: 'query required' });

    const hotels = await q('SELECT * FROM hotels');
    const rooms = await q('SELECT hotel_id, MIN(price_per_night_cents) AS min_cents FROM hotel_rooms WHERE active=true GROUP BY hotel_id');
    const minByHotel = new Map(rooms.map(r => [r.hotel_id, Number(r.min_cents)]));

    let candidates = hotels.map(h => ({
      id: h.id, name: h.name, city: h.city, country: h.country,
      amenities: h.amenities || [], starRating: h.star_rating,
      minPriceUsd: minByHotel.has(h.id) ? Math.round(minByHotel.get(h.id) / 100) : null,
      description: (h.description || '').slice(0, 240),
    }));
    if (Number.isFinite(maxBudgetUsd) && maxBudgetUsd > 0) {
      candidates = candidates.filter(c => c.minPriceUsd == null || c.minPriceUsd <= maxBudgetUsd);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey || candidates.length === 0) {
      // Heuristic fallback
      const top = candidates.slice(0, 3).map(c => ({ hotelId: c.id, reason: `${c.name} — ${c.city}, from $${c.minPriceUsd || '?'}/night.` }));
      return res.json({ matches: top, advice: candidates.length ? 'Showing the first matches; refine your search for better results.' : 'No hotels match your criteria yet.', source: 'fallback' });
    }

    const prompt = `Guest request: ${query}${maxBudgetUsd ? ` (Max budget: $${maxBudgetUsd}/night)` : ''}\n\nCandidates JSON:\n${JSON.stringify(candidates).slice(0, 6000)}`;
    let parsed;
    try {
      const out = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: SYS, responseMimeType: 'application/json' },
      });
      const txt = (out.text || '').trim().replace(/^```json\s*|\s*```$/g, '');
      parsed = JSON.parse(txt);
    } catch (e) {
      console.warn('[aiConcierge] Gemini failed:', e.message);
      parsed = {
        matches: candidates.slice(0, 3).map(c => ({ hotelId: c.id, reason: `${c.name} in ${c.city}.` })),
        advice: 'Showing top picks based on your filters.',
      };
    }

    // Enrich with hotel detail
    const enriched = (parsed.matches || []).map(m => {
      const h = candidates.find(c => c.id === m.hotelId);
      return h ? { ...m, hotel: h } : null;
    }).filter(Boolean).slice(0, 3);

    res.json({ matches: enriched, advice: parsed.advice || '', source: 'gemini' });
  } catch (e) { next(e); }
});

export default r;
