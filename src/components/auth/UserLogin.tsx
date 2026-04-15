import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import AccountSwitcher from './AccountSwitcher';

interface UserLoginProps {
  onSwitchToRestaurant?: () => void;
}

// Google "G" logo SVG
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
    setError('');
    setMsg('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await auth.signUpUser(email, password, fullName);
        await auth.signInUser(email, password);
      } else if (mode === 'forgot') {
        if (!auth.resetPassword) throw new Error("Password reset not supported");
        await auth.resetPassword(email);
        setMsg("Check your email for a password reset link.");
      } else {
        await auth.signInUser(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!auth.signInWithGoogle) return;
    setError('');
    setMsg('');
    setGoogleLoading(true);
    try {
      await auth.signInWithGoogle();
      // Page will redirect to Google â ” no further action needed
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 transition-all text-sm";
  const lbl = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center shadow">
            <span className="font-display font-bold text-white text-xl">L</span>
          </div>
          <span className="font-display text-2xl font-semibold text-stone-800">Liora</span>
        </div>
        <h1 className="font-display text-3xl font-light text-stone-900 leading-snug">
          {mode === 'login'
            ? <>Welcome <span className="italic">back, foodie</span></>
            : mode === 'forgot'
              ? <>Reset <span className="italic">password</span></>
              : <>Start your <span className="italic">food journey</span></>}
        </h1>
        <p className="text-stone-500 text-sm mt-2">
          {mode === 'login'
            ? 'Sign in to discover, plan and eat smarter.'
            : mode === 'forgot'
              ? "Enter your email and we'll send you a link to reset your password."
              : 'Create your free account and meet your AI dining companion.'}
        </p>
      </div>

      {/* Mode toggle (hide in forgot mode) */}
      {mode !== 'forgot' && (
        <div className="flex gap-0 mb-6 p-1 rounded-xl border border-cream-200 bg-cream-100">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-stone-800 shadow-sm border border-cream-200' : 'text-stone-500 hover:text-stone-700'
                }`}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      )}

      {/* Form card */}
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <Icon name="x" className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {msg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 flex-shrink-0" />
            {msg}
          </div>
        )}

        {/* Google OAuth button â ” shown only when Supabase is configured and not in forgot mode */}
        {auth.signInWithGoogle && mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-cream-200 bg-white hover:bg-cream-50 text-stone-700 font-semibold text-sm transition-all shadow-sm disabled:opacity-60 mb-4"
            >
              {googleLoading ? <Spinner /> : <GoogleIcon />}
              {googleLoading ? 'Redirecting to Googleâ ¦' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-cream-200" />
              <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-cream-200" />
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Password</label>
                {mode === 'login' && auth.resetPassword && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setMsg(''); }} className="text-[10px] font-bold text-brand-400 hover:text-brand-500">
                    Forgot password?
                  </button>
                )}
              </div>
              <input className={inp} type="password" placeholder="â ¢â ¢â ¢â ¢â ¢â ¢â ¢â ¢" value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
            </div>
          )}

          <button type="submit" disabled={loading || (mode === 'forgot' && msg !== '')}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-brand-400 text-white hover:bg-brand-500 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
            {loading ? <Spinner /> : null}
            {loading ? 'Please waitâ ¦' : mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Send Reset Link' : 'Create My Account'}
          </button>
        </form>

        {mode === 'forgot' ? (
          <div className="mt-4 pt-4 border-t border-cream-100 text-center">
            <button onClick={() => { setMode('login'); setError(''); setMsg(''); }} className="text-xs font-bold text-stone-500 hover:text-stone-800">
              â   Back to Sign In
            </button>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-cream-100">
            <AccountSwitcher />
          </div>
        )}
      </div>

      {/* Perks */}
      {mode === 'register' && (
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[['ð ¤ ', 'AI Food Assistant'], ['ð ¥ ', 'Calorie Tracking'], ['ð   ', 'Meal Planner']].map(([emoji, label]) => (
            <div key={label} className="bg-white border border-cream-200 rounded-2xl p-3 shadow-sm">
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Switch to restaurant */}
      {onSwitchToRestaurant && (
        <p className="text-center text-xs text-stone-400 mt-6">
          Are you a restaurant owner?{' '}
          <button onClick={onSwitchToRestaurant} className="text-brand-400 font-semibold hover:underline">
            Restaurant login â ’
          </button>
        </p>
      )}
    </div>
  );
}
