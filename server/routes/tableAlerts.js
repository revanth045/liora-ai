import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toA = (a) => a && ({
  id: a.id, restaurantName: a.restaurant_name, tableNumber: a.table_number,
  action: a.action, message: a.message, status: a.status,
  orderId: a.order_id, createdAt: Number(a.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantName } = req.query;
    const rows = restaurantName
      ? await q('SELECT * FROM table_alerts WHERE LOWER(restaurant_name)=LOWER($1) AND status=\'active\' ORDER BY created_at DESC', [restaurantName])
      : await q('SELECT * FROM table_alerts WHERE status=\'active\' ORDER BY created_at DESC LIMIT 200');
    res.json(rows.map(toA));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const a = req.body || {};
    const id = a.id || randomUUID();
    const row = await q1(`INSERT INTO table_alerts (id, restaurant_name, table_number, action, message, status, order_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, a.restaurantName, a.tableNumber, a.action, a.message || '', 'active', a.orderId || null]);
    res.status(201).json(toA(row));
  } catch (e) { next(e); }
});

r.patch('/:id/dismiss', async (req, res, next) => {
  try {
    await q('UPDATE table_alerts SET status=\'dismissed\' WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
