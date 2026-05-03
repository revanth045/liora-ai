import React, { useState } from 'react';
import { getAuth } from '../../auth';
import { getDemoAccountsFor, type DemoAccount } from '../../auth/demoSeed';
import { toast } from '../../lib/toast';

interface Props {
  kind: 'user' | 'hotel' | 'restaurant';
}

const ROLE_LABEL: Record<Props['kind'], string> = {
  user: 'guest',
  hotel: 'hotel',
  restaurant: 'restaurant',
};

export default function DemoAccountsPanel({ kind }: Props) {
  const auth = getAuth();
  const accounts = getDemoAccountsFor(kind);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  if (!accounts.length) return null;

  const signIn = async (acc: DemoAccount) => {
    if (busyEmail) return;
    setBusyEmail(acc.email);
    try {
      await auth.signInUser(acc.email, acc.password);
    } catch (e: any) {
      toast.error(e?.message || 'Could not sign in');
      setBusyEmail(null);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-600">
          Try a {ROLE_LABEL[kind]} demo
        </span>
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
          one tap
        </span>
      </div>
      <div className="grid gap-2">
        {accounts.map((acc) => (
          <button
            key={acc.email}
            type="button"
            disabled={!!busyEmail}
            onClick={() => signIn(acc)}
            className="text-left p-3 rounded-xl bg-white border border-stone-200 hover:border-brand-400 hover:bg-brand-50/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {acc.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 text-sm leading-tight truncate">{acc.name}</p>
              <p className="text-[11px] text-stone-600 leading-tight truncate">{acc.tagline}</p>
            </div>
            <span className="text-[10px] font-bold text-stone-500 group-hover:text-brand-600 uppercase tracking-wider flex-shrink-0">
              {busyEmail === acc.email ? '…' : 'Enter'}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-stone-500 leading-snug">
        Demo data is local to this browser. Each account has its own seeded
        history so you can explore every console without mixing signals.
      </p>
    </div>
  );
}
