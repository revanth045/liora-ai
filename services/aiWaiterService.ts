/**
 * AI Waiter Service - Handles all API calls to the backend
 * Manages table sessions, orders, and assistance requests
 */

const API_BASE = '/api/ai-waiter';

export interface TableSession {
  sessionId: string;
  tableNumber: string | number;
  restaurantName: string;
  createdAt: number;
  status: 'active' | 'inactive';
}

export interface OrderItem {
  name: string;
  qty: number;
  priceCents: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  tableOrDelivery: string;
  items: OrderItem[];
  totalCents: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'rejected';
  createdAt: number;
  updatedAt?: number;
}

export interface AssistanceRequest {
  requestId: string;
  sessionId: string;
  type: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface SessionData {
  session: TableSession;
  orders: Order[];
  assistanceRequests: AssistanceRequest[];
}

/**
 * Check if backend is reachable
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    console.log('ð  ¥ Checking backend health...');
    const response = await fetch(`${API_BASE}/health`);
    const isHealthy = response.ok;
    console.log(isHealthy ? '✨ Backend is healthy' : '❌ Backend is not responding');
    return isHealthy;
  } catch (error) {
    console.error('❌ Backend unreachable:', error);
    return false;
  }
};

/**
 * Connect to a table via QR code data
 */
export const connectToTable = async (
  tableNumber: string | number,
  restaurantName: string
): Promise<TableSession> => {
  // Try to reach the backend. On any failure silently fall back to a local
  // demo session so the QR-scanned restaurant name is always applied.
  try {
    const response = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, restaurantName }),
      signal: AbortSignal.timeout(4000), // 4 s timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✨ Backend session created:', data);
      return data;
    }
    console.warn('⚠️ Backend returned non-OK response — using local session');
  } catch (_err) {
    console.warn('⚠️ Backend unreachable — using local session fallback');
  }

  // Local fallback: build a session from the QR data directly
  return {
    sessionId: `local_${Date.now()}`,
    tableNumber: String(tableNumber),
    restaurantName,
    createdAt: Date.now(),
    status: 'active',
  };
};


/**
 * Place an order for a table session
 */
export const placeOrder = async (
  sessionId: string,
  customerName: string,
  items: OrderItem[]
): Promise<Order> => {
  const response = await fetch(`${API_BASE}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, customerName, items })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to place order');
  }

  return response.json();
};

/**
 * Request table-side assistance
 */
export const requestAssistance = async (
  sessionId: string,
  type: string
): Promise<AssistanceRequest> => {
  const response = await fetch(`${API_BASE}/assistance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, type })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to request assistance');
  }

  return response.json();
};

/**
 * Get session data (session info, orders, assistance requests)
 */
export const getSessionData = async (sessionId: string): Promise<SessionData> => {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session data');
  }

  return response.json();
};

/**
 * Chat with AI Waiter (existing endpoint)
 */
export const chatWithAiWaiter = async (
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  sessionContext: { restaurantName: string; tableNumber: string }
): Promise<{ id: string; author: string; text: string; timestamp: number }> => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, sessionContext })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to chat with AI Waiter');
  }

  return response.json();
};

