import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toS = (s) => s && ({
  id: s.id, restaurantId: s.restaurant_id, name: s.name, role: s.role,
  phone: s.phone, email: s.email,
  hourlyRate: s.hourly_rate != null ? Number(s.hourly_rate) : undefined,
  status: s.status, notes: s.notes, createdAt: Number(s.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM staff WHERE restaurant_id=$1 ORDER BY name ASC', [req.query.restaurantId || '']);
    res.json(rows.map(toS));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const s = req.body || {};
    const id = s.id || randomUUID();
    const row = await q1(`INSERT INTO staff (id, restaurant_id, name, role, phone, email, hourly_rate, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, phone=EXCLUDED.phone,
        email=EXCLUDED.email, hourly_rate=EXCLUDED.hourly_rate, status=EXCLUDED.status, notes=EXCLUDED.notes
      RETURNING *`,
      [id, s.restaurantId, s.name, s.role, s.phone || null, s.email || null,
       s.hourlyRate ?? null, s.status || 'active', s.notes || null]);
    res.status(201).json(toS(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    await q('DELETE FROM shifts WHERE staff_id=$1', [req.params.id]);
    await q('DELETE FROM staff WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
