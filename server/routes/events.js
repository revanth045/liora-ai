import { Router } from 'express';
import { q } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const rows = restaurantId
      ? await q('SELECT * FROM events WHERE restaurant_id=$1 ORDER BY ts DESC LIMIT 500', [restaurantId])
      : await q('SELECT * FROM events ORDER BY ts DESC LIMIT 500');
    res.json(rows.map(e => ({ id: e.id, restaurantId: e.restaurant_id, type: e.type, ts: Number(e.ts) })));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const ev = req.body || {};
    await q('INSERT INTO events (id, restaurant_id, type) VALUES ($1,$2,$3)',
      [randomUUID(), ev.restaurantId || null, ev.type || 'unknown']);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
