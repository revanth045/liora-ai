import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import AccountSwitcher from './AccountSwitcher';

interface RestaurantLoginProps {
  onSwitchToUser?: () => void;
}

type LoginType = 'owner' | 'staff';
type OwnerMode = 'login' | 'register';
type StaffMode = 'login' | 'register';

const DEMO_EMAIL = 'demo@liora.restaurant';
const DEMO_PASSWORD = 'demo1234';
const DEMO_OWNER = 'Chef Marco';
const DEMO_RESTAURANT = 'The Golden Fork';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export default function RestaurantLogin({ onSwitchToUser }: RestaurantLoginProps) {
  const auth = getAuth();

  const [loginType, setLoginType] = useState<LoginType>('owner');
  const [ownerMode, setOwnerMode] = useState<OwnerMode>('login');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  const [staffMode, setStaffMode] = useState<StaffMode>('login');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffCode, setStaffCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const inp = "w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm";
  const lbl = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

  const handleGoogleLogin = async () => {
    if (!auth.signInWithGoogle) return;
    setGoogleLoading(true);
    setError('');
    try {
      await auth.signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    try {
      try {
        await auth.signUpRestaurantOwner(DEMO_EMAIL, DEMO_PASSWORD, DEMO_OWNER, DEMO_RESTAURANT);
      } catch {
        // Already registered â ” that's fine
      }
      await auth.signInUser(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (ownerMode === 'register') {
        await auth.signUpRestaurantOwner(ownerEmail, ownerPassword, ownerName, restaurantName);
        await auth.signInUser(ownerEmail, ownerPassword);
      } else {
        await auth.signInUser(ownerEmail, ownerPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (staffMode === 'register') {
        if (!auth.signUpStaff) throw new Error('Staff registration not supported.');
        await auth.signUpStaff(staffEmail, staffPassword, staffName, staffCode);
        await auth.signInUser(staffEmail, staffPassword);
      } else {
        await auth.signInUser(staffEmail, staffPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center shadow">
            <span className="font-display font-bold text-white text-xl">L</span>
          </div>
          <div>
            <span className="font-display text-2xl font-semibold text-stone-800">Liora</span>
            <span className="ml-2 text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">for Restaurants</span>
          </div>
        </div>
        <h1 className="font-display text-3xl font-light text-stone-900 leading-snug">
          {loginType === 'owner'
            ? ownerMode === 'login' ? <>Welcome <span className="italic">back</span></> : <>Grow your <span className="italic">restaurant</span></>
            : staffMode === 'login' ? <>Service <span className="italic">Desk</span> Login</> : <>Join your <span className="italic">team</span></>
          }
        </h1>
        <p className="text-stone-500 text-sm mt-1.5">
          {loginType === 'owner'
            ? ownerMode === 'login' ? 'Full restaurant dashboard access.' : 'Join thousands of restaurants using Liora.'
            : staffMode === 'login' ? 'Operational view for front-of-house staff.' : 'Enter the staff code from your restaurant owner.'}
        </p>
      </div>

      {/* Quick Demo Banner â ” only shown for owner login */}
      {loginType === 'owner' && (
        <button
          onClick={handleDemoLogin}
          disabled={demoLoading}
          className="w-full mb-4 flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 transition-all group shadow-sm"
        >
          {demoLoading ? (
            <Spinner />
          ) : (
            <span className="text-2xl group-hover:scale-110 transition-transform">ð  ½️</span>
          )}
          <div className="text-left">
            <p className="text-sm font-bold text-stone-800">Try the Demo Restaurant</p>
            <p className="text-[11px] text-stone-500">Instant access â ” no signup needed</p>
          </div>
          <Icon name="arrow_forward" size={18} className="ml-auto text-amber-500 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Top-level type toggle */}
      <div className="flex gap-0 mb-5 p-1 rounded-xl border border-cream-200 bg-cream-100">
        {([
          { id: 'owner', label: 'Restaurant Owner', icon: 'admin_panel_settings' },
          { id: 'staff', label: 'Service Desk', icon: 'support_agent' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => { setLoginType(t.id); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              loginType === t.id ? 'bg-white text-stone-800 shadow-sm border border-cream-200' : 'text-stone-500 hover:text-stone-700'
            }`}>
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* â €â € OWNER PANEL â €â € */}
      {loginType === 'owner' && (
        <>
          <div className="flex gap-0 mb-5 p-1 rounded-xl border border-cream-200 bg-cream-50">
            {(['login', 'register'] as OwnerMode[]).map(m => (
              <button key={m} onClick={() => setOwnerMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  ownerMode === m ? 'bg-white text-stone-800 shadow-sm border border-cream-200' : 'text-stone-500 hover:text-stone-700'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register Restaurant'}
              </button>
            ))}
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <Icon name="x" className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {auth.signInWithGoogle && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-cream-200 bg-white hover:bg-cream-50 text-stone-700 font-semibold text-sm transition-all shadow-sm disabled:opacity-60 mb-4"
                >
                  {googleLoading ? <Spinner /> : <GoogleIcon />}
                  {googleLoading ? 'Connectingâ ¦' : 'Continue with Google'}
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-cream-200" />
                  <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-cream-200" />
                </div>
              </>
            )}

            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              {ownerMode === 'register' && (
                <>
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input className={inp} type="text" placeholder="Owner / Manager name" value={ownerName}
                      onChange={e => setOwnerName(e.target.value)} required autoComplete="name" />
                  </div>
                  <div>
                    <label className={lbl}>Restaurant Name</label>
                    <input className={inp} type="text" placeholder="e.g. The Golden Fork" value={restaurantName}
                      onChange={e => setRestaurantName(e.target.value)} required />
                  </div>
                </>
              )}
              <div>
                <label className={lbl}>Business Email</label>
                <input className={inp} type="email" placeholder="owner@myrestaurant.com" value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input className={inp} type="password" placeholder="â ¢â ¢â ¢â ¢â ¢â ¢â ¢â ¢" value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)} required
                  autoComplete={ownerMode === 'register' ? 'new-password' : 'current-password'} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-stone-800 text-white hover:bg-stone-900 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <Spinner /> : null}
                {loading ? 'Please waitâ ¦' : ownerMode === 'login' ? 'Access Dashboard' : 'Create Restaurant Account'}
              </button>
            </form>
            <div className="mt-4 pt-4 border-t border-cream-100">
              <AccountSwitcher />
            </div>
          </div>

          {ownerMode === 'register' && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[['ð   ','AI Analytics'],['ð ¤ ','AI Menu Tools'],['⭐','Table Management']].map(([emoji, label]) => (
                <div key={label} className="bg-white border border-cream-200 rounded-2xl p-3 shadow-sm">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* â €â € SERVICE DESK PANEL â €â € */}
      {loginType === 'staff' && (
        <>
          <div className="flex gap-0 mb-5 p-1 rounded-xl border border-cream-200 bg-cream-50">
            {(['login', 'register'] as StaffMode[]).map(m => (
              <button key={m} onClick={() => setStaffMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  staffMode === m ? 'bg-white text-stone-800 shadow-sm border border-cream-200' : 'text-stone-500 hover:text-stone-700'
                }`}>
                {m === 'login' ? 'Sign In' : 'Join with Code'}
              </button>
            ))}
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <Icon name="x" className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              {staffMode === 'register' && (
                <>
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input className={inp} type="text" placeholder="e.g. Jane Smith" value={staffName}
                      onChange={e => setStaffName(e.target.value)} required autoComplete="name" />
                  </div>
                  <div>
                    <label className={lbl}>Staff Access Code</label>
                    <input className={`${inp} font-mono tracking-widest uppercase`} type="text"
                      placeholder="Ask your owner for code" value={staffCode}
                      onChange={e => setStaffCode(e.target.value.toUpperCase())} required maxLength={10} />
                    <p className="text-[10px] text-stone-400 mt-1 ml-1">
                      Your restaurant owner can find this code in <strong>Venue Settings â ’ Staff Access</strong>.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className={lbl}>Email</label>
                <input className={inp} type="email" placeholder="staff@restaurant.com" value={staffEmail}
                  onChange={e => setStaffEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className={lbl}>Password</label>
                <input className={inp} type="password" placeholder="â ¢â ¢â ¢â ¢â ¢â ¢â ¢â ¢" value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)} required
                  autoComplete={staffMode === 'register' ? 'new-password' : 'current-password'} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-stone-800 text-white hover:bg-stone-900 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <Spinner /> : null}
                {loading ? 'Please waitâ ¦' : staffMode === 'login' ? 'Open Service Desk' : 'Register & Join'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-cream-100">
              <AccountSwitcher />
            </div>
          </div>

          <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <Icon name="info" size={18} className="text-stone-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-stone-500 space-y-1">
                <p className="font-semibold text-stone-700">Service Desk Access</p>
                <p>You will only see order management â ” no financials, inventory, or staff settings.</p>
                <p>First time? Ask your restaurant owner for the <strong>Staff Access Code</strong> and use "Join with Code" above.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {onSwitchToUser && (
        <p className="text-center text-xs text-stone-400 mt-5">
          Looking to dine?{' '}
          <button onClick={onSwitchToUser} className="text-brand-400 font-semibold hover:underline">
            Diner login â ’
          </button>
        </p>
      )}
    </div>
  );
}
