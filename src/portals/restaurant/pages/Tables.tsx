import React, { useState, useEffect } from 'react';
import {
  db_listTables,
  db_addTable,
  db_updateTable,
  db_deleteTable,
  DemoTable,
  DemoRestaurant,
} from '../../../demoDb';

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
        <span className="text-xl flex-shrink-0 mt-0.5">ð  ¡</span>
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
          <p className="text-4xl mb-3">ð ª </p>
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
                  <p className="text-[10px] text-stone-400">ð ª  {t.seats} seats</p>
                )}
              </div>

              {/* Action buttons — visible on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-3xl mb-3">📈️</p>
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
    </div>
  );
}
