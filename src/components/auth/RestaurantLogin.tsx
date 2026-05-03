import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { LogoMark } from '../../../components/Logo';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import AccountSwitcher from './AccountSwitcher';

interface RestaurantLoginProps {
  onSwitchToUser?: () => void;
}

type LoginType = 'owner' | 'staff';
type Mode      = 'login' | 'register';

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
  const [ownerMode, setOwnerMode] = useState<Mode>('login');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  const [staffMode, setStaffMode] = useState<Mode>('login');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffCode, setStaffCode] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const inp = "w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all text-[15px]";
  const lbl = "block text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em] mb-2";

  const handleGoogleLogin = async () => {
    if (!auth.signInWithGoogle) return;
    setGoogleLoading(true); setError('');
    try { await auth.signInWithGoogle(); }
    catch (err: any) { setError(err.message || 'Google sign-in failed'); }
    finally { setGoogleLoading(false); }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (ownerMode === 'register') await auth.signUpRestaurantOwner(ownerEmail, ownerPassword, ownerName, restaurantName);
      else                          await auth.signInUser(ownerEmail, ownerPassword);
    } catch (err: any) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (staffMode === 'register') {
        if (!auth.signUpStaff) throw new Error('Staff registration not supported.');
        await auth.signUpStaff(staffEmail, staffPassword, staffName, staffCode);
      } else await auth.signInUser(staffEmail, staffPassword);
    } catch (err: any) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-5 md:hidden">
          <LogoMark className="h-10 w-10" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">Liora</span>
            <span className="text-[8px] font-bold text-stone-800 uppercase tracking-[0.32em] mt-1">For Restaurants</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.28em] mb-3">
          {loginType === 'owner' ? 'Restaurateur access' : 'Service desk access'}
        </p>
        <h1 className="font-display text-4xl font-light text-stone-900 leading-[1.05] tracking-tight">
          {loginType === 'owner'
            ? ownerMode === 'login' ? <>Welcome <em className="italic text-brand-600">back.</em></> : <>Grow your <em className="italic text-brand-600">restaurant.</em></>
            : staffMode === 'login' ? <>Service <em className="italic text-brand-600">Desk.</em></> : <>Join your <em className="italic text-brand-600">team.</em></>
          }
        </h1>
        <p className="text-stone-800 text-sm mt-3 font-light leading-relaxed">
          {loginType === 'owner'
            ? ownerMode === 'login' ? 'Full restaurant dashboard access — orders, menu, marketing, insights.' : 'Join thousands of restaurants orchestrating with Liora.'
            : staffMode === 'login' ? 'Operational view for front-of-house and kitchen staff.' : 'Enter the staff access code from your restaurant owner.'}
        </p>
      </div>

      {/* Login type toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-2xl border border-stone-200 bg-cream-100">
        {([
          { id: 'owner', label: 'Owner',        icon: 'admin_panel_settings' },
          { id: 'staff', label: 'Service Desk', icon: 'support_agent' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => { setLoginType(t.id); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
              loginType === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
            }`}>
            <Icon name={t.icon} size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Owner panel */}
      {loginType === 'owner' && (
        <>
          <div className="flex gap-1 mb-5 p-1 rounded-2xl border border-stone-200 bg-cream-50">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => setOwnerMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
                  ownerMode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
                }`}>
                {m === 'login' ? 'Sign In' : 'Register Restaurant'}
              </button>
            ))}
          </div>

          <div className="card p-7 md:p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-medium">
                <Icon name="x" className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {auth.signInWithGoogle && (
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

            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              {ownerMode === 'register' && (
                <>
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input className={inp} type="text" placeholder="Owner / Manager" value={ownerName}
                      onChange={e => setOwnerName(e.target.value)} required autoComplete="name" />
                  </div>
                  <div>
                    <label className={lbl}>Restaurant Name</label>
                    <input className={inp} type="text" placeholder="e.g. Sakura Blossom" value={restaurantName}
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
                <input className={inp} type="password" placeholder="••••••••" value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)} required
                  autoComplete={ownerMode === 'register' ? 'new-password' : 'current-password'} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-4 !text-sm mt-2 anim-glow">
                {loading ? <Spinner /> : null}
                {loading ? 'Please wait…' : ownerMode === 'login' ? 'Access dashboard →' : 'Create restaurant account'}
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-stone-100"><AccountSwitcher /></div>
          </div>
        </>
      )}

      {/* Staff panel */}
      {loginType === 'staff' && (
        <>
          <div className="flex gap-1 mb-5 p-1 rounded-2xl border border-stone-200 bg-cream-50">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => setStaffMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
                  staffMode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
                }`}>
                {m === 'login' ? 'Staff Sign In' : 'Join via Code'}
              </button>
            ))}
          </div>

          <div className="card p-7 md:p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-medium">
                <Icon name="x" className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              {staffMode === 'register' && (
                <>
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input className={inp} type="text" placeholder="Full name" value={staffName}
                      onChange={e => setStaffName(e.target.value)} required autoComplete="name" />
                  </div>
                  <div>
                    <label className={lbl}>Staff Access Code</label>
                    <input className={inp} type="text" placeholder="6-character code" value={staffCode}
                      onChange={e => setStaffCode(e.target.value.toUpperCase())} required maxLength={8} />
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
                <input className={inp} type="password" placeholder="••••••••" value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)} required
                  autoComplete={staffMode === 'register' ? 'new-password' : 'current-password'} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-4 !text-sm mt-2 anim-glow">
                {loading ? <Spinner /> : null}
                {loading ? 'Please wait…' : staffMode === 'login' ? 'Sign In →' : 'Join restaurant team'}
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-stone-100"><AccountSwitcher /></div>
          </div>
        </>
      )}

      {/* Switch to user */}
      {onSwitchToUser && (
        <p className="text-center text-[12px] text-stone-800 mt-7 font-medium">
          Not a restaurant?{' '}
          <button onClick={onSwitchToUser} className="text-brand-600 font-bold hover:text-brand-700 underline-luxe">
            Member access →
          </button>
        </p>
      )}
    </div>
  );
}
