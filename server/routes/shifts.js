import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toS = (s) => s && ({
  id: s.id, restaurantId: s.restaurant_id, staffId: s.staff_id,
  weekStart: s.week_start, day: s.day, startTime: s.start_time, endTime: s.end_time, notes: s.notes,
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM shifts WHERE restaurant_id=$1 AND week_start=$2',
      [req.query.restaurantId || '', req.query.weekStart || '']);
    res.json(rows.map(toS));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const s = req.body || {};
    const id = s.id || randomUUID();
    const row = await q1(`INSERT INTO shifts (id, restaurant_id, staff_id, week_start, day, start_time, end_time, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET staff_id=EXCLUDED.staff_id, day=EXCLUDED.day,
        start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time, notes=EXCLUDED.notes
      RETURNING *`,
      [id, s.restaurantId, s.staffId, s.weekStart, s.day, s.startTime, s.endTime, s.notes || null]);
    res.status(201).json(toS(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM shifts WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
