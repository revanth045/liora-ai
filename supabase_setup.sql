-- Run this in Supabase → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS liora_orders (
  id text PRIMARY KEY,
  restaurant_id text NOT NULL,
  restaurant_name text NOT NULL,
  customer_name text,
  customer_email text,
  table_number text,
  items jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending',
  total_cents integer NOT NULL DEFAULT 0,
  notes text,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS liora_table_alerts (
  id text PRIMARY KEY,
  restaurant_name text NOT NULL,
  table_number text NOT NULL,
  action text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at bigint NOT NULL
);

ALTER TABLE liora_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_table_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_all_orders ON liora_orders;
DROP POLICY IF EXISTS public_all_alerts ON liora_table_alerts;

CREATE POLICY public_all_orders ON liora_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY public_all_alerts ON liora_table_alerts FOR ALL USING (true) WITH CHECK (true);
