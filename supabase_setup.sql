-- ====================================================================
-- LIORA PLATFORM — COMPLETE SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ====================================================================
-- Coverage: Customer profiles, Auth users, Restaurants, Menus,
--           Orders, Dine-in sessions, Table Alerts, Inventory,
--           Staff, Shifts, Attendance, Tables, Promotions,
--           Chef Specials, Reservations, Analytics Events,
--           Loyalty, Support Tickets, Payment Methods.
-- ====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- SECTION 1 · USERS & CUSTOMER PROFILES
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_users (
  id              text PRIMARY KEY,           -- matches auth user id
  email           text NOT NULL UNIQUE,
  role            text NOT NULL DEFAULT 'user'  -- 'user' | 'restaurant_owner' | 'staff'
                  CHECK (role IN ('user','restaurant_owner','staff')),
  name            text,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  last_login_at   bigint
);

-- Detailed dining DNA stored per customer (from onboarding)
CREATE TABLE IF NOT EXISTS liora_customer_profiles (
  id              text PRIMARY KEY,           -- same as liora_users.id
  email           text NOT NULL,
  name            text,
  city            text,
  budget          text,                       -- '$' | '$$' | '$$$' | '$$$$'
  cuisines        jsonb   NOT NULL DEFAULT '[]',   -- string[]
  spice_level     integer DEFAULT 3           CHECK (spice_level BETWEEN 1 AND 5),
  allergens       jsonb   NOT NULL DEFAULT '[]',   -- string[]
  diet            text,                       -- 'Vegan' | 'Vegetarian' | 'Gluten-Free' etc.
  avoid           jsonb   NOT NULL DEFAULT '[]',   -- string[]
  vibe            text,                       -- 'Cozy and casual' | 'Fine dining' etc.
  ai_tone         text    DEFAULT 'friendly'  CHECK (ai_tone IN ('direct','friendly','playful')),
  ai_style        text    DEFAULT 'classic'   CHECK (ai_style IN ('classic','adventurous','healthy')),
  summary         text,                       -- AI-generated dining summary
  experience_pts  integer NOT NULL DEFAULT 0,
  is_premium      boolean NOT NULL DEFAULT false,
  plan            text    DEFAULT 'basic',
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);

-- Saved payment methods per customer
CREATE TABLE IF NOT EXISTS liora_payment_methods (
  id              text PRIMARY KEY,
  user_id         text NOT NULL REFERENCES liora_users(id) ON DELETE CASCADE,
  type            text NOT NULL DEFAULT 'card',  -- 'card' | 'upi' | 'wallet'
  label           text,                           -- e.g. "VISA 4242"
  last4           text,
  expiry          text,
  is_default      boolean NOT NULL DEFAULT false,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);

-- Loyalty points ledger
CREATE TABLE IF NOT EXISTS liora_loyalty (
  id              text PRIMARY KEY,
  user_id         text NOT NULL REFERENCES liora_users(id) ON DELETE CASCADE,
  restaurant_id   text,
  points_delta    integer NOT NULL,             -- positive = earned, negative = redeemed
  reason          text,                         -- 'order' | 'referral' | 'promo'
  reference_id    text,                         -- order_id or promo_id
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 2 · RESTAURANTS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_restaurants (
  id              text PRIMARY KEY,
  owner_id        text NOT NULL,               -- liora_users.id of the owner
  name            text NOT NULL,
  address         text,
  phone           text,
  website         text,
  cuisine         text,
  bio             text,
  staff_code      text,                        -- 6-char code staff use to register
  hours           jsonb DEFAULT '[]',          -- DayHours[] JSON
  logo_url        text,
  cover_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);

-- Staff members attached to a restaurant
CREATE TABLE IF NOT EXISTS liora_staff (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  user_id         text,                        -- liora_users.id if they have an account
  name            text NOT NULL,
  role            text NOT NULL,               -- 'Head Chef' | 'Server' | 'Manager' etc.
  phone           text,
  email           text,
  hourly_rate     numeric(8,2),                -- USD per hour
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive')),
  notes           text,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);

-- Weekly shifts
CREATE TABLE IF NOT EXISTS liora_shifts (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  staff_id        text NOT NULL REFERENCES liora_staff(id) ON DELETE CASCADE,
  week_start      date NOT NULL,               -- Monday of the week
  day             text NOT NULL
                  CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time      time NOT NULL,               -- HH:MM 24h
  end_time        time NOT NULL,
  notes           text
);

-- Daily attendance
CREATE TABLE IF NOT EXISTS liora_attendance (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  staff_id        text NOT NULL REFERENCES liora_staff(id) ON DELETE CASCADE,
  date            date NOT NULL,
  clock_in        text,                        -- 'HH:MM' or null
  clock_out       text,
  status          text NOT NULL DEFAULT 'present'
                  CHECK (status IN ('present','absent','late','half_day')),
  notes           text,
  UNIQUE (staff_id, date)
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 3 · MENU & SPECIALS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_menu_items (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price_cents     integer NOT NULL DEFAULT 0,
  tags            jsonb   NOT NULL DEFAULT '[]',    -- string[]
  available       boolean NOT NULL DEFAULT true,
  image_url       text,
  category        text,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);

CREATE TABLE IF NOT EXISTS liora_chef_specials (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text NOT NULL,
  price_cents     integer NOT NULL DEFAULT 0,
  category        text NOT NULL DEFAULT 'daily_special'
                  CHECK (category IN ('daily_special','seasonal','chef_choice')),
  chef_note       text,
  image_emoji     text,
  is_available    boolean NOT NULL DEFAULT true,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 4 · INVENTORY
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_inventory (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL DEFAULT 'Other'
                  CHECK (category IN ('Proteins','Produce','Dairy','Bakery','Pantry',
                                      'Beverages','Alcohol','Frozen','Spices','Other')),
  quantity        numeric(12,3) NOT NULL DEFAULT 0,
  unit            text NOT NULL DEFAULT 'units'
                  CHECK (unit IN ('units','kg','g','litres','ml','bottles',
                                  'cans','bags','boxes','portions')),
  reorder_point   numeric(12,3) NOT NULL DEFAULT 0, -- alert threshold
  cost_per_unit   integer,                           -- cents
  supplier        text,
  notes           text,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 5 · TABLES & DINE-IN SESSIONS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_tables (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  number          integer NOT NULL,
  label           text,                        -- e.g. "Patio", "Window", "Bar"
  seats           integer,
  UNIQUE (restaurant_id, number)
);

-- Full dine-in checkout session created when customer pays
CREATE TABLE IF NOT EXISTS liora_dine_sessions (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  restaurant_name text NOT NULL,
  table_number    text NOT NULL,
  items           jsonb NOT NULL DEFAULT '[]',    -- DineInItem[]
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','bill_requested','paid')),
  subtotal_cents  integer NOT NULL DEFAULT 0,
  tax_cents       integer NOT NULL DEFAULT 0,
  service_fee_cents integer NOT NULL DEFAULT 0,
  tip_cents       integer NOT NULL DEFAULT 0,
  total_cents     integer NOT NULL DEFAULT 0,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  paid_at         bigint,
  receipt_token   text
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 6 · ORDERS (from AI Waiter cart submit)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_orders (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL,
  restaurant_name text NOT NULL,
  customer_name   text,
  customer_email  text,
  table_number    text,
  items           jsonb NOT NULL DEFAULT '[]',    -- DemoOrderItem[]
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','preparing','ready','delivered','rejected')),
  total_cents     integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 7 · TABLE ALERTS (Call Waiter, Dietary Questions etc.)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_table_alerts (
  id              text PRIMARY KEY,
  restaurant_name text NOT NULL,
  table_number    text NOT NULL,
  action          text NOT NULL,               -- 'Call Waiter' | 'Dietary Question' | 'Get Manager' etc.
  message         text NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','dismissed')),
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 8 · RESERVATIONS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_reservations (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  user_email      text NOT NULL,
  user_name       text,
  party_size      integer NOT NULL DEFAULT 2,
  booked_for      timestamptz NOT NULL,        -- exact date+time
  status          text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','confirmed','canceled')),
  special_notes   text,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 9 · PROMOTIONS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_promotions (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL REFERENCES liora_restaurants(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text NOT NULL,
  type            text NOT NULL DEFAULT 'percent'
                  CHECK (type IN ('percent','flat','bogo')),
  value           numeric(8,2) NOT NULL DEFAULT 0,
  code            text,
  is_active       boolean NOT NULL DEFAULT true,
  valid_until     date,
  usage_count     integer NOT NULL DEFAULT 0,
  max_usage       integer,
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 10 · ANALYTICS EVENTS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_events (
  id              text PRIMARY KEY,
  restaurant_id   text,
  user_id         text,
  type            text NOT NULL,               -- 'view_restaurant' | 'open_menu' | 'click_call' | 'favorite' | 'reservation'
  metadata        jsonb DEFAULT '{}',
  ts              bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- SECTION 11 · SUPPORT TICKETS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS liora_support_tickets (
  id              text PRIMARY KEY,
  user_id         text,
  restaurant_id   text,
  category        text,                        -- 'billing' | 'technical' | 'account' | 'other'
  subject         text NOT NULL,
  message         text NOT NULL,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        text NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  created_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000,
  updated_at      bigint NOT NULL DEFAULT extract(epoch from now())::bigint * 1000
);


-- ─────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — OPEN FOR DEMO (all authenticated & anon can read/write)
-- In production, replace with proper user-scoped policies.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE liora_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_customer_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_payment_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_loyalty             ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_restaurants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_shifts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_menu_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_chef_specials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_tables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_dine_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_table_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_reservations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_promotions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE liora_support_tickets     ENABLE ROW LEVEL SECURITY;

-- Allow all operations from the anon key (demo/dev mode)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'liora_users','liora_customer_profiles','liora_payment_methods','liora_loyalty',
    'liora_restaurants','liora_staff','liora_shifts','liora_attendance',
    'liora_menu_items','liora_chef_specials','liora_inventory','liora_tables',
    'liora_dine_sessions','liora_orders','liora_table_alerts','liora_reservations',
    'liora_promotions','liora_events','liora_support_tickets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS public_all_%s ON %s;
       CREATE POLICY public_all_%s ON %s FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- INDEXES (performance for common queries)
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_name   ON liora_orders(restaurant_name);
CREATE INDEX IF NOT EXISTS idx_orders_status            ON liora_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created           ON liora_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_restaurant        ON liora_table_alerts(restaurant_name);
CREATE INDEX IF NOT EXISTS idx_alerts_status            ON liora_table_alerts(status);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant         ON liora_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant     ON liora_inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant          ON liora_menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staff             ON liora_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date    ON liora_attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant  ON liora_reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_events_restaurant        ON liora_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_user             ON liora_loyalty(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email  ON liora_customer_profiles(email);

-- ====================================================================
-- DONE ✅ — All 19 Liora tables are created with RLS open for demo.
-- ====================================================================
