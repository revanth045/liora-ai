import { Router } from 'express';
import { q, q1 } from '../db.js';

const r = Router();

// In-memory map of hotelId → Set of SSE response objects
const subscribers = new Map();

export function broadcastNotification(hotelId, notif) {
  const set = subscribers.get(hotelId);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(notif)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch {}
  }
}

const toN = (n) => n && ({
  id: n.id, hotelId: n.hotel_id, kind: n.kind, title: n.title, body: n.body,
  meta: n.meta, read: n.read, createdAt: Number(n.created_at),
});

// SSE stream: clients open EventSource('/api/hotel-notifications/stream?hotelId=...')
r.get('/stream', (req, res) => {
  const { hotelId } = req.query;
  if (!hotelId) return res.status(400).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(': connected\n\n');

  if (!subscribers.has(hotelId)) subscribers.set(hotelId, new Set());
  subscribers.get(hotelId).add(res);

  const heartbeat = setInterval(() => { try { res.write(': hb\n\n'); } catch {} }, 25_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    subscribers.get(hotelId)?.delete(res);
  });
});

r.get('/', async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const rows = hotelId
      ? await q('SELECT * FROM hotel_notifications WHERE hotel_id=$1 ORDER BY created_at DESC LIMIT 100', [hotelId])
      : [];
    res.json(rows.map(toN));
  } catch (e) { next(e); }
});

r.patch('/:id/read', async (req, res, next) => {
  try {
    const row = await q1('UPDATE hotel_notifications SET read=true WHERE id=$1 RETURNING *', [req.params.id]);
    res.json(toN(row));
  } catch (e) { next(e); }
});

// Allow trusted client flows (e.g. customer demo bookings created via localStorage)
// to push a notification to the hotel feed. Inserts and broadcasts via SSE.
r.post('/', async (req, res, next) => {
  try {
    const { hotelId, kind, title, body, meta } = req.body || {};
    if (!hotelId || !kind || !title) return res.status(400).json({ error: 'hotelId, kind, title required' });
    const row = await q1(
      `INSERT INTO hotel_notifications (id, hotel_id, kind, title, body, meta)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::jsonb) RETURNING *`,
      [hotelId, kind, title, body || null, JSON.stringify(meta || {})]
    );
    const n = toN(row);
    broadcastNotification(hotelId, n);
    res.json(n);
  } catch (e) { next(e); }
});

r.post('/mark-all-read', async (req, res, next) => {
  try {
    await q('UPDATE hotel_notifications SET read=true WHERE hotel_id=$1 AND read=false', [req.query.hotelId || '']);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/mark-all-read', async (req, res, next) => {
  try {
    await q('UPDATE hotel_notifications SET read=true WHERE hotel_id=$1 AND read=false', [req.query.hotelId || '']);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
