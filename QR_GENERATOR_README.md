# 🎯 QR Code Generator - Quick Start

## How to Use

### Option 1: Online (Easiest)
1. **Open the generator:**
   - Right-click on `QR_CODE_GENERATOR.html` in your project
   - Select "Open with" → Browser
   - Or drag `QR_CODE_GENERATOR.html` into your browser

2. **Generate QR Code:**
   - Enter restaurant name (default: "The Italian Place")
   - Enter table number (default: "12")
   - Click "Generate QR Code"

3. **Download or Print:**
   - Click "📥 Download" to save as PNG
   - Click "🖨️ Print" to print directly

4. **Use with Scanner:**
   - Scan the generated QR code with your phone camera
   - Your AI Waiter component will detect it
   - You'll connect to the table automatically!

---

## Quick Generate Buttons

Click any of these for instant QR generation:
- Table 1, 2, 3, 4, 5, 6
- Table 12, 15, 20

---

## QR Code Format

The QR code encodes:
```
tableNumber:restaurantName
```

**Example:**
```
12:The_Italian_Place
```

When scanned:
- ✅ Table number extracted: `12`
- ✅ Restaurant name extracted: `The Italian Place`
- ✅ Session created automatically
- ✅ You're ready to order!

---

## Test Different Scenarios

### Test 1: Quick Single Table
1. Click "Table 12" button
2. Download the QR
3. Scan with phone camera
4. Should connect to Table 12 at The Italian Place

### Test 2: Custom Restaurant
1. Enter your restaurant name (e.g., "Sushi Palace")
2. Enter table number (e.g., "5")
3. Click "Generate QR Code"
4. Scan the QR code
5. Should connect to Table 5 at Sushi Palace

### Test 3: Multiple Tables
Generate QR codes for all your tables:
1. Table 1
2. Table 2
3. Table 3
4. ... etc

Then print all and laminate them!

---

## How It Works (Technical)

### Backend Flow:
```
User scans QR code
        ↓
QR decoded to: "12:The_Italian_Place"
        ↓
Extract tableNumber: 12
Extract restaurantName: The_Italian_Place
        ↓
POST /api/ai-waiter/connect
  {
    "tableNumber": "12",
    "restaurantName": "The Italian Place"
  }
        ↓
Backend creates session with sessionId
        ↓
Session stored in DiningContext
        ↓
UI transitions to Live Service Mode
        ↓
Ready to chat, order, request service!
```

---

## Features

✅ **Real-time Generation** - QR codes generated instantly  
✅ **Multiple Sizes** - Small, Medium, Large, Extra Large  
✅ **Download** - Save as PNG image  
✅ **Print** - Print ready for laminating  
✅ **Quick Buttons** - Generate common tables instantly  
✅ **Custom Input** - Any restaurant & table number  
✅ **Format Display** - See the encoded data  
✅ **Mobile Friendly** - Works on phones too  

---

## Typical Setup Flow

1. **Generate QR codes** for all your tables (using this tool)
2. **Print QR codes** on sticker paper
3. **Laminate** them (optional but recommended)
4. **Place one QR code** at each table
5. **Customer scans** when they arrive
6. **AI Waiter** takes over automatically!

---

## Printing Tips

### For Individual Tables:
1. Generate QR for one table
2. Click "🖨️ Print"
3. Print on sticker paper
4. Cut and laminate

### For All Tables (Bulk):
1. Generate multiple QR codes (using quick buttons)
2. Print each one
3. Organize by table number
4. Laminate all at once
5. Place at each table

---

## Troubleshooting

### QR Not Scanning?
- Ensure good lighting
- Hold phone steady
- Clean camera lens
- Try a different phone

### QR Generator Not Working?
- Clear browser cache (Ctrl+Shift+Delete)
- Try different browser
- Check internet connection
- Reload the page

### Wrong Restaurant Name in QR?
- Edit the restaurant name field
- Click "Generate QR Code" again
- Download the corrected QR

---

## Testing with AI Waiter

1. **Generate test QR code:**
   - Use this generator tool
   - Download the QR code

2. **Open your app:**
   - http://localhost:5173
   - Go to AI Waiter page

3. **Click "Open Camera Scanner":**
   - Allow camera access

4. **Scan the QR code:**
   - Point at the QR image on screen
   - Or print and scan from paper

5. **Verify connection:**
   - Should show "Welcome to [Restaurant]"
   - Shows table number
   - Live chat ready

---

## Advanced: Generate Multiple QR Codes at Once

Instead of using the HTML tool, you can also use the utility in code:

```javascript
// In browser console while app is running:
import { generateRestaurantQRCodes, printQRCodes } from './utils/qrCodeGenerator';

// Generate 20 QR codes for your restaurant
const codes = generateRestaurantQRCodes('My Restaurant', 20);

// Print all of them
printQRCodes('My Restaurant', 20);
```

---

## Default Test Values

When you first open the generator, it has defaults:
- **Restaurant:** The Italian Place
- **Table:** 12
- **Size:** Medium (300x300px)

Just click "Generate QR Code" to see it in action!

---

## Next Steps

1. ✅ Open `QR_CODE_GENERATOR.html` in browser
2. ✅ Generate your first QR code
3. ✅ Download it
4. ✅ Test scanning in your app
5. ✅ Generate QR codes for all tables
6. ✅ Print and laminate
7. ✅ Place at restaurant tables
8. ✅ Enjoy! 🍽️

---

**Happy serving!** 🚀

