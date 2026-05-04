import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { initSchema } from './db.js';
import { seedDemoData } from './seed.js';

import ordersRouter from './routes/orders.js';
import menuRouter from './routes/menu.js';
import analyticsRouter from './routes/analytics.js';
import promotionsRouter from './routes/promotions.js';
import reviewsRouter from './routes/reviews.js';
import aiWaiterRouter from './routes/aiWaiter.js';
import restaurantsRouter from './routes/restaurants.js';
import usersRouter from './routes/users.js';
import customerProfilesRouter from './routes/customerProfiles.js';
import staffRouter from './routes/staff.js';
import shiftsRouter from './routes/shifts.js';
import attendanceRouter from './routes/attendance.js';
import inventoryRouter from './routes/inventory.js';
import tablesRouter from './routes/tables.js';
import dineSessionsRouter from './routes/dineSessions.js';
import chefSpecialsRouter from './routes/chefSpecials.js';
import eventsRouter from './routes/events.js';
import tableAlertsRouter from './routes/tableAlerts.js';
import hotelsRouter from './routes/hotels.js';
import hotelRoomsRouter from './routes/hotelRooms.js';
import hotelBookingsRouter from './routes/hotelBookings.js';
import hotelAddonsRouter from './routes/hotelAddons.js';
import hotelReviewsRouter from './routes/hotelReviews.js';
import hotelOffersRouter from './routes/hotelOffers.js';
import hotelNotificationsRouter from './routes/hotelNotifications.js';
import hotelMessagesRouter from './routes/hotelMessages.js';
import aiInsightsRouter from './routes/aiInsights.js';
import dynamicPricingRouter from './routes/dynamicPricing.js';
import aiConciergeRouter from './routes/aiConcierge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

app.use('/api/orders', ordersRouter);
app.use('/api/menu', menuRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/ai-waiter', aiWaiterRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/users', usersRouter);
app.use('/api/customer-profiles', customerProfilesRouter);
app.use('/api/staff', staffRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/dine-sessions', dineSessionsRouter);
app.use('/api/chef-specials', chefSpecialsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/table-alerts', tableAlertsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/hotel-rooms', hotelRoomsRouter);
app.use('/api/hotel-bookings', hotelBookingsRouter);
app.use('/api/hotel-addons', hotelAddonsRouter);
app.use('/api/hotel-reviews', hotelReviewsRouter);
app.use('/api/hotel-offers', hotelOffersRouter);
app.use('/api/hotel-notifications', hotelNotificationsRouter);
app.use('/api/hotel-messages', hotelMessagesRouter);
app.use('/api/ai-insights', aiInsightsRouter);
app.use('/api/dynamic-pricing', dynamicPricingRouter);
app.use('/api/ai-concierge', aiConciergeRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET') res.sendFile(path.join(distPath, 'index.html'));
    else next();
  });
}

app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

(async () => {
  try {
    await initSchema();
    // Demo seeding disabled — only real signed-up data is shown.
    // Re-enable by setting LIORA_SEED_DEMO=1 if you need fixtures during dev.
    if (process.env.LIORA_SEED_DEMO === '1') {
      await seedDemoData();
      console.log('[Seed] LIORA_SEED_DEMO=1 — demo fixtures inserted');
    }
    app.listen(PORT, () => {
      console.log(`[Liora API] running on http://localhost:${PORT}`);
      console.log(`   Mode: ${isProduction ? 'production' : 'development'}`);
    });
  } catch (e) {
    console.error('[Boot failure]', e);
    process.exit(1);
  }
})();

export default app;
