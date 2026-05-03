// Postgres connection (Neon).
// Source-of-truth DB for the entire Liora platform.
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connStr = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error('[DB] NEON_DATABASE_URL is not set — aborting.');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => console.error('[DB pool error]', err.message));

export async function q(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function q1(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}

export async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[DB] schema verified');
}
