import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toD = (s) => s && ({
  id: s.id, restaurantId: s.restaurant_id, restaurantName: s.restaurant_name,
  tableNumber: s.table_number, items: s.items, status: s.status,
  subtotalCents: s.subtotal_cents, taxCents: s.tax_cents, serviceFeeCents: s.service_fee_cents,
  tipCents: s.tip_cents, totalCents: s.total_cents, createdAt: Number(s.created_at),
  paidAt: s.paid_at && Number(s.paid_at), receiptToken: s.receipt_token,
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM dine_sessions WHERE restaurant_id=$1 ORDER BY created_at DESC', [req.query.restaurantId || '']);
    res.json(rows.map(toD));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM dine_sessions WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toD(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const s = req.body || {};
    const id = s.id || randomUUID();
    const row = await q1(`INSERT INTO dine_sessions (id, restaurant_id, restaurant_name, table_number, items, status,
      subtotal_cents, tax_cents, service_fee_cents, tip_cents, total_cents, created_at, paid_at, receipt_token)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO UPDATE SET items=EXCLUDED.items, status=EXCLUDED.status,
        subtotal_cents=EXCLUDED.subtotal_cents, tax_cents=EXCLUDED.tax_cents,
        service_fee_cents=EXCLUDED.service_fee_cents, tip_cents=EXCLUDED.tip_cents,
        total_cents=EXCLUDED.total_cents, paid_at=EXCLUDED.paid_at, receipt_token=EXCLUDED.receipt_token
      RETURNING *`,
      [id, s.restaurantId, s.restaurantName, s.tableNumber, JSON.stringify(s.items || []),
       s.status || 'open', s.subtotalCents || 0, s.taxCents || 0, s.serviceFeeCents || 0,
       s.tipCents || 0, s.totalCents || 0, s.createdAt || Date.now(),
       s.paidAt || null, s.receiptToken || null]);
    res.json(toD(row));
  } catch (e) { next(e); }
});

export default r;
