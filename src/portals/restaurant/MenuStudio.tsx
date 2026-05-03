import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '../../../components/Icon';
import { toast } from '../../lib/toast';
import {
  db_listMenu, db_addMenu, db_updateMenu, db_deleteMenu, db_upsertRestaurant,
  type DemoMenuItem, type DemoRestaurant, type MenuMeta,
} from '../../demoDb';
import { getMenuTheme, MENU_FONTS, PRESET_PALETTES, dividerGlyph } from '../../lib/menuTheme';

// --- Types --------------------------------------------------------------------
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

// --- Helpers ------------------------------------------------------------------
function fmtPrice(cents: number) { return `$${(cents / 100).toFixed(2)}`; }
function parseCents(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) || n < 0 ? null : Math.round(n * 100);
}
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// --- Modal Input helpers -------------------------------------------------------
const FieldWrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-stone-900 text-sm font-medium focus:outline-none focus:border-forest-900/30 focus:bg-white transition-colors";

// --- Item Form Modal -----------------------------------------------------------
function ItemModal({ title, form, onChange, onSave, onClose, saving }: {
  title: string; form: ItemForm; onChange: (f: ItemForm) => void;
  onSave: () => void; onClose: () => void; saving: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-100">
          <h3 className="font-lora text-lg font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-100 text-stone-700 transition-colors">
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
              rows={3} placeholder="Short description of the dish..."
              className={`${inputCls} resize-none`} />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Price (USD) *">
              <input type="text" value={form.priceCents} onChange={e => onChange({ ...form, priceCents: e.target.value })}
                placeholder="0.00" className={inputCls} />
            </FieldWrap>
            <FieldWrap label="Section / Category">
              <>
                <input list="cat-list" value={form.category} onChange={e => onChange({ ...form, category: e.target.value })}
                  placeholder="Type any name..." className={inputCls} />
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
              <p className="text-sm font-bold text-stone-900">Available on menu</p>
              <p className="text-xs text-stone-700 mt-0.5 font-medium">Customers can see and order this item</p>
            </div>
            <button onClick={() => onChange({ ...form, available: !form.available })}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.available ? 'bg-forest-900' : 'bg-stone-200'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.available ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-cream-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-cream-200 text-stone-800 text-sm font-bold hover:bg-cream-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving || !form.name.trim() || !form.priceCents.trim()}
            className="px-6 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-bold disabled:opacity-50 hover:bg-forest-900/90 transition-colors flex items-center gap-2">
            {saving ? <><Icon name="refresh" size={14} className="animate-spin" /> Saving...</> : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirm ------------------------------------------------------------
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="delete" size={22} className="text-red-500" />
        </div>
        <h3 className="font-lora text-lg font-bold text-stone-900 mb-2">Remove "{name}"?</h3>
        <p className="text-stone-700 text-sm font-medium mb-6">This item will be permanently removed from your menu and cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-stone-800 font-bold text-sm hover:bg-cream-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

// --- Design Studio Helpers ----------------------------------------------------
const StudioField = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-stone-600 font-medium">{hint}</p>}
  </div>
);

function ColorRow({ label, value, fallback, onChange }: { label: string; value?: string; fallback: string; onChange: (v: string) => void }) {
  const v = value ?? fallback;
  return (
    <StudioField label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={v} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-cream-200 cursor-pointer bg-white shrink-0" />
        <input type="text" value={v} onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-cream-200 bg-white text-stone-900 text-xs font-mono uppercase focus:outline-none focus:border-forest-900/40" />
      </div>
    </StudioField>
  );
}

function ChipRow<T extends string>({ value, options, onChange }: {
  value: T | undefined; options: { v: T; label: string; icon?: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            value === o.v
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white text-stone-800 border-cream-200 hover:border-stone-400'
          }`}>
          {o.icon && <Icon name={o.icon} size={12} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// --- Full Design Studio Modal --------------------------------------------------
type StudioTab = 'preset' | 'header' | 'typography' | 'colors' | 'background' | 'layout' | 'sections';

function MenuDesignStudio({ meta, restaurantName, onSave, onClose }: {
  meta: MenuMeta; restaurantName: string; onSave: (m: MenuMeta) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<MenuMeta>({ ...meta });
  const [tab, setTab] = useState<StudioTab>('preset');
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<MenuMeta>) => setDraft(d => ({ ...d, ...patch }));

  const theme = useMemo(() => getMenuTheme(draft), [draft]);

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return; }
    set({ logoUrl: await readFileAsDataUrl(f) });
  };
  const onBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error('Background must be under 4 MB'); return; }
    set({ bgImageUrl: await readFileAsDataUrl(f), bgKind: 'image' });
  };

  const fontGroups = useMemo(() => {
    const groups: Record<string, typeof MENU_FONTS> = {};
    MENU_FONTS.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
    return groups;
  }, []);

  const TABS: { id: StudioTab; label: string; icon: string }[] = [
    { id: 'preset',     label: 'Presets',     icon: 'sparkles' },
    { id: 'header',     label: 'Header',      icon: 'image' },
    { id: 'typography', label: 'Typography',  icon: 'type' },
    { id: 'colors',     label: 'Colors',      icon: 'palette' },
    { id: 'background', label: 'Background',  icon: 'layers' },
    { id: 'layout',     label: 'Layout',      icon: 'grid' },
    { id: 'sections',   label: 'Sections',    icon: 'list' },
  ];

  const FontPicker = ({ value, onChange, label }: { value: MenuMeta['titleFont']; onChange: (f: MenuMeta['titleFont']) => void; label: string }) => (
    <StudioField label={label}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
        {(Object.entries(fontGroups) as Array<[string, Array<{ value: any; label: string; sample: string }>]>).map(([grp, fonts]) => (
          <React.Fragment key={grp}>
            <div className="col-span-full text-[10px] font-bold uppercase tracking-widest text-stone-700 pt-1 pb-0.5">{grp}</div>
            {fonts.map(f => (
              <button key={f.value} type="button" onClick={() => onChange(f.value)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  value === f.value ? 'border-stone-900 bg-stone-50 shadow' : 'border-cream-200 bg-white hover:border-stone-400'
                }`} style={{ fontFamily: `"${f.value}", serif` }}>
                <div className="text-2xl leading-none mb-1 text-stone-900">{f.sample}</div>
                <div className="text-[10px] font-bold text-stone-700 truncate">{f.label}</div>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </StudioField>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="bg-cream-50 w-full sm:max-w-6xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row max-h-screen sm:max-h-[94vh] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Sidebar */}
        <aside className="w-full sm:w-56 bg-white border-b sm:border-b-0 sm:border-r border-cream-200 flex flex-col">
          <div className="px-5 py-5 border-b border-cream-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Menu Studio</p>
              <h3 className="font-lora text-base font-bold text-stone-900 leading-tight">Design Studio</h3>
            </div>
            <button onClick={onClose} className="sm:hidden p-2 rounded-lg hover:bg-cream-100 text-stone-700"><Icon name="close" size={18} /></button>
          </div>
          <nav className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible p-2 gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-800 hover:bg-cream-100'
                }`}>
                <Icon name={t.icon} size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="hidden sm:block mt-auto p-3 text-[10px] text-stone-700 font-medium border-t border-cream-100">
            Changes are saved per restaurant.
          </div>
        </aside>

        {/* Main editor */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="hidden sm:flex items-center justify-between px-7 py-4 border-b border-cream-200 bg-white">
            <h2 className="font-lora text-lg font-bold text-stone-900">{TABS.find(t => t.id === tab)?.label}</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-100 text-stone-700"><Icon name="close" size={18} /></button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">

            {tab === 'preset' && (
              <div>
                <p className="text-xs text-stone-700 font-medium mb-4">Start from a curated palette — fine-tune anything afterwards.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PRESET_PALETTES.map(p => (
                    <button key={p.name} type="button" onClick={() => set(p.meta)}
                      className="text-left rounded-2xl overflow-hidden border-2 border-cream-200 hover:border-stone-900 transition-all group">
                      <div className="h-24 relative" style={{ background: p.meta.backgroundColor }}>
                        <div className="absolute top-2 left-2 right-2 flex gap-1.5">
                          {[p.meta.accentColor, p.meta.headingColor, p.meta.priceColor, p.meta.borderColor].map((c, i) =>
                            <span key={i} className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ background: c }} />
                          )}
                        </div>
                        <div className="absolute bottom-2 left-3 right-3" style={{ color: p.meta.headingColor, fontFamily: '"Fraunces", serif' }}>
                          <span className="text-lg font-bold">Aa</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-white">
                        <p className="text-xs font-bold text-stone-900">{p.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'header' && (
              <div className="space-y-5">
                <StudioField label="Menu Logo">
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => logoRef.current?.click()}
                      className="w-20 h-20 rounded-2xl bg-cream-50 border-2 border-dashed border-cream-200 hover:border-stone-400 flex items-center justify-center overflow-hidden">
                      {draft.logoUrl ? <img src={draft.logoUrl} className="w-full h-full object-cover" alt="" /> : <Icon name="add_photo_alternate" size={22} className="text-stone-700" />}
                    </button>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => logoRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 flex items-center gap-2 w-fit">
                        <Icon name="upload" size={14} /> {draft.logoUrl ? 'Replace logo' : 'Upload logo'}
                      </button>
                      {draft.logoUrl && (
                        <button type="button" onClick={() => set({ logoUrl: undefined })}
                          className="text-xs font-bold text-stone-700 hover:text-red-600 underline w-fit">Remove</button>
                      )}
                    </div>
                  </div>
                </StudioField>

                <StudioField label="Menu Title">
                  <input type="text" value={draft.title ?? ''} onChange={e => set({ title: e.target.value })}
                    placeholder={`The ${restaurantName} Menu`} className={inputCls} />
                </StudioField>

                <StudioField label="Subtitle / Story">
                  <textarea value={draft.subtitle ?? ''} onChange={e => set({ subtitle: e.target.value })}
                    rows={2} placeholder="A short line under the title…" className={`${inputCls} resize-none`} />
                </StudioField>

                <div className="grid sm:grid-cols-2 gap-4">
                  <StudioField label="Header Style">
                    <ChipRow value={draft.headerStyle} onChange={v => set({ headerStyle: v })} options={[
                      { v: 'hero',    label: 'Hero' },
                      { v: 'banner',  label: 'Banner' },
                      { v: 'compact', label: 'Compact' },
                      { v: 'minimal', label: 'Minimal' },
                    ]} />
                  </StudioField>
                  <StudioField label="Alignment">
                    <ChipRow value={draft.headerAlign} onChange={v => set({ headerAlign: v })} options={[
                      { v: 'left',   label: 'Left' },
                      { v: 'center', label: 'Centered' },
                    ]} />
                  </StudioField>
                </div>
              </div>
            )}

            {tab === 'typography' && (
              <div className="space-y-6">
                <FontPicker label="Title & Headings" value={draft.titleFont} onChange={v => set({ titleFont: v })} />
                <FontPicker label="Body Text" value={draft.bodyFont} onChange={v => set({ bodyFont: v })} />
                <FontPicker label="Prices" value={draft.priceFont} onChange={v => set({ priceFont: v })} />
                <div className="grid sm:grid-cols-3 gap-4">
                  <StudioField label="Title Size">
                    <ChipRow value={draft.titleSize} onChange={v => set({ titleSize: v })} options={[
                      { v: 'sm', label: 'S' }, { v: 'md', label: 'M' }, { v: 'lg', label: 'L' }, { v: 'xl', label: 'XL' },
                    ]} />
                  </StudioField>
                  <StudioField label="Body Size">
                    <ChipRow value={draft.baseSize} onChange={v => set({ baseSize: v })} options={[
                      { v: 'sm', label: 'S' }, { v: 'md', label: 'M' }, { v: 'lg', label: 'L' }, { v: 'xl', label: 'XL' },
                    ]} />
                  </StudioField>
                  <StudioField label="Letter Spacing">
                    <ChipRow value={draft.letterSpacing} onChange={v => set({ letterSpacing: v })} options={[
                      { v: 'tight',  label: 'Tight' },
                      { v: 'normal', label: 'Normal' },
                      { v: 'wide',   label: 'Wide' },
                      { v: 'wider',  label: 'Wider' },
                    ]} />
                  </StudioField>
                </div>
              </div>
            )}

            {tab === 'colors' && (
              <div className="space-y-5">
                <p className="text-xs text-stone-700 font-medium">Choose every color individually. Use the eyedropper for brand-perfect matches.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <ColorRow label="Accent / Brand"   value={draft.accentColor}     fallback="#14532d" onChange={v => set({ accentColor: v })} />
                  <ColorRow label="Headings"         value={draft.headingColor}    fallback="#1c1917" onChange={v => set({ headingColor: v })} />
                  <ColorRow label="Body Text"        value={draft.textColor}       fallback="#1c1917" onChange={v => set({ textColor: v })} />
                  <ColorRow label="Prices"           value={draft.priceColor}      fallback={draft.accentColor || '#14532d'} onChange={v => set({ priceColor: v })} />
                  <ColorRow label="Page Background"  value={draft.backgroundColor} fallback="#fbf7ef" onChange={v => set({ backgroundColor: v })} />
                  <ColorRow label="Card Background"  value={draft.cardColor}       fallback="#ffffff" onChange={v => set({ cardColor: v })} />
                  <ColorRow label="Borders"          value={draft.borderColor}     fallback="#e7e0cf" onChange={v => set({ borderColor: v })} />
                </div>
              </div>
            )}

            {tab === 'background' && (
              <div className="space-y-5">
                <StudioField label="Background Style">
                  <ChipRow value={draft.bgKind} onChange={v => set({ bgKind: v })} options={[
                    { v: 'solid',    label: 'Solid' },
                    { v: 'gradient', label: 'Gradient' },
                    { v: 'paper',    label: 'Paper' },
                    { v: 'linen',    label: 'Linen' },
                    { v: 'noise',    label: 'Noise' },
                    { v: 'image',    label: 'Image' },
                  ]} />
                </StudioField>

                {(draft.bgKind === 'gradient') && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ColorRow label="Gradient Start" value={draft.bgGradientFrom} fallback={draft.backgroundColor || '#fbf7ef'} onChange={v => set({ bgGradientFrom: v })} />
                    <ColorRow label="Gradient End"   value={draft.bgGradientTo}   fallback={draft.accentColor || '#14532d'} onChange={v => set({ bgGradientTo: v })} />
                  </div>
                )}

                {draft.bgKind === 'image' && (
                  <StudioField label="Background Image" hint="The background gets a soft overlay so text stays readable.">
                    <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={onBgImage} />
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => bgRef.current?.click()}
                        className="w-32 h-20 rounded-xl bg-cream-50 border-2 border-dashed border-cream-200 hover:border-stone-400 flex items-center justify-center overflow-hidden">
                        {draft.bgImageUrl
                          ? <img src={draft.bgImageUrl} className="w-full h-full object-cover" alt="" />
                          : <Icon name="add_photo_alternate" size={22} className="text-stone-700" />}
                      </button>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => bgRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 w-fit">
                          {draft.bgImageUrl ? 'Replace image' : 'Upload image'}
                        </button>
                        {draft.bgImageUrl && (
                          <button type="button" onClick={() => set({ bgImageUrl: undefined })}
                            className="text-xs font-bold text-stone-700 hover:text-red-600 underline w-fit">Remove</button>
                        )}
                      </div>
                    </div>
                  </StudioField>
                )}
              </div>
            )}

            {tab === 'layout' && (
              <div className="space-y-5">
                <StudioField label="Overall Layout">
                  <ChipRow value={draft.layout} onChange={v => set({ layout: v })} options={[
                    { v: 'classic',   label: 'Classic' },
                    { v: 'editorial', label: 'Editorial' },
                    { v: 'magazine',  label: 'Magazine' },
                    { v: 'grid',      label: 'Grid' },
                    { v: 'minimal',   label: 'Minimal' },
                    { v: 'luxe',      label: 'Luxe' },
                  ]} />
                </StudioField>
                <div className="grid sm:grid-cols-2 gap-4">
                  <StudioField label="Item Card Style">
                    <ChipRow value={draft.cardStyle} onChange={v => set({ cardStyle: v })} options={[
                      { v: 'card', label: 'Card' },
                      { v: 'tile', label: 'Tile' },
                      { v: 'row',  label: 'Row' },
                      { v: 'list', label: 'List' },
                    ]} />
                  </StudioField>
                  <StudioField label="Image Shape">
                    <ChipRow value={draft.imageShape} onChange={v => set({ imageShape: v })} options={[
                      { v: 'circle',  label: 'Circle' },
                      { v: 'rounded', label: 'Rounded' },
                      { v: 'square',  label: 'Square' },
                      { v: 'none',    label: 'No image' },
                    ]} />
                  </StudioField>
                  <StudioField label="Section Divider">
                    <ChipRow value={draft.divider} onChange={v => set({ divider: v })} options={[
                      { v: 'line',   label: 'Line' },
                      { v: 'double', label: 'Double' },
                      { v: 'dots',   label: 'Dots' },
                      { v: 'ornate', label: 'Ornate' },
                      { v: 'none',   label: 'None' },
                    ]} />
                  </StudioField>
                  <StudioField label="Corner Radius">
                    <ChipRow value={draft.cornerRadius} onChange={v => set({ cornerRadius: v })} options={[
                      { v: 'none', label: 'Sharp' },
                      { v: 'sm',   label: 'Slight' },
                      { v: 'md',   label: 'Soft' },
                      { v: 'lg',   label: 'Rounded' },
                      { v: 'pill', label: 'Pill' },
                    ]} />
                  </StudioField>
                  <StudioField label="Spacing">
                    <ChipRow value={draft.spacing} onChange={v => set({ spacing: v })} options={[
                      { v: 'tight', label: 'Tight' },
                      { v: 'cozy',  label: 'Cozy' },
                      { v: 'roomy', label: 'Roomy' },
                      { v: 'airy',  label: 'Airy' },
                    ]} />
                  </StudioField>
                </div>
              </div>
            )}

            {tab === 'sections' && (
              <div className="space-y-5">
                <StudioField label="Show / Hide Elements" hint="Toggle what customers see on each item.">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['showDescriptions', 'Descriptions'],
                      ['showPrices',       'Prices'],
                      ['showTags',         'Tags & Badges'],
                      ['showDietaryIcons', 'Dietary icons'],
                    ] as const).map(([k, label]) => {
                      const on = draft[k] !== false;
                      return (
                        <button key={k} type="button" onClick={() => set({ [k]: !on } as Partial<MenuMeta>)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all ${
                            on ? 'border-stone-900 bg-stone-900 text-white' : 'border-cream-200 bg-white text-stone-800'
                          }`}>
                          <span className="text-xs font-bold">{label}</span>
                          <span className={`w-8 h-4 rounded-full relative transition-colors ${on ? 'bg-white/30' : 'bg-stone-200'}`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </StudioField>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-xs font-bold text-amber-900 mb-1">Section names</p>
                  <p className="text-xs text-amber-900/80 font-medium">Rename individual sections directly on the menu list — hover any section title and click the pencil.</p>
                </div>
              </div>
            )}

          </div>

          {/* Live preview strip */}
          <div className="border-t border-cream-200 bg-white px-5 sm:px-7 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">Live Preview</span>
              <span className="text-[10px] font-bold text-stone-700">Updates as you edit</span>
            </div>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: theme.colors.border, ...theme.css.page, padding: '20px' }}>
              <div className={`flex ${theme.headerAlign === 'center' ? 'flex-col items-center text-center' : 'items-center gap-4'}`}>
                {draft.logoUrl && <img src={draft.logoUrl} className="w-12 h-12 object-cover" style={{ borderRadius: theme.css.radius }} alt="" />}
                <div>
                  <h4 style={{ ...theme.css.title, fontSize: '24px', margin: 0 }}>{draft.title || `The ${restaurantName} Menu`}</h4>
                  {draft.subtitle && <p style={{ ...theme.css.description, fontSize: '12px', marginTop: 4 }}>{draft.subtitle}</p>}
                </div>
              </div>
              <div className="text-center my-3" style={{ color: theme.colors.accent, opacity: 0.7, letterSpacing: '0.4em', fontSize: 12 }}>{dividerGlyph(theme)}</div>
              <div style={{ ...theme.css.sectionLabel, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 8 }}>Mains</div>
              <div className="flex items-baseline justify-between" style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 8 }}>
                <div>
                  <div style={theme.css.itemName}>Aged Wagyu Sirloin</div>
                  <div style={{ ...theme.css.description, fontSize: 12 }}>Truffle butter, charred shallot, jus.</div>
                </div>
                <div style={theme.css.price}>$84</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-5 sm:px-7 py-3.5 border-t border-cream-200 bg-white flex gap-3 justify-between">
            <button onClick={() => setDraft({ sectionLabels: meta.sectionLabels, sectionOrder: meta.sectionOrder })}
              className="px-4 py-2.5 rounded-xl text-stone-800 text-xs font-bold hover:bg-cream-100">Reset all</button>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-cream-200 text-stone-800 text-sm font-bold hover:bg-cream-50">Cancel</button>
              <button onClick={() => onSave(draft)} className="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800">
                Save Menu Design
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// --- Main ----------------------------------------------------------------------
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
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Local override so UI reflects saves immediately even though `restaurant` is a prop.
  const [metaOverride, setMetaOverride] = useState<MenuMeta | null>(null);
  const meta: MenuMeta = metaOverride ?? restaurant.menuMeta ?? {};
  const accent = meta.accentColor ?? restaurant.brandColor ?? '#14532d';

  const load = () => setItems(db_listMenu(restaurant.id));
  useEffect(() => { load(); }, [restaurant.id]);
  // Reset override when switching to a different restaurant.
  useEffect(() => { setMetaOverride(null); }, [restaurant.id]);

  const persistMeta = (next: MenuMeta) => {
    const merged = { ...meta, ...next };
    db_upsertRestaurant({ ...restaurant, menuMeta: merged });
    setMetaOverride(merged);
    setShowHeaderEditor(false);
    setRenamingCat(null);
  };

  // resolve a category id (the raw tag) to its display label using meta.sectionLabels
  const labelFor = (catId: string) => meta.sectionLabels?.[catId] ?? catId;

  const allCats = useMemo(
    () => ['All', ...Array.from(new Set(items.map(i => i.tags?.[0] ?? 'Uncategorized')))],
    [items]
  );

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchQ = item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
    const matchCat = filterCat === 'All' || (item.tags?.[0] ?? 'Uncategorized') === filterCat;
    const matchA = filterAvail === 'all' ? true : filterAvail === 'available' ? item.available : !item.available;
    return matchQ && matchCat && matchA;
  });

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

  const startRename = (catId: string) => {
    setRenamingCat(catId);
    setRenameValue(labelFor(catId));
  };
  const commitRename = () => {
    if (!renamingCat) return;
    const trimmed = renameValue.trim();
    const next = { ...(meta.sectionLabels ?? {}) };
    if (!trimmed || trimmed === renamingCat) {
      delete next[renamingCat]; // reset to original
    } else {
      next[renamingCat] = trimmed;
    }
    persistMeta({ sectionLabels: next });
  };

  const availCount = items.filter(i => i.available).length;
  const menuTitle = meta.title || `The ${restaurant.name} Menu`;
  const menuSubtitle = meta.subtitle || (restaurant.tagline ?? '');
  const theme = useMemo(() => getMenuTheme(meta), [meta]);

  return (
    <div className="max-w-6xl mx-auto animate-page-slide pb-20">

      {/* ============= CUSTOMIZABLE MENU HEADER ============= */}
      <div className="rounded-[2rem] overflow-hidden border border-cream-200 shadow-md mb-6 group relative">
        <div className="relative px-8 py-10 md:py-12 flex items-center gap-5"
             style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd 60%, ${accent}aa)` }}>
          <div className="absolute inset-0 opacity-15 mix-blend-overlay"
               style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.6), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,.4), transparent 40%)' }} />
          {(meta.logoUrl || restaurant.logoUrl) && (
            <img
              src={meta.logoUrl || restaurant.logoUrl}
              alt=""
              className="relative w-20 h-20 rounded-3xl object-cover ring-4 ring-white/30 shadow-2xl flex-shrink-0"
            />
          )}
          <div className="relative flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/90 drop-shadow mb-2">Menu Studio</p>
            <h1 className="font-lora text-3xl md:text-4xl font-bold text-white drop-shadow tracking-tight leading-tight">{menuTitle}</h1>
            {menuSubtitle && (
              <p className="text-sm md:text-base text-white/95 font-semibold mt-2 drop-shadow max-w-2xl">{menuSubtitle}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/95">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-300" />{availCount} available</span>
              <span>·</span>
              <span>{items.length} total</span>
              <span>·</span>
              <span>{Object.keys(grouped).length || allCats.length - 1} sections</span>
            </div>
          </div>
          <button
            onClick={() => setShowHeaderEditor(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-bold hover:bg-white/25 transition-all flex-shrink-0"
          >
            <Icon name="palette" size={14} /> Design Studio
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-700" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm text-stone-900 font-medium focus:outline-none focus:border-forest-900/30 transition-colors" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none">
            {allCats.map(c => <option key={c} value={c}>{c === 'All' ? 'All sections' : labelFor(c)}</option>)}
          </select>
          <select value={filterAvail} onChange={e => setFilterAvail(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm font-semibold text-stone-900 focus:outline-none">
            <option value="all">All items</option>
            <option value="available">Available</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
          <Icon name="add" size={16} /> Add Menu Item
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border border-cream-200">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="restaurant_menu" size={28} className="text-stone-700" />
          </div>
          <h3 className="font-lora text-xl font-bold text-stone-900 mb-2">No menu items yet</h3>
          <p className="text-stone-700 text-sm font-medium mb-6">Start building your menu by adding your first item.</p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-bold transition-colors"
            style={{ background: accent }}>
            <Icon name="add" size={16} /> Add First Item
          </button>
        </div>
      )}

      {/* No results */}
      {items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <Icon name="search_off" size={36} className="mx-auto mb-3 opacity-40 text-stone-700" />
          <p className="font-bold text-stone-800">No items match your filters</p>
          <button onClick={() => { setSearch(''); setFilterCat('All'); setFilterAvail('all'); }}
            className="mt-3 text-sm font-bold underline" style={{ color: accent }}>Clear filters</button>
        </div>
      )}

      {/* Themed preview area — owner sees exactly how the menu looks to customers */}
      {Object.keys(grouped).length > 0 && (
        <div className="rounded-3xl overflow-hidden border mb-8" style={{ borderColor: theme.colors.border }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: theme.colors.bg, borderBottom: `1px solid ${theme.colors.border}` }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.colors.accent }}>Live Menu Preview · as customers see it</span>
            <button onClick={() => setShowHeaderEditor(true)} className="text-[10px] font-bold uppercase tracking-widest underline" style={{ color: theme.colors.accent }}>Edit design</button>
          </div>
          <div className="px-6 py-7" style={theme.css.page}>
            {Object.keys(grouped).map(catId => {
              const isRenaming = renamingCat === catId;
              const display = labelFor(catId);
              const isCustom = !!meta.sectionLabels?.[catId];
              return (
                <div key={catId} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-4 group">
                    {isRenaming ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingCat(null); }}
                          className="flex-1 px-3 py-1.5 rounded-lg border bg-white text-stone-900 text-sm font-bold focus:outline-none"
                          style={{ borderColor: theme.colors.border }}
                        />
                        <button onClick={commitRename} className="px-3 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: theme.colors.accent }}>Save</button>
                        <button onClick={() => setRenamingCat(null)} className="px-3 py-1.5 rounded-lg border text-xs font-bold" style={{ borderColor: theme.colors.border, color: theme.colors.text }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-sm uppercase font-bold" style={{ ...theme.css.sectionLabel, letterSpacing: '0.25em' }}>{display}</h2>
                        {isCustom && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${theme.colors.accent}22`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}55` }}>Custom</span>}
                        <button onClick={() => startRename(catId)} title="Rename section" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.colors.text, opacity: 0.6 }}>
                          <Icon name="edit" size={14} />
                        </button>
                        <span className="flex-1" style={{ color: theme.colors.accent, opacity: 0.5, textAlign: 'center', letterSpacing: '0.5em', fontSize: 11 }}>{dividerGlyph(theme)}</span>
                        <span className="text-xs font-bold" style={{ color: theme.colors.text, opacity: 0.6 }}>{grouped[catId].length}</span>
                      </>
                    )}
                  </div>
                  <div className="overflow-hidden divide-y" style={{ background: theme.colors.card, ...theme.css.card, borderWidth: 1, borderStyle: 'solid' }}>
                    {grouped[catId].map(item => {
                      const emoji = item.tags?.find(t => /^\p{Emoji}/u.test(t));
                      return (
                        <div key={item.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${!item.available ? 'opacity-60' : ''}`} style={{ borderColor: theme.colors.border }}>
                          {theme.imageShape !== 'none' && (
                            <div className="flex-shrink-0 flex items-center justify-center text-2xl"
                              style={{
                                width: 48, height: 48,
                                background: theme.colors.bg,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.imageShape === 'circle' ? '50%' : theme.imageShape === 'square' ? '4px' : '12px',
                              }}>{emoji || '🍽️'}</div>
                          )}
                          <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: item.available ? '#22c55e' : '#d6d3d1' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold" style={theme.css.itemName}>{item.name}</span>
                              {theme.show.tags && (item.tags ?? []).slice(1).filter(t => !/^\p{Emoji}/u.test(t)).map(t => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${theme.colors.accent}11`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}33` }}>{t}</span>
                              ))}
                            </div>
                            {theme.show.descriptions && item.description && <p className="text-xs mt-0.5 truncate max-w-lg" style={theme.css.description}>{item.description}</p>}
                          </div>
                          {theme.show.prices && <span className="text-base flex-shrink-0" style={theme.css.price}>{fmtPrice(item.priceCents)}</span>}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => toggleAvail(item)} title={item.available ? 'Hide' : 'Show'}
                              className="p-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: theme.colors.text, opacity: 0.7 }}>
                              <Icon name={item.available ? 'visibility' : 'visibility_off'} size={16} />
                            </button>
                            <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: theme.colors.text, opacity: 0.7 }}>
                              <Icon name="edit" size={16} />
                            </button>
                            <button onClick={() => setDeleteItem(item)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: theme.colors.text, opacity: 0.7 }}>
                              <Icon name="delete" size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && <ItemModal title="Add Menu Item" form={form} onChange={setForm} onSave={handleSaveNew} onClose={() => setShowAdd(false)} saving={saving} />}
      {editItem && <ItemModal title={`Edit — ${editItem.name}`} form={form} onChange={setForm} onSave={handleSaveEdit} onClose={() => setEditItem(null)} saving={saving} />}
      {deleteItem && <DeleteConfirm name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
      {showHeaderEditor && (
        <MenuDesignStudio
          meta={meta}
          restaurantName={restaurant.name}
          onSave={persistMeta}
          onClose={() => setShowHeaderEditor(false)}
        />
      )}
    </div>
  );
}
