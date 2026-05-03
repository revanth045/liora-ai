-- Liora — Neon Postgres schema (idempotent).
-- All timestamps stored as bigint (epoch ms) to match the existing client code.

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  role          text NOT NULL,
  name          text,
  password_hash text,
  restaurant_id text,
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  last_login_at bigint
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  email          text PRIMARY KEY,
  user_id        text,
  name           text,
  city           text,
  budget         text,
  cuisines       jsonb,
  spice_level    int,
  allergens      jsonb,
  diet           text,
  avoid          jsonb,
  vibe           text,
  ai_tone        text,
  ai_style       text,
  summary        text,
  experience_pts int DEFAULT 0,
  is_premium     bool DEFAULT false,
  plan           text,
  loyalty_points int DEFAULT 0,
  updated_at     bigint
);

-- ─────────── RESTAURANTS ───────────
CREATE TABLE IF NOT EXISTS restaurants (
  id            text PRIMARY KEY,
  owner_id      text NOT NULL,
  name          text NOT NULL,
  address       text,
  phone         text,
  website       text,
  staff_code    text,
  cuisine       text,
  bio           text,
  logo_url      text,
  brand_color   text,
  accent_color  text,
  hero_image_url text,
  tagline       text,
  theme         text,
  hours         jsonb,
  menu_meta     jsonb,
  accepts_prepay bool DEFAULT false,
  updated_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  name          text NOT NULL,
  description   text,
  price_cents   int NOT NULL,
  tags          jsonb,
  available     bool DEFAULT true,
  category      text,
  image_url     text,
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at    bigint
);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON menu_items(restaurant_id);

CREATE TABLE IF NOT EXISTS orders (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL,
  customer_name   text,
  customer_email  text,
  table_number    text,
  items           jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  total_cents     int NOT NULL DEFAULT 0,
  notes           text,
  allergens       jsonb,
  payment_method  text,
  payment_status  text,
  card_last4      text,
  created_at      bigint NOT NULL,
  updated_at      bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);

CREATE TABLE IF NOT EXISTS promotions (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  title         text NOT NULL,
  description   text,
  type          text NOT NULL,
  value         numeric DEFAULT 0,
  code          text,
  is_active     bool DEFAULT true,
  valid_until   text,
  usage_count   int DEFAULT 0,
  max_usage     int,
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant ON promotions(restaurant_id);

CREATE TABLE IF NOT EXISTS chef_specials (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  name          text NOT NULL,
  description   text,
  price_cents   int NOT NULL,
  is_available  bool DEFAULT true,
  category      text NOT NULL,
  chef_note     text,
  image_emoji   text
);
CREATE INDEX IF NOT EXISTS idx_specials_restaurant ON chef_specials(restaurant_id);

CREATE TABLE IF NOT EXISTS reviews (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  customer_name text NOT NULL,
  rating        int NOT NULL,
  text          text,
  reply         text,
  replied       bool DEFAULT false,
  replied_at    bigint,
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);

CREATE TABLE IF NOT EXISTS staff (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL,
  phone         text,
  email         text,
  hourly_rate   numeric,
  status        text NOT NULL DEFAULT 'active',
  notes         text,
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff(restaurant_id);

CREATE TABLE IF NOT EXISTS shifts (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  staff_id      text NOT NULL,
  week_start    text NOT NULL,
  day           text NOT NULL,
  start_time    text NOT NULL,
  end_time      text NOT NULL,
  notes         text
);
CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_week ON shifts(restaurant_id, week_start);

CREATE TABLE IF NOT EXISTS attendance (
  id            text PRIMARY KEY,
  staff_id      text NOT NULL,
  restaurant_id text NOT NULL,
  date          text NOT NULL,
  clock_in      text,
  clock_out     text,
  status        text NOT NULL,
  notes         text,
  UNIQUE(staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_restaurant ON attendance(restaurant_id);

CREATE TABLE IF NOT EXISTS inventory (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  name          text NOT NULL,
  category      text NOT NULL,
  quantity      numeric NOT NULL DEFAULT 0,
  unit          text NOT NULL,
  reorder_point numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric,
  supplier      text,
  notes         text,
  updated_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON inventory(restaurant_id);

CREATE TABLE IF NOT EXISTS tables (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  number        int NOT NULL,
  label         text,
  seats         int
);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);

CREATE TABLE IF NOT EXISTS table_alerts (
  id              text PRIMARY KEY,
  restaurant_name text NOT NULL,
  table_number    text NOT NULL,
  action          text NOT NULL,
  message         text,
  status          text NOT NULL DEFAULT 'active',
  order_id        text,
  created_at      bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_table_alerts_restaurant ON table_alerts(restaurant_name);

CREATE TABLE IF NOT EXISTS dine_sessions (
  id              text PRIMARY KEY,
  restaurant_id   text NOT NULL,
  restaurant_name text NOT NULL,
  table_number    text NOT NULL,
  items           jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'open',
  subtotal_cents  int DEFAULT 0,
  tax_cents       int DEFAULT 0,
  service_fee_cents int DEFAULT 0,
  tip_cents       int DEFAULT 0,
  total_cents     int DEFAULT 0,
  created_at      bigint NOT NULL,
  paid_at         bigint,
  receipt_token   text
);
CREATE INDEX IF NOT EXISTS idx_dine_restaurant ON dine_sessions(restaurant_id);

CREATE TABLE IF NOT EXISTS events (
  id            text PRIMARY KEY,
  restaurant_id text,
  type          text NOT NULL,
  ts            bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_events_restaurant ON events(restaurant_id);

-- ─────────── HOTELS ───────────
CREATE TABLE IF NOT EXISTS hotels (
  id              text PRIMARY KEY,
  owner_id        text NOT NULL,
  name            text NOT NULL,
  description     text,
  address         text,
  city            text,
  country         text,
  latitude        numeric,
  longitude       numeric,
  phone           text,
  email           text,
  website         text,
  star_rating     int,
  amenities       jsonb,
  hero_image_url  text,
  gallery_urls    jsonb,
  brand_color     text,
  accent_color    text,
  policies        jsonb,
  created_at      bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint,
  updated_at      bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_hotels_owner ON hotels(owner_id);

CREATE TABLE IF NOT EXISTS hotel_rooms (
  id                    text PRIMARY KEY,
  hotel_id              text NOT NULL,
  name                  text NOT NULL,
  type                  text NOT NULL,
  description           text,
  price_per_night_cents int NOT NULL,
  capacity_adults       int NOT NULL DEFAULT 2,
  capacity_children     int NOT NULL DEFAULT 0,
  total_units           int NOT NULL DEFAULT 1,
  amenities             jsonb,
  image_urls            jsonb,
  active                bool DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON hotel_rooms(hotel_id);

CREATE TABLE IF NOT EXISTS hotel_bookings (
  id              text PRIMARY KEY,
  hotel_id        text NOT NULL,
  room_id         text NOT NULL,
  guest_name      text NOT NULL,
  guest_email     text,
  guest_phone     text,
  check_in        date NOT NULL,
  check_out       date NOT NULL,
  adults          int NOT NULL DEFAULT 1,
  children        int NOT NULL DEFAULT 0,
  nights_count    int NOT NULL,
  total_cents     int NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  payment_status  text DEFAULT 'pending',
  add_on_ids      jsonb,
  notes           text,
  created_at      bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel ON hotel_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room  ON hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON hotel_bookings(room_id, check_in, check_out);

CREATE TABLE IF NOT EXISTS hotel_addons (
  id          text PRIMARY KEY,
  hotel_id    text NOT NULL,
  name        text NOT NULL,
  description text,
  price_cents int NOT NULL,
  per_person  bool DEFAULT false,
  active      bool DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_addons_hotel ON hotel_addons(hotel_id);

CREATE TABLE IF NOT EXISTS hotel_reviews (
  id                 text PRIMARY KEY,
  hotel_id           text NOT NULL,
  booking_id         text,
  guest_name         text NOT NULL,
  guest_email        text,
  rating             int NOT NULL,
  comment            text,
  owner_response     text,
  owner_response_at  bigint,
  created_at         bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON hotel_reviews(hotel_id);
ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS hotel_offers (
  id            text PRIMARY KEY,
  hotel_id      text NOT NULL,
  title         text NOT NULL,
  description   text,
  type          text NOT NULL,            -- 'percent' | 'flat'
  value         numeric NOT NULL DEFAULT 0,
  code          text,
  active        bool DEFAULT true,
  valid_until   text,
  min_nights    int DEFAULT 1,
  applies_to    text DEFAULT 'all',       -- 'all' or a specific room_id
  created_at    bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_hotel_offers_hotel ON hotel_offers(hotel_id);

CREATE TABLE IF NOT EXISTS hotel_notifications (
  id          text PRIMARY KEY,
  hotel_id    text NOT NULL,
  kind        text NOT NULL,        -- 'new_booking' | 'cancellation' | 'review' | 'message'
  title       text NOT NULL,
  body        text,
  meta        jsonb,
  read        bool DEFAULT false,
  created_at  bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_hotel_notif_hotel ON hotel_notifications(hotel_id, created_at DESC);

-- ─────────── A3: Guest ↔ hotel concierge messaging ───────────
CREATE TABLE IF NOT EXISTS hotel_messages (
  id          text PRIMARY KEY,
  hotel_id    text NOT NULL,
  booking_id  text,
  guest_email text NOT NULL,
  guest_name  text,
  sender      text NOT NULL,            -- 'guest' | 'hotel'
  body        text NOT NULL,
  read_by_hotel bool DEFAULT false,
  read_by_guest bool DEFAULT true,
  created_at  bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
CREATE INDEX IF NOT EXISTS idx_messages_hotel_thread ON hotel_messages(hotel_id, guest_email, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON hotel_messages(booking_id);
