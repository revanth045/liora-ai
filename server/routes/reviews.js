import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toR = (x) => x && ({
  id: x.id, restaurantId: x.restaurant_id, customerName: x.customer_name,
  rating: x.rating, text: x.text, reply: x.reply, replied: x.replied,
  repliedAt: x.replied_at && Number(x.replied_at), createdAt: Number(x.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { restaurantId = 'demo' } = req.query;
    const rows = (await q('SELECT * FROM reviews WHERE restaurant_id=$1 ORDER BY created_at DESC', [restaurantId])).map(toR);
    const avgRating = rows.length ? Number((rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)) : 0;
    const distribution = [5,4,3,2,1].map(star => ({ star, count: rows.filter(r => r.rating === star).length }));
    res.json({ reviews: rows, avgRating, totalCount: rows.length, distribution });
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { restaurantId = 'demo', customerName, rating, text } = req.body;
    if (!customerName || !rating || !text) return res.status(400).json({ error: 'Missing required fields' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5' });
    const row = await q1(`INSERT INTO reviews (id, restaurant_id, customer_name, rating, text)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [randomUUID(), restaurantId, customerName, Number(rating), text]);
    res.status(201).json(toR(row));
  } catch (e) { next(e); }
});

r.patch('/:id/reply', async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ error: 'Reply required' });
    const row = await q1('UPDATE reviews SET reply=$2, replied=true, replied_at=$3 WHERE id=$1 RETURNING *',
      [req.params.id, reply, Date.now()]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toR(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM reviews WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
