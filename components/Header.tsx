import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../src/auth/useSession';
import { getAuth } from '../src/auth';
import { View } from '../types';
import { Icon } from './Icon';
import { useConversation } from '../store/conversation';
import { LogoMark } from './Logo';
import { useSettings } from '../src/context/SettingsContext';
import { t } from '../src/lib/i18n';
import SettingsPanel from '../src/components/SettingsPanel';

interface HeaderProps {
  setView: (view: View) => void;
  onMenuClick: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setView, onMenuClick, canGoBack = false, onBack, onHomeClick }) => {
  const session = useSession();
  const auth = getAuth();
  const { setSearchQuery } = useConversation();
  const settings = useSettings();
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      setView('restaurants');
      setQuery('');
    }
  };

  const handleLogout = async () => { setShowUserMenu(false); await auth.signOut(); };
  const handleMenuNav = (v: View) => { setShowUserMenu(false); setView(v); };

  return (
    <>
      <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3 bg-app-elev/80 backdrop-blur-xl border-b border-cream-200">
        {/* LEFT — hamburger / back */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-cream-100 text-stone-600 transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          {canGoBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 transition-colors font-semibold text-sm border border-cream-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:block">{t(settings.locale, 'common.back')}</span>
            </button>
          )}

          {/* Mobile-only logo */}
          <button
            onClick={() => (onHomeClick ? onHomeClick() : setView('home'))}
            className="md:hidden flex items-center gap-2 hover:opacity-80 transition-opacity ml-1"
            aria-label="Go to home"
          >
            <LogoMark className="w-7 h-7" />
            <span className="font-display text-base font-semibold text-stone-900 tracking-tight leading-none">Liora</span>
          </button>
        </div>

        {/* CENTRE — search */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <form onSubmit={handleSearch} className="w-full max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon name="search" className="w-4 h-4 text-stone-600" />
            </div>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t(settings.locale, 'common.search')}
              className="w-full py-2.5 pl-10 pr-12 bg-cream-100/80 border border-cream-200 rounded-full text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-stone-600 bg-white/70 rounded-md border border-cream-200">⌘K</kbd>
          </form>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="hidden sm:flex p-2 rounded-xl text-stone-600 hover:bg-cream-100 hover:text-stone-800 transition-colors"
            title={t(settings.locale, 'common.settings')}
          >
            <Icon name="settings" className="w-5 h-5" />
          </button>

          <div className="relative" ref={menuRef}>
            {session ? (
              <>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-cream-100 transition-colors border border-transparent hover:border-cream-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
                    <span className="text-xs font-bold text-white">{(session.user.full_name || session.user.email)[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-stone-700 hidden sm:block font-semibold max-w-[110px] truncate">{(session.user.full_name || session.user.email).split('@')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 card-elev py-2 z-50 overflow-hidden animate-fade-up">
                    <div className="px-4 py-3 border-b border-cream-200 bg-gradient-to-br from-brand-500/8 to-transparent">
                      <p className="text-sm font-bold text-stone-900 truncate">{session.user.full_name || session.user.email}</p>
                      <p className="text-xs text-stone-600 truncate">{session.user.email}</p>
                    </div>
                    <div className="py-1">
                      {[
                        { v: 'profile' as View, i: 'user-circle', l: 'Profile' },
                        { v: 'account' as View, i: 'settings',    l: 'Account' },
                        { v: 'favorites' as View,i: 'heart-solid',l: 'Saved Items' },
                        { v: 'support' as View, i: 'support',     l: 'Support' },
                      ].map(item => (
                        <button key={item.v} onClick={() => handleMenuNav(item.v)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-50 hover:text-stone-900 transition-colors">
                          <Icon name={item.i} className="w-4 h-4 text-stone-600" /> {item.l}
                        </button>
                      ))}
                      <button onClick={() => { setShowUserMenu(false); setShowSettings(true); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-50 hover:text-stone-900 transition-colors sm:hidden">
                        <Icon name="settings" className="w-4 h-4 text-stone-600" /> {t(settings.locale, 'common.settings')}
                      </button>
                    </div>
                    <div className="border-t border-cream-200 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-500/8 transition-colors font-semibold">
                        <Icon name="x" className="w-4 h-4" /> {t(settings.locale, 'common.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setView('account')} className="btn-primary text-sm">{t(settings.locale, 'common.signIn')}</button>
            )}
          </div>
        </div>
      </header>

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};
