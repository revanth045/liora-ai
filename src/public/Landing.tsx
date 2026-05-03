import React, { useState, useEffect } from 'react';
import { LogoMark } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { useSettings } from '../context/SettingsContext';
import { t } from '../lib/i18n';
import SettingsPanel from '../components/SettingsPanel';
import { useScrollRevealRoot, useParallax, useCountUp, useScrollProgress } from '../lib/useScrollReveal';

interface LandingProps {
  onGoToLogin: () => void;
  onGoToRestaurants: () => void;
  onGoToHotels: () => void;
  onGetStarted: () => void;
  onGoToProviderChooser: () => void;
  onGoToAdmin?: () => void;
}

const FOOD_HERO     = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=2400&q=90';
const FOOD_DISH_1   = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400&q=90';
const FOOD_DISH_2   = 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1400&q=90';
const FOOD_TABLE    = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=2200&q=90';
const FOOD_PASTA    = 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&q=90';
const FOOD_BURGER   = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=90';
const FOOD_DESSERT  = 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1400&q=90';
const FOOD_SUSHI    = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=90';
const FOOD_PLATING  = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=90';
const FOOD_WINE     = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=90';

const PARTNER_VENUES = [
  'Le Bernardin', 'Noma', 'Eleven Madison Park', 'The Fat Duck', 'Osteria Francescana',
  'Atelier Crenn', 'Per Se', 'Mirazur', 'Geranium', 'Pujol',
  'Septime', 'Disfrutar', 'Central',
];

export default function Landing({ onGoToLogin, onGoToRestaurants, onGoToHotels, onGetStarted, onGoToProviderChooser, onGoToAdmin }: LandingProps) {
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const venueName = settings.brand.displayName || 'Liora';

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileNavOpen]);

  const revealRoot = useScrollRevealRoot<HTMLDivElement>();
  useParallax();
  const progress = useScrollProgress();

  // count-up stats
  const stat1 = useCountUp(50);
  const stat2 = useCountUp(1200);
  const stat3 = useCountUp(98);
  const stat4 = useCountUp(49);

  return (
    <div ref={revealRoot} className="bg-app text-stone-900 font-sans overflow-x-hidden">
      {/* scroll-progress bar */}
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />

      {/* ============= TOP TICKER ============= */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 text-white text-[10px] font-bold tracking-[0.32em] uppercase py-2.5 overflow-hidden border-b border-brand-700/30 shadow-md">
        <div className="marquee-mask">
          <div className="marquee-track">
            {[...Array(2)].flatMap((_, k) => [
              <span key={`a${k}`} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-white"/> Private dining concierge</span>,
              <span key={`b${k}`} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-white"/> Michelin-trained AI sommelier</span>,
              <span key={`c${k}`} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-white"/> Global partner network</span>,
              <span key={`d${k}`} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-white"/> 24/7 personal taste assistant</span>,
              <span key={`e${k}`} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-white"/> Reserved tables. Reserved evenings.</span>,
            ])}
          </div>
        </div>
      </div>

      {/* ============= NAV ============= */}
      <nav className="sticky top-0 z-50 bg-cream-50/98 backdrop-blur-2xl border-b border-stone-300/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <LogoMark className="h-10 w-10" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">{venueName}</span>
              <span className="text-[8px] font-bold text-stone-700 uppercase tracking-[0.32em] mt-1">Maison de cuisine</span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-9 text-[13px] font-bold text-stone-800">
            {['Discover', 'AI Concierge', 'Wellness', 'Restaurants'].map(l => (
              <button
                key={l}
                onClick={l === 'Restaurants' ? onGoToRestaurants : onGetStarted}
                className="underline-luxe hover:text-brand-600 transition-colors"
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center text-stone-800 hover:bg-cream-100 transition-colors"
              aria-label="Open menu"
            >
              <Icon name="menu" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl text-stone-700 hover:bg-cream-100 hover:text-stone-900 transition-colors"
              title={t(settings.locale, 'common.settings')}
            >
              <Icon name="settings" className="w-[18px] h-[18px]" />
            </button>
            <button onClick={onGoToLogin} className="text-[13px] font-bold text-stone-900 hover:text-white hover:bg-stone-900 transition-all px-5 py-2 border border-stone-400 hover:border-stone-900 rounded-full">{t(settings.locale, 'common.signIn')}</button>
          </div>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm" />
          <div onClick={e => e.stopPropagation()} className="absolute top-0 right-0 h-full w-[86%] max-w-sm bg-cream-50 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <LogoMark className="h-9 w-9" />
                <span className="font-display text-lg font-semibold text-stone-900">{venueName}</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-700 hover:bg-cream-100" aria-label="Close menu">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {[
                { l: 'Discover',      a: () => { setMobileNavOpen(false); onGetStarted(); } },
                { l: 'Restaurants',   a: () => { setMobileNavOpen(false); onGoToRestaurants(); } },
                { l: 'Hotels',        a: () => { setMobileNavOpen(false); onGoToHotels(); } },
                { l: 'AI Concierge',  a: () => { setMobileNavOpen(false); onGetStarted(); } },
                { l: 'Wellness',      a: () => { setMobileNavOpen(false); onGetStarted(); } },
                { l: 'For Partners',  a: () => { setMobileNavOpen(false); onGoToProviderChooser(); } },
              ].map(({ l, a }) => (
                <button key={l} onClick={a} className="w-full text-left px-4 py-4 rounded-2xl text-base font-bold text-stone-900 hover:bg-cream-100 active:bg-cream-200 transition-colors">
                  {l}
                </button>
              ))}
            </nav>
            <div className="px-6 py-5 border-t border-stone-200 space-y-3">
              <button onClick={() => { setMobileNavOpen(false); onGoToLogin(); }} className="w-full py-3.5 rounded-full bg-stone-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-stone-800 active:scale-[0.99] transition">
                {t(settings.locale, 'common.signIn')}
              </button>
              {onGoToAdmin && (
                <button onClick={() => { setMobileNavOpen(false); onGoToAdmin(); }} className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900">
                  Admin console
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============= HERO ============= */}
      <section className="relative min-h-[100vh] flex items-end overflow-hidden">
        {/* parallax photo layer */}
        <div className="absolute inset-0 -top-20 -bottom-20" data-parallax data-speed="0.15">
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${FOOD_HERO}')` }} />
        </div>
        {/* dark luxe overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/55 to-stone-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/35 to-transparent" />

        {/* corner ornament */}
        <div className="hidden md:flex absolute top-12 right-12 z-10 flex-col items-end gap-2 text-amber-300">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Est. 2025</p>
          <span className="w-12 h-px bg-amber-300/70" />
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Members only</p>
        </div>

        <div className="relative z-10 px-6 md:px-16 pb-20 md:pb-32 max-w-5xl">
          <div className="reveal inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 mb-7 shadow-lift">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">An AI Concierge for the Discerning Palate</span>
          </div>

          <h1 className="font-display font-light text-white leading-[0.98] mb-8 tracking-tight text-shadow-luxe">
            <span className="block text-[clamp(3rem,9vw,8rem)]">Crave it.</span>
            <span className="block text-[clamp(3rem,9vw,8rem)] italic font-extralight">
              <span className="text-champagne">Find it.</span> Taste it.
            </span>
          </h1>

          <p className="reveal text-white/85 text-base md:text-lg font-light leading-relaxed max-w-xl mb-10 text-shadow-luxe">
            Liora is the private AI sommelier behind every memorable evening. From intimate omakase counters to villa-side chef bookings — your taste, expertly curated, on demand.
          </p>

          <div className="reveal flex flex-wrap items-center gap-4">
            <button onClick={onGetStarted} className="btn-primary !px-8 !py-4 text-sm shadow-glow anim-glow">
              Request your invitation
              <Icon name="arrow_forward" className="w-3.5 h-3.5" />
            </button>
            <button onClick={onGoToRestaurants} className="text-white font-semibold text-sm hover:text-brand-300 transition-colors px-5 py-3.5 inline-flex items-center gap-2 border border-white/35 hover:border-white rounded-full backdrop-blur-md">
              Partner with us
            </button>
            <div className="flex items-center gap-3 ml-2">
              <div className="flex -space-x-2.5">
                {[FOOD_PASTA, FOOD_BURGER, FOOD_SUSHI].map((img, i) => (
                  <div key={i} className="w-10 h-10 rounded-full ring-2 ring-stone-950 bg-cover bg-center shadow-lg" style={{ backgroundImage: `url('${img}')` }} />
                ))}
              </div>
              <div className="text-white/90 text-xs leading-tight">
                <p className="font-bold text-white">12,400+ members</p>
                <p className="flex items-center gap-1 mt-0.5"><span className="text-amber-300">★★★★★</span> <span className="text-white/85">4.9 rating</span></p>
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/90">
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Scroll</span>
            <span className="w-px h-10 bg-gradient-to-b from-white/60 to-transparent anim-float" />
          </div>
        </div>

        {/* gold floating ornaments */}
        <div className="absolute top-[30%] right-[8%] w-72 h-72 rounded-full bg-brand-500/15 blur-3xl pointer-events-none anim-float" />
        <div className="absolute bottom-[15%] left-[5%] w-56 h-56 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
      </section>

      {/* ============= MARQUEE OF VENUES ============= */}
      <section className="bg-stone-950 py-9 overflow-hidden border-y border-stone-800/60 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-transparent to-stone-950 pointer-events-none z-10" />
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-champagne mb-5">Trusted by chefs, sommeliers &amp; venues across</p>
        <div className="marquee-mask">
          <div className="marquee-track">
            {[...PARTNER_VENUES, ...PARTNER_VENUES].map((v, i) => (
              <span key={i} className="font-display text-2xl md:text-3xl font-light italic tracking-wide whitespace-nowrap text-white/95 hover:text-amber-300 transition-colors">{v}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============= ANIMATED STATS ============= */}
      <section className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url('${FOOD_PLATING}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700/30 to-brand-900/50" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="reveal text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-champagne mb-3">A network. A standard. A movement.</p>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-tight tracking-tight text-shadow-luxe">
              The world's most refined diners <em className="italic">choose Liora.</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 reveal-stagger">
            {[
              { ref: stat1.ref, val: stat1.value, suffix: 'K+', label: 'Members worldwide' },
              { ref: stat2.ref, val: stat2.value, suffix: '+',  label: 'Partner venues' },
              { ref: stat3.ref, val: stat3.value, suffix: '%',  label: 'Booking accuracy' },
              { ref: stat4.ref, val: (stat4.value / 10).toFixed(1), suffix: '★', label: 'Average rating' },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-display text-6xl md:text-7xl font-extralight tracking-tight leading-none">
                  <span ref={s.ref}>{s.val}</span>
                  <span className="text-champagne">{s.suffix}</span>
                </div>
                <div className="hairline-gold my-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/85">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= EDITORIAL FEATURE STRIP ============= */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center max-w-3xl mx-auto mb-16 reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600 mb-3">The Liora experience</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-stone-900 leading-[1.05] tracking-tight">
            One concierge. <em className="italic text-brand-600">Every craving.</em>
          </h2>
          <div className="hairline-gold mt-8 max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {/* Big editorial card */}
          <div className="md:col-span-4 relative rounded-[2rem] overflow-hidden min-h-[440px] cursor-pointer reveal-zoom group lift-on-hover" onClick={onGetStarted}>
            <div className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out" style={{ backgroundImage: `url('${FOOD_DISH_1}')` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
            <div className="absolute top-6 left-6 tag-gold !text-[10px]">Concierge</div>
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 text-white">
              <h3 className="font-display text-3xl md:text-5xl font-light mb-3 leading-[1.05] text-shadow-luxe">An AI sommelier, tuned to <em className="italic text-champagne">your palate.</em></h3>
              <p className="text-white/85 text-sm md:text-base max-w-md font-light">Whisper your mood, occasion, dietary needs. Liora returns curated venues with reasoning, wine pairings, and table secured — in seconds.</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-champagne underline-luxe">Begin a tasting →</div>
            </div>
          </div>

          {/* Wellness — premium dark gradient */}
          <div className="md:col-span-2 rounded-[2rem] bg-gradient-to-br from-stone-900 via-stone-900 to-brand-900 text-white p-8 md:p-10 flex flex-col justify-between min-h-[440px] cursor-pointer reveal lift-on-hover relative overflow-hidden" onClick={onGetStarted}>
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="relative">
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 bg-white/15 border border-amber-300/50 px-3 py-1.5 rounded-full mb-5">Wellness AI</span>
              <h3 className="font-display text-3xl mb-4 leading-tight font-light text-white">Nutrition, scientifically <em className="italic text-amber-300 not-italic-fix">private.</em></h3>
              <p className="text-white/90 text-sm font-normal leading-relaxed">Snap any plate — receive macros, allergens, and chef-grade swaps aligned to your wellness protocol.</p>
            </div>
            <div className="relative flex items-end justify-between mt-6">
              <div className="font-display text-7xl font-extralight leading-none text-amber-300">∞</div>
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">Science-backed</span>
            </div>
          </div>

          {/* Date Night — image card */}
          <div className="md:col-span-2 rounded-[2rem] card overflow-hidden cursor-pointer reveal lift-on-hover" onClick={onGetStarted}>
            <div className="relative h-56 overflow-hidden">
              <img src={FOOD_WINE} alt="Date night" className="w-full h-full object-cover transition-transform duration-[2s] ease-out hover:scale-110" />
              <span className="absolute top-4 left-4 tag-soft">Date Night</span>
            </div>
            <div className="p-7">
              <h3 className="font-display text-2xl text-stone-900 mb-2 leading-tight">Evenings, <em className="italic text-brand-600">orchestrated.</em></h3>
              <p className="text-stone-600 text-sm font-light leading-relaxed">From the venue and wine pairing to conversation prompts and the post-dinner walk — every moment, anticipated.</p>
            </div>
          </div>

          {/* AI Waiter */}
          <div className="md:col-span-2 rounded-[2rem] bg-stone-950 text-white p-8 flex flex-col justify-between min-h-[320px] cursor-pointer reveal lift-on-hover relative overflow-hidden" onClick={onGetStarted}>
            <div className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('${FOOD_DISH_2}')` }} />
            <div className="relative">
              <span className="tag bg-brand-500/20 text-brand-300 border-brand-500/30 mb-4 inline-block">AI Waiter</span>
              <h3 className="font-display text-2xl md:text-3xl mb-2 leading-tight">No queue. No flagging. <em className="italic text-champagne">Just service.</em></h3>
              <p className="text-white/70 text-sm font-light">Scan, ask, order — your private waiter is always one whisper away.</p>
            </div>
            <button className="relative btn-primary self-start mt-6">Try the demo →</button>
          </div>

          {/* AI Chef */}
          <div className="md:col-span-2 rounded-[2rem] overflow-hidden relative min-h-[320px] cursor-pointer reveal lift-on-hover group" onClick={onGetStarted}>
            <img src={FOOD_DESSERT} alt="Chef" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-7 text-white">
              <span className="tag-gold mb-4 inline-block self-start">AI Chef</span>
              <h3 className="font-display text-2xl md:text-3xl mb-2 leading-tight text-shadow-luxe">Michelin nights, <em className="italic text-champagne">at home.</em></h3>
              <p className="text-white/80 text-sm font-light">From your fridge to a plated symphony, with step-by-step guidance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============= PINNED EDITORIAL QUOTE ============= */}
      <section className="relative min-h-[70vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 -top-20 -bottom-20" data-parallax data-speed="0.2">
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${FOOD_TABLE}')` }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/45 to-stone-950/10" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-16 py-20 md:py-32">
          <p className="reveal text-[10px] font-bold uppercase tracking-[0.32em] text-champagne mb-6">Editor's note</p>
          <h2 className="reveal-mask font-display text-4xl md:text-7xl font-extralight italic text-white leading-[1.04] tracking-tight max-w-3xl text-shadow-luxe">
            “Liora is what happens when <span className="text-champagne not-italic font-light">artificial intelligence</span> learns the language of <em>desire.”</em>
          </h2>
          <p className="reveal text-white/95 text-sm mt-8 font-bold tracking-widest uppercase">— Vogue Gourmet</p>
          <button onClick={onGetStarted} className="reveal mt-10 btn-primary !px-8 !py-4 shadow-glow">
            Begin your journey
            <Icon name="arrow_forward" className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ============= TESTIMONIALS ============= */}
      <section className="py-24 md:py-32 bg-cream-100 dark:bg-surface-100 border-y border-cream-200">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="reveal text-center mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600 mb-3">Whispered between members</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-stone-900 leading-tight tracking-tight">
              Discreet praise, <em className="italic text-brand-600">honestly earned.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal-stagger">
            {[
              { name: 'Sarah Chen',   role: 'Founder · NYC',           quote: '“Liora is the only app that has earned a permanent place on my home screen. It anticipates evenings I haven’t yet imagined.”' },
              { name: 'Mateo Rivera', role: 'Restaurateur · Madrid',   quote: '“Eleven hours saved each week. Orders up 32% in the first month. The Liora portal feels like adding a second director.”' },
              { name: 'Aisha Khan',   role: 'Wellness · Dubai',        quote: '“Effortless precision. The nutrition AI catches what my own chef misses — and never feels clinical.”' },
            ].map((tt, i) => (
              <div key={i} className="card p-8 lift-on-hover">
                <svg className="w-8 h-8 text-champagne mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 7H7c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h2v3l4-4V9c0-1.1-.9-2-2-2zm8 0h-2c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h2v3l4-4V9c0-1.1-.9-2-2-2z"/></svg>
                <p className="font-display text-xl italic font-light text-stone-800 leading-snug">{tt.quote}</p>
                <div className="hairline-gold my-5" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold flex items-center justify-center shadow-glow">{tt.name[0]}</div>
                  <div>
                    <p className="font-bold text-sm text-stone-900">{tt.name}</p>
                    <p className="text-[11px] text-stone-600 uppercase tracking-widest">{tt.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FOR RESTAURANTS ============= */}
      <section className="section-forest py-28 md:py-36 relative overflow-hidden">
        <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-16 items-center relative">
          <div className="reveal-left">
            <span className="tag bg-white/10 text-cream-200 border-white/15 mb-5 inline-block">For restaurants</span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-white leading-[1.04] tracking-tight">
              Run your venue<br /><em className="italic text-champagne">like the future.</em>
            </h2>
            <p className="text-cream-100 text-base mt-6 leading-relaxed max-w-md font-light">
              AI-powered orders, kitchen display, marketing studio, customer insights, loyalty — every tool a modern restaurant needs, in one beautiful suite.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={onGoToProviderChooser} className="btn-primary !px-7 !py-3.5">Provider Login</button>
              <button onClick={onGoToRestaurants} className="btn-outline !text-cream-100 !border-cream-100/40 hover:!bg-cream-100 hover:!text-stone-900">Explore the suite</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 reveal-right">
            {[
              { v: '+32%', l: 'Order volume', tint: 'from-brand-500/35 to-transparent' },
              { v: '11h',  l: 'Saved weekly', tint: 'from-emerald-500/30 to-transparent' },
              { v: '4.8★', l: 'KDS happiness', tint: 'from-sky-500/30 to-transparent' },
              { v: '87%',  l: 'Repeat diners', tint: 'from-amber-500/35 to-transparent' },
            ].map(s => (
              <div key={s.l} className={`rounded-3xl p-7 bg-gradient-to-br ${s.tint} border border-white/12 backdrop-blur lift-on-hover`}>
                <p className="font-display text-5xl font-extralight text-white leading-none">{s.v}</p>
                <div className="hairline-gold my-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FINAL CTA ============= */}
      <section className="bg-stone-950 text-white py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('${FOOD_HERO}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 to-stone-950/95" />
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-champagne mb-5">Membership opens monthly</p>
          <h2 className="font-display text-5xl md:text-7xl font-extralight leading-[1.02] tracking-tight text-shadow-luxe">
            Your seat at the<br /><em className="italic text-champagne">finest tables</em> awaits.
          </h2>
          <p className="text-cream-100 text-base mt-7 font-light max-w-xl mx-auto leading-relaxed">
            Join a community of discerning palates and unlock private chef nights, unannounced openings, and the city's quietest corners.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={onGetStarted} className="btn-primary !px-8 !py-4 shadow-glow anim-glow">Request your invitation</button>
            <button onClick={onGoToLogin} className="px-6 py-3.5 rounded-full text-sm font-semibold text-white border border-white/30 hover:bg-white hover:text-stone-900 transition-colors">{t(settings.locale, 'common.signIn')}</button>
          </div>
        </div>
      </section>

      {/* ============= FOOTER ============= */}
      <footer className="bg-stone-950 text-cream-100 py-20 border-t border-stone-800 relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <LogoMark className="w-10 h-10" />
                <div className="leading-none">
                  <p className="font-display text-xl text-white">{venueName}</p>
                  <p className="text-[8px] font-bold text-champagne uppercase tracking-[0.32em] mt-1">Maison de cuisine</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed font-normal text-cream-100">A private AI concierge for those who consider every meal an occasion.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-champagne mb-5">Atelier</p>
              <ul className="flex flex-col gap-3">
                <li><button onClick={onGoToLogin} className="text-sm text-cream-100 hover:text-champagne text-left transition-colors font-medium">Concierge</button></li>
                <li><button onClick={onGoToProviderChooser} className="text-sm text-cream-100 hover:text-champagne text-left transition-colors font-medium">For Providers</button></li>
                <li><button onClick={onGoToProviderChooser} className="text-sm text-cream-100 hover:text-champagne text-left transition-colors font-medium">For Hotels</button></li>
                <li><button onClick={onGoToProviderChooser} className="text-sm text-cream-100 hover:text-champagne text-left transition-colors font-medium">For Restaurants</button></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-champagne mb-5">Maison</p>
              <ul className="flex flex-col gap-3">
                {['About', 'Journal', 'Careers', 'Press kit'].map(l => (
                  <li key={l}>
                    <a className="text-sm text-cream-100 hover:text-champagne cursor-pointer transition-colors font-medium">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-champagne mb-5">Begin</p>
              <div className="flex flex-col gap-3">
                <button onClick={onGetStarted} className="btn-primary w-full">Request access</button>
                <button onClick={onGoToProviderChooser} className="w-full px-5 py-3 rounded-full text-sm font-bold text-cream-100 border border-cream-200/40 hover:bg-cream-100 hover:text-stone-900 hover:border-cream-100 transition-colors">Service Provider login</button>
              </div>
            </div>
          </div>
          <div className="hairline-gold my-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-6">
              {['Instagram', 'Twitter', 'LinkedIn'].map(s => (
                <span key={s} className="text-[11px] font-bold uppercase tracking-widest text-cream-100 hover:text-champagne cursor-pointer transition-colors">{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[11px] text-cream-200 tracking-wide font-medium">© 2025 {venueName}. Crafted with care.</p>
              {onGoToAdmin && (
                <button
                  onClick={onGoToAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300 border border-amber-300/40 hover:bg-amber-300 hover:text-stone-950 transition-all"
                  title="Liora Owner Console — full platform control"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                  Liora Owner
                </button>
              )}
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-colors shadow-glow" title="Back to top">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
          </div>
        </div>
      </footer>

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
