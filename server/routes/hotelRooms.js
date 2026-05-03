import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toR = (rm) => rm && ({
  id: rm.id, hotelId: rm.hotel_id, name: rm.name, type: rm.type,
  description: rm.description, pricePerNightCents: rm.price_per_night_cents,
  capacityAdults: rm.capacity_adults, capacityChildren: rm.capacity_children,
  totalUnits: rm.total_units, amenities: rm.amenities,
  imageUrls: rm.image_urls, active: rm.active,
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM hotel_rooms WHERE hotel_id=$1', [req.query.hotelId || '']);
    res.json(rows.map(toR));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const rm = req.body || {};
    const id = rm.id || randomUUID();
    const row = await q1(`INSERT INTO hotel_rooms (id, hotel_id, name, type, description, price_per_night_cents,
      capacity_adults, capacity_children, total_units, amenities, image_urls, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, description=EXCLUDED.description,
        price_per_night_cents=EXCLUDED.price_per_night_cents, capacity_adults=EXCLUDED.capacity_adults,
        capacity_children=EXCLUDED.capacity_children, total_units=EXCLUDED.total_units,
        amenities=EXCLUDED.amenities, image_urls=EXCLUDED.image_urls, active=EXCLUDED.active
      RETURNING *`,
      [id, rm.hotelId, rm.name, rm.type || 'double', rm.description || null,
       Number(rm.pricePerNightCents) || 0, Number(rm.capacityAdults) || 2,
       Number(rm.capacityChildren) || 0, Number(rm.totalUnits) || 1,
       JSON.stringify(rm.amenities || []), JSON.stringify(rm.imageUrls || []),
       rm.active !== false]);
    res.json(toR(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM hotel_rooms WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
