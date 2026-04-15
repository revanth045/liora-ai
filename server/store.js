/**
 * In-memory data store — drop-in replacement with any DB later.
 * All IDs are nanoid-style strings for easy Supabase migration.
 */
import { randomUUID } from 'crypto';

const uid = () => randomUUID();
const now = () => Date.now();

// ─── ORDERS ─────────────────────────────────────────────────────────────────
const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'];

const orders = new Map();

// ─── MENU ────────────────────────────────────────────────────────────────────
const menuItems = new Map();

// ─── PROMOTIONS ──────────────────────────────────────────────────────────────
const promotions = new Map();

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
const reviews = new Map();

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
const analytics = {};

// ─── AI WAITER TABLE SESSIONS & ASSISTANCE ───────────────────────────────────
const tableSessions = new Map(); // sessionId -> { sessionId, tableNumber, restaurantName, createdAt, status }
const assistanceRequests = new Map(); // requestId -> { requestId, sessionId, type, status, createdAt }

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export { orders, menuItems, promotions, reviews, analytics, uid, now, STATUS_FLOW, tableSessions, assistanceRequests };
