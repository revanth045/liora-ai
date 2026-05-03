import { Router } from 'express';
import { q } from '../db.js';

const r = Router();

// GET /suggestions/:hotelId — returns per-room suggested prices for the next 14 days
r.get('/suggestions/:hotelId', async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const rooms = await q('SELECT * FROM hotel_rooms WHERE hotel_id=$1 AND active=true', [hotelId]);
    const bookings = await q(
      `SELECT * FROM hotel_bookings WHERE hotel_id=$1 AND status<>'cancelled'
         AND check_out >= (CURRENT_DATE - INTERVAL '90 days')`, [hotelId]);

    const today = new Date(); today.setHours(0,0,0,0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i);
      return d;
    });

    const suggestions = rooms.map(room => {
      const totalUnits = Math.max(1, room.total_units || 1);
      const base = room.price_per_night_cents;
      // 90-day historical occupancy by day-of-week
      const dowOcc = [0,0,0,0,0,0,0]; const dowCount = [0,0,0,0,0,0,0];
      const roomBookings = bookings.filter(b => b.room_id === room.id);
      for (let off = -90; off < 0; off++) {
        const d = new Date(today); d.setDate(d.getDate() + off);
        const occ = roomBookings.filter(b => {
          const ci = new Date(b.check_in), co = new Date(b.check_out);
          return d >= ci && d < co;
        }).length / totalUnits;
        dowOcc[d.getDay()] += occ; dowCount[d.getDay()] += 1;
      }
      const dowAvg = dowOcc.map((s, i) => dowCount[i] ? s / dowCount[i] : 0);

      // Per-day suggestion
      const perDay = days.map(d => {
        const dowFactor = dowAvg[d.getDay()];                       // 0..1+
        const leadDays  = (d - today) / (24 * 3600 * 1000);
        const leadFactor = leadDays < 3 ? 0.92 : leadDays > 21 ? 0.95 : 1.0;  // last-min discount, far-out slight discount
        // Demand multiplier: 1.0 at 30% historic occupancy → 1.25 at 100%
        const demandMult = 1 + Math.max(0, (dowFactor - 0.3)) * 0.36;
        const suggested = Math.round(base * demandMult * leadFactor);
        const occToday = roomBookings.filter(b => {
          const ci = new Date(b.check_in), co = new Date(b.check_out);
          return d >= ci && d < co;
        }).length;
        const soldOut = occToday >= totalUnits;
        return {
          date: d.toISOString().slice(0, 10),
          dow: d.toLocaleDateString('en', { weekday: 'short' }),
          basePriceCents: base,
          suggestedPriceCents: suggested,
          occupancyHistory: Math.round(dowFactor * 100),
          occupancyToday: occToday,
          totalUnits,
          soldOut,
          deltaPct: Math.round(((suggested - base) / base) * 100),
        };
      });

      // 14-day average suggested vs base
      const avgSuggested = Math.round(perDay.reduce((s, d) => s + d.suggestedPriceCents, 0) / perDay.length);
      const avgDeltaPct = Math.round(((avgSuggested - base) / base) * 100);

      return {
        roomId: room.id, roomName: room.name, type: room.type,
        currentPriceCents: base,
        avgSuggestedCents: avgSuggested,
        avgDeltaPct,
        days: perDay,
      };
    });

    res.json({ generatedAt: Date.now(), hotelId, suggestions });
  } catch (e) { next(e); }
});

// POST /apply — bulk update room base prices
r.post('/apply', async (req, res, next) => {
  try {
    const updates = req.body?.updates || [];   // [{ roomId, priceCents }]
    if (!Array.isArray(updates) || !updates.length) return res.status(400).json({ error: 'updates required' });
    let n = 0;
    for (const u of updates) {
      if (!u.roomId || !Number.isFinite(u.priceCents)) continue;
      await q('UPDATE hotel_rooms SET price_per_night_cents=$1 WHERE id=$2', [Math.max(0, Math.round(u.priceCents)), u.roomId]);
      n++;
    }
    res.json({ ok: true, applied: n });
  } catch (e) { next(e); }
});

export default r;
