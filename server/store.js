/**
 * In-memory data store â ” drop-in replacement with any DB later.
 * All IDs are nanoid-style strings for easy Supabase migration.
 */
import { randomUUID } from 'crypto';

const uid = () => randomUUID();
const now = () => Date.now();

// â €â €â € ORDERS â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'];

const orders = new Map();

// â €â €â € MENU â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const menuItems = new Map();

// â €â €â € PROMOTIONS â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const promotions = new Map();

// â €â €â € REVIEWS â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const reviews = new Map();

// â €â €â € ANALYTICS â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const analytics = {};

// â €â €â € AI WAITER TABLE SESSIONS & ASSISTANCE â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const tableSessions = new Map(); // sessionId -> { sessionId, tableNumber, restaurantName, createdAt, status }
const assistanceRequests = new Map(); // requestId -> { requestId, sessionId, type, status, createdAt }

// â €â €â € EXPORTS â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
export { orders, menuItems, promotions, reviews, analytics, uid, now, STATUS_FLOW, tableSessions, assistanceRequests };
