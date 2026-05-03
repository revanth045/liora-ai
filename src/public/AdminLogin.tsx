import React, { useState } from 'react';
import { LogoMark } from '../../components/Logo';
import { getAuth } from '../auth';
import { Icon } from '../../components/Icon';

interface Props {
  onBackToHome: () => void;
}

export default function AdminLogin({ onBackToHome }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getAuth();
      if (!auth.signInAdmin) throw new Error('Admin sign-in is not available.');
      await auth.signInAdmin(email.trim(), password);
      // RoleRouter will pick up the admin role and switch portals automatically.
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dscreen bg-stone-950 text-white relative overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=2000&q=85')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-950/95 to-stone-950/80" />
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <button
        onClick={onBackToHome}
        className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 text-[12px] font-semibold text-cream-100 hover:text-white px-4 py-2 rounded-full border border-white/15 hover:border-white/40 backdrop-blur-md transition-all"
      >
        <Icon name="arrow_back" size={12} /> Back to home
      </button>

      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 shadow-2xl mb-5 ring-1 ring-white/20">
            <LogoMark className="w-9 h-9" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-rose-300 mb-3">Restricted access</p>
          <h1 className="font-display text-4xl md:text-5xl font-extralight tracking-tight leading-[1.05] text-shadow-luxe">
            Admin <em className="italic text-amber-300">Console</em>
          </h1>
          <p className="text-cream-100 text-sm mt-3 font-light">
            Authorised personnel only. All actions are audited.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 md:p-9 shadow-2xl space-y-5"
        >
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-cream-200 mb-2">Admin email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition-all"
              placeholder="admin@liora.app"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-cream-200 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20 transition-all"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-200/70 hover:text-white text-[11px] font-semibold uppercase tracking-widest"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 font-bold text-sm tracking-wide shadow-glow hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Verifying…' : 'Enter Console'}
          </button>

          <p className="text-[11px] text-cream-200/40 text-center leading-relaxed pt-2">
            Restricted access · all sign-ins are logged.
          </p>
        </form>
      </div>
    </div>
  );
}
