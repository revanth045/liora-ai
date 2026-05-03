import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toP = (p) => p && ({
  id: p.id, restaurantId: p.restaurant_id, title: p.title, description: p.description,
  type: p.type, value: Number(p.value), code: p.code, isActive: p.is_active,
  validUntil: p.valid_until, usageCount: p.usage_count, maxUsage: p.max_usage,
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    if (restaurantId) res.json((await q('SELECT * FROM promotions WHERE restaurant_id=$1', [restaurantId])).map(toP));
    else res.json((await q('SELECT * FROM promotions WHERE is_active=true')).map(toP));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const p = req.body || {};
    const id = p.id || randomUUID();
    const row = await q1(`
      INSERT INTO promotions (id, restaurant_id, title, description, type, value, code, is_active, valid_until, max_usage, usage_count)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, type=EXCLUDED.type,
        value=EXCLUDED.value, code=EXCLUDED.code, is_active=EXCLUDED.is_active, valid_until=EXCLUDED.valid_until,
        max_usage=EXCLUDED.max_usage RETURNING *`,
      [id, p.restaurantId || 'demo', p.title, p.description || '', p.type, Number(p.value) || 0,
       p.code || ('PROMO' + Math.random().toString(36).slice(2, 6).toUpperCase()),
       p.isActive !== false, p.validUntil || null, p.maxUsage || null, p.usageCount || 0]);
    res.status(201).json(toP(row));
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const p = req.body || {};
    const row = await q1(`UPDATE promotions SET title=$2, description=$3, type=$4, value=$5, code=$6,
      is_active=$7, valid_until=$8, max_usage=$9 WHERE id=$1 RETURNING *`,
      [req.params.id, p.title, p.description || '', p.type, Number(p.value) || 0,
       p.code || null, p.isActive !== false, p.validUntil || null, p.maxUsage || null]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toP(row));
  } catch (e) { next(e); }
});

r.patch('/:id/toggle', async (req, res, next) => {
  try {
    const row = await q1('UPDATE promotions SET is_active = NOT is_active WHERE id=$1 RETURNING *', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toP(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM promotions WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

r.post('/validate', async (req, res, next) => {
  try {
    const { code, restaurantId = 'demo' } = req.body;
    const row = await q1('SELECT * FROM promotions WHERE UPPER(code)=UPPER($1) AND restaurant_id=$2 AND is_active=true',
      [code, restaurantId]);
    if (!row) return res.status(404).json({ error: 'Invalid or expired promo code' });
    if (row.max_usage && row.usage_count >= row.max_usage) return res.status(400).json({ error: 'Promo code has reached max usage' });
    await q('UPDATE promotions SET usage_count = usage_count + 1 WHERE id=$1', [row.id]);
    res.json({ valid: true, promo: toP(row) });
  } catch (e) { next(e); }
});

export default r;
