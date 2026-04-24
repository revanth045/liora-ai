
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import {
  db_listInventory, db_addInventoryItem, db_updateInventoryItem, db_deleteInventoryItem,
  type DemoInventoryItem, type DemoRestaurant, type InventoryCategory, type InventoryUnit,
} from '../../demoDb';
import {
  sbListInventory, sbAddInventoryItem, sbUpdateInventoryItem, sbDeleteInventoryItem,
} from '../../lib/supabaseDb';

// --- Constants ----------------------------------------------------------------
const CATEGORIES: InventoryCategory[] = [
  'Proteins', 'Produce', 'Dairy', 'Bakery', 'Pantry',
  'Beverages', 'Alcohol', 'Frozen', 'Spices', 'Other',
];
const UNITS: InventoryUnit[] = [
  'units', 'kg', 'g', 'litres', 'ml', 'bottles', 'cans', 'bags', 'boxes', 'portions',
];

// --- Status helper ------------------------------------------------------------
function deriveStatus(qty: number, reorder: number): 'out' | 'critical' | 'low' | 'good' {
  if (qty === 0) return 'out';
  if (qty <= reorder * 0.5) return 'critical';
  if (qty <= reorder) return 'low';
  return 'good';
}

// --- Types ---------------------------------------------------------------------
type ItemForm = {
  name: string;
  category: InventoryCategory;
  quantity: string;
  unit: InventoryUnit;
  reorderPoint: string;
  costPerUnit: string;
  supplier: string;
  notes: string;
};
const EMPTY_FORM: ItemForm = {
  name: '', category: 'Other', quantity: '', unit: 'units',
  reorderPoint: '10', costPerUnit: '', supplier: '', notes: '',
};

// --- Input helpers ------------------------------------------------------------
const FieldWrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-stone-800 text-sm focus:outline-none focus:border-forest-900/30 focus:bg-white transition-colors";

// --- Item Modal ---------------------------------------------------------------
function ItemModal({ title, form, onChange, onSave, onClose, saving }: {
  title: string; form: ItemForm; onChange: (f: ItemForm) => void;
  onSave: () => void; onClose: () => void; saving: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k: keyof ItemForm, v: string | InventoryCategory | InventoryUnit) =>
    onChange({ ...form, [k]: v });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h2 className="font-lora text-lg font-bold text-stone-800">{title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-cream-50 transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FieldWrap label="Item Name *">
            <input ref={nameRef} value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Chicken Breast" className={inputCls} />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Category *">
              <select value={form.category} onChange={e => set('category', e.target.value as InventoryCategory)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldWrap>
            <FieldWrap label="Unit *">
              <select value={form.unit} onChange={e => set('unit', e.target.value as InventoryUnit)} className={inputCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </FieldWrap>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Current Quantity *">
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                placeholder="e.g. 50" className={inputCls} />
            </FieldWrap>
            <FieldWrap label="Reorder Point *">
              <input type="number" min="0" value={form.reorderPoint} onChange={e => set('reorderPoint', e.target.value)}
                placeholder="e.g. 10" className={inputCls} />
            </FieldWrap>
          </div>
          <FieldWrap label="Cost Per Unit (optional, in $USD)">
            <input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={e => set('costPerUnit', e.target.value)}
              placeholder="e.g. 12.50" className={inputCls} />
          </FieldWrap>
          <FieldWrap label="Supplier (optional)">
            <input value={form.supplier} onChange={e => set('supplier', e.target.value)}
              placeholder="e.g. Sysco Foods" className={inputCls} />
          </FieldWrap>
          <FieldWrap label="Notes (optional)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes..." rows={2}
              className={`${inputCls} resize-none`} />
          </FieldWrap>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-900/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Icon name="autorenew" size={16} /> Saving...</> : <><Icon name="check" size={16} /> Save Item</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirm -----------------------------------------------------------
function DeleteConfirm({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <Icon name="delete" size={28} className="text-red-500" />
        </div>
        <h3 className="font-lora text-lg font-bold text-stone-800">Remove Item?</h3>
        <p className="text-sm text-stone-400">
          "<span className="font-semibold text-stone-700">{name}</span>" will be permanently deleted from your inventory.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component -----------------------------------------------------------
export default function RestoInventory({ restaurant }: { restaurant: DemoRestaurant }) {
  const [items, setItems] = useState<DemoInventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<InventoryCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'critical' | 'out'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DemoInventoryItem | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DemoInventoryItem | null>(null);

  const load = async () => {
    let data: DemoInventoryItem[] = [];
    try { data = await sbListInventory(restaurant.id); } catch {}
    if (data.length === 0) data = db_listInventory(restaurant.id);
    setItems(data);
  };
  useEffect(() => { load(); }, [restaurant.id]);

  // --- Derived stats ----------------------------------------------------------
  const alerts = items.filter(i => {
    const s = deriveStatus(i.quantity, i.reorderPoint);
    return s === 'low' || s === 'critical' || s === 'out';
  }).length;

  const estValue = items.reduce((sum, i) => {
    return sum + (i.costPerUnit != null ? i.quantity * i.costPerUnit : 0);
  }, 0);

  // --- Filter + search --------------------------------------------------------
  const visible = items.filter(i => {
    const s = deriveStatus(i.quantity, i.reorderPoint);
    if (filterStatus !== 'all' && s !== filterStatus) return false;
    if (filterCat !== 'all' && i.category !== filterCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // --- Open Add Modal ---------------------------------------------------------
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  // --- Open Edit Modal --------------------------------------------------------
  const openEdit = (item: DemoInventoryItem) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      reorderPoint: String(item.reorderPoint),
      costPerUnit: item.costPerUnit != null ? String(item.costPerUnit) : '',
      supplier: item.supplier ?? '',
      notes: item.notes ?? '',
    });
    setShowModal(true);
  };

  // --- Save -------------------------------------------------------------------
  const handleSave = () => {
    if (!form.name.trim()) return;
    const qty = parseFloat(form.quantity);
    const reorder = parseFloat(form.reorderPoint);
    if (isNaN(qty) || qty < 0) return;
    if (isNaN(reorder) || reorder < 0) return;

    setSaving(true);
    const cost = form.costPerUnit !== '' ? parseFloat(form.costPerUnit) : undefined;

    if (editTarget) {
      const updated: DemoInventoryItem = {
        ...editTarget, name: form.name.trim(), category: form.category,
        quantity: qty, unit: form.unit, reorderPoint: reorder,
        costPerUnit: cost, supplier: form.supplier.trim() || undefined,
        notes: form.notes.trim() || undefined, updatedAt: Date.now(),
      };
      db_updateInventoryItem(updated);
      sbUpdateInventoryItem(updated).catch(() => {});
    } else {
      const payload = {
        restaurantId: restaurant.id, name: form.name.trim(), category: form.category,
        quantity: qty, unit: form.unit, reorderPoint: reorder,
        costPerUnit: cost, supplier: form.supplier.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      db_addInventoryItem(payload);
      sbAddInventoryItem(payload).catch(() => {});
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  // --- Quick qty adjust -------------------------------------------------------
  const adjustQty = (item: DemoInventoryItem, delta: number) => {
    const next = Math.max(0, item.quantity + delta);
    const updated = { ...item, quantity: next, updatedAt: Date.now() };
    db_updateInventoryItem(updated);
    sbUpdateInventoryItem(updated).catch(() => {});
    load();
  };

  // --- Delete -----------------------------------------------------------------
  const handleDelete = () => {
    if (!deleteTarget) return;
    db_deleteInventoryItem(deleteTarget.id);
    sbDeleteInventoryItem(deleteTarget.id).catch(() => {});
    setDeleteTarget(null);
    load();
  };

  // --- Status badge -----------------------------------------------------------
  const statusBadge = (status: ReturnType<typeof deriveStatus>) => {
    const map = {
      out: 'bg-red-100 text-red-700 border-red-200',
      critical: 'bg-red-50 text-red-600 border-red-200',
      low: 'bg-orange-50 text-orange-600 border-orange-200',
      good: 'bg-green-50 text-green-600 border-green-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase border ${map[status]}`}>
        {status}
      </span>
    );
  };

  // --- Progress bar ----------------------------------------------------------- 
  const progressBar = (qty: number, reorder: number, status: ReturnType<typeof deriveStatus>) => {
    const max = Math.max(reorder * 2, qty);
    const pct = max > 0 ? Math.min((qty / max) * 100, 100) : 0;
    const color = status === 'good' ? 'bg-green-500' : status === 'low' ? 'bg-orange-500' : 'bg-red-500';
    return (
      <div className="w-24 h-1.5 bg-cream-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  // --- Render -----------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Modals */}
      {showModal && (
        <ItemModal
          title={editTarget ? 'Edit Inventory Item' : 'Add Inventory Item'}
          form={form} onChange={setForm}
          onSave={handleSave} onClose={() => setShowModal(false)} saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-cream-200 shadow-sm">
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Total Items</div>
          <div className="text-2xl font-lora font-bold text-stone-800">{items.length}</div>
        </div>
        <div className={`p-4 rounded-xl border shadow-sm ${alerts > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-cream-200'}`}>
          <div className={`text-[10px] font-bold uppercase flex items-center gap-1.5 tracking-wider mb-1 ${alerts > 0 ? 'text-red-500' : 'text-stone-400'}`}>
            <Icon name="warning" size={12} /> Alerts
          </div>
          <div className={`text-2xl font-lora font-bold ${alerts > 0 ? 'text-red-700' : 'text-stone-800'}`}>{alerts}</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-cream-200 shadow-sm">
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Est. Value</div>
          <div className="text-2xl font-lora font-bold text-stone-800">
            {estValue > 0 ? `$${estValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
        </div>
        <button
          onClick={openAdd}
          className="p-4 bg-forest-900 rounded-xl shadow-sm text-white flex items-center gap-3 hover:bg-forest-900/90 transition-colors active:scale-95 group"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Icon name="add" size={20} />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">Add Item</div>
            <div className="text-[10px] text-white/60 leading-tight">Track new stock</div>
          </div>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">

        {/* Stock Summary Cards */}
      {(() => {
        const total = items.length;
        const outCount = items.filter(i => deriveStatus(i.quantity, i.reorderPoint) === 'out').length;
        const criticalCount = items.filter(i => deriveStatus(i.quantity, i.reorderPoint) === 'critical').length;
        const lowCount = items.filter(i => deriveStatus(i.quantity, i.reorderPoint) === 'low').length;
        const totalValue = items.reduce((s, i) => s + i.quantity * (i.costPerUnit ?? 0), 0);
        const catBreakdown = CATEGORIES.map(cat => ({
          cat,
          count: items.filter(i => i.category === cat).length,
          value: items.filter(i => i.category === cat).reduce((s, i) => s + i.quantity * (i.costPerUnit ?? 0), 0),
        })).filter(c => c.count > 0);
        return (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-sm">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Items</div>
                <div className="text-3xl font-lora font-bold text-stone-800">{total}</div>
                <div className="text-xs text-stone-400 mt-1">across {catBreakdown.length} categories</div>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-sm">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Inventory Value</div>
                <div className="text-3xl font-lora font-bold text-stone-800">${totalValue.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div className="text-xs text-stone-400 mt-1">estimated cost value</div>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-amber-100 shadow-sm" style={{borderLeftWidth:'4px', borderLeftColor:'rgb(251 191 36)'}}>
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Low / Critical</div>
                <div className="text-3xl font-lora font-bold text-amber-600">{lowCount + criticalCount}</div>
                <div className="text-xs text-amber-500 mt-1">{criticalCount} critical, {lowCount} low stock</div>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-red-100 shadow-sm" style={{borderLeftWidth:'4px', borderLeftColor:'rgb(248 113 113)'}}>
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Out of Stock</div>
                <div className="text-3xl font-lora font-bold text-red-600">{outCount}</div>
                <div className="text-xs text-red-400 mt-1">{outCount === 0 ? 'All items in stock' : 'Need immediate reorder'}</div>
              </div>
            </div>
            {catBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-stone-700">Stock by Category</h3>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{total} total items</span>
                </div>
                <div className="space-y-2.5">
                  {catBreakdown.sort((a,b) => b.count - a.count).map(({cat, count, value}) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    const catItems = items.filter(i => i.category === cat);
                    const atRisk = catItems.filter(i => deriveStatus(i.quantity, i.reorderPoint) !== 'good').length;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-bold text-stone-600 flex-shrink-0">{cat}</div>
                        <div className="flex-1 bg-cream-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-forest-900/60 rounded-full transition-all" style={{width: pct + '%'}} />
                        </div>
                        <div className="text-xs font-bold text-stone-700 w-8 text-right">{count}</div>
                        {atRisk > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{atRisk} at risk</span>}
                        {value > 0 && <span className="text-[9px] font-bold text-stone-400">${value.toFixed(0)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Toolbar */}
        <div className="p-4 border-b border-cream-200 bg-cream-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Status filter pills */}
          <div className="flex bg-cream-50/50 p-1 rounded-lg border border-cream-200 flex-shrink-0">
            {(['all', 'low', 'critical', 'out'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${filterStatus === f ? 'bg-forest-900 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Category filter */}
            <select value={filterCat} onChange={e => setFilterCat(e.target.value as InventoryCategory | 'all')}
              className="px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-stone-600 outline-none focus:ring-1 focus:ring-forest-900/20 shadow-sm">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Search */}
            <div className="relative flex-1 sm:w-52">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-8 pr-4 py-2 bg-white border border-cream-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-forest-900/20 shadow-sm" />
              <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-cream-100/80 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-cream-200">
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3">Quantity</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-cream-200/70">
              {visible.length === 0 ? (
                <div className="py-16 text-center">
                  <Icon name="inventory_2" size={40} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm font-medium">
                    {items.length === 0 ? 'No inventory items yet.' : 'No items match your filters.'}
                  </p>
                  {items.length === 0 && (
                    <button onClick={openAdd} className="mt-3 text-forest-900 text-xs font-bold hover:underline flex items-center gap-1 mx-auto">
                      <Icon name="add" size={14} /> Add your first item
                    </button>
                  )}
                </div>
              ) : (
                visible.map(item => {
                  const status = deriveStatus(item.quantity, item.reorderPoint);
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-cream-50/40 transition-colors group">
                      <div className="col-span-3 flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'good' ? 'bg-green-500' : status === 'low' ? 'bg-orange-400' : 'bg-red-500 animate-pulse'}`} />
                        <div>
                          <div className="font-semibold text-stone-800 text-sm leading-tight">{item.name}</div>
                          {item.supplier && <div className="text-[10px] text-stone-400 leading-tight">{item.supplier}</div>}
                        </div>
                      </div>
                      <div className="col-span-2 text-xs font-medium text-stone-500">{item.category}</div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          {/* Quick adjust */}
                          <button onClick={() => adjustQty(item, -1)}
                            className="w-6 h-6 rounded-full border border-cream-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors text-sm font-bold flex-shrink-0">
                            →
                          </button>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-xs font-bold text-stone-800">{item.quantity} {item.unit}</span>
                            {progressBar(item.quantity, item.reorderPoint, status)}
                          </div>
                          <button onClick={() => adjustQty(item, 1)}
                            className="w-6 h-6 rounded-full border border-cream-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors text-sm font-bold flex-shrink-0">
                            +
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2">{statusBadge(status)}</div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-forest-900 hover:bg-forest-900/5 transition-colors opacity-0 group-hover:opacity-100">
                          <Icon name="edit" size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                          <Icon name="delete" size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-3 bg-cream-100/50 border-t border-cream-200 flex items-center justify-between text-xs text-stone-400">
            <span>{visible.length} of {items.length} items shown</span>
            <button onClick={openAdd} className="flex items-center gap-1.5 text-forest-900 font-bold hover:underline">
              <Icon name="add" size={13} /> Add Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
