import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toH = (h) => h && ({
  id: h.id, ownerId: h.owner_id, name: h.name, description: h.description,
  address: h.address, city: h.city, country: h.country,
  latitude: h.latitude != null ? Number(h.latitude) : undefined,
  longitude: h.longitude != null ? Number(h.longitude) : undefined,
  phone: h.phone, email: h.email, website: h.website,
  starRating: h.star_rating, amenities: h.amenities,
  heroImageUrl: h.hero_image_url, galleryUrls: h.gallery_urls,
  brandColor: h.brand_color, accentColor: h.accent_color,
  policies: h.policies, createdAt: Number(h.created_at), updatedAt: Number(h.updated_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { ownerId } = req.query;
    const rows = ownerId
      ? await q('SELECT * FROM hotels WHERE owner_id=$1 ORDER BY created_at DESC', [ownerId])
      : await q('SELECT * FROM hotels ORDER BY created_at DESC');
    res.json(rows.map(toH));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM hotels WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toH(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const h = req.body || {};
    const id = h.id || randomUUID();
    const ts = Date.now();
    const row = await q1(`
      INSERT INTO hotels (id, owner_id, name, description, address, city, country, latitude, longitude,
        phone, email, website, star_rating, amenities, hero_image_url, gallery_urls,
        brand_color, accent_color, policies, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16::jsonb,$17,$18,$19::jsonb,$20,$21)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
        address=EXCLUDED.address, city=EXCLUDED.city, country=EXCLUDED.country,
        latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
        phone=EXCLUDED.phone, email=EXCLUDED.email, website=EXCLUDED.website,
        star_rating=EXCLUDED.star_rating, amenities=EXCLUDED.amenities,
        hero_image_url=EXCLUDED.hero_image_url, gallery_urls=EXCLUDED.gallery_urls,
        brand_color=EXCLUDED.brand_color, accent_color=EXCLUDED.accent_color,
        policies=EXCLUDED.policies, updated_at=$21 RETURNING *`,
      [id, h.ownerId, h.name, h.description || null, h.address || null, h.city || null,
       h.country || null, h.latitude ?? null, h.longitude ?? null, h.phone || null,
       h.email || null, h.website || null, h.starRating || null,
       JSON.stringify(h.amenities || []), h.heroImageUrl || null,
       JSON.stringify(h.galleryUrls || []), h.brandColor || null, h.accentColor || null,
       JSON.stringify(h.policies || {}), h.createdAt || ts, ts]);
    res.json(toH(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    await q('DELETE FROM hotel_bookings WHERE hotel_id=$1', [req.params.id]);
    await q('DELETE FROM hotel_addons WHERE hotel_id=$1', [req.params.id]);
    await q('DELETE FROM hotel_rooms WHERE hotel_id=$1', [req.params.id]);
    await q('DELETE FROM hotel_reviews WHERE hotel_id=$1', [req.params.id]);
    await q('DELETE FROM hotel_offers WHERE hotel_id=$1', [req.params.id]);
    await q('DELETE FROM hotels WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
