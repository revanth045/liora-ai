import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../src/auth/useSession';
import { getAuth } from '../src/auth';
import { View } from '../types';
import { Icon } from './Icon';
import { useConversation } from '../store/conversation';
import { Logo, LogoMark } from './Logo';

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
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        setSearchQuery(query.trim());
        setView('nearby');
        setQuery('');
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await auth.signOut();
  };

  const handleMenuNav = (view: View) => {
    setShowUserMenu(false);
    setView(view);
  };

  return (
    <header className="bg-forest-900 px-4 py-3 flex justify-between items-center sticky top-0 z-40 border-b border-white/10 gap-3 shadow-md">
        {/* LEFT — hamburger / back + logo + name */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hamburger — mobile only (sidebar is always visible on desktop) */}
            <button
                className="md:hidden p-2 rounded-xl hover:bg-white/10 text-cream-200 transition-colors flex-shrink-0"
                onClick={onMenuClick}
                aria-label="Open menu"
            >
                <Icon name="menu" className="w-5 h-5" />
            </button>

            {/* Back button — shown when there's history */}
            {canGoBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-400 hover:bg-brand-500 text-white transition-colors font-semibold text-sm shadow-sm"
                    aria-label="Go back"
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:block">Back</span>
                </button>
            )}

            {/* Logo — always visible; onHomeClick resets history stack, plain setView just navigates */}
            <button
                onClick={() => (onHomeClick ? onHomeClick() : setView('home'))}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1 cursor-pointer"
                aria-label="Go to home"
            >
                <LogoMark className="w-8 h-8 flex-shrink-0" />
                <span className="font-display text-base font-semibold text-cream-50 tracking-wide leading-none">Liora</span>
            </button>
        </div>

        {/* CENTRE — search bar (desktop only) */}
        <div className="hidden md:flex flex-1 justify-center px-4">
            <form onSubmit={handleSearch} className="w-full max-w-lg relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="search" className="w-4 h-4 text-cream-300/60" />
                </div>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search restaurants, cuisine…"
                    className="w-full py-2 pl-9 pr-4 bg-white/10 border border-white/15 rounded-xl text-sm text-cream-100 placeholder-cream-300/50 focus:outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/20 transition-all"
                    aria-label="Search restaurants"
                />
            </form>
        </div>

        {/* RIGHT — user menu */}
        <div className="flex-shrink-0 relative" ref={menuRef}>
            {session ? (
                <>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{session.user.email.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-cream-200 hidden sm:block font-medium max-w-[110px] truncate">{session.user.full_name || session.user.email}</span>
                        <Icon name="chevron-down" className={`w-4 h-4 text-cream-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-cream-200 rounded-2xl shadow-2xl shadow-stone-900/20 py-2 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-cream-100 bg-forest-900/5">
                                <p className="text-sm font-semibold text-stone-800 truncate">{session.user.full_name || session.user.email}</p>
                                <p className="text-xs text-stone-400 truncate">{session.user.email}</p>
                            </div>
                            <div className="py-1">
                                <button onClick={() => handleMenuNav('profile')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-cream-50 hover:text-stone-800 transition-colors">
                                    <Icon name="user-circle" className="w-4 h-4 text-stone-400" />
                                    Profile
                                </button>
                                <button onClick={() => handleMenuNav('account')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-cream-50 hover:text-stone-800 transition-colors">
                                    <Icon name="settings" className="w-4 h-4 text-stone-400" />
                                    Account Settings
                                </button>
                                <button onClick={() => handleMenuNav('favorites')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-cream-50 hover:text-stone-800 transition-colors">
                                    <Icon name="heart-solid" className="w-4 h-4 text-stone-400" />
                                    Saved Items
                                </button>
                                <button onClick={() => handleMenuNav('support')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-600 hover:bg-cream-50 hover:text-stone-800 transition-colors">
                                    <Icon name="support" className="w-4 h-4 text-stone-400" />
                                    Help & Support
                                </button>
                            </div>
                            <div className="border-t border-cream-100 pt-1">
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                    <Icon name="x" className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <button
                    onClick={() => setView('account')}
                    className="btn-gold px-5 py-2 text-sm font-semibold"
                >
                    Login
                </button>
            )}
        </div>
    </header>
  );
};