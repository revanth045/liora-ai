import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import ordersRouter from './routes/orders.js';
import menuRouter from './routes/menu.js';
import analyticsRouter from './routes/analytics.js';
import promotionsRouter from './routes/promotions.js';
import reviewsRouter from './routes/reviews.js';
import aiWaiterRouter from './routes/aiWaiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy so rate-limit can read the real client IP
app.set('trust proxy', 1);

// â €â € Security middleware â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting â ” 300 req / 15 min per IP
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// â €â € API Routes â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
app.use('/api/orders', ordersRouter);
app.use('/api/menu', menuRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/ai-waiter', aiWaiterRouter);

// â €â € Health check â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// â €â € API 404 handler â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// â €â € Production: serve Vite build output â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
if (isProduction) {
  const distPath = path.resolve(__dirname, '..', 'dist');

  // Serve hashed assets with long cache; index.html must never be cached
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // SPA fallback — serve index.html for all non-API routes (never cached)
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

// â €â € Error handler â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ð  ½️  Liora API server running on http://localhost:${PORT}`);
  console.log(`   Mode: ${isProduction ? 'production' : 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
