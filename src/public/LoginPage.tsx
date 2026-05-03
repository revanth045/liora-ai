import React from 'react';
import { LogoMark } from '../../components/Logo';
import UserLogin from '../components/auth/UserLogin';
import ServiceProviderLogin from '../components/auth/ServiceProviderLogin';

interface LoginPageProps {
  onBackToHome: () => void;
  loginAs?: 'user' | 'provider';
  onSwitchRole?: () => void;
  providerType?: 'hotel' | 'restaurant';
  onBackToChooser?: () => void;
}

function CustomerLeftPanel({ onBackToHome }: { onBackToHome: () => void }) {
  return (
    <div className="hidden md:block relative overflow-hidden bg-stone-950">
      {/* Base photo — intimate plated dish */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1800&q=90')` }}
      />
      {/* Multi-layer gradients for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/30 to-stone-950/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 via-transparent to-transparent" />

      {/* Subtle gold vignette at edges */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 70% 30%, rgba(217,168,87,0.07) 0%, transparent 65%)'
      }} />

      {/* ── TOP ── */}
      <div className="absolute top-8 left-10 right-10 flex items-center justify-between z-20">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[12px] font-semibold tracking-wide"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Home
        </button>
        {/* Live status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-white/80 uppercase tracking-[0.28em]">Active tonight</span>
        </div>
      </div>

      {/* ── CENTRE — editorial headline ── */}
      <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-14 z-10">
        {/* Logo lockup */}
        <div className="flex items-center gap-3 mb-12">
          <LogoMark className="h-10 w-10" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-white tracking-tight">Liora</span>
            <span className="text-[8px] font-bold text-amber-300/80 uppercase tracking-[0.36em] mt-0.5">Maison de cuisine</span>
          </div>
        </div>

        <p className="text-[10px] font-bold text-amber-300/90 uppercase tracking-[0.36em] mb-5">Members access</p>

        <h2
          className="font-display text-[56px] lg:text-[68px] font-extralight text-white leading-[0.97] tracking-tight mb-6"
          style={{ textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}
        >
          Every&nbsp;meal<br />
          <em className="italic" style={{ color: '#d4a853' }}>a&nbsp;memory.</em>
        </h2>

        {/* Hairline */}
        <div className="w-20 h-px bg-amber-300/50 mb-5" />

        <p className="text-white/65 text-[14px] leading-relaxed font-light max-w-[22rem]">
          Your private AI concierge — discovering exceptional restaurants,<br />
          curating every occasion.
        </p>
      </div>

      {/* ── FLOATING VENUE CARD ── */}
      <div className="absolute bottom-32 right-8 lg:right-12 z-20 w-52">
        <div
          className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl"
          style={{ background: 'rgba(15,15,15,0.72)', backdropFilter: 'blur(18px)' }}
        >
          <div className="relative h-24 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=85"
              alt="Featured venue"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[9px] font-bold text-white/90 uppercase tracking-widest">
              Featured tonight
            </span>
          </div>
          <div className="p-3">
            <p className="font-display font-semibold text-white text-[13px] leading-tight">Sakura Blossom</p>
            <p className="text-white/55 text-[10px] mt-0.5">Japanese · San Francisco</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-amber-400 text-[11px]">★★★★★</span>
              <span className="text-white/45 text-[10px] ml-1">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM — member testimonial ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-10 lg:px-14 pb-10">
        <div
          className="rounded-2xl p-4 flex items-start gap-3 border border-white/10"
          style={{ background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(20px)' }}
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-amber-300/30">
            <img
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80"
              alt="Member"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-[12px] leading-snug font-light italic">
              "Liora found us a chef's table that wasn't even listed anywhere. Unforgettable."
            </p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-white/90 text-[10px] font-bold">Isabelle M.</p>
                <p className="text-white/40 text-[9px]">Member since 2025</p>
              </div>
              <span className="text-amber-400 text-[11px]">★★★★★</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderLeftPanel({ onBackToHome }: { onBackToHome: () => void }) {
  return (
    <div className="hidden md:block relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=90')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950/85 via-stone-950/55 to-stone-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />

      <div className="absolute top-10 right-10 flex flex-col items-end gap-2 text-amber-300 z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Est. 2025</p>
        <span className="w-12 h-px bg-amber-300/70" />
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">Members only</p>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between p-12 lg:p-16">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-cream-100 hover:text-champagne transition-colors text-[13px] font-bold w-fit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to home
        </button>

        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <LogoMark className="h-11 w-11" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl font-semibold text-white tracking-tight">Liora</span>
              <span className="text-[9px] font-bold text-champagne uppercase tracking-[0.32em] mt-1">
                For Service Providers
              </span>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-champagne mb-4">For service providers</p>
          <h2 className="font-display text-5xl lg:text-6xl font-extralight text-white leading-[1.04] tracking-tight text-shadow-luxe">
            Your business,<br /><em className="italic text-champagne">elevated by AI.</em>
          </h2>
          <div className="hairline-gold my-6 max-w-[10rem]" />
          <p className="text-cream-100 text-[15px] leading-relaxed font-normal">
            One intelligent platform for hotels and restaurants — from rooms and bookings to menus and orders.
          </p>
        </div>

        <div className="text-cream-100 text-[11px] tracking-widest uppercase font-bold flex items-center gap-3">
          <span className="text-champagne text-base">★★★★★</span>
          <span>4.9 — trusted by 12,400+ discerning diners</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onBackToHome, loginAs = 'user', onSwitchRole, providerType, onBackToChooser }: LoginPageProps) {
  const isProvider = loginAs === 'provider';

  return (
    <div className="min-h-dscreen bg-stone-950 grid md:grid-cols-[1.05fr_1fr] overflow-hidden px-safe pt-safe pb-safe">
      {isProvider
        ? <ProviderLeftPanel onBackToHome={onBackToHome} />
        : <CustomerLeftPanel onBackToHome={onBackToHome} />}

      {/* ======= RIGHT — form panel ======= */}
      <div className="relative bg-app flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md">
          <button
            onClick={onBackToHome}
            className="flex md:hidden items-center gap-2 text-stone-600 hover:text-stone-900 mb-8 text-sm font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          {isProvider
            ? <ServiceProviderLogin onSwitchToUser={onSwitchRole} initialProviderType={providerType} onBackToChooser={onBackToChooser} />
            : <UserLogin onSwitchToRestaurant={onSwitchRole} />}
        </div>
      </div>
    </div>
  );
}
