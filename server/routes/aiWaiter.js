import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { uid, tableSessions, assistanceRequests, orders, now } from '../store.js';

const router = Router();

// Initialize AI Client (reuse from frontend service)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const SYSTEM_PROMPT = `You are Liora, an AI Dining Companion acting as a waiter at a restaurant.

Your role: Provide excellent table service, recommend dishes, answer questions about the menu, take orders, and enhance the dining experience.

Key behaviors:
- Be warm, professional, and attentive
- Remember table number and restaurant context
- Suggest wine pairings and specials
- Handle special requests gracefully
- Maintain conversation flow naturally

Always stay in character as a helpful restaurant waiter.`;

const chatWithHistory = async ({ history, user, sessionContext }) => {
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';

    const systemInstruction = `${SYSTEM_PROMPT}\n\nSession Context: ${JSON.stringify(sessionContext)}`;

    const contents = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    }));

    contents.push({ role: 'user', parts: [{ text: user }] });

    try {
        const result = await ai.models.generateContent({
            model: modelId,
            contents,
            config: { systemInstruction }
        });

        return {
            id: uid(),
            author: 'LIORA',
            text: result.text || "I'm sorry, I couldn't generate a response.",
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('AI Waiter Error:', error);
        return {
            id: uid(),
            author: 'SYSTEM',
            text: "I'm having trouble connecting to the kitchen. Please try again.",
            timestamp: Date.now()
        };
    }
};

// â €â €â €â € TABLE SESSION ROUTES â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €

// POST /api/ai-waiter/connect
// Connect to a table session using QR code data (tableNumber, restaurantName)
router.post('/connect', (req, res) => {
    const { tableNumber, restaurantName } = req.body;
    if (!tableNumber || !restaurantName) {
        return res.status(400).json({ error: 'tableNumber and restaurantName are required' });
    }
    // Generate a sessionId (could be encoded in QR)
    const sessionId = uid();
    const session = {
        sessionId,
        tableNumber,
        restaurantName,
        createdAt: now(),
        status: 'active'
    };
    tableSessions.set(sessionId, session);
    res.json({ sessionId, ...session });
});

// POST /api/ai-waiter/order
// Place an order for a table session
router.post('/order', (req, res) => {
    const { sessionId, customerName, items } = req.body;
    if (!sessionId || !customerName || !items?.length) {
        return res.status(400).json({ error: 'sessionId, customerName, and items are required' });
    }
    const session = tableSessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    // Place order (reuse order logic)
    const order = {
        id: uid(),
        restaurantId: session.restaurantName,
        customerName,
        tableOrDelivery: `table-${session.tableNumber}`,
        items,
        totalCents: items.reduce((s, i) => s + (i.priceCents * i.qty), 0),
        status: 'pending',
        createdAt: now()
    };
    orders.set(order.id, order);
    res.status(201).json(order);
});

// POST /api/ai-waiter/assistance
// Request table-side assistance
router.post('/assistance', (req, res) => {
    const { sessionId, type } = req.body;
    if (!sessionId || !type) {
        return res.status(400).json({ error: 'sessionId and type are required' });
    }
    const session = tableSessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    const requestId = uid();
    const request = {
        requestId,
        sessionId,
        type, // e.g. 'refill', 'help', 'bill', etc.
        status: 'pending',
        createdAt: now()
    };
    assistanceRequests.set(requestId, request);
    res.status(201).json(request);
});

// GET /api/ai-waiter/session/:sessionId
// Get session info, orders, and assistance requests for a table
router.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = tableSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    // Get orders for this session (by table)
    const sessionOrders = [...orders.values()].filter(o => o.tableOrDelivery === `table-${session.tableNumber}`);
    // Get assistance requests for this session
    const sessionAssists = [...assistanceRequests.values()].filter(a => a.sessionId === sessionId);
    res.json({ session, orders: sessionOrders, assistanceRequests: sessionAssists });
});

// â €â €â €â € AI CHAT ROUTES â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €

// POST /api/ai-waiter/chat
router.post('/chat', async (req, res) => {
    try {
        const {
            history = [],
            message,
            sessionContext = {}
        } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Validate session context
        if (!sessionContext.restaurantName || !sessionContext.tableNumber) {
            return res.status(400).json({ error: 'Valid session context required' });
        }

        const userMessage = `CONTEXT: Table ${sessionContext.tableNumber} at ${sessionContext.restaurantName}. User says: ${message}`;

        const response = await chatWithHistory({
            history,
            user: userMessage,
            sessionContext
        });

        res.json(response);
    } catch (error) {
        console.error('AI Waiter Chat Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: {
                id: uid(),
                author: 'SYSTEM',
                text: "I'm having trouble connecting to the kitchen. Please try again.",
                timestamp: Date.now()
            }
        });
    }
});

// GET /api/ai-waiter/health
router.get('/health', (req, res) => {
    res.json({ status: 'AI Waiter service is running' });
});

export default router;
