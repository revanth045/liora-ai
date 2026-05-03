import React from 'react';
import { LogoMark } from '../../components/Logo';
import { Icon } from '../../components/Icon';
import { useScrollRevealRoot, useParallax, useCountUp, useScrollProgress } from '../lib/useScrollReveal';

interface ForHotelsProps {
  onGoToLogin: () => void;
  onBackToHome: () => void;
  onGoToAdmin?: () => void;
}

const HERO_IMG    = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2400&q=90';
const LOBBY_IMG   = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000&q=90';
const SUITE_IMG   = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=90';

export default function ForHotels({ onGoToLogin, onBackToHome, onGoToAdmin }: ForHotelsProps) {
  const root = useScrollRevealRoot<HTMLDivElement>();
  useParallax();
  const progress = useScrollProgress();
  const s1 = useCountUp(42);
  const s2 = useCountUp(18);
  const s3 = useCountUp(91);
  const s4 = useCountUp(49);

  const benefits = [
    { icon: 'hotel',           title: 'Fill every room',          desc: 'Smart pricing, dynamic availability and discovery placement that keeps your occupancy at its peak — every season, every night.' },
    { icon: 'concierge_bell',  title: 'Concierge-grade service',  desc: 'A unified booking, guest messaging and review experience that mirrors the polish of the world\'s finest hotel groups.' },
    { icon: 'sparkle_chat',    title: 'Sell more than rooms',     desc: 'Add-on packaging — breakfast, transfers, spa, late checkout — surfaced at the perfect moment in the booking flow.' },
    { icon: 'insights',        title: 'Revenue intelligence',     desc: 'Live ADR, RevPAR and occupancy tracking with AI suggestions on rates, length-of-stay and channel mix.' },
  ];

  const features = [
    { tag: 'Bookings',      title: 'Calendar that thinks',         desc: 'Drag-and-drop reservations, instant confirmations, and an AI that flags overbooking risk before it happens.' },
    { tag: 'Inventory',     title: 'Every room, every rate',       desc: 'Manage room types, units, seasonal pricing, restrictions and packages from a single elegant grid.' },
    { tag: 'Guest journey', title: 'From first click to checkout', desc: 'Pre-arrival emails, in-stay concierge messaging, post-stay reviews — orchestrated automatically.' },
    { tag: 'Branding',      title: 'Your hotel, beautifully',      desc: 'Custom colors, hero imagery, policies and amenities — your booking page feels like part of your brand.' },
  ];

  return (
    <div ref={root} className="bg-app text-stone-900 font-sans overflow-x-hidden">
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />

      {/* Top ticker */}
      <div className="bg-stone-950 text-cream-100 text-[10px] tracking-[0.3em] uppercase py-2 overflow-hidden">
        <div className="marquee-mask">
          <div className="marquee-track">
            {[...Array(2)].flatMap((_, k) => [
              <span key={`a${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-sky-400"/> Direct bookings, zero commission</span>,
              <span key={`b${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-sky-400"/> AI revenue management</span>,
              <span key={`c${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-sky-400"/> Concierge-grade guest messaging</span>,
              <span key={`d${k}`} className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-sky-400"/> One console for the whole property</span>,
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
              <span className="text-[8px] font-bold text-stone-700 uppercase tracking-[0.32em] mt-1">For Hotels</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onBackToHome} className="hidden sm:inline-block text-[13px] font-semibold text-stone-700 hover:text-stone-950 underline-luxe px-3 py-2">Consumer site</button>
            <button onClick={onGoToLogin} className="text-[13px] font-bold !px-5 !py-2.5 rounded-full text-white shadow-md hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>Get started →</button>
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
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">Hotel Operating System</span>
          </div>
          <h1 className="font-display font-light text-white leading-[0.98] tracking-tight text-shadow-luxe">
            <span className="reveal-mask block text-[clamp(2.6rem,7.5vw,6.5rem)]">Run your hotel</span>
            <span className="reveal-mask block text-[clamp(2.6rem,7.5vw,6.5rem)] italic font-extralight" style={{ transitionDelay: '180ms' }}>
              <span className="text-sky-300">like a flagship.</span>
            </span>
          </h1>
          <p className="reveal text-white/85 text-base md:text-lg font-light leading-relaxed max-w-xl mt-7 mb-10 text-shadow-luxe">
            One intelligent platform for rooms, bookings, pricing, guests and revenue — designed for hoteliers who consider every stay an experience.
          </p>
          <div className="reveal flex flex-wrap items-center gap-4">
            <button onClick={onGoToLogin} className="!px-8 !py-4 text-sm rounded-full font-bold text-white shadow-glow inline-flex items-center gap-2 transition-all hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              Open the hotel console
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
            <button onClick={onBackToHome} className="text-white font-semibold text-sm hover:text-sky-300 transition-colors px-5 py-3.5 inline-flex items-center gap-2 border border-white/35 hover:border-white rounded-full backdrop-blur-md">
              ← Consumer site
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 50%, #6366f1 100%)' }}>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url('${SUITE_IMG}')` }} />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 reveal-stagger">
            {[
              { ref: s1.ref, val: s1.value, suffix: '%',  label: 'Average ADR uplift' },
              { ref: s2.ref, val: s2.value, suffix: 'h',  label: 'Saved each week' },
              { ref: s3.ref, val: s3.value, suffix: '%',  label: 'Direct booking rate' },
              { ref: s4.ref, val: (s4.value/10).toFixed(1), suffix: '★', label: 'Average guest rating' },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-display text-5xl md:text-6xl font-extralight tracking-tight leading-none">
                  <span ref={s.ref}>{s.val}</span><span className="text-sky-200">{s.suffix}</span>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-700 mb-3">A complete hotel suite</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-stone-900 leading-tight tracking-tight">
            Every guest. <em className="italic" style={{ color: '#0ea5e9' }}>Effortlessly hosted.</em>
          </h2>
          <div className="hairline-gold mt-7 max-w-xs mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-5 reveal-stagger">
          {benefits.map(b => (
            <div key={b.title} className="card p-8 lift-on-hover">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-glow ring-1 ring-white/30 relative" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                <span className="absolute inset-x-1 top-1 h-2.5 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                <Icon name={b.icon} className="w-6 h-6 text-white relative drop-shadow-sm" />
              </div>
              <h3 className="font-display text-2xl text-stone-900 mb-2 tracking-tight">{b.title}</h3>
              <p className="text-stone-700 text-[15px] leading-relaxed font-medium">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature deep-dives */}
      <section className="bg-cream-50 py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-700 mb-3">Built for hoteliers</p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-stone-900 leading-tight tracking-tight">
              Everything you need. <em className="italic">Nothing you don't.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 reveal-stagger">
            {features.map(f => (
              <div key={f.title} className="card p-7 lift-on-hover">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2" style={{ color: '#0ea5e9' }}>{f.tag}</p>
                <h3 className="font-display text-2xl text-stone-900 mb-2 tracking-tight">{f.title}</h3>
                <p className="text-stone-700 text-[14px] leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial parallax quote */}
      <section className="relative min-h-[60vh] overflow-hidden flex items-center">
        <div className="absolute inset-0 -top-20 -bottom-20" data-parallax data-speed="0.2">
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url('${LOBBY_IMG}')` }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/45 to-stone-950/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 py-20 md:py-28">
          <p className="reveal text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300 mb-5">From a partner</p>
          <blockquote className="reveal-mask font-display text-3xl md:text-5xl font-extralight italic text-white leading-[1.1] tracking-tight max-w-3xl text-shadow-luxe">
            "Liora doubled our direct bookings in a single quarter. We finally feel like we're running our hotel — not the other way around."
          </blockquote>
          <p className="reveal text-cream-100 text-sm mt-7 font-semibold tracking-widest uppercase">— Helena Marsh · Aspen Pines Lodge</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-950 text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 to-stone-950/95" />
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sky-300 mb-5">Onboard your property in under an hour</p>
          <h2 className="font-display text-5xl md:text-6xl font-extralight leading-[1.04] tracking-tight text-shadow-luxe">
            Ready to host<br /><em className="italic text-sky-300">on your terms?</em>
          </h2>
          <p className="text-cream-100 text-base mt-7 font-light max-w-xl mx-auto leading-relaxed">
            Your first fourteen days are complimentary. No card. No commitment. Just an elevated standard for every guest.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={onGoToLogin} className="!px-8 !py-4 rounded-full text-white font-bold shadow-glow transition-all hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>Open the hotel console</button>
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
            <span className="text-[9px] font-bold text-sky-300 uppercase tracking-[0.32em]">For Hotels</span>
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
