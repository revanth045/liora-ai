# Liora — Project Memory

AI Food & Lifestyle Concierge. Multi-portal restaurant + hotel ecosystem (Consumer, Restaurant Owner, Kitchen Service Desk, Hotel Portal).

## Recent additions (2026-05)
- **Reviews & ratings overhaul** — Reviews are now first-class across the platform. New shared `src/components/reviews/RestaurantReviews.tsx` exports `RestaurantReviewsBlock` (summary card with hero rating, distribution bars that double as star-filters, sort by recent / highest / lowest, full review list with owner-response chips, light & dark themes), `LeaveRestaurantReviewModal` (1–5 star picker, name + body, hover preview, themable), and `fetchRestoReviews/postRestoReview` helpers backed by the existing `/api/reviews` REST endpoint. Wired into: (1) consumer **restaurant detail** (`RestaurantsPage.tsx`) — prominent "★ Guest Reviews" section with "Write a review" CTA, dark-themed; (2) consumer **Orders** (`Orders.tsx`) — "★ Rate your visit" gradient CTA on every delivered order, opens the review modal, persists reviewed-order ids in `localStorage` (`liora_reviewed_orders`) to prevent double rating; (3) **Restaurant portal `ReputationManager.tsx`** — replaced the hardcoded fake `REVIEWS` array with live `/api/reviews` fetch, added keyword-driven sentiment scoring (positive / neutral / negative chips), top-keyword extraction, distribution sidebar, search input, 4 tabs (All / Needs reply / Critical / Replied) with live counts, real PATCH `/api/reviews/:id/reply` flow plus a "Suggest reply" prefill for 4★+ reviews. (4) **Hotel detail (`HotelsHub.tsx`)** — new `HotelReviewsSection` block with gradient summary card, click-to-filter distribution, sort controls, "Show all N reviews" expand/collapse, and a separate "From the hotel" preview of owner responses. The pre-existing past-stay `ReviewModal` flow on `MyBookingCard` is unchanged. Cleaned up a stray `hotelName`-undefined `venue_signup` notify call inside `signUpRestaurantOwner` in `auth/demoAuth.ts` (left over from the prior task).
- **Super Admin Console + Support ticketing** — New `admin@liora.app` / `LioraAdmin2026!` super-admin login surfaced via a discreet "· Admin" link in the `Landing` footer (`AdminLogin.tsx`, `signInAdmin` on `AuthAdapter`/`DemoAuth`, `RoleRouter` routes `role==='admin'` → `AdminPortal`). `AdminPortal.tsx` (~700 lines, 7 tabs: Overview / Approvals / Restaurants / Hotels / Tickets / Payments / Settings) controls every venue: approve pending sign-ups, edit banking details (`BankingDetails` on both `DemoRestaurant` and `DemoHotel`), activate/block/delete venues, view payouts owed by venue, process payment events, reply to tickets, configure platform commission/payout schedule/auto-approve. New `src/lib/adminNotifications.ts` event store auto-records `payment_received`, `order_placed`, `booking_placed`, `venue_signup`, `ticket_opened` (called from `db_addOrder`, `db_addBooking`, sign-up flows, and ticket creation). New `src/lib/tickets.ts` provides full ticket CRUD with categories, priority, status, replies and scope (`consumer` | `restaurant` | `hotel`). Both consumer (`components/CustomerSupport.tsx`) and restaurant (`src/portals/restaurant/Support.tsx`) Support pages were rebuilt as professional 3-tab experiences: Help articles (FAQ accordions, role-specific), Raise a ticket (category + priority + order/booking ID), and My tickets (status/priority pills, threaded admin replies). New venue sign-ups now start with `status:'pending'` and are hidden from consumer lists (`db_getAllRestaurants` + `db_listHotels` filter to active only) until the super-admin approves them in the Approvals tab.
- **Hotel ↔ guest messaging (A3)** — `hotel_messages` table, `/api/hotel-messages` REST + SSE stream. Hotel `MessagesPage` thread list. Consumer `GuestMessageThread` modal accessible via "💬 Message hotel" button on `MyBookingCard` (with unread badge).
- **AI Insights (D15)** — `/api/ai-insights/weekly/:hotelId` Gemini-powered weekly summary with heuristic fallback. Rendered above hotel `AnalyticsPage` as `AIInsightsPanel`.
- **Dynamic pricing** — `/api/dynamic-pricing/suggestions/:hotelId` (DOW occupancy + lead-time multipliers) and `/apply`. 14-day per-day strip in hotel `PricingPage` w/ Apply-all action.
- **AI Concierge** — `/api/ai-concierge/recommend` Gemini hotel ranker (JSON output + fallback). Consumer `AIConciergePanel` collapsible card on `HotelsHub` above amenity chips.
- **Staff mobile view** — `RestoStaff` switches to a streamlined clock-in/out screen below 768px width using `db_upsertAttendance`.
- **Hotel branding & customization** — `DemoHotel` extended with `logoUrl`, `tagline`, `welcomeMessage`, `ctaLabel`, `fontStyle` ('modern'|'classic'|'playful'). Hotel `ProfilePage` adds editors for logo/tagline/welcome message/CTA label/multi-image gallery; `BrandingPage` adds heading-font picker. `RoomEditor` switched to multi-image (one URL per line) + comma-separated room amenities. Consumer `HotelCard` and `HotelDetail` (HotelsHub) now auto-render the hotel's chosen logo, tagline, font, brand color (eyebrow/CTA/price chip), gallery carousel, welcome message banner, house-policies card, and custom CTA label.
- **Date Night feature** — `DemoRestaurant.zip` and `DemoHotel.postalCode` added (seeded for all demo restaurants/hotels). Hotel `ProfilePage` and restaurant `VenueSettings` expose ZIP/postal code editors. New `DateNightModal` (`src/portals/user/pages/DateNightModal.tsx`) opens from a flirty rose-gradient CTA on the consumer restaurant detail page hero **and** the order-success screen — asks for the customer's optional current ZIP, ranks all hotels by leading-digit ZIP-prefix overlap to the restaurant or user ZIP, and renders cards (logo/address/rating/from-price) with a "Same neighborhood / Just minutes away / In your region / Liora pick" proximity badge. Selecting a hotel launches the existing `HotelDetail` booking modal (now exported from `HotelsHub`) inline so the dinner→stay flow stays in one tab.
- Deferred (need user action): Tailwind CDN→PostCSS migration (high regression risk in `index.html`), email notifications (need Resend/SendGrid integration), image upload (needs Object Storage integration).

## Stack
- React 19 + Vite 6 (TypeScript) — client on port **5000**
- Express API server on port **3001** (`server/index.js`)
- Tailwind CSS via CDN (config inline in `index.html`)
- **Neon Postgres** for persistence — connection string in `NEON_DATABASE_URL` secret. Supabase has been fully removed.
- Workflow: `cd liora-main && npm run dev` (concurrently runs vite + node server)

## Design System ("Vibrant & Appetizing")
Warm reds/oranges, bold food photography, Fraunces (display) + Plus Jakarta Sans (body).

### Theme tokens (CSS variables in `index.html`)
- `--brand-50…900` — driven by `[data-accent]` (saffron / truffle / sunset / berry / citrus / espresso) or by inline overrides from a custom hex
- `--cream-*`, `--forest-*`, `--stone-*`, `--surface-*` — re-themed in `[data-theme="dark"]`
- `--density-pad`, `--radius-*`, `font-size` — driven by `[data-density]` (compact / comfortable / spacious)
- Tailwind `colors` in the inline config map every token (`brand-500`, `cream-100`, …) to its CSS var, so **every existing component re-themes automatically when settings change** — no per-component refactor required.

### Reusable utility classes
`card`, `card-hover`, `card-cream`, `card-elev`, `btn-primary`, `btn-outline`, `btn-ghost`, `btn-circle-gold`, `glass`, `glass-light`, `glass-heavy`, `section-forest`, `tag`, `tag-gold`, `tag-soft`, `text-gradient`, `bg-app`, `bg-app-elev`, `input`, `skeleton`, `grain`.

## Customisation system
- `src/context/SettingsContext.tsx` — `theme | accent | density | layout | locale | brand override (hex/logo/displayName) | reducedMotion`. Persists to `localStorage` key `liora-settings`. Writes `data-*` attrs to `<html>` and inline `--brand-*` vars when a custom hex is set.
- `src/components/SettingsPanel.tsx` — slide-in drawer used by all three portal shells.
- `src/lib/i18n.ts` — `t(locale, key)` helper covering en / es / fr / hi / ar (RTL flips automatically via `html.dir`).

## Portal shells (all redesigned)
- Consumer: `src/portals/user/UserShell.tsx` + `components/Sidebar.tsx` + `components/Header.tsx` (5-item bottom nav, gradient brand-accent active states, settings access)
- Restaurant Owner: `src/portals/restaurant/RestaurantPortal.tsx` (collapsible sidebar honouring `settings.layout`)
- Kitchen Service Desk: `src/portals/restaurant/ServiceDeskPortal.tsx` (dark KDS, status-glow cards, audio-beep on new orders)
- Public landing: `src/public/Landing.tsx` (vibrant magazine-style)
- Consumer home: `src/portals/user/pages/Home.tsx` (vibrant hero, 8 quick-action tiles, AI concierge card, deals grid, recent orders, editorial footer)

FOUC prevention: bootstrap script in `<head>` reads `liora-settings` from `localStorage` and applies `data-*` attrs before first paint.

## Mobile & PWA readiness (May 2026)
- **Installable PWA**: `public/manifest.webmanifest` + `<link rel="manifest">` in `index.html`. Apple meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent`, `apple-mobile-web-app-title`, `apple-touch-icon`) so iOS "Add to Home Screen" launches in standalone mode with the brand status-bar color.
  - **TODO before production**: ship PNG icons (at least `icon-192.png`, `icon-512.png`, plus a 180×180 `apple-touch-icon.png` and a maskable variant). Currently uses the existing SVG favicon, which Android Chrome accepts but iOS prefers PNG for the home-screen tile.
- **Dynamic viewport**: shells use `h-dscreen` / `min-h-dscreen` (resolves to `100dvh`) so iOS Safari URL-bar collapse no longer cuts content.
- **Safe-area helpers** in `index.html`: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, `px-safe`, `safe-area-bottom`, `safe-area-top` — all use `env(safe-area-inset-*)` for notch/home-indicator support. Applied to `RestaurantPortal`, `UserShell`, `LoginPage`.
- **Mobile UX baseline** (CSS in `index.html`): ≥40px tap targets, `font-size:16px` on inputs to kill iOS focus-zoom, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior-y: none`, `user-select:none` when in standalone display-mode.
- **Bottom mobile nav** in `UserShell` with `safe-area-bottom`; inactive items now use `text-stone-800` (was stone-600) for proper contrast.
- **Capacitor / native wrapper-ready**: relative URLs throughout, no localhost hardcodes, all data persisted to `localStorage` (drop-in replaceable with Capacitor `Preferences`), brand colors driven by CSS vars (matches native splash/status-bar). To wrap as iOS/Android app: `npm i @capacitor/core @capacitor/cli && npx cap init Liora com.liora.app --web-dir=dist && npx cap add ios && npx cap add android` after `npm run build`.

## Per-account data isolation (May 2026)
- Each user's `profile`, `favorites`, and `subscription` data is now namespaced by the logged-in user id via `src/lib/perUserStorage.ts` (`userScopedKey('liora-favorites')` → `liora-favorites::<uid>`). Previously all three keys were global so any new login overwrote/exposed the previous user's data.
- `demoAuth.emit()` dispatches `liora:session-changed` on every sign-in / sign-out / switcher restore. The three hooks (`useFavorites`, `useUserProfile` in both `src/hooks/` and root `hooks/`, `useSubscription`) listen for this event and reload from their per-user key, so switching accounts mid-session reflects immediately with no page reload required.
- Per-restaurant data (menu items, orders, promotions, chef specials, dine-in sessions, inventory, staff/shifts, reservations) was already correctly namespaced by `restaurantId` in `src/demoDb.ts` — left untouched.

## Neon Postgres migration (May 2026)
- **Source of truth** is now `server/` + Neon. The Express API (`server/index.js`) mounts 25 routers on boot, then runs `initSchema()` (`server/db.js` + `server/schema.sql`) and `seedDemoData()` (`server/seed.js` — idempotent: 4 demo hotels with stable owner ids `demo_owner_grand|aspen|skyline|coral`, rooms+add-ons per hotel, 4 demo restaurants under `demo_owner_liora_2026` with full menu).
- **Client write-through architecture** (avoids refactoring 35 caller files):
  - `src/lib/api.ts` — minimal fetch wrapper (`get/post/put/patch/del`); auto-detects Replit dev vs prod base URL.
  - `src/lib/dataSync.ts` — diff-based write-through. The `write()` helper inside `src/demoDb.ts` and `src/hotelDb.ts` calls `syncListChange(key, items)` after every `localStorage.setItem`, computes added/changed/removed by id vs the last snapshot and POSTs/DELETEs to the matching `/api/*` endpoint. `suspendSync()`/`resumeSync()` wrap the boot phase.
  - `src/lib/dataHydrator.ts` — `startHydration()` runs once on boot (`index.tsx`), pulls hotels/rooms/addons/bookings/reviews/restaurants/menu/orders/promotions/chef-specials from Neon and **merges by id** into localStorage (`mergeAndPrime` keeps any local-only items so they re-sync once `resumeSync()` fires).
  - `src/lib/supabaseClient.ts`, `src/lib/supabaseDb.ts`, `src/auth/supabaseAuth.ts` — replaced with API-shim stubs that preserve every previously-exported function name (`sbListStaff`, `sbAddOrder`, `sbUpsertCustomerProfile`, `hasSupabase`, `SupabaseAuth`, …) so all 7 caller files (Notifications/Staff/Inventory/Overview/RestaurantsPage/RestaurantPortal/demoAuth) continue to compile and now route through `/api/*`.
  - `@supabase/supabase-js` removed from `package.json`; `VITE_SUPABASE_*` removed from `.env`.
- **Server hardening for write-through**: `POST /api/hotel-bookings` and `POST /api/hotel-reviews` use `INSERT … ON CONFLICT (id) DO UPDATE` and only fire the SSE owner notification on a true insert (`(xmax = 0) AS _inserted`). The C11 date-overlap check excludes the current booking's own id so re-POSTed updates never self-conflict.
- **Real-time owner notifications (A4)**: `server/routes/hotelNotifications.js` exposes `GET /stream?hotelId=...` (Server-Sent Events). `hotelBookings.js` and `hotelReviews.js` call `broadcastNotification(hotelId, …)` on insert and persist to `hotel_notifications` so missed events are recoverable on reconnect.
- **Hotel offers (B6)** at `/api/hotel-offers` — CRUD + `POST /validate` for promo-code redemption.
- **Phase 2 — wired**:
  - **A1/A2** (consumer search + amenity filter): pre-existing in `HotelsHub.tsx` — verified working against Neon-backed hotels.
  - **B5** (consumer offers UI + promo code): new "Have a promo code?" panel in `HotelDetail`, calls `POST /api/hotel-offers/validate`, applies discount inline (`applyPromo(overrideCode?)` accepts an explicit code so chip-clicks bypass the React stale-state issue), shows live `discountCents` line in totals.
  - **B7** (consumer review submission): new `MyBookingCard` + `ReviewModal` — past-stay bookings show a "Leave a review" CTA that posts via `db_addReview` (which write-throughs to `/api/hotel-reviews`), idempotent against duplicate submission. Added `guestEmail?: string` to `DemoHotelReview`.
  - **B6** (hotel-side offers admin): new `OffersPage` + `OfferEditor` modal with full CRUD (`/api/hotel-offers` POST/PATCH-toggle/DELETE), discount type/value/code/min-nights/valid-until.
  - **C9** (multi-property switcher): `HotelPortal` now loads ALL hotels for the owner (`db_getHotelsByOwner(ownerId)`) and renders a `<select>` in the header when count > 1. Switching calls `setHotel(h); refresh()` so subpages re-mount cleanly via `key={tick}`.
  - **C10** (owner replies UI): pre-existing in `ReviewsPage` — verified working with Neon write-through.
  - **C12** (calendar view): new `CalendarPage` — month grid with prev/next nav, occupancy heat-map (empty/light/busy/sold-out tones based on `bookings_for_day / rooms_count`), today ring, guest-name preview chips.
  - **A4** (real-time SSE notifications): new `NotificationsPage` and `UnreadDot` badge — both subscribe to `EventSource('/api/hotel-notifications/stream?hotelId=...')` via `apiBase`, show "Connected/Offline" status, mark-one and mark-all-read actions, `alive` flag prevents post-unmount state writes.
  - **E18** (TS sweep): added `import type React` to `src/lib/menuTheme.ts` (resolved 7 namespace errors). Pre-existing TS warnings in `AiWaiter.tsx`/`Onboarding.tsx`/`ErrorBoundary.tsx`/`useUserProfile.ts`/`useLiveSession.ts` were left untouched — they are non-blocking type strictness issues that don't affect runtime; the migration did not introduce them.
- **Phase 2 — explicitly NOT shipped** (would require new product specs the user hasn't provided): A3 in-app messaging, B8 booking-flow polish, D13–D17 analytics/reports/exports (existing `AnalyticsPage` + restaurant `KPIs.tsx` cover the basics).

## Dark theme contrast fix (May 2026)
- Extended the `text-stone-*` global safety net in `index.html` to also flip `text-stone-700/800/900` (and their opacity variants) to a readable cream `#e7e5e4` when `[data-theme="dark"]` is active. Previously only stones 300-600 were re-mapped, so any pre-existing dark text on the now-dark backgrounds went invisible.

## Customer Profile redesign — insight-driven (May 2026)
- Rewrote `src/portals/user/pages/UserProfile.tsx` (now ~620 lines) into a fully personalized, data-driven dashboard. **Removed all hardcoded fake values**: the $140.50 "Liora Pay" wallet, the 1,240 XP badge, and the fake VISA •••• 4242 card are gone.
- **Personalized hero**: time-of-day greeting (morning/afternoon/evening/late-night with matching emoji + sub-line), avatar initial, member-for-N-days line, AI summary quote, tier badge, top 3 cuisines as pill chips.
- **Stat ribbon (4 real metrics)**: Restaurant Visits (from `usePastOrders`), Money on Memories (sum of order totals), Cuisines Unlocked (distinct cuisines detected from item names), Hotel Stays (from `db_listBookings` filtered by `guestEmail`).
- **For You tab — derived insights** (all computed by a single `deriveInsights()` helper):
  - **Flavour Print**: top cuisines computed by parsing each ordered item name against a `CUISINE_KEYWORDS` dictionary (12 cuisines, ~80 keywords) — shows real eating habits, not just stated preferences.
  - **Most Loved**: top restaurant by visit count + days-since-last-visit.
  - **Spending Rhythm**: 8-week mini bar chart of weekly spend + avg per visit.
  - **When You Dine**: lunch/dinner/late-night split derived from order timestamps; calls out the user's "type" ("you're a dinner person").
  - **Date Night Chemistry**: total stays, total nights, top hotel, upcoming-stay card (only renders if user has any bookings).
  - **Wellness Pulse**: avg calories + % on-goal across logged days from `useCalorieData` (only if any logs exist).
  - **Picked Just For You**: cuisine they've stated they love but haven't ordered + restaurant they haven't been back to in 14+ days.
  - **Milestones**: 6 achievement badges (First Bite, The Regular, Connoisseur, Globe Trotter, Date Night Pro, Mindful Eater) with real progress strings; locked badges greyed out.
  - **Empty state**: fresh users (0 orders, 0 stays) see a friendly "Your story starts here" card with CTAs to Restaurants and Hotels.
- **Activity tab**: combined hotel stays + past orders, each with status badge (Upcoming/Completed/Paid).
- **Preferences tab**: at-a-glance dietary card (diet/budget/spice as 🌶 chars/vibe) + allergens callout (red) + AI persona tone/style toggles.
- **Account tab**: existing password update + reset flow, now showing the signed-in email.
- Hotel bookings query: iterates `db_listHotels()` and calls `db_listBookings(h.id)` per hotel, filtering by `guestEmail === session.user.email` (case-insensitive) — same pattern HotelsHub already uses.
- Architect review **PASSED** on first pass, TypeScript clean.

## Front Desk login + notification fan-out (May 2026)
- **New `front_desk` role** in the auth system (`src/auth/types.ts`, `src/auth/demoAuth.ts`): registration takes a per-hotel access code (format `FD-XXXXXX`) generated by `genFrontDeskCode()` and stored on `DemoHotel.frontDeskCode`. Sessions carry `hotelId`, and `RoleRouter` routes `front_desk` users to a new `FrontDeskPortal`.
- **`FrontDeskPortal`** (`src/portals/hotel/FrontDeskPortal.tsx`) — sapphire sidebar, **5 tabs only** (no analytics, pricing, or business settings): **Today** (stat cards + arrivals/departures lists), **Check-in/out** (filters today/in-house/upcoming/past/all + check-in & check-out actions via `db_updateBookingStatus`), **Room availability** (toggle `active` per room, free/in-use/total counts), **Reviews & Ratings** (reply with suggested-reply prefill for 4★+, filters), **Notifications** (consumes `/api/hotel-notifications` + SSE stream + mark-all-read).
- **Hotel ProfilePage** now shows a sapphire `FrontDeskCodeCard` at the top with the access code, copy-to-clipboard and regenerate buttons; `db_ensureFrontDeskCode` lazily seeds the code for legacy hotels.
- **`ServiceProviderLogin`** got an Owner / Front-Desk toggle for hotels (mirrors the Owner / Service-Desk toggle for restaurants), with a `concierge_bell` icon, code field, and clear copy.
- **Customer notification fan-out**:
  - New `src/lib/restaurantNotifications.ts` (mirror of `adminNotifications.ts`) with kinds `review_received`, `order_placed`, `reservation_placed`, `reply_posted`.
  - Restaurant review submit (`LeaveRestaurantReviewModal`) now fires `restoNotify(review_received)` AND `adminNotify(ticket_opened, venueType:'restaurant')` after a successful POST.
  - Customer order placement (`RestaurantsPage.placeOrder`) now also fires `restoNotify(order_placed)` so the owner portal gets a live feed entry alongside the existing table-alerts.
  - Hotel side already broadcasts via server SSE (`server/routes/hotelNotifications.js` from reviews/bookings/messages); the new FrontDeskPortal subscribes to the same stream so reception sees the same alerts as the owner.
- TypeScript clean (`npx tsc --noEmit` passes). Workflow HMR'd successfully.

## Demo data + quick-access purge (May 2026)
**User asked: "I do not need any fake datas or any fake things or quick access if I have signed up and only those working show me only those."** Done:
- **`ServiceProviderLogin.tsx`** — removed `DEMO_RESTAURANTS` & `DEMO_HOTELS` arrays (with their 🍽️🌸🌶️🪵🏖️🏔️🌆🌴 emoji icons), `DEMO_PASSWORD = 'demo1234'`, `handleDemoLogin`, `demoLoadingIdx` state, and the entire "Try a demo property/venue — instant access" emoji-chip grid.
- **`RestaurantLogin.tsx`** (legacy) — same purge: removed `DEMO_RESTAURANTS_LIST`, `DEMO_PASSWORD`, `handleDemoRestaurantLogin`, `selectedDemo` state, and the demo-chip grid.
- **`AdminLogin.tsx`** — removed pre-filled demo email/password, the "Use demo credentials" auto-fill button, and the on-screen credentials display. Login fields start empty; replaced help text with "Restricted access · all sign-ins are logged."
- **`server/index.js`** — `seedDemoData()` is now gated behind `LIORA_SEED_DEMO=1`. By default the server only stores real signed-up data.
- **`HotelsHub.tsx`, `DateNightModal.tsx`, `demoAuth.signUpHotelOwner`** — removed `db_seedAllDemoHotels()` calls. The customer-facing hotel listings now show only hotels that real owners have actually created.
- **`HotelPortal.tsx`** — `db_seedHotelIfEmpty` no longer runs on every owner login; it now runs **only** on first sign-up (when there's a `liora_pending_hotel_names` entry stashed by the registration flow).
- **3D-looking icons** — the only "3D" elements on public/auth surfaces were the colored emoji icons used as chip avatars in the demo-login grids (Apple/Mac renders them as glossy 3D glyphs). All gone. The shared `<Icon>` component (`components/Icon.tsx`) is already a flat line-art SVG library used everywhere else — no further icon changes needed there.
- **Storage architecture note** — the consumer app still uses `localStorage` (BKEY/HKEY/RKEY/SKEY in `hotelDb.ts` + `demoDb.ts`) as the primary client cache; matching server endpoints exist on Neon for hotels, hotel_bookings, hotel_reviews, hotel_notifications, hotel_messages, hotel_offers, restaurants, orders, table_alerts, etc. Real signups + real bookings + real reviews already write through to Neon via `api.post(...)` and `sb*` helpers. A full migration of the in-browser caches to Neon-backed reads would be a multi-day overhaul; flagged for follow-up if desired.

## Hotel-owner empty state + post-hydration refresh (May 2026)
- **HotelPortal "Create your first hotel"** — replaced the infinite "Preparing your concierge desk…" loader (`HotelPortal.tsx:90`) with a real `EmptyHotelState` form. When a hotel owner has 0 hotels they now see a styled card with their first name, a "Property name" input pre-filled with `${first}'s Hotel`, and a "Create my hotel" button that calls `db_createHotel(ownerId, name)` and jumps them straight into the Profile tab to add details. Includes a discreet "Sign out" link.
- **Post-hydration auto-refresh** — `HotelPortal` and `HotelsHub` now subscribe to the `liora:hydrated` window event fired by `dataHydrator.startHydration()` and bump their tick to re-render. This means an owner who signs in on a fresh device sees their hotels (and a guest sees the full hotel list) the moment Neon hydration completes, without having to refresh the page.
- **No persistence-layer changes needed** — the audit subagent's "client never POSTs to Neon" finding was wrong: `hotelDb.ts:135` already calls `syncListChange(k, v)` after every write, and `dataHydrator.ts` already pulls everything from Neon on boot. The wiring is correct as-is.
- TypeScript clean, architect review **PASSED**.

## Session B — Mobile sweep (May 2026)
**Context**: most users will be on phones, mobile app planned later. Fixed 6 high-priority mobile bugs from the audit:
1. **Booking modal no longer hides behind iOS keyboard / home indicator** — `HotelsHub.tsx` and `DateNightModal.tsx` modal containers now use `max-h-[100dvh]` on mobile (instead of `95vh`/`92vh`), `overscroll-contain` to stop body bounce, and `pb-[env(safe-area-inset-bottom)]` so CTAs clear the home indicator.
2. **Amenity filter chip marquee** — `HotelsHub.tsx` chip row got `pr-6` (last chip no longer kissed the screen edge) and `snap-x snap-mandatory` for a more native-feeling horizontal scroll.
3. **Tables.tsx edit/delete buttons** — were `opacity-0 group-hover:opacity-100` (completely invisible on touch devices since there is no hover) and 7×7 (well below the 44px tap target). Now `md:opacity-0 md:group-hover:opacity-100` (always visible on phones, hover-reveal on desktop) and 11×11 on mobile / 9×9 on desktop, with `aria-label`s.
4. **Public landing nav** (`Landing.tsx`) — the entire desktop nav was `lg:flex hidden`, meaning **mobile visitors saw NO menu at all**. Added a hamburger button (lg:hidden, 11×11, aria-labelled) that opens a right-side drawer with Discover / Restaurants / Hotels / AI Concierge / Wellness / For Partners + Sign in (and Admin if available). Drawer respects `safe-area-inset-top/bottom`, locks body scroll while open, and dismisses on backdrop click.
5. **Reservations table** in `RestaurantDashboard.tsx` — wrapped raw `<table>` in `overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0` with `min-w-[480px]` so it scrolls horizontally on phones instead of breaking the page layout.
6. **Confirmed bottom nav already has** `safe-area-bottom` class wired in `UserShell.tsx` — no change needed.

Architect verdict: **PASS**. TypeScript clean (`npx tsc --noEmit`). Pending sessions: C (UI consistency: 50+ inline SVGs → `<Icon>`, normalize radii/shadows/colors), D (premium polish: toast, skeletons, haptics, tabular-nums), E (real new features: push notif, PWA, map, photo upload).

## Session C — UI consistency pass (May 2026)
**Two pragmatic, high-leverage changes** (full 50+ SVG migration deferred — long tail, low per-file leverage):
1. **Global keyboard-focus accessibility safety net** in `index.html` `<style>` block: added `:focus-visible` and `input/textarea/select:focus-visible` rules painting a 2px brand-color outline. Audit found 24 files using `focus:outline-none` (29 instances had NO replacement ring — keyboard users were completely lost). One global rule fixes them all instead of editing 24 files. Invisible to mouse/touch users (`:focus-visible` only fires on keyboard nav), so the primary phone audience sees no change.
2. **Inline SVG → `<Icon>` migration in `Landing.tsx`** (the most-trafficked file): replaced 5 of the 8 inline SVGs with canonical `<Icon name="menu|settings|x|arrow_forward">` calls. Three decorative ones (champagne quote bubble, sparkle twinkle path, chevron-up polyline) have no clean Icon equivalent and were left.

Not in scope, deferred: the remaining ~30 inline SVGs across Tables/ServiceDeskPortal/SettingsPanel/Login pages, and border-radius/shadow token normalization (would require introducing a design-token layer — more invasive than current sprint warrants).

TypeScript clean. Architect verdict pending below.

## Session D — Premium polish foundations (May 2026)
**Built four reusable foundations + replaced all blocking `alert()` calls:**

1. **Toast notification system** (`src/lib/toast.ts` + `src/components/Toaster.tsx`):
   - Imperative event-based API. `toast(msg)`, `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()` — callable from anywhere (modules, async fns, even outside React) via a `liora:toast` CustomEvent on `window`. No Provider needed.
   - `<Toaster />` mounted once in `App.tsx` after `RoleRouter`. Renders a bottom-center stack respecting `env(safe-area-inset-bottom)`, color-coded by kind (info=stone, success=emerald, error=red, warning=amber), dismiss button + optional action button, `aria-live="polite"` (or `role="alert"` for errors).
   - **All 9 `alert()` calls replaced** across `DevDataBackup`, `VenueSettings` (logo/cover size errors), `MenuStudio` (logo/bg size errors), `HotelPortal` (chat send + pricing apply errors), `HotelsHub` (chat send error), `demoAuth.resetPassword` (used dynamic `import()` to avoid circular dep at module load).

2. **Skeleton loaders** (`src/components/Skeleton.tsx`): base `<Skeleton>` shimmer + ready-made `<HotelCardSkeleton>` and `<ListRowSkeleton>`. Adopted opportunistically — existing `PageSpinner` sites can swap in later. Shimmer uses brand cream variables in light mode, white-alpha in dark mode.

3. **Haptics helper** (`src/lib/haptics.ts`): `haptics.tap()`, `.select()`, `.success()`, `.warning()`, `.error()` — short patterns via `navigator.vibrate`. No-op on unsupported devices (desktop, iOS pre-iOS-18 Safari, etc.). Wired into `<Toaster />` so toasts buzz appropriately on touch devices.

4. **Global CSS additions** in `index.html` `<style>` block:
   - `@keyframes toast-in` + `.animate-toast-in` (220ms cubic-bezier slide-up)
   - `@keyframes skeleton-shimmer` + `.skeleton-shimmer` with light + dark variants
   - `prefers-reduced-motion` respect for both animations
   - Tabular-numerals utility classes: `.num`, `[data-numeric]`, `.price`, `.stat-number`, `.tabular` — for opportunistic adoption on price/stat displays so columns line up

**Architect verdict and migration of existing PageSpinner sites to skeletons → next polish pass.** TypeScript clean.

## Session E — New features (May 2026)
**Closes the parallel-audit roadmap. Four features shipped end-to-end:**

1. **PWA installability + offline shell**
   - `public/sw.js`: cache-first SHELL precache (`/`, `index.html`, manifest, favicon), stale-while-revalidate static assets, network-first navigations with `/index.html` offline fallback. Skips `/api/`, `/@`, `/__` (so HMR + API never get stale-cached).
   - `src/lib/pwa.ts`: `registerServiceWorker()` (production only — DEV bails to keep Vite HMR healthy), `bindInstallPrompt()` / `canInstall()` / `promptInstall()`, `isStandalone()`, `requestNotificationPermission()`.
   - `src/components/PwaPrompts.tsx`: floating banner (mounted in `App.tsx` after Toaster, above bottom nav with safe-area inset). Dismissible install card (`liora_pwa_install_dismissed` in localStorage). Auto-hidden when in standalone mode.
   - SW registered in `App.tsx` `useEffect`. Build-time only, never in dev.

2. **Web push notifications — client scaffold** (real backend deferred — needs VAPID keys + push subscription endpoint)
   - `sw.js` has `push` + `notificationclick` handlers ready.
   - `requestNotificationPermission()` helper with toast feedback.
   - "Stay in the loop" prompt in `PwaPrompts` shows only when `isStandalone()` + permission is `default` + not previously dismissed (`liora_notif_prompt_dismissed`). 4-second delay avoids first-paint flash.

3. **Map view on HotelsHub** (`src/components/HotelsMapView.tsx`)
   - Lazy-loads Leaflet 1.9.4 + OpenStreetMap tiles from unpkg with SRI integrity hashes. **Zero npm deps, zero API key, zero cost.**
   - Grid/Map pill toggle to the right of "<N> hotels available" header. Markers from existing `hotel.latitude`/`longitude` on demo seed. Popup → "View details →" button opens the same `HotelDetail` modal as grid cards.
   - `scrollWheelZoom: false` so the page still scrolls. Auto-fit bounds; single-result zoom = 11.

4. **Photo upload on reviews — full DB→API→UI**
   - Schema: `ALTER TABLE hotel_reviews ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb` in `server/schema.sql` (idempotent, runs on every boot).
   - `server/routes/hotelReviews.js`: accepts `photoUrls: string[]` (capped at 6 server-side via `slice(0, 6)`), stored as jsonb (`JSON.stringify(photos)`), surfaced through `toR()` mapper.
   - `DemoHotelReview.photoUrls?: string[]` added to `src/hotelDb.ts`.
   - `src/lib/imageResize.ts`: client-side resize to ≤1280px JPEG @ 0.82 quality before posting (keeps payloads small).
   - `ReviewModal` in `HotelsHub.tsx`: 3-photo max grid with remove × button + dashed "Add" tile. 8 MB raw upload limit. Errors via toast.
   - Review cards render photo thumbnails with `<a target="_blank">` click-through to full-res. Lazy-loaded.

**All five sessions (A–E) of the parallel-audit roadmap are now complete.** Architect verdict pending. TypeScript clean. Server restarted with new schema (`[DB] schema verified` confirmed in logs).
