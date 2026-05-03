import React, { useState, useEffect } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listTables,
  db_addTable,
  db_updateTable,
  db_deleteTable,
  DemoTable,
  DemoRestaurant,
} from '../../../demoDb';

// ── QR helpers ────────────────────────────────────────────────────────
function qrUrl(data: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=8&format=png`;
}
function buildQRData(restaurantName: string, tableNumber: number | string): string {
  return `${tableNumber}:${restaurantName.replace(/ /g, '_')}`;
}
function downloadQRImage(restaurantName: string, tableNumber: string, qrData: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { window.open(qrUrl(qrData, 600), '_blank'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restaurantName.replace(/ /g, '_')}_Table_${tableNumber}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => window.open(qrUrl(qrData, 600), '_blank');
  img.src = qrUrl(qrData, 600);
}

interface TablesProps {
  restaurant: DemoRestaurant;
}

interface TableFormState {
  number: string;
  label: string;
  seats: string;
}

const EMPTY_FORM: TableFormState = { number: '', label: '', seats: '' };

export default function RestoTables({ restaurant }: TablesProps) {
  const [tables, setTables] = useState<DemoTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DemoTable | null>(null);
  const [form, setForm] = useState<TableFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<{ tableNumber: string; label?: string; qrData: string } | null>(null);

  const reload = () => setTables(db_listTables(restaurant.id));

  useEffect(() => { reload(); }, [restaurant.id]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (t: DemoTable) => {
    setEditing(t);
    setForm({ number: String(t.number), label: t.label ?? '', seats: t.seats ? String(t.seats) : '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    const num = parseInt(form.number, 10);
    if (!form.number.trim() || isNaN(num) || num < 1) {
      setFormError('Table number must be a positive integer.');
      return;
    }
    // Check for duplicate numbers (excluding self)
    const duplicate = tables.find(t => t.number === num && (!editing || t.id !== editing.id));
    if (duplicate) {
      setFormError(`Table ${num} already exists.`);
      return;
    }
    const seats = form.seats.trim() ? parseInt(form.seats, 10) : undefined;
    if (form.seats.trim() && (isNaN(seats!) || seats! < 1)) {
      setFormError('Seats must be a positive number.');
      return;
    }

    if (editing) {
      db_updateTable({ ...editing, number: num, label: form.label.trim() || undefined, seats });
    } else {
      db_addTable({ restaurantId: restaurant.id, number: num, label: form.label.trim() || undefined, seats });
    }
    reload();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    db_deleteTable(id);
    reload();
    setDeleteConfirm(null);
  };

  const sorted = [...tables].sort((a, b) => a.number - b.number);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900 dark:text-white">
            Table Management
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your dining room. Customers enter their table number when placing orders.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all shadow-sm whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Table
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">🟡</span>
        <div className="text-sm text-amber-800">
          <p className="font-semibold">How table ordering works</p>
          <p className="mt-0.5 text-amber-700">
            Share each table's number with your customers so they can enter it when placing an order via the Liora diner app. The table number appears in every order in your dashboard and on the Service Desk.
          </p>
        </div>
      </div>

      {/* Table grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-cream-200 rounded-2xl">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-stone-600 font-semibold">No tables yet</p>
          <p className="text-stone-400 text-sm mt-1 mb-4">Add your first table to get started.</p>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all"
          >
            Add Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map(t => (
            <div
              key={t.id}
              className="relative bg-white border border-cream-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Table number — large, prominent */}
              <div className="text-center mb-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-800 flex items-center justify-center shadow">
                  <span className="text-2xl font-bold text-white">{t.number}</span>
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1.5">
                  Table
                </p>
              </div>

              {/* Meta */}
              <div className="text-center space-y-0.5">
                {t.label && (
                  <p className="text-xs font-semibold text-stone-700 truncate">{t.label}</p>
                )}
                {t.seats && (
                  <p className="text-[10px] text-stone-400">🪑 {t.seats} seats</p>
                )}
              </div>

              {/* Action buttons — visible on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setQrPreview({ tableNumber: String(t.number), label: t.label, qrData: buildQRData(restaurant.name, t.number) })}
                  className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors"
                  title="Generate QR"
                >
                  <Icon name="qr_code_2" size={14} className="text-brand-600" />
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(t.id)}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -- Add / Edit Modal -- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-display text-xl font-semibold text-stone-800 mb-1">
              {editing ? 'Edit Table' : 'Add Table'}
            </h2>
            <p className="text-xs text-stone-400 mb-5">
              {editing ? `Currently Table ${editing.number}` : 'Configure a new dining table.'}
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Table Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.number}
                  onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                  placeholder="e.g. 1"
                  className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 text-xl font-bold text-center focus:outline-none focus:border-brand-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Label <span className="text-stone-300 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Window Seat, Patio"
                  className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Seats <span className="text-stone-300 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.seats}
                  onChange={e => setForm(f => ({ ...f, seats: e.target.value }))}
                  placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all"
              >
                {editing ? 'Save Changes' : 'Add Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Delete Confirm Modal -- */}
      {deleteConfirm && (() => {
        const t = tables.find(x => x.id === deleteConfirm);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
              <p className="text-3xl mb-3">🍝️</p>
              <h2 className="font-display text-xl font-semibold text-stone-800 mb-2">Delete Table {t?.number}?</h2>
              <p className="text-stone-500 text-sm mb-6">This cannot be undone. Existing orders with this table number are not affected.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── QR Code Generator Section ─────────────────────────── */}
      {sorted.length > 0 && (
        <div className="mt-10 border-t border-cream-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-100 text-brand-600">
                <Icon name="qr_code_2" size={22} />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-stone-900">QR Codes</h2>
                <p className="text-xs text-stone-400 mt-0.5">Generate & download QR codes for your tables. Customers scan → place orders instantly.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  sorted.forEach((t, idx) => {
                    setTimeout(() => downloadQRImage(restaurant.name, String(t.number), buildQRData(restaurant.name, t.number)), idx * 400);
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold hover:bg-stone-900 transition-all"
              >
                <Icon name="download" size={14} /> Download All
              </button>
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  printWindow.document.write(`<!DOCTYPE html><html><head><title>${restaurant.name} — Table QR Codes</title>
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
                    </style></head><body><div class="grid">
                    ${sorted.map(t => {
                      const d = buildQRData(restaurant.name, t.number);
                      return `<div class="card"><img src="${qrUrl(d, 360)}" /><h3>Table ${t.number}</h3>${t.label ? `<p>${t.label}</p>` : ''}<p class="restaurant">${restaurant.name}</p><p style="font-size:11px;color:#a8a29e;margin-top:6px;">Scan to order</p></div>`;
                    }).join('')}
                    </div><script>window.onload = () => { window.print(); window.close(); }<\/script></body></html>`);
                  printWindow.document.close();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-all"
              >
                <Icon name="print" size={14} /> Print All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sorted.map(t => {
              const data = buildQRData(restaurant.name, t.number);
              return (
                <div
                  key={`qr-${t.id}`}
                  onClick={() => setQrPreview({ tableNumber: String(t.number), label: t.label, qrData: data })}
                  className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4 text-center hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer group"
                >
                  <img
                    src={qrUrl(data, 200)}
                    alt={`Table ${t.number} QR`}
                    className="w-full max-w-[140px] mx-auto rounded-xl mb-2 group-hover:scale-105 transition-transform"
                  />
                  <h4 className="text-base font-bold text-stone-800">Table {t.number}</h4>
                  {t.label && <p className="text-[10px] text-stone-400">{t.label}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadQRImage(restaurant.name, String(t.number), data); }}
                    className="mt-2 flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg bg-stone-800 text-white text-[10px] font-bold hover:bg-stone-900 transition-all"
                  >
                    <Icon name="download" size={12} /> Download
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QR Preview Modal ──────────────────────────────────── */}
      {qrPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-7 text-center space-y-5">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-xl font-display font-bold text-stone-800">Table {qrPreview.tableNumber}</h3>
                  {qrPreview.label && <p className="text-xs text-stone-400 font-medium">{qrPreview.label}</p>}
                </div>
                <button onClick={() => setQrPreview(null)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                  <Icon name="close" size={22} />
                </button>
              </div>
              <div className="bg-cream-50 rounded-2xl p-5 border border-cream-200">
                <img src={qrUrl(qrPreview.qrData, 400)} alt={`Table ${qrPreview.tableNumber} QR`} className="w-full max-w-[220px] mx-auto rounded-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">{restaurant.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">Scan to connect & order</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">QR Data</p>
                <p className="text-xs font-mono text-stone-600 break-all">{qrPreview.qrData}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadQRImage(restaurant.name, qrPreview.tableNumber, qrPreview.qrData)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 text-white text-sm font-bold hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="download" size={16} /> Download PNG
                </button>
                <button
                  onClick={() => {
                    const pw = window.open('', '_blank');
                    if (!pw) return;
                    pw.document.write(`<!DOCTYPE html><html><head><title>Table ${qrPreview.tableNumber} QR</title><style>body{font-family:system-ui;text-align:center;padding:40px}img{width:300px;height:300px}h1{font-size:36px;margin:16px 0 4px}p{color:#78716c;font-size:14px}.r{font-size:12px;color:#a8a29e;text-transform:uppercase;letter-spacing:1px;margin-top:12px}</style></head><body><img src="${qrUrl(qrPreview.qrData, 600)}"/><h1>Table ${qrPreview.tableNumber}</h1>${qrPreview.label ? `<p>${qrPreview.label}</p>` : ''}<p class="r">${restaurant.name}</p><p style="margin-top:8px">Scan to order</p><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
                    pw.document.close();
                  }}
                  className="py-3 px-4 rounded-xl border border-cream-200 text-stone-600 text-sm font-bold hover:bg-cream-50 transition-all"
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
