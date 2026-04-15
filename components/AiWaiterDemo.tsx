/**
 * AI Waiter Demo & Testing Component
 * Use this to test QR codes and AI Waiter features without scanning
 */

import React, { useState } from 'react';
import { useDining } from '../src/context/DiningContext';
import { generateQRImageUrl, generateRestaurantQRCodes } from '../utils/qrCodeGenerator';

export const AiWaiterDemo = () => {
  const { connectTableViaQR } = useDining();
  const [selectedRestaurant, setSelectedRestaurant] = useState('Demo Restaurant');
  const [tableNumber, setTableNumber] = useState('12');
  const [loading, setLoading] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const demoRestaurants = [
    'Demo Restaurant',
    'The Italian Place',
    'Sushi Palace',
    'The French Bistro',
    'Spice Garden'
  ];

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectTableViaQR(tableNumber, selectedRestaurant);
      alert(`✅ Connected to Table ${tableNumber} at ${selectedRestaurant}`);
    } catch (error) {
      alert(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = () => {
    const qrCodes = generateRestaurantQRCodes(selectedRestaurant, 6);
    return qrCodes;
  };

  return (
    <div className="p-8 bg-cream-50 rounded-3xl border border-cream-200 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-lora font-bold text-stone-800">🧪 AI Waiter Demo</h2>

      {/* Quick Connect Section */}
      <div className="bg-white p-6 rounded-2xl border border-cream-200 space-y-4">
        <h3 className="font-bold text-lg text-stone-800">Quick Connect</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2">Select Restaurant</label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full p-3 border border-cream-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-400"
            >
              {demoRestaurants.map(rest => (
                <option key={rest} value={rest}>{rest}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2">Table Number</label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g., 12"
              className="w-full p-3 border border-cream-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 bg-brand-400 text-white rounded-xl font-bold hover:bg-cream-200 disabled:opacity-50 transition-all"
          >
            {loading ? '🔄 Connecting...' : '✅ Connect to Table'}
          </button>
        </div>
      </div>

      {/* QR Code Generator Section */}
      <div className="bg-white p-6 rounded-2xl border border-cream-200 space-y-4">
        <h3 className="font-bold text-lg text-stone-800">📱 Generate QR Codes</h3>

        <button
          onClick={() => setShowQRGenerator(!showQRGenerator)}
          className="w-full py-3 bg-cream-100 text-stone-800 rounded-xl font-bold border border-cream-200 hover:bg-cream-200 transition-all"
        >
          {showQRGenerator ? '❌ Hide QR Codes' : '📲 Show QR Codes'}
        </button>

        {showQRGenerator && (
          <div className="grid grid-cols-2 gap-4">
            {generateQRCodes().map((table) => (
              <div
                key={table.tableNumber}
                className="p-4 bg-cream-50 rounded-xl text-center cursor-pointer hover:bg-brand-100 transition-colors"
                onClick={() => {
                  setTableNumber(String(table.tableNumber));
                  handleConnect();
                }}
              >
                <img
                  src={table.qrImageUrl}
                  alt={`Table ${table.tableNumber}`}
                  className="w-full rounded-lg mb-2"
                />
                <p className="font-bold text-stone-800">Table {table.tableNumber}</p>
                <p className="text-xs text-stone-400">Click to connect</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Testing Section */}
      <div className="bg-white p-6 rounded-2xl border border-cream-200 space-y-4">
        <h3 className="font-bold text-lg text-stone-800">🔧 API Testing</h3>

        <div className="space-y-2 text-xs font-mono bg-stone-900 text-green-400 p-4 rounded-xl overflow-auto max-h-40">
          <p># Test Connect Endpoint</p>
          <p className="text-blue-400">curl -X POST http://localhost:3001/api/ai-waiter/connect \</p>
          <p className="text-blue-400">  -H "Content-Type: application/json" \</p>
          <p className="text-blue-400">  -d '{`{"tableNumber": "${tableNumber}", "restaurantName": "${selectedRestaurant}"}`}'</p>
          <p className="mt-3"># Response will include: sessionId, tableNumber, restaurantName</p>
        </div>

        <div className="space-y-2 text-xs font-mono bg-stone-900 text-green-400 p-4 rounded-xl overflow-auto max-h-40">
          <p># Test Assistance Endpoint</p>
          <p className="text-blue-400">curl -X POST http://localhost:3001/api/ai-waiter/assistance \</p>
          <p className="text-blue-400">  -H "Content-Type: application/json" \</p>
          <p className="text-blue-400">  -d '{`{"sessionId": "YOUR_SESSION_ID", "type": "waiter"}`}'</p>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-3">
        <h3 className="font-bold text-lg text-blue-900">📚 Documentation</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>📖 <strong>Full Docs:</strong> AI_WAITER_DOCS.md</li>
          <li>🚀 <strong>Setup Guide:</strong> AI_WAITER_SETUP.md</li>
          <li>💾 <strong>Backend Routes:</strong> server/routes/aiWaiter.js</li>
          <li>🎨 <strong>Component:</strong> components/AiWaiter.tsx</li>
          <li>🔌 <strong>Service:</strong> services/aiWaiterService.ts</li>
        </ul>
      </div>

      {/* Feature Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-cream-200 space-y-3">
        <h3 className="font-bold text-lg text-stone-800">✨ Features Ready</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>QR Code Scanning (camera-based)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>Manual Table Entry (fallback)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>AI Chat with Waiter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>Table Session Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>Assistance Requests (waiter, bill, etc.)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>Order Placement API</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>Session Data Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiWaiterDemo;

