import React, { useState } from 'react';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { useSession } from '../src/auth/useSession';
import { View } from '../types';
import { FeedbackModal } from './FeedbackModal';
import { getAuth } from '../src/auth';
import { useSettings } from '../src/context/SettingsContext';
import { t } from '../src/lib/i18n';
import SettingsPanel from '../src/components/SettingsPanel';

interface SidebarProps {
    view: View;
    setView: (view: View) => void;
    onDemoClick: () => void;
    isSidebarOpen: boolean;
    onClose: () => void;
}

type NavTint = 'amber' | 'rose' | 'violet' | 'emerald' | 'sky' | 'fuchsia' | 'orange' | 'indigo' | 'teal' | 'pink' | 'stone';

interface NavItemProps {
    icon: string;
    label: string;
    viewName: View;
    currentView: View;
    onClick: (view: View) => void;
    badge?: string;
    collapsed?: boolean;
    tint?: NavTint;
}

// Premium 3D icon pill — gradient bg, top highlight ring, soft drop shadow.
// Static class map so Tailwind keeps every variant in the build.
const TINT_ACTIVE: Record<NavTint, string> = {
    amber:    'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 ring-amber-200/70 shadow-amber-500/40',
    rose:     'bg-gradient-to-br from-rose-300 via-rose-400 to-rose-600 ring-rose-200/70 shadow-rose-500/40',
    violet:   'bg-gradient-to-br from-violet-300 via-violet-500 to-violet-700 ring-violet-200/70 shadow-violet-500/40',
    emerald:  'bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-700 ring-emerald-200/70 shadow-emerald-500/40',
    sky:      'bg-gradient-to-br from-sky-300 via-sky-500 to-sky-700 ring-sky-200/70 shadow-sky-500/40',
    fuchsia:  'bg-gradient-to-br from-fuchsia-300 via-fuchsia-500 to-fuchsia-700 ring-fuchsia-200/70 shadow-fuchsia-500/40',
    orange:   'bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 ring-orange-200/70 shadow-orange-500/40',
    indigo:   'bg-gradient-to-br from-indigo-300 via-indigo-500 to-indigo-700 ring-indigo-200/70 shadow-indigo-500/40',
    teal:     'bg-gradient-to-br from-teal-300 via-teal-500 to-teal-700 ring-teal-200/70 shadow-teal-500/40',
    pink:     'bg-gradient-to-br from-pink-300 via-pink-500 to-pink-700 ring-pink-200/70 shadow-pink-500/40',
    stone:    'bg-gradient-to-br from-stone-400 via-stone-600 to-stone-800 ring-stone-200/60 shadow-stone-500/40',
};
const TINT_IDLE: Record<NavTint, string> = {
    amber:    'bg-gradient-to-br from-amber-50 to-amber-100 group-hover:from-amber-100 group-hover:to-amber-200 text-amber-700',
    rose:     'bg-gradient-to-br from-rose-50 to-rose-100 group-hover:from-rose-100 group-hover:to-rose-200 text-rose-700',
    violet:   'bg-gradient-to-br from-violet-50 to-violet-100 group-hover:from-violet-100 group-hover:to-violet-200 text-violet-700',
    emerald:  'bg-gradient-to-br from-emerald-50 to-emerald-100 group-hover:from-emerald-100 group-hover:to-emerald-200 text-emerald-700',
    sky:      'bg-gradient-to-br from-sky-50 to-sky-100 group-hover:from-sky-100 group-hover:to-sky-200 text-sky-700',
    fuchsia:  'bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 group-hover:from-fuchsia-100 group-hover:to-fuchsia-200 text-fuchsia-700',
    orange:   'bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 text-orange-700',
    indigo:   'bg-gradient-to-br from-indigo-50 to-indigo-100 group-hover:from-indigo-100 group-hover:to-indigo-200 text-indigo-700',
    teal:     'bg-gradient-to-br from-teal-50 to-teal-100 group-hover:from-teal-100 group-hover:to-teal-200 text-teal-700',
    pink:     'bg-gradient-to-br from-pink-50 to-pink-100 group-hover:from-pink-100 group-hover:to-pink-200 text-pink-700',
    stone:    'bg-gradient-to-br from-stone-100 to-stone-200 group-hover:from-stone-200 group-hover:to-stone-300 text-stone-700',
};
const TINT_LABEL: Record<NavTint, string> = {
    amber:    'text-amber-700',
    rose:     'text-rose-700',
    violet:   'text-violet-700',
    emerald:  'text-emerald-700',
    sky:      'text-sky-700',
    fuchsia:  'text-fuchsia-700',
    orange:   'text-orange-700',
    indigo:   'text-indigo-700',
    teal:     'text-teal-700',
    pink:     'text-pink-700',
    stone:    'text-stone-900',
};

const PremiumNavIcon: React.FC<{ icon: string; tint: NavTint; isActive: boolean }> = ({ icon, tint, isActive }) => (
    <span
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
            ${isActive
                ? `${TINT_ACTIVE[tint]} text-white shadow-lg ring-1 scale-[1.04]`
                : `${TINT_IDLE[tint]} shadow-sm border border-white/80`
            }`}
    >
        {/* Inner top highlight — gives the 3D bevelled glass feel */}
        <span className="absolute inset-x-1 top-1 h-1/3 rounded-t-lg bg-gradient-to-b from-white/60 to-white/0 pointer-events-none" />
        <Icon name={icon} className="w-[18px] h-[18px] relative" />
    </span>
);

const NavItem: React.FC<NavItemProps> = ({ icon, label, viewName, currentView, onClick, badge, collapsed, tint = 'stone' }) => {
    const isActive = viewName === currentView;
    return (
        <button
            onClick={() => onClick(viewName)}
            title={collapsed ? label : undefined}
            className={`group relative flex items-center w-full ${collapsed ? 'justify-center px-1.5' : 'gap-3 px-2'} py-1.5 rounded-2xl text-left transition-all duration-200
                ${isActive ? 'bg-white shadow-sm ring-1 ring-stone-200/70' : 'hover:bg-white/60'}
            `}
        >
            <PremiumNavIcon icon={icon} tint={tint} isActive={isActive} />
            {!collapsed && (
                <span className={`flex-1 text-[13px] font-bold tracking-tight ${isActive ? TINT_LABEL[tint] : 'text-stone-700 group-hover:text-stone-900'}`}>
                    {label}
                </span>
            )}
            {!collapsed && badge && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isActive ? `${TINT_ACTIVE[tint]} text-white shadow` : 'bg-stone-200 text-stone-700'}`}>
                    {badge}
                </span>
            )}
            {collapsed && badge && (
                <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${TINT_ACTIVE[tint]} shadow ring-2 ring-cream-50`} />
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, onDemoClick, isSidebarOpen, onClose }) => {
    const session = useSession();
    const auth = getAuth();
    const settings = useSettings();
    const [showFeedback, setShowFeedback] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const collapsed = settings.layout === 'collapsed';
    const widthClass = collapsed ? 'w-[76px]' : 'w-64';

    const handleNavItemClick = (viewName: View) => {
        setView(viewName);
        if (window.innerWidth < 768) onClose();
    };

    const handleLogout = async () => {
        if (window.confirm("Sign out of Liora?")) await auth.signOut();
    };

    const groupCls = `px-3 ${collapsed ? 'pt-4' : 'pt-5'} pb-1.5 text-[10px] font-bold text-stone-600 uppercase tracking-[0.18em]`;

    return (
        <>
            {/* Sidebar */}
            <aside className={`
                fixed md:relative top-0 left-0 z-40 h-full ${widthClass}
                bg-gradient-to-b from-cream-50/85 via-white/75 to-cream-100/85
                backdrop-blur-xl backdrop-saturate-150
                border-r border-stone-200/60
                shadow-[1px_0_0_0_rgba(255,255,255,0.7)_inset,4px_0_24px_-12px_rgba(15,23,42,0.08)]
                flex flex-col
                transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-5 flex-shrink-0 border-b border-stone-200/50`}>
                    <button
                        onClick={() => handleNavItemClick('home')}
                        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
                    >
                        <div className="relative">
                            <LogoMark className="w-9 h-9 flex-shrink-0 drop-shadow-sm" />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-cream-50" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col leading-none">
                                <span className="font-display text-lg font-semibold text-stone-900 tracking-tight">Liora</span>
                                <span className="text-[9px] font-bold text-stone-600 uppercase tracking-[0.2em] mt-0.5">{settings.brand.displayName || 'Concierge'}</span>
                            </div>
                        )}
                    </button>
                    <button className="md:hidden p-1.5 rounded-lg hover:bg-cream-200 text-stone-600" onClick={onClose}>
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-grow flex flex-col gap-y-0.5 overflow-y-auto px-3 py-2 scrollbar-hide">
                    {!collapsed && <div className={groupCls}>{t(settings.locale, 'nav.discover')}</div>}
                    <NavItem icon="home" label="Home" viewName="home" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="amber" />
                    <NavItem icon="sparkle_chat" label="AI Concierge" viewName="ai_chat" currentView={view} onClick={handleNavItemClick} badge="Beta" collapsed={collapsed} tint="violet" />
                    <NavItem icon="plate_fork" label="Restaurants" viewName="restaurants" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="amber" />
                    <NavItem icon="heart" label="Date Night" viewName="date_night" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="rose" />
                    <NavItem icon="deal_tag" label="Offers" viewName="offers" currentView={view} onClick={handleNavItemClick} badge="Hot" collapsed={collapsed} tint="fuchsia" />

                    {!collapsed && <div className={groupCls}>{t(settings.locale, 'nav.orders')}</div>}
                    <NavItem icon="receipt_dot" label="My Orders" viewName="orders" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="orange" />

                    {!collapsed && <div className={groupCls}>{t(settings.locale, 'nav.lifestyle')}</div>}
                    <NavItem icon="fitness_center" label="Fitness" viewName="fitness" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="emerald" />
                    <NavItem icon="hotel" label="Hotels" viewName="hotels" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="indigo" />

                    {!collapsed && <div className={groupCls}>{t(settings.locale, 'nav.proTools')}</div>}
                    <NavItem icon="concierge_bell" label="AI Waiter" viewName="ai_waiter" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="sky" />
                    <NavItem icon="chef_hat" label="AI Chef" viewName="chef_mode" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="teal" />

                    {!collapsed && <div className={groupCls}>{t(settings.locale, 'nav.you')}</div>}
                    <NavItem icon="user-circle" label="Profile" viewName="profile" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="stone" />
                    <NavItem icon="heart-solid" label="Saved" viewName="favorites" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="pink" />
                    <NavItem icon="support" label="Support" viewName="support" currentView={view} onClick={handleNavItemClick} collapsed={collapsed} tint="stone" />
                </nav>

                {/* Footer actions */}
                <div className="p-3 border-t border-stone-200/50 space-y-1 bg-white/30 backdrop-blur-sm">
                    <button
                        onClick={() => handleNavItemClick('landing')}
                        title="Visit Liora homepage"
                        className={`group w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl bg-gradient-to-r from-brand-500/10 to-amber-400/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 hover:from-brand-500/20 hover:to-amber-400/20 transition-all`}
                    >
                        <Icon name="explore" className="w-5 h-5" />
                        {!collapsed && <span className="text-[13px] font-bold tracking-tight">Visit homepage</span>}
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        title={t(settings.locale, 'common.settings')}
                        className={`group w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl text-stone-600 hover:bg-cream-100 hover:text-stone-800 transition-colors`}
                    >
                        <Icon name="settings" className="w-5 h-5" />
                        {!collapsed && <span className="text-[13px] font-semibold">{t(settings.locale, 'common.settings')}</span>}
                    </button>

                    <button
                        onClick={() => { setShowFeedback(true); if (window.innerWidth < 768) onClose(); }}
                        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-2xl text-stone-600 hover:bg-cream-100 hover:text-stone-800 transition-colors`}
                    >
                        <Icon name="chat_bubble_outline" className="w-5 h-5" />
                        {!collapsed && <span className="text-[13px] font-semibold">Feedback</span>}
                    </button>

                    {/* user pill */}
                    {session && !collapsed && (
                        <div className="mt-2 p-3 rounded-2xl bg-white/80 dark:bg-surface-100 border border-stone-200/70 ring-1 ring-white/60 backdrop-blur-md shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-glow">
                                {(session.user.full_name || session.user.email)[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-800 truncate">{session.user.full_name || session.user.email}</p>
                                <button onClick={handleLogout} className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 mt-0.5">
                                    {t(settings.locale, 'common.signOut')}
                                </button>
                            </div>
                        </div>
                    )}
                    {session && collapsed && (
                        <button onClick={handleLogout} title={t(settings.locale, 'common.signOut')} className="w-full flex justify-center py-2.5 rounded-2xl text-stone-600 hover:bg-cream-100 hover:text-stone-800">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xs font-bold">
                                {(session.user.full_name || session.user.email)[0]?.toUpperCase()}
                            </div>
                        </button>
                    )}
                </div>
            </aside>

            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
            <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};
