import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';
import { broadcastNotification } from './hotelNotifications.js';

const r = Router();

const subscribers = new Map();
function subKey(hotelId, guestEmail) { return `${hotelId}::${(guestEmail || '').toLowerCase()}`; }
function broadcast(hotelId, guestEmail, msg) {
  const payload = `data: ${JSON.stringify(msg)}\n\n`;
  for (const k of [subKey(hotelId, guestEmail), `hotel::${hotelId}`]) {
    const set = subscribers.get(k);
    if (!set) continue;
    for (const res of set) { try { res.write(payload); } catch {} }
  }
}

const toM = (m) => m && ({
  id: m.id, hotelId: m.hotel_id, bookingId: m.booking_id,
  guestEmail: m.guest_email, guestName: m.guest_name,
  sender: m.sender, body: m.body,
  readByHotel: m.read_by_hotel, readByGuest: m.read_by_guest,
  createdAt: Number(m.created_at),
});

r.get('/stream', async (req, res) => {
  const { hotelId, guestEmail, bookingId } = req.query;
  if (!hotelId) return res.status(400).end();
  // Guest streams must prove booking ownership; hotel-wide streams stay
  // consistent with the other hotel-side SSE endpoints in this demo.
  if (guestEmail) {
    try {
      const [b] = await q(
        `SELECT 1 FROM hotel_bookings
           WHERE hotel_id=$1 AND LOWER(guest_email)=LOWER($2)
           ${bookingId ? 'AND id=$3' : ''} LIMIT 1`,
        bookingId ? [hotelId, guestEmail, bookingId] : [hotelId, guestEmail]
      );
      if (!b) return res.status(403).end();
    } catch { return res.status(500).end(); }
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(': connected\n\n');
  const key = guestEmail ? subKey(hotelId, guestEmail) : `hotel::${hotelId}`;
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(res);
  const hb = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 25_000);
  req.on('close', () => { clearInterval(hb); subscribers.get(key)?.delete(res); });
});

// List threads for a hotel (group by guest_email)
r.get('/threads', async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.json([]);
    const rows = await q(`
      SELECT guest_email, MAX(guest_name) AS guest_name, MAX(booking_id) AS booking_id,
             MAX(created_at) AS last_at, COUNT(*) FILTER (WHERE read_by_hotel=false AND sender='guest') AS unread,
             (SELECT body FROM hotel_messages m2 WHERE m2.hotel_id=$1 AND m2.guest_email=m.guest_email
              ORDER BY created_at DESC LIMIT 1) AS last_body
      FROM hotel_messages m WHERE hotel_id=$1
      GROUP BY guest_email ORDER BY last_at DESC LIMIT 100`, [hotelId]);
    res.json(rows.map(t => ({
      hotelId, guestEmail: t.guest_email, guestName: t.guest_name, bookingId: t.booking_id,
      lastAt: Number(t.last_at), unread: Number(t.unread), lastBody: t.last_body,
    })));
  } catch (e) { next(e); }
});

// List messages in a thread.
// Guests must supply a valid (bookingId, guestEmail) matching a booking on this
// hotel before any messages are returned. The hotel-side thread list (no
// guestEmail filter) is left open — same trust model as other hotel endpoints
// in this demo.
r.get('/', async (req, res, next) => {
  try {
    const { hotelId, guestEmail, bookingId } = req.query;
    if (!hotelId) return res.json([]);
    if (guestEmail) {
      const [bookingRow] = await q(
        `SELECT id FROM hotel_bookings
           WHERE hotel_id=$1 AND LOWER(guest_email)=LOWER($2)
           ${bookingId ? 'AND id=$3' : ''} LIMIT 1`,
        bookingId ? [hotelId, guestEmail, bookingId] : [hotelId, guestEmail]
      );
      if (!bookingRow) return res.status(403).json({ error: 'No booking found for this guest' });
    }
    const params = [hotelId];
    let sql = 'SELECT * FROM hotel_messages WHERE hotel_id=$1';
    if (guestEmail) { params.push(guestEmail); sql += ` AND LOWER(guest_email)=LOWER($${params.length})`; }
    if (bookingId)  { params.push(bookingId);  sql += ` AND booking_id=$${params.length}`; }
    sql += ' ORDER BY created_at ASC LIMIT 500';
    res.json((await q(sql, params)).map(toM));
  } catch (e) { next(e); }
});

// Verify a (hotelId, guestEmail, bookingId) triple matches a real booking.
// Acts as a lightweight access-control check in absence of full auth — preventing
// random clients from spoofing/reading conversations they shouldn't see.
async function verifyBookingOwnership(hotelId, guestEmail, bookingId) {
  if (!hotelId || !guestEmail || !bookingId) return false;
  const [b] = await q(
    `SELECT 1 FROM hotel_bookings
       WHERE id=$1 AND hotel_id=$2 AND LOWER(guest_email)=LOWER($3) LIMIT 1`,
    [bookingId, hotelId, guestEmail]
  );
  return !!b;
}

r.post('/', async (req, res, next) => {
  try {
    const m = req.body || {};
    if (!m.hotelId || !m.guestEmail || !m.sender || !m.body) {
      return res.status(400).json({ error: 'hotelId, guestEmail, sender, body required' });
    }
    if (m.sender !== 'guest' && m.sender !== 'hotel') {
      return res.status(400).json({ error: 'sender must be guest or hotel' });
    }
    if (m.body.length > 4000) {
      return res.status(400).json({ error: 'body too long (max 4000 chars)' });
    }
    // Guests must prove ownership of the booking they're chatting against.
    if (m.sender === 'guest') {
      const ok = await verifyBookingOwnership(m.hotelId, m.guestEmail, m.bookingId);
      if (!ok) return res.status(403).json({ error: 'Booking not found for this guest/hotel' });
    }
    const id = m.id || randomUUID();
    const row = await q1(`INSERT INTO hotel_messages
      (id, hotel_id, booking_id, guest_email, guest_name, sender, body, read_by_hotel, read_by_guest)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO NOTHING RETURNING *`,
      [id, m.hotelId, m.bookingId || null, m.guestEmail, m.guestName || null,
       m.sender, m.body, m.sender === 'hotel', m.sender === 'guest']);
    if (!row) return res.json({ ok: true, dedup: true });
    const dto = toM(row);
    broadcast(m.hotelId, m.guestEmail, dto);
    if (m.sender === 'guest') {
      const notif = await q1(`INSERT INTO hotel_notifications (id, hotel_id, kind, title, body, meta)
        VALUES ($1,$2,'message',$3,$4,$5) RETURNING *`,
        [randomUUID(), m.hotelId, `New message from ${m.guestName || m.guestEmail}`,
         m.body.slice(0, 140), JSON.stringify({ guestEmail: m.guestEmail, bookingId: m.bookingId || null })]);
      try {
        broadcastNotification(m.hotelId, {
          id: notif.id, hotelId: notif.hotel_id, kind: notif.kind, title: notif.title,
          body: notif.body, meta: notif.meta, read: notif.read, createdAt: Number(notif.created_at),
        });
      } catch {}
    }
    res.json(dto);
  } catch (e) { next(e); }
});

r.patch('/mark-read', async (req, res, next) => {
  try {
    const { hotelId, guestEmail, side } = req.body || {};
    if (!hotelId || !guestEmail) return res.status(400).json({ error: 'hotelId+guestEmail required' });
    const col = side === 'guest' ? 'read_by_guest' : 'read_by_hotel';
    await q(`UPDATE hotel_messages SET ${col}=true WHERE hotel_id=$1 AND LOWER(guest_email)=LOWER($2)`, [hotelId, guestEmail]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
