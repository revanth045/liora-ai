# AI Waiter Feature - Frontend & Backend Implementation

## Overview
The AI Waiter feature enables customers to scan QR codes at restaurant tables to access digital ordering, real-time chat with an AI dining companion, and table-side assistance requests.

## Architecture

### Backend Endpoints (`/api/ai-waiter/`)

#### 1. **POST `/connect`** - Connect to Table Session
Initiates a table session via QR code data.

```javascript
// Request
{
  "tableNumber": "12",
  "restaurantName": "The Italian Place"
}

// Response
{
  "sessionId": "uuid-string",
  "tableNumber": "12",
  "restaurantName": "The Italian Place",
  "createdAt": 1705161600000,
  "status": "active"
}
```

#### 2. **POST `/order`** - Place an Order
Places an order for a table session.

```javascript
// Request
{
  "sessionId": "uuid-string",
  "customerName": "John Doe",
  "items": [
    {
      "name": "Margherita Pizza",
      "qty": 1,
      "priceCents": 1200
    },
    {
      "name": "Iced Tea",
      "qty": 2,
      "priceCents": 300
    }
  ]
}

// Response
{
  "id": "order-uuid",
  "restaurantId": "restaurant-name",
  "customerName": "John Doe",
  "tableOrDelivery": "table-12",
  "items": [...],
  "totalCents": 1800,
  "status": "pending",
  "createdAt": 1705161600000
}
```

#### 3. **POST `/assistance`** - Request Table Service
Sends an assistance request (e.g., "waiter", "refill", "bill").

```javascript
// Request
{
  "sessionId": "uuid-string",
  "type": "waiter"  // or "refill", "bill", "help", etc.
}

// Response
{
  "requestId": "uuid-string",
  "sessionId": "uuid-string",
  "type": "waiter",
  "status": "pending",
  "createdAt": 1705161600000
}
```

#### 4. **GET `/session/:sessionId`** - Get Session Data
Retrieves session info, active orders, and assistance requests.

```javascript
// Response
{
  "session": {
    "sessionId": "uuid-string",
    "tableNumber": "12",
    "restaurantName": "The Italian Place",
    "createdAt": 1705161600000,
    "status": "active"
  },
  "orders": [
    { /* order objects */ }
  ],
  "assistanceRequests": [
    { /* assistance request objects */ }
  ]
}
```

#### 5. **POST `/chat`** - AI Waiter Chat (Existing)
Chat with the AI waiter for recommendations, questions, and ordering assistance.

```javascript
// Request
{
  "message": "What do you recommend?",
  "history": [
    { "role": "user", "content": "Hi!" },
    { "role": "assistant", "content": "Welcome!" }
  ],
  "sessionContext": {
    "restaurantName": "The Italian Place",
    "tableNumber": "12"
  }
}

// Response
{
  "id": "msg-uuid",
  "author": "LIORA",
  "text": "I recommend our signature Risotto...",
  "timestamp": 1705161600000
}
```

---

## Frontend Implementation

### 1. **AI Waiter Service** (`services/aiWaiterService.ts`)
Provides TypeScript functions for all backend API calls:
- `connectToTable(tableNumber, restaurantName)` - Connect to a table
- `placeOrder(sessionId, customerName, items)` - Place an order
- `requestAssistance(sessionId, type)` - Request assistance
- `getSessionData(sessionId)` - Fetch session data
- `chatWithAiWaiter(message, history, sessionContext)` - Chat with AI

### 2. **Dining Context** (`src/context/DiningContext.tsx`)
React Context managing the dining session state:
- `session` - Current session state (restaurantId, tableNumber, sessionId, orders, etc.)
- `connectTableViaQR()` - Initiates table connection
- `addOrder()` - Add order to session state
- `requestAssistance()` - Request table service

### 3. **AiWaiter Component** (`components/AiWaiter.tsx`)
Main UI component with two modes:

#### **Mode 1: Scanner (Not Connected)**
- Shows "Connect to Table" landing screen
- "Open Camera Scanner" button launches QR scanner modal
- QR Scanner features:
  - Live video feed from device camera
  - Real-time QR code detection using `jsQR` library
  - Visual frame overlay for QR targeting
  - Manual fallback entry (table number + restaurant name)
  - Error handling with user feedback

#### **Mode 2: Live Service (Connected)**
- **Session Header**: Displays restaurant name, table number, live status
- **Chat Area**: Conversation with AI Waiter
- **Quick Actions Bar**: Shortcuts for common requests:
  - "Call Waiter"
  - "Order Drinks"
  - "Request Bill"
  - "Dietary Question"
  - "See Specials"
  - "Get Manager"
- **Input Area**: Text input for custom messages
- **Bill Splitter Modal**: Split bill among guests

---

## Key Features

### ✅ QR Code Scanning
- Camera-based QR detection using `jsQR` library
- Fallback to manual table/restaurant entry
- Secure session initialization

### ✅ Digital Ordering
- Integrated with backend order system
- Real-time order status tracking
- Multi-item order support

### ✅ AI Chat
- Context-aware AI waiter recommendations
- Menu assistance and dietary questions
- Wine pairings and specials

### ✅ Table-Side Assistance
- One-click waiter calls
- Bill requests
- Service recovery prompts
- Real-time request tracking

### ✅ Session Management
- Auto-login per table
- Persistent session data
- Order history per table
- Assistance request queue

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install jsqr
```

### 2. Update Backend
Ensure backend routes are registered in `server/index.js`:
```javascript
import aiWaiterRouter from './routes/aiWaiter.js';
app.use('/api/ai-waiter', aiWaiterRouter);
```

### 3. Wrap App with DiningProvider
In your main app file (e.g., `App.tsx`):
```tsx
import { DiningProvider } from './src/context/DiningContext';

export default function App() {
  return (
    <DiningProvider>
      {/* Your app routes */}
    </DiningProvider>
  );
}
```

### 4. Start Development Server
```bash
npm run dev
```

---

## QR Code Format

The QR code should encode table information as:
```
tableNumber:restaurantName
```

Example:
```
12:The_Italian_Place
5:Sushi_Palace
```

Or simply encode the session ID if using pre-generated QR codes at each table.

---

## Usage Flow

1. **Customer arrives at table** → Scans QR code with phone
2. **QR Scanner detects code** → Extracts table number & restaurant name
3. **Backend creates session** → Returns unique `sessionId`
4. **Session stored in context** → UI transitions to live service mode
5. **Customer interacts** via:
   - Chat with AI Waiter
   - Quick action buttons (waiter call, refill, bill)
   - Manual text input
6. **Orders & assistance requests** → Sent to backend
7. **Restaurant staff** → Receives requests in real-time
8. **Customer leaves table** → "Leave Table" button ends session

---

## State Management Flow

```
Not Connected
    ↓
User clicks "Open Camera Scanner"
    ↓
QR Scanner Modal Opens
    ↓
User scans QR code / enters manually
    ↓
connectTableViaQR() called
    ↓
Backend creates session
    ↓
sessionId stored in context
    ↓
Transition to Live Service Mode
    ↓
Chat, Orders, Assistance requests
    ↓
User clicks "Leave Table"
    ↓
Back to Not Connected
```

---

## Error Handling

- **Camera Access Denied**: Shows permission prompt and manual entry option
- **QR Detection Failure**: Allows manual table/restaurant entry
- **Session Not Found**: Prompts to reconnect
- **Chat Error**: Shows system message to retry
- **Assistance Request Failed**: User-friendly error notification

---

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Image-based menu scanning
- [ ] Voice input for orders
- [ ] Multi-language AI support
- [ ] Table splitting with individual session tracking
- [ ] Analytics dashboard for restaurants
- [ ] Payment integration
- [ ] Table-to-kitchen order routing

---

## Dependencies

- **jsQR** - QR code detection
- **React** - UI framework
- **Express** - Backend server
- **@google/genai** - Gemini AI integration

---

## API Base URL

Development: `http://localhost:3001/api/ai-waiter`

Change in `services/aiWaiterService.ts`:
```typescript
const API_BASE = 'http://localhost:3001/api/ai-waiter';
```

