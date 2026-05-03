import { Router } from 'express';
import { q, q1 } from '../db.js';

const r = Router();
const toP = (p) => p && ({
  email: p.email, userId: p.user_id, name: p.name, city: p.city, budget: p.budget,
  cuisines: p.cuisines, spice_level: p.spice_level, allergens: p.allergens, diet: p.diet,
  avoid: p.avoid, vibe: p.vibe, ai_tone: p.ai_tone, ai_style: p.ai_style,
  summary: p.summary, experience_pts: p.experience_pts, is_premium: p.is_premium,
  plan: p.plan, loyaltyPoints: p.loyalty_points, updated_at: p.updated_at && Number(p.updated_at),
});

r.get('/:email', async (req, res, next) => {
  try {
    const row = await q1('SELECT * FROM customer_profiles WHERE email=$1', [req.params.email.toLowerCase()]);
    res.json(toP(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const p = req.body || {};
    if (!p.email) return res.status(400).json({ error: 'email required' });
    const row = await q1(`
      INSERT INTO customer_profiles (email, user_id, name, city, budget, cuisines, spice_level, allergens,
        diet, avoid, vibe, ai_tone, ai_style, summary, experience_pts, is_premium, plan, loyalty_points, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, budget=EXCLUDED.budget,
        cuisines=EXCLUDED.cuisines, spice_level=EXCLUDED.spice_level, allergens=EXCLUDED.allergens,
        diet=EXCLUDED.diet, avoid=EXCLUDED.avoid, vibe=EXCLUDED.vibe, ai_tone=EXCLUDED.ai_tone,
        ai_style=EXCLUDED.ai_style, summary=EXCLUDED.summary, experience_pts=EXCLUDED.experience_pts,
        is_premium=EXCLUDED.is_premium, plan=EXCLUDED.plan, loyalty_points=EXCLUDED.loyalty_points,
        updated_at=EXCLUDED.updated_at RETURNING *`,
      [p.email.toLowerCase(), p.userId || null, p.name || null, p.city || null, p.budget || null,
       JSON.stringify(p.cuisines || []), p.spice_level ?? null, JSON.stringify(p.allergens || []),
       p.diet || null, JSON.stringify(p.avoid || []), p.vibe || null, p.ai_tone || null,
       p.ai_style || null, p.summary || null, p.experience_pts ?? 0, p.is_premium ?? false,
       p.plan || null, p.loyaltyPoints ?? 0, Date.now()]);
    res.json(toP(row));
  } catch (e) { next(e); }
});

export default r;
