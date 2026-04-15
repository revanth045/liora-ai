# 🔧 Fixing "Failed to Connect" Error

## The Problem

When scanning QR or using manual entry, you see:
```
❌ Failed to connect: Failed to fetch
```

This means the **frontend cannot reach the backend API**.

---

## Solution: Verify Backend is Running

### Step 1: Check if Backend is Running

Open a **NEW Terminal** and run:

```bash
npm run dev:server
```

You should see:
```
🍽️  Liora API server running on http://localhost:3001
   Health: http://localhost:3001/api/health
```

**If you don't see this, the backend is NOT running!**

### Step 2: Verify Backend is Healthy

In your browser, open:
```
http://localhost:3001/api/ai-waiter/health
```

You should see:
```json
{ "status": "AI Waiter service is running" }
```

**If this returns an error or times out, backend is not responding.**

### Step 3: Check Both Are Running

You should have **TWO** terminals:

**Terminal 1 (Frontend):**
```bash
npm run dev:client
```
Shows: `Local: http://localhost:5173`

**Terminal 2 (Backend):**
```bash
npm run dev:server
```
Shows: `http://localhost:3001`

**Both must be running!**

---

## Quick Fix Checklist

- [ ] **Backend Running?** Check Terminal 2 is running `npm run dev:server`
- [ ] **Port 3001 Free?** If not, close other apps using port 3001
- [ ] **No Firewall?** Check if firewall is blocking localhost:3001
- [ ] **Correct URL?** Frontend should call `http://localhost:3001` (not 3000)
- [ ] **No CORS Issues?** CORS is configured for localhost
- [ ] **API Endpoint?** Should be `/api/ai-waiter/connect`

---

## The "Correct" Setup

### Terminal 1: Frontend
```bash
cd liora-main
npm run dev:client
```

### Terminal 2: Backend  
```bash
cd liora-main
npm run dev:server
```

### Result:
- Frontend: http://localhost:5173 ✅
- Backend: http://localhost:3001 ✅
- API Calls: http://localhost:3001/api/ai-waiter/* ✅

---

## Debugging with Browser Console

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Try connecting to table**
4. **Look for logs:**

```
✅ Good:
🔄 Connecting to table...
📡 API URL: http://localhost:3001/api/ai-waiter/connect
📊 Response status: 200
✅ Connection successful: {...}

❌ Bad:
🔄 Connecting to table...
📡 API URL: http://localhost:3001/api/ai-waiter/connect
❌ Connection failed: Failed to fetch
```

---

## Common Causes & Fixes

### Cause 1: Backend Not Running
```bash
❌ Error: Failed to fetch
```
**Fix:** Run `npm run dev:server` in a separate terminal

### Cause 2: Port Already in Use
```bash
❌ EADDRINUSE: address already in use :::3001
```
**Fix:** Kill process on port 3001 or use different port

### Cause 3: Wrong API URL
**Fix:** Should be `http://localhost:3001` (not 3000 or other)

### Cause 4: CORS Error (in console)
```bash
❌ Access to XMLHttpRequest blocked by CORS
```
**Fix:** CORS is already configured, restart backend with `npm run dev:server`

### Cause 5: Network Error
```bash
❌ Failed to connect to restaurant
```
**Fix:** Check internet connection, firewall, or restart both servers

---

## Full Restart Guide

If nothing works:

### Step 1: Stop Everything
- Close all terminals (Ctrl+C)
- Wait 5 seconds

### Step 2: Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Clear node_modules (optional, takes time)
rm -r node_modules
npm install
```

### Step 3: Restart Fresh
**Terminal 1 (Frontend):**
```bash
npm run dev:client
```

**Terminal 2 (Backend):**
```bash
npm run dev:server
```

### Step 4: Hard Refresh Browser
- Open http://localhost:5173
- Press Ctrl+Shift+R (hard refresh)
- Go to AI Waiter page

### Step 5: Test Connection
1. Click "Open Camera Scanner"
2. Click "Manual Entry"
3. Enter table: `12`
4. Enter restaurant: `The Italian Place`
5. Click Connect

Should work now! ✅

---

## Verify With cURL

Test backend directly with:

```bash
curl http://localhost:3001/api/ai-waiter/health
```

Should return:
```json
{ "status": "AI Waiter service is running" }
```

---

## Still Not Working?

**Check these files:**
1. `server/index.js` - Router mounted?
   - Look for: `app.use('/api/ai-waiter', aiWaiterRouter);`

2. `server/routes/aiWaiter.js` - Endpoints defined?
   - Look for: `router.post('/connect', ...)`

3. `services/aiWaiterService.ts` - API_BASE correct?
   - Should be: `const API_BASE = 'http://localhost:3001/api/ai-waiter';`

4. `src/context/DiningContext.tsx` - Import correct?
   - Check for: `import { connectToTable, ... } from '../../services/aiWaiterService';`

---

## Fast Troubleshooting Flow

```
1. Error: "Failed to fetch"
   ↓
2. Check: Is backend running?
   - Terminal shows "🍽️ Liora API server running"?
   - NO → Run: npm run dev:server
   ↓
3. Check: Can frontend reach backend?
   - Open: http://localhost:3001/api/ai-waiter/health
   - Shows JSON? YES → Go to step 4
   - NO → Backend issue, restart it
   ↓
4. Check: Browser console errors?
   - F12 → Console tab
   - See "❌ Connection failed"?
   - Check the error message for details
   ↓
5. Try manual entry:
   - Open Camera Scanner
   - Click "Manual Entry"
   - Enter table & restaurant
   - Click Connect
   ↓
6. If manual entry fails:
   - Backend is not responding correctly
   - Check server/routes/aiWaiter.js
   - Restart backend: npm run dev:server
```

---

## Success Indicators

When it works, you should see:

**In Browser Console:**
```
✅ Backend is healthy
🔄 Connecting to table...
📡 API URL: http://localhost:3001/api/ai-waiter/connect
📊 Response status: 200
✅ Connection successful: { sessionId: "...", ... }
```

**In App UI:**
```
Welcome to The Italian Place!
Table: 12
Status: Live ✓
[Chat interface ready]
```

---

**Most Common Fix: Backend not running!**

Make sure you have **TWO separate terminals**:
1. `npm run dev:client` (frontend)
2. `npm run dev:server` (backend)

Both must be running! 🚀

