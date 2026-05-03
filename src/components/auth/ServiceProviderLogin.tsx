import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { LogoMark } from '../../../components/Logo';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import AccountSwitcher from './AccountSwitcher';
import DemoAccountsPanel from './DemoAccountsPanel';

interface ServiceProviderLoginProps {
  onSwitchToUser?: () => void;
  /** When provided, the chooser screen is skipped and the form for this type is shown directly. */
  initialProviderType?: 'hotel' | 'restaurant';
  /** Called when the user wants to go back to the chooser (only used when initialProviderType is set). */
  onBackToChooser?: () => void;
}

type ProviderType = 'hotel' | 'restaurant';
type LoginType    = 'owner' | 'staff' | 'frontdesk';
type Mode         = 'login' | 'register';


const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export default function ServiceProviderLogin({ onSwitchToUser, initialProviderType, onBackToChooser }: ServiceProviderLoginProps) {
  const auth = getAuth();

  // null = chooser screen; otherwise the selected provider type
  const [providerType, setProviderType] = useState<ProviderType | null>(initialProviderType ?? null);
  const [loginType, setLoginType] = useState<LoginType>('owner');
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [frontDeskCode, setFrontDeskCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const inp = "w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all text-[15px]";
  const lbl = "block text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em] mb-2";

  const isHotel = providerType === 'hotel';

  const handleGoogleLogin = async () => {
    if (!auth.signInWithGoogle) return;
    setGoogleLoading(true); setError('');
    try { await auth.signInWithGoogle(); }
    catch (err: any) { setError(err.message || 'Google sign-in failed'); }
    finally { setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (loginType === 'staff') {
        if (mode === 'register') {
          if (!auth.signUpStaff) throw new Error('Staff registration not supported.');
          await auth.signUpStaff(email, password, ownerName, staffCode);
        } else {
          await auth.signInUser(email, password);
        }
      } else if (loginType === 'frontdesk') {
        if (mode === 'register') {
          if (!auth.signUpFrontDesk) throw new Error('Front-desk registration not supported.');
          await auth.signUpFrontDesk(email, password, ownerName, frontDeskCode);
        } else {
          await auth.signInUser(email, password);
        }
      } else {
        if (mode === 'register') {
          if (isHotel) {
            if (!auth.signUpHotelOwner) throw new Error('Hotel signup not supported.');
            await auth.signUpHotelOwner(email, password, ownerName, businessName);
          } else {
            await auth.signUpRestaurantOwner(email, password, ownerName, businessName);
          }
        } else {
          await auth.signInUser(email, password);
        }
      }
    } catch (err: any) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  // ============ Type chooser ============
  if (!providerType) {
    return (
      <div className="w-full">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-5 md:hidden">
            <LogoMark className="h-10 w-10" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">Liora</span>
              <span className="text-[8px] font-bold text-stone-800 uppercase tracking-[0.32em] mt-1">For Service Providers</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.28em] mb-3">Service provider access</p>
          <h1 className="font-display text-4xl font-light text-stone-900 leading-[1.05] tracking-tight">
            What are you <em className="italic text-brand-600">running?</em>
          </h1>
          <p className="text-stone-800 text-sm mt-3 font-light leading-relaxed">
            Tell us a little about your business so we can route you to the right console.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setProviderType('hotel'); setError(''); }}
            className="group relative card p-7 text-left lift-on-hover overflow-hidden border-2 border-transparent hover:border-brand-500 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 ring-1 ring-white/40 shadow-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <span className="absolute inset-x-1 top-1 h-3 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                <Icon name="hotel" size={26} className="text-white drop-shadow-sm relative" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-stone-900 tracking-tight mb-1">Hotel</h3>
              <p className="text-stone-700 text-[13px] leading-relaxed font-medium">
                Rooms, bookings, pricing, add-ons, reviews and analytics — built for resorts, lodges and boutique hotels.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-sky-700 uppercase tracking-widest group-hover:text-indigo-700 transition-colors">
                Continue <Icon name="arrow_forward" size={12} />
              </span>
            </div>
          </button>

          <button
            onClick={() => { setProviderType('restaurant'); setError(''); }}
            className="group relative card p-7 text-left lift-on-hover overflow-hidden border-2 border-transparent hover:border-brand-500 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 ring-1 ring-white/40 shadow-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <span className="absolute inset-x-1 top-1 h-3 rounded-t-2xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
                <Icon name="plate_fork" size={26} className="text-white drop-shadow-sm relative" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-stone-900 tracking-tight mb-1">Restaurant</h3>
              <p className="text-stone-700 text-[13px] leading-relaxed font-medium">
                Menu, orders, kitchen, reservations and marketing — the full restaurant operating system.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-amber-700 uppercase tracking-widest group-hover:text-orange-700 transition-colors">
                Continue <Icon name="arrow_forward" size={12} />
              </span>
            </div>
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-stone-100"><AccountSwitcher /></div>

        {onSwitchToUser && (
          <p className="text-center text-[12px] text-stone-800 mt-7 font-medium">
            Not a service provider?{' '}
            <button onClick={onSwitchToUser} className="text-brand-600 font-bold hover:text-brand-700 underline-luxe">
              Member access →
            </button>
          </p>
        )}
      </div>
    );
  }

  // ============ Login form (after chooser) ============
  return (
    <div className="w-full">
      {/* Back to chooser */}
      <button
        onClick={() => {
          if (onBackToChooser) { onBackToChooser(); return; }
          setProviderType(null); setError(''); setLoginType('owner'); setMode('login');
        }}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-700 hover:text-brand-600 uppercase tracking-widest mb-5 transition-colors"
      >
        <Icon name="arrow_back" size={12} /> Change provider type
      </button>

      <div className="mb-7">
        <div className="flex items-center gap-3 mb-5 md:hidden">
          <LogoMark className="h-10 w-10" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">Liora</span>
            <span className="text-[8px] font-bold text-stone-800 uppercase tracking-[0.32em] mt-1">
              For {isHotel ? 'Hotels' : 'Restaurants'}
            </span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.28em] mb-3">
          {isHotel ? 'Hotelier access' : 'Restaurateur access'}
        </p>
        <h1 className="font-display text-4xl font-light text-stone-900 leading-[1.05] tracking-tight">
          {mode === 'login'
            ? <>Welcome <em className="italic text-brand-600">back.</em></>
            : isHotel
              ? <>Grow your <em className="italic text-brand-600">hotel.</em></>
              : <>Grow your <em className="italic text-brand-600">restaurant.</em></>}
        </h1>
        <p className="text-stone-800 text-sm mt-3 font-light leading-relaxed">
          {isHotel
            ? mode === 'login' ? 'Full hotel dashboard — rooms, bookings, pricing, reviews, analytics.' : 'Onboard your property and start taking bookings in minutes.'
            : mode === 'login' ? 'Full restaurant dashboard access — orders, menu, marketing, insights.' : 'Join thousands of restaurants orchestrating with Liora.'}
        </p>
      </div>

      {/* Owner / Staff (restaurants) or Owner / Front Desk (hotels) toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl border border-stone-200 bg-cream-100">
        {(isHotel
          ? ([
              { id: 'owner',     label: 'Owner',      icon: 'admin_panel_settings' },
              { id: 'frontdesk', label: 'Front Desk', icon: 'concierge_bell' },
            ] as const)
          : ([
              { id: 'owner', label: 'Owner',        icon: 'admin_panel_settings' },
              { id: 'staff', label: 'Service Desk', icon: 'support_agent' },
            ] as const)
        ).map(t => (
          <button key={t.id} onClick={() => { setLoginType(t.id as LoginType); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
              loginType === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
            }`}>
            <Icon name={t.icon} size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Login / register toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl border border-stone-200 bg-cream-50">
        {(['login', 'register'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
              mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
            }`}>
            {m === 'login'
              ? loginType === 'staff' ? 'Staff Sign In'
              : loginType === 'frontdesk' ? 'Front Desk Sign In'
              : 'Sign In'
              : loginType === 'staff' || loginType === 'frontdesk'
              ? 'Join via Code'
              : isHotel ? 'Register Hotel' : 'Register Restaurant'}
          </button>
        ))}
      </div>

      <div className="card p-7 md:p-8">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-medium">
            <Icon name="x" className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {auth.signInWithGoogle && loginType === 'owner' && (
          <>
            <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-400 text-stone-800 font-semibold text-[14px] transition-all disabled:opacity-60 mb-5 shadow-sm hover:shadow">
              {googleLoading ? <Spinner /> : <GoogleIcon />}
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-[10px] text-stone-800 font-bold uppercase tracking-[0.25em]">or with email</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className={lbl}>Your Name</label>
                <input className={inp} type="text" placeholder={loginType === 'staff' ? 'Full name' : 'Owner / Manager'} value={ownerName}
                  onChange={e => setOwnerName(e.target.value)} required autoComplete="name" />
              </div>
              {loginType === 'owner' && (
                <div>
                  <label className={lbl}>{isHotel ? 'Hotel Name' : 'Restaurant Name'}</label>
                  <input className={inp} type="text" placeholder={isHotel ? 'e.g. Liora Grand Resort' : 'e.g. Sakura Blossom'} value={businessName}
                    onChange={e => setBusinessName(e.target.value)} required />
                </div>
              )}
              {loginType === 'staff' && (
                <div>
                  <label className={lbl}>Staff Access Code</label>
                  <input className={inp} type="text" placeholder="6-character code" value={staffCode}
                    onChange={e => setStaffCode(e.target.value.toUpperCase())} required maxLength={8} />
                </div>
              )}
              {loginType === 'frontdesk' && (
                <div>
                  <label className={lbl}>Front Desk Access Code</label>
                  <input className={inp} type="text" placeholder="e.g. FD-7K3X9P" value={frontDeskCode}
                    onChange={e => setFrontDeskCode(e.target.value.toUpperCase())} required maxLength={12} />
                  <p className="text-[11px] text-stone-500 mt-1.5">Ask your hotel owner for the code shown on their Hotel Profile.</p>
                </div>
              )}
            </>
          )}
          <div>
            <label className={lbl}>{(loginType === 'staff' || loginType === 'frontdesk') ? 'Email' : 'Business Email'}</label>
            <input className={inp} type="email" placeholder={isHotel ? 'owner@yourhotel.com' : 'owner@myrestaurant.com'} value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className={lbl}>Password</label>
            <input className={inp} type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-4 !text-sm mt-2 anim-glow">
            {loading ? <Spinner /> : null}
            {loading ? 'Please wait…'
              : mode === 'login' ? 'Access dashboard →'
              : loginType === 'staff' ? 'Join team'
              : loginType === 'frontdesk' ? 'Join front desk'
              : isHotel ? 'Create hotel account' : 'Create restaurant account'}
          </button>
        </form>
        <div className="mt-5 pt-5 border-t border-stone-100"><AccountSwitcher /></div>
        {mode === 'login' && loginType === 'owner' && (
          <DemoAccountsPanel kind={isHotel ? 'hotel' : 'restaurant'} />
        )}
      </div>

      {onSwitchToUser && (
        <p className="text-center text-[12px] text-stone-800 mt-7 font-medium">
          Not a service provider?{' '}
          <button onClick={onSwitchToUser} className="text-brand-600 font-bold hover:text-brand-700 underline-luxe">
            Member access →
          </button>
        </p>
      )}
    </div>
  );
}
