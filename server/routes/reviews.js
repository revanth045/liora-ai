import { Router } from 'express';
import { reviews, uid, now } from '../store.js';

const router = Router();

// GET /api/reviews?restaurantId=demo
router.get('/', (req, res) => {
  const { restaurantId = 'demo' } = req.query;
  const result = [...reviews.values()].filter(r => r.restaurantId === restaurantId).sort((a, b) => b.createdAt - a.createdAt);
  const avgRating = result.length ? (result.reduce((s, r) => s + r.rating, 0) / result.length).toFixed(1) : '0.0';
  const distribution = [5, 4, 3, 2, 1].map(star => ({ star, count: result.filter(r => r.rating === star).length }));
  res.json({ reviews: result, avgRating: Number(avgRating), totalCount: result.length, distribution });
});

// POST /api/reviews  (customer submitting review)
router.post('/', (req, res) => {
  const { restaurantId = 'demo', customerName, rating, text } = req.body;
  if (!customerName || !rating || !text) return res.status(400).json({ error: 'Missing required fields' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1â “5' });
  const review = { id: uid(), restaurantId, customerName, rating: Number(rating), text, createdAt: now(), replied: false, reply: '' };
  reviews.set(review.id, review);
  res.status(201).json(review);
});

// PATCH /api/reviews/:id/reply  (restaurant replying)
router.patch('/:id/reply', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ error: 'Reply text required' });
  review.reply = reply;
  review.replied = true;
  review.repliedAt = now();
  reviews.set(review.id, review);
  res.json(review);
});

// DELETE /api/reviews/:id  (admin moderation)
router.delete('/:id', (req, res) => {
  if (!reviews.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  reviews.delete(req.params.id);
  res.status(204).end();
});

export default router;
