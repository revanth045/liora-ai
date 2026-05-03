import React, { useEffect } from 'react';
import { useSettings, ACCENT_PRESETS, LOCALES, type Density, type Layout, type Locale } from '../context/SettingsContext';
import { t } from '../lib/i18n';

interface Props { open: boolean; onClose: () => void; }

export default function SettingsPanel({ open, onClose }: Props) {
  const s = useSettings();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
      {/* backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <aside className="relative w-full max-w-md h-full bg-app-elev border-l border-cream-200 shadow-2xl flex flex-col animate-page-slide">
        <header className="px-6 py-5 border-b border-cream-200 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl text-stone-900 tracking-tight">{t(s.locale, 'settings.title')}</h2>
            <p className="text-xs text-stone-600 mt-0.5">{t(s.locale, 'settings.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t(s.locale, 'common.close')}
            className="p-2 rounded-full text-stone-600 hover:bg-cream-100 hover:text-stone-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* Accent */}
          <Section title={t(s.locale, 'settings.accent')}>
            <div className="grid grid-cols-3 gap-3">
              {ACCENT_PRESETS.map(a => (
                <button
                  key={a.id}
                  onClick={() => { s.set('accent', a.id); s.patch({ brand: { ...s.brand, primaryHex: undefined } }); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    s.accent === a.id && !s.brand.primaryHex
                      ? 'border-stone-900 bg-stone-100 dark:border-stone-700'
                      : 'border-cream-200 hover:border-cream-300 bg-cream-50'
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full ring-2 ring-white shadow-pop"
                    style={{ background: `linear-gradient(135deg, ${a.swatch}, ${a.swatch}cc)` }}
                  />
                  <span className="text-[11px] font-semibold text-stone-700">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Custom hex */}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">{t(s.locale, 'settings.accent.custom')}</label>
              <input
                type="color"
                value={s.brand.primaryHex || '#E85D2A'}
                onChange={e => s.patch({ brand: { ...s.brand, primaryHex: e.target.value } })}
                className="w-12 h-9 rounded-lg cursor-pointer border border-cream-200 bg-transparent"
              />
              <input
                type="text"
                placeholder="#E85D2A"
                value={s.brand.primaryHex || ''}
                onChange={e => s.patch({ brand: { ...s.brand, primaryHex: e.target.value } })}
                className="input flex-1 font-mono text-xs"
              />
              {s.brand.primaryHex && (
                <button onClick={() => s.patch({ brand: { ...s.brand, primaryHex: undefined } })} className="text-xs text-stone-600 hover:text-brand-500">Clear</button>
              )}
            </div>
          </Section>

          {/* Density */}
          <Section title={t(s.locale, 'settings.density')}>
            <SegRow
              value={s.density}
              onChange={(v: Density) => s.set('density', v)}
              options={[
                { id: 'compact',     label: t(s.locale, 'settings.density.compact') },
                { id: 'comfortable', label: t(s.locale, 'settings.density.comfortable') },
                { id: 'spacious',    label: t(s.locale, 'settings.density.spacious') },
              ]}
            />
          </Section>

          {/* Layout */}
          <Section title={t(s.locale, 'settings.layout')}>
            <SegRow
              value={s.layout}
              onChange={(v: Layout) => s.set('layout', v)}
              options={[
                { id: 'expanded',  label: t(s.locale, 'settings.layout.expanded') },
                { id: 'collapsed', label: t(s.locale, 'settings.layout.collapsed') },
              ]}
            />
          </Section>

          {/* Locale */}
          <Section title={t(s.locale, 'settings.locale')}>
            <div className="grid grid-cols-2 gap-2">
              {LOCALES.map(l => (
                <button
                  key={l.id}
                  onClick={() => s.set('locale', l.id as Locale)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-colors ${
                    s.locale === l.id
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'bg-cream-50 text-stone-700 hover:bg-cream-100 border border-cream-200'
                  }`}
                >
                  <span className="font-semibold">{l.native}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${s.locale === l.id ? 'text-white/70' : 'text-stone-600'}`}>{l.id}</span>
                </button>
              ))}
            </div>
          </Section>

        </div>

        <footer className="p-4 border-t border-cream-200 flex items-center justify-between">
          <button onClick={s.reset} className="btn-ghost text-xs">{t(s.locale, 'settings.reset')}</button>
          <button onClick={onClose} className="btn-primary">{t(s.locale, 'common.save')}</button>
        </footer>
      </aside>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-bold text-stone-600 uppercase tracking-[0.18em] mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-stone-600 mb-3">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

function SegRow<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: string }[];
}) {
  return (
    <div className="grid gap-1.5 p-1 rounded-2xl bg-cream-100 border border-cream-200" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              active ? 'bg-white text-stone-900 shadow-pop' : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            {o.icon && <SegIcon name={o.icon} />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegIcon({ name }: { name: string }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'sun')     return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
  return null;
}
