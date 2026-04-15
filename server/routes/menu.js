import { Router } from 'express';
import { menuItems, uid, now } from '../store.js';

const router = Router();

// GET /api/menu?restaurantId=demo&category=Mains
router.get('/', (req, res) => {
  const { restaurantId = 'demo', category } = req.query;
  let items = [...menuItems.values()].filter(i => i.restaurantId === restaurantId);
  if (category) items = items.filter(i => i.category === category);
  res.json(items);
});

// GET /api/menu/categories
router.get('/categories', (req, res) => {
  const { restaurantId = 'demo' } = req.query;
  const cats = [...new Set([...menuItems.values()].filter(i => i.restaurantId === restaurantId).map(i => i.category))];
  res.json(cats);
});

// GET /api/menu/:id
router.get('/:id', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  res.json(item);
});

// POST /api/menu
router.post('/', (req, res) => {
  const { restaurantId = 'demo', category, name, description, priceCents, imageUrl } = req.body;
  if (!name || !priceCents) return res.status(400).json({ error: 'name and priceCents required' });
  const item = { id: uid(), restaurantId, category: category || 'Mains', name, description: description || '', priceCents: Number(priceCents), available: true, imageUrl: imageUrl || '', aiDescription: '', createdAt: now() };
  menuItems.set(item.id, item);
  res.status(201).json(item);
});

// PUT /api/menu/:id
router.put('/:id', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  const updated = { ...item, ...req.body, id: item.id, restaurantId: item.restaurantId, updatedAt: now() };
  menuItems.set(item.id, updated);
  res.json(updated);
});

// PATCH /api/menu/:id/toggle  (availability)
router.patch('/:id/toggle', (req, res) => {
  const item = menuItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.available = !item.available;
  item.updatedAt = now();
  menuItems.set(item.id, item);
  res.json(item);
});

// DELETE /api/menu/:id
router.delete('/:id', (req, res) => {
  if (!menuItems.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  menuItems.delete(req.params.id);
  res.status(204).end();
});

export default router;
