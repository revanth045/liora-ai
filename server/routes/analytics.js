import { Router } from 'express';
import { analytics, orders, now } from '../store.js';

const router = Router();

// GET /api/analytics/dashboard?restaurantId=demo
router.get('/dashboard', (req, res) => {
  const { restaurantId = '' } = req.query;
  const base = analytics[restaurantId] || {};
  // Augment with live order counts
  const liveOrders = [...orders.values()].filter(o => o.restaurantId === restaurantId);
  const pending = liveOrders.filter(o => o.status === 'pending').length;
  const preparing = liveOrders.filter(o => o.status === 'preparing').length;
  const todaySales = liveOrders.filter(o => o.createdAt > now() - 86400000).reduce((s, o) => s + o.totalCents, 0);

  res.json({
    ...base,
    todaySales: (base.todaySales || 0) + todaySales,
    liveOrders: { pending, preparing },
  });
});

// GET /api/analytics/sales?restaurantId=demo&range=week
router.get('/sales', (req, res) => {
  const { restaurantId = '', range = 'week' } = req.query;
  const base = analytics[restaurantId] || {};
  res.json({ salesByDay: base.salesByDay || [], range });
});

// GET /api/analytics/top-dishes?restaurantId=demo
router.get('/top-dishes', (req, res) => {
  const { restaurantId = '' } = req.query;
  const base = analytics[restaurantId] || {};
  // Derive live from order history
  const itemMap = {};
  [...orders.values()].filter(o => o.restaurantId === restaurantId && o.status !== 'rejected').forEach(o =>
    o.items?.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, orders: 0, revenue: 0 };
      itemMap[i.name].orders += i.qty;
      itemMap[i.name].revenue += i.priceCents * i.qty;
    })
  );
  const live = Object.values(itemMap).sort((a, b) => b.orders - a.orders).slice(0, 5);
  res.json(live.length ? live : (base.topDishes || []));
});

// GET /api/analytics/customers?restaurantId=demo
router.get('/customers', (req, res) => {
  const { restaurantId = '' } = req.query;
  const customerMap = {};
  [...orders.values()]
    .filter(o => o.restaurantId === restaurantId && o.status === 'delivered')
    .forEach(o => {
      if (!customerMap[o.customerName]) customerMap[o.customerName] = { name: o.customerName, orderCount: 0, totalSpent: 0, firstVisit: o.createdAt, lastVisit: o.createdAt, items: {} };
      const c = customerMap[o.customerName];
      c.orderCount++;
      c.totalSpent += o.totalCents;
      c.lastVisit = Math.max(c.lastVisit, o.createdAt);
      o.items?.forEach(i => { c.items[i.name] = (c.items[i.name] || 0) + i.qty; });
    });
  const customers = Object.values(customerMap).map(c => ({
    ...c,
    favoriteItem: Object.entries(c.items).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
  })).sort((a, b) => b.totalSpent - a.totalSpent);
  res.json(customers);
});

export default router;
