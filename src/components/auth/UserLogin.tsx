import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { LogoMark } from '../../../components/Logo';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import AccountSwitcher from './AccountSwitcher';
import DemoAccountsPanel from './DemoAccountsPanel';

interface UserLoginProps {
  onSwitchToRestaurant?: () => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export default function UserLogin({ onSwitchToRestaurant }: UserLoginProps) {
  const auth = getAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      if (mode === 'register')      await auth.signUpUser(email, password, fullName);
      else if (mode === 'forgot') {
        if (!auth.resetPassword) throw new Error("Password reset not supported");
        await auth.resetPassword(email);
        setMsg("Check your email for a password reset link.");
      } else                         await auth.signInUser(email, password);
    } catch (err: any) { setError(err.message || 'Something went wrong'); }
    finally             { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!auth.signInWithGoogle) return;
    setError(''); setMsg(''); setGoogleLoading(true);
    try { await auth.signInWithGoogle(); }
    catch (err: any) { setError(err.message || 'Google sign-in failed'); setGoogleLoading(false); }
  };

  const inp = "w-full px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all text-[15px]";
  const lbl = "block text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em] mb-2";

  return (
    <div className="w-full">
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6 md:hidden">
          <LogoMark className="h-10 w-10" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-semibold text-stone-900 tracking-tight">Liora</span>
            <span className="text-[8px] font-bold text-stone-800 uppercase tracking-[0.32em] mt-1">Maison de cuisine</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.28em] mb-3">
          {mode === 'login' ? 'Members access' : mode === 'forgot' ? 'Account recovery' : 'New membership'}
        </p>
        <h1 className="font-display text-4xl font-light text-stone-900 leading-[1.05] tracking-tight">
          {mode === 'login'  && <>Welcome <em className="italic text-brand-600">back.</em></>}
          {mode === 'forgot' && <>Reset your <em className="italic text-brand-600">password.</em></>}
          {mode === 'register' && <>Begin your <em className="italic text-brand-600">journey.</em></>}
        </h1>
        <p className="text-stone-800 text-sm mt-3 font-light leading-relaxed">
          {mode === 'login'    && 'Sign in to continue your curated dining journey.'}
          {mode === 'forgot'   && 'Enter your email and we’ll send you a secure reset link.'}
          {mode === 'register' && 'Create your private account and meet your AI concierge.'}
        </p>
      </div>

      {/* Mode toggle */}
      {mode !== 'forgot' && (
        <div className="flex gap-1 mb-6 p-1 rounded-2xl border border-stone-200 bg-cream-100">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all tracking-wide ${
                mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-800 hover:text-stone-800'
              }`}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      )}

      {/* Form card */}
      <div className="card p-7 md:p-8">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-medium">
            <Icon name="x" className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {msg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 font-medium">
            <Icon name="check" className="w-4 h-4 flex-shrink-0" />{msg}
          </div>
        )}

        {auth.signInWithGoogle && mode !== 'forgot' && (
          <>
            <button type="button" onClick={handleGoogle} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-400 text-stone-800 font-semibold text-[14px] transition-all disabled:opacity-60 mb-5 shadow-sm hover:shadow">
              {googleLoading ? <Spinner /> : <GoogleIcon />}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
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
            <div>
              <label className={lbl}>Full Name</label>
              <input className={inp} type="text" placeholder="Your name" value={fullName}
                onChange={e => setFullName(e.target.value)} required autoComplete="name" />
            </div>
          )}
          <div>
            <label className={lbl}>Email</label>
            <input className={inp} type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-[0.2em]">Password</label>
                {mode === 'login' && auth.resetPassword && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setMsg(''); }}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider">
                    Forgot?
                  </button>
                )}
              </div>
              <input className={inp} type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
            </div>
          )}

          <button type="submit" disabled={loading || (mode === 'forgot' && msg !== '')}
            className="btn-primary w-full !py-4 !text-sm mt-2 anim-glow">
            {loading ? <Spinner /> : null}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Send Reset Link' : 'Create my account'}
          </button>
        </form>

        {mode === 'forgot' ? (
          <div className="mt-5 pt-5 border-t border-stone-100 text-center">
            <button onClick={() => { setMode('login'); setError(''); setMsg(''); }}
              className="text-[11px] font-bold text-stone-800 hover:text-stone-900 uppercase tracking-widest underline-luxe">
              ← Back to sign in
            </button>
          </div>
        ) : (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <AccountSwitcher />
          </div>
        )}

        {mode === 'login' && <DemoAccountsPanel kind="user" />}
      </div>

      {/* Switch to restaurant */}
      {onSwitchToRestaurant && (
        <p className="text-center text-[12px] text-stone-800 mt-7 font-medium">
          Are you a restaurant owner?{' '}
          <button onClick={onSwitchToRestaurant} className="text-brand-600 font-bold hover:text-brand-700 underline-luxe">
            Restaurant access →
          </button>
        </p>
      )}
    </div>
  );
}
