import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listTables,
  type DemoTable, type DemoRestaurant,
} from '../../../demoDb';

// ── QR code generation via Google Charts API ──────────────────────────
function qrUrl(data: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=8&format=png`;
}

// ── Helpers ───────────────────────────────────────────────────────────
function buildQRData(restaurantName: string, tableNumber: number | string): string {
  // Format: "tableNumber:restaurantName" — spaces become underscores
  return `${tableNumber}:${restaurantName.replace(/ /g, '_')}`;
}

export default function RestoQRCodes({ restaurant }: { restaurant: DemoRestaurant }) {
  const [tables, setTables] = useState<DemoTable[]>([]);
  const [manualTable, setManualTable] = useState('');
  const [manualLabel, setManualLabel] = useState('');
  const [generatedQRs, setGeneratedQRs] = useState<{ tableNumber: string; label?: string; qrData: string }[]>([]);
  const [selectedQR, setSelectedQR] = useState<{ tableNumber: string; label?: string; qrData: string } | null>(null);
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTables(db_listTables(restaurant.id));
  }, [restaurant.id]);

  // Generate QRs from existing tables
  const generateFromTables = () => {
    const qrs = tables.map(t => ({
      tableNumber: String(t.number),
      label: t.label,
      qrData: buildQRData(restaurant.name, t.number),
    }));
    setGeneratedQRs(qrs);
  };

  // Generate from manual input
  const generateManual = () => {
    const num = manualTable.trim();
    if (!num) return;
    const existing = generatedQRs.find(q => q.tableNumber === num);
    if (existing) return;
    setGeneratedQRs(prev => [...prev, {
      tableNumber: num,
      label: manualLabel.trim() || undefined,
      qrData: buildQRData(restaurant.name, num),
    }]);
    setManualTable('');
    setManualLabel('');
  };

  // Bulk generate
  const generateBulk = () => {
    const from = parseInt(bulkFrom, 10);
    const to = parseInt(bulkTo, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from || to - from > 100) return;
    const newQrs: typeof generatedQRs = [];
    for (let i = from; i <= to; i++) {
      if (!generatedQRs.find(q => q.tableNumber === String(i))) {
        newQrs.push({
          tableNumber: String(i),
          qrData: buildQRData(restaurant.name, i),
        });
      }
    }
    setGeneratedQRs(prev => [...prev, ...newQrs]);
    setBulkFrom('');
    setBulkTo('');
  };

  // Download single QR — uses a hidden canvas to avoid CORS issues
  const downloadQR = (qr: typeof generatedQRs[0]) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { window.open(qrUrl(qr.qrData, 600), '_blank'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${restaurant.name.replace(/ /g, '_')}_Table_${qr.tableNumber}_QR.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = () => {
      // Fallback: open in new tab so user can right-click → Save As
      window.open(qrUrl(qr.qrData, 600), '_blank');
    };
    img.src = qrUrl(qr.qrData, 600);
  };

  // Download all QRs sequentially
  const downloadAll = () => {
    generatedQRs.forEach((qr, idx) => {
      setTimeout(() => downloadQR(qr), idx * 400);
    });
  };

  // Print all QRs
  const printAll = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${restaurant.name} — Table QR Codes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .card { text-align: center; border: 2px solid #e5e7eb; border-radius: 16px; padding: 24px 16px; page-break-inside: avoid; }
          .card img { width: 180px; height: 180px; margin: 0 auto 12px; }
          .card h3 { font-size: 28px; font-weight: 800; color: #1c1917; }
          .card p { font-size: 13px; color: #78716c; margin-top: 4px; }
          .card .restaurant { font-size: 11px; color: #a8a29e; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
          @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
        </style>
      </head>
      <body>
        <div class="grid">
          ${generatedQRs.map(qr => `
            <div class="card">
              <img src="${qrUrl(qr.qrData, 360)}" alt="Table ${qr.tableNumber} QR" />
              <h3>Table ${qr.tableNumber}</h3>
              ${qr.label ? `<p>${qr.label}</p>` : ''}
              <p class="restaurant">${restaurant.name}</p>
              <p style="font-size:11px;color:#a8a29e;margin-top:6px;">Scan to order</p>
            </div>
          `).join('')}
        </div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearAll = () => {
    setGeneratedQRs([]);
    setSelectedQR(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Header */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-100 text-brand-600">
            <Icon name="qr_code_2" size={28} />
          </div>
          <div>
            <h2 className="font-lora text-2xl font-bold text-stone-800">QR Code Generator</h2>
            <p className="text-xs text-stone-400 mt-0.5 font-medium">
              Generate scannable QR codes for each table. Customers scan → connect to your restaurant → place orders instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Generation Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Method 1: From existing tables */}
        <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <Icon name="table_restaurant" size={18} />
            </div>
            <h3 className="font-bold text-stone-800 text-sm">From Existing Tables</h3>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Auto-generate QR codes for all {tables.length} table{tables.length !== 1 ? 's' : ''} you've already configured.
          </p>
          <button
            onClick={generateFromTables}
            disabled={tables.length === 0}
            className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {tables.length === 0 ? 'No Tables Configured' : `Generate ${tables.length} QR Codes`}
          </button>
        </div>

        {/* Method 2: Manual */}
        <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Icon name="edit" size={18} />
            </div>
            <h3 className="font-bold text-stone-800 text-sm">Single Table</h3>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={manualTable}
              onChange={e => setManualTable(e.target.value)}
              placeholder="Table number (e.g. 5)"
              className="w-full px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
            <input
              type="text"
              value={manualLabel}
              onChange={e => setManualLabel(e.target.value)}
              placeholder="Label (optional, e.g. Patio)"
              className="w-full px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
          </div>
          <button
            onClick={generateManual}
            disabled={!manualTable.trim()}
            className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate QR
          </button>
        </div>

        {/* Method 3: Bulk */}
        <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Icon name="grid_view" size={18} />
            </div>
            <h3 className="font-bold text-stone-800 text-sm">Bulk Generate</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={bulkFrom}
              onChange={e => setBulkFrom(e.target.value)}
              placeholder="From"
              className="flex-1 px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
            <span className="self-center text-stone-300 font-bold">→</span>
            <input
              type="number"
              min={1}
              value={bulkTo}
              onChange={e => setBulkTo(e.target.value)}
              placeholder="To"
              className="flex-1 px-3 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
          </div>
          <button
            onClick={generateBulk}
            disabled={!bulkFrom || !bulkTo}
            className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate Range
          </button>
        </div>
      </div>

      {/* Generated QR Codes */}
      {generatedQRs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-lora text-xl font-bold text-stone-800">Generated QR Codes</h3>
              <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                {generatedQRs.length} total
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold hover:bg-stone-900 transition-all"
              >
                <Icon name="download" size={14} /> Download All
              </button>
              <button
                onClick={printAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-all"
              >
                <Icon name="print" size={14} /> Print All
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-stone-500 text-xs font-bold hover:bg-stone-50 transition-all"
              >
                <Icon name="delete" size={14} /> Clear
              </button>
            </div>
          </div>

          <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {generatedQRs.map(qr => (
              <div
                key={qr.tableNumber}
                onClick={() => setSelectedQR(qr)}
                className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4 text-center hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer group"
              >
                <img
                  src={qrUrl(qr.qrData, 200)}
                  alt={`Table ${qr.tableNumber} QR`}
                  className="w-full max-w-[160px] mx-auto rounded-xl mb-3 group-hover:scale-105 transition-transform"
                />
                <h4 className="text-lg font-bold text-stone-800">Table {qr.tableNumber}</h4>
                {qr.label && (
                  <p className="text-xs text-stone-400 mt-0.5">{qr.label}</p>
                )}
                <p className="text-[9px] text-stone-300 mt-1 uppercase tracking-widest font-bold">{restaurant.name}</p>
                <div className="mt-3 flex gap-2 justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadQR(qr); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold hover:bg-stone-900 transition-all shadow-sm"
                  >
                    <Icon name="download" size={13} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {generatedQRs.length === 0 && (
        <div className="bg-white border-2 border-dashed border-cream-200 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 mx-auto bg-cream-50 rounded-[1.5rem] flex items-center justify-center mb-4 border border-cream-200">
            <Icon name="qr_code_2" size={36} className="text-stone-300" />
          </div>
          <h3 className="font-bold text-stone-600 text-lg mb-1">No QR codes generated yet</h3>
          <p className="text-stone-400 text-sm max-w-md mx-auto">
            Use one of the methods above to generate QR codes for your tables. Customers scan these to connect to your restaurant and place orders.
          </p>
        </div>
      )}

      {/* QR Detail Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center space-y-5">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-xl font-lora font-bold text-stone-800">Table {selectedQR.tableNumber}</h3>
                  {selectedQR.label && <p className="text-xs text-stone-400 font-medium">{selectedQR.label}</p>}
                </div>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
                >
                  <Icon name="close" size={22} />
                </button>
              </div>

              <div className="bg-cream-50 rounded-2xl p-6 border border-cream-200">
                <img
                  src={qrUrl(selectedQR.qrData, 400)}
                  alt={`Table ${selectedQR.tableNumber} QR`}
                  className="w-full max-w-[250px] mx-auto rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-800">{restaurant.name}</p>
                <p className="text-xs text-stone-400">Scan this QR code to connect to Table {selectedQR.tableNumber} and start ordering</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">QR Data</p>
                <p className="text-xs font-mono text-stone-600 break-all">{selectedQR.qrData}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadQR(selectedQR)}
                  className="flex-1 py-3.5 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="download" size={16} /> Download PNG
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html><html><head><title>Table ${selectedQR.tableNumber} QR</title>
                      <style>
                        body { font-family: system-ui; text-align: center; padding: 40px; }
                        img { width: 300px; height: 300px; }
                        h1 { font-size: 36px; margin: 16px 0 4px; }
                        p { color: #78716c; font-size: 14px; }
                        .restaurant { font-size: 12px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; }
                      </style>
                      </head><body>
                        <img src="${qrUrl(selectedQR.qrData, 600)}" />
                        <h1>Table ${selectedQR.tableNumber}</h1>
                        ${selectedQR.label ? `<p>${selectedQR.label}</p>` : ''}
                        <p class="restaurant">${restaurant.name}</p>
                        <p style="margin-top:8px">Scan to order</p>
                        <script>window.onload = () => { window.print(); window.close(); }<\/script>
                      </body></html>
                    `);
                    printWindow.document.close();
                  }}
                  className="py-3.5 px-4 rounded-xl border border-cream-200 text-stone-600 text-sm font-bold hover:bg-cream-50 transition-all"
                >
                  <Icon name="print" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
