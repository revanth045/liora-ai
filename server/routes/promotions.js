import { Router } from 'express';
import { promotions, uid, now } from '../store.js';

const router = Router();

// GET /api/promotions?restaurantId=demo
router.get('/', (req, res) => {
  const { restaurantId = 'demo' } = req.query;
  const promos = [...promotions.values()].filter(p => p.restaurantId === restaurantId);
  res.json(promos);
});

// POST /api/promotions
router.post('/', (req, res) => {
  const { restaurantId = 'demo', title, description, type, value, code, validUntil, maxUsage } = req.body;
  if (!title || !type) return res.status(400).json({ error: 'title and type required' });
  const promo = { id: uid(), restaurantId, title, description: description || '', type, value: Number(value) || 0, code: code || ('PROMO' + Math.random().toString(36).slice(2, 6).toUpperCase()), validUntil, maxUsage: Number(maxUsage) || 100, usageCount: 0, active: true, createdAt: now() };
  promotions.set(promo.id, promo);
  res.status(201).json(promo);
});

// PUT /api/promotions/:id
router.put('/:id', (req, res) => {
  const promo = promotions.get(req.params.id);
  if (!promo) return res.status(404).json({ error: 'Not found' });
  const updated = { ...promo, ...req.body, id: promo.id, restaurantId: promo.restaurantId, updatedAt: now() };
  promotions.set(promo.id, updated);
  res.json(updated);
});

// PATCH /api/promotions/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  const promo = promotions.get(req.params.id);
  if (!promo) return res.status(404).json({ error: 'Not found' });
  promo.active = !promo.active;
  promotions.set(promo.id, promo);
  res.json(promo);
});

// DELETE /api/promotions/:id
router.delete('/:id', (req, res) => {
  if (!promotions.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  promotions.delete(req.params.id);
  res.status(204).end();
});

// POST /api/promotions/validate  (customer applies code)
router.post('/validate', (req, res) => {
  const { code, restaurantId = 'demo' } = req.body;
  const promo = [...promotions.values()].find(p => p.code?.toUpperCase() === code?.toUpperCase() && p.restaurantId === restaurantId && p.active);
  if (!promo) return res.status(404).json({ error: 'Invalid or expired promo code' });
  if (promo.usageCount >= promo.maxUsage) return res.status(400).json({ error: 'Promo code has reached max usage' });
  promo.usageCount++;
  promotions.set(promo.id, promo);
  res.json({ valid: true, promo });
});

export default router;
