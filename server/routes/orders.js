import { Router } from 'express';
import { orders, menuItems, reviews, analytics, uid, now, STATUS_FLOW } from '../store.js';

const router = Router();

// GET /api/orders?restaurantId=demo&status=pending
router.get('/', (req, res) => {
  const { restaurantId = 'demo', status } = req.query;
  let result = [...orders.values()].filter(o => o.restaurantId === restaurantId);
  if (status && status !== 'all') result = result.filter(o => o.status === status);
  result.sort((a, b) => b.createdAt - a.createdAt);
  res.json(result);
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST /api/orders  (customer placing order)
router.post('/', (req, res) => {
  const { restaurantId = 'demo', customerName, tableOrDelivery, items } = req.body;
  if (!customerName || !items?.length) return res.status(400).json({ error: 'Missing required fields' });
  const totalCents = items.reduce((s, i) => s + (i.priceCents * i.qty), 0);
  const order = { id: uid(), restaurantId, customerName, tableOrDelivery, items, totalCents, status: 'pending', createdAt: now() };
  orders.set(order.id, order);
  res.status(201).json(order);
});

// PATCH /api/orders/:id/status  (restaurant advancing status)
router.patch('/:id/status', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { status } = req.body;
  const valid = ['pending', 'preparing', 'ready', 'delivered', 'rejected'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  order.status = status;
  order.updatedAt = now();
  orders.set(order.id, order);
  res.json(order);
});

// DELETE /api/orders/:id  (admin only)
router.delete('/:id', (req, res) => {
  if (!orders.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  orders.delete(req.params.id);
  res.status(204).end();
});

// GET /api/orders/analytics/summary?restaurantId=demo
router.get('/analytics/summary', (req, res) => {
  const { restaurantId = 'demo' } = req.query;
  const now_ = now();
  const dayMs = 86400000;
  const restaurantOrders = [...orders.values()].filter(o => o.restaurantId === restaurantId);
  const todayOrders = restaurantOrders.filter(o => o.createdAt > now_ - dayMs);
  const todaySales = todayOrders.reduce((s, o) => s + o.totalCents, 0);
  const pending = restaurantOrders.filter(o => o.status === 'pending').length;
  const preparing = restaurantOrders.filter(o => o.status === 'preparing').length;
  const popularItems = {};
  restaurantOrders.forEach(o => o.items?.forEach(i => {
    popularItems[i.name] = (popularItems[i.name] || 0) + i.qty;
  }));
  const topItems = Object.entries(popularItems).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  res.json({ todaySales, todayOrderCount: todayOrders.length, pending, preparing, topItems });
});

export default router;
