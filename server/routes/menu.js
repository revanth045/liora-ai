import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toItem = (m) => m && ({
  id: m.id, restaurantId: m.restaurant_id, name: m.name,
  description: m.description, priceCents: m.price_cents, tags: m.tags,
  available: m.available, category: m.category, imageUrl: m.image_url,
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId, category } = req.query;
    let sql = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];
    if (restaurantId) { params.push(restaurantId); sql += ` AND restaurant_id=$${params.length}`; }
    if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
    res.json((await q(sql, params)).map(toItem));
  } catch (e) { next(e); }
});

r.get('/categories', async (req, res, next) => {
  try {
    const rows = await q('SELECT DISTINCT category FROM menu_items WHERE restaurant_id=$1 AND category IS NOT NULL', [req.query.restaurantId || 'demo']);
    res.json(rows.map(r => r.category));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM menu_items WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toItem(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const m = req.body || {};
    const id = m.id || randomUUID();
    const row = await q1(`
      INSERT INTO menu_items (id, restaurant_id, name, description, price_cents, tags, available, category, image_url, created_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, price_cents=EXCLUDED.price_cents,
        tags=EXCLUDED.tags, available=EXCLUDED.available, category=EXCLUDED.category, image_url=EXCLUDED.image_url, updated_at=$10
      RETURNING *`,
      [id, m.restaurantId || 'demo', m.name, m.description || '', Number(m.priceCents) || 0,
       JSON.stringify(m.tags || []), m.available !== false, m.category || 'Mains', m.imageUrl || '', Date.now()]);
    res.status(201).json(toItem(row));
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const m = req.body || {};
    const row = await q1(`UPDATE menu_items SET name=$2, description=$3, price_cents=$4, tags=$5::jsonb,
      available=$6, category=$7, image_url=$8, updated_at=$9 WHERE id=$1 RETURNING *`,
      [req.params.id, m.name, m.description || '', Number(m.priceCents) || 0,
       JSON.stringify(m.tags || []), m.available !== false, m.category || 'Mains', m.imageUrl || '', Date.now()]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toItem(row));
  } catch (e) { next(e); }
});

r.patch('/:id/toggle', async (req, res, next) => {
  try {
    const row = await q1('UPDATE menu_items SET available = NOT available, updated_at=$2 WHERE id=$1 RETURNING *', [req.params.id, Date.now()]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toItem(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM menu_items WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
