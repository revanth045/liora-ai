import { Router } from 'express';
import { q } from '../db.js';

const r = Router();

r.get('/dashboard', async (req, res, next) => {
  try {
    const { restaurantId = '' } = req.query;
    const rows = await q('SELECT * FROM orders WHERE restaurant_id=$1', [restaurantId]);
    const dayMs = 86400000;
    const cutoff = Date.now() - dayMs;
    const today = rows.filter(o => Number(o.created_at) > cutoff);
    res.json({
      todaySales: today.reduce((s, o) => s + o.total_cents, 0),
      todayOrders: today.length,
      liveOrders: {
        pending: rows.filter(o => o.status === 'pending').length,
        preparing: rows.filter(o => o.status === 'preparing').length,
      },
    });
  } catch (e) { next(e); }
});

export default r;
