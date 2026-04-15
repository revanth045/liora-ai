# 🚀 START BACKEND SERVER - SIMPLE GUIDE

## 3 Easy Steps to Fix "Backend server is not running"

### Step 1: Open a New Terminal Window
- Right-click on Windows desktop
- Select: **"Open PowerShell window here"** OR **"Open Command Prompt here"**
- OR: Press `Windows + X` → Select **Terminal** or **PowerShell**

### Step 2: Navigate to Project Folder
```bash
cd C:\Users\revanth045\Desktop\leeee\liora-main
```

**OR if you're already in the folder:**
```bash
cd liora-main
```

### Step 3: Start the Backend Server
```bash
npm run dev:server
```

---

## What You Should See

✅ **SUCCESS** - You should see this:
```
> nodemon server/index.js

[nodemon] 3.1.14
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,json

🍽️  Liora API server running on http://localhost:3001
   Health: http://localhost:3001/api/health
```

---

## Now Test It

### Browser Test:
1. Open browser
2. Go to: `http://localhost:3001/api/ai-waiter/health`
3. Should see: `{"status":"AI Waiter service is running"}`

### App Test:
1. Go to app: `http://localhost:5173`
2. Go to **AI Waiter** page
3. Click **"Open Camera Scanner"**
4. Click **"Manual Entry"**
5. Enter: `12` (table) and `The Italian Place` (restaurant)
6. Click **Connect**

✅ Should show welcome message!

---

## IMPORTANT: Keep Terminal Open!

⚠️ **DO NOT CLOSE THIS TERMINAL!**

You must keep this terminal window open while using the app.
The backend server must be running continuously.

---

## You Should Have 2 Terminals

### Terminal 1 (Frontend) - Already Running:
```
npm run dev:client
Local: http://localhost:5173
```

### Terminal 2 (Backend) - Start This Now:
```
npm run dev:server
🍽️ API server on http://localhost:3001
```

---

## If Server Won't Start

### Error: "nodemon: command not found"
```bash
npm install -g nodemon
npm run dev:server
```

### Error: "Port 3001 already in use"
```bash
# Kill the process using port 3001, then try again
# OR use different port (edit server/index.js line 14)
```

### Error: Other
1. Check you're in the right folder: `C:\Users\revanth045\Desktop\leeee\liora-main`
2. Check `package.json` exists in that folder
3. Try: `npm install` (reinstall dependencies)
4. Then: `npm run dev:server`

---

## DONE ✅

Once you see the `🍽️ Liora API server running...` message:
1. Keep this terminal open
2. Go back to your app in browser
3. Try connecting again
4. It should work now!

---

**The backend server MUST be running for the app to work!**

