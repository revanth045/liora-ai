import React from 'react';
import { LogoMark } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { useScrollRevealRoot, useParallax, useCountUp, useScrollProgress } from '../lib/useScrollReveal';

interface ForRestaurantsProps {
  onGoToLogin: () => void;
  onBackToHome: () => void;
  onGoToAdmin?: () => void;
}

const HERO_IMG    = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=2400&q=90';
const KITCHEN_IMG = 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=2000&q=90';
const PLATING_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=90';

export default function ForRestaurants({ onGoToLogin, onBackToHome, onGoToAdmin }: ForRestaurantsProps) {
  const root = useScrollRevealRoot<HTMLDivElement>();
  useParallax();
  const progress = useScrollProgress();
  const s1 = useCountUp(32);
  const s2 = useCountUp(11);
  const s3 = useCountUp(87);
  const s4 = useCountUp(48);

  const benefits = [
    { icon: 'sparkles',  title: 'Attract new patrons',     desc: 'Featured placement in Liora’s AI recommendations and discovery feeds — your venue, surfaced to the right palate.' },
    { icon: 'menu',      title: 'Optimise every dish',     desc: 'AI-crafted descriptions, performance scoring, intelligent pricing, and pairing suggestions, refined daily.' },
    { icon: 'chat',      title: 'Engage your diners',      desc: 'Reservations, reviews, loyalty rewards, and concierge messaging — orchestrated from a single beautiful console.' },
    { icon: 'briefcase', title: 'Streamline operations',   desc: 'Inventory, scheduling, kitchen-display sync, supplier reorders — automated by AI agents tuned to your venue.' },
  ];

  return (
    <div ref={root} className="bg-app text-stone-900 font-sans overflow-x-hidden">
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />

      {/* Top ticker */}
      <div className="bg-stone-950 text-cream-100 text-[10px] tracking-[0.3em] uppercase py-2 overflow-hidden">
        <div className="marquee-mask">
          <div className="marquee-track">
            {[...Array(2)].flatMap((_, k) => [
              <span key={`a${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-500"/> AI menu engineering</span>,
              <span key={`b${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-500"/> Kitchen display synchronisation</span>,
              <span key={`c${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-500"/> Concierge-grade reservations</span>,
              <span key={`d${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-500"/> Loyalty for the loyal</span>,
            ])}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-app/90 backdrop-blur-2xl border-b border-cream-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex justify-between items-center">
          <button onClick={onBackToHome} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <LogoMark className="h-10 w-10" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">Liora</span>
              <span className="text-[8px] font-bold text-stone-600 uppercase tracking-[0.32em] mt-1">For Restaurants</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onBackToHome} className="hidden sm:inline-block text-[13px] font-semibold text-stone-700 hover:text-stone-950 underline-luxe px-3 py-2">Consumer site</button>
            <button onClick={onGoToLogin} className="btn-primary text-[13px] !px-5">Get started →</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 -top-20 -bottom-20" data-parallax data-speed="0.15">
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-950/55 to-stone-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/30 to-transparent" />

        <div className="relative z-10 px-6 md:px-16 pb-20 md:pb-28 max-w-5xl">
          <div className="reveal inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">Restaurant Operating System</span>
          </div>
          <h1 className="font-display font-light text-white leading-[0.98] tracking-tight text-shadow-luxe">
            <span className="reveal-mask block text-[clamp(2.6rem,7.5vw,6.5rem)]">Run your venue</span>
            <span className="reveal-mask block text-[clamp(2.6rem,7.5vw,6.5rem)] italic font-extralight" style={{ transitionDelay: '180ms' }}>
              <span className="text-champagne">like the future.</span>
            </span>
          </h1>
          <p className="reveal text-white/85 text-base md:text-lg font-light leading-relaxed max-w-xl mt-7 mb-10 text-shadow-luxe">
            One intelligent platform for menus, marketing, kitchen, customers and revenue — designed for restaurants who refuse to compromise on the experience.
          </p>
          <div className="reveal flex flex-wrap items-center gap-4">
            <button onClick={onGoToLogin} className="btn-primary !px-8 !py-4 text-sm shadow-glow anim-glow">
              Start a 14-day trial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
            <button onClick={onBackToHome} className="text-white font-semibold text-sm hover:text-brand-300 transition-colors px-5 py-3.5 inline-flex items-center gap-2 border border-white/35 hover:border-white rounded-full backdrop-blur-md">
              ← Consumer site
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url('${PLATING_IMG}')` }} />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 reveal-stagger">
            {[
              { ref: s1.ref, val: s1.value, suffix: '%',  label: 'Average order uplift' },
              { ref: s2.ref, val: s2.value, suffix: 'h',  label: 'Saved each week' },
              { ref: s3.ref, val: s3.value, suffix: '%',  label: 'Repeat-diner rate' },
              { ref: s4.ref, val: (s4.value/10).toFixed(1), suffix: '★', label: 'Average venue rating' },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-display text-5xl md:text-6xl font-extralight tracking-tight leading-none">
                  <span ref={s.ref}>{s.val}</span><span className="text-champagne">{s.suffix}</span>
                </div>
                <div className="hairline-gold my-3" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/85">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 md:py-32 max-w-6xl mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600 mb-3">A complete restaurant suite</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-stone-900 leading-tight tracking-tight">
            Every craft. <em className="italic text-brand-600">One console.</em>
          </h2>
          <div className="hairline-gold mt-7 max-w-xs mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-5 reveal-stagger">
          {benefits.map(b => (
            <div key={b.title} className="card p-8 lift-on-hover">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-5 shadow-glow">
                <Icon name={b.icon} className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display text-2xl text-stone-900 mb-2 tracking-tight">{b.title}</h3>
              <p className="text-stone-600 text-[15px] leading-relaxed font-light">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial parallax quote */}
      <section className="relative min-h-[60vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 -top-20 -bottom-20" data-parallax data-speed="0.2">
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${KITCHEN_IMG}')` }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/45 to-stone-950/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 py-20 md:py-28">
          <p className="reveal text-[10px] font-bold uppercase tracking-[0.32em] text-champagne mb-5">From a partner</p>
          <blockquote className="reveal-mask font-display text-3xl md:text-5xl font-extralight italic text-white leading-[1.1] tracking-tight max-w-3xl text-shadow-luxe">
            “Liora gave us back eleven hours a week and grew our average ticket by a third — without changing a single recipe.”
          </blockquote>
          <p className="reveal text-cream-100 text-sm mt-7 font-semibold tracking-widest uppercase">— Maria Esposito · The Corner Bistro · Milan</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-950 text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 to-stone-950/95" />
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-champagne mb-5">Onboard in under an hour</p>
          <h2 className="font-display text-5xl md:text-6xl font-extralight leading-[1.04] tracking-tight text-shadow-luxe">
            Ready to grow<br /><em className="italic text-champagne">on your terms?</em>
          </h2>
          <p className="text-cream-100 text-base mt-7 font-light max-w-xl mx-auto leading-relaxed">
            Your first fourteen days are complimentary. No card. No commitment. Just clarity.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={onGoToLogin} className="btn-primary !px-8 !py-4 shadow-glow anim-glow">Claim your free trial</button>
            <button onClick={onBackToHome} className="px-6 py-3.5 rounded-full text-sm font-semibold text-white border border-white/30 hover:bg-white hover:text-stone-900 transition-colors">Back to consumer</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-cream-100 py-12 border-t border-stone-900">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg text-white">Liora</span>
            <span className="text-[9px] font-bold text-champagne uppercase tracking-[0.32em]">For Restaurants</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[11px] tracking-wide">© {new Date().getFullYear()} Liora. Crafted with care.</p>
            {onGoToAdmin && (
              <button onClick={onGoToAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300 border border-amber-300/40 hover:bg-amber-300 hover:text-stone-950 transition-all"
                title="Liora Owner Console — full platform control">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                Liora Owner
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
