import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toO = (o) => o && ({
  id: o.id, hotelId: o.hotel_id, title: o.title, description: o.description,
  type: o.type, value: Number(o.value), code: o.code, active: o.active,
  validUntil: o.valid_until, minNights: o.min_nights, appliesTo: o.applies_to,
  createdAt: Number(o.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { hotelId, activeOnly } = req.query;
    let sql = 'SELECT * FROM hotel_offers WHERE 1=1';
    const params = [];
    if (hotelId) { params.push(hotelId); sql += ` AND hotel_id=$${params.length}`; }
    if (activeOnly === 'true') sql += ' AND active=true';
    sql += ' ORDER BY created_at DESC';
    res.json((await q(sql, params)).map(toO));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const o = req.body || {};
    if (!o.hotelId || !o.title || !o.type) return res.status(400).json({ error: 'hotelId, title, type required' });
    const id = o.id || randomUUID();
    const row = await q1(`INSERT INTO hotel_offers (id, hotel_id, title, description, type, value, code, active, valid_until, min_nights, applies_to)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, type=EXCLUDED.type,
        value=EXCLUDED.value, code=EXCLUDED.code, active=EXCLUDED.active, valid_until=EXCLUDED.valid_until,
        min_nights=EXCLUDED.min_nights, applies_to=EXCLUDED.applies_to RETURNING *`,
      [id, o.hotelId, o.title, o.description || null, o.type, Number(o.value) || 0,
       o.code || ('STAY' + Math.random().toString(36).slice(2, 6).toUpperCase()),
       o.active !== false, o.validUntil || null, Number(o.minNights) || 1, o.appliesTo || 'all']);
    res.json(toO(row));
  } catch (e) { next(e); }
});

r.patch('/:id/toggle', async (req, res, next) => {
  try {
    const row = await q1('UPDATE hotel_offers SET active = NOT active WHERE id=$1 RETURNING *', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toO(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM hotel_offers WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

// Validate a code against a candidate booking
r.post('/validate', async (req, res, next) => {
  try {
    const { code, hotelId, roomId, nights } = req.body || {};
    if (!code || !hotelId) return res.status(400).json({ error: 'code, hotelId required' });
    const o = await q1('SELECT * FROM hotel_offers WHERE UPPER(code)=UPPER($1) AND hotel_id=$2 AND active=true',
      [code, hotelId]);
    if (!o) return res.status(404).json({ error: 'Invalid or inactive offer code' });
    if (o.applies_to !== 'all' && roomId && o.applies_to !== roomId)
      return res.status(400).json({ error: 'Offer does not apply to this room' });
    if (nights != null && nights < o.min_nights)
      return res.status(400).json({ error: `Minimum ${o.min_nights} night(s) required` });
    res.json({ valid: true, offer: toO(o) });
  } catch (e) { next(e); }
});

export default r;
