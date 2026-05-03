import React, { useState, useEffect, useMemo } from 'react';
import {
  db_listTables,
  db_addTable,
  db_updateTable,
  db_deleteTable,
  DemoTable,
  DemoRestaurant,
} from '../../../demoDb';
import {
  buildRestaurantUrl,
  buildTableUrl,
  qrImageFor,
  downloadQRCode,
  printQRSheet,
} from '../../../../utils/qrCodeGenerator';

interface TablesProps { restaurant: DemoRestaurant; }

interface TableFormState { number: string; label: string; seats: string; }
const EMPTY_FORM: TableFormState = { number: '', label: '', seats: '' };

interface BulkFormState { from: string; to: string; seats: string; prefix: string; }
const EMPTY_BULK: BulkFormState = { from: '1', to: '10', seats: '', prefix: '' };

export default function RestoTables({ restaurant }: TablesProps) {
  const [tables, setTables] = useState<DemoTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showQR, setShowQR] = useState<{ kind: 'venue' } | { kind: 'table'; table: DemoTable } | null>(null);
  const [editing, setEditing] = useState<DemoTable | null>(null);
  const [form, setForm] = useState<TableFormState>(EMPTY_FORM);
  const [bulk, setBulk] = useState<BulkFormState>(EMPTY_BULK);
  const [formError, setFormError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => setTables(db_listTables(restaurant.id));
  useEffect(() => { reload(); }, [restaurant.id]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const venueUrl = useMemo(() => buildRestaurantUrl(restaurant.id), [restaurant.id]);

  // -------- single add / edit ----------
  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const openEdit = (t: DemoTable) => {
    setEditing(t);
    setForm({ number: String(t.number), label: t.label ?? '', seats: t.seats ? String(t.seats) : '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    const num = parseInt(form.number, 10);
    if (!form.number.trim() || isNaN(num) || num < 1) { setFormError('Table number must be a positive integer.'); return; }
    const duplicate = tables.find(t => t.number === num && (!editing || t.id !== editing.id));
    if (duplicate) { setFormError(`Table ${num} already exists.`); return; }
    const seats = form.seats.trim() ? parseInt(form.seats, 10) : undefined;
    if (form.seats.trim() && (isNaN(seats!) || seats! < 1)) { setFormError('Seats must be a positive number.'); return; }
    if (editing) {
      db_updateTable({ ...editing, number: num, label: form.label.trim() || undefined, seats });
    } else {
      db_addTable({ restaurantId: restaurant.id, number: num, label: form.label.trim() || undefined, seats });
    }
    reload();
    setShowModal(false);
    flash(editing ? 'Table updated' : `Table ${num} added · QR ready`);
  };

  // -------- bulk add ----------
  const handleBulkSave = () => {
    const from = parseInt(bulk.from, 10);
    const to = parseInt(bulk.to, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
      setBulkError('Enter a valid range (e.g. 1 to 20).'); return;
    }
    if (to - from + 1 > 200) { setBulkError('Limit a single batch to 200 tables.'); return; }
    const seats = bulk.seats.trim() ? parseInt(bulk.seats, 10) : undefined;
    if (bulk.seats.trim() && (isNaN(seats!) || seats! < 1)) { setBulkError('Seats must be a positive number.'); return; }
    const existing = new Set(tables.map(t => t.number));
    let added = 0; let skipped = 0;
    for (let n = from; n <= to; n++) {
      if (existing.has(n)) { skipped++; continue; }
      db_addTable({
        restaurantId: restaurant.id,
        number: n,
        label: bulk.prefix.trim() ? `${bulk.prefix.trim()} ${n}` : undefined,
        seats,
      });
      added++;
    }
    reload();
    setShowBulk(false);
    setBulk(EMPTY_BULK);
    setBulkError('');
    flash(`Created ${added} table${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped (already existed)` : ''}`);
  };

  // -------- delete ----------
  const handleDelete = (id: string) => {
    db_deleteTable(id);
    reload();
    setDeleteConfirm(null);
    flash('Table removed');
  };

  // -------- copy / share ----------
  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); flash(`${label} copied`); } catch { flash('Copy failed'); }
  };

  const sorted = [...tables].sort((a, b) => a.number - b.number);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Tables &amp; QR Codes</h1>
          <p className="text-sm text-stone-700 font-medium mt-1">
            Each restaurant has a unique menu QR. Each table gets its own QR that auto-identifies the table when scanned.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => printQRSheet({ restaurantId: restaurant.id, restaurantName: restaurant.name, tables: sorted })}
            disabled={sorted.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-sm font-bold hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Print venue + all table QR codes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print all
          </button>
          <button
            onClick={() => { setBulk(EMPTY_BULK); setBulkError(''); setShowBulk(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-sm font-bold hover:bg-stone-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            Bulk add
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Table
          </button>
        </div>
      </div>

      {/* Venue (restaurant-level) QR */}
      <div className="mb-6 p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center gap-5">
        <div className="flex-shrink-0">
          <img
            src={qrImageFor(venueUrl, 220)}
            alt={`${restaurant.name} menu QR`}
            className="w-28 h-28 rounded-xl border border-stone-200 bg-white p-1.5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Venue menu QR</p>
          <p className="font-display text-lg font-bold text-stone-900 truncate">{restaurant.name}</p>
          <p className="text-xs text-stone-700 font-medium mt-0.5">Anyone scanning this lands on your menu &amp; details — perfect for posters, business cards, and the front door.</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <code className="text-[11px] bg-stone-100 px-2 py-1 rounded text-stone-700 font-mono truncate max-w-[280px]" title={venueUrl}>{venueUrl}</code>
            <button
              onClick={() => copy(venueUrl, 'Menu link')}
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
            >Copy link</button>
            <button
              onClick={() => downloadQRCode(venueUrl, `${restaurant.name.replace(/\s+/g, '_')}-menu-qr`)}
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
            >Download PNG</button>
            <button
              onClick={() => setShowQR({ kind: 'venue' })}
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black text-white"
            >View large</button>
          </div>
        </div>
      </div>

      {/* Table grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-stone-800 font-bold">No tables yet</p>
          <p className="text-stone-700 text-sm mt-1 mb-4 font-medium">Add a single table or bulk-create a range to generate QR codes.</p>
          <div className="flex justify-center gap-2">
            <button onClick={openAdd} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all">Add Table</button>
            <button onClick={() => setShowBulk(true)} className="px-5 py-2.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-sm font-bold hover:bg-stone-200 transition-all">Bulk add</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map(t => {
            const url = buildTableUrl(restaurant.id, t.number);
            return (
              <div key={t.id} className="relative bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center shadow flex-shrink-0">
                    <span className="text-lg font-bold text-white">{t.number}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Table {t.number}</p>
                    {t.label && <p className="text-sm font-bold text-stone-800 truncate">{t.label}</p>}
                    {t.seats && <p className="text-[11px] text-stone-700 font-semibold">🪑 {t.seats} seats</p>}
                  </div>
                </div>

                <button
                  onClick={() => setShowQR({ kind: 'table', table: t })}
                  className="mt-3 w-full aspect-square bg-white rounded-xl border border-stone-200 p-2 hover:border-stone-400 transition-colors"
                  title="View large QR"
                >
                  <img src={qrImageFor(url, 320)} alt={`Table ${t.number} QR`} className="w-full h-full object-contain" />
                </button>

                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => downloadQRCode(url, `${restaurant.name.replace(/\s+/g, '_')}-table-${t.number}`)}
                    className="flex-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
                  >Download</button>
                  <button
                    onClick={() => copy(url, `Table ${t.number} link`)}
                    className="flex-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
                  >Copy link</button>
                  <button
                    onClick={() => printQRSheet({ restaurantId: restaurant.id, restaurantName: restaurant.name, tables: [t] })}
                    className="flex-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white"
                  >Print</button>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center" title="Edit" aria-label="Edit table">
                    <svg className="w-4 h-4 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(t.id)} className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center" title="Delete" aria-label="Delete table">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-stone-900 text-white text-sm font-bold px-5 py-3 rounded-full shadow-2xl">
          {toast}
        </div>
      )}

      {/* Add / Edit single table */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-display text-xl font-bold text-stone-900 mb-1">{editing ? 'Edit Table' : 'Add Table'}</h2>
            <p className="text-xs text-stone-700 font-medium mb-5">{editing ? `Currently Table ${editing.number}` : 'A QR code is generated automatically.'}</p>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{formError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Table Number <span className="text-red-500">*</span></label>
                <input type="number" min={1} value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. 1"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xl font-bold text-center focus:outline-none focus:border-stone-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Label <span className="text-stone-500 font-normal">(optional)</span></label>
                <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Window Seat, Patio"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Seats <span className="text-stone-500 font-normal">(optional)</span></label>
                <input type="number" min={1} value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 text-sm font-semibold" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 text-sm font-bold hover:bg-stone-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-black">{editing ? 'Save Changes' : 'Add Table'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk add */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-display text-xl font-bold text-stone-900 mb-1">Bulk-create tables</h2>
            <p className="text-xs text-stone-700 font-medium mb-5">Create a range of tables in one go. A unique QR is generated for each. Existing table numbers are skipped.</p>
            {bulkError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{bulkError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">From</label>
                <input type="number" min={1} value={bulk.from} onChange={e => setBulk(b => ({ ...b, from: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-lg font-bold text-center focus:outline-none focus:border-stone-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">To</label>
                <input type="number" min={1} value={bulk.to} onChange={e => setBulk(b => ({ ...b, to: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-lg font-bold text-center focus:outline-none focus:border-stone-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Seats <span className="text-stone-500 font-normal">(optional)</span></label>
                <input type="number" min={1} value={bulk.seats} onChange={e => setBulk(b => ({ ...b, seats: e.target.value }))} placeholder="e.g. 4"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:border-stone-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Label prefix <span className="text-stone-500 font-normal">(optional)</span></label>
                <input type="text" value={bulk.prefix} onChange={e => setBulk(b => ({ ...b, prefix: e.target.value }))} placeholder="e.g. Table"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-semibold focus:outline-none focus:border-stone-500" />
              </div>
            </div>
            <p className="mt-4 text-[11px] text-stone-700 font-medium bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
              About to create <span className="font-bold text-stone-900">{Math.max(0, (parseInt(bulk.to) || 0) - (parseInt(bulk.from) || 0) + 1)}</span> tables ({bulk.from}–{bulk.to}). Each gets its own permanent QR.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulk(false)} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 text-sm font-bold hover:bg-stone-50">Cancel</button>
              <button onClick={handleBulkSave} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-black">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* QR viewer (large) */}
      {showQR && (() => {
        const isVenue = showQR.kind === 'venue';
        const url = isVenue ? venueUrl : buildTableUrl(restaurant.id, showQR.table.number);
        const title = isVenue ? `${restaurant.name} — Menu` : `Table ${showQR.table.number}`;
        const sub = isVenue ? 'Scan to view menu &amp; details' : (showQR.table.label || 'Scan to order at this table');
        const fileBase = isVenue
          ? `${restaurant.name.replace(/\s+/g, '_')}-menu-qr`
          : `${restaurant.name.replace(/\s+/g, '_')}-table-${showQR.table.number}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4" onClick={() => setShowQR(null)}>
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">{isVenue ? 'Venue QR' : 'Table QR'}</p>
              <h2 className="font-display text-xl font-bold text-stone-900 mt-1">{title}</h2>
              <p className="text-xs text-stone-700 font-medium mt-0.5" dangerouslySetInnerHTML={{ __html: sub }} />
              <div className="my-5 mx-auto w-64 h-64 bg-white border border-stone-200 rounded-2xl p-3">
                <img src={qrImageFor(url, 600)} alt={title} className="w-full h-full object-contain" />
              </div>
              <code className="block text-[10px] bg-stone-100 px-2 py-1.5 rounded font-mono text-stone-700 break-all">{url}</code>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => copy(url, 'Link')} className="py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider">Copy</button>
                <button onClick={() => downloadQRCode(url, fileBase)} className="py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider">Download</button>
                <button onClick={() => printQRSheet({ restaurantId: restaurant.id, restaurantName: restaurant.name, tables: isVenue ? [] : [showQR.table] })} className="py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider">Print</button>
              </div>
              <button onClick={() => setShowQR(null)} className="mt-3 w-full py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50">Close</button>
            </div>
          </div>
        );
      })()}

      {/* Delete confirm */}
      {deleteConfirm && (() => {
        const t = tables.find(x => x.id === deleteConfirm);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
              <p className="text-3xl mb-3">🗑️</p>
              <h2 className="font-display text-xl font-bold text-stone-900 mb-2">Delete Table {t?.number}?</h2>
              <p className="text-stone-700 text-sm font-medium mb-6">This cannot be undone. The QR code will stop working. Existing orders are not affected.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 text-sm font-bold hover:bg-stone-50">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
