# AI Waiter Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd liora-main
npm install
```

This installs the new `jsQR` library for QR code detection.

### Step 2: Start the Development Server
```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Step 3: Test the AI Waiter Feature

#### Option A: Scan QR Code (Recommended)
1. Navigate to the AI Waiter page in the app
2. Click "Open Camera Scanner"
3. Use your phone camera to scan a QR code

**Quick test QR codes** (use your phone):
- Table 1 at Demo Restaurant: `1:Demo_Restaurant`
- Table 12 at The Italian Place: `12:The_Italian_Place`

#### Option B: Manual Entry (Fallback)
1. Click "Open Camera Scanner"
2. Click "Manual Entry"
3. Enter table number and restaurant name

#### Option C: Generate Demo QR Codes
```javascript
// In browser console:
import { generateQRImageUrl, printQRCodes } from '/utils/qrCodeGenerator.ts';

// Generate a single QR code
const qrUrl = generateQRImageUrl(12, 'The Italian Place', 300);
console.log(qrUrl); // Copy URL to browser

// Generate & print QR codes for all tables
printQRCodes('My Restaurant', 20);
```

### Step 4: Test Features

#### 🤖 Chat with AI Waiter
- Type a message in the input field
- Get AI-powered restaurant recommendations

#### 📱 Request Assistance
- Click "Call Waiter" button
- Click "Request Bill" button
- Click "Order Drinks" button
- Watch assistance requests register in real-time

#### 💰 Order Placement
The backend is ready to process orders. To test:
```bash
curl -X POST http://localhost:3001/api/ai-waiter/order \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "customerName": "John Doe",
    "items": [
      {"name": "Pasta", "qty": 1, "priceCents": 1500}
    ]
  }'
```

---

## Architecture Overview

```
Frontend (React/TypeScript)
    ↓
AiWaiter Component
    ├── QR Scanner Modal
    ├── Chat Interface
    ├── Quick Actions
    └── DiningContext (State Management)
    ↓
aiWaiterService (API Layer)
    ↓
Backend Express Server
    ├── /api/ai-waiter/connect
    ├── /api/ai-waiter/chat
    ├── /api/ai-waiter/order
    ├── /api/ai-waiter/assistance
    └── /api/ai-waiter/session/:sessionId
```

---

## File Structure

```
liora-main/
├── components/
│   └── AiWaiter.tsx          ← Main UI component with QR scanner
├── src/
│   ├── context/
│   │   └── DiningContext.tsx ← Session state management
│   └── services/
│       └── ai/
│           └── geminiResto.ts
├── services/
│   ├── aiWaiterService.ts    ← Backend API calls
│   └── geminiService.ts
├── utils/
│   └── qrCodeGenerator.ts    ← QR code utilities
├── server/
│   ├── routes/
│   │   └── aiWaiter.js       ← Backend endpoints
│   ├── store.js              ← In-memory data store
│   └── index.js
├── package.json              ← Updated with jsQR
├── AI_WAITER_DOCS.md         ← Full documentation
└── AI_WAITER_SETUP.md        ← This file
```

---

## API Endpoints

### Connect to Table
```bash
POST /api/ai-waiter/connect
Content-Type: application/json

{
  "tableNumber": "12",
  "restaurantName": "The Italian Place"
}
```

### Chat with AI Waiter
```bash
POST /api/ai-waiter/chat
Content-Type: application/json

{
  "message": "What do you recommend?",
  "history": [],
  "sessionContext": {
    "restaurantName": "The Italian Place",
    "tableNumber": "12"
  }
}
```

### Place an Order
```bash
POST /api/ai-waiter/order
Content-Type: application/json

{
  "sessionId": "uuid",
  "customerName": "John Doe",
  "items": [
    {"name": "Pasta", "qty": 1, "priceCents": 1500}
  ]
}
```

### Request Assistance
```bash
POST /api/ai-waiter/assistance
Content-Type: application/json

{
  "sessionId": "uuid",
  "type": "waiter"
}
```

### Get Session Data
```bash
GET /api/ai-waiter/session/:sessionId
```

---

## Troubleshooting

### Camera Access Issues
- **Problem**: "Unable to access camera"
- **Solution**: 
  - Allow camera permission in browser settings
  - Use HTTPS (not HTTP) for production
  - Check browser security settings

### QR Code Not Detected
- **Problem**: QR scanner doesn't detect code
- **Solution**:
  - Use well-lit environment
  - Ensure QR code is in focus
  - Try manual entry option
  - Generate QR codes from utility

### Backend Connection Failed
- **Problem**: "Failed to connect to kitchen"
- **Solution**:
  - Check if backend is running: `npm run dev:server`
  - Verify backend URL: `localhost:3001`
  - Check CORS settings in `server/index.js`

### Node Version Issues
- **Current**: Node 16.14.2
- **Recommended**: Node 18+
- **Issue**: ES modules support
- **Fix**: Update Node or use Node 16.9+

---

## Testing Checklist

- [ ] QR scanner opens and requests camera access
- [ ] Manual entry works as fallback
- [ ] Table session creates successfully
- [ ] Chat with AI Waiter works
- [ ] "Call Waiter" button triggers assistance request
- [ ] "Request Bill" triggers assistance request
- [ ] Orders can be placed
- [ ] Session data shows orders and assistance requests
- [ ] "Leave Table" ends session properly
- [ ] State persists during conversation

---

## Next Steps

1. **Database Integration**
   - Replace in-memory `store.js` with Supabase/PostgreSQL
   - Persist sessions, orders, and assistance requests

2. **Real-time Updates**
   - Add WebSocket support for live order status
   - Push notifications to staff

3. **Restaurant Dashboard**
   - View active table sessions
   - Manage orders and assistance requests
   - Analytics and insights

4. **Payment Integration**
   - Stripe/PayPal integration
   - Contactless payment

5. **Advanced Features**
   - Image-based menu scanning
   - Voice ordering
   - Multi-language AI support

---

## Support & Debugging

### Enable Debug Logging
Add to browser console:
```javascript
// Enable all console logs
localStorage.setItem('DEBUG_AI_WAITER', 'true');

// View current session
import { useDining } from '/src/context/DiningContext.ts';
console.log(session);
```

### Check Backend Logs
```bash
# Terminal running backend
npm run dev:server
```

Look for messages like:
```
🍽️  Liora API server running on http://localhost:3001
   Health: http://localhost:3001/api/health
```

---

**Happy serving! 🍽️**

