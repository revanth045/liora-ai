import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { toast } from '../../lib/toast';
import {
  db_getOrCreateStaffCode,
  db_upsertRestaurant,
  type DayHours,
  type DemoRestaurant,
  type RestaurantTheme,
} from '../../demoDb';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DEFAULT_HOURS: DayHours[] = DAYS.map(() => ({ open: '11:00 AM', close: '10:00 PM', closed: false }));

function initHours(r: DemoRestaurant): DayHours[] {
  if (r.hours && r.hours.length === 7) return r.hours.map(h => ({ ...h }));
  return DEFAULT_HOURS.map(h => ({ ...h }));
}

type ThemePreset = {
  id: RestaurantTheme;
  label: string;
  description: string;
  brand: string;
  accent: string;
  swatchFrom: string;
  swatchTo: string;
};

const THEME_PRESETS: ThemePreset[] = [
  { id: 'forest',    label: 'Forest',    description: 'Deep green, golden accents — Michelin classic',
    brand: '#14532d', accent: '#d4a017', swatchFrom: '#14532d', swatchTo: '#d4a017' },
  { id: 'midnight',  label: 'Midnight',  description: 'Onyx black, electric copper — modern fine dining',
    brand: '#0a0a0a', accent: '#b8763d', swatchFrom: '#1c1917', swatchTo: '#b8763d' },
  { id: 'champagne', label: 'Champagne', description: 'Cream & gold — soft, opulent, timeless',
    brand: '#c9a96e', accent: '#7a5c2e', swatchFrom: '#f5e6c8', swatchTo: '#c9a96e' },
  { id: 'rose',      label: 'Rosé',      description: 'Romantic blush, burgundy — wine bars & bistros',
    brand: '#9d174d', accent: '#f472b6', swatchFrom: '#fce7f3', swatchTo: '#9d174d' },
  { id: 'sunset',    label: 'Sunset',    description: 'Warm amber & terracotta — bold & inviting',
    brand: '#ea580c', accent: '#fbbf24', swatchFrom: '#fbbf24', swatchTo: '#ea580c' },
  { id: 'minimal',   label: 'Minimal',   description: 'Stone & ivory — refined, gallery-style minimalism',
    brand: '#1c1917', accent: '#a8a29e', swatchFrom: '#f5f5f4', swatchTo: '#1c1917' },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function RestoVenueSettings({ restaurant }: { restaurant: DemoRestaurant }) {
  const [staffCode, setStaffCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState(restaurant.name ?? '');
  const [cuisine, setCuisine] = useState(restaurant.cuisine ?? '');
  const [bio, setBio] = useState(restaurant.bio ?? '');
  const [address, setAddress] = useState(restaurant.address ?? '');
  const [zip, setZip] = useState(restaurant.zip ?? '');
  const [phone, setPhone] = useState(restaurant.phone ?? '');
  const [website, setWebsite] = useState(restaurant.website ?? '');

  // Brand state
  const [logoUrl, setLogoUrl] = useState(restaurant.logoUrl ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(restaurant.heroImageUrl ?? '');
  const [tagline, setTagline] = useState(restaurant.tagline ?? '');
  const [brandColor, setBrandColor] = useState(restaurant.brandColor ?? '#ea580c');
  const [accentColor, setAccentColor] = useState(restaurant.accentColor ?? '#d4a017');
  const [theme, setTheme] = useState<RestaurantTheme>(restaurant.theme ?? 'forest');

  // Payments state
  const [acceptsPrepay, setAcceptsPrepay] = useState<boolean>(restaurant.acceptsPrepay ?? true);

  // Hours state
  const [hours, setHours] = useState<DayHours[]>(initHours(restaurant));

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setStaffCode(db_getOrCreateStaffCode(restaurant.id)); }, [restaurant.id]);

  useEffect(() => {
    setName(restaurant.name ?? '');
    setCuisine(restaurant.cuisine ?? '');
    setBio(restaurant.bio ?? '');
    setAddress(restaurant.address ?? '');
    setZip(restaurant.zip ?? '');
    setPhone(restaurant.phone ?? '');
    setWebsite(restaurant.website ?? '');
    setLogoUrl(restaurant.logoUrl ?? '');
    setHeroImageUrl(restaurant.heroImageUrl ?? '');
    setTagline(restaurant.tagline ?? '');
    setBrandColor(restaurant.brandColor ?? '#ea580c');
    setAccentColor(restaurant.accentColor ?? '#d4a017');
    setTheme(restaurant.theme ?? 'forest');
    setAcceptsPrepay(restaurant.acceptsPrepay ?? true);
    setHours(initHours(restaurant));
  }, [restaurant.id]);

  const toggleDay = (i: number) => setHours(prev => prev.map((h, idx) => idx === i ? { ...h, closed: !h.closed } : h));
  const setOpen = (i: number, val: string) => setHours(prev => prev.map((h, idx) => idx === i ? { ...h, open: val } : h));
  const setClose = (i: number, val: string) => setHours(prev => prev.map((h, idx) => idx === i ? { ...h, close: val } : h));

  const handleSave = () => {
    db_upsertRestaurant({
      ...restaurant,
      name, cuisine, bio, address, zip: zip.trim() || undefined, phone, website, hours,
      logoUrl: logoUrl || undefined,
      heroImageUrl: heroImageUrl || undefined,
      tagline: tagline || undefined,
      brandColor, accentColor, theme,
      acceptsPrepay,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDiscard = () => {
    setName(restaurant.name ?? '');
    setCuisine(restaurant.cuisine ?? '');
    setBio(restaurant.bio ?? '');
    setAddress(restaurant.address ?? '');
    setZip(restaurant.zip ?? '');
    setPhone(restaurant.phone ?? '');
    setWebsite(restaurant.website ?? '');
    setLogoUrl(restaurant.logoUrl ?? '');
    setHeroImageUrl(restaurant.heroImageUrl ?? '');
    setTagline(restaurant.tagline ?? '');
    setBrandColor(restaurant.brandColor ?? '#ea580c');
    setAccentColor(restaurant.accentColor ?? '#d4a017');
    setTheme(restaurant.theme ?? 'forest');
    setAcceptsPrepay(restaurant.acceptsPrepay ?? true);
    setHours(initHours(restaurant));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(staffCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return; }
    setLogoUrl(await readFileAsDataUrl(f));
  };
  const onHeroFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error('Cover image must be under 4 MB'); return; }
    setHeroImageUrl(await readFileAsDataUrl(f));
  };

  const applyTheme = (preset: ThemePreset) => {
    setTheme(preset.id);
    setBrandColor(preset.brand);
    setAccentColor(preset.accent);
  };

  const inputCls = "w-full p-4 bg-cream-50/50 rounded-2xl text-stone-900 outline-none font-bold border border-transparent focus:border-brand-400/40 focus:bg-white transition-all shadow-sm";
  const labelCls = "block text-[10px] font-bold text-stone-700 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-page-slide pb-24">

      {/* ===================== BRAND & THEME ===================== */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-cream-200 bg-gradient-to-r from-cream-100/70 to-cream-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow">
            <Icon name="palette" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-lora text-2xl text-stone-900 font-bold leading-tight">Brand & Theme</h3>
            <p className="text-stone-700 text-sm font-medium">Make the portal feel unmistakably yours — logo, colors, cover image and tone.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Logo + Hero */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* LOGO */}
            <div>
              <label className={labelCls}>Restaurant Logo</label>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoFile} className="hidden" />
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-28 h-28 rounded-3xl bg-cream-50 border-2 border-dashed border-cream-200 hover:border-brand-400 hover:bg-cream-100 transition-all flex items-center justify-center overflow-hidden flex-shrink-0 group relative"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-stone-700 group-hover:text-brand-600 transition-colors">
                      <Icon name="add_photo_alternate" size={28} className="mx-auto mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors flex items-center gap-2">
                    <Icon name="upload" size={14} /> {logoUrl ? 'Replace logo' : 'Upload logo'}
                  </button>
                  {logoUrl && (
                    <button type="button" onClick={() => setLogoUrl('')}
                      className="px-4 py-2 rounded-xl border border-cream-200 text-stone-700 text-xs font-bold hover:bg-cream-50 transition-colors flex items-center gap-2">
                      <Icon name="delete" size={14} /> Remove
                    </button>
                  )}
                  <p className="text-[11px] text-stone-700 font-medium">PNG or SVG, square ratio. Max 2 MB.</p>
                </div>
              </div>
            </div>

            {/* HERO IMAGE */}
            <div>
              <label className={labelCls}>Cover / Hero Image</label>
              <input ref={heroInputRef} type="file" accept="image/*" onChange={onHeroFile} className="hidden" />
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                className="w-full h-28 rounded-3xl bg-cream-50 border-2 border-dashed border-cream-200 hover:border-brand-400 hover:bg-cream-100 transition-all flex items-center justify-center overflow-hidden group relative"
              >
                {heroImageUrl ? (
                  <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-stone-700 group-hover:text-brand-600 transition-colors">
                    <Icon name="image" size={28} className="mx-auto mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Upload cover</span>
                  </div>
                )}
              </button>
              {heroImageUrl && (
                <button type="button" onClick={() => setHeroImageUrl('')}
                  className="mt-2 text-xs font-bold text-stone-700 hover:text-brand-600 underline">Remove cover</button>
              )}
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className={labelCls}>Tagline</label>
            <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="e.g. The art of slow dining"
              className={inputCls} />
            <p className="text-[11px] text-stone-700 font-medium mt-2 ml-1">Shown under your venue name in the sidebar and on your menu.</p>
          </div>

          {/* Theme presets */}
          <div>
            <label className={labelCls}>Theme Preset</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {THEME_PRESETS.map(p => {
                const active = theme === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => applyTheme(p)}
                    className={`group text-left p-4 rounded-2xl border-2 transition-all ${
                      active
                        ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-amber-50 shadow-md'
                        : 'border-cream-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl shadow-inner ring-1 ring-stone-900/10"
                           style={{ background: `linear-gradient(135deg, ${p.swatchFrom}, ${p.swatchTo})` }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 text-sm leading-tight">{p.label}</p>
                        <p className="text-[11px] text-stone-700 font-medium leading-snug truncate">{p.description}</p>
                      </div>
                      {active && (
                        <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0">
                          <Icon name="check" size={14} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  className="w-14 h-14 rounded-2xl border border-cream-200 cursor-pointer bg-white" />
                <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  className="flex-1 p-4 bg-cream-50/50 rounded-2xl text-stone-900 font-mono font-bold uppercase outline-none border border-transparent focus:border-brand-400/40 focus:bg-white transition-all" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Accent Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="w-14 h-14 rounded-2xl border border-cream-200 cursor-pointer bg-white" />
                <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="flex-1 p-4 bg-cream-50/50 rounded-2xl text-stone-900 font-mono font-bold uppercase outline-none border border-transparent focus:border-brand-400/40 focus:bg-white transition-all" />
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div>
            <label className={labelCls}>Live Preview</label>
            <div className="rounded-3xl overflow-hidden border border-cream-200 shadow-md">
              <div className="relative h-32 overflow-hidden"
                   style={{ background: heroImageUrl
                     ? `url(${heroImageUrl}) center/cover`
                     : `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brandColor}cc, ${accentColor}55)` }} />
                <div className="relative h-full flex items-center gap-4 px-6">
                  {logoUrl ? (
                    <img src={logoUrl} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/40 shadow-lg" alt="" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-white font-display text-2xl font-bold">
                      {(name || 'L').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-white">
                    <h4 className="font-display text-2xl font-semibold tracking-tight drop-shadow">{name || 'Your Venue'}</h4>
                    {tagline && <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/95 drop-shadow">{tagline}</p>}
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Sample CTA</span>
                <button type="button" className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
                  Reserve a table →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PROFILE ===================== */}
      <div className="bg-white p-8 rounded-[2rem] border border-cream-200 shadow-sm">
        <h3 className="font-lora text-2xl text-stone-900 mb-2 font-bold">Venue Profile</h3>
        <p className="text-stone-700 text-sm font-medium mb-7">The basics — what guests see when they discover your venue.</p>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Restaurant Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cuisine Type</label>
              <input type="text" value={cuisine} onChange={e => setCuisine(e.target.value)}
                placeholder="e.g. Modern American, Bistro..." className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 000-0000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..." className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
            <div>
              <label className={labelCls}>Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, City, State" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ZIP / Postal code</label>
              <input type="text" value={zip} onChange={e => setZip(e.target.value)}
                placeholder="e.g. 10001" maxLength={12} className={inputCls} />
              <p className="text-[11px] text-stone-500 mt-1.5">Powers Date Night nearby-hotel suggestions.</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Bio / Story</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell guests your story..."
              className={`${inputCls} min-h-[120px] resize-none`} />
          </div>
        </div>
      </div>

      {/* ===================== PAYMENTS ===================== */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-cream-200 bg-gradient-to-r from-cream-100/70 to-cream-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow">
            <Icon name="credit_card" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-lora text-2xl text-stone-900 font-bold leading-tight">Payments</h3>
            <p className="text-stone-700 text-sm font-medium">Let guests pre-pay with the card on file when they place an order — funds settle straight to your venue, no cheque at the end of the meal.</p>
          </div>
        </div>
        <div className="p-8">
          <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${acceptsPrepay ? 'border-emerald-500 bg-emerald-50/40' : 'border-cream-200 bg-cream-50/40'}`}>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 text-base leading-tight">Accept pre-pay (auto-charge card on file)</p>
              <p className="text-stone-700 text-sm font-medium mt-1 leading-relaxed">
                When enabled, guests will see a “Pre-pay now” option at checkout. Their card is charged the moment they place the order and the money is routed directly to your venue.
              </p>
              <p className="text-[11px] text-stone-700 font-medium mt-2 italic">
                Routing rules and split percentages will be configured by you separately — this only enables the option for guests.
              </p>
            </div>
            <button type="button" onClick={() => setAcceptsPrepay(v => !v)}
              aria-label={acceptsPrepay ? 'Disable pre-pay' : 'Enable pre-pay'}
              className={`w-12 h-6 rounded-full relative transition-colors shadow-inner flex-shrink-0 mt-1 ${acceptsPrepay ? 'bg-emerald-500' : 'bg-cream-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${acceptsPrepay ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== HOURS ===================== */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-cream-200 bg-cream-100/50">
          <h3 className="font-lora text-2xl text-stone-900 font-bold">Hours & Operations</h3>
          <p className="text-stone-700 text-sm font-medium mt-1">Toggle a day off to mark it closed. Changes save with the Save button.</p>
        </div>
        <div className="p-6 space-y-2 bg-white/50">
          {DAYS.map((day, i) => (
            <div key={day} className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
              hours[i].closed ? 'opacity-60 bg-cream-50/30 border-transparent'
                              : 'hover:bg-white border-transparent hover:border-cream-200/40 group'
            }`}>
              <span className={`font-bold w-32 transition-colors ${hours[i].closed ? 'text-stone-700' : 'text-stone-900 group-hover:text-brand-600'}`}>{day}</span>
              <div className="flex items-center gap-4">
                {hours[i].closed ? (
                  <span className="text-xs font-bold text-stone-700 italic w-[13rem] text-center">Closed</span>
                ) : (
                  <>
                    <input type="text" value={hours[i].open} onChange={e => setOpen(i, e.target.value)}
                      className="p-2.5 bg-white border border-cream-200 rounded-xl text-xs font-bold text-stone-900 text-center w-28 shadow-sm focus:ring-1 focus:ring-brand-400 outline-none" />
                    <span className="text-stone-700 font-bold">–</span>
                    <input type="text" value={hours[i].close} onChange={e => setClose(i, e.target.value)}
                      className="p-2.5 bg-white border border-cream-200 rounded-xl text-xs font-bold text-stone-900 text-center w-28 shadow-sm focus:ring-1 focus:ring-brand-400 outline-none" />
                  </>
                )}
              </div>
              <button type="button" onClick={() => toggleDay(i)}
                aria-label={hours[i].closed ? `Mark ${day} open` : `Mark ${day} closed`}
                className={`w-12 h-6 rounded-full relative transition-colors shadow-inner flex-shrink-0 ${!hours[i].closed ? 'bg-brand-500' : 'bg-cream-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${!hours[i].closed ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===================== STAFF ACCESS ===================== */}
      <div className="bg-white rounded-[2rem] border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-cream-200 bg-cream-100/50">
          <h3 className="font-lora text-2xl text-stone-900 font-bold">Staff Access</h3>
          <p className="text-stone-700 text-sm font-medium mt-1">Share this code with your front-of-house staff so they can register for Service Desk access.</p>
        </div>
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center w-full">
              <p className="text-[10px] font-bold text-stone-700 uppercase tracking-widest mb-2">Staff Access Code</p>
              <p className="font-mono text-4xl font-bold tracking-[0.3em] text-stone-900">{staffCode || '------'}</p>
            </div>
            <button onClick={copyCode}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                copied ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                       : 'bg-white border-cream-200 text-stone-800 hover:bg-cream-50'
              }`}>
              <Icon name={copied ? 'check' : 'content_copy'} size={16} />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Icon name="info" size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">How it works</p>
              <p className="mt-0.5 font-medium">Staff go to the restaurant login, choose <strong>Service Desk → Join with Code</strong>, and enter this code to link to your venue. They will only see order management — not financials or settings.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ACTIONS ===================== */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 sticky bottom-4 z-10">
        <button type="button" onClick={handleDiscard}
          className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-700 hover:text-stone-900 transition-colors active:scale-95">
          Discard Changes
        </button>
        <button type="button" onClick={handleSave}
          className={`px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
            saved ? 'bg-emerald-500 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'
          }`}>
          <Icon name={saved ? 'check_circle' : 'check'} size={16} />
          {saved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
