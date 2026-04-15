import React, { useState } from 'react';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { useSession } from '../src/auth/useSession';
import { View } from '../types';
import { FeedbackModal } from './FeedbackModal';
import { getAuth } from '../src/auth';

interface SidebarProps {
    view: View;
    setView: (view: View) => void;
    onDemoClick: () => void;
    isSidebarOpen: boolean;
    onClose: () => void;
}

interface NavItemProps {
    icon: string;
    label: string;
    viewName: View;
    currentView: View;
    onClick: (view: View) => void;
    badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, viewName, currentView, onClick, badge }) => {
    const isActive = viewName === currentView;
    return (
        <button
            onClick={() => onClick(viewName)}
            className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 relative group ${
                isActive
                    ? 'bg-brand-400/10 text-brand-400'
                    : 'text-stone-500 hover:bg-cream-100 hover:text-stone-700'
            }`}
        >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />}
            <Icon name={icon} className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            {badge && (
                <span className="bg-brand-400/15 text-brand-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {badge}
                </span>
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, onDemoClick, isSidebarOpen, onClose }) => {
    const session = useSession();
    const auth = getAuth();
    const [showFeedback, setShowFeedback] = useState(false);

    const handleNavItemClick = (viewName: View) => {
        setView(viewName);
        if (window.innerWidth < 768) onClose();
    };

    const handleDemoClick = () => {
        onDemoClick();
        if (window.innerWidth < 768) onClose();
    };

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            await auth.signOut();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative top-0 left-0 z-40 h-full w-64 bg-cream-50 border-r border-cream-200 flex flex-col
                transition-transform duration-300 ease-in-out overflow-hidden
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="flex justify-between items-center px-4 py-5 flex-shrink-0 border-b border-cream-200">
                    <div className="flex items-center gap-2.5">
                        <LogoMark className="w-8 h-8 flex-shrink-0" />
                        <span className="font-display text-base font-semibold text-forest-900 tracking-wide leading-none">Liora</span>
                    </div>
                    <button className="md:hidden p-1.5 rounded-lg hover:bg-cream-100 text-stone-400" onClick={onClose}>
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-grow flex flex-col gap-y-0.5 overflow-y-auto px-3 py-2 w-64 scrollbar-hide">
                    <div className="px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">Discover</div>
                    <NavItem icon="chat" label="Home" viewName="home" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="sparkles" label="AI Concierge" viewName="ai_chat" currentView={view} onClick={handleNavItemClick} badge="Testing" />
                    <NavItem icon="map-pin" label="Restaurants" viewName="restaurants" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="heart" label="Dating" viewName="date_night" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="local_offer" label="Offers & Deals" viewName="offers" currentView={view} onClick={handleNavItemClick} badge="Hot" />

                    <div className="px-3 pt-5 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Orders</div>
                    <NavItem icon="receipt_long" label="My Orders" viewName="orders" currentView={view} onClick={handleNavItemClick} />

                    <div className="px-3 pt-5 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Lifestyle</div>
                    <NavItem icon="scale" label="Fitness" viewName="fitness" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="briefcase" label="Hotels" viewName="hotels" currentView={view} onClick={handleNavItemClick} />

                    <div className="px-3 pt-5 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pro Tools</div>
                    <NavItem icon="user-circle" label="AI Waiter" viewName="ai_waiter" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="star" label="AI Chef" viewName="chef_mode" currentView={view} onClick={handleNavItemClick} />

                    <div className="px-3 pt-5 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">You</div>
                    <NavItem icon="user-circle" label="Profile DNA" viewName="profile" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="settings" label="Account" viewName="account" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="heart-solid" label="Saved Items" viewName="favorites" currentView={view} onClick={handleNavItemClick} />
                    <NavItem icon="support" label="Support" viewName="support" currentView={view} onClick={handleNavItemClick} />

                    <button
                        onClick={() => { setShowFeedback(true); if (window.innerWidth < 768) onClose(); }}
                        className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-stone-500 hover:bg-cream-100 hover:text-stone-700 mt-1"
                    >
                        <Icon name="chat_bubble_outline" className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Feedback</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-red-500 hover:bg-red-50"
                    >
                        <Icon name="arrow-right" className="w-5 h-5 rotate-180" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </nav>

            </aside>

            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </>
    );
};