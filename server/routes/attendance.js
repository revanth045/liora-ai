import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toA = (a) => a && ({
  id: a.id, staffId: a.staff_id, restaurantId: a.restaurant_id, date: a.date,
  clockIn: a.clock_in || '', clockOut: a.clock_out || '', status: a.status, notes: a.notes || '',
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId, date } = req.query;
    let sql = 'SELECT * FROM attendance WHERE restaurant_id=$1';
    const params = [restaurantId || ''];
    if (date) { params.push(date); sql += ` AND date=$${params.length}`; }
    res.json((await q(sql, params)).map(toA));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const a = req.body || {};
    const id = a.id || randomUUID();
    const row = await q1(`INSERT INTO attendance (id, staff_id, restaurant_id, date, clock_in, clock_out, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (staff_id, date) DO UPDATE SET clock_in=EXCLUDED.clock_in, clock_out=EXCLUDED.clock_out,
        status=EXCLUDED.status, notes=EXCLUDED.notes RETURNING *`,
      [id, a.staffId, a.restaurantId, a.date, a.clockIn || null, a.clockOut || null, a.status, a.notes || null]);
    res.json(toA(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM attendance WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
