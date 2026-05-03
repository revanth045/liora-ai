import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

export type Theme   = 'light';
export type Accent  = 'saffron' | 'truffle' | 'sunset' | 'berry' | 'citrus' | 'espresso';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type Layout  = 'expanded' | 'collapsed';
export type Locale  = 'en' | 'es' | 'fr' | 'hi' | 'ar';

export interface BrandOverride {
  /** Optional custom hex (e.g. "#E85D2A") used when accent === 'custom' or to brand a specific restaurant */
  primaryHex?: string;
  logoUrl?: string;
  displayName?: string;
}

export interface Settings {
  theme: Theme;
  accent: Accent;
  density: Density;
  layout: Layout;
  locale: Locale;
  brand: BrandOverride;
  reducedMotion: boolean;
}

const DEFAULTS: Settings = {
  theme: 'light',
  accent: 'saffron',
  density: 'comfortable',
  layout: 'expanded',
  locale: 'en',
  brand: {},
  reducedMotion: false,
};

const STORAGE_KEY = 'liora-settings';

interface Ctx extends Settings {
  resolvedTheme: 'light';
  set:   <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  patch: (partial: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

function readStoredSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, theme: 'light', brand: { ...DEFAULTS.brand, ...(parsed.brand || {}) } };
  } catch {
    return DEFAULTS;
  }
}

function applyToDom(s: Settings, resolved: 'light') {
  const html = document.documentElement;
  html.dataset.theme   = resolved;
  html.dataset.accent  = s.accent;
  html.dataset.density = s.density;
  html.dataset.layout  = s.layout;
  html.dataset.locale  = s.locale;
  html.lang = s.locale;
  html.dir = s.locale === 'ar' ? 'rtl' : 'ltr';

  // Custom brand override → write CSS vars on the root scope
  if (s.brand.primaryHex) {
    const rgb = hexToRgb(s.brand.primaryHex);
    if (rgb) {
      const [r, g, b] = rgb;
      // produce a 9-shade ramp
      const shades = generateShades(r, g, b);
      Object.entries(shades).forEach(([k, v]) => html.style.setProperty(`--brand-${k}`, v));
    }
  } else {
    // clear any inline overrides — palette returns to [data-accent]
    ['50','100','200','300','400','500','600','700','800','900'].forEach(k => html.style.removeProperty(`--brand-${k}`));
  }
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([\da-f]{6}|[\da-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function generateShades(r: number, g: number, b: number): Record<string, string> {
  // simple lightness ramp around the chosen color
  const mix = (a: number, t: number) => Math.round(a + (255 - a) * t);
  const shade = (a: number, t: number) => Math.max(0, Math.round(a * (1 - t)));
  return {
    '50':  `${mix(r, 0.92)} ${mix(g, 0.92)} ${mix(b, 0.92)}`,
    '100': `${mix(r, 0.82)} ${mix(g, 0.82)} ${mix(b, 0.82)}`,
    '200': `${mix(r, 0.65)} ${mix(g, 0.65)} ${mix(b, 0.65)}`,
    '300': `${mix(r, 0.4)}  ${mix(g, 0.4)}  ${mix(b, 0.4)}`,
    '400': `${mix(r, 0.18)} ${mix(g, 0.18)} ${mix(b, 0.18)}`,
    '500': `${r} ${g} ${b}`,
    '600': `${shade(r, 0.15)} ${shade(g, 0.15)} ${shade(b, 0.15)}`,
    '700': `${shade(r, 0.32)} ${shade(g, 0.32)} ${shade(b, 0.32)}`,
    '800': `${shade(r, 0.5)}  ${shade(g, 0.5)}  ${shade(b, 0.5)}`,
    '900': `${shade(r, 0.68)} ${shade(g, 0.68)} ${shade(b, 0.68)}`,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readStoredSettings());
  const resolvedTheme: 'light' = 'light';

  // persist + sync to DOM
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, theme: 'light' })); } catch {}
    applyToDom(settings, resolvedTheme);
  }, [settings, resolvedTheme]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  const patch = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial, brand: { ...prev.brand, ...(partial.brand || {}) } }));
  }, []);
  const reset = useCallback(() => setSettings(DEFAULTS), []);

  const value = useMemo<Ctx>(() => ({ ...settings, resolvedTheme, set, patch, reset }), [settings, resolvedTheme, set, patch, reset]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

export const ACCENT_PRESETS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'saffron',  label: 'Saffron',  swatch: '#E85D2A' },
  { id: 'truffle',  label: 'Truffle',  swatch: '#1F8B5C' },
  { id: 'sunset',   label: 'Sunset',   swatch: '#F97318' },
  { id: 'berry',    label: 'Berry',    swatch: '#DB2777' },
  { id: 'citrus',   label: 'Citrus',   swatch: '#CA8A04' },
  { id: 'espresso', label: 'Espresso', swatch: '#875426' },
];

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: 'en', label: 'English',  native: 'English'  },
  { id: 'es', label: 'Spanish',  native: 'Español'  },
  { id: 'fr', label: 'French',   native: 'Français' },
  { id: 'hi', label: 'Hindi',    native: 'हिन्दी'   },
  { id: 'ar', label: 'Arabic',   native: 'العربية'  },
];
