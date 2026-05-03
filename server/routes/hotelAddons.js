import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toA = (a) => a && ({
  id: a.id, hotelId: a.hotel_id, name: a.name, description: a.description,
  priceCents: a.price_cents, perPerson: a.per_person, active: a.active,
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM hotel_addons WHERE hotel_id=$1', [req.query.hotelId || '']);
    res.json(rows.map(toA));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const a = req.body || {};
    const id = a.id || randomUUID();
    const row = await q1(`INSERT INTO hotel_addons (id, hotel_id, name, description, price_cents, per_person, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
        price_cents=EXCLUDED.price_cents, per_person=EXCLUDED.per_person, active=EXCLUDED.active
      RETURNING *`,
      [id, a.hotelId, a.name, a.description || null, Number(a.priceCents) || 0,
       a.perPerson === true, a.active !== false]);
    res.json(toA(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM hotel_addons WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
