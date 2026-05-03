import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';
import { broadcastNotification } from './hotelNotifications.js';

const r = Router();
const toR = (x) => x && ({
  id: x.id, hotelId: x.hotel_id, bookingId: x.booking_id,
  guestName: x.guest_name, guestEmail: x.guest_email,
  rating: x.rating, comment: x.comment,
  photoUrls: Array.isArray(x.photo_urls) ? x.photo_urls : (x.photo_urls || []),
  ownerResponse: x.owner_response,
  ownerResponseAt: x.owner_response_at && Number(x.owner_response_at),
  createdAt: Number(x.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { hotelId, guestEmail } = req.query;
    let sql = 'SELECT * FROM hotel_reviews WHERE 1=1';
    const params = [];
    if (hotelId) { params.push(hotelId); sql += ` AND hotel_id=$${params.length}`; }
    if (guestEmail) { params.push(guestEmail); sql += ` AND guest_email=$${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    res.json((await q(sql, params)).map(toR));
  } catch (e) { next(e); }
});

// Customer submits review after a completed stay (B7)
r.post('/', async (req, res, next) => {
  try {
    const x = req.body || {};
    if (!x.hotelId || !x.guestName || !x.rating || x.rating < 1 || x.rating > 5)
      return res.status(400).json({ error: 'hotelId, guestName, rating(1-5) required' });

    // If a bookingId is supplied, verify it exists and belongs to that hotel.
    if (x.bookingId) {
      const booking = await q1('SELECT id, status FROM hotel_bookings WHERE id=$1 AND hotel_id=$2',
        [x.bookingId, x.hotelId]);
      if (!booking) return res.status(404).json({ error: 'Booking not found for this hotel' });
      // Optional: only allow reviews for completed stays; for demo we permit any non-cancelled.
      if (booking.status === 'cancelled') return res.status(400).json({ error: 'Cannot review a cancelled booking' });
    }

    const id = x.id || randomUUID();
    const photos = Array.isArray(x.photoUrls) ? x.photoUrls.slice(0, 6) : [];
    const row = await q1(`INSERT INTO hotel_reviews (id, hotel_id, booking_id, guest_name, guest_email, rating, comment, photo_urls)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        hotel_id=EXCLUDED.hotel_id, booking_id=EXCLUDED.booking_id,
        guest_name=EXCLUDED.guest_name, guest_email=EXCLUDED.guest_email,
        rating=EXCLUDED.rating, comment=EXCLUDED.comment,
        photo_urls=EXCLUDED.photo_urls
      RETURNING *, (xmax = 0) AS _inserted`,
      [id, x.hotelId, x.bookingId || null, x.guestName, x.guestEmail || null,
       Number(x.rating), x.comment || null, JSON.stringify(photos)]);

    // Updates (e.g., guest editing their review) must not re-notify the owner.
    if (!row._inserted) return res.status(200).json(toR(row));

    // Notify owner of new review
    const notif = await q1(`INSERT INTO hotel_notifications (id, hotel_id, kind, title, body, meta)
      VALUES ($1, $2, 'review', $3, $4, $5::jsonb) RETURNING *`,
      [randomUUID(), x.hotelId, `${x.rating}★ review from ${x.guestName}`,
       (x.comment || '').slice(0, 200), JSON.stringify({ reviewId: id })]);
    broadcastNotification(x.hotelId, {
      id: notif.id, hotelId: x.hotelId, kind: 'review',
      title: notif.title, body: notif.body, meta: notif.meta,
      createdAt: Number(notif.created_at), read: false,
    });

    res.status(201).json(toR(row));
  } catch (e) { next(e); }
});

r.patch('/:id/respond', async (req, res, next) => {
  try {
    if (!req.body.response?.trim()) return res.status(400).json({ error: 'response required' });
    const row = await q1('UPDATE hotel_reviews SET owner_response=$2, owner_response_at=$3 WHERE id=$1 RETURNING *',
      [req.params.id, req.body.response, Date.now()]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toR(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM hotel_reviews WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
