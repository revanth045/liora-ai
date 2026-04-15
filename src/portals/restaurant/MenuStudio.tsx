
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import {
  db_listMenu, db_addMenu, db_updateMenu, db_deleteMenu,
  type DemoMenuItem, type DemoRestaurant,
} from '../../demoDb';

// â €â €â € Types â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
type ItemForm = {
  name: string;
  description: string;
  priceCents: string;
  category: string;
  extraTags: string;
  available: boolean;
};

const EMPTY_FORM: ItemForm = {
  name: '', description: '', priceCents: '', category: '', extraTags: '', available: true,
};

const SUGGESTED_CATEGORIES = [
  'Starters', 'Salads', 'Soups', 'Mains', 'Pasta & Rice',
  'Grills & BBQ', 'Seafood', 'Vegetarian', 'Sides',
  'Desserts', 'Beverages', 'Cocktails', 'Wine', 'Non-Alcoholic',
];

// â €â €â € Helpers â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
function fmtPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function parseCents(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) || n < 0 ? null : Math.round(n * 100);
}

// â €â €â € Modal Input helpers â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
const FieldWrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-stone-800 text-sm focus:outline-none focus:border-forest-900/30 focus:bg-white transition-colors";

// â €â €â € Item Form Modal â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
function ItemModal({ title, form, onChange, onSave, onClose, saving }: {
  title: string; form: ItemForm; onChange: (f: ItemForm) => void;
  onSave: () => void; onClose: () => void; saving: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-100">
          <h3 className="font-lora text-lg font-bold text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-100 text-stone-400 transition-colors">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <FieldWrap label="Item Name *">
            <input ref={nameRef} value={form.name} onChange={e => onChange({ ...form, name: e.target.value })}
              placeholder="e.g. Grilled Salmon" className={inputCls} />
          </FieldWrap>
          <FieldWrap label="Description">
            <textarea value={form.description} onChange={e => onChange({ ...form, description: e.target.value })}
              rows={3} placeholder="Short description of the dishâ ¦"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-stone-800 text-sm focus:outline-none focus:border-forest-900/30 focus:bg-white transition-colors resize-none" />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Price (USD) *">
              <input type="text" value={form.priceCents} onChange={e => onChange({ ...form, priceCents: e.target.value })}
                placeholder="0.00" className={inputCls} />
            </FieldWrap>
            <FieldWrap label="Category">
              <>
                <input list="cat-list" value={form.category} onChange={e => onChange({ ...form, category: e.target.value })}
                  placeholder="Select or typeâ ¦" className={inputCls} />
                <datalist id="cat-list">
                  {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </>
            </FieldWrap>
          </div>
          <FieldWrap label="Extra Tags (comma-separated)">
            <input type="text" value={form.extraTags} onChange={e => onChange({ ...form, extraTags: e.target.value })}
              placeholder="e.g. gluten-free, spicy, vegan" className={inputCls} />
          </FieldWrap>
          <div className="flex items-center justify-between p-4 bg-cream-50 rounded-2xl border border-cream-200">
            <div>
              <p className="text-sm font-semibold text-stone-700">Available on menu</p>
              <p className="text-xs text-stone-400 mt-0.5">Customers can see and order this item</p>
            </div>
            <button onClick={() => onChange({ ...form, available: !form.available })}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.available ? 'bg-forest-900' : 'bg-stone-200'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.available ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-cream-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving || !form.name.trim() || !form.priceCents.trim()}
            className="px-6 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-bold disabled:opacity-50 hover:bg-forest-900/90 transition-colors flex items-center gap-2">
            {saving ? <><Icon name="refresh" size={14} className="animate-spin" /> Savingâ ¦</> : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â €â €â € Delete Confirm â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="delete" size={22} className="text-red-500" />
        </div>
        <h3 className="font-lora text-lg font-bold text-stone-800 mb-2">Remove "{name}"?</h3>
        <p className="text-stone-500 text-sm mb-6">This item will be permanently removed from your menu and cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-stone-600 font-semibold text-sm hover:bg-cream-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

// â €â €â € Main â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €â €
export default function RestoMenuStudio({ restaurant }: { restaurant: DemoRestaurant }) {
  const [items, setItems] = useState<DemoMenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterAvail, setFilterAvail] = useState<'all' | 'available' | 'hidden'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<DemoMenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DemoMenuItem | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => setItems(db_listMenu(restaurant.id));
  useEffect(() => { load(); }, [restaurant.id]);

  // All category labels derived from first tag
  const allCats = ['All', ...Array.from(new Set(items.map(i => i.tags?.[0] ?? 'Uncategorized')))];

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchQ = item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
    const matchCat = filterCat === 'All' || (item.tags?.[0] ?? 'Uncategorized') === filterCat;
    const matchA = filterAvail === 'all' ? true : filterAvail === 'available' ? item.available : !item.available;
    return matchQ && matchCat && matchA;
  });

  // Group by category
  const grouped: Record<string, DemoMenuItem[]> = {};
  for (const item of filtered) {
    const cat = item.tags?.[0] ?? 'Uncategorized';
    (grouped[cat] = grouped[cat] ?? []).push(item);
  }

  const openAdd = () => { setForm(EMPTY_FORM); setShowAdd(true); };
  const openEdit = (item: DemoMenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      priceCents: (item.priceCents / 100).toFixed(2),
      category: item.tags?.[0] ?? '',
      extraTags: (item.tags ?? []).slice(1).join(', '),
      available: item.available,
    });
  };

  const buildTags = (f: ItemForm) =>
    [f.category.trim(), ...f.extraTags.split(',').map(t => t.trim())].filter(Boolean);

  const handleSaveNew = () => {
    const cents = parseCents(form.priceCents);
    if (!form.name.trim() || cents === null) return;
    setSaving(true);
    db_addMenu(restaurant.id, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      priceCents: cents,
      tags: buildTags(form),
      available: form.available,
    });
    load(); setSaving(false); setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    const cents = parseCents(form.priceCents);
    if (!form.name.trim() || cents === null) return;
    setSaving(true);
    db_updateMenu({
      ...editItem,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      priceCents: cents,
      tags: buildTags(form),
      available: form.available,
    });
    load(); setSaving(false); setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    db_deleteMenu(deleteItem.id);
    load(); setDeleteItem(null);
  };

  const toggleAvail = (item: DemoMenuItem) => {
    db_updateMenu({ ...item, available: !item.available });
    load();
  };

  const availCount = items.filter(i => i.available).length;

  return (
    <div className="max-w-6xl mx-auto animate-page-slide pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-lora text-2xl font-bold text-stone-800">Menu Studio</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {items.length} items · {availCount} available · {items.length - availCount} hidden
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-forest-900 text-white rounded-xl text-sm font-bold hover:bg-forest-900/90 transition-colors shadow-sm">
          <Icon name="add" size={16} /> Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search itemsâ ¦"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:border-forest-900/30 transition-colors" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm text-stone-700 focus:outline-none">
          {allCats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterAvail} onChange={e => setFilterAvail(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm text-stone-700 focus:outline-none">
          <option value="all">All items</option>
          <option value="available">Available</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border border-cream-200">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="restaurant_menu" size={28} className="text-stone-400" />
          </div>
          <h3 className="font-lora text-xl font-bold text-stone-700 mb-2">No menu items yet</h3>
          <p className="text-stone-400 text-sm mb-6">Start building your menu by adding your first item.</p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-900 text-white rounded-xl text-sm font-bold hover:bg-forest-900/90 transition-colors">
            <Icon name="add" size={16} /> Add First Item
          </button>
        </div>
      )}

      {/* No results */}
      {items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Icon name="search_off" size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-stone-500">No items match your filters</p>
          <button onClick={() => { setSearch(''); setFilterCat('All'); setFilterAvail('all'); }}
            className="mt-3 text-sm text-forest-900 hover:underline">Clear filters</button>
        </div>
      )}

      {/* Grouped list */}
      {Object.keys(grouped).map(cat => (
        <div key={cat} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-bold text-stone-600 text-xs uppercase tracking-widest">{cat}</h2>
            <div className="flex-1 h-px bg-cream-200" />
            <span className="text-xs text-stone-400">{grouped[cat].length}</span>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden divide-y divide-cream-100">
            {grouped[cat].map(item => (
              <div key={item.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-cream-50/50 transition-colors ${!item.available ? 'opacity-50' : ''}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.available ? 'bg-green-500' : 'bg-stone-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-800 text-sm">{item.name}</span>
                    {(item.tags ?? []).slice(1).map(t => (
                      <span key={t} className="text-[10px] bg-cream-100 text-stone-500 px-2 py-0.5 rounded-full border border-cream-200">{t}</span>
                    ))}
                  </div>
                  {item.description && <p className="text-xs text-stone-400 mt-0.5 truncate max-w-lg">{item.description}</p>}
                </div>
                <span className="font-lora font-bold text-stone-800 text-base flex-shrink-0">{fmtPrice(item.priceCents)}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleAvail(item)} title={item.available ? 'Hide' : 'Show'}
                    className="p-2 rounded-lg hover:bg-cream-100 text-stone-400 hover:text-stone-700 transition-colors">
                    <Icon name={item.available ? 'visibility' : 'visibility_off'} size={16} />
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-cream-100 text-stone-400 hover:text-stone-700 transition-colors">
                    <Icon name="edit" size={16} />
                  </button>
                  <button onClick={() => setDeleteItem(item)} className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAdd && <ItemModal title="Add Menu Item" form={form} onChange={setForm} onSave={handleSaveNew} onClose={() => setShowAdd(false)} saving={saving} />}
      {editItem && <ItemModal title={`Edit â ” ${editItem.name}`} form={form} onChange={setForm} onSave={handleSaveEdit} onClose={() => setEditItem(null)} saving={saving} />}
      {deleteItem && <DeleteConfirm name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  );
}


