import React from 'react';
import { Logo } from '../../components/Logo';

interface LandingProps {
    onGoToLogin: () => void;
    onGoToRestaurants: () => void;
    onGetStarted: () => void;
    onGoToRestaurantLogin: () => void;
}

export default function Landing({ onGoToLogin, onGoToRestaurants, onGetStarted, onGoToRestaurantLogin }: LandingProps) {
  return (
    <div className="min-h-screen bg-cream-50 text-stone-900 font-sans overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-cream-50/95 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
            <button onClick={() => {}} className="hover:text-stone-900 transition-colors">Features</button>
            <button onClick={() => {}} className="hover:text-stone-900 transition-colors">Cuisine</button>
            <button onClick={() => {}} className="hover:text-stone-900 transition-colors">Wellness</button>
            <button onClick={onGoToRestaurants} className="hover:text-stone-900 transition-colors">Restaurants</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onGoToRestaurantLogin} className="hidden sm:block text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors px-4 py-2 border border-stone-200 rounded-full">Restaurant Login</button>
            <button onClick={onGoToLogin} className="hidden sm:block text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-4 py-2">Sign In</button>
            <button onClick={onGetStarted} className="btn-gold text-sm px-5 py-2.5 shadow-md hover:shadow-lg">Get Started</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative h-screen min-h-[600px] max-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/75 via-stone-900/35 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end px-10 md:px-16 pb-24 max-w-3xl">
          <span className="tag text-cream-200/70 border-cream-200/30 mb-5 w-fit inline-block">AI Dining &amp; Lifestyle Concierge</span>
          <h1 className="font-display text-5xl md:text-7xl font-light text-white leading-[1.1] mb-6">
            Welcome to your<br />
            <em className="italic font-light text-brand-300">luxury</em> table
          </h1>
          <p className="text-cream-200/80 text-base md:text-lg font-light leading-relaxed max-w-md mb-10">
            Discover extraordinary dining, plan memorable date nights, and nourish your body guided by Liora, your personal AI companion.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={onGetStarted} className="btn-circle-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={onGetStarted} className="text-white font-medium text-sm hover:text-brand-300 transition-colors">Begin Your Journey</button>
          </div>
        </div>
      </section>

      {/* ABOUT / INTRO */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80" alt="Dining" className="w-full h-[460px] object-cover shadow-lg" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-400 rounded-full hidden md:flex items-center justify-center shadow-xl">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg>
            </div>
          </div>
          <div>
            <span className="tag mb-5 inline-block">Welcome to Liora</span>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-snug text-stone-800 mb-6">
              Your charming <em className="italic">dining companion</em>, for every occasion
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-4">
              Whether you seek a quiet corner for a meaningful meal, the perfect first-date restaurant, or a curated wellness plan â ” Liora brings the artistry of a Michelin sommelier to your pocket.
            </p>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              Powered by Google Gemini AI, Liora learns your palate, understands your lifestyle, and becomes smarter with every conversation.
            </p>
            <div className="border-t border-cream-200 pt-5">
              <p className="font-display text-xl italic text-stone-600">â ” Liora, your AI concierge</p>
            </div>
            <button onClick={onGetStarted} className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-stone-700 hover:text-brand-400 transition-colors uppercase tracking-wider">
              <span>Discover Liora</span>
              <span className="btn-circle-gold !w-9 !h-9">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FULL BLEED CTA */}
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/65 to-stone-900/20" />
        <div className="relative z-10 h-full flex flex-col justify-end px-10 md:px-16 pb-16 max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl font-light text-white leading-tight mb-5">
            Every meal is your own<br /><em className="italic">personal sanctuary</em>
          </h2>
          <p className="text-cream-200/70 text-sm leading-relaxed max-w-sm mb-8">
            Liora curates dining moments that fit your mood, health goals, and the occasion â ” because every meal deserves intention.
          </p>
          <button onClick={onGetStarted} className="inline-flex items-center gap-3 text-white font-medium text-sm hover:text-brand-300 transition-colors uppercase tracking-wider">
            <span className="btn-circle-gold !w-9 !h-9">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
            <span>View all features</span>
          </button>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 md:py-28 bg-cream-50">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-light text-stone-800">
              Features <em className="italic text-stone-500">&amp; Experiences</em>
            </h2>
            <button onClick={onGetStarted} className="hidden md:flex items-center gap-3 text-sm font-semibold text-stone-600 hover:text-brand-400 transition-colors uppercase tracking-wider">
              <span>See all</span>
              <span className="btn-circle-gold !w-9 !h-9">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', label: 'Food Discovery', price: 'AI-Powered', tag: null, desc: 'Find the perfect restaurant based on mood, diet, and occasion with real-time AI recommendations.' },
              { img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', label: 'Date Night Planner', price: 'Personalized', tag: 'Popular', desc: 'Complete date night packages â ” venue, conversation starters, and after-dinner plans curated just for you.' },
              { img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', label: 'Wellness & Nutrition', price: 'Science-Based', tag: null, desc: 'Track calories, scan meals, and get personalized nutrition plans that align food with your health goals.' },
              { img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', label: 'AI Chef Studio', price: 'Premium', tag: 'New', desc: 'Get restaurant-quality recipes crafted around ingredients you have at home, with step-by-step guidance.' },
            ].map((f) => (
              <div key={f.label} className="group cursor-pointer" onClick={onGetStarted}>
                <div className="relative overflow-hidden">
                  {f.tag && <span className="absolute top-3 left-3 z-10 tag-gold">{f.tag}</span>}
                  <img src={f.img} alt={f.label} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{f.label}</p>
                    <p className="text-xs text-stone-400">{f.price}</p>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
                </div>
                <div className="h-px bg-cream-200 mt-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-20 bg-cream-100 border-y border-cream-200">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="font-display text-xl md:text-2xl italic text-stone-600 font-light leading-relaxed mb-8">
            "Liora completely changed how I approach dining. It's like having a Michelin-trained friend in your phone who knows exactly what you need before you do."
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="w-8 h-8 rounded-full border border-cream-300 flex items-center justify-center text-stone-400 hover:border-brand-400 hover:text-brand-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <p className="font-semibold text-stone-800 text-sm">Sarah Chen</p>
              <p className="text-xs text-stone-400 flex items-center justify-center gap-1 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C8891A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Trustpilot â ” 5 stars
              </p>
            </div>
            <button className="w-8 h-8 rounded-full border border-cream-300 flex items-center justify-center text-stone-400 hover:border-brand-400 hover:text-brand-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* RESTAURANT / DARK SECTION */}
      <section className="section-forest py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-brand-400/40">
                <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80" alt="Food" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-light text-white leading-snug italic">
                Taste cuisines from<br />all over the world
              </h2>
            </div>
            <button onClick={onGetStarted} className="inline-flex items-center gap-3 text-sm font-semibold text-cream-200 hover:text-brand-300 transition-colors uppercase tracking-wider shrink-0">
              <span>Explore cuisines</span>
              <span className="btn-circle-gold !w-9 !h-9">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          </div>
          {[
            { cat: 'Discover', item: 'AI Restaurant Finder', desc: 'Instant matches by mood, diet &amp; distance' },
            { cat: 'Date Night', item: 'Romantic Venue Curation', desc: 'Hand-picked ambiance for every stage' },
            { cat: 'Wellness', item: 'Nutrition &amp; Calorie AI', desc: 'Science-backed food analysis in seconds' },
            { cat: 'Pro Tools', item: 'AI Waiter &amp; Chef Mode', desc: 'Personal culinary guidance on demand' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-5 border-t border-cream-200 group cursor-pointer hover:opacity-80 transition-opacity" onClick={onGetStarted}>
              <div>
                <p className="text-xs text-brand-300 font-semibold uppercase tracking-widest mb-0.5" dangerouslySetInnerHTML={{ __html: row.cat }} />
                <p className="text-white font-medium">{row.item}</p>
                <p className="text-cream-200/50 text-sm" dangerouslySetInnerHTML={{ __html: row.desc }} />
              </div>
              <span className="btn-circle-gold opacity-0 group-hover:opacity-100 transition-opacity !w-9 !h-9 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="section-forest border-t border-cream-200 py-14">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cream-200/40 mb-4">Contact</p>
              {['Liora AI', 'Available worldwide', 'support@liora.ai'].map(l => (
                <p key={l} className="text-cream-200/70 text-sm mb-1">{l}</p>
              ))}
            </div>
            <div className="flex flex-col items-center pt-2">
              <div className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center mb-2">
                <span className="font-display font-bold text-white text-lg">L</span>
              </div>
              <p className="font-display text-sm text-white tracking-[0.3em] uppercase">LIORA</p>
              <p className="text-cream-200/40 text-xs tracking-wider mt-1">since 2024</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cream-200/40 mb-4">Links</p>
              {['Features', 'For Restaurants', 'Privacy Policy', 'Contact Us'].map(l => (
                <p key={l} className="text-cream-200/70 text-sm mb-1.5 hover:text-white cursor-pointer transition-colors">{l}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cream-200/40 mb-4">Get started</p>
              <button onClick={onGetStarted} className="btn-gold text-sm px-5 py-2.5 w-full text-center mb-3 block">Start for Free</button>
              <button onClick={onGoToRestaurants} className="text-sm px-5 py-2.5 w-full text-center block border border-cream-200/20 text-cream-200/60 rounded-full hover:border-cream-200/40 hover:text-cream-200 transition-colors">For Restaurants</button>
            </div>
          </div>
          <div className="border-t border-cream-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-5">
              {['Instagram', 'Twitter', 'LinkedIn'].map(s => (
                <span key={s} className="text-xs text-cream-200/40 hover:text-cream-100 cursor-pointer transition-colors">{s}</span>
              ))}
            </div>
            <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})} className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center hover:bg-brand-500 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <p className="text-xs text-cream-200/30">Â© 2025 Liora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}