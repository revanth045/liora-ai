import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toC = (c) => c && ({
  id: c.id, restaurantId: c.restaurant_id, name: c.name, description: c.description,
  priceCents: c.price_cents, isAvailable: c.is_available, category: c.category,
  chefNote: c.chef_note, imageEmoji: c.image_emoji,
});

r.get('/', async (req, res, next) => {
  try { res.json((await q('SELECT * FROM chef_specials WHERE restaurant_id=$1', [req.query.restaurantId || ''])).map(toC)); }
  catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const c = req.body || {};
    const id = c.id || randomUUID();
    const row = await q1(`INSERT INTO chef_specials (id, restaurant_id, name, description, price_cents, is_available, category, chef_note, image_emoji)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, price_cents=EXCLUDED.price_cents,
        is_available=EXCLUDED.is_available, category=EXCLUDED.category, chef_note=EXCLUDED.chef_note, image_emoji=EXCLUDED.image_emoji
      RETURNING *`,
      [id, c.restaurantId, c.name, c.description || '', Number(c.priceCents) || 0,
       c.isAvailable !== false, c.category || 'daily_special', c.chefNote || null, c.imageEmoji || null]);
    res.json(toC(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM chef_specials WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
