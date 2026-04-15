import React, { useRef, useState } from 'react';
import { generateUserProfile } from '../services/geminiService';
import { OnboardingAnswers } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import { useUserProfile } from '../hooks/useUserProfile';

const ALLERGIES = [
  { id: 'peanuts', label: 'Peanuts / Tree Nuts' },
  { id: 'dairy', label: 'Dairy / Lactose' },
  { id: 'gluten', label: 'Gluten / Celiac' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'shellfish', label: 'Shellfish / Fish' },
  { id: 'soy', label: 'Soy' },
  { id: 'sesame', label: 'Sesame' },
];

const LIFESTYLES = [
  { id: '', label: 'No Preference', icon: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'keto', label: 'Keto / Low-Carb', icon: '🥩' },
  { id: 'paleo', label: 'Paleo', icon: '🦴' },
  { id: 'whole30', label: 'Whole30', icon: '🥗' },
];

const RELIGIOUS = [
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'noPork', label: 'No Pork' },
  { id: 'noBeef', label: 'No Beef' },
  { id: 'noAlcohol', label: 'No Alcohol in Preparation' },
];

const HEALTH = [
  { id: 'diabetic', label: 'Diabetic-Friendly' },
  { id: 'lowSodium', label: 'Low Sodium' },
  { id: 'lowFat', label: 'Low Fat' },
  { id: 'softFoods', label: 'Soft Foods Only' },
];

const POPULAR_CUISINES = ['Italian', 'Mexican', 'Thai', 'Japanese', 'Chinese', 'Indian', 'American', 'Mediterranean', 'Greek', 'Korean', 'Vietnamese', 'French'];
const SPICE_LABELS: Record<number, string> = { 1: 'Mild', 2: 'A little kick', 3: 'Just right', 4: 'Spicy!', 5: '🔥 Bring the heat!' };
const BUDGET_LABELS: Record<string, string> = { '$': 'Budget-friendly', '$$': 'Mid-range', '$$$': 'Fine dining' };

const LOADING_MESSAGES = [
  'Curating your culinary identity…',
  'Mapping your flavour profile…',
  'Personalising your Liora experience…',
  'Crafting your taste summary…',
];

const initialAnswers: OnboardingAnswers = {
  diet: { presets: [], custom: '' },
  cuisines: [],
  budget: '$$',
  spice: 3,
  avoid: '',
  vibe: 'Cozy and casual',
  allergies: [],
  severeAllergy: false,
  lifestyle: '',
  religious: [],
  customReligious: '',
  healthNeeds: [],
  notes: '',
  discountClaimed: false,
};

function CheckChip({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all select-none ${
        checked ? 'bg-forest-800 text-cream-50 border-forest-800 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-forest-700 hover:text-forest-800'
      }`}>
      {checked && <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
      {label}
    </button>
  );
}

function SectionCard({ step, title, subtitle, children }: { step: number; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="border border-cream-200 rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-100 bg-cream-50/60">
        <div className="w-7 h-7 rounded-full bg-forest-800 text-cream-50 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</div>
        <div>
          <h2 className="font-semibold text-stone-800 text-base leading-tight">{title}</h2>
          <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

interface OnboardingProps { onProfileCreated: () => void; }

export const Onboarding: React.FC<OnboardingProps> = ({ onProfileCreated }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialAnswers);
  const [customCuisine, setCustomCuisine] = useState('');
  const { profile, saveProfile, clearProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [showDiscount, setShowDiscount] = useState(false);
  const loadingRef = useRef<number | null>(null);

  const toggleArr = <T,>(arr: T[], item: T): T[] => arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  const set = (partial: Partial<OnboardingAnswers>) => setAnswers(prev => ({ ...prev, ...partial }));

  const buildLocalProfile = (ans: OnboardingAnswers) => {
    const lifestyle = ans.lifestyle ?? '';
    const allergenLabels: Record<string, string> = {
      peanuts: 'Peanuts / Tree Nuts', dairy: 'Dairy', gluten: 'Gluten', eggs: 'Eggs',
      shellfish: 'Shellfish', soy: 'Soy', sesame: 'Sesame', other: 'Other',
    };
    const allergens = (ans.allergies ?? []).map(a => allergenLabels[a] ?? a);
    const religiousLabels: Record<string, string> = {
      halal: 'Halal', kosher: 'Kosher', noPork: 'No Pork', noBeef: 'No Beef', noAlcohol: 'No Alcohol',
    };
    const religiousTags = (ans.religious ?? []).map(r => religiousLabels[r] ?? r);
    const healthLabels: Record<string, string> = {
      diabetic: 'Diabetic-Friendly', lowSodium: 'Low Sodium', lowFat: 'Low Fat', softFoods: 'Soft Foods Only',
    };
    const healthTags = (ans.healthNeeds ?? []).map(h => healthLabels[h] ?? h);
    const dietParts = [lifestyle, ...religiousTags, ...healthTags, ans.customReligious ?? ''].filter(Boolean);
    const summaryParts: string[] = [];
    if (dietParts.length) summaryParts.push(dietParts.join(', ') + ' dining preferences');
    if (ans.cuisines.length) summaryParts.push(`a love of ${ans.cuisines.slice(0, 3).join(', ')} cuisine`);
    if (allergens.length) summaryParts.push(`allergies to ${allergens.join(', ')}`);
    const summary = summaryParts.length
      ? `Your Liora profile is tailored around ${summaryParts.join('; ')}. We'll use this to personalise every recommendation for you.`
      : `Welcome to Liora! Your personalised dining profile is ready. We'll use your preferences to find the perfect meals for you.`;
    return {
      summary,
      profile: {
        name: '', city: '',
        budget: ans.budget || '$$',
        cuisines: ans.cuisines,
        spice: ans.spice || 3,
        allergens,
        diet: dietParts.join(', ') || 'No specific diet',
        avoid: allergens.join(', ') || 'None',
        vibe: ans.notes || ans.vibe || 'Cozy and casual',
      },
    };
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    const lifestyle = answers.lifestyle ?? '';
    const finalAnswers: OnboardingAnswers = {
      ...answers,
      diet: {
        presets: lifestyle ? [lifestyle] : [],
        custom: [...(answers.allergies ?? []), ...(answers.religious ?? []), ...(answers.healthNeeds ?? []), answers.customReligious ?? ''].filter(Boolean).join(', '),
      },
      avoid: (answers.allergies ?? []).join(', ') || 'None',
      vibe: answers.notes || answers.vibe || 'Cozy and casual',
    };
    loadingRef.current = window.setInterval(() => {
      setLoadingMessage(prev => { const idx = LOADING_MESSAGES.indexOf(prev); return LOADING_MESSAGES[(idx + 1) % LOADING_MESSAGES.length]; });
    }, 2500);
    try {
      let result: { summary: string; profile: any };
      try {
        result = await generateUserProfile(finalAnswers);
        if (!result?.summary || !result?.profile) throw new Error('incomplete');
      } catch {
        result = buildLocalProfile(finalAnswers);
      }
      saveProfile({ summary: result.summary, profile: result.profile });
      localStorage.removeItem('liora-needs-onboarding');
      setShowDiscount(true);
    } catch (err) {
      setError('Could not save your profile. Please try again.');
    } finally {
      clearInterval(loadingRef.current!);
      setIsLoading(false);
    }
  };

  const handleStartOver = () => { clearProfile(); setAnswers(initialAnswers); setError(null); setShowDiscount(false); };

  if (isLoading) return (
    <div className="w-full bg-white border border-cream-200 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center gap-6 min-h-64">
      <Spinner />
      <div className="text-center">
        <p className="font-semibold text-stone-800">{loadingMessage}</p>
        <p className="text-sm text-stone-400 mt-1">Just a moment…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="w-full bg-white border border-cream-200 rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><Icon name="warning" className="w-6 h-6 text-red-500" /></div>
      <p className="text-stone-700 text-center">{error}</p>
      <button onClick={() => setError(null)} className="px-5 py-2.5 bg-forest-800 text-cream-50 rounded-xl text-sm font-semibold">Try Again</button>
    </div>
  );

  const needsOnboarding = localStorage.getItem('liora-needs-onboarding') === 'true';
  if (profile && !isLoading && !needsOnboarding) return (
    <div className="w-full bg-white border border-cream-200 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col gap-6">
      {showDiscount && (
        <div className="bg-brand-400/10 border border-brand-400/30 rounded-2xl p-4">
          <p className="font-semibold text-stone-800 text-sm">Save $5 as promised for completing your profile</p>
          <p className="text-xs text-stone-500 mt-1">T&amp;C: order value must be above $50 to complete this</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <h3 className="text-xl font-display text-stone-800">Your Liora Profile is Ready</h3>
          <p className="text-sm text-stone-400">Personalised dining recommendations await you.</p>
        </div>
      </div>
      <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-sm text-stone-700 leading-relaxed">{profile.summary}</div>
      <div className="flex flex-wrap gap-3">
        <button onClick={handleStartOver} className="px-5 py-2.5 bg-cream-100 text-stone-700 rounded-xl text-sm font-semibold border border-stone-200 hover:bg-cream-200 transition-colors">Edit Profile</button>
        <button onClick={onProfileCreated} className="px-5 py-2.5 bg-forest-800 text-cream-50 rounded-xl text-sm font-semibold hover:bg-forest-700 transition-colors">Start Exploring →</button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4">
      {/* Welcome offer banner */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-amber-400/15" />
        <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-orange-400/10" />
        <div className="flex items-start gap-3 relative">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center shadow-md">
            <span className="text-xl">🎁</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Welcome Offer</span>
            <p className="font-bold text-stone-800 text-base mt-1 leading-snug">Save <span className="text-amber-600 text-xl">$5</span> on your first order — just complete your profile!</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">Scroll through and fill in the sections below. <span className="text-stone-400">Min. order $50 · T&amp;Cs apply</span></p>
          </div>
        </div>
      </div>

      {/* Section 1 — Allergies */}
      <SectionCard step={1} title="Allergies & Intolerances" subtitle="Select all that apply — we'll keep your dining safe.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALLERGIES.map(a => (
              <CheckChip key={a.id} label={a.label} checked={(answers.allergies ?? []).includes(a.id)} onChange={() => set({ allergies: toggleArr(answers.allergies ?? [], a.id) })} />
            ))}
            <CheckChip label="Other" checked={(answers.allergies ?? []).includes('other')} onChange={() => set({ allergies: toggleArr(answers.allergies ?? [], 'other') })} />
          </div>
          <label className="flex items-start gap-3 cursor-pointer" onClick={() => set({ severeAllergy: !answers.severeAllergy })}>
            <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${answers.severeAllergy ? 'bg-red-500 border-red-500' : 'border-stone-300'}`}>
              {answers.severeAllergy && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </div>
            <span className="text-sm text-stone-600 leading-snug">I have a <strong className="text-red-600">severe / life-threatening allergy</strong> — flag this on all recommendations.</span>
          </label>
        </div>
      </SectionCard>

      {/* Section 2 — Lifestyle */}
      <SectionCard step={2} title="Lifestyle & Diet" subtitle="Choose the one that best describes your eating style.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LIFESTYLES.map(l => (
            <button key={l.id} type="button" onClick={() => set({ lifestyle: l.id })}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border transition-all ${answers.lifestyle === l.id ? 'bg-forest-800 text-cream-50 border-forest-800 shadow-md' : 'bg-white text-stone-700 border-stone-200 hover:border-forest-700 hover:shadow-sm'}`}>
              <span className="text-2xl">{l.icon}</span>
              <span className="text-xs font-semibold text-center leading-tight">{l.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Section 3 — Religious & Cultural */}
      <SectionCard step={3} title="Religious & Cultural" subtitle="We respect every tradition at the Liora table.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {RELIGIOUS.map(r => (
              <CheckChip key={r.id} label={r.label} checked={(answers.religious ?? []).includes(r.id)} onChange={() => set({ religious: toggleArr(answers.religious ?? [], r.id) })} />
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-stone-600 block mb-1.5">Any other cultural or religious requirements?</label>
            <input type="text" value={answers.customReligious ?? ''} onChange={e => set({ customReligious: e.target.value })} placeholder="e.g., Jain vegetarian, no cross-contamination…" className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-700 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10" />
          </div>
        </div>
      </SectionCard>

      {/* Section 4 — Health */}
      <SectionCard step={4} title="Health & Medical" subtitle="So we can surface the right options for your wellbeing.">
        <div className="flex flex-wrap gap-2">
          {HEALTH.map(h => (
            <CheckChip key={h.id} label={h.label} checked={(answers.healthNeeds ?? []).includes(h.id)} onChange={() => set({ healthNeeds: toggleArr(answers.healthNeeds ?? [], h.id) })} />
          ))}
          <CheckChip label="No specific medical needs" checked={(answers.healthNeeds ?? []).length === 0} onChange={() => set({ healthNeeds: [] })} />
        </div>
      </SectionCard>

      {/* Section 5 — Cuisine & Preferences */}
      <SectionCard step={5} title="Cuisine & Preferences" subtitle="Help Liora personalise every recommendation.">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-stone-600 mb-2">Favourite cuisines</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CUISINES.map(c => (
                <CheckChip key={c} label={c} checked={answers.cuisines.includes(c)} onChange={() => set({ cuisines: toggleArr(answers.cuisines, c) })} />
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customCuisine}
                onChange={e => setCustomCuisine(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customCuisine.trim()) { set({ cuisines: toggleArr(answers.cuisines, customCuisine.trim()) }); setCustomCuisine(''); } } }}
                placeholder="Add another…"
                className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-brand-400"
              />
              <button onClick={() => { if (customCuisine.trim()) { set({ cuisines: toggleArr(answers.cuisines, customCuisine.trim()) }); setCustomCuisine(''); } }} className="px-4 py-2 bg-cream-100 text-stone-600 text-sm rounded-lg hover:bg-cream-200 border border-stone-200">Add</button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-600 mb-2">Typical dining budget</p>
            <div className="flex gap-3">
              {['$', '$$', '$$$'].map(b => (
                <button key={b} type="button" onClick={() => set({ budget: b })} className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${answers.budget === b ? 'bg-forest-800 text-cream-50 border-forest-800' : 'bg-white text-stone-600 border-stone-200 hover:border-forest-700'}`}>
                  <div>{b}</div>
                  <div className={`text-xs font-normal mt-0.5 ${answers.budget === b ? 'text-cream-200' : 'text-stone-400'}`}>{BUDGET_LABELS[b]}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-600 mb-2">Spice tolerance — <span className="text-brand-400 font-semibold">{SPICE_LABELS[answers.spice]}</span></p>
            <input type="range" min={1} max={5} value={answers.spice} onChange={e => set({ spice: Number(e.target.value) })} className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-stone-200" />
            <div className="flex justify-between text-xs text-stone-400 mt-1"><span>Mild</span><span>🔥 Blazing</span></div>
          </div>
        </div>
      </SectionCard>

      {/* Section 6 — Final Notes */}
      <SectionCard step={6} title="Final Notes" subtitle="Anything else Liora should know?">
        <textarea
          value={answers.notes ?? ''}
          onChange={e => set({ notes: e.target.value })}
          placeholder="e.g., I love outdoor seating, always order dessert, need high chair for toddler…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-700 bg-white resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10"
        />
      </SectionCard>

      {/* Submit */}
      <div className="bg-brand-400/10 border border-brand-400/30 rounded-2xl p-4">
        <p className="font-semibold text-stone-800 text-sm">Save $5 as promised for completing your profile</p>
        <p className="text-xs text-stone-500 mt-1">T&amp;C: order value must be above $50 to complete this</p>
      </div>
      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-forest-800 text-cream-50 font-bold text-base hover:bg-forest-700 transition-colors shadow-lg"
      >
        Create My Profile <Icon name="sparkles" className="w-5 h-5" />
      </button>
    </div>
  );
};
