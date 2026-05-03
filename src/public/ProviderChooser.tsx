import React from 'react';
import { LogoMark } from '../../components/Logo';
import { Icon } from '../../components/Icon';

interface ProviderChooserProps {
  onChooseHotel: () => void;
  onChooseRestaurant: () => void;
  onBackToHome: () => void;
  onSwitchToUser: () => void;
}

const BG = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2000&q=85';

export default function ProviderChooser({ onChooseHotel, onChooseRestaurant, onBackToHome, onSwitchToUser }: ProviderChooserProps) {
  return (
    <div className="min-h-dscreen bg-stone-950 text-white relative overflow-hidden">
      {/* photo backdrop */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${BG}')` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950/95 via-stone-950/85 to-stone-950/70" />
      <div className="absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[28rem] h-[28rem] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12 min-h-dscreen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <button onClick={onBackToHome} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <LogoMark className="h-10 w-10" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-display text-xl font-semibold text-white tracking-tight">Liora</span>
              <span className="text-[8px] font-bold text-champagne uppercase tracking-[0.32em] mt-1">For Service Providers</span>
            </div>
          </button>
          <button onClick={onBackToHome} className="text-[12px] font-semibold text-cream-100 hover:text-white inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 hover:border-white/40 backdrop-blur-md transition-all">
            <Icon name="arrow_back" size={12} /> Back to home
          </button>
        </header>

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-champagne mb-4">Service provider access</p>
          <h1 className="font-display text-4xl md:text-6xl font-extralight tracking-tight leading-[1.05] text-shadow-luxe">
            What are you <em className="italic text-champagne">running?</em>
          </h1>
          <p className="text-cream-100 text-sm md:text-base mt-5 font-light leading-relaxed">
            Pick your business below — we'll show you how Liora elevates your operation, then take you straight to your console.
          </p>
        </div>

        {/* Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 max-w-5xl mx-auto w-full">
          {/* HOTEL */}
          <button
            onClick={onChooseHotel}
            className="group relative text-left rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-300/50 hover:bg-white/10 transition-all duration-300 lift-on-hover"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=85')` }} />
              <div className="absolute inset-x-0 top-0 h-[62.5%] bg-gradient-to-b from-transparent via-stone-950/30 to-stone-950/95" />
            </div>
            <div className="absolute top-5 left-5 z-10">
              <div className="w-14 h-14 rounded-2xl ring-1 ring-white/40 shadow-2xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #38bdf8, #4f46e5)' }}>
                <span className="absolute inset-x-1 top-1 h-3 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                <Icon name="hotel" size={26} className="text-white drop-shadow relative" />
              </div>
            </div>
            <div className="p-7 md:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-300 mb-2">For hoteliers</p>
              <h3 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-3">
                I run a <em className="italic text-sky-300">Hotel</em>
              </h3>
              <p className="text-cream-100 text-[14px] leading-relaxed font-light mb-5">
                Rooms, bookings, pricing, add-ons, reviews and revenue analytics — built for resorts, lodges and boutique hotels.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Bookings', 'Room inventory', 'Dynamic pricing', 'Add-ons', 'Reviews', 'Analytics'].map(t => (
                  <span key={t} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-200 border border-sky-300/20">{t}</span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                Continue as Hotel
                <span className="w-9 h-9 rounded-full flex items-center justify-center shadow-glow" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                  <Icon name="arrow_forward" size={14} className="text-white" />
                </span>
              </span>
            </div>
          </button>

          {/* RESTAURANT */}
          <button
            onClick={onChooseRestaurant}
            className="group relative text-left rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-300/50 hover:bg-white/10 transition-all duration-300 lift-on-hover"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=85')` }} />
              <div className="absolute inset-x-0 top-0 h-[62.5%] bg-gradient-to-b from-transparent via-stone-950/30 to-stone-950/95" />
            </div>
            <div className="absolute top-5 left-5 z-10">
              <div className="w-14 h-14 rounded-2xl ring-1 ring-white/40 shadow-2xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
                <span className="absolute inset-x-1 top-1 h-3 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                <Icon name="plate_fork" size={26} className="text-white drop-shadow relative" />
              </div>
            </div>
            <div className="p-7 md:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 mb-2">For restaurateurs</p>
              <h3 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-3">
                I run a <em className="italic text-amber-300">Restaurant</em>
              </h3>
              <p className="text-cream-100 text-[14px] leading-relaxed font-light mb-5">
                Menu, orders, kitchen, reservations and marketing — the full restaurant operating system, designed for venues that refuse to compromise.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Orders', 'Kitchen', 'Menu engine', 'Reservations', 'Loyalty', 'Marketing'].map(t => (
                  <span key={t} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-300/20">{t}</span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all">
                Continue as Restaurant
                <span className="w-9 h-9 rounded-full flex items-center justify-center shadow-glow" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  <Icon name="arrow_forward" size={14} className="text-white" />
                </span>
              </span>
            </div>
          </button>
        </div>

        <div className="text-center mt-10">
          <p className="text-[12px] text-cream-200 font-medium">
            Not a service provider?{' '}
            <button onClick={onSwitchToUser} className="text-champagne font-bold hover:text-amber-200 underline-luxe">
              Member access →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
