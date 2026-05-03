import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toT = (t) => t && ({ id: t.id, restaurantId: t.restaurant_id, number: t.number, label: t.label, seats: t.seats });

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM tables WHERE restaurant_id=$1 ORDER BY number ASC', [req.query.restaurantId || '']);
    res.json(rows.map(toT));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const t = req.body || {};
    const id = t.id || randomUUID();
    const row = await q1(`INSERT INTO tables (id, restaurant_id, number, label, seats)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET number=EXCLUDED.number, label=EXCLUDED.label, seats=EXCLUDED.seats RETURNING *`,
      [id, t.restaurantId, Number(t.number), t.label || null, t.seats || null]);
    res.json(toT(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM tables WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
