import React from 'react';
import UserLogin from '../components/auth/UserLogin';
import RestaurantLogin from '../components/auth/RestaurantLogin';

interface LoginPageProps {
  onBackToHome: () => void;
  loginAs?: 'user' | 'restaurant';
  onSwitchRole?: () => void;
}

export default function LoginPage({ onBackToHome, loginAs = 'user', onSwitchRole }: LoginPageProps) {
  const isRestaurant = loginAs === 'restaurant';

  const bgImage = isRestaurant
    ? 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80'
    : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80';

  const tagline = isRestaurant
    ? <>Your restaurant<br />elevated by AI</>
    : <>Your table<br />awaits you</>;

  const subline = isRestaurant
    ? 'Control orders, manage your menu, and grow revenue with AI-powered insights.'
    : 'Discover extraordinary dining, plan perfect date nights, and nourish your body â ” guided by AI.';

  return (
    <div className="min-h-screen bg-cream-50 grid md:grid-cols-2">
      {/* Left â ” decorative panel */}
      <div className="hidden md:block relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }} />
        <div className="absolute inset-0 bg-stone-900/55" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <button onClick={onBackToHome}
            className="flex items-center gap-2 text-cream-200/80 hover:text-white transition-colors text-sm font-medium w-fit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to home
          </button>
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center">
                <span className="font-display font-bold text-white text-lg">L</span>
              </div>
              <span className="font-display text-2xl font-semibold text-white tracking-wide">Liora</span>
              {isRestaurant && (
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em]">for Restaurants</span>
              )}
            </div>
            <h2 className="font-display text-4xl font-light text-white italic leading-snug mb-3">{tagline}</h2>
            <p className="text-cream-200/70 text-sm leading-relaxed max-w-xs">{subline}</p>
          </div>
        </div>
      </div>

      {/* Right â ” form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <button onClick={onBackToHome}
            className="flex md:hidden items-center gap-2 text-stone-500 hover:text-stone-800 mb-6 text-sm font-medium transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          {isRestaurant
            ? <RestaurantLogin onSwitchToUser={onSwitchRole} />
            : <UserLogin onSwitchToRestaurant={onSwitchRole} />}
        </div>
      </div>
    </div>
  );
}
