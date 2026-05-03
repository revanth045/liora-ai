import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listChefSpecials, db_addChefSpecial, db_updateChefSpecial, db_deleteChefSpecial,
  type DemoChefSpecial, type DemoChefSpecialCategory,
} from '../../../demoDb';
import type { DemoRestaurant } from '../../../demoDb';

const CATEGORY_CONFIG: Record<DemoChefSpecialCategory, { label: string; color: string; icon: string }> = {
  daily_special: { label: "Today's Special", color: 'bg-green-100 text-green-700', icon: 'today' },
  seasonal:      { label: 'Seasonal',       color: 'bg-orange-100 text-orange-700', icon: 'eco' },
  chef_choice:   { label: "Chef's Choice",  color: 'bg-purple-100 text-purple-700', icon: 'restaurant' },
};

interface SpecialForm {
  name: string;
  description: string;
  priceCents: number;
  category: DemoChefSpecialCategory;
  chefNote: string;
  imageEmoji: string;
  isAvailable: boolean;
}

const EMPTY_FORM: SpecialForm = {
  name: '', description: '', priceCents: 2500, category: 'daily_special', chefNote: '', imageEmoji: '🍽️', isAvailable: true,
};

const EMOJI_OPTIONS = ['🍽️','🍝','🥩','🍝','🍕','🥗','🍣','🍔','🧂','🥗','💆‍♀️','🍝'];

export default function RestoChefSpecials({ restaurant }: { restaurant: DemoRestaurant }) {
  const [specials, setSpecials] = useState<DemoChefSpecial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SpecialForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const reload = () => {
    setSpecials(db_listChefSpecials(restaurant.id));
  };

  useEffect(() => { reload(); }, [restaurant.id]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (s: DemoChefSpecial) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description, priceCents: s.priceCents, category: s.category, chefNote: s.chefNote || '', imageEmoji: s.imageEmoji || '🍽️', isAvailable: s.isAvailable });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      const existing = specials.find(s => s.id === editId);
      if (existing) db_updateChefSpecial({ ...existing, ...form });
    } else {
      db_addChefSpecial({ restaurantId: restaurant.id, ...form });
    }
    reload();
    setShowForm(false);
    setEditId(null);
  };

  const toggleAvailable = (s: DemoChefSpecial) => {
    db_updateChefSpecial({ ...s, isAvailable: !s.isAvailable });
    reload();
  };

  const remove = (id: string) => {
    if (window.confirm('Remove this special?')) { db_deleteChefSpecial(id); reload(); }
  };

  const inp = 'w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm';
  const lbl = 'block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5';

  const grouped: Record<DemoChefSpecialCategory, DemoChefSpecial[]> = {
    daily_special: specials.filter(s => s.category === 'daily_special'),
    seasonal: specials.filter(s => s.category === 'seasonal'),
    chef_choice: specials.filter(s => s.category === 'chef_choice'),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-20">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-lora font-bold text-stone-800">Chef Specials</h2>
          <p className="text-sm text-stone-600 mt-0.5">Showcase daily specials, seasonal dishes and signature chef creations.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-2xl font-bold text-sm hover:bg-stone-900 transition-all shadow-sm">
          <Icon name="add" size={18} /> Add Special
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(['daily_special','seasonal','chef_choice'] as DemoChefSpecialCategory[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const count = grouped[cat].length;
          const available = grouped[cat].filter(s => s.isAvailable).length;
          return (
            <div key={cat} className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-3 ${cfg.color}`}>
                <Icon name={cfg.icon} size={14} /> {cfg.label}
              </div>
              <p className="text-2xl font-lora font-bold text-stone-800">{available}<span className="text-stone-600 text-base font-normal">/{count}</span></p>
              <p className="text-[10px] text-stone-600 uppercase tracking-wider font-bold mt-1">Available now</p>
            </div>
          );
        })}
      </div>

      {/* Specials by category */}
      {(Object.entries(grouped) as [DemoChefSpecialCategory, DemoChefSpecial[]][]).map(([cat, items]) => (
        <div key={cat}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${CATEGORY_CONFIG[cat].color}`}>
              <Icon name={CATEGORY_CONFIG[cat].icon} size={14} /> {CATEGORY_CONFIG[cat].label}
            </div>
            <span className="text-xs text-stone-600 font-bold">{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <div className="bg-cream-50 border border-dashed border-cream-300 rounded-3xl py-12 text-center text-stone-600">
              <p className="text-sm">No {CATEGORY_CONFIG[cat].label.toLowerCase()} yet.</p>
              <button onClick={openCreate} className="mt-3 text-xs font-bold text-brand-400 hover:underline">+ Add one</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map(special => (
                <div key={special.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${!special.isAvailable ? 'opacity-60' : 'border-cream-200'}`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center text-3xl flex-shrink-0">
                        {special.imageEmoji || '🍽️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-stone-800 text-base leading-tight">{special.name}</h3>
                          <span className="font-lora font-bold text-stone-800 text-lg flex-shrink-0">${(special.priceCents / 100).toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-stone-600 mt-1 leading-relaxed line-clamp-2">{special.description}</p>
                      </div>
                    </div>

                    {special.chefNote && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                        <span className="text-lg flex-shrink-0">👨‍🍳</span>
                        <p className="text-sm text-amber-700 italic leading-relaxed">{special.chefNote}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAvailable(special)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-2 ${special.isAvailable ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-stone-800 text-white border-stone-800 hover:bg-stone-900 shadow-sm'}`}>
                        <Icon name={special.isAvailable ? 'check_circle' : 'add_circle'} size={14} />
                        {special.isAvailable ? 'Available' : 'Mark Available'}
                      </button>
                      <button onClick={() => openEdit(special)} className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-cream-200 text-stone-600 hover:bg-cream-50 transition-all">Edit</button>
                      <button onClick={() => remove(special.id)} className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-lora text-2xl font-bold text-stone-800">{editId ? 'Edit Special' : 'Add New Special'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-cream-100"><Icon name="x" size={20} /></button>
              </div>
              <div className="space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className={lbl}>Dish Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJI_OPTIONS.map(e => (
                      <button key={e} onClick={() => setForm(f => ({...f, imageEmoji: e}))}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.imageEmoji === e ? 'bg-stone-800 shadow-sm ring-2 ring-stone-800 ring-offset-1' : 'bg-cream-100 hover:bg-cream-200'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Dish Name</label>
                  <input className={inp} placeholder="e.g. Pan-Seared Halibut" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div>
                  <label className={lbl}>Description</label>
                  <textarea className={inp + ' resize-none h-20'} placeholder="Ingredients, preparation style..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Price ($)</label>
                    <input className={inp} type="number" step="0.01" min="0" value={(form.priceCents / 100).toFixed(2)}
                      onChange={e => setForm(f => ({...f, priceCents: Math.round(parseFloat(e.target.value || '0') * 100)}))} />
                  </div>
                  <div>
                    <label className={lbl}>Category</label>
                    <select className={inp} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as DemoChefSpecialCategory}))}>
                      <option value="daily_special">Today's Special</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="chef_choice">Chef's Choice</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Chef's Note (optional)</label>
                  <input className={inp} placeholder="A personal note about the dish..." value={form.chefNote} onChange={e => setForm(f => ({...f, chefNote: e.target.value}))} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f => ({...f, isAvailable: !f.isAvailable}))}
                    className={`w-11 h-6 rounded-full transition-all ${form.isAvailable ? 'bg-green-500' : 'bg-stone-300'} flex items-center px-0.5`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-stone-700">Available for ordering</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-cream-200 text-stone-600 font-bold text-sm hover:bg-cream-50">Cancel</button>
                <button onClick={save} className="flex-1 py-3 rounded-2xl bg-stone-800 text-white font-bold text-sm hover:bg-stone-900 shadow-sm">
                  {editId ? 'Save Changes' : 'Add Special'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
