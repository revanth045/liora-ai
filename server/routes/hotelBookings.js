import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';
import { broadcastNotification } from './hotelNotifications.js';

const r = Router();
const toB = (b) => b && ({
  id: b.id, hotelId: b.hotel_id, roomId: b.room_id,
  guestName: b.guest_name, guestEmail: b.guest_email, guestPhone: b.guest_phone,
  checkIn: typeof b.check_in === 'string' ? b.check_in : b.check_in.toISOString().slice(0, 10),
  checkOut: typeof b.check_out === 'string' ? b.check_out : b.check_out.toISOString().slice(0, 10),
  adults: b.adults, children: b.children, nightsCount: b.nights_count,
  totalCents: b.total_cents, status: b.status, paymentStatus: b.payment_status,
  addOnIds: b.add_on_ids, notes: b.notes, createdAt: Number(b.created_at),
});

r.get('/', async (req, res, next) => {
  try {
    const { hotelId, roomId } = req.query;
    let sql = 'SELECT * FROM hotel_bookings WHERE 1=1';
    const params = [];
    if (hotelId) { params.push(hotelId); sql += ` AND hotel_id=$${params.length}`; }
    if (roomId)  { params.push(roomId);  sql += ` AND room_id=$${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    res.json((await q(sql, params)).map(toB));
  } catch (e) { next(e); }
});

// Date-overlap check helper
async function countOverlapping(roomId, checkIn, checkOut, excludeId) {
  const rows = await q(`SELECT COUNT(*)::int AS n FROM hotel_bookings
    WHERE room_id=$1 AND status IN ('pending','confirmed','completed')
      AND check_in < $3::date AND check_out > $2::date
      ${excludeId ? 'AND id <> $4' : ''}`,
    excludeId ? [roomId, checkIn, checkOut, excludeId] : [roomId, checkIn, checkOut]);
  return rows[0].n;
}

r.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.hotelId || !b.roomId || !b.checkIn || !b.checkOut)
      return res.status(400).json({ error: 'Missing required fields' });
    if (new Date(b.checkOut) <= new Date(b.checkIn))
      return res.status(400).json({ error: 'Check-out must be after check-in' });

    // Date-overlap protection (C11): how many units are already booked over this window?
    // We exclude this booking's own id when running the check so updates to an
    // existing booking don't conflict with themselves.
    const room = await q1('SELECT total_units, name FROM hotel_rooms WHERE id=$1', [b.roomId]);
    const totalUnits = room?.total_units || 1;
    const overlap = await countOverlapping(b.roomId, b.checkIn, b.checkOut, b.id);
    if (overlap >= totalUnits)
      return res.status(409).json({ error: `No ${room?.name || 'room'} units available for those dates` });

    const id = b.id || randomUUID();
    const ts = b.createdAt || Date.now();
    const row = await q1(`INSERT INTO hotel_bookings (id, hotel_id, room_id, guest_name, guest_email, guest_phone,
      check_in, check_out, adults, children, nights_count, total_cents, status, payment_status, add_on_ids, notes, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17)
      ON CONFLICT (id) DO UPDATE SET
        hotel_id=EXCLUDED.hotel_id, room_id=EXCLUDED.room_id,
        guest_name=EXCLUDED.guest_name, guest_email=EXCLUDED.guest_email, guest_phone=EXCLUDED.guest_phone,
        check_in=EXCLUDED.check_in, check_out=EXCLUDED.check_out,
        adults=EXCLUDED.adults, children=EXCLUDED.children,
        nights_count=EXCLUDED.nights_count, total_cents=EXCLUDED.total_cents,
        status=EXCLUDED.status, payment_status=EXCLUDED.payment_status,
        add_on_ids=EXCLUDED.add_on_ids, notes=EXCLUDED.notes
      RETURNING *, (xmax = 0) AS _inserted`,
      [id, b.hotelId, b.roomId, b.guestName, b.guestEmail || null, b.guestPhone || null,
       b.checkIn, b.checkOut, Number(b.adults) || 1, Number(b.children) || 0,
       Number(b.nightsCount) || 1, Number(b.totalCents) || 0, b.status || 'pending',
       b.paymentStatus || 'pending', JSON.stringify(b.addOnIds || []), b.notes || null, ts]);

    // Only fire the SSE "new booking" notification on a true insert — UPDATE
    // paths (status changes, edits) must not re-notify the owner.
    if (!row._inserted) return res.status(200).json(toB(row));

    // A4 — fire SSE notification to the hotel owner portal
    const notif = await q1(`INSERT INTO hotel_notifications (id, hotel_id, kind, title, body, meta)
      VALUES ($1, $2, 'new_booking', $3, $4, $5::jsonb) RETURNING *`,
      [randomUUID(), b.hotelId, 'New reservation',
       `${b.guestName} booked ${room?.name || 'a room'} (${b.checkIn} → ${b.checkOut})`,
       JSON.stringify({ bookingId: id, roomId: b.roomId, total: b.totalCents })]);
    broadcastNotification(b.hotelId, {
      id: notif.id, hotelId: b.hotelId, kind: 'new_booking',
      title: notif.title, body: notif.body, meta: notif.meta,
      createdAt: Number(notif.created_at), read: false,
    });

    res.status(201).json(toB(row));
  } catch (e) { next(e); }
});

r.patch('/:id/status', async (req, res, next) => {
  try {
    const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    const row = await q1('UPDATE hotel_bookings SET status=$2 WHERE id=$1 RETURNING *',
      [req.params.id, req.body.status]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toB(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM hotel_bookings WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

// Availability endpoint — returns booked units for a room across a date window.
r.get('/availability', async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;
    if (!roomId || !checkIn || !checkOut) return res.status(400).json({ error: 'roomId, checkIn, checkOut required' });
    const room = await q1('SELECT total_units FROM hotel_rooms WHERE id=$1', [roomId]);
    const booked = await countOverlapping(roomId, checkIn, checkOut);
    res.json({ totalUnits: room?.total_units || 0, booked, available: Math.max(0, (room?.total_units || 0) - booked) });
  } catch (e) { next(e); }
});

export default r;
