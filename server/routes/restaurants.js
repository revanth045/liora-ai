import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toR = (x) => x && ({
  id: x.id, ownerId: x.owner_id, name: x.name, address: x.address, phone: x.phone,
  website: x.website, staffCode: x.staff_code, cuisine: x.cuisine, bio: x.bio,
  logoUrl: x.logo_url, brandColor: x.brand_color, accentColor: x.accent_color,
  heroImageUrl: x.hero_image_url, tagline: x.tagline, theme: x.theme,
  hours: x.hours, menuMeta: x.menu_meta, acceptsPrepay: x.accepts_prepay,
});

r.get('/', async (req, res, next) => {
  try {
    const { ownerId } = req.query;
    const rows = ownerId
      ? await q('SELECT * FROM restaurants WHERE owner_id=$1', [ownerId])
      : await q('SELECT * FROM restaurants');
    res.json(rows.map(toR));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM restaurants WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toR(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const x = req.body || {};
    const id = x.id || randomUUID();
    const row = await q1(`
      INSERT INTO restaurants (id, owner_id, name, address, phone, website, staff_code, cuisine, bio,
        logo_url, brand_color, accent_color, hero_image_url, tagline, theme, hours, menu_meta, accepts_prepay)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, address=EXCLUDED.address, phone=EXCLUDED.phone,
        website=EXCLUDED.website, staff_code=EXCLUDED.staff_code, cuisine=EXCLUDED.cuisine, bio=EXCLUDED.bio,
        logo_url=EXCLUDED.logo_url, brand_color=EXCLUDED.brand_color, accent_color=EXCLUDED.accent_color,
        hero_image_url=EXCLUDED.hero_image_url, tagline=EXCLUDED.tagline, theme=EXCLUDED.theme,
        hours=EXCLUDED.hours, menu_meta=EXCLUDED.menu_meta, accepts_prepay=EXCLUDED.accepts_prepay,
        updated_at=$19 RETURNING *`,
      [id, x.ownerId, x.name || '', x.address || null, x.phone || null, x.website || null,
       x.staffCode || null, x.cuisine || null, x.bio || null, x.logoUrl || null,
       x.brandColor || null, x.accentColor || null, x.heroImageUrl || null, x.tagline || null,
       x.theme || null, JSON.stringify(x.hours || []), JSON.stringify(x.menuMeta || {}),
       x.acceptsPrepay === true, Date.now()]);
    res.status(201).json(toR(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM restaurants WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
