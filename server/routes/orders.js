import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const now = () => Date.now();

const rowToOrder = (o) => o && ({
  id: o.id, restaurantId: o.restaurant_id, customerName: o.customer_name,
  customerEmail: o.customer_email, tableNumber: o.table_number,
  items: o.items, status: o.status, totalCents: o.total_cents,
  notes: o.notes, allergens: o.allergens, paymentMethod: o.payment_method,
  paymentStatus: o.payment_status, cardLast4: o.card_last4,
  createdAt: Number(o.created_at), updatedAt: Number(o.updated_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId, status } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (restaurantId) { params.push(restaurantId); sql += ` AND restaurant_id = $${params.length}`; }
    if (status && status !== 'all') { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    res.json((await q(sql, params)).map(rowToOrder));
  } catch (e) { next(e); }
});

r.get('/all', async (_req, res, next) => {
  try { res.json((await q('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500')).map(rowToOrder)); }
  catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json(rowToOrder(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const o = req.body || {};
    const id = o.id || randomUUID();
    const ts = o.createdAt || now();
    const totalCents = o.totalCents ?? (o.items || []).reduce((s, i) => s + (i.priceCents || 0) * (i.qty || 1), 0);
    const row = await q1(`
      INSERT INTO orders (id, restaurant_id, customer_name, customer_email, table_number,
                          items, status, total_cents, notes, allergens,
                          payment_method, payment_status, card_last4, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at
      RETURNING *`,
      [id, o.restaurantId || 'demo', o.customerName || 'Guest', o.customerEmail || null,
       o.tableNumber || null, JSON.stringify(o.items || []), o.status || 'pending',
       totalCents, o.notes || null, JSON.stringify(o.allergens || []),
       o.paymentMethod || null, o.paymentStatus || null, o.cardLast4 || null, ts, ts]);
    res.status(201).json(rowToOrder(row));
  } catch (e) { next(e); }
});

r.patch('/:id/status', async (req, res, next) => {
  try {
    const valid = ['pending', 'preparing', 'ready', 'delivered', 'rejected'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    const row = await q1('UPDATE orders SET status=$2, updated_at=$3 WHERE id=$1 RETURNING *',
      [req.params.id, req.body.status, now()]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToOrder(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM orders WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

r.get('/analytics/summary', async (req, res, next) => {
  try {
    const { restaurantId = 'demo' } = req.query;
    const dayMs = 86400000;
    const cutoff = Date.now() - dayMs;
    const rows = await q('SELECT * FROM orders WHERE restaurant_id = $1', [restaurantId]);
    const today = rows.filter(o => Number(o.created_at) > cutoff);
    const todaySales = today.reduce((s, o) => s + o.total_cents, 0);
    const pending = rows.filter(o => o.status === 'pending').length;
    const preparing = rows.filter(o => o.status === 'preparing').length;
    const items = {};
    rows.forEach(o => (o.items || []).forEach(i => { items[i.name] = (items[i.name] || 0) + (i.qty || 1); }));
    const topItems = Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    res.json({ todaySales, todayOrderCount: today.length, pending, preparing, topItems });
  } catch (e) { next(e); }
});

export default r;
