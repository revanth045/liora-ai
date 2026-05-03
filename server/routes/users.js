import { Router } from 'express';
import { q, q1 } from '../db.js';

const r = Router();
const toU = (u) => u && ({
  id: u.id, email: u.email, role: u.role, name: u.name,
  restaurantId: u.restaurant_id,
  createdAt: Number(u.created_at), lastLoginAt: u.last_login_at && Number(u.last_login_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { email } = req.query;
    const rows = email
      ? await q('SELECT * FROM users WHERE email=$1', [email])
      : await q('SELECT * FROM users LIMIT 200');
    res.json(rows.map(toU));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const u = req.body || {};
    if (!u.id || !u.email || !u.role) return res.status(400).json({ error: 'id, email, role required' });
    const row = await q1(`
      INSERT INTO users (id, email, role, name, restaurant_id, last_login_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, role=EXCLUDED.role, name=EXCLUDED.name,
        restaurant_id=EXCLUDED.restaurant_id, last_login_at=EXCLUDED.last_login_at
      RETURNING *`,
      [u.id, u.email.toLowerCase(), u.role, u.name || null, u.restaurantId || null, Date.now()]);
    res.status(201).json(toU(row));
  } catch (e) {
    if (e.code === '23505') {
      // email collision — return existing
      const row = await q1('SELECT * FROM users WHERE email=$1', [(req.body.email || '').toLowerCase()]);
      return res.json(toU(row));
    }
    next(e);
  }
});

export default r;
