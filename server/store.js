// Compatibility shim — legacy in-memory maps used by aiWaiter route.
// All other modules now use the Postgres-backed db module directly.
import { randomUUID } from 'crypto';

export const uid = () => randomUUID();
export const now = () => Date.now();
export const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'];

export const tableSessions = new Map();
export const assistanceRequests = new Map();

// Stubs kept so any older import path doesn't crash; real data is in PG.
export const orders = new Map();
export const menuItems = new Map();
export const promotions = new Map();
export const reviews = new Map();
export const analytics = {};
