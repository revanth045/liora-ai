import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import {
  db_listPromotions, db_addPromotion, db_updatePromotion, db_deletePromotion,
  type DemoPromotion,
} from '../../../demoDb';
import type { DemoRestaurant } from '../../../demoDb';

function genCode() {
  return 'PROMO' + Math.random().toString(36).slice(2,6).toUpperCase();
}

interface PromoFormData {
  title: string;
  description: string;
  type: 'percent' | 'flat' | 'bogo';
  value: number;
  code: string;
  validUntil: string;
  maxUsage: number;
}

const EMPTY_FORM: PromoFormData = {
  title: '', description: '', type: 'percent', value: 10, code: '', validUntil: '', maxUsage: 100,
};

const TYPE_CONFIG = { percent: '% Off', flat: 'Flat Discount', bogo: 'Buy 1 Get 1' };

export default function RestoPromotions({ restaurant }: { restaurant: DemoRestaurant }) {
  const [promos, setPromos] = useState<DemoPromotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoFormData>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const reload = () => {
    setPromos(db_listPromotions(restaurant.id));
  };

  useEffect(() => { reload(); }, [restaurant.id]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, code: genCode() });
    setShowForm(true);
  };

  const openEdit = (p: DemoPromotion) => {
    setEditId(p.id);
    setForm({ title: p.title, description: p.description, type: p.type, value: p.value, code: p.code || '', validUntil: p.validUntil || '', maxUsage: p.maxUsage || 100 });
    setShowForm(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editId) {
      const all = db_listPromotions(restaurant.id);
      const existing = all.find(p => p.id === editId);
      if (existing) {
        db_updatePromotion({ ...existing, ...form });
      }
    } else {
      db_addPromotion({ restaurantId: restaurant.id, ...form, isActive: true });
    }
    reload();
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const toggleActive = (p: DemoPromotion) => {
    db_updatePromotion({ ...p, isActive: !p.isActive });
    reload();
  };

  const remove = (id: string) => {
    if (window.confirm('Delete this promotion?')) {
      db_deletePromotion(id);
      reload();
    }
  };

  const inp = 'w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm';
  const lbl = 'block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-slide pb-20">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Promos',      value: promos.filter(p => p.isActive).length, icon: 'campaign',            color: 'bg-green-100 text-green-700' },
          { label: 'Total Redemptions',  value: promos.reduce((s,p) => s + p.usageCount, 0), icon: 'confirmation_number', color: 'bg-blue-100 text-blue-700' },
          { label: 'Saved for Customers',value: `$${(promos.filter(p=>p.isActive&&p.type==='flat').reduce((s,p)=>s+p.value*p.usageCount,0)/100).toFixed(0)}`, icon: 'savings', color: 'bg-amber-100 text-amber-700' },
        ].map((m, i) => (
          <div key={i} className={`bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex items-start justify-between group card-lift animate-slide-up stagger-${i+1}`}>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{m.label}</p>
              <h3 className="text-2xl font-lora font-bold text-stone-800">{m.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${m.color} group-hover:scale-110 transition-transform duration-200`}><Icon name={m.icon} size={20} /></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-lora font-bold text-stone-800">Your Promotions</h2>
          <p className="text-sm text-stone-400 mt-0.5">Create discounts, coupons and special offers to drive more orders.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-2xl font-bold text-sm hover:bg-stone-900 transition-all shadow-sm">
          <Icon name="add" size={18} /> New Promotion
        </button>
      </div>

      {/* Promos list */}
      {promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Icon name="local_offer" size={48} className="text-stone-300 mb-4" />
          <p className="font-lora font-bold text-lg text-stone-500">No promotions yet</p>
          <p className="text-sm text-stone-400 mt-1">Create your first promo to attract more customers.</p>
          <button onClick={openCreate} className="mt-5 px-6 py-3 bg-stone-800 text-white rounded-2xl font-bold text-sm hover:bg-stone-900 transition-all">
            Create First Promotion
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {promos.map(p => (
            <div key={p.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200 ${p.isActive ? 'border-cream-200' : 'border-cream-200 opacity-60'}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${p.type === 'percent' ? 'bg-purple-100 text-purple-600' : p.type === 'flat' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {TYPE_CONFIG[p.type]}
                      </span>
                      {p.isActive
                        ? <span className="text-[9px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Live</span>
                        : <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-full uppercase tracking-widest">Paused</span>}
                    </div>
                    <h3 className="font-bold text-stone-800 text-base leading-tight">{p.title}</h3>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-lora font-bold text-stone-800">
                      {p.type === 'percent' ? `${p.value}%` : p.type === 'flat' ? `$${(p.value/100).toFixed(0)}` : 'BOGO'}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-stone-500 leading-relaxed mb-4">{p.description}</p>

                {p.code && (
                  <div className="flex items-center gap-2 bg-cream-50 border border-dashed border-cream-300 rounded-xl px-4 py-2.5 mb-4">
                    <Icon name="confirmation_number" size={16} className="text-stone-400" />
                    <span className="font-mono font-bold text-stone-700 tracking-widest text-sm">{p.code}</span>
                    <span className="text-[9px] text-stone-400 ml-auto">{p.usageCount} uses</span>
                  </div>
                )}

                {p.maxUsage && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                      <span>Usage</span>
                      <span>{p.usageCount} / {p.maxUsage}</span>
                    </div>
                    <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${Math.min(100, (p.usageCount / p.maxUsage) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {p.validUntil && (
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-4">
                    Valid until {new Date(p.validUntil).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-cream-100">
                  <button onClick={() => toggleActive(p)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border ${p.isActive ? 'border-stone-200 text-stone-600 hover:bg-stone-50' : 'bg-stone-800 text-white border-stone-800 hover:bg-stone-900 shadow-sm'}`}>
                    {p.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-cream-200 text-stone-600 hover:bg-cream-50 transition-all">
                    Edit
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-lora text-2xl font-bold text-stone-800">{editId ? 'Edit Promotion' : 'New Promotion'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-cream-100"><Icon name="x" size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={lbl}>Title</label>
                  <input className={inp} placeholder="e.g. Happy Hour 20% Off" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
                </div>
                <div>
                  <label className={lbl}>Description</label>
                  <textarea className={inp + ' resize-none h-20'} placeholder="Brief description for customers..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Type</label>
                    <select className={inp} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as any}))}>
                      <option value="percent">Percentage Off</option>
                      <option value="flat">Flat Discount ($)</option>
                      <option value="bogo">Buy One Get One</option>
                    </select>
                  </div>
                  {form.type !== 'bogo' && (
                    <div>
                      <label className={lbl}>{form.type === 'percent' ? 'Discount %' : 'Amount ($)'}</label>
                      <input className={inp} type="number" min="1" value={form.value}
                        onChange={e => setForm(f => ({...f, value: Number(e.target.value)}))} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Coupon Code</label>
                    <div className="flex gap-2">
                      <input className={inp} placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} />
                      <button onClick={() => setForm(f => ({...f, code: genCode()}))} className="px-3 rounded-xl bg-cream-100 text-stone-500 hover:bg-cream-200 text-xs font-bold border border-cream-200">Auto</button>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Max Redeemptions</label>
                    <input className={inp} type="number" min="1" value={form.maxUsage} onChange={e => setForm(f => ({...f, maxUsage: Number(e.target.value)}))} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Valid Until</label>
                  <input className={inp} type="date" value={form.validUntil} onChange={e => setForm(f => ({...f, validUntil: e.target.value}))} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-cream-200 text-stone-600 font-bold text-sm hover:bg-cream-50">Cancel</button>
                <button onClick={save} className="flex-1 py-3 rounded-2xl bg-stone-800 text-white font-bold text-sm hover:bg-stone-900 shadow-sm">
                  {editId ? 'Save Changes' : 'Create Promotion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
