import { Router } from 'express';
import { q, q1 } from '../db.js';
import { randomUUID } from 'crypto';

const r = Router();
const toI = (i) => i && ({
  id: i.id, restaurantId: i.restaurant_id, name: i.name, category: i.category,
  quantity: Number(i.quantity), unit: i.unit, reorderPoint: Number(i.reorder_point),
  costPerUnit: i.cost_per_unit != null ? Number(i.cost_per_unit) : undefined,
  supplier: i.supplier, notes: i.notes, updatedAt: Number(i.updated_at),
});

r.get('/', async (req, res, next) => {
  try {
    const rows = await q('SELECT * FROM inventory WHERE restaurant_id=$1 ORDER BY name ASC', [req.query.restaurantId || '']);
    res.json(rows.map(toI));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const i = req.body || {};
    const id = i.id || randomUUID();
    const row = await q1(`INSERT INTO inventory (id, restaurant_id, name, category, quantity, unit, reorder_point, cost_per_unit, supplier, notes, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, quantity=EXCLUDED.quantity,
        unit=EXCLUDED.unit, reorder_point=EXCLUDED.reorder_point, cost_per_unit=EXCLUDED.cost_per_unit,
        supplier=EXCLUDED.supplier, notes=EXCLUDED.notes, updated_at=EXCLUDED.updated_at RETURNING *`,
      [id, i.restaurantId, i.name, i.category, Number(i.quantity) || 0, i.unit,
       Number(i.reorderPoint) || 0, i.costPerUnit ?? null, i.supplier || null, i.notes || null, Date.now()]);
    res.json(toI(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await q('DELETE FROM inventory WHERE id=$1', [req.params.id]); res.status(204).end(); }
  catch (e) { next(e); }
});

export default r;
