import React, { useState, useEffect } from 'react';
import { db_listAllActivePromotions, db_getAllRestaurants, type DemoPromotion, type DemoRestaurant } from '../../../demoDb';

// --- Helpers ------------------------------------------------------------------
function formatDiscount(p: DemoPromotion): string {
  if (p.type === 'percent') return `${p.value}% OFF`;
  if (p.type === 'flat') return `$${(p.value / 100).toFixed(0)} OFF`;
  return 'BOGO';
}

function formatDiscountSub(p: DemoPromotion): string {
  if (p.type === 'percent') return `${p.value}% discount`;
  if (p.type === 'flat') return `$${(p.value / 100).toFixed(0)} flat discount`;
  return 'Buy one, get one free';
}

// --- Coupon copy button -------------------------------------------------------
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-cream-50 border border-dashed border-cream-300 rounded-2xl px-4 py-3 w-full hover:bg-cream-100 transition-colors group"
    >
      <span className="font-mono font-bold text-lg text-stone-800 tracking-[0.18em] flex-1 text-left">{code}</span>
      <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${copied ? 'text-emerald-500' : 'text-stone-400 group-hover:text-stone-600'}`}>
        {copied ? 'Copied!' : 'Tap to copy'}
      </span>
    </button>
  );
}

// --- Restaurant Offer Card ----------------------------------------------------
function RestaurantOfferCard({ promo, restaurantName }: { promo: DemoPromotion; restaurantName: string }) {
  return (
    <div className="bg-white border border-cream-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Top band */}
      <div className="bg-forest-900 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-cream-300 text-[10px] font-bold uppercase tracking-widest mb-0.5">Restaurant Offer</p>
          <h3 className="font-lora text-base font-bold text-cream-50 leading-tight">{promo.title}</h3>
        </div>
        <div className="bg-brand-400/20 border border-brand-400/30 rounded-xl px-3 py-2 text-center ml-3 shrink-0">
          <p className="font-lora font-bold text-brand-400 text-lg leading-none">{formatDiscount(promo)}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-3">
        <p className="text-stone-600 text-sm leading-relaxed">{promo.description}</p>

        {/* Valid at label */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valid at</span>
          <span className="bg-forest-900/8 text-forest-900 text-xs font-bold px-3 py-1 rounded-full border border-forest-900/15">
            {restaurantName}
          </span>
        </div>

        {/* Expiry */}
        {promo.validUntil && (
          <p className="text-[11px] text-stone-400">
            Expires {new Date(promo.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Code */}
        {promo.code ? (
          <>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your code</p>
            <CopyCode code={promo.code} />
          </>
        ) : (
          <p className="text-[11px] text-stone-400 italic">No code needed — discount applied automatically at {restaurantName}.</p>
        )}

        <p className="text-[10px] text-stone-400">
          This offer ({formatDiscountSub(promo)}) is only valid when ordering from <span className="font-semibold">{restaurantName}</span>.
        </p>
      </div>
    </div>
  );
}

// --- Liora Offer Card (platform-wide) ----------------------------------------
function LioraOfferCard() {
  return (
    <div className="bg-white border border-cream-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="bg-forest-900 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-cream-300 text-[10px] font-bold uppercase tracking-widest mb-0.5">Liora Offer</p>
          <h3 className="font-lora text-base font-bold text-cream-50 leading-tight">Welcome Gift</h3>
        </div>
        <div className="bg-brand-400/20 border border-brand-400/30 rounded-xl px-3 py-2 text-center ml-3 shrink-0">
          <p className="font-lora font-bold text-brand-400 text-lg leading-none">$5 OFF</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-3">
        <p className="text-stone-600 text-sm leading-relaxed">
          You completed your profile and we noticed. Here's $5 off your next order — valid at any restaurant on Liora. No rush, no deadline.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valid at</span>
          <span className="bg-brand-400/10 text-brand-400 text-xs font-bold px-3 py-1 rounded-full border border-brand-400/20">
            All restaurants
          </span>
        </div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your code</p>
        <CopyCode code="WELCOME5" />
        <p className="text-[10px] text-stone-400">T&amp;C: Minimum order value of $50 required to redeem.</p>
      </div>
    </div>
  );
}

// --- Main Page ----------------------------------------------------------------
export default function OffersPage() {
  const [restaurantPromos, setRestaurantPromos] = useState<DemoPromotion[]>([]);
  const [restaurants, setRestaurants] = useState<DemoRestaurant[]>([]);

  useEffect(() => {
    setRestaurantPromos(db_listAllActivePromotions());
    setRestaurants(db_getAllRestaurants());
  }, []);

  const getRestaurantName = (id: string) =>
    restaurants.find(r => r.id === id)?.name ?? 'This Restaurant';

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-md mx-auto px-4 py-8 space-y-10">

        {/* -- Restaurant Offers -- */}
        <section>
          <div className="mb-4">
            <h2 className="font-lora text-xl font-bold text-stone-800">Restaurant Offers</h2>
            <p className="text-xs text-stone-400 mt-1">Deals from the restaurants you love — use the code when ordering from that specific spot.</p>
          </div>

          {restaurantPromos.length === 0 ? (
            <div className="bg-white border border-cream-200 rounded-3xl px-6 py-10 text-center">
              <p className="text-3xl mb-3">ð  ½️</p>
              <p className="font-semibold text-stone-600 text-sm">No restaurant offers right now</p>
              <p className="text-stone-400 text-xs mt-1">Check back soon — restaurants update their deals regularly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurantPromos.map(p => (
                <RestaurantOfferCard key={p.id} promo={p} restaurantName={getRestaurantName(p.restaurantId)} />
              ))}
            </div>
          )}
        </section>

        {/* -- Liora Offers -- */}
        <section>
          <div className="mb-4">
            <h2 className="font-lora text-xl font-bold text-stone-800">Liora Offers</h2>
            <p className="text-xs text-stone-400 mt-1">Platform-wide perks from Liora — these work at every restaurant we partner with.</p>
          </div>
          <LioraOfferCard />
        </section>

      </div>
    </div>
  );
}


